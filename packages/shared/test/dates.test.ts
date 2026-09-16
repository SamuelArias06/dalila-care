import { describe, expect, it } from 'vitest';
import {
  addDays,
  atLocalTime,
  daysBetween,
  eachDay,
  formatAge,
  formatDateLong,
  formatDateNumeric,
  formatDuration,
  formatRelativeDay,
  greetingFor,
  isValidLocalDate,
  isValidTime,
  lastNDays,
  localDateOf,
  localTimeOf,
  nowIso,
  weekdayOf,
} from '../src/dates.js';

describe('día local en Bogotá', () => {
  it('asigna un registro de las 22:00 al día correcto y no al siguiente', () => {
    // 2026-09-16T03:00:00Z son las 22:00 del día 15 en Bogotá.
    expect(localDateOf('2026-09-16T03:00:00Z')).toBe('2026-09-15');
    expect(localTimeOf('2026-09-16T03:00:00Z')).toBe('22:00');
  });

  it('cruza correctamente la medianoche local', () => {
    // 05:00Z = 00:00 en Bogotá → ya es el día 16.
    expect(localDateOf('2026-09-16T05:00:00Z')).toBe('2026-09-16');
    // 04:59Z = 23:59 del 15.
    expect(localDateOf('2026-09-16T04:59:00Z')).toBe('2026-09-15');
  });

  it('serializa con el offset explícito de Colombia', () => {
    expect(nowIso(new Date('2026-09-16T03:00:00Z'))).toBe('2026-09-15T22:00:00-05:00');
  });

  it('atLocalTime produce un instante que vuelve al mismo día', () => {
    const iso = atLocalTime('2026-09-15', '22:30');
    expect(localDateOf(iso)).toBe('2026-09-15');
    expect(localTimeOf(iso)).toBe('22:30');
  });

  it('no cambia el desfase en ninguna época del año (Colombia no tiene horario de verano)', () => {
    expect(nowIso(new Date('2026-01-15T17:00:00Z'))).toContain('-05:00');
    expect(nowIso(new Date('2026-07-15T17:00:00Z'))).toContain('-05:00');
    expect(localTimeOf('2026-01-15T17:00:00Z')).toBe(localTimeOf('2026-07-15T17:00:00Z'));
  });
});

describe('aritmética de días', () => {
  it('suma y resta cruzando meses y años', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29'); // bisiesto
  });

  it('daysBetween es consistente', () => {
    expect(daysBetween('2026-09-01', '2026-09-15')).toBe(14);
    expect(daysBetween('2026-09-15', '2026-09-01')).toBe(-14);
    expect(daysBetween('2026-09-15', '2026-09-15')).toBe(0);
  });

  it('eachDay es inclusivo en ambos extremos', () => {
    expect(eachDay('2026-09-13', '2026-09-15')).toEqual(['2026-09-13', '2026-09-14', '2026-09-15']);
  });

  it('lastNDays termina hoy y tiene la longitud pedida', () => {
    const days = lastNDays(7, '2026-09-15');
    expect(days).toHaveLength(7);
    expect(days[0]).toBe('2026-09-09');
    expect(days[6]).toBe('2026-09-15');
  });

  it('weekdayOf usa la convención ISO (1 = lunes)', () => {
    expect(weekdayOf('2026-09-15')).toBe(2); // martes
    expect(weekdayOf('2026-09-14')).toBe(1); // lunes
    expect(weekdayOf('2026-09-20')).toBe(7); // domingo
  });
});

describe('validación de formatos', () => {
  it('rechaza fechas imposibles', () => {
    expect(isValidLocalDate('2026-02-30')).toBe(false);
    expect(isValidLocalDate('2026-13-01')).toBe(false);
    expect(isValidLocalDate('15/09/2026')).toBe(false);
    expect(isValidLocalDate('2026-09-15')).toBe(true);
  });

  it('valida horas en 24 h', () => {
    expect(isValidTime('08:00')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('8:00')).toBe(false);
  });
});

describe('formateo en español', () => {
  it('formatea la fecha larga', () => {
    expect(formatDateLong('2026-09-15')).toBe('martes 15 de septiembre');
  });

  it('usa día/mes/año en el formato numérico', () => {
    expect(formatDateNumeric('2026-09-15')).toBe('15/09/2026');
  });

  it('dice Hoy y Ayer', () => {
    expect(formatRelativeDay('2026-09-15', '2026-09-15')).toBe('Hoy');
    expect(formatRelativeDay('2026-09-14', '2026-09-15')).toBe('Ayer');
    expect(formatRelativeDay('2026-09-10', '2026-09-15')).toContain('septiembre');
  });

  it('saluda según la hora local', () => {
    expect(greetingFor('2026-09-15T13:00:00Z').text).toBe('Buenos días'); // 08:00 en Bogotá
    expect(greetingFor('2026-09-15T20:00:00Z').text).toBe('Buenas tardes'); // 15:00
    expect(greetingFor('2026-09-16T02:00:00Z').text).toBe('Buenas noches'); // 21:00
  });

  it('calcula la edad', () => {
    expect(formatAge('2019-05-10', '2026-09-15')).toBe('7 años');
    expect(formatAge('2026-01-15', '2026-09-15')).toBe('8 meses');
    expect(formatAge('2025-06-15', '2026-09-15')).toBe('1 año y 3 meses');
  });

  it('formatea duraciones', () => {
    expect(formatDuration(18)).toBe('18 min');
    expect(formatDuration(65)).toBe('1 h 5 min');
    expect(formatDuration(120)).toBe('2 h');
    expect(formatDuration(0)).toBe('—');
  });
});
