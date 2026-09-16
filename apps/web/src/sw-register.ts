/**
 * Registro del service worker.
 *
 * Cuando hay una versión nueva se recarga sola en cuanto la app queda en
 * segundo plano: así la usuaria nunca ve un cartel de "hay una actualización"
 * ni pierde lo que estaba escribiendo.
 */

export function registerSW(): void {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const next = reg.installing;
          if (!next) return;
          next.addEventListener('statechange', () => {
            if (next.state === 'installed' && navigator.serviceWorker.controller) {
              const applyWhenHidden = () => {
                if (document.visibilityState === 'hidden') {
                  next.postMessage({ type: 'SKIP_WAITING' });
                  document.removeEventListener('visibilitychange', applyWhenHidden);
                }
              };
              document.addEventListener('visibilitychange', applyWhenHidden);
            }
          });
        });
      })
      .catch(() => {
        /* sin service worker la app sigue funcionando, sólo pierde el offline */
      });

    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  });
}
