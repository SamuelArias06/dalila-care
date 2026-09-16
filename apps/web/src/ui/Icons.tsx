/**
 * Iconos dibujados a mano en SVG.
 *
 * Son trazos de 1.7px con extremos redondeados, en el mismo estilo en toda la
 * app. Van inline para que no haya ni una petición de red y para que hereden
 * el color del texto.
 */

import type { JSX } from 'preact';

interface Props extends JSX.SVGAttributes<SVGSVGElement> {
  size?: number;
}

function Svg({ size = 24, children, ...rest }: Props & { children: preact.ComponentChildren }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: Props) => (
  <Svg {...p}>
    <path d="M3 10.2 12 3l9 7.2" />
    <path d="M5.5 9.3V20h13V9.3" />
    <path d="M9.6 20v-5.2h4.8V20" />
  </Svg>
);

export const IconTimeline = (p: Props) => (
  <Svg {...p}>
    <rect x="3.2" y="4.6" width="17.6" height="16.2" rx="3.4" />
    <path d="M3.2 9.4h17.6M8.2 2.8v3.6M15.8 2.8v3.6" />
    <circle cx="8.4" cy="13.6" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="13.6" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="8.4" cy="17.2" r="1.1" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconPlus = (p: Props) => (
  <Svg {...p}>
    <path d="M12 5.2v13.6M5.2 12h13.6" stroke-width="2.1" />
  </Svg>
);

export const IconHeart = (p: Props) => (
  <Svg {...p}>
    <path d="M12 20.3s-7.6-4.6-7.6-9.6a4.3 4.3 0 0 1 7.6-2.8 4.3 4.3 0 0 1 7.6 2.8c0 5-7.6 9.6-7.6 9.6Z" />
  </Svg>
);

export const IconPaw = (p: Props) => (
  <Svg {...p}>
    <ellipse cx="7.1" cy="9.2" rx="1.9" ry="2.4" />
    <ellipse cx="12" cy="7.5" rx="1.9" ry="2.5" />
    <ellipse cx="16.9" cy="9.2" rx="1.9" ry="2.4" />
    <path d="M12 12.4c2.9 0 5.2 2 5.2 4.3 0 1.8-1.6 2.9-3.3 2.6-.7-.1-1.2-.3-1.9-.3s-1.2.2-1.9.3c-1.7.3-3.3-.8-3.3-2.6 0-2.3 2.3-4.3 5.2-4.3Z" />
  </Svg>
);

export const IconCheck = (p: Props) => (
  <Svg {...p}>
    <path d="M4.6 12.4 9.4 17l10-10.6" stroke-width="2.4" />
  </Svg>
);

export const IconChevronRight = (p: Props) => (
  <Svg {...p}>
    <path d="M9.2 5.4 15.8 12l-6.6 6.6" />
  </Svg>
);

export const IconChevronLeft = (p: Props) => (
  <Svg {...p}>
    <path d="M14.8 5.4 8.2 12l6.6 6.6" />
  </Svg>
);

export const IconChevronDown = (p: Props) => (
  <Svg {...p}>
    <path d="M5.6 9.2 12 15.6l6.4-6.4" />
  </Svg>
);

export const IconClose = (p: Props) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" stroke-width="2" />
  </Svg>
);

export const IconAlert = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3.8 21.2 20H2.8L12 3.8Z" />
    <path d="M12 9.8v4.3M12 17.1v.1" stroke-width="2.1" />
  </Svg>
);

export const IconPill = (p: Props) => (
  <Svg {...p}>
    <rect x="2.6" y="8.4" width="18.8" height="7.2" rx="3.6" transform="rotate(-45 12 12)" />
    <path d="M8.4 8.4 15.6 15.6" />
  </Svg>
);

export const IconBowl = (p: Props) => (
  <Svg {...p}>
    <path d="M3.4 10.6h17.2a8.6 8.6 0 0 1-8.6 8.2 8.6 8.6 0 0 1-8.6-8.2Z" />
    <path d="M8.2 7.4c0-1.4 1.2-2.2 1.2-3.2M12 7.4c0-1.6 1.4-2.4 1.4-3.6M15.8 7.4c0-1.2 1-1.9 1-2.7" />
  </Svg>
);

export const IconWalk = (p: Props) => (
  <Svg {...p}>
    <circle cx="13.6" cy="4.6" r="1.9" />
    <path d="M11.4 20.4l1.6-5.1-2.6-2.3.9-4.4 3.4 1.5 2.1 2.8" />
    <path d="M10.3 8.6 7 10.4l-.9 3.2M13 15.3l2.4 5.1" />
  </Svg>
);

export const IconCamera = (p: Props) => (
  <Svg {...p}>
    <rect x="2.6" y="6.6" width="18.8" height="13.2" rx="3.2" />
    <circle cx="12" cy="13.2" r="3.6" />
    <path d="M8.4 6.6 9.8 4.2h4.4l1.4 2.4" />
  </Svg>
);

export const IconVideo = (p: Props) => (
  <Svg {...p}>
    <rect x="2.6" y="6.2" width="13.4" height="11.6" rx="3" />
    <path d="M16 11.2 21.4 8v8l-5.4-3.2z" />
  </Svg>
);

export const IconNote = (p: Props) => (
  <Svg {...p}>
    <path d="M5 3.8h9.6L19 8.2V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4.8a1 1 0 0 1 1-1Z" />
    <path d="M14.2 3.9v4.4h4.5M7.6 12.6h8.2M7.6 16.2h5.6" />
  </Svg>
);

export const IconWeight = (p: Props) => (
  <Svg {...p}>
    <path d="M5.4 7.6h13.2l2 12.6H3.4l2-12.6Z" />
    <circle cx="12" cy="5.6" r="2.1" />
    <path d="M9.6 12.4a2.6 2.6 0 0 1 4.8 0" />
  </Svg>
);

export const IconDroplet = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3.4c3.2 3.7 5.6 6.6 5.6 9.5A5.6 5.6 0 0 1 6.4 12.9c0-2.9 2.4-5.8 5.6-9.5Z" />
  </Svg>
);

export const IconChart = (p: Props) => (
  <Svg {...p}>
    <path d="M4 20V9.6M10 20V4.6M16 20v-7.4M21.4 20H2.6" />
  </Svg>
);

export const IconStethoscope = (p: Props) => (
  <Svg {...p}>
    <path d="M6 3.4v5.2a4 4 0 0 0 8 0V3.4" />
    <path d="M6 3.4H4.4M14 3.4h1.6M10 12.6v2.6a4.4 4.4 0 0 0 8.8 0v-1.4" />
    <circle cx="18.8" cy="11.6" r="2.1" />
  </Svg>
);

export const IconQuestion = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.8" />
    <path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2-2.4 3.6M12 17.2v.1" stroke-width="2" />
  </Svg>
);

export const IconSettings = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.1" />
    <path d="M19.2 14.6a1.6 1.6 0 0 0 .3 1.8l.1.1a1.9 1.9 0 1 1-2.7 2.7l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a1.9 1.9 0 1 1-3.8 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1h-.2a1.9 1.9 0 1 1 0-3.8h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a1.9 1.9 0 1 1 2.7-2.7l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5v-.2a1.9 1.9 0 1 1 3.8 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a1.9 1.9 0 1 1 2.7 2.7l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.2a1.9 1.9 0 1 1 0 3.8h-.1a1.6 1.6 0 0 0-1.5 1Z" />
  </Svg>
);

export const IconPhone = (p: Props) => (
  <Svg {...p}>
    <path d="M21.2 16.9v2.6a1.8 1.8 0 0 1-1.9 1.8 17.6 17.6 0 0 1-7.7-2.7 17.3 17.3 0 0 1-5.3-5.3A17.6 17.6 0 0 1 3.6 5.5a1.8 1.8 0 0 1 1.8-1.9H8a1.8 1.8 0 0 1 1.8 1.5c.1.9.3 1.7.6 2.5a1.8 1.8 0 0 1-.4 1.9l-1.1 1.1a14.2 14.2 0 0 0 5.3 5.3l1.1-1.1a1.8 1.8 0 0 1 1.9-.4c.8.3 1.6.5 2.5.6a1.8 1.8 0 0 1 1.5 1.9Z" />
  </Svg>
);

export const IconShare = (p: Props) => (
  <Svg {...p}>
    <path d="M12 15.4V3.6M8.2 7.2 12 3.4l3.8 3.8" />
    <path d="M5.4 12.6v6.2a1.6 1.6 0 0 0 1.6 1.6h10a1.6 1.6 0 0 0 1.6-1.6v-6.2" />
  </Svg>
);

export const IconMoon = (p: Props) => (
  <Svg {...p}>
    <path d="M20.4 13.4A8.6 8.6 0 1 1 10.6 3.6a6.8 6.8 0 0 0 9.8 9.8Z" />
  </Svg>
);

export const IconSun = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.6v2M12 19.4v2M4.4 4.4l1.4 1.4M18.2 18.2l1.4 1.4M2.6 12h2M19.4 12h2M4.4 19.6l1.4-1.4M18.2 5.8l1.4-1.4" />
  </Svg>
);

export const IconTrash = (p: Props) => (
  <Svg {...p}>
    <path d="M3.8 6.4h16.4M8.6 6.4V4.8a1.4 1.4 0 0 1 1.4-1.4h4a1.4 1.4 0 0 1 1.4 1.4v1.6" />
    <path d="M6.2 6.4l.9 13a1.4 1.4 0 0 0 1.4 1.3h7a1.4 1.4 0 0 0 1.4-1.3l.9-13" />
  </Svg>
);

export const IconEdit = (p: Props) => (
  <Svg {...p}>
    <path d="M13.6 4.8 19.2 10.4M4 20.4l1-4.4L15.5 5.5a1.9 1.9 0 0 1 2.7 0l1.3 1.3a1.9 1.9 0 0 1 0 2.7L8.4 19.4l-4.4 1Z" />
  </Svg>
);

export const IconDoc = (p: Props) => (
  <Svg {...p}>
    <path d="M5.6 3.6h7.2l5.6 5.6v11.2H5.6z" />
    <path d="M12.6 3.7v5.5h5.6" />
  </Svg>
);

export const IconRefresh = (p: Props) => (
  <Svg {...p}>
    <path d="M20.4 11.4a8.4 8.4 0 1 0-.8 4.6" />
    <path d="M20.6 5.6v5.8h-5.8" />
  </Svg>
);

export const IconDrag = (p: Props) => (
  <Svg {...p}>
    <circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconLock = (p: Props) => (
  <Svg {...p}>
    <rect x="4.6" y="10.2" width="14.8" height="10.2" rx="2.6" />
    <path d="M8.2 10.2V7.6a3.8 3.8 0 0 1 7.6 0v2.6" />
  </Svg>
);

export const IconSparkle = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3.2l1.9 5.3 5.3 1.9-5.3 1.9-1.9 5.3-1.9-5.3-5.3-1.9 5.3-1.9L12 3.2Z" />
    <path d="M18.4 16.2l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
  </Svg>
);

/** Marca de la app: huella sobre degradado rosa → agua marina. */
export function Logo({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="dc-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FF7BA8" />
          <stop offset="100%" stop-color="#3EC5BF" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#dc-logo)" />
      <g fill="#fff">
        <ellipse cx="22.4" cy="25.6" rx="4.6" ry="5.9" />
        <ellipse cx="34" cy="21.6" rx="4.8" ry="6.3" />
        <ellipse cx="45" cy="27.4" rx="4.4" ry="5.5" />
        <path d="M33.6 33.4c7.2 0 12.9 5 12.9 10.7 0 4.5-4 7.2-8.2 6.5-1.7-.3-3-.8-4.7-.8s-3 .5-4.7.8c-4.2.7-8.2-2-8.2-6.5 0-5.7 5.7-10.7 12.9-10.7Z" />
      </g>
    </svg>
  );
}
