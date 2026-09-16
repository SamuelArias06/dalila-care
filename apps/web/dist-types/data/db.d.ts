/**
 * Almacenamiento local.
 *
 * La app es *local-first*: escribe primero aquí y pinta al instante; la
 * sincronización ocurre después y puede fallar sin que la usuaria lo note.
 *
 * Tres almacenes:
 *   · kv      — la instantánea de datos, la sesión y metadatos de sincronización.
 *   · outbox  — mutaciones pendientes de enviar, con su ULID para que reenviar
 *               nunca duplique nada.
 *   · blobs   — archivos capturados que todavía no se han subido. Sólo se
 *               borran cuando el servidor confirma la subida.
 */
import type { DalilaData, Mutation } from '@dalila/shared';
export interface PendingBlob {
    mediaId: string;
    blob: Blob;
    fileName: string;
    mimeType: string;
    createdAt: string;
    attempts: number;
    lastError?: string;
}
export interface OutboxEntry extends Mutation {
    attempts: number;
    lastError?: string;
    nextAttemptAt?: number;
}
export declare function kvGet<T>(key: string): Promise<T | undefined>;
export declare function kvSet(key: string, value: unknown): Promise<void>;
export declare function kvDel(key: string): Promise<void>;
export declare const loadData: () => Promise<DalilaData | undefined>;
export declare const saveData: (data: DalilaData) => Promise<void>;
export declare const loadSession: () => Promise<{
    token: string;
    role: string;
    deviceId: string;
    label: string;
} | undefined>;
export declare const saveSession: (s: unknown) => Promise<void>;
export declare const clearSession: () => Promise<void>;
export declare const loadSyncedAt: () => Promise<string | undefined>;
export declare const saveSyncedAt: (v: string) => Promise<void>;
export declare function outboxAdd(m: Mutation): Promise<void>;
export declare function outboxAll(): Promise<OutboxEntry[]>;
export declare function outboxCount(): Promise<number>;
/** Sólo se borra cuando el servidor confirma con el mismo ULID. */
export declare function outboxRemove(ids: string[]): Promise<void>;
export declare function outboxMarkFailed(id: string, error: string, permanent: boolean): Promise<void>;
export declare function blobPut(entry: PendingBlob): Promise<void>;
export declare function blobGet(mediaId: string): Promise<PendingBlob | undefined>;
export declare function blobAll(): Promise<PendingBlob[]>;
export declare function blobDelete(mediaId: string): Promise<void>;
export declare function blobCount(): Promise<number>;
/**
 * Pide al navegador que no borre estos datos.
 * En iOS las apps añadidas a la pantalla de inicio están exentas del borrado a
 * los 7 días de inactividad; en Safari normal no. Por eso la app insiste en que
 * se instale.
 */
export declare function requestPersistence(): Promise<boolean>;
export declare function storageEstimate(): Promise<{
    usageMB: number;
    quotaMB: number;
} | null>;
export declare function wipeLocal(): Promise<void>;
