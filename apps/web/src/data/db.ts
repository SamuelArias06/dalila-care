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

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
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

interface DalilaDB extends DBSchema {
  kv: { key: string; value: unknown };
  outbox: { key: string; value: OutboxEntry };
  blobs: { key: string; value: PendingBlob };
}

let dbPromise: Promise<IDBPDatabase<DalilaDB>> | null = null;

function db(): Promise<IDBPDatabase<DalilaDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DalilaDB>('dalila-care', 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('kv')) database.createObjectStore('kv');
        if (!database.objectStoreNames.contains('outbox')) {
          database.createObjectStore('outbox', { keyPath: 'mutationId' });
        }
        if (!database.objectStoreNames.contains('blobs')) {
          database.createObjectStore('blobs', { keyPath: 'mediaId' });
        }
      },
    });
  }
  return dbPromise;
}

// ── Clave/valor ──────────────────────────────────────────────────────────────

export async function kvGet<T>(key: string): Promise<T | undefined> {
  try {
    return (await (await db()).get('kv', key)) as T | undefined;
  } catch {
    return undefined;
  }
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  try {
    await (await db()).put('kv', value, key);
  } catch {
    /* Modo privado o almacenamiento bloqueado: la app sigue funcionando en memoria. */
  }
}

export async function kvDel(key: string): Promise<void> {
  try {
    await (await db()).delete('kv', key);
  } catch {
    /* ignorado */
  }
}

// ── Instantánea de datos ─────────────────────────────────────────────────────

export const loadData = () => kvGet<DalilaData>('data');
export const saveData = (data: DalilaData) => kvSet('data', data);

export const loadSession = () => kvGet<{ token: string; role: string; deviceId: string; label: string }>('session');
export const saveSession = (s: unknown) => kvSet('session', s);
export const clearSession = () => kvDel('session');

export const loadSyncedAt = () => kvGet<string>('syncedAt');
export const saveSyncedAt = (v: string) => kvSet('syncedAt', v);

// ── Cola de salida ───────────────────────────────────────────────────────────

export async function outboxAdd(m: Mutation): Promise<void> {
  try {
    await (await db()).put('outbox', { ...m, attempts: 0 });
  } catch {
    /* ignorado */
  }
}

export async function outboxAll(): Promise<OutboxEntry[]> {
  try {
    const all = await (await db()).getAll('outbox');
    return all.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  } catch {
    return [];
  }
}

export async function outboxCount(): Promise<number> {
  try {
    return await (await db()).count('outbox');
  } catch {
    return 0;
  }
}

/** Sólo se borra cuando el servidor confirma con el mismo ULID. */
export async function outboxRemove(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    const database = await db();
    const tx = database.transaction('outbox', 'readwrite');
    await Promise.all(ids.map((id) => tx.store.delete(id)));
    await tx.done;
  } catch {
    /* ignorado */
  }
}

export async function outboxMarkFailed(id: string, error: string, permanent: boolean): Promise<void> {
  try {
    const database = await db();
    const entry = await database.get('outbox', id);
    if (!entry) return;
    if (permanent) {
      // Un rechazo de validación no se va a arreglar reintentando: se descarta
      // para que no bloquee el resto de la cola, y queda constancia.
      await database.delete('outbox', id);
      const rejected = ((await kvGet<unknown[]>('rejected')) ?? []).slice(-49);
      rejected.push({ ...entry, error, at: new Date().toISOString() });
      await kvSet('rejected', rejected);
      return;
    }
    entry.attempts += 1;
    entry.lastError = error;
    entry.nextAttemptAt = Date.now() + Math.min(60_000, 2 ** entry.attempts * 1000);
    await database.put('outbox', entry);
  } catch {
    /* ignorado */
  }
}

// ── Archivos pendientes ──────────────────────────────────────────────────────

export async function blobPut(entry: PendingBlob): Promise<void> {
  await (await db()).put('blobs', entry);
}

export async function blobGet(mediaId: string): Promise<PendingBlob | undefined> {
  try {
    return await (await db()).get('blobs', mediaId);
  } catch {
    return undefined;
  }
}

export async function blobAll(): Promise<PendingBlob[]> {
  try {
    return await (await db()).getAll('blobs');
  } catch {
    return [];
  }
}

export async function blobDelete(mediaId: string): Promise<void> {
  try {
    await (await db()).delete('blobs', mediaId);
  } catch {
    /* ignorado */
  }
}

export async function blobCount(): Promise<number> {
  try {
    return await (await db()).count('blobs');
  } catch {
    return 0;
  }
}

// ── Persistencia ─────────────────────────────────────────────────────────────

/**
 * Pide al navegador que no borre estos datos.
 * En iOS las apps añadidas a la pantalla de inicio están exentas del borrado a
 * los 7 días de inactividad; en Safari normal no. Por eso la app insiste en que
 * se instale.
 */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* ignorado */
  }
  return false;
}

export async function storageEstimate(): Promise<{ usageMB: number; quotaMB: number } | null> {
  try {
    const e = await navigator.storage?.estimate?.();
    if (!e) return null;
    return {
      usageMB: Math.round(((e.usage ?? 0) / 1048576) * 10) / 10,
      quotaMB: Math.round((e.quota ?? 0) / 1048576),
    };
  } catch {
    return null;
  }
}

export async function wipeLocal(): Promise<void> {
  const database = await db();
  await Promise.all([database.clear('kv'), database.clear('outbox'), database.clear('blobs')]);
}
