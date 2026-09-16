/**
 * Enrutado por hash.
 *
 * Con hash no hace falta ninguna regla de reescritura en el hosting estático, y
 * recargar una ruta profunda funciona siempre — incluido cuando la app está
 * instalada en la pantalla de inicio y se abre sin conexión.
 */
export interface Route {
    path: string;
    segments: string[];
    query: URLSearchParams;
}
export declare const route: import("@preact/signals-core").Signal<Route>;
export declare function go(path: string, opts?: {
    replace?: boolean;
}): void;
/** Vuelve a la pantalla anterior dentro de la app, o a Hoy si no hay historial. */
export declare function back(fallback?: string): void;
export declare function startRouter(): void;
/** Coincidencia sencilla de patrones: '/medicamentos/:id'. */
export declare function match(pattern: string, path: string): Record<string, string> | null;
