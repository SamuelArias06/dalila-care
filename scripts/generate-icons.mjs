#!/usr/bin/env node
/**
 * Genera todos los iconos y las pantallas de arranque desde un único SVG.
 *
 * iOS no usa los iconos del manifest para el icono de la pantalla de inicio:
 * usa `apple-touch-icon`, que tiene que ser PNG de 180×180 y sin transparencia.
 * Y las splash screens necesitan una imagen por tamaño de pantalla, con su
 * media query. Todo eso se genera aquí para no mantenerlo a mano.
 */

import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'apps', 'web', 'public');
const iconsDir = join(publicDir, 'icons');
const splashDir = join(publicDir, 'splash');

mkdirSync(iconsDir, { recursive: true });
mkdirSync(splashDir, { recursive: true });

const ROSA = '#FF7BA8';
const AGUA = '#3EC5BF';

/** Huella blanca sobre degradado rosa → agua marina. */
function logoSvg(size, { rounded = true, padding = 0 } = {}) {
  const r = rounded ? size * 0.2237 : 0; // radio del "squircle" de iOS
  const s = size - padding * 2;
  const scale = s / 64;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${ROSA}"/>
      <stop offset="100%" stop-color="${AGUA}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>
  <g transform="translate(${padding},${padding}) scale(${scale})" fill="#fff">
    <ellipse cx="22.4" cy="25.6" rx="4.6" ry="5.9"/>
    <ellipse cx="34" cy="21.6" rx="4.8" ry="6.3"/>
    <ellipse cx="45" cy="27.4" rx="4.4" ry="5.5"/>
    <path d="M33.6 33.4c7.2 0 12.9 5 12.9 10.7 0 4.5-4 7.2-8.2 6.5-1.7-.3-3-.8-4.7-.8s-3 .5-4.7.8c-4.2.7-8.2-2-8.2-6.5 0-5.7 5.7-10.7 12.9-10.7Z"/>
  </g>
</svg>`;
}

const ICON_SIZES = [48, 72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512];

for (const size of ICON_SIZES) {
  await sharp(Buffer.from(logoSvg(size)))
    .png()
    .toFile(join(iconsDir, `icon-${size}.png`));
}

// Maskable: el contenido va dentro del 80 % seguro para que Android pueda
// recortarlo con cualquier forma sin comerse la huella.
for (const size of [192, 512]) {
  await sharp(Buffer.from(logoSvg(size, { rounded: false, padding: size * 0.1 })))
    .png()
    .toFile(join(iconsDir, `maskable-${size}.png`));
}

// apple-touch-icon: sin esquinas redondeadas (iOS las aplica él) ni transparencia.
await sharp(Buffer.from(logoSvg(180, { rounded: false })))
  .flatten({ background: ROSA })
  .png()
  .toFile(join(publicDir, 'apple-touch-icon.png'));

await sharp(Buffer.from(logoSvg(32)))
  .png()
  .toFile(join(publicDir, 'favicon.png'));

writeFileSync(join(publicDir, 'logo.svg'), logoSvg(64), 'utf8');

// ── Pantallas de arranque de iOS ─────────────────────────────────────────────

const SPLASH = [
  { w: 1179, h: 2556, dw: 393, dh: 852, r: 3 }, // iPhone 15/16 Pro
  { w: 1290, h: 2796, dw: 430, dh: 932, r: 3 }, // Pro Max
  { w: 1170, h: 2532, dw: 390, dh: 844, r: 3 }, // 12/13/14
  { w: 1284, h: 2778, dw: 428, dh: 926, r: 3 },
  { w: 1125, h: 2436, dw: 375, dh: 812, r: 3 }, // X / 11 Pro
  { w: 828, h: 1792, dw: 414, dh: 896, r: 2 },  // 11 / XR
  { w: 750, h: 1334, dw: 375, dh: 667, r: 2 },  // SE
  { w: 1536, h: 2048, dw: 768, dh: 1024, r: 2 }, // iPad
];

const splashLinks = [];

for (const s of SPLASH) {
  const logoSize = Math.round(Math.min(s.w, s.h) * 0.26);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s.w}" height="${s.h}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FFF1F6"/>
        <stop offset="55%" stop-color="#F6FBFC"/>
        <stop offset="100%" stop-color="#EAFAF9"/>
      </linearGradient>
    </defs>
    <rect width="${s.w}" height="${s.h}" fill="url(#bg)"/>
  </svg>`;

  const logo = await sharp(Buffer.from(logoSvg(logoSize))).png().toBuffer();

  await sharp(Buffer.from(svg))
    .composite([{ input: logo, top: Math.round((s.h - logoSize) / 2), left: Math.round((s.w - logoSize) / 2) }])
    .png()
    .toFile(join(splashDir, `splash-${s.w}x${s.h}.png`));

  splashLinks.push(
    `<link rel="apple-touch-startup-image" media="(device-width: ${s.dw}px) and (device-height: ${s.dh}px) and (-webkit-device-pixel-ratio: ${s.r}) and (orientation: portrait)" href="splash/splash-${s.w}x${s.h}.png">`,
  );
}

writeFileSync(join(publicDir, 'splash-links.html'), splashLinks.join('\n    '), 'utf8');

console.log(`✓ ${ICON_SIZES.length + 2} iconos y ${SPLASH.length} pantallas de arranque generados`);
