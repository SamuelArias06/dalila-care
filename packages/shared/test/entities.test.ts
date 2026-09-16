import { describe, expect, it } from 'vitest';
import { COLLECTION_PREFIX, isKnownCollection, validatePatch } from '../src/entities.js';
import { ValidationError } from '../src/validation.js';
import { COLLECTIONS } from '../src/protocol.js';
import { newId } from '../src/ids.js';

const TODAY = '2026-09-15';

describe('validación por colección', () => {
  it('toda colección declarada tiene validador y prefijo de id', () => {
    for (const c of COLLECTIONS) {
      expect(isKnownCollection(c), `falta validador para ${c}`).toBe(true);
      expect(COLLECTION_PREFIX[c], `falta prefijo para ${c}`).toMatch(/^[a-z]{3}$/);
    }
  });

  it('rechaza una colección inventada', () => {
    expect(isKnownCollection('perros')).toBe(false);
    expect(() => validatePatch('perros' as never, {}, TODAY)).toThrow(ValidationError);
  });

  it('descarta campos que no están declarados', () => {
    const out = validatePatch('dailyLogs', {
      localDate: TODAY,
      overallState: 4,
      campoInventado: 'deberia desaparecer',
      __proto__: { hack: true },
    }, TODAY);
    expect(out['campoInventado']).toBeUndefined();
    expect(out['hack']).toBeUndefined();
    expect(out['overallState']).toBe(4);
  });

  it('sólo escribe los campos presentes en el patch', () => {
    const out = validatePatch('dailyLogs', { appetite: 'menos' }, TODAY);
    expect(Object.keys(out)).toEqual(['appetite']);
  });
});

describe('registro diario', () => {
  it('acepta un check-in completo', () => {
    const out = validatePatch('dailyLogs', {
      localDate: TODAY,
      overallState: 3,
      mobility: 'algo_peor',
      mobilitySigns: ['mov_costo_levantarse', 'mov_arrastra_unas'],
      discomfortSigns: ['inc_jadeo'],
      appetite: 'menos',
      water: 'normal',
      urine: 'normal',
      stool: 'blandas',
      stoolFlags: ['dig_moco'],
      sleep: 'inquieta',
      mood: ['ani_apagada'],
      note: 'Le costó levantarse.',
    }, TODAY);
    expect(out['overallState']).toBe(3);
    expect(out['mobilitySigns']).toHaveLength(2);
    expect(out['note']).toBe('Le costó levantarse.');
  });

  it('no permite registrar un día futuro', () => {
    expect(() => validatePatch('dailyLogs', { localDate: '2026-09-16' }, TODAY)).toThrow(/todavía no han pasado/);
  });

  it('acepta registros retroactivos', () => {
    expect(validatePatch('dailyLogs', { localDate: '2026-08-01' }, TODAY)['localDate']).toBe('2026-08-01');
  });

  it('rechaza un estado general fuera de rango', () => {
    expect(() => validatePatch('dailyLogs', { localDate: TODAY, overallState: 9 }, TODAY)).toThrow(ValidationError);
    expect(() => validatePatch('dailyLogs', { localDate: TODAY, overallState: 0 }, TODAY)).toThrow(ValidationError);
  });

  it('permite limpiar el estado general', () => {
    expect(validatePatch('dailyLogs', { overallState: null }, TODAY)['overallState']).toBeNull();
  });

  it('rechaza una opción de movilidad inventada', () => {
    expect(() => validatePatch('dailyLogs', { mobility: 'fatal' }, TODAY)).toThrow(ValidationError);
  });
});

describe('medicamentos', () => {
  it('exige la dosis como texto literal', () => {
    const medId = newId('med');
    const out = validatePatch('medicationVersions', {
      medicationId: medId,
      doseText: '1 tableta cada 24 h con comida',
      effectiveFrom: TODAY,
    }, TODAY);
    expect(out['doseText']).toBe('1 tableta cada 24 h con comida');
  });

  it('no acepta una versión sin dosis', () => {
    expect(() =>
      validatePatch('medicationVersions', { medicationId: newId('med'), doseText: '', effectiveFrom: TODAY }, TODAY),
    ).toThrow(ValidationError);
  });

  it('nunca produce un campo numérico de dosis con el que se pueda hacer aritmética', () => {
    const out = validatePatch('medicationVersions', {
      medicationId: newId('med'),
      doseText: '50 mg',
      effectiveFrom: TODAY,
      doseMg: 50,
      doseNumber: 50,
    }, TODAY);
    expect(out['doseMg']).toBeUndefined();
    expect(out['doseNumber']).toBeUndefined();
    expect(typeof out['doseText']).toBe('string');
  });

  it('rechaza una referencia de medicamento con prefijo equivocado', () => {
    expect(() =>
      validatePatch('doses', { medicationId: newId('fdi'), localDate: TODAY, status: 'administrado' }, TODAY),
    ).toThrow(ValidationError);
  });

  it('exige un estado de toma conocido', () => {
    expect(() =>
      validatePatch('doses', { medicationId: newId('med'), localDate: TODAY, status: 'tal vez' }, TODAY),
    ).toThrow(ValidationError);
  });
});

describe('peso y condición corporal', () => {
  it('acepta un peso plausible y lo redondea', () => {
    expect(validatePatch('weights', { localDate: TODAY, weightKg: '32,847' }, TODAY)['weightKg']).toBe(32.85);
  });

  it('rechaza pesos imposibles para un perro', () => {
    expect(() => validatePatch('weights', { localDate: TODAY, weightKg: 0 }, TODAY)).toThrow(ValidationError);
    expect(() => validatePatch('weights', { localDate: TODAY, weightKg: 900 }, TODAY)).toThrow(ValidationError);
  });

  it('acepta el BCS sólo dentro de la escala de 9 puntos', () => {
    expect(validatePatch('weights', { bcsValue: 7 }, TODAY)['bcsValue']).toBe(7);
    expect(() => validatePatch('weights', { bcsValue: 12 }, TODAY)).toThrow(ValidationError);
  });
});

describe('media', () => {
  it('sólo acepta tipos de archivo permitidos', () => {
    const base = { kind: 'video', localDate: TODAY, mimeType: 'video/mp4', sizeBytes: 1000, capturedAt: '2026-09-15T10:00:00-05:00' };
    expect(validatePatch('media', base, TODAY)['mimeType']).toBe('video/mp4');
    expect(() => validatePatch('media', { ...base, mimeType: 'application/x-msdownload' }, TODAY)).toThrow(ValidationError);
    expect(() => validatePatch('media', { ...base, mimeType: 'text/html' }, TODAY)).toThrow(ValidationError);
  });

  it('rechaza archivos por encima del límite', () => {
    expect(() =>
      validatePatch('media', { kind: 'video', localDate: TODAY, sizeBytes: 900 * 1024 * 1024 }, TODAY),
    ).toThrow(ValidationError);
  });

  it('rechaza una miniatura que no sea una imagen', () => {
    expect(() =>
      validatePatch('media', { kind: 'foto', localDate: TODAY, posterDataUrl: 'javascript:alert(1)' }, TODAY),
    ).toThrow(/miniatura/i);
  });

  it('rechaza una miniatura desproporcionada', () => {
    expect(() =>
      validatePatch('media', { kind: 'foto', localDate: TODAY, posterDataUrl: `data:image/jpeg;base64,${'A'.repeat(250000)}` }, TODAY),
    ).toThrow(/demasiado grande/i);
  });
});

describe('eventos', () => {
  it('guarda qué orientación mostró la app, para poder auditarla', () => {
    const out = validatePatch('events', {
      localDate: TODAY,
      category: 'movilidad',
      triageLevel: 'contactar_hoy',
      triageRuleId: 'RF-O01',
      isConcern: true,
      extraSigns: ['arrastra_unas'],
    }, TODAY);
    expect(out['triageLevel']).toBe('contactar_hoy');
    expect(out['triageRuleId']).toBe('RF-O01');
    expect(out['isConcern']).toBe(true);
  });

  it('cae en "otro" ante una categoría desconocida en vez de fallar', () => {
    expect(validatePatch('events', { localDate: TODAY, category: 'inventada' }, TODAY)['category']).toBe('otro');
  });
});

describe('rutinas', () => {
  it('valida los días de la semana', () => {
    expect(validatePatch('tasks', { daysOfWeek: [1, 3, 5] }, TODAY)['daysOfWeek']).toEqual([1, 3, 5]);
    expect(() => validatePatch('tasks', { daysOfWeek: [0] }, TODAY)).toThrow(ValidationError);
    expect(() => validatePatch('tasks', { daysOfWeek: [8] }, TODAY)).toThrow(ValidationError);
  });

  it('valida la hora en formato de 24 horas', () => {
    expect(validatePatch('tasks', { scheduledTime: '08:30' }, TODAY)['scheduledTime']).toBe('08:30');
    expect(() => validatePatch('tasks', { scheduledTime: '8:30 am' }, TODAY)).toThrow(ValidationError);
  });

  it('exige un título', () => {
    expect(() => validatePatch('tasks', { title: '   ' }, TODAY)).toThrow(ValidationError);
  });
});

describe('límites de texto', () => {
  it('corta por longitud en las notas largas', () => {
    expect(() => validatePatch('dailyLogs', { note: 'x'.repeat(5000) }, TODAY)).toThrow(/demasiado largo/i);
  });

  it('acepta una nota larga pero razonable', () => {
    expect(validatePatch('dailyLogs', { note: 'x'.repeat(3000) }, TODAY)['note']).toHaveLength(3000);
  });
});
