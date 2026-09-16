/**
 * Captura de vídeo o foto.
 *
 * Usa `<input capture>` a propósito: iOS abre la cámara nativa y devuelve el
 * archivo ya recomprimido a 720p, así que un clip de 15 s pesa unos pocos MB.
 * El archivo se guarda primero en el dispositivo y se sube después, de modo que
 * grabar funciona igual sin conexión.
 */
export declare function MediaCaptureButton({ kind, purpose, category, label, icon, linkedEventId, localDate, variant, onDone, }: {
    kind: 'video' | 'foto' | 'documento';
    purpose: 'seguimiento' | 'momento' | 'documento';
    category?: string;
    label: string;
    icon?: preact.ComponentChildren;
    linkedEventId?: string;
    localDate?: string;
    variant?: 'soft' | 'primary' | 'accent';
    onDone?: (mediaId: string) => void;
}): import("preact").JSX.Element;
/**
 * Guía breve y opcional de cómo grabar para que sirva en la consulta.
 * Nunca pide maniobras que puedan doler: eso lo decide el veterinario.
 */
export declare function RecordingTips(): import("preact").JSX.Element;
