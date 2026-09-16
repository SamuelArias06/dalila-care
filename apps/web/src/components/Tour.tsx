import { signal } from '@preact/signals';
import { useEffect, useState } from 'preact/hooks';
import { Button, Sheet } from '../ui/Kit.js';
import { IconAlert, IconHeart, IconHome, IconPlus, IconStethoscope, IconVideo } from '../ui/Icons.js';
import { Logo } from '../ui/Icons.js';
import { isStandalone } from '../app/InstallHint.js';

const SEEN_KEY = 'dalila.tourSeen.v1';

/** Permite reabrir el recorrido desde Ajustes. */
export const tourOpen = signal(false);

export function openTour(): void {
  tourOpen.value = true;
}

interface Slide {
  icon: preact.ComponentChildren;
  title: string;
  body: string;
  tip?: string;
}

const SLIDES: Slide[] = [
  {
    icon: <Logo size={58} />,
    title: 'Bienvenida al espacio de Dalila',
    body: 'Aquí anotas cómo está cada día, llevas su rutina y guardas lo que necesitará su veterinario. Te lo mostramos en un minuto.',
  },
  {
    icon: <IconHome size={30} />,
    title: 'Empieza el día en Hoy',
    body: 'Toca una carita para decir cómo amaneció. Debajo está lo que toca hoy: un toque marca cada tarea como hecha.',
    tip: 'Toca la flecha de una tarea para añadir una nota o decir que hoy no se hizo.',
  },
  {
    icon: <IconPlus size={30} />,
    title: 'Registra en segundos',
    body: 'El botón rosa del centro abre los registros rápidos: comida, medicamento, paseo, pipí y popó, peso o una nota.',
    tip: 'Por la noche, el check-in completo te toma menos de un minuto.',
  },
  {
    icon: <IconAlert size={30} />,
    title: 'Si algo te preocupa',
    body: '"Me preocupa algo" registra lo que viste y te orienta sobre si conviene observar, llamar hoy al veterinario o ir a urgencias.',
    tip: 'Guarda en su perfil el teléfono de urgencias: la app te lo ofrecerá cuando haga falta.',
  },
  {
    icon: <IconVideo size={30} />,
    title: 'Vídeos cortos, mucha información',
    body: 'Un clip de 15 segundos caminando vale más que cualquier descripción. Se guarda aunque no haya señal y se sube solo después.',
  },
  {
    icon: <IconStethoscope size={30} />,
    title: 'Llega preparada a la consulta',
    body: 'Anota preguntas cuando se te ocurran. Antes de la cita, "Preparar consulta" junta todo en un resumen para enseñar o imprimir.',
  },
  {
    icon: <IconHeart size={30} />,
    title: 'Y los días buenos también',
    body: 'En Momentos guarda las fotos y las cosas bonitas. Dalila no es su diagnóstico.',
    tip: 'Puedes volver a ver esta guía cuando quieras desde Ajustes.',
  },
];

/**
 * Recorrido de bienvenida. Se muestra una sola vez tras el onboarding y se
 * puede reabrir desde Ajustes. Nunca se muestra encima de la guía de
 * instalación: espera a que la app ya esté en uso.
 */
export function Tour() {
  const [i, setI] = useState(0);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === '1';
    } catch {
      seen = true; // sin almacenamiento no insistimos en cada apertura
    }
    // Si la app aún no está instalada, primero se muestra la guía de instalación;
    // el recorrido espera a la primera apertura desde el icono.
    let installDismissed = false;
    try {
      installDismissed = !!localStorage.getItem('dalila.installHintDismissedAt');
    } catch {
      installDismissed = true;
    }
    if (!seen && (isStandalone() || installDismissed)) {
      const t = setTimeout(() => (tourOpen.value = true), 900);
      return () => clearTimeout(t);
    }
    return undefined;
  }, []);

  const close = () => {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignorado */
    }
    tourOpen.value = false;
    setI(0);
  };

  if (!tourOpen.value) return null;
  const slide = SLIDES[i]!;
  const last = i === SLIDES.length - 1;

  return (
    <Sheet open onClose={close}>
      <div class="stack-lg rise" key={i} style="text-align:center;padding-top:var(--s-2)">
        <div
          style="margin:0 auto;width:84px;height:84px;border-radius:26px;display:grid;place-items:center;
            background:var(--gradient-soft);color:var(--accent-ink);box-shadow:var(--shadow-sm)"
        >
          {slide.icon}
        </div>
        <div class="stack-sm">
          <h2 class="t-heading">{slide.title}</h2>
          <p class="t-md t-soft" style="max-width:34ch;margin:0 auto">{slide.body}</p>
        </div>
        {slide.tip && (
          <p
            class="t-sm"
            style="padding:var(--s-3) var(--s-4);border-radius:var(--r-md);background:var(--accent-soft);color:var(--accent-ink)"
          >
            {slide.tip}
          </p>
        )}

        <div class="row" style="justify-content:center;gap:6px" aria-label={`Paso ${i + 1} de ${SLIDES.length}`}>
          {SLIDES.map((_, n) => (
            <span
              key={n}
              style={`height:7px;border-radius:999px;transition:all var(--dur) var(--ease);
                width:${n === i ? 22 : 7}px;background:${n === i ? 'var(--brand)' : 'var(--border-strong)'}`}
            />
          ))}
        </div>

        <div class="stack-sm">
          <Button variant="primary" block onClick={() => (last ? close() : setI(i + 1))}>
            {last ? 'Empezar' : 'Siguiente'}
          </Button>
          <div class="row" style="gap:var(--s-2)">
            {i > 0 && (
              <Button variant="quiet" class="grow" onClick={() => setI(i - 1)}>
                Atrás
              </Button>
            )}
            {!last && (
              <Button variant="quiet" class="grow" onClick={close}>
                Saltar
              </Button>
            )}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
