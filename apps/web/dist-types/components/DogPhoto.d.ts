/**
 * Foto de perfil de Dalila.
 *
 * Prefiere el póster guardado en local (aparece al instante y funciona sin
 * conexión) y sólo descarga de Drive si no hay ninguno.
 */
export declare function useDogPhoto(): string;
export declare function DogPhoto({ size, class: cls }: {
    size?: number;
    class?: string;
}): import("preact").JSX.Element;
