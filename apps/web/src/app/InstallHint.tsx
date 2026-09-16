import { useEffect, useState } from 'preact/hooks';
import { Button, Sheet } from '../ui/Kit.js';
import { Logo } from '../ui/Icons.js';

const DISMISS_KEY = 'dalila.installHintDismissedAt';
const REMIND_AFTER_DAYS = 5;

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/**
 * Instalar no es opcional en iPhone y por eso insistimos, con suavidad.
 *
 * Safari borra el almacenamiento de un sitio tras 7 días sin usarlo, pero las
 * apps añadidas a la pantalla de inicio están exentas. Sin instalar, un cambio
 * hecho sin conexión podría perderse; instalada, además se abre a pantalla
 * completa y arranca sin red.
 */
export function InstallHint() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    let dismissedAt = 0;
    try {
      dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? '0');
    } catch {
      /* almacenamiento bloqueado: se muestra igualmente */
    }
    const days = (Date.now() - dismissedAt) / 86_400_000;
    if (!dismissedAt || days > REMIND_AFTER_DAYS) {
      const t = setTimeout(() => setOpen(true), 1400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignorado */
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Sheet open onClose={dismiss}>
      <div class="stack" style="align-items:center;text-align:center;padding-bottom:var(--s-2)">
        <Logo size={58} />
        <h2 class="t-subtitle">Añádela a tu pantalla de inicio</h2>
        <p class="t-sm t-soft" style="max-width:34ch">
          Así se abre como una app, funciona sin conexión y no se pierde nada de lo que registres.
        </p>
      </div>

      <div class="stack-sm" style="margin:var(--s-5) 0">
        {(isIOS()
          ? [
              ['1', 'Toca el botón Compartir', 'El cuadrado con la flecha hacia arriba, abajo en Safari.'],
              ['2', 'Elige “Añadir a pantalla de inicio”', 'Puede que tengas que bajar un poco en la lista.'],
              ['3', 'Toca “Añadir”', 'Y ábrela desde el icono de Dalila.'],
            ]
          : [
              ['1', 'Abre el menú del navegador', 'Los tres puntos, arriba a la derecha.'],
              ['2', 'Elige “Instalar aplicación”', 'También puede decir “Añadir a pantalla de inicio”.'],
              ['3', 'Confirma', 'Y ábrela desde el icono de Dalila.'],
            ]
        ).map(([n, title, body]) => (
          <div key={n} class="row" style="align-items:flex-start;gap:var(--s-3)">
            <span
              style="flex-shrink:0;width:30px;height:30px;border-radius:var(--r-full);display:grid;place-items:center;
                background:var(--gradient-brand);color:#fff;font-weight:700;font-size:var(--t-sm)"
            >
              {n}
            </span>
            <div class="grow">
              <p class="t-body t-medium">{title}</p>
              <p class="t-sm t-soft">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <div class="stack-sm">
        <Button variant="primary" block onClick={dismiss}>
          Entendido
        </Button>
        <Button variant="quiet" block onClick={dismiss}>
          Ahora no
        </Button>
      </div>
    </Sheet>
  );
}
