#!/usr/bin/env node
/**
 * Compila el backend de Apps Script.
 *
 * clasp 3 ya no transpila TypeScript, así que lo hacemos nosotros con esbuild.
 * La ventaja de bundlear es concreta: `packages/shared` se puede importar tal
 * cual en el backend, y así la misma validación corre en el cliente y en el
 * servidor sin poder divergir.
 *
 * La salida es un único archivo .gs, lo que además quita la tentación de editar
 * nada desde el editor web de Apps Script.
 */

import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = join(root, 'apps', 'api');
const outDir = join(apiDir, 'build');
const secretsPath = join(root, '.secrets.json');

/**
 * La clave de arranque permite ejecutar la configuración inicial una sola vez
 * mediante una petición HTTP, sin tener que abrir el editor de Apps Script.
 * Vive en un archivo local que no está en Git y se reutiliza entre compilaciones
 * para que el despliegue sea reproducible.
 */
function loadSecrets() {
  let secrets = {};
  if (existsSync(secretsPath)) {
    secrets = JSON.parse(readFileSync(secretsPath, 'utf8'));
  }
  if (!secrets.bootstrapKey) {
    secrets.bootstrapKey = randomBytes(24).toString('base64url');
    writeFileSync(secretsPath, JSON.stringify(secrets, null, 2));
    console.log('· Clave de arranque generada en .secrets.json (fuera de Git)');
  }
  return secrets;
}

function gitVersion() {
  try {
    const sha = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim();
    return `1.0.0+${sha}`;
  } catch {
    return '1.0.0';
  }
}

const secrets = loadSecrets();
const version = gitVersion();

mkdirSync(outDir, { recursive: true });

const result = await build({
  entryPoints: [join(apiDir, 'src', 'main.ts')],
  bundle: true,
  format: 'iife',
  target: 'es2019',
  platform: 'neutral',
  write: false,
  legalComments: 'none',
  charset: 'utf8',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  alias: {
    '@dalila/shared': join(root, 'packages', 'shared', 'src', 'index.ts'),
  },
});

let code = result.outputFiles[0].text;

code = code
  .replaceAll('__BOOTSTRAP_KEY__', secrets.bootstrapKey)
  .replaceAll('__BUILD_VERSION__', version);

const banner = `/**
 * Dalila Care — backend
 * Generado automáticamente desde apps/api/src. NO EDITAR AQUÍ.
 * La fuente de verdad es el repositorio de Git; los cambios se publican con clasp.
 * Versión: ${version}
 */
`;

writeFileSync(join(outDir, 'Code.gs'), banner + code, 'utf8');
copyFileSync(join(apiDir, 'appsscript.template.json'), join(outDir, 'appsscript.json'));

const kb = (Buffer.byteLength(code) / 1024).toFixed(1);
console.log(`✓ Backend compilado: apps/api/build/Code.gs (${kb} KB, versión ${version})`);
