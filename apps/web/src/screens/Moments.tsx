import { useEffect, useState } from 'preact/hooks';
import { formatDayMonthShort, formatMonthYear, localDateOf, newId } from '@dalila/shared';
import { Button, Card, Empty, Field, Header, Sheet, Textarea, toast, useConfirm } from '../ui/Kit.js';
import { IconHeart, IconPlus } from '../ui/Icons.js';
import { data, remove, save } from '../data/store.js';
import { captureMedia, mediaObjectUrl } from '../data/media.js';

/**
 * Momentos.
 *
 * Esta pantalla no muestra ni un solo dato clínico. Es deliberado: si dentro de
 * un año la app sólo contiene síntomas, habremos convertido la vida de Dalila
 * en una lista de problemas.
 */
export function MomentsScreen() {
  const d = data.value;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const { confirm, dialog } = useConfirm();

  const moments = d.moments
    .filter((m) => !m.deletedAt)
    .sort((a, b) => (a.localDate < b.localDate ? 1 : -1));

  const favourites = d.media.filter((m) => !m.deletedAt && (m.purpose === 'momento' || m.isFavorite));

  const byMonth = new Map<string, typeof moments>();
  for (const m of moments) {
    const key = m.localDate.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(m);
  }

  const submit = async () => {
    if (!text.trim() && !file) return;
    setBusy(true);
    try {
      const mediaIds: string[] = [];
      if (file) {
        const r = await captureMedia(file, {
          kind: file.type.startsWith('video') ? 'video' : 'foto',
          purpose: 'momento',
          note: text.trim(),
          isFavorite: true,
        });
        mediaIds.push(r.mediaId);
      }
      await save('moments', newId('mom'), { localDate: localDateOf(), text: text.trim(), mediaIds }, 'mom');
      setText('');
      setFile(null);
      setOpen(false);
      toast('Guardado ❤️');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class="stack-lg">
      <Header
        title="Momentos"
        subtitle="Los días buenos también cuentan"
        action={
          <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
            <IconPlus size={17} /> Añadir
          </Button>
        }
      />

      {moments.length === 0 && favourites.length === 0 ? (
        <Empty
          emoji="❤️"
          title="Guarda los buenos momentos"
          body="Una foto durmiendo al sol, el día que volvió a querer la pelota, cómo te recibe al llegar. Dalila no es su enfermedad."
          action={<Button variant="primary" onClick={() => setOpen(true)}>Añadir el primero</Button>}
        />
      ) : (
        [...byMonth.entries()].map(([month, list]) => (
          <section key={month} class="stack">
            <p class="t-label" style="padding-inline:2px">{formatMonthYear(`${month}-01`)}</p>
            <div class="stack-sm">
              {list.map((m) => (
                <MomentCard
                  key={m.id}
                  text={m.text}
                  date={m.localDate}
                  mediaIds={m.mediaIds}
                  onDelete={async () => {
                    if (await confirm({ title: '¿Eliminar este momento?', confirmLabel: 'Eliminar', danger: true })) {
                      await remove('moments', m.id);
                    }
                  }}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Un buen momento">
        <div class="stack">
          <Field label="¿Qué pasó?">
            <Textarea
              rows={3}
              value={text}
              placeholder="Hoy quiso jugar con su pelota otra vez."
              onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
            />
          </Field>

          {file ? (
            <div style="position:relative">
              <img src={URL.createObjectURL(file)} alt="" style="width:100%;border-radius:var(--r-md);max-height:40dvh;object-fit:cover" />
              <Button variant="quiet" block style="margin-top:var(--s-2)" onClick={() => setFile(null)}>
                Quitar la foto
              </Button>
            </div>
          ) : (
            <label class="btn btn--soft btn--block" style="cursor:pointer">
              <IconHeart size={18} /> Añadir una foto
              <input
                type="file"
                accept="image/*,video/*"
                class="sr-only"
                onChange={(e) => {
                  const f = (e.target as HTMLInputElement).files?.[0];
                  if (f) setFile(f);
                }}
              />
            </label>
          )}

          <Button variant="primary" block disabled={busy || (!text.trim() && !file)} onClick={() => void submit()}>
            {busy ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </Sheet>

      {dialog}
    </div>
  );
}

function MomentCard({
  text,
  date,
  mediaIds,
  onDelete,
}: {
  text: string;
  date: string;
  mediaIds: string[];
  onDelete: () => void;
}) {
  const d = data.value;
  const media = d.media.find((m) => mediaIds.includes(m.id) && !m.deletedAt);
  const [url, setUrl] = useState(media?.posterDataUrl ?? '');

  useEffect(() => {
    if (url || !media?.driveFileId) return;
    let alive = true;
    mediaObjectUrl(media.driveFileId)
      .then((u) => alive && setUrl(u))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [media?.driveFileId, url]);

  return (
    <Card pad={false}>
      {url && (
        <img
          src={url}
          alt=""
          style="width:100%;max-height:300px;object-fit:cover;border-radius:var(--r-lg) var(--r-lg) 0 0"
        />
      )}
      <div class="pad">
        {text && <p class="t-md" style="line-height:1.45">{text}</p>}
        <div class="row-between" style="margin-top:var(--s-3)">
          <span class="t-xs t-mute">{formatDayMonthShort(date)}</span>
          <button type="button" class="t-xs" style="color:var(--ink-mute)" onClick={onDelete}>
            Eliminar
          </button>
        </div>
      </div>
    </Card>
  );
}
