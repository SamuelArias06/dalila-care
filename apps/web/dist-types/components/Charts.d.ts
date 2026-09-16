/**
 * Gráficos en SVG, escritos a mano.
 *
 * Son cuatro formas muy simples: no justifican los ~70 KB de una librería de
 * charts, y así encajan con el resto del diseño.
 *
 * Todos son descriptivos: muestran lo que se registró, con su denominador, y
 * nunca sacan conclusiones. Ver docs/POLITICA_CONTENIDO_MEDICO.md.
 */
export interface Point {
    date: string;
    value: number | null;
}
export declare function LineChart({ points, unit, target, height, }: {
    points: Point[];
    unit?: string;
    target?: number | null;
    height?: number;
}): import("preact").JSX.Element;
/** Barras horizontales con conteo absoluto. Nunca porcentajes. */
export declare function BarList({ items, total, }: {
    items: {
        label: string;
        count: number;
        color?: string;
        emoji?: string;
    }[];
    total: number;
}): import("preact").JSX.Element;
/** Barras verticales por semana. */
export declare function WeekBars({ weeks, }: {
    weeks: {
        label: string;
        count: number;
        recorded: number;
    }[];
}): import("preact").JSX.Element;
/** Puntos por día: una fila compacta para ver un mes de un vistazo. */
export declare function DayDots({ days, valueOf, }: {
    days: string[];
    valueOf: (date: string) => number | null;
}): import("preact").JSX.Element;
