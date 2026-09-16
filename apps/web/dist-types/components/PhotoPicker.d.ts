/** Selector de foto con recorte a un círculo. Devuelve una data URL JPEG. */
export declare function PhotoPicker({ value, onChange, size, }: {
    value: string;
    onChange: (dataUrl: string) => void;
    size?: number;
}): import("preact").JSX.Element;
