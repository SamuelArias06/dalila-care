/**
 * Acceso por enlace mágico.
 *
 * Se abre el enlace una vez y el dispositivo queda recordado para siempre: sin
 * contraseñas, sin pantalla de login, sin avisos de "Google no ha verificado
 * esta app". El código es de un solo uso, así que reenviar el enlace no da
 * acceso a nadie más.
 */
export declare function InviteScreen({ code }: {
    code?: string;
}): import("preact").JSX.Element;
