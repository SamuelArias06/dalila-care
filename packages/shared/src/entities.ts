/**
 * Validación por colección.
 *
 * Es el mismo código en el navegador y en Apps Script: el cliente lo usa para
 * avisar al instante, el servidor lo usa como única fuente de verdad. Al ser
 * literalmente el mismo archivo, no pueden divergir.
 *
 * Cada validador recibe un patch parcial (sólo los campos que cambian) y
 * devuelve el patch saneado. Lo que no reconoce, lo descarta: nunca se escribe
 * en la hoja un campo que no esté declarado.
 */

import {
  bool,
  entityId,
  isoInstant,
  LIMITS,
  localDate as vDate,
  mimeType as vMime,
  num,
  oneOf,
  plausibleLogDate,
  str,
  strList,
  time as vTime,
  ValidationError,
  weightKg as vWeight,
  numList,
} from './validation.js';
import { EVENT_CATEGORIES, INSTRUCTION_TYPES } from './types.js';
import type { Collection } from './protocol.js';

type Patch = Record<string, unknown>;
type Validator = (patch: Patch, ctx: { today: string }) => Patch;

const has = (p: Patch, k: string): boolean => Object.prototype.hasOwnProperty.call(p, k);

/** Copia campos opcionales aplicando su validador sólo si vienen en el patch. */
function pick(patch: Patch, out: Patch, field: string, fn: (v: unknown) => unknown): void {
  if (has(patch, field)) out[field] = fn(patch[field]);
}

const text = (max: number) => (v: unknown) => str(v, 'texto', max);
const flag = (v: unknown) => bool(v);

const validators: Record<Collection, Validator> = {
  dog: (p) => {
    const out: Patch = {};
    pick(p, out, 'name', (v) => str(v, 'name', LIMITS.name, true));
    pick(p, out, 'photoMediaId', text(60));
    pick(p, out, 'breed', text(LIMITS.name));
    pick(p, out, 'birthDate', (v) => vDate(v, 'birthDate'));
    pick(p, out, 'birthDateIsApproximate', flag);
    pick(p, out, 'sex', (v) => oneOf(v, 'sex', ['hembra', 'macho'] as const));
    pick(p, out, 'sterilized', flag);
    pick(p, out, 'currentWeightKg', (v) => (v === '' || v == null ? null : vWeight(v)));
    pick(p, out, 'targetWeightKg', (v) => (v === '' || v == null ? null : vWeight(v)));
    pick(p, out, 'targetWeightSetBy', text(LIMITS.name));
    pick(p, out, 'vetName', text(LIMITS.name));
    pick(p, out, 'vetClinic', text(LIMITS.name));
    pick(p, out, 'vetPhone', text(LIMITS.phone));
    pick(p, out, 'emergencyPhone', text(LIMITS.phone));
    pick(p, out, 'emergencyClinicName', text(LIMITS.name));
    pick(p, out, 'allergies', text(LIMITS.note));
    pick(p, out, 'notes', text(LIMITS.note));
    return out;
  },

  diagnoses: (p) => {
    const out: Patch = {};
    pick(p, out, 'name', (v) => str(v, 'name', LIMITS.title, true));
    pick(p, out, 'diagnosedOn', (v) => vDate(v, 'diagnosedOn'));
    pick(p, out, 'diagnosedBy', text(LIMITS.name));
    pick(p, out, 'clinic', text(LIMITS.name));
    pick(p, out, 'status', (v) => oneOf(v, 'status', ['activo', 'en_estudio', 'resuelto'] as const, { fallback: 'activo' }));
    pick(p, out, 'confirmationMethod', text(LIMITS.shortText));
    pick(p, out, 'notes', text(LIMITS.note));
    return out;
  },

  dailyLogs: (p, ctx) => {
    const out: Patch = {};
    pick(p, out, 'localDate', (v) => plausibleLogDate(vDate(v, 'localDate', true), ctx.today));
    pick(p, out, 'morningCheckAt', (v) => isoInstant(v, 'morningCheckAt'));
    pick(p, out, 'eveningCheckAt', (v) => isoInstant(v, 'eveningCheckAt'));
    pick(p, out, 'overallState', (v) => (v === '' || v == null ? null : num(v, 'overallState', { min: 1, max: 5 })));
    pick(p, out, 'mobility', (v) =>
      oneOf(v, 'mobility', ['mejor', 'normal_para_ella', 'algo_peor', 'bastante_peor'] as const));
    pick(p, out, 'mobilitySigns', (v) => strList(v, 'mobilitySigns'));
    pick(p, out, 'discomfortSigns', (v) => strList(v, 'discomfortSigns'));
    pick(p, out, 'noDiscomfortObserved', flag);
    pick(p, out, 'appetite', (v) => oneOf(v, 'appetite', ['normal', 'menos', 'mas', 'rechazo'] as const));
    pick(p, out, 'water', (v) => oneOf(v, 'water', ['normal', 'menos', 'mas', 'no_se'] as const));
    pick(p, out, 'urine', (v) =>
      oneOf(v, 'urine', ['normal', 'diferente', 'dificultad', 'accidente', 'no_hizo'] as const));
    pick(p, out, 'urineNote', text(LIMITS.note));
    pick(p, out, 'stool', (v) =>
      oneOf(v, 'stool', ['normal', 'blandas', 'muy_blandas', 'liquidas', 'duras', 'no_hizo'] as const));
    pick(p, out, 'stoolFlags', (v) => strList(v, 'stoolFlags'));
    pick(p, out, 'stoolNote', text(LIMITS.note));
    pick(p, out, 'sleep', (v) => oneOf(v, 'sleep', ['bien', 'despertares', 'inquieta', 'cambios_postura'] as const));
    pick(p, out, 'mood', (v) => strList(v, 'mood'));
    pick(p, out, 'note', text(LIMITS.note));
    pick(p, out, 'isRetroactive', flag);
    return out;
  },

  tasks: (p) => {
    const out: Patch = {};
    pick(p, out, 'title', (v) => str(v, 'title', LIMITS.title, true));
    pick(p, out, 'emoji', text(8));
    pick(p, out, 'timeOfDay', (v) =>
      oneOf(v, 'timeOfDay', ['manana', 'mediodia', 'tarde', 'noche'] as const, { fallback: 'manana' }));
    pick(p, out, 'scheduledTime', (v) => vTime(v, 'scheduledTime'));
    pick(p, out, 'daysOfWeek', (v) => numList(v, 'daysOfWeek', 1, 7));
    pick(p, out, 'category', (v) =>
      oneOf(v, 'category', ['comida', 'medicacion', 'actividad', 'higiene', 'terapia', 'registro', 'otro'] as const, {
        fallback: 'otro',
      }));
    pick(p, out, 'linkedMedicationId', (v) => entityId(v, 'linkedMedicationId', 'med'));
    pick(p, out, 'linkedFeedingPlanItemId', (v) => entityId(v, 'linkedFeedingPlanItemId', 'fpi'));
    pick(p, out, 'recommendedBy', (v) =>
      oneOf(v, 'recommendedBy', ['veterinario', 'fisioterapeuta', 'cuidadora', 'otro'] as const));
    pick(p, out, 'recommendedByName', text(LIMITS.name));
    pick(p, out, 'vetInstructionId', (v) => entityId(v, 'vetInstructionId', 'vti'));
    pick(p, out, 'notes', text(LIMITS.note));
    pick(p, out, 'order', (v) => num(v, 'order', { min: 0, max: 100000 }) ?? 0);
    pick(p, out, 'active', flag);
    pick(p, out, 'protected', flag);
    return out;
  },

  completions: (p, ctx) => {
    const out: Patch = {};
    pick(p, out, 'taskId', (v) => entityId(v, 'taskId', 'tsk', true));
    pick(p, out, 'localDate', (v) => plausibleLogDate(vDate(v, 'localDate', true), ctx.today));
    pick(p, out, 'status', (v) => oneOf(v, 'status', ['hecha', 'omitida', 'pospuesta'] as const, { required: true }));
    pick(p, out, 'completedAt', (v) => isoInstant(v, 'completedAt'));
    pick(p, out, 'note', text(LIMITS.note));
    pick(p, out, 'skipReason', text(LIMITS.shortText));
    pick(p, out, 'titleSnapshot', (v) => str(v, 'titleSnapshot', LIMITS.title));
    pick(p, out, 'scheduledTimeSnapshot', (v) => vTime(v, 'scheduledTimeSnapshot'));
    return out;
  },

  medications: (p) => {
    const out: Patch = {};
    pick(p, out, 'name', (v) => str(v, 'name', LIMITS.title, true));
    pick(p, out, 'activeIngredient', text(LIMITS.title));
    pick(p, out, 'presentation', text(LIMITS.shortText));
    pick(p, out, 'reason', text(LIMITS.shortText));
    pick(p, out, 'prescribedBy', text(LIMITS.name));
    pick(p, out, 'clinic', text(LIMITS.name));
    pick(p, out, 'startedOn', (v) => vDate(v, 'startedOn'));
    pick(p, out, 'endedOn', (v) => vDate(v, 'endedOn'));
    pick(p, out, 'endedReason', text(LIMITS.shortText));
    pick(p, out, 'status', (v) =>
      oneOf(v, 'status', ['activo', 'suspendido', 'finalizado'] as const, { fallback: 'activo' }));
    pick(p, out, 'notes', text(LIMITS.note));
    return out;
  },

  medicationVersions: (p) => {
    const out: Patch = {};
    pick(p, out, 'medicationId', (v) => entityId(v, 'medicationId', 'med', true));
    pick(p, out, 'versionNumber', (v) => num(v, 'versionNumber', { min: 1, max: 9999 }) ?? 1);
    // La dosis es SIEMPRE texto libre copiado de la indicación veterinaria.
    // No existe ningún campo numérico con el que la app pueda hacer aritmética.
    pick(p, out, 'doseText', (v) => str(v, 'doseText', LIMITS.shortText, true));
    pick(p, out, 'frequencyText', text(LIMITS.shortText));
    pick(p, out, 'timesOfDay', (v) => strList(v, 'timesOfDay', 12));
    pick(p, out, 'withFood', (v) => oneOf(v, 'withFood', ['con', 'sin', 'indiferente'] as const));
    pick(p, out, 'effectiveFrom', (v) => vDate(v, 'effectiveFrom', true));
    pick(p, out, 'effectiveTo', (v) => vDate(v, 'effectiveTo'));
    pick(p, out, 'changeReason', text(LIMITS.shortText));
    pick(p, out, 'prescribedBy', text(LIMITS.name));
    return out;
  },

  doses: (p, ctx) => {
    const out: Patch = {};
    pick(p, out, 'medicationId', (v) => entityId(v, 'medicationId', 'med', true));
    pick(p, out, 'medicationVersionId', (v) => entityId(v, 'medicationVersionId', 'mdv'));
    pick(p, out, 'localDate', (v) => plausibleLogDate(vDate(v, 'localDate', true), ctx.today));
    pick(p, out, 'scheduledTime', (v) => vTime(v, 'scheduledTime'));
    pick(p, out, 'administeredAt', (v) => isoInstant(v, 'administeredAt'));
    pick(p, out, 'status', (v) =>
      oneOf(v, 'status', ['administrado', 'omitido', 'administrado_tarde', 'posible_reaccion'] as const, {
        required: true,
      }));
    pick(p, out, 'reactionNote', text(LIMITS.note));
    pick(p, out, 'note', text(LIMITS.note));
    pick(p, out, 'medicationNameSnapshot', (v) => str(v, 'medicationNameSnapshot', LIMITS.title));
    pick(p, out, 'doseTextSnapshot', (v) => str(v, 'doseTextSnapshot', LIMITS.shortText));
    return out;
  },

  foods: (p) => {
    const out: Patch = {};
    pick(p, out, 'name', (v) => str(v, 'name', LIMITS.title, true));
    pick(p, out, 'type', (v) =>
      oneOf(v, 'type', ['principal', 'complemento', 'premio', 'suplemento'] as const, { fallback: 'complemento' }));
    pick(p, out, 'brand', text(LIMITS.name));
    pick(p, out, 'safetyNote', text(LIMITS.note));
    pick(p, out, 'safetySource', text(LIMITS.shortText));
    pick(p, out, 'active', flag);
    pick(p, out, 'notes', text(LIMITS.note));
    return out;
  },

  feedingPlan: (p) => {
    const out: Patch = {};
    pick(p, out, 'foodId', (v) => entityId(v, 'foodId', 'fdi', true));
    pick(p, out, 'amountText', (v) => str(v, 'amountText', LIMITS.shortText));
    pick(p, out, 'timesOfDay', (v) => strList(v, 'timesOfDay', 8));
    pick(p, out, 'frequencyText', text(LIMITS.shortText));
    pick(p, out, 'purpose', text(LIMITS.shortText));
    pick(p, out, 'recommendedBy', (v) =>
      oneOf(v, 'recommendedBy', ['veterinario', 'fisioterapeuta', 'cuidadora', 'otro'] as const));
    pick(p, out, 'recommendedByName', text(LIMITS.name));
    pick(p, out, 'effectiveFrom', (v) => vDate(v, 'effectiveFrom', true));
    pick(p, out, 'effectiveTo', (v) => vDate(v, 'effectiveTo'));
    pick(p, out, 'active', flag);
    pick(p, out, 'notes', text(LIMITS.note));
    return out;
  },

  feedingLogs: (p, ctx) => {
    const out: Patch = {};
    pick(p, out, 'localDate', (v) => plausibleLogDate(vDate(v, 'localDate', true), ctx.today));
    pick(p, out, 'feedingPlanItemId', (v) => entityId(v, 'feedingPlanItemId', 'fpi'));
    pick(p, out, 'foodId', (v) => entityId(v, 'foodId', 'fdi'));
    pick(p, out, 'timeOfDay', (v) => oneOf(v, 'timeOfDay', ['manana', 'mediodia', 'tarde', 'noche'] as const));
    pick(p, out, 'result', (v) =>
      oneOf(v, 'result', ['comio_todo', 'comio_parcial', 'no_quiso'] as const, { required: true }));
    pick(p, out, 'reaction', (v) =>
      oneOf(v, 'reaction', ['ninguna', 'vomito', 'diarrea', 'picor', 'decaimiento', 'otro'] as const));
    pick(p, out, 'reactionNote', text(LIMITS.note));
    pick(p, out, 'foodNameSnapshot', (v) => str(v, 'foodNameSnapshot', LIMITS.title));
    pick(p, out, 'amountTextSnapshot', text(LIMITS.shortText));
    pick(p, out, 'note', text(LIMITS.note));
    return out;
  },

  weights: (p, ctx) => {
    const out: Patch = {};
    pick(p, out, 'localDate', (v) => plausibleLogDate(vDate(v, 'localDate', true), ctx.today));
    pick(p, out, 'weightKg', (v) => vWeight(v));
    pick(p, out, 'measuredAt', (v) => oneOf(v, 'measuredAt', ['casa', 'clinica', 'otro'] as const, { fallback: 'casa' }));
    // El BCS lo asigna un veterinario. La app nunca lo calcula ni lo estima.
    pick(p, out, 'bcsValue', (v) => (v === '' || v == null ? null : num(v, 'bcsValue', { min: 1, max: 9 })));
    pick(p, out, 'bcsAssessedBy', text(LIMITS.name));
    pick(p, out, 'note', text(LIMITS.note));
    return out;
  },

  activities: (p, ctx) => {
    const out: Patch = {};
    pick(p, out, 'localDate', (v) => plausibleLogDate(vDate(v, 'localDate', true), ctx.today));
    pick(p, out, 'type', (v) =>
      oneOf(v, 'type', ['paseo', 'juego', 'ejercicio_terapeutico', 'otro'] as const, { fallback: 'paseo' }));
    pick(p, out, 'startedAt', (v) => isoInstant(v, 'startedAt'));
    pick(p, out, 'durationMin', (v) => (v === '' || v == null ? null : num(v, 'durationMin', { min: 0, max: 600 })));
    pick(p, out, 'surface', (v) => oneOf(v, 'surface', ['pasto', 'asfalto', 'piso_liso', 'arena', 'mixto'] as const));
    pick(p, out, 'intensity', (v) => oneOf(v, 'intensity', ['muy_suave', 'suave', 'moderada'] as const));
    pick(p, out, 'startedHow', (v) => oneOf(v, 'startedHow', ['bien', 'rigida', 'con_dificultad'] as const));
    pick(p, out, 'endedHow', (v) => oneOf(v, 'endedHow', ['bien', 'cansada', 'cojeando', 'con_dificultad'] as const));
    pick(p, out, 'neededToStop', flag);
    pick(p, out, 'neededHelp', flag);
    pick(p, out, 'wantedToContinue', flag);
    pick(p, out, 'note', text(LIMITS.note));
    return out;
  },

  media: (p, ctx) => {
    const out: Patch = {};
    pick(p, out, 'kind', (v) => oneOf(v, 'kind', ['video', 'foto', 'documento'] as const, { required: true }));
    pick(p, out, 'purpose', (v) =>
      oneOf(v, 'purpose', ['seguimiento', 'momento', 'documento'] as const, { fallback: 'seguimiento' }));
    pick(p, out, 'category', text(60));
    pick(p, out, 'driveFileId', text(120));
    // El póster es un JPEG diminuto en base64: hace que la galería cargue al
    // instante sin descargar ningún vídeo.
    pick(p, out, 'posterDataUrl', (v) => {
      const s = String(v ?? '');
      if (!s) return '';
      if (!s.startsWith('data:image/')) throw new ValidationError('posterDataUrl', 'Formato de miniatura no válido.');
      if (s.length > 200_000) throw new ValidationError('posterDataUrl', 'La miniatura es demasiado grande.');
      return s;
    });
    pick(p, out, 'fileName', (v) => str(v, 'fileName', 120));
    pick(p, out, 'mimeType', (v) => (v ? vMime(v) : ''));
    pick(p, out, 'sizeBytes', (v) => num(v, 'sizeBytes', { min: 0, max: LIMITS.fileBytes }) ?? 0);
    pick(p, out, 'durationSec', (v) => (v === '' || v == null ? null : num(v, 'durationSec', { min: 0, max: 7200 })));
    pick(p, out, 'capturedAt', (v) => isoInstant(v, 'capturedAt'));
    pick(p, out, 'localDate', (v) => plausibleLogDate(vDate(v, 'localDate', true), ctx.today));
    pick(p, out, 'note', text(LIMITS.note));
    pick(p, out, 'uploadState', (v) =>
      oneOf(v, 'uploadState', ['pendiente', 'subiendo', 'subido', 'error'] as const, { fallback: 'pendiente' }));
    pick(p, out, 'uploadError', text(LIMITS.shortText));
    pick(p, out, 'linkedEventId', (v) => entityId(v, 'linkedEventId', 'evt'));
    pick(p, out, 'isFavorite', flag);
    return out;
  },

  events: (p, ctx) => {
    const out: Patch = {};
    pick(p, out, 'localDate', (v) => plausibleLogDate(vDate(v, 'localDate', true), ctx.today));
    pick(p, out, 'occurredAt', (v) => isoInstant(v, 'occurredAt'));
    pick(p, out, 'category', (v) => oneOf(v, 'category', EVENT_CATEGORIES, { fallback: 'otro' }));
    pick(p, out, 'severityFelt', (v) => oneOf(v, 'severityFelt', ['leve', 'moderado', 'fuerte'] as const));
    pick(p, out, 'sinceWhen', (v) => oneOf(v, 'sinceWhen', ['ahora', 'hoy', 'ayer', 'varios_dias'] as const));
    pick(p, out, 'extraSigns', (v) => strList(v, 'extraSigns'));
    pick(p, out, 'description', text(LIMITS.note));
    pick(p, out, 'whatHelped', text(LIMITS.shortText));
    pick(p, out, 'whatSeemedWorse', text(LIMITS.shortText));
    // Se guarda qué orientación mostró la app, para poder auditar después si
    // la regla acertó.
    pick(p, out, 'triageLevel', (v) =>
      oneOf(v, 'triageLevel', ['observar', 'consultar_pronto', 'contactar_hoy', 'urgencia'] as const));
    pick(p, out, 'triageRuleId', text(20));
    pick(p, out, 'actionTaken', (v) => oneOf(v, 'actionTaken', ['llame', 'fui', 'observe', 'nada'] as const));
    pick(p, out, 'outcomeNote', text(LIMITS.note));
    pick(p, out, 'mediaIds', (v) => strList(v, 'mediaIds', 20));
    pick(p, out, 'isConcern', flag);
    return out;
  },

  questions: (p) => {
    const out: Patch = {};
    pick(p, out, 'text', (v) => str(v, 'text', LIMITS.note, true));
    pick(p, out, 'context', text(LIMITS.shortText));
    pick(p, out, 'status', (v) =>
      oneOf(v, 'status', ['pendiente', 'respondida', 'ya_no_aplica'] as const, { fallback: 'pendiente' }));
    pick(p, out, 'answeredAt', (v) => isoInstant(v, 'answeredAt'));
    pick(p, out, 'answerText', text(LIMITS.note));
    pick(p, out, 'answeredBy', text(LIMITS.name));
    return out;
  },

  instructions: (p) => {
    const out: Patch = {};
    pick(p, out, 'localDate', (v) => vDate(v, 'localDate', true));
    pick(p, out, 'vetName', text(LIMITS.name));
    pick(p, out, 'clinic', text(LIMITS.name));
    pick(p, out, 'type', (v) => oneOf(v, 'type', INSTRUCTION_TYPES, { fallback: 'otro' }));
    pick(p, out, 'instructionText', (v) => str(v, 'instructionText', LIMITS.note, true));
    pick(p, out, 'rationale', text(LIMITS.note));
    pick(p, out, 'reviewDate', (v) => vDate(v, 'reviewDate'));
    pick(p, out, 'status', (v) =>
      oneOf(v, 'status', ['vigente', 'cumplida', 'suspendida'] as const, { fallback: 'vigente' }));
    pick(p, out, 'mediaIds', (v) => strList(v, 'mediaIds', 20));
    pick(p, out, 'derivedTaskIds', (v) => strList(v, 'derivedTaskIds', 30));
    return out;
  },

  appointments: (p) => {
    const out: Patch = {};
    pick(p, out, 'localDate', (v) => vDate(v, 'localDate', true));
    pick(p, out, 'time', (v) => vTime(v, 'time'));
    pick(p, out, 'vetName', text(LIMITS.name));
    pick(p, out, 'clinic', text(LIMITS.name));
    pick(p, out, 'reason', text(LIMITS.shortText));
    pick(p, out, 'type', (v) =>
      oneOf(v, 'type', ['control', 'urgencia', 'terapia', 'estudio', 'otro'] as const, { fallback: 'control' }));
    pick(p, out, 'status', (v) =>
      oneOf(v, 'status', ['programada', 'realizada', 'cancelada'] as const, { fallback: 'programada' }));
    pick(p, out, 'summaryNote', text(LIMITS.note));
    return out;
  },

  moments: (p, ctx) => {
    const out: Patch = {};
    pick(p, out, 'localDate', (v) => plausibleLogDate(vDate(v, 'localDate', true), ctx.today));
    pick(p, out, 'text', (v) => str(v, 'text', LIMITS.note));
    pick(p, out, 'mediaIds', (v) => strList(v, 'mediaIds', 20));
    return out;
  },
};

/** Prefijo de id que corresponde a cada colección. */
export const COLLECTION_PREFIX: Record<Collection, string> = {
  dog: 'dog',
  diagnoses: 'dgn',
  dailyLogs: 'dlg',
  tasks: 'tsk',
  completions: 'tcp',
  medications: 'med',
  medicationVersions: 'mdv',
  doses: 'dos',
  foods: 'fdi',
  feedingPlan: 'fpi',
  feedingLogs: 'flg',
  weights: 'wgt',
  activities: 'act',
  media: 'mda',
  events: 'evt',
  questions: 'vtq',
  instructions: 'vti',
  appointments: 'apt',
  moments: 'mom',
};

export function validatePatch(collection: Collection, patch: Patch, today: string): Patch {
  const fn = validators[collection];
  if (!fn) throw new ValidationError('collection', 'Tipo de registro desconocido.');
  return fn(patch ?? {}, { today });
}

export function isKnownCollection(name: unknown): name is Collection {
  return typeof name === 'string' && Object.prototype.hasOwnProperty.call(validators, name);
}
