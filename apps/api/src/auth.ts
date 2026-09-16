/**
 * Autenticación por enlace mágico y token de dispositivo.
 *
 * Por qué no "Entrar con Google": el despliegue del Web App tiene que ser
 * anónimo para que `fetch` desde otro origen funcione (la opción "cualquiera
 * con cuenta de Google" responde con una redirección a un login que el
 * navegador no puede completar dentro de una petición de datos). Así que la
 * autenticación la hacemos nosotros, y un enlace de un solo uso es mejor
 * experiencia para la usuaria: lo abre una vez y no vuelve a ver un login.
 *
 * Modelo:
 *   · Invitación = código aleatorio de 256 bits, de un solo uso y con caducidad.
 *     Sólo se guarda su hash SHA-256; el código en claro no existe en el servidor.
 *   · Token de dispositivo = `deviceId:role.HMAC-SHA256(deviceId:role, secreto)`.
 *     Se verifica con criptografía pura, sin leer la hoja en cada petición.
 *   · Revocación = lista de deviceId en PropertiesService, consultada siempre.
 *
 * Toda acción salvo `ping` y `auth.redeemInvite` exige un token válido.
 */

import { PROP } from './config.js';

export type Role = 'admin' | 'caregiver';

export interface AuthContext {
  deviceId: string;
  role: Role;
  actor: string;
}

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 días

function props(): GoogleAppsScript.Properties.Properties {
  return PropertiesService.getScriptProperties();
}

function bytesToHex(bytes: number[]): string {
  let out = '';
  for (const b of bytes) out += ((b & 0xff) + 0x100).toString(16).slice(1);
  return out;
}

export function sha256Hex(input: string): string {
  return bytesToHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8));
}

function hmacHex(message: string, secret: string): string {
  return bytesToHex(Utilities.computeHmacSha256Signature(message, secret));
}

/** Comparación en tiempo constante: evita filtrar información por el tiempo de respuesta. */
function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function randomToken(chars = 43): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  // Utilities.getUuid() usa un generador criptográfico; combinamos varios para
  // llegar a >256 bits de entropía sin depender de Math.random.
  let pool = '';
  while (pool.length < chars * 2) pool += Utilities.getUuid().replace(/-/g, '');
  let out = '';
  for (let i = 0; i < chars; i++) {
    out += alphabet[parseInt(pool.substr(i * 2, 2), 16) % alphabet.length];
  }
  return out;
}

export function getSessionSecret(): string {
  const p = props();
  let secret = p.getProperty(PROP.sessionSecret);
  if (!secret) {
    secret = randomToken(64);
    p.setProperty(PROP.sessionSecret, secret);
  }
  return secret;
}

// ── Invitaciones ─────────────────────────────────────────────────────────────

interface InviteRecord {
  role: Role;
  createdAt: number;
  expiresAt: number;
  usedAt?: number;
  note?: string;
}

function readInvites(): Record<string, InviteRecord> {
  try {
    return JSON.parse(props().getProperty(PROP.invites) ?? '{}') as Record<string, InviteRecord>;
  } catch {
    return {};
  }
}

function writeInvites(map: Record<string, InviteRecord>): void {
  // Limpieza: fuera lo caducado o usado hace más de 30 días.
  const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 30;
  for (const k of Object.keys(map)) {
    const r = map[k]!;
    if ((r.usedAt && r.usedAt < cutoff) || r.expiresAt < cutoff) delete map[k];
  }
  props().setProperty(PROP.invites, JSON.stringify(map));
}

/** Crea un código de invitación de un solo uso. Devuelve el código en claro una única vez. */
export function createInvite(role: Role, note = ''): { code: string; expiresAt: number } {
  const code = randomToken(32);
  const map = readInvites();
  const now = Date.now();
  map[sha256Hex(code)] = { role, createdAt: now, expiresAt: now + INVITE_TTL_MS, note };
  writeInvites(map);
  return { code, expiresAt: now + INVITE_TTL_MS };
}

export interface RedeemResult {
  token: string;
  deviceId: string;
  role: Role;
}

/**
 * Canjea una invitación por un token de dispositivo permanente.
 * El código queda inutilizado inmediatamente: si alguien reenvía el enlace, ya
 * no sirve.
 */
export function redeemInvite(code: string, deviceLabel: string): RedeemResult | null {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const map = readInvites();
    const hash = sha256Hex(String(code ?? ''));
    const rec = map[hash];
    if (!rec) return null;
    if (rec.usedAt) return null;
    if (rec.expiresAt < Date.now()) return null;

    rec.usedAt = Date.now();
    writeInvites(map);

    const deviceId = 'dev_' + randomToken(20);
    return { token: mintToken(deviceId, rec.role), deviceId, role: rec.role };
  } finally {
    lock.releaseLock();
  }
}

// ── Tokens de dispositivo ────────────────────────────────────────────────────

export function mintToken(deviceId: string, role: Role): string {
  const payload = `${deviceId}:${role}`;
  return `${payload}.${hmacHex(payload, getSessionSecret())}`;
}

function readRevoked(): string[] {
  try {
    return JSON.parse(props().getProperty(PROP.revokedDevices) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export function revokeDevice(deviceId: string): void {
  const list = readRevoked();
  if (!list.includes(deviceId)) {
    list.push(deviceId);
    props().setProperty(PROP.revokedDevices, JSON.stringify(list));
  }
}

/**
 * Verifica un token. Devuelve null si es inválido, está mal firmado o el
 * dispositivo fue revocado. No lanza excepciones: cualquier entrada rara es
 * simplemente un token inválido.
 */
export function verifyToken(token: unknown): AuthContext | null {
  if (typeof token !== 'string' || token.length < 20 || token.length > 400) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;

  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!timingSafeEqual(sig, hmacHex(payload, getSessionSecret()))) return null;

  const colon = payload.indexOf(':');
  if (colon <= 0) return null;
  const deviceId = payload.slice(0, colon);
  const role = payload.slice(colon + 1);
  if (role !== 'admin' && role !== 'caregiver') return null;
  if (!/^dev_[A-Za-z0-9]{10,40}$/.test(deviceId)) return null;
  if (readRevoked().indexOf(deviceId) !== -1) return null;

  return { deviceId, role: role as Role, actor: deviceId.slice(0, 10) };
}

// ── Límite de peticiones ─────────────────────────────────────────────────────

/**
 * Cortafuegos sencillo por dispositivo. No pretende parar un ataque
 * distribuido: evita que un bucle roto del cliente agote la cuota diaria.
 */
export function checkRateLimit(key: string, maxPerMinute = 120): boolean {
  try {
    const cache = CacheService.getScriptCache();
    const bucket = `rl_${key}_${Math.floor(Date.now() / 60000)}`;
    const current = Number(cache.get(bucket) ?? '0') + 1;
    cache.put(bucket, String(current), 120);
    return current <= maxPerMinute;
  } catch {
    return true; // si la caché falla, no bloqueamos a la usuaria
  }
}

/** Protege el canje de invitaciones contra fuerza bruta a escala global. */
export function checkInviteAttempts(): boolean {
  return checkRateLimit('invite_global', 20);
}
