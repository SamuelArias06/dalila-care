/**
 * Gráficos en SVG, escritos a mano.
 *
 * Son cuatro formas muy simples: no justifican los ~70 KB de una librería de
 * charts, y así encajan con el resto del diseño.
 *
 * Todos son descriptivos: muestran lo que se registró, con su denominador, y
 * nunca sacan conclusiones. Ver docs/POLITICA_CONTENIDO_MEDICO.md.
 */

import { formatDayMonthShort } from '@dalila/shared';

export interface Point {
  date: string;
  value: number | null;
}

export function LineChart({
  points,
  unit = '',
  target = null,
  height = 150,
}: {
  points: Point[];
  unit?: string;
  target?: number | null;
  height?: number;
}) {
  const values = points.map((p) => p.value).filter((v): v is number => v != null);
  if (values.length < 2) {
    return <p class="t-sm t-mute">Hacen falta al menos dos registros para dibujar la evolución.</p>;
  }

  const w = 320;
  const h = height;
  const padX = 8;
  const padY = 18;

  const all = target != null ? [...values, target] : values;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const pad = span * 0.18;
  const lo = min - pad;
  const hi = max + pad;

  const x = (i: number) => padX + (i / (points.length - 1)) * (w - padX * 2);
  const y = (v: number) => padY + (1 - (v - lo) / (hi - lo)) * (h - padY * 2);

  const path = points
    .map((p, i) => (p.value == null ? null : `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`))
    .filter(Boolean)
    .join(' ');

  const area = `${path} L${x(points.length - 1).toFixed(1)},${h - padY} L${x(0).toFixed(1)},${h - padY} Z`;
  const last = points[points.length - 1]!;
  const first = points[0]!;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style="width:100%;height:auto;overflow:visible" role="img"
        aria-label={`Evolución de ${first.value}${unit} a ${last.value}${unit}`}>
        <defs>
          <linearGradient id="dc-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--rosa-400)" stop-opacity="0.26" />
            <stop offset="100%" stop-color="var(--agua-400)" stop-opacity="0.02" />
          </linearGradient>
          <linearGradient id="dc-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="var(--rosa-400)" />
            <stop offset="100%" stop-color="var(--agua-500)" />
          </linearGradient>
        </defs>

        {target != null && target >= lo && target <= hi && (
          <>
            <line
              x1={padX} x2={w - padX} y1={y(target)} y2={y(target)}
              stroke="var(--verde-400)" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.8"
            />
            <text x={w - padX} y={y(target) - 5} text-anchor="end" font-size="9" fill="var(--verde-600)">
              objetivo {target}{unit}
            </text>
          </>
        )}

        <path d={area} fill="url(#dc-area)" />
        <path d={path} fill="none" stroke="url(#dc-line)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />

        {points.map((p, i) =>
          p.value == null ? null : (
            <circle
              key={p.date}
              cx={x(i)}
              cy={y(p.value)}
              r={i === points.length - 1 ? 4.5 : 2.8}
              fill="var(--surface-solid)"
              stroke={i === points.length - 1 ? 'var(--agua-500)' : 'var(--rosa-400)'}
              stroke-width="2.2"
            />
          ),
        )}
      </svg>

      <div class="row-between" style="margin-top:var(--s-2)">
        <span class="t-xs t-mute">
          {formatDayMonthShort(first.date)} · {first.value}{unit}
        </span>
        <span class="t-xs t-bold" style="color:var(--accent-ink)">
          {formatDayMonthShort(last.date)} · {last.value}{unit}
        </span>
      </div>
    </div>
  );
}

/** Barras horizontales con conteo absoluto. Nunca porcentajes. */
export function BarList({
  items,
  total,
}: {
  items: { label: string; count: number; color?: string; emoji?: string }[];
  total: number;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div class="stack-sm">
      {items.map((i) => (
        <div key={i.label} class="row" style="gap:var(--s-3)">
          <span class="t-sm" style="width:92px;flex-shrink:0;color:var(--ink-soft)">
            {i.emoji ? `${i.emoji} ` : ''}{i.label}
          </span>
          <div class="bar-track grow" style="height:14px">
            <div
              class="bar-fill"
              style={`width:${(i.count / max) * 100}%;background:${i.color ?? 'var(--gradient-brand)'}`}
            />
          </div>
          <span class="t-sm t-bold" style="width:26px;text-align:right">{i.count}</span>
        </div>
      ))}
      <p class="t-xs t-mute" style="margin-top:var(--s-1)">Sobre {total} días del periodo.</p>
    </div>
  );
}

/** Barras verticales por semana. */
export function WeekBars({
  weeks,
}: {
  weeks: { label: string; count: number; recorded: number }[];
}) {
  const max = Math.max(1, ...weeks.map((w) => w.count));
  return (
    <div class="row" style="gap:var(--s-3);align-items:flex-end;height:118px">
      {weeks.map((w) => (
        <div key={w.label} class="grow stack-sm" style="align-items:center;gap:6px;height:100%;justify-content:flex-end">
          <span class="t-sm t-bold">{w.count}</span>
          <div
            style={`width:100%;max-width:44px;border-radius:var(--r-xs) var(--r-xs) 4px 4px;
              background:var(--gradient-brand);
              height:${Math.max(4, (w.count / max) * 66)}px;
              transition:height var(--dur-slow) var(--ease-out)`}
          />
          <span class="t-xs t-mute" style="text-align:center;line-height:1.2;font-size:10px">
            {w.label.split(' – ')[0]}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Puntos por día: una fila compacta para ver un mes de un vistazo. */
export function DayDots({
  days,
  valueOf,
}: {
  days: string[];
  valueOf: (date: string) => number | null;
}) {
  const color = (v: number | null) => {
    if (v == null) return 'var(--border)';
    if (v >= 5) return 'var(--verde-400)';
    if (v === 4) return 'var(--agua-300)';
    if (v === 3) return 'var(--ambar-400)';
    if (v === 2) return 'var(--coral-400)';
    return 'var(--coral-500)';
  };

  return (
    <div class="row wrap" style="gap:5px">
      {days.map((d) => (
        <span
          key={d}
          title={d}
          style={`width:13px;height:13px;border-radius:4px;background:${color(valueOf(d))}`}
        />
      ))}
    </div>
  );
}
