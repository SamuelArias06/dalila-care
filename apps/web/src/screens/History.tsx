import { useMemo, useState } from 'preact/hooks';
import {
  addDays,
  buildTimeline,
  evaluateTrends,
  formatDateLong,
  formatDayMonthShort,
  formatDuration,
  formatMonthYear,
  formatRelativeDay,
  localDateOf,
  signLabel,
  summarizeDay,
  tasksForDay,
  weekdayOf,
} from '@dalila/shared';
import { Button, Card, Empty, Header, Section } from '../ui/Kit.js';
import { IconChart, IconChevronRight, IconStethoscope } from '../ui/Icons.js';
import { data } from '../data/store.js';
import { go } from '../app/router.js';
import { TrendNotices } from '../components/NightSummary.js';

const PAGE = 21;

export function HistoryScreen() {
  const [days, setDays] = useState(PAGE);
  const d = data.value;
  const today = localDateOf();

  const entries = useMemo(
    () => buildTimeline(d, addDays(today, -(days - 1)), today, weekdayOf),
    [d, today, days],
  );

  const notices = useMemo(
    () => evaluateTrends({ dailyLogs: d.dailyLogs, doses: d.doses, weights: d.weights, today }),
    [d, today],
  );

  const withRecords = entries.filter((e) => e.summary.hasAnyRecord || e.moments > 0);

  return (
    <div class="stack-lg">
      <Header
        title="Historial"
        subtitle={`${withRecords.length} de los últimos ${days} días con registro`}
      />

      <div class="row" style="gap:var(--s-2)">
        <button type="button" class="glass grow" style="display:flex;align-items:center;gap:var(--s-2);padding:var(--s-4)" onClick={() => go('/tendencias')}>
          <span style="color:var(--accent-ink)"><IconChart size={20} /></span>
          <span class="t-sm t-medium grow" style="text-align:left">Tendencias</span>
          <IconChevronRight size={16} style="color:var(--ink-mute)" />
        </button>
        <button type="button" class="glass grow" style="display:flex;align-items:center;gap:var(--s-2);padding:var(--s-4)" onClick={() => go('/consulta')}>
          <span style="color:var(--brand)"><IconStethoscope size={20} /></span>
          <span class="t-sm t-medium grow" style="text-align:left">Preparar consulta</span>
          <IconChevronRight size={16} style="color:var(--ink-mute)" />
        </button>
      </div>

      {notices.length > 0 && (
        <Section title="Vale la pena mirar">
          <TrendNotices notices={notices} />
        </Section>
      )}

      {withRecords.length === 0 ? (
        <Empty
          emoji="📖"
          title="Todavía no hay historial"
          body="Cuando registres cómo está Dalila, los días irán apareciendo aquí."
          action={<Button variant="primary" onClick={() => go('/checkin')}>Hacer el primer check-in</Button>}
        />
      ) : (
        <div class="stack">
          {entries.map((e, i) => {
            const prevMonth = i > 0 ? entries[i - 1]!.date.slice(0, 7) : '';
            const showMonth = e.date.slice(0, 7) !== prevMonth;
            return (
              <div key={e.date}>
                {showMonth && (
                  <p class="t-label" style="margin:var(--s-4) 2px var(--s-2);text-transform:uppercase">
                    {formatMonthYear(e.date)}
                  </p>
                )}
                <DayCard date={e.date} moments={e.moments} />
              </div>
            );
          })}
          {days < 400 && (
            <Button variant="quiet" block onClick={() => setDays((n) => n + PAGE)}>
              Ver días anteriores
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function DayCard({ date, moments }: { date: string; moments: number }) {
  const d = data.value;
  const s = useMemo(() => summarizeDay(d, date, weekdayOf(date)), [d, date]);
  const today = localDateOf();

  if (!s.hasAnyRecord && moments === 0) {
    return (
      <button
        type="button"
        class="row"
        style="width:100%;padding:var(--s-3) var(--s-4);opacity:.62;gap:var(--s-3);text-align:left"
        onClick={() => go(`/checkin/${date}`)}
      >
        <span class="t-sm t-mute grow" style="text-transform:capitalize">
          {formatRelativeDay(date, today)} · sin registro
        </span>
        <span class="t-xs" style="color:var(--accent-ink);font-weight:600">+ Añadir</span>
      </button>
    );
  }

  const bits: string[] = [];
  if (s.meals.eaten + s.meals.partial + s.meals.refused > 0) {
    bits.push(
      s.meals.refused === 0 && s.meals.partial === 0
        ? `🥣 Comió ${s.meals.eaten === 1 ? 'su comida' : 'sus comidas'}`
        : `🥣 ${s.meals.eaten} de ${s.meals.eaten + s.meals.partial + s.meals.refused}`,
    );
  }
  if (s.dosesTotal > 0) bits.push(`💊 ${s.dosesGiven}/${s.dosesTotal}`);
  if (s.activityMinutes > 0) bits.push(`🐕 ${formatDuration(s.activityMinutes)}`);
  if (s.videoCount > 0) bits.push(`📹 ${s.videoCount}`);
  if (s.photoCount > 0) bits.push(`📸 ${s.photoCount}`);
  if (moments > 0) bits.push(`❤️ ${moments}`);
  if (s.tasksTotal > 0) bits.push(`✅ ${s.tasksDone}/${s.tasksTotal}`);

  return (
    <button
      type="button"
      class="glass"
      style="width:100%;padding:var(--s-4) var(--s-5);text-align:left;display:block"
      onClick={() => go(`/dia/${date}`)}
    >
      <div class="row-between" style="margin-bottom:var(--s-2)">
        <span class="t-sm t-bold" style="text-transform:capitalize">
          {formatRelativeDay(date, today)}
        </span>
        <span class="t-xs t-mute">{formatDayMonthShort(date)}</span>
      </div>

      {s.overallState != null && (
        <p class="t-body t-medium" style="margin-bottom:var(--s-2)">
          {s.overallEmoji} {s.overallLabel}
        </p>
      )}

      {bits.length > 0 && (
        <p class="t-sm t-soft" style="margin-bottom:var(--s-1)">{bits.join('  ·  ')}</p>
      )}

      {s.mobilitySignLabels.length > 0 && (
        <p class="t-xs" style="color:var(--warn);margin-top:var(--s-1)">
          {s.mobilitySignLabels.slice(0, 2).join(' · ')}
          {s.mobilitySignLabels.length > 2 ? ` +${s.mobilitySignLabels.length - 2}` : ''}
        </p>
      )}

      {s.concernCount > 0 && (
        <p class="t-xs" style="color:var(--alert);margin-top:var(--s-1)">
          ⚠️ {s.concernCount} {s.concernCount === 1 ? 'preocupación registrada' : 'preocupaciones registradas'}
        </p>
      )}

      {s.note && (
        <p class="t-sm" style="margin-top:var(--s-2);font-style:italic;color:var(--ink-soft)">
          "{s.note.length > 110 ? `${s.note.slice(0, 110)}…` : s.note}"
        </p>
      )}
    </button>
  );
}

// ── Detalle de un día ────────────────────────────────────────────────────────

export function DayDetailScreen({ date }: { date: string }) {
  const d = data.value;
  const s = useMemo(() => summarizeDay(d, date, weekdayOf(date)), [d, date]);
  const log = d.dailyLogs.find((l) => !l.deletedAt && l.localDate === date) ?? null;
  const dayTasks = tasksForDay(d.tasks, d.completions, date, weekdayOf(date));
  const doses = d.doses.filter((x) => !x.deletedAt && x.localDate === date);
  const feeds = d.feedingLogs.filter((x) => !x.deletedAt && x.localDate === date);
  const acts = d.activities.filter((x) => !x.deletedAt && x.localDate === date);
  const evs = d.events.filter((x) => !x.deletedAt && x.localDate === date);
  const media = d.media.filter((x) => !x.deletedAt && x.localDate === date);
  const moments = d.moments.filter((x) => !x.deletedAt && x.localDate === date);

  return (
    <div class="stack-lg">
      <Header
        title={formatRelativeDay(date)}
        subtitle={formatDateLong(date, true)}
        back="/historial"
        action={
          <Button variant="ghost" size="sm" onClick={() => go(`/checkin/${date}`)}>
            Editar
          </Button>
        }
      />

      {log?.overallState != null && (
        <Card>
          <p class="t-label">Estado general</p>
          <p class="t-heading" style="margin-top:var(--s-2)">
            {s.overallEmoji} {s.overallLabel}
          </p>
        </Card>
      )}

      {log && (
        <Card>
          <p class="t-label" style="margin-bottom:var(--s-3)">Lo que anotaste</p>
          <div class="stack-sm">
            <Detail label="Movilidad" value={log.mobility ? mobilityLabel(log.mobility) : ''} />
            {log.mobilitySigns.length > 0 && (
              <Detail label="Observaciones" value={log.mobilitySigns.map(signLabel).join(' · ')} />
            )}
            {log.discomfortSigns.length > 0 && (
              <Detail label="Señales de incomodidad" value={log.discomfortSigns.map(signLabel).join(' · ')} />
            )}
            {log.noDiscomfortObserved && <Detail label="Incomodidad" value="No se notó nada" />}
            <Detail label="Apetito" value={log.appetite ?? ''} />
            <Detail label="Agua" value={log.water ?? ''} />
            <Detail label="Orina" value={log.urine ?? ''} />
            <Detail label="Heces" value={log.stool ?? ''} />
            <Detail label="Sueño" value={log.sleep ?? ''} />
            {log.mood.length > 0 && <Detail label="Ánimo" value={log.mood.map(signLabel).join(' · ')} />}
          </div>
          {log.note && (
            <div style="margin-top:var(--s-4);padding:var(--s-4);border-radius:var(--r-md);background:var(--surface-sunken);border-left:3px solid var(--brand)">
              <p class="t-body" style="font-style:italic;color:var(--ink-soft)">"{log.note}"</p>
            </div>
          )}
        </Card>
      )}

      {dayTasks.length > 0 && (
        <Section title="Rutina">
          <Card pad={false}>
            <div class="list">
              {dayTasks.map((t) => (
                <div key={t.task.id} class="list-item">
                  <span style="width:24px">{t.done ? '✅' : t.completion?.status === 'omitida' ? '➖' : '⬜'}</span>
                  <span class="grow t-body">{t.completion?.titleSnapshot || t.task.title}</span>
                  {t.completion?.completedAt && (
                    <span class="t-xs t-mute">{t.completion.completedAt.slice(11, 16)}</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </Section>
      )}

      {doses.length > 0 && (
        <Section title="Medicamentos">
          <Card pad={false}>
            <div class="list">
              {doses.map((x) => (
                <div key={x.id} class="list-item">
                  <span style="width:24px">{doseIcon(x.status)}</span>
                  <span class="grow">
                    <span class="t-body" style="display:block">{x.medicationNameSnapshot}</span>
                    <span class="t-xs t-soft">{x.doseTextSnapshot}</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      )}

      {feeds.length > 0 && (
        <Section title="Alimentación">
          <Card pad={false}>
            <div class="list">
              {feeds.map((x) => (
                <div key={x.id} class="list-item">
                  <span style="width:24px">
                    {x.result === 'comio_todo' ? '✅' : x.result === 'comio_parcial' ? '➖' : '❌'}
                  </span>
                  <span class="grow">
                    <span class="t-body" style="display:block">{x.foodNameSnapshot}</span>
                    {x.reaction && x.reaction !== 'ninguna' && (
                      <span class="t-xs" style="color:var(--warn)">Reacción anotada: {x.reaction}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      )}

      {acts.length > 0 && (
        <Section title="Actividad">
          <Card pad={false}>
            <div class="list">
              {acts.map((x) => (
                <div key={x.id} class="list-item">
                  <span style="width:24px">🐕</span>
                  <span class="grow">
                    <span class="t-body" style="display:block">
                      {x.type === 'paseo' ? 'Paseo' : x.type} · {formatDuration(x.durationMin ?? 0)}
                    </span>
                    {(x.neededToStop || x.neededHelp) && (
                      <span class="t-xs" style="color:var(--warn)">
                        {x.neededToStop ? 'Necesitó detenerse' : ''}
                        {x.neededToStop && x.neededHelp ? ' · ' : ''}
                        {x.neededHelp ? 'Necesitó ayuda' : ''}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      )}

      {evs.length > 0 && (
        <Section title="Eventos">
          <div class="stack-sm">
            {evs.map((x) => (
              <Card key={x.id}>
                <div class="row-between">
                  <span class="t-body t-bold">{x.category}</span>
                  <span class="t-xs t-mute">{x.occurredAt?.slice(11, 16)}</span>
                </div>
                {x.description && <p class="t-sm t-soft" style="margin-top:var(--s-2)">{x.description}</p>}
                {x.triageLevel && (
                  <p class="t-xs" style="margin-top:var(--s-2);color:var(--ink-mute)">
                    La app sugirió: {x.triageLevel.replace('_', ' ')}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </Section>
      )}

      {(media.length > 0 || moments.length > 0) && (
        <Section title="Fotos y vídeos">
          <div class="scroll-x">
            {media.map((m) => (
              <div key={m.id} style="width:132px">
                {m.posterDataUrl ? (
                  <img
                    src={m.posterDataUrl}
                    alt=""
                    style="width:132px;height:132px;object-fit:cover;border-radius:var(--r-md)"
                  />
                ) : (
                  <div class="glass" style="width:132px;height:132px;display:grid;place-items:center;font-size:26px">
                    {m.kind === 'video' ? '📹' : m.kind === 'foto' ? '📸' : '📄'}
                  </div>
                )}
                {m.note && <p class="t-xs t-soft" style="margin-top:4px">{m.note.slice(0, 40)}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {moments.length > 0 && (
        <Section title="Momentos">
          <div class="stack-sm">
            {moments.map((m) => (
              <Card key={m.id}>
                <p class="t-body">❤️ {m.text}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div class="row" style="align-items:flex-start;gap:var(--s-3)">
      <span class="t-sm t-mute" style="width:112px;flex-shrink:0">{label}</span>
      <span class="t-sm grow" style="text-transform:capitalize">{value.replace(/_/g, ' ')}</span>
    </div>
  );
}

function mobilityLabel(v: string): string {
  return (
    {
      mejor: 'Mejor que otros días',
      normal_para_ella: 'Normal para ella',
      algo_peor: 'Algo peor',
      bastante_peor: 'Bastante peor',
    }[v] ?? v
  );
}

function doseIcon(status: string): string {
  return { administrado: '✅', omitido: '❌', administrado_tarde: '⏰', posible_reaccion: '🤢' }[status] ?? '·';
}
