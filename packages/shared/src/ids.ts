/**
 * Identificadores ULID: ordenables por tiempo de creación y generados en el
 * cliente, lo que hace que reintentar una operación sea idempotente.
 */

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32
const ENCODING_LEN = 32;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

export type EntityPrefix =
  | 'dog'
  | 'dgn'
  | 'dlg'
  | 'tsk'
  | 'tcp'
  | 'med'
  | 'mdv'
  | 'dos'
  | 'fdi'
  | 'fpi'
  | 'flg'
  | 'wgt'
  | 'act'
  | 'mda'
  | 'evt'
  | 'vtq'
  | 'vti'
  | 'apt'
  | 'mom'
  | 'doc'
  | 'shr'
  | 'dev'
  | 'sgn';

function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  // Tipado estructural: este paquete compila sin la librería DOM, así que no
  // podemos referirnos al tipo global Crypto.
  type RandomSource = { getRandomValues(a: Uint8Array): Uint8Array };
  const c = (globalThis as { crypto?: RandomSource }).crypto;
  if (c && typeof c.getRandomValues === 'function') {
    c.getRandomValues(out);
    return out;
  }
  // Apps Script no expone crypto.getRandomValues; Math.random es suficiente
  // aquí porque el ULID no es un secreto, sólo debe ser único.
  for (let i = 0; i < n; i++) out[i] = Math.floor(Math.random() * 256);
  return out;
}

function encodeTime(now: number): string {
  let str = '';
  let t = now;
  for (let i = TIME_LEN - 1; i >= 0; i--) {
    const mod = t % ENCODING_LEN;
    str = ENCODING[mod] + str;
    t = (t - mod) / ENCODING_LEN;
  }
  return str;
}

function encodeRandom(): string {
  const bytes = randomBytes(RANDOM_LEN);
  let str = '';
  for (let i = 0; i < RANDOM_LEN; i++) str += ENCODING[bytes[i]! % ENCODING_LEN];
  return str;
}

/** ULID crudo de 26 caracteres. */
export function ulid(now: number = Date.now()): string {
  return encodeTime(now) + encodeRandom();
}

/** Identificador de entidad: `prefijo_ULID`. */
export function newId(prefix: EntityPrefix, now: number = Date.now()): string {
  return `${prefix}_${ulid(now)}`;
}

export function isValidId(value: unknown, prefix?: EntityPrefix): boolean {
  if (typeof value !== 'string') return false;
  const m = /^([a-z]{3})_([0-9A-HJKMNP-TV-Z]{26})$/.exec(value);
  if (!m) return false;
  if (prefix && m[1] !== prefix) return false;
  return true;
}

export function idPrefix(id: string): string | null {
  const m = /^([a-z]{3})_/.exec(id);
  return m ? m[1]! : null;
}

/** Instante de creación codificado en el ULID (útil para ordenar sin leer campos). */
export function idTimestamp(id: string): number | null {
  const raw = id.includes('_') ? id.slice(id.indexOf('_') + 1) : id;
  if (raw.length !== 26) return null;
  let t = 0;
  for (let i = 0; i < TIME_LEN; i++) {
    const idx = ENCODING.indexOf(raw[i]!);
    if (idx === -1) return null;
    t = t * ENCODING_LEN + idx;
  }
  return t;
}

/** Token opaco de 256 bits para sesiones de dispositivo e invitaciones. */
export function secureToken(bytes = 32): string {
  const arr = randomBytes(bytes);
  let out = '';
  for (let i = 0; i < arr.length; i++) out += ENCODING[arr[i]! % ENCODING_LEN];
  return out;
}
