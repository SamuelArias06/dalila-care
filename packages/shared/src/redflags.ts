/**
 * Motor de señales de alarma.
 *
 * Implementa docs/RED_FLAGS.md. Son funciones puras sobre los datos, sin
 * dependencias de Google ni del navegador, para poder testearlas por completo.
 *
 * Reglas que nunca se rompen:
 *  · Se describe la ACCIÓN, jamás una causa posible ni el nombre de una enfermedad.
 *  · Ante la duda, se sube de nivel.
 *  · Toda regla tiene id y fuente, y la interfaz siempre ofrece verla.
 */

import type { DailyLog, MedicationDose, TriageLevel, WeightEntry, EventCategory } from './types.js';
import { compareDates, daysBetween, type LocalDate } from './dates.js';

export interface RedFlagRule {
  id: string;
  level: TriageLevel;
  /** Encabezado de la tarjeta. Siempre una acción. */
  title: string;
  /** Explicación observacional, sin nombrar enfermedades. */
  body: string;
  source: string;
}

export const TRIAGE_ORDER: Record<TriageLevel, number> = {
  observar: 0,
  consultar_pronto: 1,
  contactar_hoy: 2,
  urgencia: 3,
};

export const TRIAGE_LABEL: Record<TriageLevel, string> = {
  observar: 'Queda registrado',
  consultar_pronto: 'Esto merece valoración veterinaria',
  contactar_hoy: 'Llama hoy a tu veterinario',
  urgencia: 'Busca atención veterinaria urgente',
};

const SRC_MERCK = 'Merck Veterinary Manual';
const SRC_AAHA = 'AAHA · Understanding Canine Bloat (GDV)';
const SRC_ASPCA = 'ASPCA Animal Poison Control';
const SRC_EMERG = 'Literatura veterinaria de urgencias (VCA, BluePearl, MedVet)';

/** Signos adicionales que la cuidadora puede marcar en "Me preocupa algo". */
export interface ConcernSign {
  id: string;
  label: string;
  /** Sólo se ofrece si la categoría está en esta lista; vacío = siempre. */
  onlyFor?: EventCategory[];
}

export const CONCERN_SIGNS: ConcernSign[] = [
  { id: 'abdomen_hinchado', label: 'Tiene el abdomen hinchado o duro' },
  { id: 'arcadas_sin_vomitar', label: 'Hace arcadas sin sacar nada' },
  { id: 'babea_mucho', label: 'Babea mucho' },
  { id: 'no_mueve_traseras', label: 'No mueve las patas traseras' },
  { id: 'encias_palidas', label: 'Tiene las encías pálidas o azuladas' },
  { id: 'dificultad_respirar', label: 'Le cuesta respirar' },
  { id: 'convulsion', label: 'Tuvo una convulsión' },
  { id: 'colapso', label: 'Se desplomó o perdió el conocimiento' },
  { id: 'no_logra_orinar', label: 'Intenta orinar y no lo consigue' },
  { id: 'sangre_abundante', label: 'Hay sangre abundante' },
  { id: 'grita_de_dolor', label: 'Grita o chilla al moverse' },
  { id: 'tras_calor', label: 'Fue después de calor o esfuerzo fuerte' },
  { id: 'comio_algo_raro', label: 'Pudo haber comido algo que no debía' },
  { id: 'golpe_o_caida', label: 'Hubo un golpe, caída o atropello' },
  { id: 'muy_decaida', label: 'Está muy decaída' },
  { id: 'tampoco_come', label: 'Tampoco quiere comer' },
  { id: 'jadea', label: 'Jadea sin calor ni ejercicio' },
  { id: 'tiembla', label: 'Tiembla' },
  { id: 'arrastra_unas', label: 'Arrastra las uñas o se le voltea una pata' },
];

export const CONCERN_SIGNS_BY_ID: Record<string, ConcernSign> = Object.fromEntries(
  CONCERN_SIGNS.map((s) => [s.id, s]),
);

// ── Reglas rojas: urgencia ───────────────────────────────────────────────────

export const RULES: RedFlagRule[] = [
  {
    id: 'RF-R01',
    level: 'urgencia',
    title: 'Esto necesita atención veterinaria ahora mismo',
    body: 'Cuando hay arcadas sin sacar nada junto con el abdomen hinchado, no conviene esperar a ver si mejora. Ve a urgencias ya, aunque parezca que se calma.',
    source: SRC_AAHA,
  },
  {
    id: 'RF-R02',
    level: 'urgencia',
    title: 'Busca atención veterinaria urgente',
    body: 'Que no pueda mover las patas traseras necesita valoración inmediata.',
    source: SRC_MERCK,
  },
  {
    id: 'RF-R03',
    level: 'urgencia',
    title: 'Busca atención veterinaria urgente',
    body: 'Un desplome o una pérdida de conocimiento necesita valoración inmediata.',
    source: SRC_EMERG,
  },
  {
    id: 'RF-R04',
    level: 'urgencia',
    title: 'Busca atención veterinaria urgente',
    body: 'La dificultad para respirar necesita atención inmediata. Mantenla tranquila y en un sitio fresco mientras van.',
    source: SRC_EMERG,
  },
  {
    id: 'RF-R05',
    level: 'urgencia',
    title: 'Busca atención veterinaria urgente',
    body: 'Las encías pálidas o azuladas necesitan valoración inmediata.',
    source: SRC_EMERG,
  },
  {
    id: 'RF-R06',
    level: 'urgencia',
    title: 'Busca atención veterinaria urgente',
    body: 'Una convulsión necesita valoración veterinaria inmediata.',
    source: SRC_MERCK,
  },
  {
    id: 'RF-R07',
    level: 'urgencia',
    title: 'Busca atención veterinaria urgente',
    body: 'Que intente orinar sin conseguirlo necesita atención inmediata.',
    source: SRC_EMERG,
  },
  {
    id: 'RF-R08',
    level: 'urgencia',
    title: 'Busca atención veterinaria urgente',
    body: 'Un sangrado abundante necesita atención inmediata.',
    source: SRC_EMERG,
  },
  {
    id: 'RF-R09',
    level: 'urgencia',
    title: 'Busca atención veterinaria urgente',
    body: 'Un dolor tan intenso que la hace gritar al moverse necesita valoración inmediata.',
    source: SRC_MERCK,
  },
  {
    id: 'RF-R10',
    level: 'urgencia',
    title: 'Busca atención veterinaria urgente',
    body: 'Tras calor o esfuerzo fuerte, estos signos necesitan atención inmediata. Llévala a un sitio fresco mientras van; no la sumerjas en agua helada.',
    source: SRC_EMERG,
  },
  {
    id: 'RF-R11',
    level: 'urgencia',
    title: 'Llama ya al veterinario, aunque parezca estar bien',
    body: 'Si pudo comer algo que no debía, conviene actuar antes de que aparezcan signos. Si sabes qué fue, tenlo a mano para decírselo.',
    source: SRC_ASPCA,
  },
  {
    id: 'RF-R12',
    level: 'urgencia',
    title: 'Busca valoración veterinaria urgente',
    body: 'Después de un golpe o una caída importante conviene revisarla aunque parezca estar bien.',
    source: SRC_EMERG,
  },

  // ── Naranjas: contactar hoy ────────────────────────────────────────────────
  {
    id: 'RF-O01',
    level: 'contactar_hoy',
    title: 'Llama hoy a tu veterinario',
    body: 'Que le cueste mucho levantarse o que no quiera hacerlo es un cambio que conviene valorar pronto, sobre todo si es nuevo o va a más.',
    source: SRC_MERCK,
  },
  {
    id: 'RF-O02',
    level: 'contactar_hoy',
    title: 'Llama hoy a tu veterinario',
    body: 'Un cambio brusco en la forma de caminar merece que lo vea hoy.',
    source: SRC_MERCK,
  },
  {
    id: 'RF-O03',
    level: 'contactar_hoy',
    title: 'Llama hoy a tu veterinario',
    body: 'Que arrastre las uñas o se le voltee una pata conviene valorarlo. Si puedes, graba un vídeo corto caminando: le será muy útil al veterinario.',
    source: 'Cornell University College of Veterinary Medicine',
  },
  {
    id: 'RF-O04',
    level: 'contactar_hoy',
    title: 'Llama hoy a tu veterinario',
    body: 'Que un perro adulto pase un día entero sin comer merece una llamada.',
    source: SRC_MERCK,
  },
  {
    id: 'RF-O05',
    level: 'contactar_hoy',
    title: 'Llama hoy a tu veterinario',
    body: 'Vómitos repetidos, o vómito con decaimiento, conviene consultarlos hoy.',
    source: SRC_MERCK,
  },
  {
    id: 'RF-O06',
    level: 'contactar_hoy',
    title: 'Llama hoy a tu veterinario',
    body: 'Diarrea con sangre, o diarrea junto con decaimiento, conviene consultarla hoy.',
    source: SRC_MERCK,
  },
  {
    id: 'RF-O07',
    level: 'contactar_hoy',
    title: 'Llama hoy a tu veterinario',
    body: 'Los cambios al orinar conviene valorarlos pronto.',
    source: SRC_MERCK,
  },
  {
    id: 'RF-O09',
    level: 'contactar_hoy',
    title: 'Llama hoy a quien se lo recetó',
    body: 'Anota lo que viste y díselo hoy. No suspendas ni cambies la dosis por tu cuenta: consúltalo primero.',
    source: SRC_MERCK,
  },

  // ── Amarillas: consultar pronto ────────────────────────────────────────────
  {
    id: 'RF-Y01',
    level: 'consultar_pronto',
    title: 'Puede ser buen momento para consultarlo',
    body: 'Has anotado varios días con más dificultad para moverse que la semana anterior.',
    source: SRC_MERCK,
  },
  {
    id: 'RF-Y02',
    level: 'consultar_pronto',
    title: 'Podría valer la pena consultarlo',
    body: 'Llevas dos días seguidos anotando que no está bien.',
    source: SRC_MERCK,
  },
  {
    id: 'RF-Y03',
    level: 'consultar_pronto',
    title: 'Conviene comentarlo con tu veterinario',
    body: 'Has anotado menos apetito varios días de los últimos cinco.',
    source: SRC_MERCK,
  },
  {
    id: 'RF-Y04',
    level: 'consultar_pronto',
    title: 'Buen tema para la próxima consulta',
    body: 'El peso cambió más de lo habitual este mes.',
    source: 'WSAVA Global Nutrition Guidelines',
  },
  {
    id: 'RF-Y05',
    level: 'consultar_pronto',
    title: 'Conviene comentarlo con tu veterinario',
    body: 'Se registraron varias dosis sin administrar esta semana. Si hay algún problema con el medicamento, coméntalo.',
    source: SRC_MERCK,
  },
  {
    id: 'RF-Y06',
    level: 'consultar_pronto',
    title: 'Conviene vigilarlo',
    body: 'Anotaste algo que conviene comentar con tu veterinario. Si se repite, graba un vídeo corto.',
    source: 'Cornell University College of Veterinary Medicine',
  },
  {
    id: 'RF-Y07',
    level: 'consultar_pronto',
    title: 'Buen tema para comentar',
    body: 'Varios días con heces distintas de lo normal.',
    source: SRC_MERCK,
  },

  // ── Verde: sólo registro ───────────────────────────────────────────────────
  {
    id: 'RF-G00',
    level: 'observar',
    title: 'Queda registrado',
    body: 'Anotado con la fecha y la hora. Si se repite o va a más, coméntalo con tu veterinario.',
    source: '—',
  },
];

export const RULES_BY_ID: Record<string, RedFlagRule> = Object.fromEntries(RULES.map((r) => [r.id, r]));

function rule(id: string): RedFlagRule {
  const r = RULES_BY_ID[id];
  if (!r) throw new Error(`Regla desconocida: ${id}`);
  return r;
}

// ── Evaluación del flujo "Me preocupa algo" ──────────────────────────────────

export interface ConcernInput {
  category: EventCategory;
  sinceWhen?: 'ahora' | 'hoy' | 'ayer' | 'varios_dias' | '';
  signs: string[];
  severityFelt?: 'leve' | 'moderado' | 'fuerte' | '';
}

export interface TriageResult {
  level: TriageLevel;
  rule: RedFlagRule;
  /** Todas las reglas que se cumplieron, la más grave primero. */
  matched: RedFlagRule[];
}

/**
 * Determina la orientación a mostrar. Devuelve siempre un resultado: si nada
 * dispara, el nivel es `observar`.
 */
export function triageConcern(input: ConcernInput): TriageResult {
  const s = new Set(input.signs);
  const hits: string[] = [];

  // Rojas ─ evaluadas primero y sin combinaciones complicadas.
  if (s.has('abdomen_hinchado') && (s.has('arcadas_sin_vomitar') || s.has('babea_mucho'))) hits.push('RF-R01');
  // Un abdomen hinchado o arcadas improductivas por sí solos ya bastan: en una
  // Golden Retriever aceptamos falsos positivos antes que perder una urgencia.
  else if (s.has('abdomen_hinchado') || s.has('arcadas_sin_vomitar')) hits.push('RF-R01');

  if (s.has('no_mueve_traseras')) hits.push('RF-R02');
  if (s.has('colapso')) hits.push('RF-R03');
  if (s.has('dificultad_respirar')) hits.push('RF-R04');
  if (s.has('encias_palidas')) hits.push('RF-R05');
  if (s.has('convulsion')) hits.push('RF-R06');
  if (s.has('no_logra_orinar')) hits.push('RF-R07');
  if (s.has('sangre_abundante')) hits.push('RF-R08');
  if (s.has('grita_de_dolor')) hits.push('RF-R09');
  if (s.has('tras_calor') && (s.has('jadea') || s.has('muy_decaida') || input.category === 'comportamiento'))
    hits.push('RF-R10');
  if (s.has('comio_algo_raro')) hits.push('RF-R11');
  if (s.has('golpe_o_caida') || input.category === 'caida') hits.push('RF-R12');

  // Naranjas
  if (input.category === 'movilidad') {
    if (s.has('arrastra_unas')) hits.push('RF-O03');
    else hits.push('RF-O01');
  }
  if (input.category === 'incomodidad' && input.severityFelt === 'fuerte') hits.push('RF-O01');
  if (input.category === 'comportamiento' && s.has('arrastra_unas')) hits.push('RF-O03');
  if (input.category === 'no_come') {
    if (input.sinceWhen === 'ayer' || input.sinceWhen === 'varios_dias' || s.has('muy_decaida')) hits.push('RF-O04');
    else hits.push('RF-Y03');
  }
  if (input.category === 'vomito') {
    if (s.has('muy_decaida') || input.sinceWhen === 'varios_dias' || input.severityFelt === 'fuerte') hits.push('RF-O05');
    else hits.push('RF-Y07');
  }
  if (input.category === 'diarrea') {
    if (s.has('sangre_abundante') || s.has('muy_decaida') || input.sinceWhen === 'varios_dias') hits.push('RF-O06');
    else hits.push('RF-Y07');
  }
  if (input.category === 'orina') hits.push('RF-O07');

  if (hits.length === 0) hits.push('RF-G00');

  const matched = [...new Set(hits)]
    .map(rule)
    .sort((a, b) => TRIAGE_ORDER[b.level] - TRIAGE_ORDER[a.level]);

  return { level: matched[0]!.level, rule: matched[0]!, matched };
}

/** Orientación tras registrar una posible reacción a un medicamento. */
export function triageMedicationReaction(): TriageResult {
  const r = rule('RF-O09');
  return { level: r.level, rule: r, matched: [r] };
}

// ── Reglas pasivas sobre el historial ────────────────────────────────────────

export interface TrendNotice {
  ruleId: string;
  level: TriageLevel;
  title: string;
  /** Texto concreto con los números reales, generado aquí. */
  message: string;
  source: string;
}

interface TrendInput {
  dailyLogs: DailyLog[];
  doses: MedicationDose[];
  weights: WeightEntry[];
  today: LocalDate;
}

function logsInWindow(logs: DailyLog[], from: LocalDate, to: LocalDate): DailyLog[] {
  return logs.filter((l) => !l.deletedAt && compareDates(l.localDate, from) >= 0 && compareDates(l.localDate, to) <= 0);
}

function hasMobilityDifficulty(l: DailyLog): boolean {
  return (
    l.mobility === 'algo_peor' ||
    l.mobility === 'bastante_peor' ||
    (l.mobilitySigns?.length ?? 0) > 0
  );
}

/**
 * Avisos que surgen de la acumulación. Se muestran en el resumen nocturno o en
 * el historial, nunca al abrir la app por la mañana.
 */
export function evaluateTrends(input: TrendInput): TrendNotice[] {
  const { dailyLogs, doses, weights, today } = input;
  const out: TrendNotice[] = [];
  const mk = (id: string, message: string): TrendNotice => {
    const r = rule(id);
    return { ruleId: r.id, level: r.level, title: r.title, message, source: r.source };
  };

  const sortedLogs = [...dailyLogs].filter((l) => !l.deletedAt).sort((a, b) => compareDates(a.localDate, b.localDate));

  // RF-Y01 — movilidad: semana actual frente a la anterior
  const w1from = addDaysLocal(today, -6);
  const w2from = addDaysLocal(today, -13);
  const w2to = addDaysLocal(today, -7);
  const thisWeek = logsInWindow(sortedLogs, w1from, today).filter(hasMobilityDifficulty).length;
  const prevWeek = logsInWindow(sortedLogs, w2from, w2to).filter(hasMobilityDifficulty).length;
  if (thisWeek >= 3 && thisWeek > prevWeek) {
    out.push(
      mk(
        'RF-Y01',
        `En los últimos 7 días anotaste ${thisWeek} ${thisWeek === 1 ? 'día' : 'días'} con dificultad para moverse, ` +
          `frente a ${prevWeek} la semana anterior.`,
      ),
    );
  }

  // RF-Y02 — dos días seguidos de estado malo o muy malo
  const recent = logsInWindow(sortedLogs, addDaysLocal(today, -6), today);
  for (let i = 1; i < recent.length; i++) {
    const a = recent[i - 1]!;
    const b = recent[i]!;
    if (
      a.overallState != null && a.overallState <= 2 &&
      b.overallState != null && b.overallState <= 2 &&
      daysBetween(a.localDate, b.localDate) === 1
    ) {
      out.push(mk('RF-Y02', 'Anotaste dos días seguidos en los que no estuvo bien.'));
      break;
    }
  }

  // RF-Y03 — apetito bajo 3 de los últimos 5 días
  const last5 = logsInWindow(sortedLogs, addDaysLocal(today, -4), today);
  const lowAppetite = last5.filter((l) => l.appetite === 'menos' || l.appetite === 'rechazo').length;
  if (lowAppetite >= 3) {
    out.push(mk('RF-Y03', `Anotaste menos apetito en ${lowAppetite} de los últimos 5 días.`));
  }

  // RF-Y07 — heces anormales 3 de los últimos 5 días
  const abnormalStool = last5.filter(
    (l) => l.stool === 'blandas' || l.stool === 'muy_blandas' || l.stool === 'liquidas' || l.stool === 'duras',
  ).length;
  if (abnormalStool >= 3) {
    out.push(mk('RF-Y07', `Anotaste heces distintas de lo normal en ${abnormalStool} de los últimos 5 días.`));
  }

  // RF-Y06 — signo neurológico nuevo en los últimos 7 días
  const neuroIds = new Set(['mov_arrastra_unas', 'mov_voltea_pata', 'mov_pierde_equilibrio']);
  const neuroRecent = logsInWindow(sortedLogs, addDaysLocal(today, -6), today).filter((l) =>
    (l.mobilitySigns ?? []).some((s) => neuroIds.has(s)),
  );
  if (neuroRecent.length > 0) {
    const older = sortedLogs
      .filter((l) => compareDates(l.localDate, addDaysLocal(today, -7)) <= 0)
      .some((l) => (l.mobilitySigns ?? []).some((s) => neuroIds.has(s)));
    if (!older) {
      out.push(
        mk(
          'RF-Y06',
          `El ${formatShort(neuroRecent[0]!.localDate)} anotaste por primera vez que arrastró las uñas o perdió el equilibrio.`,
        ),
      );
    }
  }

  // RF-Y05 — 3 o más dosis omitidas del mismo medicamento en 7 días
  const omitted = doses.filter(
    (d) => !d.deletedAt && d.status === 'omitido' && compareDates(d.localDate, addDaysLocal(today, -6)) >= 0,
  );
  const byMed = new Map<string, number>();
  for (const d of omitted) byMed.set(d.medicationId, (byMed.get(d.medicationId) ?? 0) + 1);
  for (const [, count] of byMed) {
    if (count >= 3) {
      out.push(mk('RF-Y05', `Se registraron ${count} dosis sin administrar en los últimos 7 días.`));
      break;
    }
  }

  // RF-Y04 — variación de peso > 5 % en 30 días
  const ws = [...weights].filter((w) => !w.deletedAt).sort((a, b) => compareDates(a.localDate, b.localDate));
  if (ws.length >= 2) {
    const last = ws[ws.length - 1]!;
    const baseline = ws.filter((w) => daysBetween(w.localDate, last.localDate) >= 20)?.pop();
    if (baseline && baseline.weightKg > 0) {
      const pct = ((last.weightKg - baseline.weightKg) / baseline.weightKg) * 100;
      if (Math.abs(pct) > 5) {
        const dir = pct < 0 ? 'bajó' : 'subió';
        out.push(
          mk(
            'RF-Y04',
            `El peso ${dir} de ${baseline.weightKg} kg a ${last.weightKg} kg entre el ` +
              `${formatShort(baseline.localDate)} y el ${formatShort(last.localDate)}.`,
          ),
        );
      }
    }
  }

  return out.sort((a, b) => TRIAGE_ORDER[b.level] - TRIAGE_ORDER[a.level]);
}

// Helpers locales para no crear una dependencia circular con dates.ts
function addDaysLocal(date: LocalDate, days: number): LocalDate {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const t = Date.UTC(y, m - 1, d) + days * 86_400_000;
  const dt = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}`;
}

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function formatShort(date: LocalDate): string {
  const [, m, d] = date.split('-').map(Number) as [number, number, number];
  return `${d} de ${MONTHS_SHORT[m - 1]}`;
}
