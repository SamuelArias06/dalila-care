#!/usr/bin/env node
/**
 * Prueba de humo del backend en producción.
 *
 * Canjea una invitación de administrador con un dispositivo de prueba, ejercita
 * la API completa y al terminar borra (suavemente) todo lo que creó y revoca el
 * dispositivo. Uso:
 *
 *   node scripts/smoke-api.mjs <codigo-de-invitacion-admin>
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { apiUrl } = JSON.parse(readFileSync(join(root, '.secrets.json'), 'utf8'));
const inviteCode = process.argv[2];
const NONCE = 'smoke' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
if (!inviteCode) {
  console.error('Uso: node scripts/smoke-api.mjs <codigo-admin>');
  process.exit(2);
}

let passed = 0;
let failed = 0;
const check = (name, cond, extra = '') => {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name} ${extra}`);
  }
};

async function withRetry(fn, tries = 5) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
    }
  }
  throw last;
}

async function call(action, payload = {}, token) {
  return withRetry(async () => {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, token, payload }),
      redirect: 'follow',
    });
    return res.json();
  });
}

const ENC = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function id(prefix) {
  let t = Date.now();
  let time = '';
  for (let i = 0; i < 10; i++) {
    time = ENC[t % 32] + time;
    t = Math.floor(t / 32);
  }
  let rnd = '';
  for (let i = 0; i < 16; i++) rnd += ENC[Math.floor(Math.random() * 32)];
  return `${prefix}_${time}${rnd}`;
}

function today() {
  const d = new Date(Date.now() - 5 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

const created = [];

async function main() {
  console.log('\nAutenticación');
  const ping = await call('ping');
  check('ping sin token responde', ping.ok && ping.data.configured === true);

  const anon = await call('data.pull');
  check('data.pull sin token → UNAUTHORIZED', !anon.ok && anon.error.code === 'UNAUTHORIZED');

  const forged = await call('data.pull', {}, 'dev_AAAAAAAAAAAAAAAAAAAA:admin.' + 'f'.repeat(64));
  check('token falsificado → UNAUTHORIZED', !forged.ok && forged.error.code === 'UNAUTHORIZED');

  const escalated = await call('data.pull', {}, 'dev_AAAAAAAAAAAAAAAAAAAA:admin');
  check('token sin firma → UNAUTHORIZED', !escalated.ok && escalated.error.code === 'UNAUTHORIZED');

  const redeem = await call('auth.redeemInvite', { inviteCode, deviceLabel: 'prueba-automatica', clientNonce: NONCE });
  check('canjear invitación admin', redeem.ok && redeem.data.role === 'admin', JSON.stringify(redeem.error ?? ''));
  if (!redeem.ok) return;
  const token = redeem.data.token;
  const deviceId = redeem.data.deviceId;

  const again = await call('auth.redeemInvite', { inviteCode, deviceLabel: 'reuso' });
  check('la invitación es de un solo uso para otro dispositivo', !again.ok);

  const retry = await call('auth.redeemInvite', { inviteCode, deviceLabel: 'prueba-automatica', clientNonce: NONCE });
  check('el mismo dispositivo puede reintentar el canje (red inestable)', retry.ok && retry.data.deviceId === redeem.data.deviceId);

  const bogus = await call('auth.redeemInvite', { inviteCode: 'NOEXISTE123', deviceLabel: 'x' });
  check('código inventado rechazado', !bogus.ok);

  console.log('\nSincronización');
  const dogId = id('dog');
  const logId = id('dlg');
  const m1 = { mutationId: id('evt'), collection: 'dog', op: 'upsert', entityId: dogId, patch: { name: 'PRUEBA-SMOKE' }, createdAt: new Date().toISOString() };
  const m2 = {
    mutationId: id('evt'),
    collection: 'dailyLogs',
    op: 'upsert',
    entityId: logId,
    patch: { localDate: today(), overallState: 4, mobilitySigns: ['mov_costo_levantarse'], note: '=IMPORTXML("http://x","//a")' },
    createdAt: new Date().toISOString(),
  };
  const future = {
    mutationId: id('evt'),
    collection: 'dailyLogs',
    op: 'upsert',
    entityId: id('dlg'),
    patch: { localDate: '2099-01-01' },
    createdAt: new Date().toISOString(),
  };
  const wrongPrefix = {
    mutationId: id('evt'),
    collection: 'dailyLogs',
    op: 'upsert',
    entityId: id('med'),
    patch: { localDate: today() },
    createdAt: new Date().toISOString(),
  };
  created.push(['dog', dogId], ['dailyLogs', logId]);

  const push = await call('data.push', { mutations: [m1, m2, future, wrongPrefix] }, token);
  check('push aplica los cambios válidos', push.ok && push.data.applied.length === 2, JSON.stringify(push.data ?? push.error));
  check('push rechaza fecha futura y prefijo equivocado', push.ok && push.data.rejected.length === 2);

  const dup = await call('data.push', { mutations: [m2] }, token);
  check('reenviar la misma mutación es idempotente', dup.ok && dup.data.applied.length === 1);

  const pull = await call('data.pull', {}, token);
  const logs = (pull.data?.data?.dailyLogs ?? []).filter((l) => l.id === logId);
  check('pull devuelve el registro una sola vez', logs.length === 1, `(${logs.length})`);
  check('la nota con fórmula vuelve intacta (no se ejecutó)', logs[0]?.note === '=IMPORTXML("http://x","//a")', JSON.stringify(logs[0]?.note));
  check('las listas se guardan como listas', Array.isArray(logs[0]?.mobilitySigns) && logs[0].mobilitySigns[0] === 'mov_costo_levantarse');
  check('el estado general conserva su tipo numérico', logs[0]?.overallState === 4);

  console.log('\nVídeo: subida reanudable directa a Drive');
  const mediaId = id('mda');
  created.push(['media', mediaId]);
  // PNG de 1×1 válido.
  const png = Buffer.from(
    '89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D4944415478DA63F8FFFF3F0005FE02FEA7D6A5BA0000000049454E44AE426082',
    'hex',
  );
  const session = await call('media.createUploadSession', {
    mediaId,
    fileName: 'prueba.png',
    mimeType: 'image/png',
    sizeBytes: png.length,
    kind: 'foto',
    localDate: today(),
  }, token);
  check('el backend abre la sesión reanudable', session.ok && /^https:\/\//.test(session.data?.uploadUrl ?? ''), JSON.stringify(session.error ?? ''));

  let driveFileId = '';
  if (session.ok) {
    const put = await withRetry(() =>
      fetch(session.data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Range': `bytes 0-${png.length - 1}/${png.length}` },
        body: png,
      }),
    );
    const body = await put.json().catch(() => ({}));
    driveFileId = body.id ?? '';
    check('el cliente sube los bytes SIN token (sólo con la URI de sesión)', (put.status === 200 || put.status === 201) && !!driveFileId, `HTTP ${put.status}`);
  }

  if (driveFileId) {
    const confirm = await call('media.confirmUpload', { mediaId, driveFileId }, token);
    check('el backend verifica el archivo contra Drive', confirm.ok && confirm.data.sizeBytes === png.length, JSON.stringify(confirm.error ?? confirm.data));

    const fakeConfirm = await call('media.confirmUpload', { mediaId, driveFileId: 'id-que-no-existe' }, token);
    check('confirmar un archivo inexistente se rechaza', !fakeConfirm.ok);

    const ct = await call('media.getContentToken', {}, token);
    if (ct.ok) {
      const dl = await withRetry(() =>
        fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`, {
          headers: { Authorization: `Bearer ${ct.data.accessToken}` },
        }),
      );
      const bytes = Buffer.from(await dl.arrayBuffer());
      check('reproducción privada: se descarga con token de corta duración', dl.ok && bytes.equals(png));
    }

    const publicAccess = await withRetry(() =>
      fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`),
    );
    check('el archivo NO es accesible sin autenticación', publicAccess.status === 401 || publicAccess.status === 403, `HTTP ${publicAccess.status}`);

    const badMime = await call('media.createUploadSession', {
      mediaId: id('mda'), fileName: 'x.exe', mimeType: 'application/x-msdownload', sizeBytes: 10, kind: 'foto', localDate: today(),
    }, token);
    check('tipo de archivo no permitido rechazado', !badMime.ok && badMime.error.code === 'VALIDATION');
  }

  console.log('\nAdministración');
  const diag = await call('admin.diagnostics', {}, token);
  check('diagnóstico disponible para admin', diag.ok && diag.data.configured === true);
  check('el diagnóstico no expone IDs completos de Drive', diag.ok && String(diag.data.sheetId).includes('···'));

  const backup = await call('admin.backup', {}, token);
  check('backup JSON en Drive', backup.ok && !!backup.data.fileId, JSON.stringify(backup.error ?? ''));

  console.log('\nLimpieza');
  const cleanup = await call('data.push', {
    mutations: created.map(([collection, entityId]) => ({
      mutationId: id('evt'), collection, op: 'delete', entityId, patch: {}, createdAt: new Date().toISOString(),
    })),
  }, token);
  check('datos de prueba borrados (borrado suave)', cleanup.ok && cleanup.data.applied.length === created.length);

  const after = await call('data.pull', {}, token);
  check('tras limpiar no queda perfil de prueba', after.ok && after.data.data.dog === null);

  const revoke = await call('auth.revokeDevice', { deviceId }, token);
  check('revocar el dispositivo de prueba', revoke.ok);

  const afterRevoke = await call('data.pull', {}, token);
  check('un dispositivo revocado ya no entra', !afterRevoke.ok && afterRevoke.error.code === 'UNAUTHORIZED');

  console.log(`\n${passed} correctas, ${failed} fallidas\n`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error('Fallo inesperado:', e);
  process.exit(1);
});
