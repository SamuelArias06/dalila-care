import { useEffect, useState } from 'preact/hooks';
import { data } from '../data/store.js';
import { mediaObjectUrl } from '../data/media.js';

/**
 * Foto de perfil de Dalila.
 *
 * Prefiere el póster guardado en local (aparece al instante y funciona sin
 * conexión) y sólo descarga de Drive si no hay ninguno.
 */
export function useDogPhoto(): string {
  const d = data.value;
  const [remote, setRemote] = useState('');

  const photoId = d.dog?.photoMediaId ?? '';
  const explicit = photoId ? d.media.find((m) => m.id === photoId && !m.deletedAt) : null;
  const fallback = d.media
    .filter((m) => !m.deletedAt && m.kind === 'foto' && m.posterDataUrl)
    .sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1))[0];

  const item = explicit ?? fallback ?? null;
  const local = item?.posterDataUrl ?? '';

  useEffect(() => {
    if (local || !item?.driveFileId) return;
    let alive = true;
    mediaObjectUrl(item.driveFileId)
      .then((url) => alive && setRemote(url))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [item?.driveFileId, local]);

  return local || remote;
}

export function DogPhoto({ size = 56, class: cls = '' }: { size?: number; class?: string }) {
  const photo = useDogPhoto();
  const name = data.value.dog?.name ?? 'Dalila';

  if (!photo) {
    return (
      <div
        class={`avatar ${cls}`}
        style={`width:${size}px;height:${size}px;display:grid;place-items:center;font-size:${size * 0.42}px`}
        aria-hidden="true"
      >
        🐾
      </div>
    );
  }

  return (
    <img
      class={`avatar ${cls}`}
      src={photo}
      alt={`Foto de ${name}`}
      style={`width:${size}px;height:${size}px`}
    />
  );
}
