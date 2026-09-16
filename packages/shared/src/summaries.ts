/**
 * Resúmenes y tendencias.
 *
 * Regla que gobierna todo este archivo: **describe lo registrado, nunca lo
 * interpreta.** Frecuencias absolutas con su denominador, jamás porcentajes de
 * cambio, jamás conclusiones sobre si algo está funcionando.
 * Ver docs/POLITICA_CONTENIDO_MEDICO.md.
 */

import {
  addDays,
  compareDates,
  eachDay,
  formatDayMonthShort,
  lastNDays,
  type LocalDate,
} from './dates.js';
import { overallStateEmoji, overallStateLabel, signLabel } from './catalogs.js';
import type {
  ActivityLog,
  CareEvent,
  DailyLog,
  DalilaData,
  FeedingLog,
  MedicationDose,
  MediaItem,
  RoutineTask,
  TaskCompletion,
  WeightEntry,
} from './types.js';

const alive = <T extends { deletedAt?: string }>(x: T): boolean => !x.deletedAt;

// ── Tareas del día ───────────────────────────────────────────────────────────

export interface DayTask {
  task: RoutineTask;
  completion: TaskCompletion | null;
  done: boolean;
}

/** Tareas que aplican a un día concreto, ya emparejadas con su registro. */
export function tasksForDay(
  tasks: RoutineTask[],
  completions: TaskCompletion[],
  date: LocalDate,
  weekday: number,
): DayTask[] {
  const byTask = new Map<string, TaskCompletion>();
  for (const c of completions) {
    if (!alive(c) || c.localDate !== date) continue;
    byTask.set(c.taskId, c);
  }
  return tasks
    .filter(alive)
    .filter((t) => t.active)
    .filter((t) => !t.daysOfWeek?.length || t.daysOfWeek.includes(weekday))
    .sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? '') || a.order - b.order)
    .map((task) => {
      const completion = byTask.get(task.id) ?? null;
      return { task, completion, done: completion?.status === 'hecha' };
    });
}

// ── Resumen de un día ────────────────────────────────────────────────────────

export interface DaySummary {
  date: LocalDate;
  hasAnyRecord: boolean;
  overallState: number | null;
  overallLabel: string;
  overallEmoji: string;
  tasksDone: number;
  tasksTotal: number;
  dosesGiven: number;
  dosesTotal: number;
  meals: { eaten: number; partial: number; refused: number };
  activityMinutes: number;
  videoCount: number;
  photoCount: number;
  eventCount: number;
  concernCount: number;
  note: string;
  mobilitySignLabels: string[];
  discomfortSignLabels: string[];
}

export function summarizeDay(data: DalilaData, date: LocalDate, weekday: number): DaySummary {
  const log = data.dailyLogs.find((l) => alive(l) && l.localDate === date) ?? null;
  const dayTasks = tasksForDay(data.tasks, data.completions, date, weekday);
  const doses = data.doses.filter((d) => alive(d) && d.localDate === date);
  const feedings = data.feedingLogs.filter((f) => alive(f) && f.localDate === date);
  const activities = data.activities.filter((a) => alive(a) && a.localDate === date);
  const media = data.media.filter((m) => alive(m) && m.localDate === date);
  const events = data.events.filter((e) => alive(e) && e.localDate === date);

  const tasksDone = dayTasks.filter((t) => t.done).length;
  const dosesGiven = doses.filter((d) => d.status === 'administrado' || d.status === 'administrado_tarde').length;

  return {
    date,
    hasAnyRecord:
      !!log || tasksDone > 0 || doses.length > 0 || feedings.length > 0 || activities.length > 0 ||
      media.length > 0 || events.length > 0,
    overallState: log?.overallState ?? null,
    overallLabel: overallStateLabel(log?.overallState),
    overallEmoji: overallStateEmoji(log?.overallState),
    tasksDone,
    tasksTotal: dayTasks.length,
    dosesGiven,
    dosesTotal: doses.length,
    meals: {
      eaten: feedings.filter((f) => f.result === 'comio_todo').length,
      partial: feedings.filter((f) => f.result === 'comio_parcial').length,
      refused: feedings.filter((f) => f.result === 'no_quiso').length,
    },
    activityMinutes: activities.reduce((s, a) => s + (a.durationMin ?? 0), 0),
    videoCount: media.filter((m) => m.kind === 'video').length,
    photoCount: media.filter((m) => m.kind === 'foto').length,
    eventCount: events.length,
    concernCount: events.filter((e) => e.isConcern).length,
    note: log?.note ?? '',
    mobilitySignLabels: (log?.mobilitySigns ?? []).map(signLabel),
    discomfortSignLabels: (log?.discomfortSigns ?? []).map(signLabel),
  };
}

// ── Resumen nocturno ─────────────────────────────────────────────────────────

export interface NightLine {
  emoji: string;
  label: string;
  value: string;
}

export interface NightSummary {
  lines: NightLine[];
  note: string;
  closing: string;
  routineComplete: boolean;
}

/**
 * "Hoy con Dalila". Sólo incluye líneas con contenido real: una lista llena de
 * "0" o "sin datos" haría sentir mal a quien tuvo un día difícil.
 */
export function nightSummary(s: DaySummary): NightSummary {
  const lines: NightLine[] = [];

  if (s.overallState != null) {
    lines.push({ emoji: s.overallEmoji, label: 'Estado general', value: s.overallLabel });
  }

  const mealsTotal = s.meals.eaten + s.meals.partial + s.meals.refused;
  if (mealsTotal > 0) {
    const value =
      s.meals.refused === 0 && s.meals.partial === 0
        ? `Comió ${s.meals.eaten === 1 ? 'su comida' : `sus ${s.meals.eaten} comidas`}`
        : `${s.meals.eaten} completa${s.meals.eaten === 1 ? '' : 's'}` +
          (s.meals.partial ? `, ${s.meals.partial} parcial${s.meals.partial === 1 ? '' : 'es'}` : '') +
          (s.meals.refused ? `, ${s.meals.refused} sin comer` : '');
    lines.push({ emoji: '🍽', label: 'Alimentación', value });
  }

  if (s.dosesTotal > 0) {
    lines.push({
      emoji: '💊',
      label: 'Medicamentos',
      value: s.dosesGiven === s.dosesTotal ? 'Completos' : `${s.dosesGiven} de ${s.dosesTotal}`,
    });
  }

  if (s.activityMinutes > 0) {
    lines.push({ emoji: '🐕', label: 'Actividad', value: `${s.activityMinutes} min` });
  }

  if (s.videoCount > 0) {
    lines.push({
      emoji: '📹',
      label: 'Vídeos',
      value: s.videoCount === 1 ? 'Grabaste 1 vídeo' : `Grabaste ${s.videoCount} vídeos`,
    });
  }

  if (s.photoCount > 0) {
    lines.push({
      emoji: '📸',
      label: 'Fotos',
      value: s.photoCount === 1 ? '1 foto' : `${s.photoCount} fotos`,
    });
  }

  if (s.tasksTotal > 0) {
    lines.push({
      emoji: '✅',
      label: 'Rutina',
      value: s.tasksDone === s.tasksTotal ? 'Completa' : `${s.tasksDone} de ${s.tasksTotal}`,
    });
  }

  const routineComplete = s.tasksTotal > 0 && s.tasksDone === s.tasksTotal;
  const hard = s.overallState != null && s.overallState <= 2;

  let closing: string;
  if (hard) closing = 'Hoy fue un día difícil. Lo registraste, y eso ayuda. Mañana es otro día ❤️';
  else if (routineComplete) closing = 'Dalila tuvo su rutina completa hoy. Descansen ❤️';
  else closing = 'Descansen ❤️';

  return { lines, note: s.note, closing, routineComplete };
}

// ── Tendencias ───────────────────────────────────────────────────────────────

export interface StateDistribution {
  buckets: { value: number; label: string; emoji: string; count: number }[];
  noRecord: number;
  daysInRange: number;
  daysRecorded: number;
}

export function stateDistribution(logs: DailyLog[], days: LocalDate[]): StateDistribution {
  const byDate = new Map(logs.filter(alive).map((l) => [l.localDate, l]));
  const counts = new Map<number, number>();
  let recorded = 0;
  for (const d of days) {
    const v = byDate.get(d)?.overallState ?? null;
    if (v != null) {
      counts.set(v, (counts.get(v) ?? 0) + 1);
      recorded++;
    }
  }
  return {
    buckets: [5, 4, 3, 2, 1].map((value) => ({
      value,
      label: overallStateLabel(value),
      emoji: overallStateEmoji(value),
      count: counts.get(value) ?? 0,
    })),
    noRecord: days.length - recorded,
    daysInRange: days.length,
    daysRecorded: recorded,
  };
}

export interface WeeklyCount {
  label: string;
  from: LocalDate;
  to: LocalDate;
  count: number;
  recorded: number;
}

/** Agrupa en semanas hacia atrás desde `end`, la más antigua primero. */
export function weeklyCounts(
  logs: DailyLog[],
  end: LocalDate,
  weeks: number,
  predicate: (l: DailyLog) => boolean,
): WeeklyCount[] {
  const byDate = new Map(logs.filter(alive).map((l) => [l.localDate, l]));
  const out: WeeklyCount[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const to = addDays(end, -7 * w);
    const from = addDays(to, -6);
    let count = 0;
    let recorded = 0;
    for (const d of eachDay(from, to)) {
      const log = byDate.get(d);
      if (!log) continue;
      recorded++;
      if (predicate(log)) count++;
    }
    out.push({
      label: `${formatDayMonthShort(from)} – ${formatDayMonthShort(to)}`,
      from,
      to,
      count,
      recorded,
    });
  }
  return out;
}

export function hasMobilityDifficulty(l: DailyLog): boolean {
  return l.mobility === 'algo_peor' || l.mobility === 'bastante_peor' || (l.mobilitySigns?.length ?? 0) > 0;
}

export function hasDiscomfort(l: DailyLog): boolean {
  return (l.discomfortSigns?.length ?? 0) > 0;
}

export function hasLowAppetite(l: DailyLog): boolean {
  return l.appetite === 'menos' || l.appetite === 'rechazo';
}

export interface SeriesPoint {
  date: LocalDate;
  value: number | null;
}

export function weightSeries(weights: WeightEntry[], from: LocalDate, to: LocalDate): SeriesPoint[] {
  return weights
    .filter((w) => alive(w) && compareDates(w.localDate, from) >= 0 && compareDates(w.localDate, to) <= 0)
    .sort((a, b) => compareDates(a.localDate, b.localDate))
    .map((w) => ({ date: w.localDate, value: w.weightKg }));
}

export function activitySeries(activities: ActivityLog[], days: LocalDate[]): SeriesPoint[] {
  const byDate = new Map<string, number>();
  for (const a of activities) {
    if (!alive(a)) continue;
    byDate.set(a.localDate, (byDate.get(a.localDate) ?? 0) + (a.durationMin ?? 0));
  }
  return days.map((date) => ({ date, value: byDate.get(date) ?? 0 }));
}

export interface AdherenceSummary {
  given: number;
  total: number;
  omitted: number;
  late: number;
  reactions: number;
}

export function adherence(doses: MedicationDose[], days: LocalDate[]): AdherenceSummary {
  const set = new Set(days);
  const inRange = doses.filter((d) => alive(d) && set.has(d.localDate));
  return {
    given: inRange.filter((d) => d.status === 'administrado' || d.status === 'administrado_tarde').length,
    total: inRange.length,
    omitted: inRange.filter((d) => d.status === 'omitido').length,
    late: inRange.filter((d) => d.status === 'administrado_tarde').length,
    reactions: inRange.filter((d) => d.status === 'posible_reaccion').length,
  };
}

/**
 * Frase descriptiva comparando dos semanas. Nunca dice si eso es bueno o malo.
 */
export function compareWeeksSentence(current: number, previous: number, what: string): string {
  if (current === previous) {
    return `Esta semana registraste los mismos días ${what} que la semana anterior (${current}).`;
  }
  const more = current > previous;
  return (
    `Esta semana registraste ${current} ${current === 1 ? 'día' : 'días'} ${what}, ` +
    `${more ? 'frente a' : 'frente a'} ${previous} la semana anterior.`
  );
}

// ── Línea de tiempo ──────────────────────────────────────────────────────────

export interface TimelineEntry {
  date: LocalDate;
  summary: DaySummary;
  moments: number;
}

export function buildTimeline(
  data: DalilaData,
  from: LocalDate,
  to: LocalDate,
  weekdayOf: (d: LocalDate) => number,
): TimelineEntry[] {
  return eachDay(from, to)
    .reverse()
    .map((date) => ({
      date,
      summary: summarizeDay(data, date, weekdayOf(date)),
      moments: data.moments.filter((m) => alive(m) && m.localDate === date).length,
    }));
}

// ── Datos para "Preparar consulta" ───────────────────────────────────────────

export interface ConsultReport {
  from: LocalDate;
  to: LocalDate;
  daysInRange: number;
  daysRecorded: number;
  states: StateDistribution;
  weeklyMobility: WeeklyCount[];
  mobilitySignCounts: { label: string; count: number; neuro: boolean }[];
  discomfortSignCounts: { label: string; count: number }[];
  appetite: { normal: number; less: number; more: number; refused: number };
  water: { normal: number; less: number; more: number };
  urine: { normal: number; abnormal: number; details: string[] };
  stool: { normal: number; abnormal: number; bloodSeen: boolean };
  activity: { sessions: number; totalMinutes: number; avgMinutes: number; neededToStop: number; neededHelp: number };
  adherence: AdherenceSummary;
  weights: SeriesPoint[];
  events: CareEvent[];
  firstTimeSigns: { label: string; date: LocalDate }[];
}

export function buildConsultReport(
  data: DalilaData,
  from: LocalDate,
  to: LocalDate,
): ConsultReport {
  const days = eachDay(from, to);
  const set = new Set(days);
  const logs = data.dailyLogs.filter((l) => alive(l) && set.has(l.localDate));

  const countSigns = (pick: (l: DailyLog) => string[]) => {
    const counts = new Map<string, number>();
    for (const l of logs) for (const s of pick(l) ?? []) counts.set(s, (counts.get(s) ?? 0) + 1);
    return counts;
  };

  const mobCounts = countSigns((l) => l.mobilitySigns);
  const discCounts = countSigns((l) => l.discomfortSigns);

  // Signos que aparecen por primera vez dentro del periodo (marcados con ⚠ en
  // el reporte). Es puramente factual: antes no estaba anotado.
  const before = data.dailyLogs.filter((l) => alive(l) && compareDates(l.localDate, from) < 0);
  const seenBefore = new Set<string>();
  for (const l of before) for (const s of [...(l.mobilitySigns ?? []), ...(l.discomfortSigns ?? [])]) seenBefore.add(s);

  const firstTimeSigns: { label: string; date: LocalDate }[] = [];
  const sortedLogs = [...logs].sort((a, b) => compareDates(a.localDate, b.localDate));
  const seenNow = new Set<string>();
  for (const l of sortedLogs) {
    for (const s of [...(l.mobilitySigns ?? []), ...(l.discomfortSigns ?? [])]) {
      if (!seenBefore.has(s) && !seenNow.has(s)) {
        seenNow.add(s);
        firstTimeSigns.push({ label: signLabel(s), date: l.localDate });
      }
    }
  }

  const activities = data.activities.filter((a) => alive(a) && set.has(a.localDate));
  const totalMinutes = activities.reduce((s, a) => s + (a.durationMin ?? 0), 0);

  const urineAbnormal = logs.filter((l) => l.urine && l.urine !== 'normal');
  const stoolAbnormal = logs.filter((l) => l.stool && l.stool !== 'normal' && l.stool !== 'no_hizo');

  return {
    from,
    to,
    daysInRange: days.length,
    daysRecorded: logs.length,
    states: stateDistribution(data.dailyLogs, days),
    weeklyMobility: weeklyCounts(data.dailyLogs, to, Math.min(4, Math.ceil(days.length / 7)), hasMobilityDifficulty),
    mobilitySignCounts: [...mobCounts.entries()]
      .map(([id, count]) => ({
        label: signLabel(id),
        count,
        neuro: id === 'mov_arrastra_unas' || id === 'mov_voltea_pata' || id === 'mov_pierde_equilibrio',
      }))
      .sort((a, b) => b.count - a.count),
    discomfortSignCounts: [...discCounts.entries()]
      .map(([id, count]) => ({ label: signLabel(id), count }))
      .sort((a, b) => b.count - a.count),
    appetite: {
      normal: logs.filter((l) => l.appetite === 'normal').length,
      less: logs.filter((l) => l.appetite === 'menos').length,
      more: logs.filter((l) => l.appetite === 'mas').length,
      refused: logs.filter((l) => l.appetite === 'rechazo').length,
    },
    water: {
      normal: logs.filter((l) => l.water === 'normal').length,
      less: logs.filter((l) => l.water === 'menos').length,
      more: logs.filter((l) => l.water === 'mas').length,
    },
    urine: {
      normal: logs.filter((l) => l.urine === 'normal').length,
      abnormal: urineAbnormal.length,
      details: urineAbnormal.map((l) => `${formatDayMonthShort(l.localDate)}: ${l.urine}`),
    },
    stool: {
      normal: logs.filter((l) => l.stool === 'normal').length,
      abnormal: stoolAbnormal.length,
      bloodSeen: logs.some((l) => (l.stoolFlags ?? []).includes('dig_sangre')),
    },
    activity: {
      sessions: activities.length,
      totalMinutes,
      avgMinutes: activities.length ? Math.round(totalMinutes / activities.length) : 0,
      neededToStop: activities.filter((a) => a.neededToStop).length,
      neededHelp: activities.filter((a) => a.neededHelp).length,
    },
    adherence: adherence(data.doses, days),
    weights: weightSeries(data.weights, from, to),
    events: data.events
      .filter((e) => alive(e) && set.has(e.localDate))
      .sort((a, b) => compareDates(a.localDate, b.localDate)),
    firstTimeSigns,
  };
}

// ── Utilidades varias ────────────────────────────────────────────────────────

export function mediaForDay(media: MediaItem[], date: LocalDate): MediaItem[] {
  return media.filter((m) => alive(m) && m.localDate === date);
}

export function feedingToleranceFor(logs: FeedingLog[], foodId: string): { total: number; withReaction: number } {
  const rel = logs.filter((l) => alive(l) && l.foodId === foodId);
  return {
    total: rel.length,
    withReaction: rel.filter((l) => l.reaction && l.reaction !== 'ninguna').length,
  };
}

export function recentDays(n: number, end?: LocalDate): LocalDate[] {
  return lastNDays(n, end);
}
