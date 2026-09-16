import { useRef, useState } from 'preact/hooks';
import { shrinkImage } from '../data/media.js';
import { IconCamera } from '../ui/Icons.js';

/** Selector de foto con recorte a un círculo. Devuelve una data URL JPEG. */
export function PhotoPicker({
  value,
  onChange,
  size = 132,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
  size?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      onChange(await shrinkImage(file, 720, 0.8));
    } catch {
      /* si falla el redimensionado, no rompemos el flujo */
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        aria-label={value ? 'Cambiar la foto' : 'Añadir una foto'}
        style={`width:${size}px;height:${size}px;border-radius:var(--r-full);overflow:hidden;position:relative;
          display:grid;place-items:center;border:3px solid rgba(255,255,255,.9);
          background:${value ? 'transparent' : 'var(--gradient-soft)'};box-shadow:var(--shadow-md)`}
      >
        {value ? (
          <img src={value} alt="" style="width:100%;height:100%;object-fit:cover" />
        ) : (
          <span class="stack" style="align-items:center;gap:4px;color:var(--accent-ink)">
            <IconCamera size={26} />
            <span class="t-xs t-medium">{busy ? 'Un momento…' : 'Añadir foto'}</span>
          </span>
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        class="sr-only"
        onChange={(e) => void pick(e)}
      />
    </>
  );
}
