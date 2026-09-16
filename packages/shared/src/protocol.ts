/**
 * Contrato de la API entre la PWA y Apps Script.
 *
 * Es RPC sobre un único endpoint POST, no REST. El motivo es concreto: Apps
 * Script no responde correctamente a las peticiones `OPTIONS` de preflight, así
 * que enviamos `Content-Type: text/plain;charset=utf-8` con JSON en el cuerpo,
 * que el navegador considera una petición simple y no preflightea. Eso también
 * implica que no podemos usar cabeceras propias: el token viaja en el cuerpo.
 */

import type { DalilaData } from './types.js';

export const API_VERSION = 1;

export const ACTIONS = [
  'ping',
  'auth.redeemInvite',
  'auth.check',
  'auth.listDevices',
  'auth.revokeDevice',
  'auth.createInvite',
  'data.pull',
  'data.push',
  'media.createUploadSession',
  'media.confirmUpload',
  'media.getContentToken',
  'media.share',
  'admin.diagnostics',
  'admin.backup',
  'export.all',
] as const;

export type Action = (typeof ACTIONS)[number];

export interface ApiRequest<P = unknown> {
  action: Action;
  token?: string;
  clientRequestId?: string;
  apiVersion?: number;
  payload?: P;
}

export interface ApiOk<T> {
  ok: true;
  data: T;
  serverTime: string;
}

export interface ApiErr {
  ok: false;
  error: {
    code: ApiErrorCode;
    /** Mensaje en español apto para mostrar a la usuaria. */
    userMessage: string;
    /** Código corto para soporte. No contiene datos. */
    errorId?: string;
    field?: string;
  };
  serverTime: string;
}

export type ApiResponse<T> = ApiOk<T> | ApiErr;

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT'
  | 'NOT_CONFIGURED'
  | 'INTERNAL';

/** Mensajes por defecto en lenguaje humano. Nunca se muestra un stack trace. */
export const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  UNAUTHORIZED: 'Tu acceso caducó. Abre de nuevo el enlace que te compartieron.',
  FORBIDDEN: 'Esta parte de la app no está disponible para tu acceso.',
  VALIDATION: 'Hay algo en los datos que no pudimos guardar. Revisa lo que escribiste.',
  NOT_FOUND: 'No encontramos eso. Puede que se haya eliminado.',
  CONFLICT: 'Alguien cambió esto mientras lo editabas. Vuelve a abrirlo para ver la versión más reciente.',
  RATE_LIMIT: 'Demasiadas peticiones seguidas. Espera un momento y volvemos a intentarlo.',
  NOT_CONFIGURED: 'La app todavía no terminó de configurarse. Inténtalo en unos segundos.',
  INTERNAL: 'No pudimos guardar el cambio. Está guardado en tu dispositivo y lo intentaremos otra vez.',
};

// ── Mutaciones ───────────────────────────────────────────────────────────────

export type MutationOp = 'upsert' | 'delete';

/** Nombres de colección que acepta `data.push`. */
export const COLLECTIONS = [
  'dog',
  'diagnoses',
  'dailyLogs',
  'tasks',
  'completions',
  'medications',
  'medicationVersions',
  'doses',
  'foods',
  'feedingPlan',
  'feedingLogs',
  'weights',
  'activities',
  'media',
  'events',
  'questions',
  'instructions',
  'appointments',
  'moments',
] as const;

export type Collection = (typeof COLLECTIONS)[number];

export interface Mutation {
  /** ULID generado en el cliente: reenviar la misma mutación es idempotente. */
  mutationId: string;
  collection: Collection;
  op: MutationOp;
  entityId: string;
  /** Campos a escribir. En `delete` sólo se usa `entityId`. */
  patch: Record<string, unknown>;
  createdAt: string;
}

export interface PushPayload {
  mutations: Mutation[];
}

export interface PushResult {
  applied: string[];
  rejected: { mutationId: string; code: ApiErrorCode; userMessage: string; field?: string }[];
}

export interface PullPayload {
  /** Sólo devuelve lo modificado después de este instante. Vacío = todo. */
  since?: string;
}

export interface PullResult {
  data: DalilaData;
  syncedAt: string;
  full: boolean;
}

// ── Autenticación ────────────────────────────────────────────────────────────

export interface RedeemInvitePayload {
  inviteCode: string;
  deviceLabel: string;
}

export interface Session {
  token: string;
  role: 'admin' | 'caregiver';
  deviceId: string;
  label: string;
}

export interface AuthCheckResult {
  role: 'admin' | 'caregiver';
  deviceId: string;
  label: string;
  needsOnboarding: boolean;
}

// ── Media ────────────────────────────────────────────────────────────────────

export interface CreateUploadSessionPayload {
  mediaId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: 'video' | 'foto' | 'documento';
  localDate: string;
}

export interface CreateUploadSessionResult {
  /** URI de sesión reanudable de Drive. Es una capacidad de un solo uso. */
  uploadUrl: string;
  /** Token de acceso de corta duración, sólo si el reanudable lo exige. */
  accessToken?: string;
  expiresAt: string;
}

export interface ConfirmUploadPayload {
  mediaId: string;
  driveFileId: string;
}

export interface ContentTokenResult {
  accessToken: string;
  expiresAt: string;
}

export interface SharePayload {
  mediaIds: string[];
  email: string;
}

// ── Utilidades de cliente ────────────────────────────────────────────────────

export function isOk<T>(r: ApiResponse<T>): r is ApiOk<T> {
  return r.ok === true;
}

export function errorMessageOf(r: ApiErr): string {
  return r.error.userMessage || ERROR_MESSAGES[r.error.code] || ERROR_MESSAGES.INTERNAL;
}
