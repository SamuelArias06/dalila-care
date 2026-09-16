#!/usr/bin/env node
/**
 * Limpia lo que deja una prueba de humo interrumpida: borra (suavemente) los
 * registros creados por dispositivos de prueba y los revoca.
 *
 *   node scripts/cleanup-smoke.mjs <codigo-de-invitacion-admin>
 */

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { apiUrl } = JSON.parse(readFileSync(join(root, '.secrets.json'), 'utf8'));
const inviteCode = process.argv[2];
// Mismo identificador en cada reintento: el canje es idempotente para este proceso.
const NONCE = 'limpieza' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);

// curl en vez de fetch: en algunas redes el cliente HTTP de Node agota el tiempo
// de conexión con los dominios de Google mientras curl funciona sin problema.
async function call(action, payload = {}, token) {
  const body = JSON.stringify({ action, token, payload });
  let last;
  for (let i = 0; i < 6; i++) {
    try {
      const out = execFileSync('curl', ['-4', '-sL', '--max-time', '120', '-H', 'Content-Type: text/plain;charset=utf-8', '--data-binary', '@-', apiUrl], { input: body, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      return JSON.parse(out);
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 4000 * (i + 1)));
    }
  }
  throw last;
}

const ENC = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const mid = () => {
  let t = Date.now(), s = '';
  for (let i = 0; i < 10; i++) { s = ENC[t % 32] + s; t = Math.floor(t / 32); }
  for (let i = 0; i < 16; i++) s += ENC[Math.floor(Math.random() * 32)];
  return `evt_${s}`;
};

const r = await call('auth.redeemInvite', { inviteCode, deviceLabel: 'limpieza-automatica', clientNonce: NONCE });
if (!r.ok) {
  console.error('No se pudo canjear la invitación:', r.error);
  process.exit(1);
}
const token = r.data.token;
const selfId = r.data.deviceId;

const devices = (await call('auth.listDevices', {}, token)).data.devices;
const testDevices = devices.filter((d) => /prueba-automatica|limpieza-automatica/.test(d.label));
const actors = new Set(testDevices.map((d) => String(d.id).slice(0, 10)));

const pull = (await call('data.pull', {}, token)).data.data;
const mutations = [];

if (pull.dog && (pull.dog.name === 'PRUEBA-SMOKE' || actors.has(pull.dog.createdBy))) {
  mutations.push({ collection: 'dog', entityId: pull.dog.id });
}
for (const [collection, rows] of Object.entries(pull)) {
  if (!Array.isArray(rows)) continue;
  for (const row of rows) {
    const isTestMedia = collection === 'media' && (row.fileName === 'prueba.png' || /prueba.png$/.test(row.fileName ?? ''));
    if (actors.has(row.createdBy) || isTestMedia) mutations.push({ collection, entityId: row.id });
  }
}

if (mutations.length) {
  const res = await call('data.push', {
    mutations: mutations.map((m) => ({ ...m, mutationId: mid(), op: 'delete', patch: {}, createdAt: new Date().toISOString() })),
  }, token);
  console.log(`Registros de prueba borrados: ${res.data.applied.length}/${mutations.length}`);
} else {
  console.log('No había registros de prueba.');
}

const after = (await call('data.pull', {}, token)).data.data;
console.log('Perfil tras limpiar:', after.dog === null ? 'vacío ✓' : `QUEDA "${after.dog.name}"`);

const inv = await call('auth.revokeInvites', {}, token);
console.log('Invitaciones sin usar anuladas:', inv.ok ? inv.data.revoked : JSON.stringify(inv.error));

for (const d of testDevices.filter((x) => x.id !== selfId && !x.revokedAt && !x.deletedAt)) {
  await call('auth.revokeDevice', { deviceId: d.id }, token);
  console.log(`Revocado dispositivo de prueba ${d.label}`);
}
await call('auth.revokeDevice', { deviceId: selfId }, token);
const check = await call('data.pull', {}, token);
console.log('Dispositivo de limpieza revocado:', !check.ok && check.error.code === 'UNAUTHORIZED' ? 'sí ✓' : 'NO');
