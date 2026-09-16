import { useRef, useState } from 'preact/hooks';
import { VIDEO_CATEGORY_LABEL, VIDEO_CATEGORIES, localDateOf } from '@dalila/shared';
import { Button, Chip, Field, Sheet, Textarea, toast } from '../ui/Kit.js';
import { IconCamera, IconVideo } from '../ui/Icons.js';
import { captureMedia } from '../data/media.js';

/**
 * Captura de vídeo o foto.
 *
 * Usa `<input capture>` a propósito: iOS abre la cámara nativa y devuelve el
 * archivo ya recomprimido a 720p, así que un clip de 15 s pesa unos pocos MB.
 * El archivo se guarda primero en el dispositivo y se sube después, de modo que
 * grabar funciona igual sin conexión.
 */
export function MediaCaptureButton({
  kind,
  purpose,
  category,
  label,
  icon,
  linkedEventId,
  localDate,
  variant = 'soft',
  onDone,
}: {
  kind: 'video' | 'foto' | 'documento';
  purpose: 'seguimiento' | 'momento' | 'documento';
  category?: string;
  label: string;
  icon?: preact.ComponentChildren;
  linkedEventId?: string;
  localDate?: string;
  variant?: 'soft' | 'primary' | 'accent';
  onDone?: (mediaId: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [cat, setCat] = useState(category ?? (kind === 'video' ? 'libre' : ''));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const accept = kind === 'video' ? 'video/*' : kind === 'foto' ? 'image/*' : 'image/*,application/pdf';

  const onPick = (e: Event) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) setFile(f);
    if (input.current) input.current.value = '';
  };

  const confirm = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const r = await captureMedia(file, {
        kind,
        purpose,
        category: cat,
        note: note.trim(),
        localDate: localDate ?? localDateOf(),
        linkedEventId,
      });
      toast(kind === 'video' ? 'Vídeo guardado ✓' : 'Guardado ✓');
      onDone?.(r.mediaId);
      setFile(null);
      setNote('');
    } catch {
      toast('No pudimos guardarlo. Inténtalo otra vez.', 'alert');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant={variant} block onClick={() => input.current?.click()}>
        {icon ?? (kind === 'video' ? <IconVideo size={19} /> : <IconCamera size={19} />)}
        {label}
      </Button>
      <input
        ref={input}
        type="file"
        accept={accept}
        capture={kind === 'documento' ? undefined : 'environment'}
        class="sr-only"
        onChange={onPick}
      />

      <Sheet open={!!file} onClose={() => setFile(null)} title={kind === 'video' ? 'Tu vídeo' : 'Tu archivo'}>
        {file && (
          <div class="stack">
            <MediaPreview file={file} kind={kind} />

            {kind === 'video' && (
              <div>
                <p class="t-label" style="margin-bottom:var(--s-3)">¿Qué estás grabando?</p>
                <div class="chip-grid">
                  {VIDEO_CATEGORIES.map((c) => (
                    <Chip key={c} selected={cat === c} onToggle={() => setCat(c)}>
                      {VIDEO_CATEGORY_LABEL[c]}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            <Field label="Una nota (opcional)">
              <Textarea
                rows={2}
                value={note}
                placeholder="Hoy amaneció rígida…"
                onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)}
              />
            </Field>

            <p class="t-xs t-mute">
              {(file.size / 1048576).toFixed(1)} MB · se guarda aquí y se sube cuando haya conexión.
            </p>

            <Button variant="primary" block disabled={busy} onClick={() => void confirm()}>
              {busy ? 'Guardando…' : 'Guardar'}
            </Button>
            <Button variant="quiet" block onClick={() => setFile(null)}>
              Descartar
            </Button>
          </div>
        )}
      </Sheet>
    </>
  );
}

function MediaPreview({ file, kind }: { file: File; kind: string }) {
  const url = URL.createObjectURL(file);
  if (kind === 'video') {
    return (
      <video
        src={url}
        controls
        playsInline
        style="width:100%;border-radius:var(--r-md);max-height:46dvh;background:#000"
      />
    );
  }
  if (kind === 'documento' && file.type === 'application/pdf') {
    return (
      <div class="glass pad center">
        <p class="t-body t-medium">{file.name}</p>
        <p class="t-sm t-soft">Documento PDF</p>
      </div>
    );
  }
  return <img src={url} alt="" style="width:100%;border-radius:var(--r-md);max-height:46dvh;object-fit:contain" />;
}

/**
 * Guía breve y opcional de cómo grabar para que sirva en la consulta.
 * Nunca pide maniobras que puedan doler: eso lo decide el veterinario.
 */
export function RecordingTips() {
  return (
    <div class="glass pad stack-sm">
      <p class="t-label">Para que el vídeo le sirva al veterinario</p>
      <ul class="stack-sm" style="margin-top:var(--s-1)">
        {[
          'Buena luz y, si puedes, una superficie que no resbale.',
          'La cámara a su altura, no desde arriba.',
          'Entre 10 y 20 segundos bastan.',
          'Intenta grabar siempre igual: así se pueden comparar semanas después.',
        ].map((t) => (
          <li key={t} class="row" style="align-items:flex-start;gap:var(--s-2)">
            <span style="color:var(--accent);flex-shrink:0">·</span>
            <span class="t-sm t-soft">{t}</span>
          </li>
        ))}
      </ul>
      <p class="t-xs t-mute" style="margin-top:var(--s-2)">
        Graba sólo lo que ella haga por su cuenta. No le pidas que suba escaleras ni que haga nada
        que no le haya indicado su veterinario.
      </p>
    </div>
  );
}
