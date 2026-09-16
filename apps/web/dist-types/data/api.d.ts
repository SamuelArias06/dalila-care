/**
 * Cliente de la API.
 *
 * Detalle importante: se envía `Content-Type: text/plain;charset=utf-8` a
 * propósito. Apps Script no responde bien a las peticiones `OPTIONS` de
 * preflight, y `text/plain` hace que el navegador trate la petición como
 * simple y no preflightee. Por eso tampoco podemos usar cabeceras propias y el
 * token viaja dentro del cuerpo.
 */
import type { Action } from '@dalila/shared';
export declare class ApiError extends Error {
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
    });
}
export declare function apiConfigured(): boolean;
export declare function setToken(token: string): void;
export declare function getToken(): string;
export declare function setUnauthorizedHandler(fn: () => void): void;
export declare function call<T>(action: Action, payload?: Record<string, unknown>, opts?: {
    timeoutMs?: number;
    withoutToken?: boolean;
}): Promise<T>;
export declare function isOnline(): boolean;
