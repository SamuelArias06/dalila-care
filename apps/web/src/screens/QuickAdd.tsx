import { useState } from 'preact/hooks';
import { OVERALL_STATE, localDateOf, newId, nowIso } from '@dalila/shared';
import { Button, Sheet, toast } from '../ui/Kit.js';
import { IconAlert } from '../ui/Icons.js';
import { data, save } from '../data/store.js';
import { go } from '../app/router.js';
import { MediaCaptureButton } from '../components/MediaCapture.js';

/**
 * Hoja de registro rápido.
 *
 * Es el atajo para todo lo que se anota en segundos. Cada acción o guarda
 * directamente o lleva a la pantalla que corresponde, nunca a un formulario
 * largo.
 */
export function QuickAdd({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mood, setMood] = useState(false);
  const d = data.value;
  const today = localDateOf();
  const log = d.dailyLogs.find((l) => !l.deletedAt && l.localDate === today) ?? null;

  const nav = (path: string) => {
    onClose();
    go(path);
  };

  const quickLog = async (fields: Record<string, unknown>) => {
    await save('dailyLogs', log?.id ?? newId('dlg'), { localDate: today, ...fields }, 'dlg');
    toast('Registrado ✓');
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="¿Qué quieres registrar?">
      {mood ? (
        <div class="stack">
          <p class="t-body t-soft">¿Cómo está ahora?</p>
          <div class="row" style="gap:var(--s-2);justify-content:space-between">
            {OVERALL_STATE.map((o) => (
              <button
                key={o.value}
                type="button"
                class="grow"
                aria-label={o.label}
                style="display:flex;flex-direction:column;align-items:center;gap:5px;padding:var(--s-3) 2px;border-radius:var(--r-md)"
                onClick={() => void quickLog({ overallState: o.value, morningCheckAt: log?.morningCheckAt ?? nowIso() })}
              >
                <span style="font-size:30px">{o.emoji}</span>
                <span class="t-xs t-mute" style="text-align:center;line-height:1.15">{o.label}</span>
              </button>
            ))}
          </div>
          <Button variant="quiet" block onClick={() => setMood(false)}>Volver</Button>
        </div>
      ) : (
        <div class="stack">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--s-2)">
            <Tile emoji="🙂" label="Cómo está" onClick={() => setMood(true)} />
            <Tile emoji="🥣" label="Comida" onClick={() => nav('/alimentacion')} />
            <Tile emoji="💊" label="Medicamento" onClick={() => nav('/medicamentos')} />
            <Tile emoji="🐕" label="Paseo" onClick={() => nav('/actividad')} />
            <Tile emoji="📹" label="Vídeo o foto" onClick={() => nav('/videos')} />
            <Tile emoji="📝" label="Nota" onClick={() => nav('/eventos')} />
            <Tile emoji="💧" label="Agua" onClick={() => void quickLog({ water: 'normal' })} />
            <Tile emoji="🚽" label="Pipí / popó" onClick={() => nav('/checkin')} />
            <Tile emoji="⚖️" label="Peso" onClick={() => nav('/peso')} />
          </div>

          <div style="margin-top:var(--s-2)">
            <MediaCaptureButton
              kind="video"
              purpose="seguimiento"
              label="Grabar un vídeo ahora"
              onDone={() => onClose()}
            />
          </div>

          <Button variant="alert-soft" block onClick={() => nav('/preocupa')}>
            <IconAlert size={19} /> Me preocupa algo
          </Button>
        </div>
      )}
    </Sheet>
  );
}

function Tile({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      class="glass"
      style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
        padding:var(--s-4) var(--s-2);min-height:88px;transition:transform var(--dur-fast) var(--ease)"
    >
      <span style="font-size:25px" aria-hidden="true">{emoji}</span>
      <span class="t-xs t-medium" style="color:var(--ink-soft);text-align:center;line-height:1.2">{label}</span>
    </button>
  );
}
