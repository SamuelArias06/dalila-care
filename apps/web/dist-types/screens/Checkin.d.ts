/**
 * Check-in diario.
 *
 * Todo es opcional y se guarda al tocar: no hay un botón "Enviar" que se pueda
 * perder. Cada bloque tiene "No noté nada de esto", porque un no-hallazgo
 * registrado vale tanto como un hallazgo — sin eso no se puede distinguir "no
 * pasó" de "no lo anotó", y esa distinción es lo que hace útil el resumen para
 * el veterinario.
 *
 * Nunca se pide "nivel de dolor": sólo observaciones. Ver
 * docs/POLITICA_CONTENIDO_MEDICO.md.
 */
export declare function CheckinScreen({ date }: {
    date?: string;
}): import("preact").JSX.Element;
