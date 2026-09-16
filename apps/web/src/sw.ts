/// <reference lib="webworker" />

/**
 * Service worker de Dalila Care.
 *
 * Objetivo concreto: que la app arranque instantáneamente y funcione en modo
 * avión. La lógica es deliberadamente corta.
 *
 *   · El shell (HTML, JS, CSS, iconos) va precacheado y se sirve desde caché.
 *   · La navegación siempre devuelve el index precacheado — la app usa rutas
 *     por hash, así que un solo documento sirve para todas las pantallas.
 *   · Las llamadas a la API y a Google NUNCA se cachean: los datos frescos los
 *     gestiona la capa de sincronización, no el service worker.
 *
 * Nota sobre iOS: no existe Background Sync, así que aquí no hay nada que
 * reintente en segundo plano. La cola se envía cuando la app está abierta.
 */

import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: { url: string; revision: string | null }[];
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Todas las navegaciones devuelven el mismo documento: el enrutado es por hash.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL(`${self.registration.scope}index.html`), {
    denylist: [/^\/api/, /\/macros\//],
  }),
);

// Imágenes servidas desde el propio origen (iconos, splash).
registerRoute(
  ({ request, url }) => request.destination === 'image' && url.origin === self.location.origin,
  new CacheFirst({
    cacheName: 'dalila-img',
    plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 60 })],
  }),
);

/**
 * Nada que venga de Google pasa por caché.
 * Cachear respuestas de la API daría datos viejos con apariencia de frescos, y
 * cachear archivos de Drive guardaría contenido privado en una caché que no
 * controlamos con la misma disciplina que IndexedDB.
 */
registerRoute(
  ({ url }) => url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('google.com'),
  async ({ request }) => fetch(request),
);

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if ((event.data as { type?: string })?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});
