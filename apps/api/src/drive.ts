/**
 * Google Drive vía la API REST v3.
 *
 * No usamos el servicio `DriveApp` de Apps Script a propósito: exige el alcance
 * completo `drive`, que daría acceso a todo el Drive de la cuenta. Con la API
 * REST podemos quedarnos en `drive.file`, que sólo permite tocar los archivos
 * que la propia app ha creado. Si alguna vez se filtrara un token, el resto del
 * Drive queda intacto.
 *
 * Los bytes de los vídeos nunca pasan por Apps Script: el backend abre una
 * sesión de subida reanudable y el navegador sube directamente a googleapis.com.
 */

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

function token(): string {
  return ScriptApp.getOAuthToken();
}

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${token()}` };
}

interface DriveFile {
  id: string;
  name?: string;
  mimeType?: string;
  size?: string;
  parents?: string[];
  createdTime?: string;
}

function request<T>(
  url: string,
  options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {},
): T {
  const res = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    ...options,
    headers: { ...authHeaders(), ...(options.headers ?? {}) },
  });
  const code = res.getResponseCode();
  const body = res.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error(`Drive ${code}: ${body.slice(0, 300)}`);
  }
  return body ? (JSON.parse(body) as T) : ({} as T);
}

export function createFolder(name: string, parentId?: string): string {
  const meta: Record<string, unknown> = { name, mimeType: FOLDER_MIME };
  if (parentId) meta['parents'] = [parentId];
  const file = request<DriveFile>(`${DRIVE_API}/files?fields=id`, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(meta),
  });
  return file.id;
}

/** Busca una carpeta creada por la app; la crea si no existe. Idempotente. */
export function findOrCreateFolder(name: string, parentId?: string): string {
  const safeName = name.replace(/'/g, "\\'");
  const clauses = [
    `name='${safeName}'`,
    `mimeType='${FOLDER_MIME}'`,
    'trashed=false',
    parentId ? `'${parentId}' in parents` : null,
  ].filter(Boolean);

  const q = encodeURIComponent(clauses.join(' and '));
  const found = request<{ files: DriveFile[] }>(`${DRIVE_API}/files?q=${q}&fields=files(id,name)&pageSize=10`);
  if (found.files && found.files.length > 0) return found.files[0]!.id;
  return createFolder(name, parentId);
}

/** Carpeta del mes (`2026-09`) dentro de un padre. Poca profundidad, navegable a mano. */
export function monthFolder(parentId: string, localDate: string): string {
  const ym = localDate.slice(0, 7);
  const cache = CacheService.getScriptCache();
  const key = `folder_${parentId}_${ym}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const id = findOrCreateFolder(ym, parentId);
  cache.put(key, id, 21600);
  return id;
}

export interface ResumableSession {
  uploadUrl: string;
  fileId?: string;
}

/**
 * Abre una sesión de subida reanudable. La URI devuelta es una capacidad de un
 * solo uso para escribir ESE archivo concreto: el navegador puede subir los
 * bytes por trozos sin recibir nunca un token con acceso general a Drive.
 */
export function createResumableSession(
  name: string,
  mimeType: string,
  parentId: string,
  sizeBytes: number,
): ResumableSession {
  const meta = { name, parents: [parentId], mimeType };
  const res = UrlFetchApp.fetch(`${DRIVE_UPLOAD}/files?uploadType=resumable&fields=id`, {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: {
      ...authHeaders(),
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(sizeBytes),
    },
    payload: JSON.stringify(meta),
  });
  const code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error(`Drive resumable ${code}: ${res.getContentText().slice(0, 300)}`);
  }
  const location = res.getHeaders() as Record<string, string>;
  const uploadUrl = location['Location'] ?? location['location'] ?? '';
  if (!uploadUrl) throw new Error('Drive no devolvió la URL de subida');
  return { uploadUrl };
}

/** Sube un archivo pequeño (pósters, fotos ligeras) directamente desde el backend. */
export function uploadSmallFile(
  name: string,
  mimeType: string,
  parentId: string,
  bytes: GoogleAppsScript.Base.Blob,
): string {
  const boundary = '-----dalila' + Utilities.getUuid();
  const meta = JSON.stringify({ name, parents: [parentId], mimeType });
  const payload = Utilities.newBlob(
    Utilities.newBlob(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
    ).getBytes()
      .concat(bytes.getBytes())
      .concat(Utilities.newBlob(`\r\n--${boundary}--`).getBytes()),
  );

  const res = UrlFetchApp.fetch(`${DRIVE_UPLOAD}/files?uploadType=multipart&fields=id`, {
    method: 'post',
    contentType: `multipart/related; boundary=${boundary}`,
    muteHttpExceptions: true,
    headers: authHeaders(),
    payload: payload.getBytes(),
  });
  const code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error(`Drive upload ${code}: ${res.getContentText().slice(0, 300)}`);
  }
  return (JSON.parse(res.getContentText()) as DriveFile).id;
}

export function getFileMeta(fileId: string): DriveFile {
  return request<DriveFile>(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,createdTime`);
}

export function deleteFile(fileId: string): void {
  request(`${DRIVE_API}/files/${encodeURIComponent(fileId)}`, { method: 'delete' });
}

/** Comparte un archivo concreto con un correo. Nunca se comparte la carpeta entera. */
export function shareWithEmail(fileId: string, email: string): string {
  const perm = request<{ id: string }>(
    `${DRIVE_API}/files/${encodeURIComponent(fileId)}/permissions?sendNotificationEmail=false&fields=id`,
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ role: 'reader', type: 'user', emailAddress: email }),
    },
  );
  return perm.id;
}

export function revokePermission(fileId: string, permissionId: string): void {
  request(`${DRIVE_API}/files/${encodeURIComponent(fileId)}/permissions/${encodeURIComponent(permissionId)}`, {
    method: 'delete',
  });
}

/**
 * Token de corta duración para que el navegador descargue el contenido de un
 * archivo. Está limitado al alcance `drive.file`, así que sólo sirve para los
 * archivos creados por esta app.
 */
export function contentAccessToken(): { accessToken: string; expiresAt: string } {
  return {
    accessToken: token(),
    expiresAt: new Date(Date.now() + 50 * 60 * 1000).toISOString(),
  };
}

export function fileContentUrl(fileId: string): string {
  return `${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media`;
}
