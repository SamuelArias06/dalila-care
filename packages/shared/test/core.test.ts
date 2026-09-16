import { describe, expect, it } from 'vitest';
import { idPrefix, idTimestamp, isValidId, newId, secureToken, ulid } from '../src/ids.js';
import {
  LIMITS,
  ValidationError,
  entityId,
  localDate,
  mimeType,
  num,
  oneOf,
  plausibleLogDate,
  safeFileName,
  sheetSafe,
  sheetUnsafe,
  str,
  strList,
  weightKg,
} from '../src/validation.js';
import { findFoodWarning, overallStateEmoji, overallStateLabel, signLabel, SIGNS } from '../src/catalogs.js';

describe('identificadores', () => {
  it('genera ids con el prefijo pedido y formato válido', () => {
    const id = newId('dlg');
    expect(id.startsWith('dlg_')).toBe(true);
    expect(isValidId(id, 'dlg')).toBe(true);
    expect(isValidId(id, 'med')).toBe(false);
    expect(idPrefix(id)).toBe('dlg');
  });

  it('son únicos en volumen', () => {
    const ids = new Set(Array.from({ length: 5000 }, () => newId('evt')));
    expect(ids.size).toBe(5000);
  });

  it('son ordenables por tiempo de creación', () => {
    const a = ulid(1_700_000_000_000);
    const b = ulid(1_700_000_001_000);
    expect(a < b).toBe(true);
  });

  it('el timestamp se puede recuperar del id', () => {
    const t = 1_757_900_000_000;
    expect(idTimestamp(newId('evt', t))).toBe(t);
  });

  it('rechaza ids mal formados', () => {
    expect(isValidId('abc')).toBe(false);
    expect(isValidId('dlg_corto')).toBe(false);
    expect(isValidId(42 as unknown)).toBe(false);
    expect(isValidId('dlg_01JBX7M2K9QZ8F4TVN3RPYHW6I')).toBe(false); // la I no existe en Crockford
  });

  it('los tokens seguros son largos y distintos', () => {
    const t = secureToken();
    expect(t.length).toBe(32);
    expect(secureToken()).not.toBe(t);
  });
});

describe('validación', () => {
  it('exige los campos obligatorios', () => {
    expect(() => str('', 'name', 80, true)).toThrow(ValidationError);
    expect(() => str('   ', 'name', 80, true)).toThrow(ValidationError);
    expect(str('  Dalila  ', 'name', 80, true)).toBe('Dalila');
  });

  it('corta por longitud máxima', () => {
    expect(() => str('x'.repeat(LIMITS.note + 1), 'note', LIMITS.note)).toThrow(/demasiado largo/i);
  });

  it('valida números con rango', () => {
    expect(num('32,8', 'w', {})).toBe(32.8);
    expect(() => num('abc', 'w', {})).toThrow(ValidationError);
    expect(() => num(500, 'w', { max: 120 })).toThrow(ValidationError);
    expect(num('', 'w', {})).toBeNull();
  });

  it('valida el peso en un rango plausible para un perro', () => {
    expect(weightKg('32.85')).toBe(32.85);
    expect(() => weightKg(0)).toThrow(ValidationError);
    expect(() => weightKg(500)).toThrow(ValidationError);
  });

  it('acepta sólo opciones conocidas y admite valor por defecto', () => {
    expect(oneOf('normal', 'f', ['normal', 'menos'] as const)).toBe('normal');
    expect(() => oneOf('otra', 'f', ['normal'] as const)).toThrow(ValidationError);
    expect(oneOf('otra', 'f', ['normal'] as const, { fallback: 'normal' })).toBe('normal');
  });

  it('parsea listas desde array y desde JSON', () => {
    expect(strList(['a', 'b'], 'l')).toEqual(['a', 'b']);
    expect(strList('["a","b"]', 'l')).toEqual(['a', 'b']);
    expect(strList('', 'l')).toEqual([]);
    expect(() => strList(Array(200).fill('x'), 'l')).toThrow(ValidationError);
  });

  it('rechaza registrar días futuros', () => {
    expect(() => plausibleLogDate('2026-09-16', '2026-09-15')).toThrow(/todavía no han pasado/);
    expect(plausibleLogDate('2026-09-15', '2026-09-15')).toBe('2026-09-15');
    expect(plausibleLogDate('2026-09-01', '2026-09-15')).toBe('2026-09-01');
  });

  it('valida fechas y referencias', () => {
    expect(() => localDate('15/09/2026', 'd')).toThrow(ValidationError);
    expect(() => entityId('nope', 'ref', 'med')).toThrow(ValidationError);
    expect(entityId(newId('med'), 'ref', 'med')).toBeTruthy();
  });

  it('sólo permite tipos de archivo esperados', () => {
    expect(mimeType('video/mp4')).toBe('video/mp4');
    expect(mimeType('image/jpeg; charset=binary')).toBe('image/jpeg');
    expect(() => mimeType('application/x-msdownload')).toThrow(ValidationError);
    expect(() => mimeType('text/html')).toThrow(ValidationError);
  });
});

describe('seguridad al escribir en Sheets', () => {
  it('neutraliza textos que Sheets interpretaría como fórmula', () => {
    expect(sheetSafe('=IMPORTXML("http://malo","//x")')).toBe("'=IMPORTXML(\"http://malo\",\"//x\")");
    expect(sheetSafe('+1')).toBe("'+1");
    expect(sheetSafe('-5 kg')).toBe("'-5 kg");
    expect(sheetSafe('@usuario')).toBe("'@usuario");
  });

  it('deja intacto el texto normal', () => {
    expect(sheetSafe('Le costó levantarse')).toBe('Le costó levantarse');
    expect(sheetSafe('')).toBe('');
  });

  it('el ciclo de ida y vuelta conserva el texto original', () => {
    for (const t of ['=SUM(A1)', 'texto normal', '+34', 'Dalila ❤️', '']) {
      expect(sheetUnsafe(sheetSafe(t))).toBe(t);
    }
  });

  it('limpia nombres de archivo peligrosos', () => {
    expect(safeFileName('../../etc/passwd')).not.toContain('..');
    expect(safeFileName('vídeo caminata.mp4')).toBe('video caminata.mp4');
    expect(safeFileName('')).toBe('archivo');
    expect(safeFileName('x'.repeat(300)).length).toBeLessThanOrEqual(100);
  });
});

describe('catálogos', () => {
  it('no hay signos con id duplicado', () => {
    const ids = SIGNS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('los signos neurológicos están marcados', () => {
    const neuro = SIGNS.filter((s) => s.neuro).map((s) => s.id);
    expect(neuro).toContain('mov_arrastra_unas');
    expect(neuro).toContain('mov_voltea_pata');
    expect(neuro).toContain('mov_pierde_equilibrio');
  });

  it('traduce los ids de signo a etiqueta', () => {
    expect(signLabel('mov_costo_levantarse')).toBe('Le costó levantarse');
    expect(signLabel('desconocido')).toBe('desconocido');
  });

  it('describe el estado general sin inventar', () => {
    expect(overallStateLabel(4)).toBe('Bien');
    expect(overallStateLabel(null)).toBe('Sin registro');
    expect(overallStateEmoji(undefined)).toBe('·');
  });
});

describe('advertencias de alimentos', () => {
  it('detecta alimentos peligrosos con y sin tildes', () => {
    expect(findFoodWarning('uvas')?.label).toBe('Uvas y pasas');
    expect(findFoodWarning('Uvas pasas')?.label).toBe('Uvas y pasas');
    expect(findFoodWarning('cebolla')?.label).toContain('Cebolla');
    expect(findFoodWarning('Café')?.label).toBe('Cafeína');
    expect(findFoodWarning('chocolate negro')?.label).toBe('Chocolate');
  });

  it('avisa sobre analgésicos humanos', () => {
    const w = findFoodWarning('ibuprofeno');
    expect(w).toBeTruthy();
    expect(w!.warning).toContain('tóxicos');
    expect(w!.source).toContain('Merck');
  });

  it('no molesta con alimentos seguros', () => {
    expect(findFoodWarning('concentrado senior')).toBeNull();
    expect(findFoodWarning('sardina')).toBeNull();
    expect(findFoodWarning('zanahoria')).toBeNull();
    expect(findFoodWarning('')).toBeNull();
  });

  it('toda advertencia cita su fuente', () => {
    for (const name of ['uvas', 'xilitol', 'chocolate', 'ajo', 'macadamia']) {
      expect(findFoodWarning(name)!.source.length).toBeGreaterThan(3);
    }
  });
});
