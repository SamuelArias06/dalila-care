export declare function isStandalone(): boolean;
export declare function isIOS(): boolean;
/**
 * Instalar no es opcional en iPhone y por eso insistimos, con suavidad.
 *
 * Safari borra el almacenamiento de un sitio tras 7 días sin usarlo, pero las
 * apps añadidas a la pantalla de inicio están exentas. Sin instalar, un cambio
 * hecho sin conexión podría perderse; instalada, además se abre a pantalla
 * completa y arranca sin red.
 */
export declare function InstallHint(): import("preact").JSX.Element | null;
