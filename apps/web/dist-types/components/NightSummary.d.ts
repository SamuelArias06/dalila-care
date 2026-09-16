import { type TrendNotice } from '@dalila/shared';
/**
 * "Hoy con Dalila" — el cierre del día.
 *
 * Sólo muestra líneas con contenido real: una lista llena de ceros haría sentir
 * mal a quien tuvo un día difícil. El texto de cierre cambia si el día fue duro.
 */
export declare function NightSummarySheet({ open, onClose, date, }: {
    open: boolean;
    onClose: () => void;
    date: string;
}): import("preact").JSX.Element | null;
/**
 * Avisos por acumulación. Aparecen aquí y en el historial, nunca al abrir la
 * app por la mañana: informar está bien, sobresaltar a alguien recién
 * despertado no.
 */
export declare function TrendNotices({ notices }: {
    notices: TrendNotice[];
}): import("preact").JSX.Element;
