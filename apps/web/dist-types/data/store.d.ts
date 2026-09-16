/**
 * Estado de la aplicación y sincronización.
 *
 * Todo cambio se escribe primero en memoria e IndexedDB y se pinta al instante.
 * La cola de salida se envía cuando hay red. Nada se pierde en silencio: una
 * entrada de la cola sólo desaparece cuando el servidor la confirma por su ULID
 * o cuando se rechaza por validación (y entonces queda registrada aparte).
 */
import { type Collection, type DalilaData } from '@dalila/shared';
export type SyncStatus = 'idle' | 'syncing' | 'pending' | 'offline' | 'error';
export interface Session {
    token: string;
    role: 'admin' | 'caregiver';
    deviceId: string;
    label: string;
}
export declare const data: import("@preact/signals-core").Signal<DalilaData>;
export declare const session: import("@preact/signals-core").Signal<Session | null>;
export declare const ready: import("@preact/signals-core").Signal<boolean>;
export declare const syncStatus: import("@preact/signals-core").Signal<SyncStatus>;
export declare const pendingCount: import("@preact/signals-core").Signal<number>;
export declare const lastSyncedAt: import("@preact/signals-core").Signal<string>;
export declare const lastError: import("@preact/signals-core").Signal<string>;
export declare const pendingUploads: import("@preact/signals-core").Signal<number>;
export declare const dog: import("@preact/signals-core").ReadonlySignal<import("@dalila/shared").Dog | null>;
export declare const isOnboarded: import("@preact/signals-core").ReadonlySignal<boolean>;
export declare const isAdmin: import("@preact/signals-core").ReadonlySignal<boolean>;
export declare function boot(): Promise<void>;
export declare function setSession(s: Session): Promise<void>;
export declare function signOut(): Promise<void>;
export declare function getById<T = Record<string, unknown>>(collection: Collection, id: string): T | null;
/**
 * Crea o actualiza un registro. Devuelve el id (generado aquí si es nuevo),
 * para que la interfaz pueda navegar inmediatamente al elemento recién creado.
 */
export declare function save(collection: Collection, entityId: string | null, patch: Record<string, unknown>, prefix?: string): Promise<string>;
export declare function remove(collection: Collection, entityId: string): Promise<void>;
export declare function sync(force?: boolean): Promise<void>;
export declare function installSyncTriggers(): void;
export declare function todayLocal(): string;
export declare function hardRefresh(): Promise<void>;
