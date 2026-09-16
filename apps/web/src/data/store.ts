/**
 * Estado de la aplicación y sincronización.
 *
 * Todo cambio se escribe primero en memoria e IndexedDB y se pinta al instante.
 * La cola de salida se envía cuando hay red. Nada se pierde en silencio: una
 * entrada de la cola sólo desaparece cuando el servidor la confirma por su ULID
 * o cuando se rechaza por validación (y entonces queda registrada aparte).
 */

import { batch, computed, signal } from '@preact/signals';
import {
  emptyData,
  localDateOf,
  newId,
  nowIso,
  type Collection,
  type DalilaData,
  type Mutation,
  type PullResult,
  type PushResult,
} from '@dalila/shared';
import * as db from './db.js';
import { ApiError, call, isOnline, setToken, setUnauthorizedHandler } from './api.js';

export type SyncStatus = 'idle' | 'syncing' | 'pending' | 'offline' | 'error';

export interface Session {
  token: string;
  role: 'admin' | 'caregiver';
  deviceId: string;
  label: string;
}

// ── Señales ──────────────────────────────────────────────────────────────────

export const data = signal<DalilaData>(emptyData());
export const session = signal<Session | null>(null);
export const ready = signal(false);
export const syncStatus = signal<SyncStatus>('idle');
export const pendingCount = signal(0);
export const lastSyncedAt = signal<string>('');
export const lastError = signal<string>('');
export const pendingUploads = signal(0);

export const dog = computed(() => data.value.dog);
export const isOnboarded = computed(() => !!data.value.dog?.name);
export const isAdmin = computed(() => session.value?.role === 'admin');

// ── Arranque ─────────────────────────────────────────────────────────────────

export async function boot(): Promise<void> {
  const [cached, savedSession, syncedAt] = await Promise.all([
    db.loadData(),
    db.loadSession(),
    db.loadSyncedAt(),
  ]);

  batch(() => {
    if (cached) data.value = { ...emptyData(), ...cached };
    if (savedSession) {
      session.value = savedSession as Session;
      setToken(savedSession.token);
    }
    lastSyncedAt.value = syncedAt ?? '';
    ready.value = true;
  });

  setUnauthorizedHandler(() => {
    void signOut();
  });

  void db.requestPersistence();
  await refreshCounters();

  if (session.value) void sync();
}

export async function setSession(s: Session): Promise<void> {
  session.value = s;
  setToken(s.token);
  await db.saveSession(s);
}

export async function signOut(): Promise<void> {
  session.value = null;
  setToken('');
  await db.clearSession();
}

async function refreshCounters(): Promise<void> {
  const [count, uploads] = await Promise.all([db.outboxCount(), db.blobCount()]);
  batch(() => {
    pendingCount.value = count;
    pendingUploads.value = uploads;
    if (count > 0 && syncStatus.value === 'idle') syncStatus.value = 'pending';
    if (count === 0 && syncStatus.value === 'pending') syncStatus.value = 'idle';
  });
}

// ── Lectura de colecciones ───────────────────────────────────────────────────

function listOf(collection: Collection): Record<string, unknown>[] {
  if (collection === 'dog') return data.value.dog ? [data.value.dog as never] : [];
  return (data.value as unknown as Record<string, Record<string, unknown>[]>)[collection] ?? [];
}

export function getById<T = Record<string, unknown>>(collection: Collection, id: string): T | null {
  return (listOf(collection).find((r) => r['id'] === id) as T) ?? null;
}

// ── Mutaciones ───────────────────────────────────────────────────────────────

function applyLocal(collection: Collection, entityId: string, patch: Record<string, unknown>, isDelete: boolean): void {
  const now = nowIso();
  const next = { ...data.value } as unknown as Record<string, unknown>;

  if (collection === 'dog') {
    const current = (data.value.dog ?? {}) as Record<string, unknown>;
    next['dog'] = isDelete
      ? null
      : { ...current, ...patch, id: entityId, updatedAt: now, createdAt: current['createdAt'] ?? now };
    data.value = next as unknown as DalilaData;
    return;
  }

  const list = [...((next[collection] as Record<string, unknown>[]) ?? [])];
  const idx = list.findIndex((r) => r['id'] === entityId);

  if (isDelete) {
    if (idx >= 0) list[idx] = { ...list[idx], deletedAt: now, updatedAt: now };
  } else if (idx >= 0) {
    list[idx] = { ...list[idx], ...patch, id: entityId, updatedAt: now };
  } else {
    list.push({ ...patch, id: entityId, createdAt: now, updatedAt: now });
  }

  next[collection] = list;
  data.value = next as unknown as DalilaData;
}

/**
 * Crea o actualiza un registro. Devuelve el id (generado aquí si es nuevo),
 * para que la interfaz pueda navegar inmediatamente al elemento recién creado.
 */
export async function save(
  collection: Collection,
  entityId: string | null,
  patch: Record<string, unknown>,
  prefix?: string,
): Promise<string> {
  const id = entityId ?? newId((prefix ?? 'evt') as never);
  applyLocal(collection, id, patch, false);

  const mutation: Mutation = {
    mutationId: newId('evt'),
    collection,
    op: 'upsert',
    entityId: id,
    patch,
    createdAt: nowIso(),
  };

  await Promise.all([db.saveData(data.value), db.outboxAdd(mutation)]);
  await refreshCounters();
  void sync();
  return id;
}

export async function remove(collection: Collection, entityId: string): Promise<void> {
  applyLocal(collection, entityId, {}, true);
  await Promise.all([
    db.saveData(data.value),
    db.outboxAdd({
      mutationId: newId('evt'),
      collection,
      op: 'delete',
      entityId,
      patch: {},
      createdAt: nowIso(),
    }),
  ]);
  await refreshCounters();
  void sync();
}

// ── Sincronización ───────────────────────────────────────────────────────────

let syncing = false;
let syncQueued = false;

export async function sync(force = false): Promise<void> {
  if (!session.value) return;

  if (syncing) {
    syncQueued = true;
    return;
  }
  if (!isOnline()) {
    syncStatus.value = (await db.outboxCount()) > 0 ? 'pending' : 'offline';
    return;
  }

  syncing = true;
  syncStatus.value = 'syncing';
  lastError.value = '';

  try {
    await pushOutbox();
    await pullChanges(force);
    lastSyncedAt.value = nowIso();
    await db.saveSyncedAt(lastSyncedAt.value);
    syncStatus.value = (await db.outboxCount()) > 0 ? 'pending' : 'idle';
  } catch (error) {
    const e = error as ApiError;
    lastError.value = e?.userMessage ?? 'No pudimos sincronizar.';
    syncStatus.value = e?.isNetwork ? 'offline' : 'error';
  } finally {
    syncing = false;
    await refreshCounters();
    if (syncQueued) {
      syncQueued = false;
      void sync();
    }
  }
}

async function pushOutbox(): Promise<void> {
  const all = await db.outboxAll();
  const now = Date.now();
  const due = all.filter((m) => !m.nextAttemptAt || m.nextAttemptAt <= now);
  if (due.length === 0) return;

  // En lotes para no superar el límite de tamaño de petición.
  for (let i = 0; i < due.length; i += 50) {
    const batchItems = due.slice(i, i + 50);
    const result = await call<PushResult>('data.push', {
      mutations: batchItems.map((m) => ({
        mutationId: m.mutationId,
        collection: m.collection,
        op: m.op,
        entityId: m.entityId,
        patch: m.patch,
        createdAt: m.createdAt,
      })),
    });

    await db.outboxRemove(result.applied ?? []);

    for (const r of result.rejected ?? []) {
      // Un error de validación no se arregla reintentando: se aparta para que
      // no bloquee la cola y queda registrado para la pantalla de diagnóstico.
      await db.outboxMarkFailed(r.mutationId, r.userMessage, r.code === 'VALIDATION');
    }
  }
}

async function pullChanges(force: boolean): Promise<void> {
  const since = force ? '' : lastSyncedAt.value;
  const result = await call<PullResult>('data.pull', since ? { since } : {});

  const merged = result.full ? { ...emptyData(), ...result.data } : mergeInto(data.value, result.data);

  // Las mutaciones que siguen en la cola se vuelven a aplicar encima, para que
  // lo que la usuaria acaba de escribir no desaparezca de la pantalla mientras
  // viaja al servidor.
  const stillPending = await db.outboxAll();
  data.value = merged;
  for (const m of stillPending) {
    applyLocal(m.collection, m.entityId, m.patch, m.op === 'delete');
  }

  await db.saveData(data.value);
}

function mergeInto(current: DalilaData, incoming: Partial<DalilaData>): DalilaData {
  const out = { ...current } as unknown as Record<string, unknown>;

  if (incoming.dog) out['dog'] = incoming.dog;

  for (const [key, rows] of Object.entries(incoming)) {
    if (key === 'dog' || !Array.isArray(rows)) continue;
    const existing = [...(((current as unknown as Record<string, unknown>)[key] as Record<string, unknown>[]) ?? [])];
    const byId = new Map(existing.map((r) => [r['id'] as string, r]));
    for (const row of rows as Record<string, unknown>[]) {
      byId.set(row['id'] as string, row);
    }
    out[key] = [...byId.values()].filter((r) => !r['deletedAt']);
  }

  return out as unknown as DalilaData;
}

// ── Disparadores de sincronización ───────────────────────────────────────────
//
// En iOS no existe Background Sync, así que sincronizamos en los momentos en
// que la app está realmente abierta y visible.

export function installSyncTriggers(): void {
  window.addEventListener('online', () => void sync());
  window.addEventListener('offline', () => {
    syncStatus.value = 'offline';
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void sync();
  });
  // Red de seguridad por si la app queda abierta mucho tiempo.
  setInterval(() => {
    if (document.visibilityState === 'visible') void sync();
  }, 5 * 60_000);
}

// ── Utilidades ───────────────────────────────────────────────────────────────

export function todayLocal(): string {
  return localDateOf();
}

export async function hardRefresh(): Promise<void> {
  lastSyncedAt.value = '';
  await db.saveSyncedAt('');
  await sync(true);
}
