import { formatSince } from '@dalila/shared';
import { lastError, lastSyncedAt, pendingCount, pendingUploads, syncStatus } from '../data/store.js';

/**
 * Estado de sincronización, discreto y no bloqueante.
 * Nunca impide usar la app: como mucho informa de que algo está pendiente.
 */
export function SyncBar() {
  const status = syncStatus.value;
  const pending = pendingCount.value;
  const uploads = pendingUploads.value;

  if (status === 'idle' && pending === 0 && uploads === 0) return null;

  let cls = 'syncbar';
  let text = '';

  if (status === 'syncing') text = 'Guardando…';
  else if (status === 'error') {
    cls += ' syncbar--error';
    text = lastError.value || 'No pudimos sincronizar. Lo intentaremos de nuevo.';
  } else if (status === 'offline') {
    cls += ' syncbar--pending';
    text = pending > 0
      ? `Sin conexión · ${pending} ${pending === 1 ? 'cambio guardado aquí' : 'cambios guardados aquí'}`
      : 'Sin conexión';
  } else if (pending > 0) {
    cls += ' syncbar--pending';
    text = `${pending} ${pending === 1 ? 'cambio pendiente' : 'cambios pendientes'}`;
  } else if (uploads > 0) {
    cls += ' syncbar--pending';
    text = `${uploads} ${uploads === 1 ? 'archivo pendiente de subir' : 'archivos pendientes de subir'}`;
  } else if (lastSyncedAt.value) {
    text = `Todo guardado · ${formatSince(lastSyncedAt.value)}`;
  }

  if (!text) return null;

  return (
    <div class={cls} role="status" aria-live="polite">
      <span class="syncbar__dot" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
