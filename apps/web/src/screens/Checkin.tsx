import { useMemo, useState } from 'preact/hooks';
import {
  APPETITE_OPTIONS,
  MOBILITY_OPTIONS,
  OVERALL_STATE,
  SLEEP_OPTIONS,
  STOOL_OPTIONS,
  URINE_OPTIONS,
  WATER_OPTIONS,
  formatDateLong,
  formatRelativeDay,
  localDateOf,
  newId,
  nowIso,
  signsOf,
  type DailyLog,
} from '@dalila/shared';
import { Button, Card, ChoiceGroup, Chip, Field, Header, MultiSelect, Textarea, toast } from '../ui/Kit.js';
import { data, save } from '../data/store.js';
import { back } from '../app/router.js';

/**
 * Check-in diario.
 *
 * Todo es opcional y se guarda al tocar: no hay un botón "Enviar" que se pueda
 * perder. Cada bloque tiene "No noté nada de esto", porque un no-hallazgo
 * registrado vale tanto como un hallazgo — sin eso no se puede distinguir "no
 * pasó" de "no lo anotó", y esa distinción es lo que hace útil el resumen para
 * el veterinario.
 *
 * Nunca se pide "nivel de dolor": sólo observaciones. Ver
 * docs/POLITICA_CONTENIDO_MEDICO.md.
 */
export function CheckinScreen({ date }: { date?: string }) {
  const today = localDateOf();
  const localDate = date ?? today;
  const d = data.value;

  const log = useMemo(
    () => d.dailyLogs.find((l) => !l.deletedAt && l.localDate === localDate) ?? null,
    [d.dailyLogs, localDate],
  );

  const yesterday = useMemo(() => {
    const sorted = d.dailyLogs
      .filter((l) => !l.deletedAt && l.localDate < localDate)
      .sort((a, b) => (a.localDate < b.localDate ? 1 : -1));
    return sorted[0] ?? null;
  }, [d.dailyLogs, localDate]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleExpand = (k: string) => setExpanded((e) => ({ ...e, [k]: !e[k] }));

  const patch = async (fields: Partial<DailyLog>) => {
    await save(
      'dailyLogs',
      log?.id ?? newId('dlg'),
      {
        localDate,
        isRetroactive: localDate !== today,
        ...(log?.morningCheckAt ? {} : { morningCheckAt: nowIso() }),
        eveningCheckAt: nowIso(),
        ...fields,
      },
      'dlg',
    );
  };

  const v = <K extends keyof DailyLog>(k: K): DailyLog[K] | undefined => log?.[k];
  const list = (k: 'mobilitySigns' | 'discomfortSigns' | 'mood' | 'stoolFlags'): string[] =>
    (log?.[k] as string[] | undefined) ?? [];

  return (
    <div class="stack-lg">
      <Header
        title="Check-in"
        subtitle={localDate === today ? formatDateLong(localDate) : `${formatRelativeDay(localDate)} · ${formatDateLong(localDate)}`}
        back={() => back('/')}
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              toast('Guardado ✓');
              back('/');
            }}
          >
            Listo
          </Button>
        }
      />

      {localDate !== today && (
        <div class="badge badge--accent" style="align-self:flex-start">
          Registro de un día anterior
        </div>
      )}

      {/* Estado general */}
      <Card>
        <p class="t-label" style="margin-bottom:var(--s-3)">Estado general</p>
        <div class="row" style="gap:var(--s-2);justify-content:space-between">
          {OVERALL_STATE.map((o) => {
            const on = v('overallState') === o.value;
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={on}
                aria-label={o.label}
                onClick={() => void patch({ overallState: on ? null : (o.value as DailyLog['overallState']) })}
                class="grow"
                style={`display:flex;flex-direction:column;align-items:center;gap:5px;padding:var(--s-2) 2px;
                  border-radius:var(--r-md);transition:all var(--dur) var(--ease);
                  background:${on ? 'var(--brand-soft)' : 'transparent'};
                  border:1.5px solid ${on ? 'var(--brand)' : 'transparent'}`}
              >
                <span style={`font-size:26px;filter:${on ? 'none' : 'saturate(.72) opacity(.72)'}`}>{o.emoji}</span>
                <span class="t-xs" style={`font-weight:${on ? 650 : 500};color:${on ? 'var(--rosa-700)' : 'var(--ink-mute)'};text-align:center;line-height:1.15`}>
                  {o.label}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Movilidad */}
      <Block title="Cómo se movió hoy">
        <ChoiceGroup
          options={MOBILITY_OPTIONS}
          value={v('mobility') as never}
          onChange={(value) => void patch({ mobility: value as DailyLog['mobility'] })}
        />
        {yesterday?.mobility && !v('mobility') && (
          <SuggestFromYesterday
            label={MOBILITY_OPTIONS.find((o) => o.value === yesterday.mobility)?.label ?? ''}
            onApply={() => void patch({ mobility: yesterday.mobility })}
          />
        )}

        <p class="t-sm t-soft" style="margin-top:var(--s-4);margin-bottom:var(--s-2)">
          ¿Notaste algo de esto?
        </p>
        <MultiSelect
          options={signsOf('movilidad').slice(0, expanded['mov'] ? undefined : 6)}
          values={list('mobilitySigns')}
          onChange={(next) => void patch({ mobilitySigns: next })}
        />
        <MoreButton
          expanded={!!expanded['mov']}
          count={signsOf('movilidad').length - 6}
          onClick={() => toggleExpand('mov')}
        />
      </Block>

      {/* Incomodidad */}
      <Block
        title="Señales de incomodidad"
        hint="Cosas que a veces se ven cuando algo le molesta. No es una medida de dolor."
      >
        <MultiSelect
          options={signsOf('incomodidad').slice(0, expanded['inc'] ? undefined : 6)}
          values={list('discomfortSigns')}
          onChange={(next) => void patch({ discomfortSigns: next, noDiscomfortObserved: false })}
        />
        <MoreButton
          expanded={!!expanded['inc']}
          count={signsOf('incomodidad').length - 6}
          onClick={() => toggleExpand('inc')}
        />
        <div style="margin-top:var(--s-3)">
          <Chip
            selected={!!v('noDiscomfortObserved')}
            onToggle={() =>
              void patch({
                noDiscomfortObserved: !v('noDiscomfortObserved'),
                discomfortSigns: [],
              })
            }
          >
            No noté nada de esto
          </Chip>
        </div>
      </Block>

      {/* Apetito y agua */}
      <Block title="Apetito">
        <ChoiceGroup
          options={APPETITE_OPTIONS}
          value={v('appetite') as never}
          onChange={(value) => void patch({ appetite: value as DailyLog['appetite'] })}
        />
      </Block>

      <Block title="Agua">
        <ChoiceGroup
          options={WATER_OPTIONS}
          value={v('water') as never}
          onChange={(value) => void patch({ water: value as DailyLog['water'] })}
        />
      </Block>

      {/* Orina */}
      <Block title="Orina">
        <ChoiceGroup
          options={URINE_OPTIONS}
          value={v('urine') as never}
          onChange={(value) => void patch({ urine: value as DailyLog['urine'] })}
        />
      </Block>

      {/* Heces */}
      <Block title="Heces">
        <ChoiceGroup
          options={STOOL_OPTIONS}
          value={v('stool') as never}
          onChange={(value) => void patch({ stool: value as DailyLog['stool'] })}
        />
        {v('stool') && v('stool') !== 'no_hizo' && (
          <div style="margin-top:var(--s-3)">
            <MultiSelect
              options={signsOf('digestivo')}
              values={list('stoolFlags')}
              onChange={(next) => void patch({ stoolFlags: next })}
            />
          </div>
        )}
      </Block>

      {/* Sueño */}
      <Block title="Sueño">
        <ChoiceGroup
          options={SLEEP_OPTIONS}
          value={v('sleep') as never}
          onChange={(value) => void patch({ sleep: value as DailyLog['sleep'] })}
        />
      </Block>

      {/* Ánimo */}
      <Block title="Estado de ánimo">
        <MultiSelect
          options={signsOf('animo')}
          values={list('mood')}
          onChange={(next) => void patch({ mood: next })}
        />
      </Block>

      {/* Nota libre */}
      <Block title="Algo más que quieras recordar">
        <Field>
          <Textarea
            rows={4}
            value={v('note') ?? ''}
            placeholder="Por la tarde estuvo más activa…"
            onBlur={(e) => void patch({ note: (e.target as HTMLTextAreaElement).value })}
          />
        </Field>
      </Block>

      <Button
        variant="primary"
        size="lg"
        block
        onClick={() => {
          toast('Check-in guardado ✓');
          back('/');
        }}
      >
        Listo
      </Button>

      <p class="t-xs t-mute center" style="padding:0 var(--s-4)">
        Esto no reemplaza la valoración de un veterinario. Sirve para observar mejor a {d.dog?.name ?? 'Dalila'}
        {' '}y llegar con mejor información a su próxima consulta.
      </p>
    </div>
  );
}

function Block({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: preact.ComponentChildren;
}) {
  return (
    <Card>
      <p class="t-label">{title}</p>
      {hint && <p class="t-xs t-soft" style="margin-top:4px;margin-bottom:var(--s-3)">{hint}</p>}
      <div style={hint ? '' : 'margin-top:var(--s-3)'}>{children}</div>
    </Card>
  );
}

function MoreButton({
  expanded,
  count,
  onClick,
}: {
  expanded: boolean;
  count: number;
  onClick: () => void;
}) {
  if (count <= 0) return null;
  return (
    <button
      type="button"
      class="t-sm t-medium"
      style="color:var(--accent-ink);margin-top:var(--s-3)"
      onClick={onClick}
    >
      {expanded ? 'Mostrar menos' : `+ Añadir detalle (${count} más)`}
    </button>
  );
}

/** Sugerencia basada en el último día registrado: acelera el registro diario. */
function SuggestFromYesterday({ label, onApply }: { label: string; onApply: () => void }) {
  if (!label) return null;
  return (
    <button
      type="button"
      class="t-xs"
      style="color:var(--ink-mute);margin-top:var(--s-2);text-align:left"
      onClick={onApply}
    >
      El último día anotaste «{label}». <span style="color:var(--accent-ink);font-weight:600">Usar igual</span>
    </button>
  );
}
