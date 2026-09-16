/**
 * Catálogos precargados.
 *
 * Todo lo de aquí es una SEMILLA: la app copia estos elementos a la base de
 * datos en el primer arranque y a partir de ahí la cuidadora puede editarlos,
 * desactivarlos o añadir los suyos. Nada de esto está fijo en el código.
 *
 * Los signos y las advertencias de alimentos provienen de docs/VET_RESEARCH.md.
 */

import type { SignDef, TimeOfDay } from './types.js';

// ── Observaciones del check-in ───────────────────────────────────────────────
//
// Los signos marcados `neuro: true` son los que permiten distinguir rigidez de
// un posible problema medular. La app NO interpreta la diferencia: la registra
// y hace que aparezca destacada en el resumen para el veterinario.

export const SIGNS: SignDef[] = [
  // Movilidad
  { id: 'mov_costo_levantarse', group: 'movilidad', label: 'Le costó levantarse', order: 10 },
  { id: 'mov_ayuda_levantarse', group: 'movilidad', label: 'Necesitó ayuda para levantarse', order: 20 },
  { id: 'mov_lenta_levantarse', group: 'movilidad', label: 'Se levantó más lento', order: 30 },
  { id: 'mov_rigidez_inicio', group: 'movilidad', label: 'Rigidez al empezar, luego mejoró', order: 40 },
  { id: 'mov_cojea', group: 'movilidad', label: 'Cojea o apoya menos una pata', order: 50 },
  { id: 'mov_resbalo', group: 'movilidad', label: 'Se resbaló en piso liso', order: 60 },
  { id: 'mov_tropezo', group: 'movilidad', label: 'Tropezó', order: 70 },
  { id: 'mov_arrastra_unas', group: 'movilidad', label: 'Arrastra las uñas o los dedos', neuro: true, order: 80 },
  { id: 'mov_voltea_pata', group: 'movilidad', label: 'Se le volteó una pata al apoyarla', neuro: true, order: 90 },
  { id: 'mov_pierde_equilibrio', group: 'movilidad', label: 'Perdió el equilibrio', neuro: true, order: 100 },
  { id: 'mov_evita_subir', group: 'movilidad', label: 'Evitó subir o bajar', order: 110 },
  { id: 'mov_no_quiso_caminar', group: 'movilidad', label: 'No quiso caminar o se paró en el paseo', order: 120 },
  { id: 'mov_costo_echarse', group: 'movilidad', label: 'Le costó acomodarse para echarse', order: 130 },
  { id: 'mov_sienta_distinto', group: 'movilidad', label: 'Se sienta de forma distinta', order: 140 },

  // Posible incomodidad
  { id: 'inc_jadeo', group: 'incomodidad', label: 'Jadeo sin calor ni ejercicio', order: 10 },
  { id: 'inc_inquietud', group: 'incomodidad', label: 'Inquieta, cambia mucho de posición', order: 20 },
  { id: 'inc_no_postura', group: 'incomodidad', label: 'No encuentra postura para descansar', order: 30 },
  { id: 'inc_vocaliza', group: 'incomodidad', label: 'Se queja o gime', order: 40 },
  { id: 'inc_postura', group: 'incomodidad', label: 'Postura distinta (espalda arqueada, cabeza baja)', order: 50 },
  { id: 'inc_lame_zona', group: 'incomodidad', label: 'Se lame o muerde una zona concreta', order: 60 },
  { id: 'inc_evita_contacto', group: 'incomodidad', label: 'Evita que la toquen en algún sitio', order: 70 },
  { id: 'inc_se_mueve_menos', group: 'incomodidad', label: 'Se mueve menos de lo normal', order: 80 },
  { id: 'inc_tiembla', group: 'incomodidad', label: 'Tiembla', order: 90 },

  // Ánimo
  { id: 'ani_alegre', group: 'animo', label: 'Alegre', order: 10 },
  { id: 'ani_normal', group: 'animo', label: 'Normal', order: 20 },
  { id: 'ani_tranquila', group: 'animo', label: 'Tranquila', order: 30 },
  { id: 'ani_apagada', group: 'animo', label: 'Apagada', order: 40 },
  { id: 'ani_irritable', group: 'animo', label: 'Irritable', order: 50 },
  { id: 'ani_busca_compania', group: 'animo', label: 'Busca compañía', order: 60 },
  { id: 'ani_se_aisla', group: 'animo', label: 'Se aísla', order: 70 },
  { id: 'ani_menos_juego', group: 'animo', label: 'Menos interés en jugar o pasear', order: 80 },

  // Digestivo (marcadores sobre las heces)
  { id: 'dig_sangre', group: 'digestivo', label: 'Sangre visible', order: 10 },
  { id: 'dig_moco', group: 'digestivo', label: 'Moco', order: 20 },
  { id: 'dig_esfuerzo', group: 'digestivo', label: 'Hizo esfuerzo', order: 30 },
];

export const SIGNS_BY_ID: Record<string, SignDef> = Object.fromEntries(SIGNS.map((s) => [s.id, s]));

export function signsOf(group: SignDef['group']): SignDef[] {
  return SIGNS.filter((s) => s.group === group).sort((a, b) => a.order - b.order);
}

export function signLabel(id: string): string {
  return SIGNS_BY_ID[id]?.label ?? id;
}

export function isNeuroSign(id: string): boolean {
  return SIGNS_BY_ID[id]?.neuro === true;
}

// ── Alimentos con riesgo conocido ────────────────────────────────────────────
//
// Fuente: ASPCA Animal Poison Control y Merck Veterinary Manual.
// La app NO bloquea: informa antes de guardar y cita la fuente.

export interface FoodWarning {
  match: string[];
  label: string;
  warning: string;
  source: string;
}

export const FOOD_WARNINGS: FoodWarning[] = [
  {
    match: ['uva', 'uvas', 'pasa', 'pasas', 'uva pasa'],
    label: 'Uvas y pasas',
    warning: 'Las uvas y las pasas pueden causar daño renal en perros, incluso en cantidades pequeñas.',
    source: 'ASPCA Animal Poison Control',
  },
  {
    match: ['xilitol', 'xylitol'],
    label: 'Xilitol',
    warning:
      'El xilitol provoca una liberación rápida de insulina y puede causar convulsiones y fallo hepático. Aparece en chicles, dulces y algunas cremas de maní.',
    source: 'ASPCA Animal Poison Control',
  },
  {
    match: ['chocolate', 'cacao', 'cocoa'],
    label: 'Chocolate',
    warning: 'Los perros no metabolizan el chocolate como nosotros. El chocolate oscuro y el de repostería son los más peligrosos.',
    source: 'ASPCA Animal Poison Control',
  },
  {
    match: ['cebolla', 'cebollin', 'cebollín', 'ajo', 'puerro'],
    label: 'Cebolla, ajo y similares',
    warning: 'Pueden dañar los glóbulos rojos y causar anemia. El efecto es acumulativo.',
    source: 'ASPCA Animal Poison Control',
  },
  {
    match: ['macadamia'],
    label: 'Nueces de macadamia',
    warning: 'Pueden causar debilidad, temblores, vómito e hipertermia.',
    source: 'ASPCA Animal Poison Control',
  },
  {
    match: ['alcohol', 'cerveza', 'vino', 'licor'],
    label: 'Alcohol',
    warning: 'El alcohol es tóxico para los perros incluso en cantidades pequeñas.',
    source: 'ASPCA Animal Poison Control',
  },
  {
    match: ['cafe', 'café', 'cafeina', 'cafeína', 'te negro'],
    label: 'Cafeína',
    warning: 'La cafeína puede causar taquicardia, temblores y convulsiones.',
    source: 'ASPCA Animal Poison Control',
  },
  {
    match: ['aguacate', 'palta'],
    label: 'Aguacate',
    warning: 'El aguacate figura entre los alimentos que la ASPCA recomienda evitar en perros.',
    source: 'ASPCA Animal Poison Control',
  },
  {
    match: ['ibuprofeno', 'acetaminofen', 'acetaminofén', 'paracetamol', 'naproxeno', 'aspirina', 'diclofenaco'],
    label: 'Analgésico humano',
    warning:
      'Los analgésicos humanos son tóxicos para los perros: pueden causar úlceras, fallo renal y daño hepático. Nunca se los des sin que un veterinario lo indique expresamente. Si ya se lo diste, llama al veterinario ahora.',
    source: 'Merck Veterinary Manual · Toxicoses From Human Analgesics in Animals',
  },
];

/** Devuelve la advertencia que corresponde al nombre de un alimento, si la hay. */
export function findFoodWarning(name: string): FoodWarning | null {
  const n = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
  if (!n) return null;
  for (const w of FOOD_WARNINGS) {
    for (const m of w.match) {
      const mm = m.normalize('NFD').replace(/[̀-ͯ]/g, '');
      if (n === mm || n.includes(mm) || mm.includes(n)) return w;
    }
  }
  return null;
}

// ── Rutina inicial sugerida ──────────────────────────────────────────────────
//
// Se crea en el onboarding y es completamente editable. No incluye medicación:
// esa se añade sólo si la cuidadora registra un medicamento recetado.

export interface SeedTask {
  title: string;
  emoji: string;
  timeOfDay: TimeOfDay;
  scheduledTime: string;
  category: 'comida' | 'medicacion' | 'actividad' | 'higiene' | 'terapia' | 'registro' | 'otro';
}

export const SEED_TASKS: SeedTask[] = [
  { title: 'Desayuno', emoji: '🥣', timeOfDay: 'manana', scheduledTime: '08:00', category: 'comida' },
  { title: 'Agua fresca', emoji: '💧', timeOfDay: 'manana', scheduledTime: '08:15', category: 'otro' },
  { title: 'Caminata suave', emoji: '🐕', timeOfDay: 'manana', scheduledTime: '08:30', category: 'actividad' },
  { title: 'Agua fresca', emoji: '💧', timeOfDay: 'mediodia', scheduledTime: '13:00', category: 'otro' },
  { title: 'Paseo', emoji: '🐕', timeOfDay: 'tarde', scheduledTime: '18:00', category: 'actividad' },
  { title: 'Cena', emoji: '🥣', timeOfDay: 'noche', scheduledTime: '20:00', category: 'comida' },
  { title: 'Check-in de la noche', emoji: '🌙', timeOfDay: 'noche', scheduledTime: '21:30', category: 'registro' },
];

// ── Etiquetas para la interfaz ───────────────────────────────────────────────

export const TIME_OF_DAY_LABEL: Record<TimeOfDay, string> = {
  manana: 'Mañana',
  mediodia: 'Mediodía',
  tarde: 'Tarde',
  noche: 'Noche',
};

export const TIME_OF_DAY_ORDER: TimeOfDay[] = ['manana', 'mediodia', 'tarde', 'noche'];

export const OVERALL_STATE = [
  { value: 5, emoji: '😄', label: 'Muy bien' },
  { value: 4, emoji: '🙂', label: 'Bien' },
  { value: 3, emoji: '😐', label: 'Regular' },
  { value: 2, emoji: '😟', label: 'Mal' },
  { value: 1, emoji: '😣', label: 'Muy mal' },
] as const;

export function overallStateLabel(v: number | null | undefined): string {
  return OVERALL_STATE.find((o) => o.value === v)?.label ?? 'Sin registro';
}

export function overallStateEmoji(v: number | null | undefined): string {
  return OVERALL_STATE.find((o) => o.value === v)?.emoji ?? '·';
}

export const MOBILITY_OPTIONS = [
  { value: 'mejor', label: 'Mejor que otros días' },
  { value: 'normal_para_ella', label: 'Normal para ella' },
  { value: 'algo_peor', label: 'Algo peor' },
  { value: 'bastante_peor', label: 'Bastante peor' },
] as const;

export const APPETITE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'menos', label: 'Comió menos' },
  { value: 'mas', label: 'Comió más' },
  { value: 'rechazo', label: 'No quiso comer' },
] as const;

export const WATER_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'menos', label: 'Menos' },
  { value: 'mas', label: 'Más' },
  { value: 'no_se', label: 'No sé' },
] as const;

export const URINE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'diferente', label: 'Diferente' },
  { value: 'dificultad', label: 'Con dificultad' },
  { value: 'accidente', label: 'Accidente en casa' },
  { value: 'no_hizo', label: 'No hizo' },
] as const;

export const STOOL_OPTIONS = [
  { value: 'normal', label: 'Normal y formada' },
  { value: 'blandas', label: 'Un poco blanda' },
  { value: 'muy_blandas', label: 'Muy blanda' },
  { value: 'liquidas', label: 'Líquida' },
  { value: 'duras', label: 'Dura y seca' },
  { value: 'no_hizo', label: 'No hizo' },
] as const;

export const SLEEP_OPTIONS = [
  { value: 'bien', label: 'Durmió bien' },
  { value: 'despertares', label: 'Se despertó varias veces' },
  { value: 'inquieta', label: 'Inquieta' },
  { value: 'cambios_postura', label: 'Cambió mucho de posición' },
] as const;

export const EVENT_CATEGORY_LABEL: Record<string, string> = {
  movilidad: 'Movilidad',
  incomodidad: 'Incomodidad',
  no_come: 'No quiere comer',
  vomito: 'Vómito',
  diarrea: 'Diarrea',
  orina: 'Problema al orinar',
  caida: 'Se cayó',
  comportamiento: 'Comportamiento extraño',
  alimentacion: 'Alimentación',
  otro: 'Otra cosa',
};

export const VIDEO_CATEGORY_LABEL: Record<string, string> = {
  caminar_lateral: 'Caminando de lado',
  caminar_atras: 'Caminando desde atrás',
  caminar_frente: 'Caminando de frente',
  levantarse: 'Levantarse',
  sentarse: 'Sentarse',
  episodio: 'Episodio',
  despues_paseo: 'Después del paseo',
  libre: 'Libre',
};

export const DOC_CATEGORY_LABEL: Record<string, string> = {
  formula: 'Fórmula médica',
  examen: 'Examen',
  radiografia: 'Radiografía',
  orden: 'Orden médica',
  informe: 'Informe',
  otro: 'Otro',
};

export const INSTRUCTION_TYPE_LABEL: Record<string, string> = {
  medicacion: 'Medicación',
  actividad: 'Actividad',
  alimentacion: 'Alimentación',
  rehabilitacion: 'Rehabilitación',
  estudio: 'Estudio',
  seguimiento: 'Seguimiento',
  otro: 'Otro',
};
