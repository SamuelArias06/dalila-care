import { useMemo } from 'preact/hooks';
import {
  evaluateTrends,
  formatDateLong,
  nightSummary,
  summarizeDay,
  weekdayOf,
  type TrendNotice,
} from '@dalila/shared';
import { Button, Notice, Sheet } from '../ui/Kit.js';
import { IconAlert } from '../ui/Icons.js';
import { data } from '../data/store.js';
import { go } from '../app/router.js';

/**
 * "Hoy con Dalila" — el cierre del día.
 *
 * Sólo muestra líneas con contenido real: una lista llena de ceros haría sentir
 * mal a quien tuvo un día difícil. El texto de cierre cambia si el día fue duro.
 */
export function NightSummarySheet({
  open,
  onClose,
  date,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
}) {
  const d = data.value;
  const name = d.dog?.name ?? 'Dalila';

  const summary = useMemo(() => summarizeDay(d, date, weekdayOf(date)), [d, date]);
  const night = useMemo(() => nightSummary(summary), [summary]);
  const notices = useMemo(
    () => evaluateTrends({ dailyLogs: d.dailyLogs, doses: d.doses, weights: d.weights, today: date }),
    [d, date],
  );

  if (!open) return null;

  return (
    <Sheet open onClose={onClose}>
      <div class="stack-lg" style="padding-bottom:var(--s-2)">
        <div style="text-align:center">
          <h2 class="t-heading">Hoy con {name}</h2>
          <p class="t-sm t-soft" style="margin-top:2px;text-transform:capitalize">
            {formatDateLong(date)}
          </p>
        </div>

        {night.lines.length === 0 ? (
          <p class="t-body t-soft center">Todavía no hay nada registrado de hoy.</p>
        ) : (
          <div class="stack">
            {night.lines.map((l) => (
              <div key={l.label} class="row" style="gap:var(--s-3)">
                <span style="font-size:20px;width:28px;text-align:center" aria-hidden="true">
                  {l.emoji}
                </span>
                <span class="grow">
                  <span class="t-xs t-mute" style="display:block">{l.label}</span>
                  <span class="t-body t-medium" style="display:block">{l.value}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {night.note && (
          <div
            style="padding:var(--s-4);border-radius:var(--r-md);background:var(--surface-sunken);
              border-left:3px solid var(--brand)"
          >
            <p class="t-body" style="font-style:italic;color:var(--ink-soft)">"{night.note}"</p>
          </div>
        )}

        {notices.length > 0 && <TrendNotices notices={notices} />}

        <p class="t-md t-medium center" style="color:var(--brand)">
          {night.closing}
        </p>

        <div class="stack-sm">
          <Button
            variant="soft"
            block
            onClick={() => {
              onClose();
              go(`/checkin/${date}`);
            }}
          >
            Añadir algo más
          </Button>
          <Button variant="quiet" block onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

/**
 * Avisos por acumulación. Aparecen aquí y en el historial, nunca al abrir la
 * app por la mañana: informar está bien, sobresaltar a alguien recién
 * despertado no.
 */
export function TrendNotices({ notices }: { notices: TrendNotice[] }) {
  return (
    <div class="stack-sm">
      {notices.slice(0, 3).map((n) => (
        <Notice
          key={n.ruleId}
          tone={n.level === 'contactar_hoy' || n.level === 'urgencia' ? 'alert' : 'warn'}
          title={n.title}
          icon={<IconAlert size={19} />}
        >
          <p>{n.message}</p>
          <p class="t-xs t-mute" style="margin-top:var(--s-2)">Fuente: {n.source}</p>
        </Notice>
      ))}
    </div>
  );
}
