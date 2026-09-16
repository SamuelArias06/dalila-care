import { useEffect, useState } from 'preact/hooks';
import {
  DOC_CATEGORIES,
  DOC_CATEGORY_LABEL,
  VIDEO_CATEGORY_LABEL,
  formatDayMonthShort,
  formatMonthYear,
  type MediaItem,
} from '@dalila/shared';
import { Button, Card, Empty, Header, Notice, Section, Sheet, toast, useConfirm } from '../ui/Kit.js';
import { IconCamera, IconVideo } from '../ui/Icons.js';
import { data, pendingUploads, remove } from '../data/store.js';
import { localObjectUrl, mediaObjectUrl, processUploadQueue } from '../data/media.js';
import { MediaCaptureButton, RecordingTips } from '../components/MediaCapture.js';

export function MediaScreen() {
  const d = data.value;
  const [viewing, setViewing] = useState<MediaItem | null>(null);

  const items = d.media
    .filter((m) => !m.deletedAt && (m.kind === 'video' || m.kind === 'foto') && m.purpose !== 'documento')
    .sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1));

  const pending = items.filter((m) => m.uploadState === 'pendiente' || m.uploadState === 'subiendo');

  const byMonth = new Map<string, MediaItem[]>();
  for (const m of items) {
    const key = m.localDate.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(m);
  }

  return (
    <div class="stack-lg">
      <Header title="Vídeos y fotos" subtitle="Su línea de tiempo visual" back="/dalila" />

      <div class="row" style="gap:var(--s-2)">
        <div class="grow">
          <MediaCaptureButton kind="video" purpose="seguimiento" label="Grabar vídeo" variant="primary" icon={<IconVideo size={19} />} />
        </div>
        <div class="grow">
          <MediaCaptureButton kind="foto" purpose="seguimiento" label="Foto" icon={<IconCamera size={19} />} />
        </div>
      </div>

      {pending.length > 0 && (
        <Notice tone="warn">
          {pending.length === 1 ? '1 archivo pendiente de subir' : `${pending.length} archivos pendientes de subir`}.
          Están guardados en este dispositivo y se subirán solos cuando haya conexión.
          <div style="margin-top:var(--s-3)">
            <Button variant="soft" size="sm" onClick={() => void processUploadQueue()}>
              Intentar ahora
            </Button>
          </div>
        </Notice>
      )}

      {items.length === 0 ? (
        <>
          <Empty
            emoji="📹"
            title="Todavía no hay vídeos"
            body="Un clip de 15 segundos caminando puede ser lo más útil que le lleves al veterinario dentro de unas semanas."
          />
          <RecordingTips />
        </>
      ) : (
        <>
          {[...byMonth.entries()].map(([month, list]) => (
            <Section key={month} title={formatMonthYear(`${month}-01`)}>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:var(--s-2)">
                {list.map((m) => (
                  <MediaThumb key={m.id} item={m} onOpen={() => setViewing(m)} />
                ))}
              </div>
            </Section>
          ))}
          <RecordingTips />
        </>
      )}

      <MediaViewer item={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

function MediaThumb({ item, onOpen }: { item: MediaItem; onOpen: () => void }) {
  const pending = item.uploadState === 'pendiente' || item.uploadState === 'subiendo';
  return (
    <button type="button" onClick={onOpen} style="text-align:left;width:100%">
      <div style="position:relative;aspect-ratio:1;border-radius:var(--r-md);overflow:hidden;background:var(--surface-sunken)">
        {item.posterDataUrl ? (
          <img src={item.posterDataUrl} alt="" style="width:100%;height:100%;object-fit:cover" />
        ) : (
          <div style="width:100%;height:100%;display:grid;place-items:center;font-size:26px">
            {item.kind === 'video' ? '📹' : '📸'}
          </div>
        )}
        {item.kind === 'video' && (
          <span
            style="position:absolute;bottom:5px;right:5px;background:rgba(0,0,0,.62);color:#fff;
              border-radius:6px;padding:1px 5px;font-size:10px;font-weight:600"
          >
            {item.durationSec ? `0:${String(item.durationSec).padStart(2, '0')}` : '▶'}
          </span>
        )}
        {pending && (
          <span
            style="position:absolute;top:5px;left:5px;background:var(--warn);color:#fff;
              border-radius:6px;padding:1px 5px;font-size:9px;font-weight:700"
          >
            ⏳
          </span>
        )}
        {item.uploadState === 'error' && (
          <span
            style="position:absolute;top:5px;left:5px;background:var(--alert);color:#fff;
              border-radius:6px;padding:1px 5px;font-size:9px;font-weight:700"
          >
            !
          </span>
        )}
      </div>
      <p class="t-xs t-medium" style="margin-top:4px">{formatDayMonthShort(item.localDate)}</p>
      {item.category && (
        <p class="t-xs t-mute" style="line-height:1.25">
          {VIDEO_CATEGORY_LABEL[item.category] ?? item.category.replace(/_/g, ' ')}
        </p>
      )}
    </button>
  );
}

function MediaViewer({ item, onClose }: { item: MediaItem | null; onClose: () => void }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const { confirm, dialog } = useConfirm();

  useEffect(() => {
    if (!item) {
      setUrl('');
      setError('');
      return;
    }
    let alive = true;
    setUrl('');
    setError('');

    (async () => {
      try {
        // Si todavía no se ha subido, se reproduce desde el propio dispositivo.
        const local = await localObjectUrl(item.id);
        if (local && alive) {
          setUrl(local);
          return;
        }
        if (item.driveFileId) {
          const remote = await mediaObjectUrl(item.driveFileId);
          if (alive) setUrl(remote);
        } else if (alive) {
          setError('Este archivo todavía no se ha subido.');
        }
      } catch {
        if (alive) setError('No pudimos abrirlo ahora mismo. Inténtalo con conexión.');
      }
    })();

    return () => {
      alive = false;
    };
  }, [item]);

  if (!item) return null;

  return (
    <Sheet open onClose={onClose} title={formatDayMonthShort(item.localDate)}>
      <div class="stack">
        {error ? (
          <Notice tone="warn">{error}</Notice>
        ) : !url ? (
          <div class="skeleton" style="width:100%;aspect-ratio:1;border-radius:var(--r-md)" />
        ) : item.kind === 'video' ? (
          <video src={url} controls playsInline style="width:100%;border-radius:var(--r-md);max-height:56dvh;background:#000" />
        ) : (
          <img src={url} alt="" style="width:100%;border-radius:var(--r-md);max-height:56dvh;object-fit:contain" />
        )}

        {item.category && (
          <p class="t-body t-medium">
            {VIDEO_CATEGORY_LABEL[item.category] ?? DOC_CATEGORY_LABEL[item.category] ?? item.category}
          </p>
        )}
        {item.note && <p class="t-body t-soft">"{item.note}"</p>}
        <p class="t-xs t-mute">
          {(item.sizeBytes / 1048576).toFixed(1)} MB ·{' '}
          {item.uploadState === 'subido' ? 'guardado en Drive' : 'pendiente de subir'}
        </p>

        <Button
          variant="alert-soft"
          block
          onClick={async () => {
            if (await confirm({ title: '¿Eliminar este archivo?', body: 'No se puede deshacer.', confirmLabel: 'Eliminar', danger: true })) {
              await remove('media', item.id);
              toast('Eliminado');
              onClose();
            }
          }}
        >
          Eliminar
        </Button>
      </div>
      {dialog}
    </Sheet>
  );
}

// ── Documentos ───────────────────────────────────────────────────────────────

export function DocumentsScreen() {
  const d = data.value;
  const [viewing, setViewing] = useState<MediaItem | null>(null);

  const docs = d.media
    .filter((m) => !m.deletedAt && (m.kind === 'documento' || m.purpose === 'documento'))
    .sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1));

  return (
    <div class="stack-lg">
      <Header title="Documentos" subtitle="Fórmulas, exámenes, informes" back="/dalila" />

      <Card>
        <p class="t-label" style="margin-bottom:var(--s-3)">Añadir</p>
        <div class="stack-sm">
          {DOC_CATEGORIES.map((c) => (
            <MediaCaptureButton
              key={c}
              kind="documento"
              purpose="documento"
              category={c}
              label={DOC_CATEGORY_LABEL[c] ?? c}
            />
          ))}
        </div>
      </Card>

      <Notice tone="info">
        Guarda aquí fotos de las fórmulas y los informes. Esta app no interpreta radiografías ni
        resultados: sólo los conserva ordenados por fecha.
      </Notice>

      {docs.length === 0 ? (
        <Empty emoji="📄" title="Sin documentos todavía" />
      ) : (
        <Card pad={false}>
          <div class="list">
            {docs.map((m) => (
              <button key={m.id} type="button" class="list-item" onClick={() => setViewing(m)}>
                <span style="width:26px;font-size:18px">📄</span>
                <span class="grow">
                  <span class="t-body t-medium" style="display:block">
                    {DOC_CATEGORY_LABEL[m.category ?? ''] ?? 'Documento'}
                  </span>
                  <span class="t-xs t-soft">
                    {formatDayMonthShort(m.localDate)}
                    {m.uploadState !== 'subido' ? ' · pendiente de subir' : ''}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      <MediaViewer item={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
