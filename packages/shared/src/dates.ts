/**
 * Fechas y horas para Dalila Care.
 *
 * Zona horaria: America/Bogota. Colombia no observa horario de verano desde
 * 1993, así que el desfase es constante (-05:00). Eso permite trabajar con un
 * offset fijo en lugar de depender de la base de datos de zonas horarias, que
 * es determinista, testeable e idéntico en el navegador y en Apps Script.
 *
 * Convención: los instantes se guardan como ISO 8601 con offset explícito y,
 * además, las entidades diarias guardan `localDate` (YYYY-MM-DD) como campo
 * propio. Sin eso, un registro de las 22:00 en Bogotá se contaría como del día
 * siguiente.
 */

export const TZ = 'America/Bogota';
export const TZ_OFFSET_MINUTES = -300;
const MS_PER_DAY = 86_400_000;

export type LocalDate = string; // YYYY-MM-DD

function pad(n: number, len = 2): string {
  return String(Math.abs(n)).padStart(len, '0');
}

function toDate(input: Date | string | number): Date {
  if (input instanceof Date) return input;
  if (typeof input === 'number') return new Date(input);
  return new Date(input);
}

/** Instante actual en ISO 8601 con offset de Bogotá: 2026-09-15T08:12:03-05:00 */
export function nowIso(now: Date | number = new Date()): string {
  return toIsoLocal(toDate(now));
}

export function toIsoLocal(input: Date | string | number): string {
  const d = toDate(input);
  const shifted = new Date(d.getTime() + TZ_OFFSET_MINUTES * 60_000);
  const off = Math.abs(TZ_OFFSET_MINUTES);
  const sign = TZ_OFFSET_MINUTES <= 0 ? '-' : '+';
  return (
    `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}` +
    `T${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())}` +
    `${sign}${pad(Math.floor(off / 60))}:${pad(off % 60)}`
  );
}

/** Día local (YYYY-MM-DD) al que pertenece un instante. */
export function localDateOf(input: Date | string | number = new Date()): LocalDate {
  const d = toDate(input);
  const shifted = new Date(d.getTime() + TZ_OFFSET_MINUTES * 60_000);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

export function today(now: Date | number = new Date()): LocalDate {
  return localDateOf(now);
}

/** Hora local en formato HH:mm (24 h). */
export function localTimeOf(input: Date | string | number = new Date()): string {
  const d = toDate(input);
  const shifted = new Date(d.getTime() + TZ_OFFSET_MINUTES * 60_000);
  return `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
}

export function isValidLocalDate(value: unknown): value is LocalDate {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** HH:mm válido. */
export function isValidTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function localDateToUtcMs(date: LocalDate): number {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

function utcMsToLocalDate(ms: number): LocalDate {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return utcMsToLocalDate(localDateToUtcMs(date) + days * MS_PER_DAY);
}

export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((localDateToUtcMs(to) - localDateToUtcMs(from)) / MS_PER_DAY);
}

export function compareDates(a: LocalDate, b: LocalDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Lista inclusiva de días entre dos fechas, en orden ascendente. */
export function eachDay(from: LocalDate, to: LocalDate): LocalDate[] {
  const out: LocalDate[] = [];
  let cur = from;
  let guard = 0;
  while (compareDates(cur, to) <= 0 && guard++ < 4000) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

/** Últimos `n` días terminando hoy (inclusive), en orden ascendente. */
export function lastNDays(n: number, end: LocalDate = today()): LocalDate[] {
  return eachDay(addDays(end, -(n - 1)), end);
}

/** 1 = lunes … 7 = domingo (ISO). */
export function weekdayOf(date: LocalDate): number {
  const d = new Date(localDateToUtcMs(date)).getUTCDay(); // 0 = domingo
  return d === 0 ? 7 : d;
}

/** Instante local de un día y una hora concretos, en ISO con offset. */
export function atLocalTime(date: LocalDate, time: string): string {
  return `${date}T${time}:00-05:00`;
}

// ── Formateo en español de Colombia ──────────────────────────────────────────

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

/** "martes 15 de septiembre" */
export function formatDateLong(date: LocalDate, withYear = false): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const wd = WEEKDAYS[weekdayOf(date) - 1]!;
  const base = `${wd} ${d} de ${MONTHS[m - 1]}`;
  return withYear ? `${base} de ${y}` : base;
}

/** "15 de septiembre" */
export function formatDayMonth(date: LocalDate): string {
  const [, m, d] = date.split('-').map(Number) as [number, number, number];
  return `${d} de ${MONTHS[m - 1]}`;
}

/** "15 sep" */
export function formatDayMonthShort(date: LocalDate): string {
  const [, m, d] = date.split('-').map(Number) as [number, number, number];
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

/** "15/09/2026" — formato preferido día/mes/año */
export function formatDateNumeric(date: LocalDate): string {
  const [y, m, d] = date.split('-') as [string, string, string];
  return `${d}/${m}/${y}`;
}

/** "septiembre 2026" */
export function formatMonthYear(date: LocalDate): string {
  const [y, m] = date.split('-').map(Number) as [number, number];
  return `${MONTHS[m - 1]} ${y}`;
}

/** "Hoy" / "Ayer" / "martes 15 de septiembre" */
export function formatRelativeDay(date: LocalDate, ref: LocalDate = today()): string {
  const diff = daysBetween(date, ref);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff === -1) return 'Mañana';
  return formatDateLong(date);
}

export type Greeting = { text: string; period: 'madrugada' | 'mañana' | 'tarde' | 'noche' };

export function greetingFor(input: Date | string | number = new Date()): Greeting {
  const hour = Number(localTimeOf(input).slice(0, 2));
  if (hour < 5) return { text: 'Buenas noches', period: 'madrugada' };
  if (hour < 12) return { text: 'Buenos días', period: 'mañana' };
  if (hour < 19) return { text: 'Buenas tardes', period: 'tarde' };
  return { text: 'Buenas noches', period: 'noche' };
}

/**
 * Años y meses completos transcurridos, con aritmética de calendario real.
 * Promediar días (365.25 / 30.44) produce errores de un mes entero, que en la
 * edad de un perro se nota.
 */
export function ageParts(birthDate: LocalDate, ref: LocalDate = today()): { years: number; months: number; days: number } {
  const [by, bm, bd] = birthDate.split('-').map(Number) as [number, number, number];
  const [ry, rm, rd] = ref.split('-').map(Number) as [number, number, number];
  let years = ry - by;
  let months = rm - bm;
  let days = rd - bd;
  if (days < 0) {
    months -= 1;
    days += new Date(Date.UTC(ry, rm - 1, 0)).getUTCDate(); // días del mes anterior a ref
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

/** Edad legible a partir de la fecha de nacimiento: "7 años", "8 meses". */
export function formatAge(birthDate: LocalDate, ref: LocalDate = today()): string {
  if (daysBetween(birthDate, ref) < 0) return '—';
  const { years, months, days } = ageParts(birthDate, ref);
  if (years >= 2) return `${years} años`;
  if (years === 1) {
    return months > 0 ? `1 año y ${months} ${months === 1 ? 'mes' : 'meses'}` : '1 año';
  }
  if (months >= 1) return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  return `${days} ${days === 1 ? 'día' : 'días'}`;
}

/** "hace 5 minutos", "hace 2 horas", "ayer" — para el estado de sincronización. */
export function formatSince(iso: string, now: Date | number = new Date()): string {
  const diffMs = toDate(now).getTime() - toDate(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} ${min === 1 ? 'minuto' : 'minutos'}`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ayer';
  return `hace ${days} días`;
}

/** Minutos legibles: "18 min", "1 h 5 min". */
export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '—';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
