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
export declare const IconHome: (p: Props) => JSX.Element;
export declare const IconTimeline: (p: Props) => JSX.Element;
export declare const IconPlus: (p: Props) => JSX.Element;
export declare const IconHeart: (p: Props) => JSX.Element;
export declare const IconPaw: (p: Props) => JSX.Element;
export declare const IconCheck: (p: Props) => JSX.Element;
export declare const IconChevronRight: (p: Props) => JSX.Element;
export declare const IconChevronLeft: (p: Props) => JSX.Element;
export declare const IconChevronDown: (p: Props) => JSX.Element;
export declare const IconClose: (p: Props) => JSX.Element;
export declare const IconAlert: (p: Props) => JSX.Element;
export declare const IconPill: (p: Props) => JSX.Element;
export declare const IconBowl: (p: Props) => JSX.Element;
export declare const IconWalk: (p: Props) => JSX.Element;
export declare const IconCamera: (p: Props) => JSX.Element;
export declare const IconVideo: (p: Props) => JSX.Element;
export declare const IconNote: (p: Props) => JSX.Element;
export declare const IconWeight: (p: Props) => JSX.Element;
export declare const IconDroplet: (p: Props) => JSX.Element;
export declare const IconChart: (p: Props) => JSX.Element;
export declare const IconStethoscope: (p: Props) => JSX.Element;
export declare const IconQuestion: (p: Props) => JSX.Element;
export declare const IconSettings: (p: Props) => JSX.Element;
export declare const IconPhone: (p: Props) => JSX.Element;
export declare const IconShare: (p: Props) => JSX.Element;
export declare const IconMoon: (p: Props) => JSX.Element;
export declare const IconSun: (p: Props) => JSX.Element;
export declare const IconTrash: (p: Props) => JSX.Element;
export declare const IconEdit: (p: Props) => JSX.Element;
export declare const IconDoc: (p: Props) => JSX.Element;
export declare const IconRefresh: (p: Props) => JSX.Element;
export declare const IconDrag: (p: Props) => JSX.Element;
export declare const IconLock: (p: Props) => JSX.Element;
export declare const IconSparkle: (p: Props) => JSX.Element;
/** Marca de la app: huella sobre degradado rosa → agua marina. */
export declare function Logo({ size }: {
    size?: number;
}): JSX.Element;
export {};
