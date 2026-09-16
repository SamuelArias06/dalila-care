import type { LocalDate } from './dates.js';

export const SCHEMA_VERSION = 1;

/** Campos presentes en toda entidad almacenada. */
export interface BaseEntity {
  id: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  deletedAt?: string;
}

// ── Perfil ───────────────────────────────────────────────────────────────────

export type Sex = 'hembra' | 'macho' | '';

export interface Dog extends BaseEntity {
  name: string;
  photoMediaId?: string;
  breed?: string;
  birthDate?: LocalDate;
  birthDateIsApproximate?: boolean;
  sex?: Sex;
  sterilized?: boolean | null;
  currentWeightKg?: number | null;
  targetWeightKg?: number | null;
  targetWeightSetBy?: string;
  vetName?: string;
  vetClinic?: string;
  vetPhone?: string;
  emergencyPhone?: string;
  emergencyClinicName?: string;
  allergies?: string;
  notes?: string;
}

export type DiagnosisStatus = 'activo' | 'en_estudio' | 'resuelto';

export interface Diagnosis extends BaseEntity {
  name: string;
  diagnosedOn?: LocalDate;
  diagnosedBy?: string;
  clinic?: string;
  status: DiagnosisStatus;
  confirmationMethod?: string;
  notes?: string;
}

// ── Registro diario ──────────────────────────────────────────────────────────

export type OverallState = 1 | 2 | 3 | 4 | 5;
export type Mobility = 'mejor' | 'normal_para_ella' | 'algo_peor' | 'bastante_peor' | '';
export type Appetite = 'normal' | 'menos' | 'mas' | 'rechazo' | '';
export type Water = 'normal' | 'menos' | 'mas' | 'no_se' | '';
export type Urine = 'normal' | 'diferente' | 'dificultad' | 'accidente' | 'no_hizo' | '';
export type Stool = 'normal' | 'blandas' | 'muy_blandas' | 'liquidas' | 'duras' | 'no_hizo' | '';
export type Sleep = 'bien' | 'despertares' | 'inquieta' | 'cambios_postura' | '';

export interface DailyLog extends BaseEntity {
  localDate: LocalDate;
  morningCheckAt?: string;
  eveningCheckAt?: string;
  overallState?: OverallState | null;
  mobility?: Mobility;
  mobilitySigns: string[];
  discomfortSigns: string[];
  noDiscomfortObserved?: boolean;
  appetite?: Appetite;
  water?: Water;
  urine?: Urine;
  urineNote?: string;
  stool?: Stool;
  stoolFlags: string[];
  stoolNote?: string;
  sleep?: Sleep;
  mood: string[];
  note?: string;
  isRetroactive?: boolean;
}

export type SignGroup = 'movilidad' | 'incomodidad' | 'animo' | 'digestivo';

export interface SignDef {
  id: string;
  group: SignGroup;
  label: string;
  /** Marca observaciones potencialmente neurológicas: cambian la orientación. */
  neuro?: boolean;
  order: number;
}

// ── Rutinas ──────────────────────────────────────────────────────────────────

export type TimeOfDay = 'manana' | 'mediodia' | 'tarde' | 'noche';
export type TaskCategory = 'comida' | 'medicacion' | 'actividad' | 'higiene' | 'terapia' | 'registro' | 'otro';
export type RecommendedBy = 'veterinario' | 'fisioterapeuta' | 'cuidadora' | 'otro';

export interface RoutineTask extends BaseEntity {
  title: string;
  emoji?: string;
  timeOfDay: TimeOfDay;
  scheduledTime?: string;
  daysOfWeek: number[];
  category: TaskCategory;
  linkedMedicationId?: string;
  linkedFeedingPlanItemId?: string;
  recommendedBy?: RecommendedBy;
  recommendedByName?: string;
  vetInstructionId?: string;
  notes?: string;
  order: number;
  active: boolean;
  /** Nace de una indicación veterinaria: pide confirmación antes de eliminarla. */
  protected?: boolean;
}

export type TaskStatus = 'hecha' | 'omitida' | 'pospuesta';

export interface TaskCompletion extends BaseEntity {
  taskId: string;
  localDate: LocalDate;
  status: TaskStatus;
  completedAt?: string;
  note?: string;
  skipReason?: string;
  titleSnapshot: string;
  scheduledTimeSnapshot?: string;
}

// ── Medicamentos ─────────────────────────────────────────────────────────────

export type MedicationStatus = 'activo' | 'suspendido' | 'finalizado';

export interface Medication extends BaseEntity {
  name: string;
  activeIngredient?: string;
  presentation?: string;
  reason?: string;
  prescribedBy?: string;
  clinic?: string;
  startedOn?: LocalDate;
  endedOn?: LocalDate;
  endedReason?: string;
  status: MedicationStatus;
  notes?: string;
}

export type WithFood = 'con' | 'sin' | 'indiferente' | '';

/** La prescripción vigente. Cambiarla cierra esta versión y crea la siguiente. */
export interface MedicationVersion extends BaseEntity {
  medicationId: string;
  versionNumber: number;
  /** Texto literal de la indicación veterinaria. Nunca un número calculable. */
  doseText: string;
  frequencyText?: string;
  timesOfDay: string[];
  withFood?: WithFood;
  effectiveFrom: LocalDate;
  effectiveTo?: LocalDate;
  changeReason?: string;
  prescribedBy?: string;
}

export type DoseStatus = 'administrado' | 'omitido' | 'administrado_tarde' | 'posible_reaccion';

export interface MedicationDose extends BaseEntity {
  medicationId: string;
  medicationVersionId: string;
  localDate: LocalDate;
  scheduledTime?: string;
  administeredAt?: string;
  status: DoseStatus;
  reactionNote?: string;
  note?: string;
  medicationNameSnapshot: string;
  doseTextSnapshot: string;
}

// ── Alimentación ─────────────────────────────────────────────────────────────

export type FoodType = 'principal' | 'complemento' | 'premio' | 'suplemento';

export interface FoodItem extends BaseEntity {
  name: string;
  type: FoodType;
  brand?: string;
  /** Advertencia de seguridad conocida, con su fuente. Nunca bloquea; informa. */
  safetyNote?: string;
  safetySource?: string;
  active: boolean;
  notes?: string;
}

export interface FeedingPlanItem extends BaseEntity {
  foodId: string;
  amountText: string;
  timesOfDay: TimeOfDay[];
  frequencyText?: string;
  purpose?: string;
  recommendedBy?: RecommendedBy;
  recommendedByName?: string;
  effectiveFrom: LocalDate;
  effectiveTo?: LocalDate;
  active: boolean;
  notes?: string;
}

export type FeedingResult = 'comio_todo' | 'comio_parcial' | 'no_quiso';
export type FeedingReaction = 'ninguna' | 'vomito' | 'diarrea' | 'picor' | 'decaimiento' | 'otro';

export interface FeedingLog extends BaseEntity {
  localDate: LocalDate;
  feedingPlanItemId?: string;
  foodId?: string;
  timeOfDay?: TimeOfDay;
  result: FeedingResult;
  reaction?: FeedingReaction;
  reactionNote?: string;
  foodNameSnapshot: string;
  amountTextSnapshot?: string;
  note?: string;
}

// ── Peso y actividad ─────────────────────────────────────────────────────────

export interface WeightEntry extends BaseEntity {
  localDate: LocalDate;
  weightKg: number;
  measuredAt?: 'casa' | 'clinica' | 'otro';
  bcsValue?: number | null;
  bcsAssessedBy?: string;
  note?: string;
}

export type ActivityType = 'paseo' | 'juego' | 'ejercicio_terapeutico' | 'otro';
export type Surface = 'pasto' | 'asfalto' | 'piso_liso' | 'arena' | 'mixto' | '';
export type Intensity = 'muy_suave' | 'suave' | 'moderada' | '';
export type StartedHow = 'bien' | 'rigida' | 'con_dificultad' | '';
export type EndedHow = 'bien' | 'cansada' | 'cojeando' | 'con_dificultad' | '';

export interface ActivityLog extends BaseEntity {
  localDate: LocalDate;
  type: ActivityType;
  startedAt?: string;
  durationMin?: number | null;
  surface?: Surface;
  intensity?: Intensity;
  startedHow?: StartedHow;
  endedHow?: EndedHow;
  neededToStop?: boolean;
  neededHelp?: boolean;
  wantedToContinue?: boolean;
  note?: string;
}

// ── Media y documentos ───────────────────────────────────────────────────────

export type MediaKind = 'video' | 'foto' | 'documento';
export type MediaPurpose = 'seguimiento' | 'momento' | 'documento';
export type UploadState = 'pendiente' | 'subiendo' | 'subido' | 'error';

export const VIDEO_CATEGORIES = [
  'caminar_lateral',
  'caminar_atras',
  'caminar_frente',
  'levantarse',
  'sentarse',
  'episodio',
  'despues_paseo',
  'libre',
] as const;
export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

export const DOC_CATEGORIES = ['formula', 'examen', 'radiografia', 'orden', 'informe', 'otro'] as const;
export type DocCategory = (typeof DOC_CATEGORIES)[number];

export interface MediaItem extends BaseEntity {
  kind: MediaKind;
  purpose: MediaPurpose;
  category?: string;
  driveFileId?: string;
  posterDataUrl?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  durationSec?: number | null;
  capturedAt: string;
  localDate: LocalDate;
  note?: string;
  uploadState: UploadState;
  uploadError?: string;
  linkedEventId?: string;
  isFavorite?: boolean;
}

// ── Eventos ──────────────────────────────────────────────────────────────────

export const EVENT_CATEGORIES = [
  'movilidad',
  'incomodidad',
  'no_come',
  'vomito',
  'diarrea',
  'orina',
  'caida',
  'comportamiento',
  'alimentacion',
  'otro',
] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export type TriageLevel = 'observar' | 'consultar_pronto' | 'contactar_hoy' | 'urgencia';
export type SeverityFelt = 'leve' | 'moderado' | 'fuerte' | '';

export interface CareEvent extends BaseEntity {
  localDate: LocalDate;
  occurredAt: string;
  category: EventCategory;
  severityFelt?: SeverityFelt;
  sinceWhen?: 'ahora' | 'hoy' | 'ayer' | 'varios_dias' | '';
  extraSigns: string[];
  description?: string;
  whatHelped?: string;
  whatSeemedWorse?: string;
  triageLevel?: TriageLevel;
  triageRuleId?: string;
  actionTaken?: 'llame' | 'fui' | 'observe' | 'nada' | '';
  outcomeNote?: string;
  mediaIds: string[];
  isConcern: boolean;
}

// ── Veterinario ──────────────────────────────────────────────────────────────

export type QuestionStatus = 'pendiente' | 'respondida' | 'ya_no_aplica';

export interface VetQuestion extends BaseEntity {
  text: string;
  context?: string;
  status: QuestionStatus;
  answeredAt?: string;
  answerText?: string;
  answeredBy?: string;
}

export const INSTRUCTION_TYPES = [
  'medicacion',
  'actividad',
  'alimentacion',
  'rehabilitacion',
  'estudio',
  'seguimiento',
  'otro',
] as const;
export type InstructionType = (typeof INSTRUCTION_TYPES)[number];

export interface VetInstruction extends BaseEntity {
  localDate: LocalDate;
  vetName?: string;
  clinic?: string;
  type: InstructionType;
  instructionText: string;
  rationale?: string;
  reviewDate?: LocalDate;
  status: 'vigente' | 'cumplida' | 'suspendida';
  mediaIds: string[];
  derivedTaskIds: string[];
}

export interface Appointment extends BaseEntity {
  localDate: LocalDate;
  time?: string;
  vetName?: string;
  clinic?: string;
  reason?: string;
  type: 'control' | 'urgencia' | 'terapia' | 'estudio' | 'otro';
  status: 'programada' | 'realizada' | 'cancelada';
  summaryNote?: string;
}

// ── Momentos ─────────────────────────────────────────────────────────────────

export interface Moment extends BaseEntity {
  localDate: LocalDate;
  text: string;
  mediaIds: string[];
}

// ── Acceso ───────────────────────────────────────────────────────────────────

export interface Device extends BaseEntity {
  label: string;
  tokenHash: string;
  role: 'admin' | 'caregiver';
  lastSeenAt?: string;
  revokedAt?: string;
}

// ── Conjunto completo ────────────────────────────────────────────────────────

export interface DalilaData {
  dog: Dog | null;
  diagnoses: Diagnosis[];
  dailyLogs: DailyLog[];
  tasks: RoutineTask[];
  completions: TaskCompletion[];
  medications: Medication[];
  medicationVersions: MedicationVersion[];
  doses: MedicationDose[];
  foods: FoodItem[];
  feedingPlan: FeedingPlanItem[];
  feedingLogs: FeedingLog[];
  weights: WeightEntry[];
  activities: ActivityLog[];
  media: MediaItem[];
  events: CareEvent[];
  questions: VetQuestion[];
  instructions: VetInstruction[];
  appointments: Appointment[];
  moments: Moment[];
}

export type EntityName = keyof DalilaData;

export function emptyData(): DalilaData {
  return {
    dog: null,
    diagnoses: [],
    dailyLogs: [],
    tasks: [],
    completions: [],
    medications: [],
    medicationVersions: [],
    doses: [],
    foods: [],
    feedingPlan: [],
    feedingLogs: [],
    weights: [],
    activities: [],
    media: [],
    events: [],
    questions: [],
    instructions: [],
    appointments: [],
    moments: [],
  };
}
