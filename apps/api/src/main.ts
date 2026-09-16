/**
 * Punto de entrada del Web App.
 *
 * Es RPC sobre un único POST, no REST. Motivo: Apps Script no responde bien a
 * las peticiones `OPTIONS` de preflight, así que el cliente envía
 * `Content-Type: text/plain` con JSON dentro, que el navegador trata como
 * petición simple. Consecuencia: no podemos usar cabeceras propias y el token
 * viaja en el cuerpo.
 *
 * REGLA DE SEGURIDAD: el despliegue es anónimo, así que **toda** acción salvo
 * `ping` y `auth.redeemInvite` exige un token de dispositivo válido. Si añades
 * una acción nueva, va a `PROTECTED` por defecto: `requireAuth` se ejecuta
 * antes que cualquier handler.
 */

import {
  ERROR_MESSAGES,
  COLLECTION_PREFIX,
  SCHEMA_VERSION,
  emptyData,
  isKnownCollection,
  localDateOf,
  nowIso,
  safeFileName,
  validatePatch,
  ValidationError,
  type ApiErrorCode,
  type ApiRequest,
  type Collection,
  type DalilaData,
  type Mutation,
} from '@dalila/shared';

import { BOOTSTRAP_KEY, BUILD_VERSION, COLLECTION_SHEET, MAX_UPLOAD_BYTES, PROP, SHEETS } from './config.js';
import {
  checkInviteAttempts,
  checkRateLimit,
  createInvite,
  redeemInvite,
  revokeDevice,
  revokeUnusedInvites,
  verifyToken,
  type AuthContext,
} from './auth.js';
import { bootstrap, isConfigured } from './bootstrap.js';
import * as drive from './drive.js';
import {
  appendAudit,
  countRows,
  findById,
  getMeta,
  readAll,
  readSince,
  setMeta,
  softDelete,
  upsert,
} from './sheets.js';

// ── Utilidades de respuesta ──────────────────────────────────────────────────

function json(body: unknown): GoogleAppsScript.Content.TextOutput {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

function ok<T>(data: T): GoogleAppsScript.Content.TextOutput {
  return json({ ok: true, data, serverTime: nowIso() });
}

function err(
  code: ApiErrorCode,
  userMessage?: string,
  extra: { field?: string; errorId?: string } = {},
): GoogleAppsScript.Content.TextOutput {
  return json({
    ok: false,
    error: { code, userMessage: userMessage ?? ERROR_MESSAGES[code], ...extra },
    serverTime: nowIso(),
  });
}

/** Código corto que se le muestra a la usuaria para poder rastrear un fallo. */
function newErrorId(): string {
  return 'E-' + Utilities.getUuid().slice(0, 4).toUpperCase();
}

function props(): GoogleAppsScript.Properties.Properties {
  return PropertiesService.getScriptProperties();
}

// ── doGet ────────────────────────────────────────────────────────────────────

/**
 * Sólo para comprobación de estado y para el arranque inicial. Nunca devuelve
 * datos de Dalila.
 */
function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.Content.TextOutput {
  const params = (e && e.parameter) || {};

  if (params['action'] === 'bootstrap') {
    // La clave se inyecta al compilar y no está en el repositorio. Además, el
    // arranque sólo puede ejecutarse mientras no esté ya configurado.
    if (!BOOTSTRAP_KEY || BOOTSTRAP_KEY.length < 16 || params['key'] !== BOOTSTRAP_KEY) {
      return err('FORBIDDEN', 'No autorizado.');
    }
    try {
      const result = bootstrap();
      // Dos enlaces de un solo uso: uno para el administrador y otro para el
      // iPhone de la cuidadora, para no tener que crear el segundo a mano.
      // invite=1 → ambos enlaces; invite=admin → sólo el de administrador.
      const wanted = String(params['invite'] ?? '');
      const admin = wanted === '1' || wanted === 'admin' ? createInvite('admin', 'arranque inicial') : null;
      const caregiver = wanted === '1' ? createInvite('caregiver', 'iPhone') : null;
      return ok({
        ...result,
        version: BUILD_VERSION,
        inviteCode: admin?.code ?? null,
        caregiverCode: caregiver?.code ?? null,
      });
    } catch (error) {
      const id = newErrorId();
      console.error(`[${id}] bootstrap`, String(error));
      // Esta ruta sólo es accesible con la clave de arranque, así que exponer el
      // detalle técnico aquí no filtra nada a terceros y ahorra horas de diagnóstico.
      return json({
        ok: false,
        error: { code: 'INTERNAL', userMessage: 'No se pudo completar la configuración inicial.', errorId: id },
        detail: String((error as Error)?.stack ?? error).slice(0, 1500),
        serverTime: nowIso(),
      });
    }
  }

  return ok({
    service: 'dalila-care',
    version: BUILD_VERSION,
    configured: isConfigured(),
    schemaVersion: SCHEMA_VERSION,
  });
}

// ── doPost ───────────────────────────────────────────────────────────────────

const PUBLIC_ACTIONS = ['ping', 'auth.redeemInvite'];
const ADMIN_ACTIONS = [
  'auth.listDevices',
  'auth.revokeDevice',
  'auth.createInvite',
  'auth.revokeInvites',
  'admin.diagnostics',
  'admin.backup',
];

function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  const started = Date.now();
  let action = '';
  let auth: AuthContext | null = null;

  try {
    let req: ApiRequest;
    try {
      req = JSON.parse(e?.postData?.contents ?? '{}') as ApiRequest;
    } catch {
      return err('VALIDATION', 'No pudimos leer la petición.');
    }

    action = String(req.action ?? '');
    if (!action) return err('VALIDATION', 'Falta la acción.');

    // 1) Autenticación, antes que nada.
    if (PUBLIC_ACTIONS.indexOf(action) === -1) {
      auth = verifyToken(req.token);
      if (!auth) return err('UNAUTHORIZED');
      if (!checkRateLimit(auth.deviceId)) return err('RATE_LIMIT');
      if (ADMIN_ACTIONS.indexOf(action) !== -1 && auth.role !== 'admin') return err('FORBIDDEN');
    }

    // 2) Configuración lista (salvo ping, que sirve para saberlo).
    if (action !== 'ping' && !isConfigured()) return err('NOT_CONFIGURED');

    const payload = (req.payload ?? {}) as Record<string, unknown>;
    const result = dispatch(action, payload, auth);

    appendAudit({
      at: nowIso(),
      actor: auth?.actor ?? 'anon',
      action,
      result: 'ok',
      durationMs: Date.now() - started,
    });
    return ok(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return err('VALIDATION', error.userMessage, { field: error.field });
    }
    const message = String((error as Error)?.message ?? error);
    if (message.indexOf('NOT_CONFIGURED') !== -1) return err('NOT_CONFIGURED');

    const id = newErrorId();
    // El log técnico nunca incluye el contenido de las notas ni datos personales.
    console.error(`[${id}] ${action}: ${message}`);
    appendAudit({
      at: nowIso(),
      actor: auth?.actor ?? 'anon',
      action,
      result: 'error',
      errorCode: id,
      durationMs: Date.now() - started,
    });
    return err('INTERNAL', undefined, { errorId: id });
  }
}

// ── Enrutado de acciones ─────────────────────────────────────────────────────

function dispatch(action: string, payload: Record<string, unknown>, auth: AuthContext | null): unknown {
  switch (action) {
    case 'ping':
      return { version: BUILD_VERSION, configured: isConfigured(), schemaVersion: SCHEMA_VERSION };

    case 'auth.redeemInvite': {
      if (!checkInviteAttempts()) throw new ValidationError('inviteCode', 'Demasiados intentos. Espera un minuto.');
      if (!isConfigured()) throw new Error('NOT_CONFIGURED');
      const code = String(payload['inviteCode'] ?? '');
      const label = String(payload['deviceLabel'] ?? 'Dispositivo').slice(0, 60);
      const res = redeemInvite(code, label, String(payload['clientNonce'] ?? ''));
      if (!res) {
        throw new ValidationError(
          'inviteCode',
          'Este enlace ya no es válido. Puede que se haya usado o que haya caducado. Pídele a Samuel uno nuevo.',
        );
      }
      const now = nowIso();
      upsert(SHEETS.devices, res.deviceId, {
        id: res.deviceId,
        schemaVersion: SCHEMA_VERSION,
        createdAt: now,
        updatedAt: now,
        createdBy: res.deviceId,
        label,
        role: res.role,
        lastSeenAt: now,
      });
      return { token: res.token, role: res.role, deviceId: res.deviceId, label };
    }

    case 'auth.check': {
      touchDevice(auth!);
      const dog = readAll(SHEETS.dog);
      return {
        role: auth!.role,
        deviceId: auth!.deviceId,
        needsOnboarding: dog.length === 0,
      };
    }

    case 'auth.listDevices':
      return { devices: readAll(SHEETS.devices, true) };

    case 'auth.revokeDevice': {
      const deviceId = String(payload['deviceId'] ?? '');
      if (!deviceId) throw new ValidationError('deviceId', 'Falta el dispositivo.');
      revokeDevice(deviceId);
      softDelete(SHEETS.devices, deviceId, nowIso());
      return { revoked: deviceId };
    }

    case 'auth.revokeInvites':
      return { revoked: revokeUnusedInvites() };

    case 'auth.createInvite': {
      const role = payload['role'] === 'admin' ? 'admin' : 'caregiver';
      const note = String(payload['note'] ?? '').slice(0, 100);
      const { code, expiresAt } = createInvite(role, note);
      return { code, role, expiresAt: new Date(expiresAt).toISOString() };
    }

    case 'data.pull':
      return pull(String(payload['since'] ?? ''));

    case 'data.push':
      return push((payload['mutations'] as Mutation[]) ?? [], auth!);

    case 'media.createUploadSession':
      return createUploadSession(payload, auth!);

    case 'media.confirmUpload':
      return confirmUpload(payload);

    case 'media.getContentToken':
      return drive.contentAccessToken();

    case 'media.share':
      return shareMedia(payload);

    case 'admin.diagnostics':
      return diagnostics();

    case 'admin.backup':
      return runBackup();

    case 'export.all':
      return { data: pull('').data, exportedAt: nowIso() };

    default:
      throw new ValidationError('action', 'Acción desconocida.');
  }
}

function touchDevice(auth: AuthContext): void {
  try {
    const found = findById(SHEETS.devices, auth.deviceId);
    if (found) upsert(SHEETS.devices, auth.deviceId, { lastSeenAt: nowIso() });
  } catch {
    /* no es crítico */
  }
}

// ── Sincronización ───────────────────────────────────────────────────────────

const COLLECTIONS: Collection[] = [
  'diagnoses', 'dailyLogs', 'tasks', 'completions', 'medications', 'medicationVersions',
  'doses', 'foods', 'feedingPlan', 'feedingLogs', 'weights', 'activities', 'media',
  'events', 'questions', 'instructions', 'appointments', 'moments',
];

function pull(since: string): { data: DalilaData; syncedAt: string; full: boolean } {
  const data = emptyData();
  const dogRows = since ? readSince(SHEETS.dog, since) : readAll(SHEETS.dog);
  data.dog = (dogRows[0] as unknown as DalilaData['dog']) ?? null;

  for (const c of COLLECTIONS) {
    const sheetName = COLLECTION_SHEET[c];
    if (!sheetName) continue;
    const rows = since ? readSince(sheetName, since) : readAll(sheetName);
    (data as unknown as Record<string, unknown[]>)[c] = rows;
  }

  return { data, syncedAt: nowIso(), full: !since };
}

/** Límite práctico por celda: Sheets rechaza celdas de más de 50 000 caracteres. */
const MAX_INLINE_POSTER = 45_000;
const TITLE_MAX = 120;

/**
 * Ajustes antes de validar, para no perder un registro entero por un detalle.
 *
 * La regla general es que un campo opcional mal formado se descarta o se
 * reubica en lugar de rechazar la mutación completa: perder el perfil de Dalila
 * porque alguien escribió "32 kg" en el peso sería inaceptable. Los campos
 * esenciales (fechas, referencias, estados) siguen validándose con rigor.
 */
function normalizeForStorage(collection: Collection, entityId: string, input: Record<string, unknown>): Record<string, unknown> {
  const p: Record<string, unknown> = { ...input };

  if (collection === 'dog') {
    const photo = p['photoMediaId'];
    if (photo !== undefined && !/^mda_[0-9A-HJKMNP-TV-Z]{26}$/.test(String(photo ?? ''))) delete p['photoMediaId'];
    for (const f of ['currentWeightKg', 'targetWeightKg']) {
      if (p[f] === undefined || p[f] === null || p[f] === '') continue;
      const n = parseFloat(String(p[f]).replace(',', '.'));
      if (Number.isFinite(n) && n >= 0.3 && n <= 120) p[f] = n;
      else delete p[f];
    }
  }

  // Un título largo (p. ej. un diagnóstico copiado del informe) no se rechaza:
  // se acorta y el texto completo pasa a las notas.
  const titleField = { diagnoses: 'name', medications: 'name', foods: 'name', tasks: 'title' }[collection as string];
  if (titleField && typeof p[titleField] === 'string' && (p[titleField] as string).trim().length > TITLE_MAX) {
    const full = (p[titleField] as string).trim();
    const notesField = 'notes';
    const prev = typeof p[notesField] === 'string' && p[notesField] ? `${p[notesField] as string}\n\n` : '';
    p[notesField] = (prev + full).slice(0, 4000);
    p[titleField] = `${full.slice(0, TITLE_MAX - 1).trim()}…`;
  }

  // Una foto grande no cabe en una celda: se guarda como archivo en Drive y la
  // ficha conserva sólo la referencia.
  if (collection === 'media' && typeof p['posterDataUrl'] === 'string') {
    const dataUrl = p['posterDataUrl'] as string;
    if (dataUrl.length > MAX_INLINE_POSTER) {
      const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl);
      const folderRoot = props().getProperty(PROP.mediaFolderId);
      // Un reintento de la misma mutación no debe crear el archivo dos veces.
      const already = findById(SHEETS.media, entityId);
      if (already && already.row['driveFileId']) {
        p['driveFileId'] = already.row['driveFileId'];
      } else if (m && folderRoot) {
        const localDate = String(p['localDate'] ?? localDateOf());
        const bytes = Utilities.base64Decode(m[2]!);
        const blob = Utilities.newBlob(bytes, m[1]!, `${entityId}.jpg`);
        const folderId = drive.monthFolder(folderRoot, localDate);
        const fileId = drive.uploadSmallFile(
          `${localDate.replace(/-/g, '')}-foto-${entityId}.${m[1] === 'image/png' ? 'png' : 'jpg'}`,
          m[1]!,
          folderId,
          blob,
        );
        p['driveFileId'] = fileId;
        p['uploadState'] = 'subido';
        p['mimeType'] = m[1];
        p['sizeBytes'] = bytes.length;
      }
      delete p['posterDataUrl'];
    }
  }

  return p;
}

function push(mutations: Mutation[], auth: AuthContext): {
  applied: string[];
  rejected: { mutationId: string; code: ApiErrorCode; userMessage: string; field?: string }[];
} {
  if (!Array.isArray(mutations)) throw new ValidationError('mutations', 'Formato no válido.');
  if (mutations.length > 200) throw new ValidationError('mutations', 'Demasiados cambios a la vez.');

  const applied: string[] = [];
  const rejected: { mutationId: string; code: ApiErrorCode; userMessage: string; field?: string }[] = [];
  const today = localDateOf();

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    for (const m of mutations) {
      try {
        if (!m || typeof m !== 'object') throw new ValidationError('mutation', 'Cambio no válido.');
        if (!isKnownCollection(m.collection)) throw new ValidationError('collection', 'Tipo de registro desconocido.');

        const sheetName = COLLECTION_SHEET[m.collection];
        if (!sheetName) throw new ValidationError('collection', 'Tipo de registro desconocido.');

        const id = String(m.entityId ?? '');
        const expectedPrefix = COLLECTION_PREFIX[m.collection];
        if (!id || id.indexOf(expectedPrefix + '_') !== 0) {
          throw new ValidationError('entityId', 'Referencia no válida.');
        }

        const now = nowIso();

        if (m.op === 'delete') {
          softDelete(sheetName, id, now);
          applied.push(m.mutationId);
          continue;
        }

        const clean = validatePatch(m.collection, normalizeForStorage(m.collection, id, m.patch ?? {}), today);
        const existing = findById(sheetName, id);

        const row: Record<string, unknown> = {
          ...clean,
          id,
          schemaVersion: SCHEMA_VERSION,
          updatedAt: now,
        };
        if (!existing) {
          row['createdAt'] = now;
          row['createdBy'] = auth.actor;
        }
        upsert(sheetName, id, row);
        applied.push(m.mutationId);
      } catch (error) {
        if (error instanceof ValidationError) {
          rejected.push({
            mutationId: m?.mutationId ?? '',
            code: 'VALIDATION',
            userMessage: error.userMessage,
            field: error.field,
          });
        } else {
          const eid = newErrorId();
          console.error(`[${eid}] push ${m?.collection}: ${String((error as Error)?.message)}`);
          rejected.push({
            mutationId: m?.mutationId ?? '',
            code: 'INTERNAL',
            userMessage: ERROR_MESSAGES.INTERNAL,
          });
        }
      }
    }
  } finally {
    lock.releaseLock();
  }

  return { applied, rejected };
}

// ── Media ────────────────────────────────────────────────────────────────────

function createUploadSession(payload: Record<string, unknown>, auth: AuthContext): unknown {
  const mediaId = String(payload['mediaId'] ?? '');
  if (mediaId.indexOf('mda_') !== 0) throw new ValidationError('mediaId', 'Referencia no válida.');

  const clean = validatePatch(
    'media',
    {
      kind: payload['kind'],
      mimeType: payload['mimeType'],
      sizeBytes: payload['sizeBytes'],
      fileName: payload['fileName'],
      localDate: payload['localDate'],
    },
    localDateOf(),
  );

  const size = Number(clean['sizeBytes'] ?? 0);
  if (size <= 0 || size > MAX_UPLOAD_BYTES) {
    throw new ValidationError('sizeBytes', 'El archivo es demasiado grande para subirlo.');
  }

  const kind = String(clean['kind']);
  const localDate = String(clean['localDate']);
  const parentRoot =
    kind === 'documento'
      ? props().getProperty(PROP.docsFolderId)
      : props().getProperty(PROP.mediaFolderId);
  if (!parentRoot) throw new Error('NOT_CONFIGURED');

  const folderId = drive.monthFolder(parentRoot, localDate);
  const ext = String(clean['mimeType']).split('/')[1] ?? 'bin';
  const base = safeFileName(String(clean['fileName'] ?? ''), `${kind}-${mediaId}`);
  const name = `${localDate.replace(/-/g, '')}-${base}`.slice(0, 120) + (base.indexOf('.') === -1 ? `.${ext}` : '');

  const session = drive.createResumableSession(name, String(clean['mimeType']), folderId, size);

  appendAudit({
    at: nowIso(),
    actor: auth.actor,
    action: 'media.createUploadSession',
    entity: 'media',
    entityId: mediaId,
    result: 'ok',
  });

  return {
    uploadUrl: session.uploadUrl,
    expiresAt: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(),
  };
}

/**
 * Confirma la subida verificando contra Drive que el archivo existe de verdad y
 * que su tamaño y tipo coinciden con lo declarado. Sin esta comprobación, el
 * cliente podría registrar metadatos de un archivo que no subió.
 */
function confirmUpload(payload: Record<string, unknown>): unknown {
  const mediaId = String(payload['mediaId'] ?? '');
  const driveFileId = String(payload['driveFileId'] ?? '');
  if (mediaId.indexOf('mda_') !== 0) throw new ValidationError('mediaId', 'Referencia no válida.');
  if (!driveFileId) throw new ValidationError('driveFileId', 'Falta el archivo.');

  let meta: { id: string; size?: string; mimeType?: string };
  try {
    meta = drive.getFileMeta(driveFileId);
  } catch {
    throw new ValidationError('driveFileId', 'No encontramos el archivo subido. Lo intentaremos de nuevo.');
  }

  // Si la ficha todavía no llegó desde la cola del cliente, se crea con los
  // campos base para que nunca exista una fila sin identidad ni versión.
  const existingMedia = findById(SHEETS.media, mediaId);
  const now = nowIso();
  upsert(SHEETS.media, mediaId, {
    ...(existingMedia ? {} : { id: mediaId, schemaVersion: SCHEMA_VERSION, createdAt: now, mimeType: meta.mimeType ?? '' }),
    driveFileId,
    uploadState: 'subido',
    uploadError: '',
    sizeBytes: Number(meta.size ?? 0) || undefined,
    updatedAt: nowIso(),
  });

  return { mediaId, driveFileId, sizeBytes: Number(meta.size ?? 0) };
}

function shareMedia(payload: Record<string, unknown>): unknown {
  const ids = Array.isArray(payload['mediaIds']) ? (payload['mediaIds'] as string[]) : [];
  const email = String(payload['email'] ?? '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new ValidationError('email', 'Ese correo no parece válido.');
  }
  if (ids.length === 0 || ids.length > 30) {
    throw new ValidationError('mediaIds', 'Selecciona entre 1 y 30 archivos.');
  }

  const shared: string[] = [];
  for (const id of ids) {
    const found = findById(SHEETS.media, id);
    const fileId = found?.row['driveFileId'];
    if (!fileId) continue;
    try {
      drive.shareWithEmail(String(fileId), email);
      shared.push(id);
    } catch (error) {
      console.error(`share ${id}: ${String((error as Error)?.message)}`);
    }
  }
  return { shared, email };
}

// ── Administración ───────────────────────────────────────────────────────────

function diagnostics(): unknown {
  const counts: Record<string, number> = {};
  for (const name of Object.values(SHEETS)) {
    try {
      counts[name] = countRows(name);
    } catch {
      counts[name] = -1;
    }
  }
  const p = props();
  return {
    version: BUILD_VERSION,
    schemaVersion: SCHEMA_VERSION,
    configured: isConfigured(),
    sheetId: maskId(p.getProperty(PROP.sheetId)),
    rootFolderId: maskId(p.getProperty(PROP.rootFolderId)),
    lastBackupAt: p.getProperty(PROP.lastBackupAt) ?? '',
    bootstrappedAt: getMeta('bootstrappedAt'),
    counts,
    serverTime: nowIso(),
    timeZone: Session.getScriptTimeZone(),
  };
}

/** No exponemos identificadores completos de Drive ni siquiera al administrador. */
function maskId(id: string | null): string {
  if (!id) return '';
  return id.length <= 10 ? '···' : `${id.slice(0, 6)}···${id.slice(-4)}`;
}

/** Copia de seguridad en JSON dentro de la carpeta de exportaciones. */
function runBackup(): unknown {
  const folderId = props().getProperty(PROP.reportsFolderId);
  if (!folderId) throw new Error('NOT_CONFIGURED');

  const data = pull('').data;
  const stamp = localDateOf();
  const blob = Utilities.newBlob(JSON.stringify(data, null, 1), 'application/json', `dalila-backup-${stamp}.json`);
  const fileId = drive.uploadSmallFile(`dalila-backup-${stamp}.json`, 'application/json', folderId, blob);

  const counts: Record<string, number> = {};
  for (const [k, v] of Object.entries(data)) counts[k] = Array.isArray(v) ? v.length : v ? 1 : 0;

  props().setProperty(PROP.lastBackupAt, nowIso());
  setMeta('lastBackupCounts', JSON.stringify(counts));
  return { fileId, counts, at: nowIso() };
}

/** Disparador diario. Se instala con `installTriggers()`. */
function dailyBackup(): void {
  try {
    if (isConfigured()) runBackup();
  } catch (error) {
    console.error('dailyBackup', String(error));
  }
}

function installTriggers(): void {
  for (const t of ScriptApp.getProjectTriggers()) {
    if (t.getHandlerFunction() === 'dailyBackup') ScriptApp.deleteTrigger(t);
  }
  ScriptApp.newTrigger('dailyBackup').timeBased().atHour(3).everyDays(1).create();
}

// Apps Script necesita estas funciones en el ámbito global.
(globalThis as Record<string, unknown>)['doGet'] = doGet;
(globalThis as Record<string, unknown>)['doPost'] = doPost;
(globalThis as Record<string, unknown>)['dailyBackup'] = dailyBackup;
(globalThis as Record<string, unknown>)['installTriggers'] = installTriggers;
