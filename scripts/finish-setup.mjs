#!/usr/bin/env node
/**
 * Termina la configuración: crea la hoja, el árbol de Drive y los enlaces de
 * acceso.
 *
 * Es idempotente: se puede ejecutar las veces que haga falta. La clave de
 * arranque vive en .secrets.json (fuera de Git) y el backend rechaza el
 * arranque si no coincide.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const secrets = JSON.parse(readFileSync(join(root, '.secrets.json'), 'utf8'));
const APP_URL = 'https://samuelarias06.github.io/dalila-care/';

const line = (char = '─') => char.repeat(64);

async function main() {
  const url = `${secrets.apiUrl}?action=bootstrap&key=${encodeURIComponent(secrets.bootstrapKey)}&invite=1`;

  console.log('Configurando el backend...\n');
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();

  if (text.trimStart().startsWith('<')) {
    console.error(line());
    console.error('  FALTA AUTORIZAR EL SCRIPT');
    console.error(line());
    console.error('\n  Google todavia no ha autorizado los permisos del script.');
    console.error('  Abre esta URL en tu navegador, con tu cuenta de Google:\n');
    console.error(`  ${secrets.apiUrl}\n`);
    console.error('  Y sigue estos pasos:');
    console.error('    1. "Revisar permisos"');
    console.error('    2. Elige tu cuenta de Google');
    console.error('    3. "Configuracion avanzada" -> "Ir a Dalila Care API (no seguro)"');
    console.error('    4. "Permitir"');
    console.error('\n  Despues vuelve a ejecutar:  npm run setup\n');
    process.exit(1);
  }

  let body;
  try {
    body = JSON.parse(text);
  } catch {
    console.error('Respuesta inesperada del servidor:\n', text.slice(0, 400));
    process.exit(1);
  }

  if (!body.ok) {
    console.error('Error del servidor:', body.error?.userMessage ?? JSON.stringify(body.error));
    process.exit(1);
  }

  const d = body.data;

  console.log(line('━'));
  console.log('  DALILA CARE - CONFIGURACION COMPLETA');
  console.log(line('━'));
  console.log(`\n  App           ${APP_URL}`);
  console.log(`  Hoja          ${d.sheetUrl}`);
  console.log(`  Drive         ${d.rootFolderUrl}`);
  console.log(`  Version       ${d.version}`);
  console.log(`  Hojas nuevas  ${d.createdSheets.length ? d.createdSheets.join(', ') : 'ninguna (ya existian)'}`);

  if (d.inviteCode) {
    console.log(`\n${line()}`);
    console.log('  TU ENLACE (administrador) - abrelo una sola vez:');
    console.log(`\n  ${APP_URL}#/invitacion/${d.inviteCode}`);
  }

  if (d.caregiverCode) {
    console.log(`\n${line()}`);
    console.log('  ENLACE PARA EL IPHONE DE ELLA - un solo uso, caduca en 14 dias:');
    console.log(`\n  ${APP_URL}#/invitacion/${d.caregiverCode}`);
  }

  console.log(`\n${line()}`);
  console.log('  Desde la app, en Ajustes > Diagnostico, puedes generar mas');
  console.log('  enlaces cuando quieras.');
  console.log(line());
  console.log('\n  Listo. Abre tu enlace en el movil y anadelo a la pantalla de inicio.\n');
}

main().catch((e) => {
  console.error('Fallo inesperado:', e.message);
  process.exit(1);
});
