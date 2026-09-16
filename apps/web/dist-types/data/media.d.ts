/**
 * Captura y subida de fotos y vídeos.
 *
 * El flujo evita a propósito que los bytes pasen por Apps Script (el cuerpo de
 * un POST está limitado a ~50 MB, en base64, sin reanudación ni progreso):
 *
 *   1. iOS entrega el archivo ya recomprimido a 720p desde `<input capture>`.
 *   2. Se genera un póster pequeño en el navegador, para que la galería cargue
 *      al instante sin descargar ningún vídeo.
 *   3. El Blob se guarda en IndexedDB y la ficha aparece ya como "pendiente".
 *   4. El backend abre una sesión de subida reanudable y el navegador sube los
 *      bytes directo a googleapis.com, por trozos y con progreso.
 *   5. El Blob local sólo se borra cuando el servidor confirma.
 */
export interface CaptureResult {
    mediaId: string;
    posterDataUrl: string;
    durationSec: number | null;
}
/** Reduce una imagen y la devuelve como data URL JPEG. */
export declare function shrinkImage(file: Blob, maxSide?: number, quality?: number): Promise<string>;
/** Extrae un fotograma del vídeo como miniatura, y de paso su duración. */
export declare function videoPoster(file: Blob): Promise<{
    poster: string;
    durationSec: number | null;
}>;
/**
 * Registra el archivo localmente y lo deja en cola. Devuelve enseguida: la
 * ficha ya se ve en la app aunque no haya red.
 */
export declare function captureMedia(file: File, opts: {
    kind: 'video' | 'foto' | 'documento';
    purpose: 'seguimiento' | 'momento' | 'documento';
    category?: string;
    note?: string;
    localDate?: string;
    isFavorite?: boolean;
    linkedEventId?: string;
}): Promise<CaptureResult>;
export declare const uploadProgress: Map<string, number>;
export declare function processUploadQueue(): Promise<void>;
export declare function installUploadTriggers(): void;
export declare function mediaObjectUrl(driveFileId: string): Promise<string>;
/** Vídeo aún sin subir: se reproduce directamente desde el dispositivo. */
export declare function localObjectUrl(mediaId: string): Promise<string | null>;
