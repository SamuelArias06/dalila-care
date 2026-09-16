import { useMemo, useState } from 'preact/hooks';
import {
  adherence,
  compareWeeksSentence,
  hasDiscomfort,
  hasLowAppetite,
  hasMobilityDifficulty,
  lastNDays,
  localDateOf,
  stateDistribution,
  weeklyCounts,
  weightSeries,
  activitySeries,
  addDays,
  formatDayMonthShort,
} from '@dalila/shared';
import { Card, Empty, Header, Notice, Section, Segmented } from '../ui/Kit.js';
import { data } from '../data/store.js';
import { BarList, DayDots, LineChart, WeekBars } from '../components/Charts.js';

const RANGES = [
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
  { value: 90, label: '3 meses' },
] as const;

export function TrendsScreen() {
  const [range, setRange] = useState<number>(30);
  const d = data.value;
  const today = localDateOf();
  const days = useMemo(() => lastNDays(range, today), [range, today]);

  const states = useMemo(() => stateDistribution(d.dailyLogs, days), [d.dailyLogs, days]);
  const weeks = Math.min(4, Math.max(2, Math.ceil(range / 7)));

  const mobility = useMemo(
    () => weeklyCounts(d.dailyLogs, today, weeks, hasMobilityDifficulty),
    [d.dailyLogs, today, weeks],
  );
  const discomfort = useMemo(
    () => weeklyCounts(d.dailyLogs, today, weeks, hasDiscomfort),
    [d.dailyLogs, today, weeks],
  );
  const appetite = useMemo(
    () => weeklyCounts(d.dailyLogs, today, weeks, hasLowAppetite),
    [d.dailyLogs, today, weeks],
  );

  const weights = useMemo(() => weightSeries(d.weights, addDays(today, -range), today), [d.weights, today, range]);
  const activity = useMemo(() => activitySeries(d.activities, days), [d.activities, days]);
  const meds = useMemo(() => adherence(d.doses, days), [d.doses, days]);

  const logByDate = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const l of d.dailyLogs) {
      if (!l.deletedAt) map.set(l.localDate, l.overallState ?? null);
    }
    return map;
  }, [d.dailyLogs]);

  if (states.daysRecorded === 0) {
    return (
      <div class="stack-lg">
        <Header title="Tendencias" back="/historial" />
        <Empty
          emoji="📈"
          title="Aún no hay suficientes registros"
          body="Cuando lleves unos días registrando cómo está Dalila, aquí verás cómo ha ido."
        />
      </div>
    );
  }

  const totalActivity = activity.reduce((s, p) => s + (p.value ?? 0), 0);
  const activeDays = activity.filter((p) => (p.value ?? 0) > 0).length;

  return (
    <div class="stack-lg">
      <Header title="Así ha estado Dalila" back="/historial" />

      <Segmented options={RANGES} value={range} onChange={setRange} />

      {/* Estado general */}
      <Section title="Estado general">
        <Card>
          <BarList
            items={states.buckets.map((b) => ({
              label: b.label,
              count: b.count,
              emoji: b.emoji,
              color:
                b.value >= 5 ? 'var(--verde-400)'
                : b.value === 4 ? 'var(--agua-400)'
                : b.value === 3 ? 'var(--ambar-400)'
                : 'var(--coral-400)',
            }))}
            total={states.daysInRange}
          />
          <p class="t-sm t-soft" style="margin-top:var(--s-4)">
            Registraste {states.daysRecorded} de {states.daysInRange} días.
            {states.noRecord > 0 ? ` En ${states.noRecord} no hay registro.` : ''}
          </p>

          <div style="margin-top:var(--s-4)">
            <p class="t-xs t-mute" style="margin-bottom:var(--s-2)">Día a día</p>
            <DayDots days={days} valueOf={(date) => logByDate.get(date) ?? null} />
          </div>
        </Card>
      </Section>

      {/* Movilidad */}
      <Section title="Movilidad">
        <Card>
          <p class="t-sm t-soft" style="margin-bottom:var(--s-4)">
            Días con alguna dificultad anotada, por semana
          </p>
          <WeekBars weeks={mobility} />
          {mobility.length >= 2 && (
            <p class="t-sm" style="margin-top:var(--s-4);color:var(--ink-soft)">
              {compareWeeksSentence(
                mobility[mobility.length - 1]!.count,
                mobility[mobility.length - 2]!.count,
                'con dificultad para moverse',
              )}
            </p>
          )}
        </Card>
      </Section>

      {/* Incomodidad */}
      <Section title="Señales de incomodidad">
        <Card>
          <p class="t-sm t-soft" style="margin-bottom:var(--s-4)">Días con alguna señal anotada, por semana</p>
          <WeekBars weeks={discomfort} />
        </Card>
      </Section>

      {/* Apetito */}
      <Section title="Apetito">
        <Card>
          <p class="t-sm t-soft" style="margin-bottom:var(--s-4)">Días con menos apetito, por semana</p>
          <WeekBars weeks={appetite} />
        </Card>
      </Section>

      {/* Peso */}
      {weights.length >= 2 && (
        <Section title="Peso">
          <Card>
            <LineChart points={weights} unit=" kg" target={d.dog?.targetWeightKg ?? null} />
          </Card>
        </Section>
      )}

      {/* Actividad */}
      {totalActivity > 0 && (
        <Section title="Actividad">
          <Card>
            <p class="t-heading">{totalActivity} min</p>
            <p class="t-sm t-soft" style="margin-top:2px">
              en total, repartidos en {activeDays} {activeDays === 1 ? 'día' : 'días'} del periodo
            </p>
            <div style="margin-top:var(--s-4)">
              <div class="row" style="gap:3px;align-items:flex-end;height:64px">
                {activity.slice(-30).map((p) => {
                  const max = Math.max(1, ...activity.map((x) => x.value ?? 0));
                  return (
                    <div
                      key={p.date}
                      title={`${formatDayMonthShort(p.date)}: ${p.value ?? 0} min`}
                      class="grow"
                      style={`border-radius:3px 3px 1px 1px;min-height:3px;
                        background:${(p.value ?? 0) > 0 ? 'var(--gradient-brand)' : 'var(--border)'};
                        height:${Math.max(3, ((p.value ?? 0) / max) * 60)}px`}
                    />
                  );
                })}
              </div>
            </div>
          </Card>
        </Section>
      )}

      {/* Medicación */}
      {meds.total > 0 && (
        <Section title="Medicación registrada">
          <Card>
            <p class="t-heading">
              {meds.given} de {meds.total}
            </p>
            <p class="t-sm t-soft" style="margin-top:2px">tomas registradas en el periodo</p>
            <div class="row wrap" style="gap:var(--s-2);margin-top:var(--s-3)">
              {meds.omitted > 0 && <span class="badge badge--alert">{meds.omitted} omitidas</span>}
              {meds.late > 0 && <span class="badge badge--warn">{meds.late} tarde</span>}
              {meds.reactions > 0 && <span class="badge badge--alert">{meds.reactions} posible reacción</span>}
              {meds.omitted === 0 && meds.late === 0 && <span class="badge badge--ok">Sin omisiones</span>}
            </div>
          </Card>
        </Section>
      )}

      <Notice tone="info">
        Estos números describen lo que registraste. No explican por qué pasó ni si un tratamiento
        está funcionando: eso lo valora su veterinario.
      </Notice>
    </div>
  );
}
