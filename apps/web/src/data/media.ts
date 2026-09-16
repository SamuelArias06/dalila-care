/**
 * Captura y subida de fotos y vídeos.
 *
 * El flujo evita a propósito que los bytes pasen por Apps Script (el cuerpo de
 * un POST está limitado a ~50 MB, en base64, sin reanudación ni progreso):
 *
 *   1. iOS entrega el archivo ya recomprimido a 720p desde `<input capture>`.
 *   2. Se genera un póster pequeño en el navegador, para que la galería cargue
 *      al instante sin descargar ningún vídeo.
 *   3. El Blob se guarda en IndexedDB y la ficha aparece ya como "pendiente".
 *   4. El backend abre una sesión de subida reanudable y el navegador sube los
 *      bytes directo a googleapis.com, por trozos y con progreso.
 *   5. El Blob local sólo se borra cuando el servidor confirma.
 */

import { newId, nowIso, localDateOf } from '@dalila/shared';
import * as db from './db.js';
import { call } from './api.js';
import { save, pendingUploads } from './store.js';

const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB

export interface CaptureResult {
  mediaId: string;
  posterDataUrl: string;
  durationSec: number | null;
}

/** Reduce una imagen y la devuelve como data URL JPEG. */
export async function shrinkImage(file: Blob, maxSide = 1280, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('sin canvas');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL('image/jpeg', quality);
}

/** Extrae un fotograma del vídeo como miniatura, y de paso su duración. */
export async function videoPoster(file: Blob): Promise<{ poster: string; durationSec: number | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    const cleanup = () => URL.revokeObjectURL(url);
    const fail = () => {
      cleanup();
      resolve({ poster: '', durationSec: null });
    };

    const timeout = setTimeout(fail, 8000);

    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? Math.round(video.duration) : null;
      // Un segundo dentro del clip: el primer fotograma suele salir negro.
      video.currentTime = Math.min(1, (video.duration || 2) / 2);

      video.onseeked = () => {
        clearTimeout(timeout);
        try {
          const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(video.videoWidth * scale) || 320;
          canvas.height = Math.round(video.videoHeight * scale) || 180;
          const ctx = canvas.getContext('2d');
          if (!ctx) return fail();
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          cleanup();
          resolve({ poster: canvas.toDataURL('image/jpeg', 0.7), durationSec: duration });
        } catch {
          fail();
        }
      };
    };

    video.onerror = () => {
      clearTimeout(timeout);
      fail();
    };
  });
}

/**
 * Registra el archivo localmente y lo deja en cola. Devuelve enseguida: la
 * ficha ya se ve en la app aunque no haya red.
 */
export async function captureMedia(
  file: File,
  opts: {
    kind: 'video' | 'foto' | 'documento';
    purpose: 'seguimiento' | 'momento' | 'documento';
    category?: string;
    note?: string;
    localDate?: string;
    isFavorite?: boolean;
    linkedEventId?: string;
  },
): Promise<CaptureResult> {
  const mediaId = newId('mda');
  const localDate = opts.localDate ?? localDateOf();

  let poster = '';
  let durationSec: number | null = null;

  try {
    if (opts.kind === 'video') {
      const r = await videoPoster(file);
      poster = r.poster;
      durationSec = r.durationSec;
    } else if (opts.kind === 'foto') {
      poster = await shrinkImage(file, 900, 0.75);
    }
  } catch {
    /* sin miniatura: la app funciona igual, sólo se ve más sosa */
  }

  await db.blobPut({
    mediaId,
    blob: file,
    fileName: file.name || `${opts.kind}.${(file.type.split('/')[1] ?? 'bin')}`,
    mimeType: normalizeMime(file.type, opts.kind),
    createdAt: nowIso(),
    attempts: 0,
  });

  await save(
    'media',
    mediaId,
    {
      kind: opts.kind,
      purpose: opts.purpose,
      category: opts.category ?? '',
      fileName: file.name || `${opts.kind}`,
      mimeType: normalizeMime(file.type, opts.kind),
      sizeBytes: file.size,
      durationSec,
      capturedAt: nowIso(),
      localDate,
      note: opts.note ?? '',
      posterDataUrl: poster,
      uploadState: 'pendiente',
      isFavorite: opts.isFavorite ?? false,
      linkedEventId: opts.linkedEventId ?? '',
    },
    'mda',
  );

  pendingUploads.value = await db.blobCount();
  void processUploadQueue();

  return { mediaId, posterDataUrl: poster, durationSec };
}

function normalizeMime(type: string, kind: string): string {
  const t = (type || '').split(';')[0]!.toLowerCase();
  if (t) return t === 'video/x-m4v' ? 'video/mp4' : t;
  return kind === 'video' ? 'video/mp4' : kind === 'foto' ? 'image/jpeg' : 'application/pdf';
}

// ── Cola de subida ───────────────────────────────────────────────────────────

export const uploadProgress = new Map<string, number>();
let processing = false;

export async function processUploadQueue(): Promise<void> {
  if (processing || !navigator.onLine) return;
  processing = true;
  try {
    const queue = await db.blobAll();
    for (const item of queue) {
      if (item.attempts >= 6) continue;
      try {
        await uploadOne(item);
      } catch (error) {
        item.attempts += 1;
        item.lastError = String((error as Error)?.message ?? error).slice(0, 200);
        await db.blobPut(item);
        await save('media', item.mediaId, {
          uploadState: item.attempts >= 6 ? 'error' : 'pendiente',
          uploadError: item.attempts >= 6 ? 'No pudimos subirlo tras varios intentos.' : '',
        });
      }
    }
  } finally {
    processing = false;
    pendingUploads.value = await db.blobCount();
  }
}

async function uploadOne(item: db.PendingBlob): Promise<void> {
  await save('media', item.mediaId, { uploadState: 'subiendo' });

  const session = await call<{ uploadUrl: string }>('media.createUploadSession', {
    mediaId: item.mediaId,
    fileName: item.fileName,
    mimeType: item.mimeType,
    sizeBytes: item.blob.size,
    kind: item.mimeType.startsWith('video') ? 'video' : item.mimeType.startsWith('image') ? 'foto' : 'documento',
    localDate: localDateOf(item.createdAt),
  });

  const driveFileId = await uploadResumable(session.uploadUrl, item.blob, (pct) => {
    uploadProgress.set(item.mediaId, pct);
  });

  await call('media.confirmUpload', { mediaId: item.mediaId, driveFileId });

  // Sólo ahora se borra el archivo local: hasta que el servidor confirma, el
  // único sitio donde existe es este dispositivo.
  await db.blobDelete(item.mediaId);
  uploadProgress.delete(item.mediaId);
  await save('media', item.mediaId, { uploadState: 'subido', uploadError: '', driveFileId });
}

/** Subida reanudable por trozos, con reintento del trozo que falle. */
async function uploadResumable(
  uploadUrl: string,
  blob: Blob,
  onProgress: (pct: number) => void,
): Promise<string> {
  const total = blob.size;
  let offset = 0;

  while (offset < total) {
    const end = Math.min(offset + CHUNK_SIZE, total);
    const chunk = blob.slice(offset, end);

    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes ${offset}-${end - 1}/${total}`,
      },
      body: chunk,
    });

    if (res.status === 200 || res.status === 201) {
      onProgress(100);
      const body = (await res.json()) as { id?: string };
      if (!body.id) throw new Error('Drive no devolvió el id del archivo');
      return body.id;
    }

    if (res.status === 308) {
      // Continúa: Drive indica hasta dónde recibió.
      const range = res.headers.get('Range');
      const received = range ? Number(range.split('-')[1]) + 1 : end;
      offset = Number.isFinite(received) ? received : end;
      onProgress(Math.round((offset / total) * 100));
      continue;
    }

    throw new Error(`Subida falló con estado ${res.status}`);
  }

  throw new Error('La subida terminó sin confirmación');
}

export function installUploadTriggers(): void {
  window.addEventListener('online', () => void processUploadQueue());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void processUploadQueue();
  });
}

// ── Reproducción privada ─────────────────────────────────────────────────────
//
// Los archivos nunca se hacen públicos. Para verlos se pide un token de corta
// duración y se descarga el contenido a un blob local.

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function contentToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.accessToken;
  const r = await call<{ accessToken: string; expiresAt: string }>('media.getContentToken');
  cachedToken = { accessToken: r.accessToken, expiresAt: Date.parse(r.expiresAt) };
  return r.accessToken;
}

const objectUrls = new Map<string, string>();

export async function mediaObjectUrl(driveFileId: string): Promise<string> {
  const cached = objectUrls.get(driveFileId);
  if (cached) return cached;

  const token = await contentToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('No pudimos abrir el archivo');

  const url = URL.createObjectURL(await res.blob());
  objectUrls.set(driveFileId, url);
  return url;
}

/** Vídeo aún sin subir: se reproduce directamente desde el dispositivo. */
export async function localObjectUrl(mediaId: string): Promise<string | null> {
  const entry = await db.blobGet(mediaId);
  if (!entry) return null;
  const key = `local:${mediaId}`;
  const cached = objectUrls.get(key);
  if (cached) return cached;
  const url = URL.createObjectURL(entry.blob);
  objectUrls.set(key, url);
  return url;
}
