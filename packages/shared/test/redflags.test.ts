import { describe, expect, it } from 'vitest';
import { evaluateTrends, RULES, triageConcern, TRIAGE_ORDER } from '../src/redflags.js';
import type { DailyLog, MedicationDose, WeightEntry } from '../src/types.js';

function log(date: string, patch: Partial<DailyLog> = {}): DailyLog {
  return {
    id: `dlg_${date}`,
    schemaVersion: 1,
    createdAt: `${date}T08:00:00-05:00`,
    updatedAt: `${date}T08:00:00-05:00`,
    createdBy: 'test',
    localDate: date,
    mobilitySigns: [],
    discomfortSigns: [],
    stoolFlags: [],
    mood: [],
    ...patch,
  };
}

describe('catálogo de reglas', () => {
  it('toda regla tiene id, nivel, textos y fuente', () => {
    for (const r of RULES) {
      expect(r.id).toMatch(/^RF-[RGOY]\d{2}$/);
      expect(r.title.length).toBeGreaterThan(5);
      expect(r.body.length).toBeGreaterThan(10);
      expect(r.source.length).toBeGreaterThan(0);
    }
  });

  it('no hay ids duplicados', () => {
    const ids = RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ningún texto nombra una enfermedad concreta ni usa lenguaje alarmista', () => {
    const prohibidas = [
      'torsión', 'torsion', 'cáncer', 'cancer', 'tumor', 'mielopatía', 'mielopatia',
      'artrosis', 'espondilosis', 'hernia', 'puede morir', 'grave', 'peligroso',
    ];
    for (const r of RULES) {
      const texto = `${r.title} ${r.body}`.toLowerCase();
      for (const p of prohibidas) {
        expect(texto, `regla ${r.id} contiene "${p}"`).not.toContain(p);
      }
    }
  });
});

describe('triage de "Me preocupa algo"', () => {
  it('arcadas sin vomitar con abdomen hinchado es urgencia inmediata', () => {
    const r = triageConcern({ category: 'otro', signs: ['abdomen_hinchado', 'arcadas_sin_vomitar'] });
    expect(r.level).toBe('urgencia');
    expect(r.rule.id).toBe('RF-R01');
  });

  it('el abdomen hinchado por sí solo ya dispara urgencia (aceptamos falsos positivos)', () => {
    expect(triageConcern({ category: 'otro', signs: ['abdomen_hinchado'] }).level).toBe('urgencia');
    expect(triageConcern({ category: 'otro', signs: ['arcadas_sin_vomitar'] }).level).toBe('urgencia');
  });

  it.each([
    ['no_mueve_traseras', 'RF-R02'],
    ['colapso', 'RF-R03'],
    ['dificultad_respirar', 'RF-R04'],
    ['encias_palidas', 'RF-R05'],
    ['convulsion', 'RF-R06'],
    ['no_logra_orinar', 'RF-R07'],
    ['sangre_abundante', 'RF-R08'],
    ['grita_de_dolor', 'RF-R09'],
    ['comio_algo_raro', 'RF-R11'],
  ])('el signo %s dispara urgencia', (sign, ruleId) => {
    const r = triageConcern({ category: 'otro', signs: [sign] });
    expect(r.level).toBe('urgencia');
    expect(r.matched.map((m) => m.id)).toContain(ruleId);
  });

  it('una caída dispara urgencia aunque no se marque nada más', () => {
    expect(triageConcern({ category: 'caida', signs: [] }).level).toBe('urgencia');
  });

  it('que no quiera levantarse es contactar hoy, no urgencia', () => {
    const r = triageConcern({ category: 'movilidad', signs: [] });
    expect(r.level).toBe('contactar_hoy');
    expect(r.rule.id).toBe('RF-O01');
  });

  it('arrastrar las uñas pide vídeo y es contactar hoy', () => {
    const r = triageConcern({ category: 'movilidad', signs: ['arrastra_unas'] });
    expect(r.level).toBe('contactar_hoy');
    expect(r.rule.id).toBe('RF-O03');
    expect(r.rule.body).toContain('vídeo');
  });

  it('no comer desde ayer escala a contactar hoy; no comer desde hoy no', () => {
    expect(triageConcern({ category: 'no_come', sinceWhen: 'ayer', signs: [] }).level).toBe('contactar_hoy');
    expect(triageConcern({ category: 'no_come', sinceWhen: 'hoy', signs: [] }).level).toBe('consultar_pronto');
  });

  it('diarrea con sangre escala; diarrea sola no', () => {
    expect(triageConcern({ category: 'diarrea', signs: ['sangre_abundante'] }).level).toBe('urgencia');
    expect(triageConcern({ category: 'diarrea', signs: ['muy_decaida'] }).level).toBe('contactar_hoy');
    expect(triageConcern({ category: 'diarrea', signs: [] }).level).toBe('consultar_pronto');
  });

  it('siempre devuelve un resultado, incluso sin signos', () => {
    const r = triageConcern({ category: 'otro', signs: [] });
    expect(r.level).toBe('observar');
    expect(r.rule.id).toBe('RF-G00');
  });

  it('cuando hay varias reglas, gana la más grave', () => {
    const r = triageConcern({ category: 'movilidad', signs: ['no_mueve_traseras'] });
    expect(r.level).toBe('urgencia');
    expect(r.matched.length).toBeGreaterThan(1);
    expect(TRIAGE_ORDER[r.matched[0]!.level]).toBeGreaterThanOrEqual(TRIAGE_ORDER[r.matched[1]!.level]);
  });
});

describe('reglas de acumulación', () => {
  const base = { doses: [] as MedicationDose[], weights: [] as WeightEntry[], today: '2026-09-15' };

  it('avisa cuando hay más días con dificultad que la semana anterior', () => {
    const logs = [
      log('2026-09-02', { mobility: 'algo_peor' }),
      log('2026-09-10', { mobility: 'algo_peor' }),
      log('2026-09-12', { mobility: 'bastante_peor' }),
      log('2026-09-14', { mobilitySigns: ['mov_costo_levantarse'] }),
      log('2026-09-15', { mobility: 'algo_peor' }),
    ];
    const out = evaluateTrends({ ...base, dailyLogs: logs });
    const notice = out.find((n) => n.ruleId === 'RF-Y01');
    expect(notice).toBeDefined();
    expect(notice!.message).toContain('4');
    expect(notice!.message).toContain('1');
  });

  it('no avisa si no hay aumento respecto a la semana previa', () => {
    const logs = [
      log('2026-09-02', { mobility: 'algo_peor' }),
      log('2026-09-03', { mobility: 'algo_peor' }),
      log('2026-09-04', { mobility: 'algo_peor' }),
      log('2026-09-05', { mobility: 'algo_peor' }),
      log('2026-09-14', { mobility: 'algo_peor' }),
    ];
    expect(evaluateTrends({ ...base, dailyLogs: logs }).find((n) => n.ruleId === 'RF-Y01')).toBeUndefined();
  });

  it('detecta dos días seguidos de estado malo', () => {
    const logs = [log('2026-09-13', { overallState: 2 }), log('2026-09-14', { overallState: 1 })];
    expect(evaluateTrends({ ...base, dailyLogs: logs }).some((n) => n.ruleId === 'RF-Y02')).toBe(true);
  });

  it('no confunde dos días malos no consecutivos', () => {
    const logs = [log('2026-09-11', { overallState: 2 }), log('2026-09-14', { overallState: 2 })];
    expect(evaluateTrends({ ...base, dailyLogs: logs }).some((n) => n.ruleId === 'RF-Y02')).toBe(false);
  });

  it('detecta un signo neurológico nuevo y lo fecha', () => {
    const logs = [log('2026-09-11', { mobilitySigns: ['mov_arrastra_unas'] })];
    const notice = evaluateTrends({ ...base, dailyLogs: logs }).find((n) => n.ruleId === 'RF-Y06');
    expect(notice).toBeDefined();
    expect(notice!.message).toContain('11 de sep');
  });

  it('no lo marca como nuevo si ya había aparecido antes', () => {
    const logs = [
      log('2026-07-01', { mobilitySigns: ['mov_arrastra_unas'] }),
      log('2026-09-11', { mobilitySigns: ['mov_arrastra_unas'] }),
    ];
    expect(evaluateTrends({ ...base, dailyLogs: logs }).some((n) => n.ruleId === 'RF-Y06')).toBe(false);
  });

  it('avisa por 3 dosis omitidas del mismo medicamento', () => {
    const dose = (d: string): MedicationDose => ({
      id: `dos_${d}`,
      schemaVersion: 1,
      createdAt: `${d}T08:00:00-05:00`,
      updatedAt: `${d}T08:00:00-05:00`,
      createdBy: 't',
      medicationId: 'med_x',
      medicationVersionId: 'mdv_x',
      localDate: d,
      status: 'omitido',
      medicationNameSnapshot: 'X',
      doseTextSnapshot: '1 tableta',
    });
    const doses = [dose('2026-09-11'), dose('2026-09-12'), dose('2026-09-13')];
    expect(evaluateTrends({ ...base, dailyLogs: [], doses }).some((n) => n.ruleId === 'RF-Y05')).toBe(true);
  });

  it('avisa por variación de peso mayor al 5 % en un mes', () => {
    const w = (d: string, kg: number): WeightEntry => ({
      id: `wgt_${d}`,
      schemaVersion: 1,
      createdAt: `${d}T08:00:00-05:00`,
      updatedAt: `${d}T08:00:00-05:00`,
      createdBy: 't',
      localDate: d,
      weightKg: kg,
    });
    const weights = [w('2026-08-15', 33.4), w('2026-09-15', 31.0)];
    const notice = evaluateTrends({ ...base, dailyLogs: [], weights }).find((n) => n.ruleId === 'RF-Y04');
    expect(notice).toBeDefined();
    expect(notice!.message).toContain('bajó');
  });

  it('un historial vacío no produce ningún aviso', () => {
    expect(evaluateTrends({ ...base, dailyLogs: [] })).toEqual([]);
  });

  it('ignora los registros borrados', () => {
    const logs = [
      log('2026-09-13', { overallState: 2, deletedAt: '2026-09-14T00:00:00-05:00' }),
      log('2026-09-14', { overallState: 2 }),
    ];
    expect(evaluateTrends({ ...base, dailyLogs: logs }).some((n) => n.ruleId === 'RF-Y02')).toBe(false);
  });
});
