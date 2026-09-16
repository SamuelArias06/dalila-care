/**
 * Validación compartida por el cliente y el servidor.
 *
 * El cliente la usa para dar respuesta inmediata; el servidor la usa como
 * única fuente de verdad y nunca confía en lo que llega. Es el mismo código
 * en ambos lados, así que no pueden divergir.
 */

import { isValidId, type EntityPrefix } from './ids.js';
import { isValidLocalDate, isValidTime } from './dates.js';

export const LIMITS = {
  title: 120,
  shortText: 200,
  note: 4000,
  name: 80,
  phone: 40,
  listItems: 60,
  /** 250 MB: un clip de 720p de un minuto ronda los 25 MB. */
  fileBytes: 250 * 1024 * 1024,
} as const;

export const ALLOWED_MIME = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
  'application/pdf',
] as const;

export class ValidationError extends Error {
  readonly field: string;
  readonly userMessage: string;
  constructor(field: string, userMessage: string) {
    super(`${field}: ${userMessage}`);
    this.name = 'ValidationError';
    this.field = field;
    this.userMessage = userMessage;
  }
}

function fail(field: string, userMessage: string): never {
  throw new ValidationError(field, userMessage);
}

// ── Primitivas ───────────────────────────────────────────────────────────────

export function str(value: unknown, field: string, max: number, required = false): string {
  if (value == null || value === '') {
    if (required) fail(field, 'Este campo no puede quedar vacío.');
    return '';
  }
  if (typeof value !== 'string') fail(field, 'Formato no válido.');
  const trimmed = value.trim();
  if (required && !trimmed) fail(field, 'Este campo no puede quedar vacío.');
  if (trimmed.length > max) fail(field, `El texto es demasiado largo (máximo ${max} caracteres).`);
  return trimmed;
}

export function num(
  value: unknown,
  field: string,
  opts: { min?: number; max?: number; required?: boolean } = {},
): number | null {
  if (value == null || value === '') {
    if (opts.required) fail(field, 'Este campo no puede quedar vacío.');
    return null;
  }
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n)) fail(field, 'Tiene que ser un número.');
  if (opts.min != null && n < opts.min) fail(field, `Tiene que ser mayor o igual que ${opts.min}.`);
  if (opts.max != null && n > opts.max) fail(field, `Tiene que ser menor o igual que ${opts.max}.`);
  return n;
}

export function bool(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1';
}

export function oneOf<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
  opts: { required?: boolean; fallback?: T } = {},
): T | '' {
  if (value == null || value === '') {
    if (opts.required) fail(field, 'Selecciona una opción.');
    return opts.fallback ?? ('' as T | '');
  }
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    if (opts.fallback != null) return opts.fallback;
    fail(field, 'Opción no válida.');
  }
  return value as T;
}

export function strList(value: unknown, field: string, maxItems = LIMITS.listItems): string[] {
  if (value == null || value === '') return [];
  const arr = Array.isArray(value) ? value : typeof value === 'string' ? safeJsonArray(value) : null;
  if (!arr) fail(field, 'Formato no válido.');
  if (arr.length > maxItems) fail(field, `Demasiados elementos (máximo ${maxItems}).`);
  return arr.filter((v): v is string => typeof v === 'string' && v.length > 0).map((v) => v.slice(0, LIMITS.shortText));
}

function safeJsonArray(value: string): unknown[] | null {
  const t = value.trim();
  if (!t) return [];
  if (!t.startsWith('[')) return null;
  try {
    const parsed: unknown = JSON.parse(t);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function numList(value: unknown, field: string, min: number, max: number): number[] {
  const arr = Array.isArray(value) ? value : typeof value === 'string' ? safeJsonArray(value) ?? [] : [];
  const out: number[] = [];
  for (const v of arr) {
    const n = Number(v);
    if (!Number.isFinite(n) || n < min || n > max) fail(field, 'Valor fuera de rango.');
    out.push(n);
  }
  return out;
}

export function localDate(value: unknown, field: string, required = false): string {
  if (value == null || value === '') {
    if (required) fail(field, 'Falta la fecha.');
    return '';
  }
  if (!isValidLocalDate(value)) fail(field, 'La fecha no es válida.');
  return value;
}

export function time(value: unknown, field: string, required = false): string {
  if (value == null || value === '') {
    if (required) fail(field, 'Falta la hora.');
    return '';
  }
  if (!isValidTime(value)) fail(field, 'La hora no es válida.');
  return value;
}

export function isoInstant(value: unknown, field: string, required = false): string {
  if (value == null || value === '') {
    if (required) fail(field, 'Falta la fecha y hora.');
    return '';
  }
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) fail(field, 'Fecha y hora no válidas.');
  return value;
}

export function entityId(value: unknown, field: string, prefix?: EntityPrefix, required = false): string {
  if (value == null || value === '') {
    if (required) fail(field, 'Falta la referencia.');
    return '';
  }
  if (!isValidId(value, prefix)) fail(field, 'Referencia no válida.');
  return value as string;
}

// ── Reglas de dominio ────────────────────────────────────────────────────────

/** Una fecha de registro nunca puede estar en el futuro ni ser absurdamente antigua. */
export function plausibleLogDate(value: string, today: string, field = 'localDate'): string {
  if (value > today) fail(field, 'No se pueden registrar días que todavía no han pasado.');
  if (value < '2000-01-01') fail(field, 'Esa fecha es demasiado antigua.');
  return value;
}

export function weightKg(value: unknown, field = 'weightKg'): number {
  const n = num(value, field, { min: 0.3, max: 120, required: true });
  return Math.round(n! * 100) / 100;
}

export function mimeType(value: unknown, field = 'mimeType'): string {
  const v = str(value, field, 120, true);
  const base = v.split(';')[0]!.trim().toLowerCase();
  if (!(ALLOWED_MIME as readonly string[]).includes(base)) {
    fail(field, 'Ese tipo de archivo no está permitido.');
  }
  return base;
}

export function fileSize(value: unknown, field = 'sizeBytes'): number {
  const n = num(value, field, { min: 1, max: LIMITS.fileBytes, required: true })!;
  return Math.round(n);
}

/**
 * Evita que un texto se interprete como fórmula al escribirlo en Sheets.
 * Sin esto, escribir `=IMPORTXML(...)` en una nota convierte la hoja de cálculo
 * en un vector de exfiltración de datos.
 */
export function sheetSafe(value: string): string {
  if (!value) return value;
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/** Deshace `sheetSafe` al leer. */
export function sheetUnsafe(value: string): string {
  if (typeof value !== 'string') return value;
  return value.startsWith("'") ? value.slice(1) : value;
}

/**
 * Limpia un nombre de archivo antes de mandarlo a Drive.
 * Elimina separadores de ruta y secuencias de puntos: sin eso, un nombre como
 * `../../etc/passwd` sobrevive parcialmente al filtrado.
 */
export function safeFileName(name: string, fallback = 'archivo'): string {
  const cleaned = String(name ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\\/]+/g, ' ')       // separadores de ruta
    .replace(/[^\w.\- ]+/g, '')    // sólo alfanuméricos, punto, guion y espacio
    .replace(/\.{2,}/g, '.')       // colapsa "..", "..." etc.
    .replace(/^[.\s]+/, '')        // sin puntos ni espacios al inicio
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
    .replace(/[.\s]+$/, '');
  return cleaned || fallback;
}
