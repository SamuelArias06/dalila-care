/**
 * Enrutado por hash.
 *
 * Con hash no hace falta ninguna regla de reescritura en el hosting estático, y
 * recargar una ruta profunda funciona siempre — incluido cuando la app está
 * instalada en la pantalla de inicio y se abre sin conexión.
 */

import { signal } from '@preact/signals';

export interface Route {
  path: string;
  segments: string[];
  query: URLSearchParams;
}

function parse(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart] = raw.split('?');
  const path = pathPart || '/';
  return {
    path,
    segments: path.split('/').filter(Boolean),
    query: new URLSearchParams(queryPart ?? ''),
  };
}

export const route = signal<Route>(parse());

const history: string[] = [];

export function go(path: string, opts: { replace?: boolean } = {}): void {
  const target = path.startsWith('#') ? path.slice(1) : path;
  if (route.value.path !== target) history.push(route.value.path);
  if (opts.replace) {
    window.location.replace(`#${target}`);
  } else {
    window.location.hash = target;
  }
}

/** Vuelve a la pantalla anterior dentro de la app, o a Hoy si no hay historial. */
export function back(fallback = '/'): void {
  const prev = history.pop();
  window.location.hash = prev ?? fallback;
}

export function startRouter(): void {
  window.addEventListener('hashchange', () => {
    route.value = parse();
  });
  if (!window.location.hash) window.location.replace('#/');
}

/** Coincidencia sencilla de patrones: '/medicamentos/:id'. */
export function match(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split('/').filter(Boolean);
  const s = path.split('/').filter(Boolean);
  if (p.length !== s.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    const seg = p[i]!;
    if (seg.startsWith(':')) params[seg.slice(1)] = decodeURIComponent(s[i]!);
    else if (seg !== s[i]) return null;
  }
  return params;
}
