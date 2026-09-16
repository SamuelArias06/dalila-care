/**
 * Cliente de la API.
 *
 * Detalle importante: se envía `Content-Type: text/plain;charset=utf-8` a
 * propósito. Apps Script no responde bien a las peticiones `OPTIONS` de
 * preflight, y `text/plain` hace que el navegador trate la petición como
 * simple y no preflightee. Por eso tampoco podemos usar cabeceras propias y el
 * token viaja dentro del cuerpo.
 */

import type { Action, ApiResponse } from '@dalila/shared';
import { ERROR_MESSAGES } from '@dalila/shared';

const API_URL: string = import.meta.env['VITE_API_URL'] ?? '';

export class ApiError extends Error {
  readonly code: string;
  readonly userMessage: string;
  readonly errorId?: string;
  readonly field?: string;
  readonly isNetwork: boolean;

  constructor(opts: {
    code: string;
    userMessage: string;
    errorId?: string;
    field?: string;
    isNetwork?: boolean;
  }) {
    super(opts.userMessage);
    this.name = 'ApiError';
    this.code = opts.code;
    this.userMessage = opts.userMessage;
    this.errorId = opts.errorId;
    this.field = opts.field;
    this.isNetwork = opts.isNetwork ?? false;
  }
}

export function apiConfigured(): boolean {
  return API_URL.length > 0;
}

let currentToken = '';
export function setToken(token: string): void {
  currentToken = token;
}
export function getToken(): string {
  return currentToken;
}

/** Callback para que la interfaz reaccione a una sesión caducada o revocada. */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn;
}

export async function call<T>(
  action: Action,
  payload: Record<string, unknown> = {},
  opts: { timeoutMs?: number; withoutToken?: boolean } = {},
): Promise<T> {
  if (!API_URL) {
    throw new ApiError({
      code: 'NOT_CONFIGURED',
      userMessage: 'La app todavía no está conectada con su servidor.',
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 45_000);

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      // No es un capricho: evita el preflight que Apps Script no maneja.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action,
        token: opts.withoutToken ? undefined : currentToken,
        apiVersion: 1,
        payload,
      }),
      signal: controller.signal,
      redirect: 'follow',
    });
  } catch (error) {
    clearTimeout(timer);
    const aborted = (error as Error)?.name === 'AbortError';
    throw new ApiError({
      code: 'NETWORK',
      isNetwork: true,
      userMessage: aborted
        ? 'La conexión está tardando demasiado. Lo intentaremos de nuevo.'
        : 'No hay conexión ahora mismo. Tus cambios están guardados en este dispositivo.',
    });
  } finally {
    clearTimeout(timer);
  }

  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError({
      code: 'INTERNAL',
      userMessage: 'La respuesta del servidor no se entendió. Lo intentaremos de nuevo.',
      isNetwork: true,
    });
  }

  if (body.ok) return body.data;

  const code = body.error?.code ?? 'INTERNAL';
  if (code === 'UNAUTHORIZED' && onUnauthorized) onUnauthorized();

  throw new ApiError({
    code,
    userMessage: body.error?.userMessage || ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.INTERNAL,
    errorId: body.error?.errorId,
    field: body.error?.field,
  });
}

export function isOnline(): boolean {
  return navigator.onLine !== false;
}
