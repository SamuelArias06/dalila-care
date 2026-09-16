/**
 * Configuración del backend.
 *
 * Nada de lo que hay aquí es un secreto: los secretos reales viven en
 * PropertiesService y se generan en el arranque inicial. BOOTSTRAP_KEY se
 * inyecta en tiempo de compilación desde un archivo local que no está en Git.
 */

/** Sustituido por scripts/build-api.mjs. */
export const BOOTSTRAP_KEY = '__BOOTSTRAP_KEY__';
export const BUILD_VERSION = '__BUILD_VERSION__';

export const PROP = {
  setupDone: 'SETUP_DONE',
  sheetId: 'SHEET_ID',
  rootFolderId: 'ROOT_FOLDER_ID',
  mediaFolderId: 'MEDIA_FOLDER_ID',
  docsFolderId: 'DOCS_FOLDER_ID',
  reportsFolderId: 'REPORTS_FOLDER_ID',
  sessionSecret: 'SESSION_SECRET',
  invites: 'INVITES',
  revokedDevices: 'REVOKED_DEVICES',
  lastBackupAt: 'LAST_BACKUP_AT',
} as const;

export const SHEETS = {
  meta: '_meta',
  devices: '_devices',
  audit: '_audit',
  dog: 'dog',
  diagnoses: 'diagnoses',
  dailyLogs: 'dailyLogs',
  tasks: 'tasks',
  completions: 'completions',
  medications: 'medications',
  medicationVersions: 'medicationVersions',
  doses: 'doses',
  foods: 'foods',
  feedingPlan: 'feedingPlan',
  feedingLogs: 'feedingLogs',
  weights: 'weights',
  activities: 'activities',
  media: 'media',
  events: 'events',
  questions: 'questions',
  instructions: 'instructions',
  appointments: 'appointments',
  moments: 'moments',
} as const;

const BASE_COLS = ['id', 'schemaVersion', 'createdAt', 'updatedAt', 'createdBy', 'deletedAt'];

/** Cabeceras por hoja. Se leen por nombre, así que añadir columnas no rompe nada. */
export const HEADERS: Record<string, string[]> = {
  [SHEETS.dog]: [
    ...BASE_COLS, 'name', 'photoMediaId', 'breed', 'birthDate', 'birthDateIsApproximate', 'sex',
    'sterilized', 'currentWeightKg', 'targetWeightKg', 'targetWeightSetBy', 'vetName', 'vetClinic',
    'vetPhone', 'emergencyPhone', 'emergencyClinicName', 'allergies', 'notes',
  ],
  [SHEETS.diagnoses]: [
    ...BASE_COLS, 'name', 'diagnosedOn', 'diagnosedBy', 'clinic', 'status', 'confirmationMethod', 'notes',
  ],
  [SHEETS.dailyLogs]: [
    ...BASE_COLS, 'localDate', 'morningCheckAt', 'eveningCheckAt', 'overallState', 'mobility',
    'mobilitySigns', 'discomfortSigns', 'noDiscomfortObserved', 'appetite', 'water', 'urine', 'urineNote',
    'stool', 'stoolFlags', 'stoolNote', 'sleep', 'mood', 'note', 'isRetroactive',
  ],
  [SHEETS.tasks]: [
    ...BASE_COLS, 'title', 'emoji', 'timeOfDay', 'scheduledTime', 'daysOfWeek', 'category',
    'linkedMedicationId', 'linkedFeedingPlanItemId', 'recommendedBy', 'recommendedByName',
    'vetInstructionId', 'notes', 'order', 'active', 'protected',
  ],
  [SHEETS.completions]: [
    ...BASE_COLS, 'taskId', 'localDate', 'status', 'completedAt', 'note', 'skipReason',
    'titleSnapshot', 'scheduledTimeSnapshot',
  ],
  [SHEETS.medications]: [
    ...BASE_COLS, 'name', 'activeIngredient', 'presentation', 'reason', 'prescribedBy', 'clinic',
    'startedOn', 'endedOn', 'endedReason', 'status', 'notes',
  ],
  [SHEETS.medicationVersions]: [
    ...BASE_COLS, 'medicationId', 'versionNumber', 'doseText', 'frequencyText', 'timesOfDay',
    'withFood', 'effectiveFrom', 'effectiveTo', 'changeReason', 'prescribedBy',
  ],
  [SHEETS.doses]: [
    ...BASE_COLS, 'medicationId', 'medicationVersionId', 'localDate', 'scheduledTime', 'administeredAt',
    'status', 'reactionNote', 'note', 'medicationNameSnapshot', 'doseTextSnapshot',
  ],
  [SHEETS.foods]: [...BASE_COLS, 'name', 'type', 'brand', 'safetyNote', 'safetySource', 'active', 'notes'],
  [SHEETS.feedingPlan]: [
    ...BASE_COLS, 'foodId', 'amountText', 'timesOfDay', 'frequencyText', 'purpose', 'recommendedBy',
    'recommendedByName', 'effectiveFrom', 'effectiveTo', 'active', 'notes',
  ],
  [SHEETS.feedingLogs]: [
    ...BASE_COLS, 'localDate', 'feedingPlanItemId', 'foodId', 'timeOfDay', 'result', 'reaction',
    'reactionNote', 'foodNameSnapshot', 'amountTextSnapshot', 'note',
  ],
  [SHEETS.weights]: [
    ...BASE_COLS, 'localDate', 'weightKg', 'measuredAt', 'bcsValue', 'bcsAssessedBy', 'note',
  ],
  [SHEETS.activities]: [
    ...BASE_COLS, 'localDate', 'type', 'startedAt', 'durationMin', 'surface', 'intensity',
    'startedHow', 'endedHow', 'neededToStop', 'neededHelp', 'wantedToContinue', 'note',
  ],
  [SHEETS.media]: [
    ...BASE_COLS, 'kind', 'purpose', 'category', 'driveFileId', 'posterDataUrl', 'fileName', 'mimeType',
    'sizeBytes', 'durationSec', 'capturedAt', 'localDate', 'note', 'uploadState', 'uploadError',
    'linkedEventId', 'isFavorite',
  ],
  [SHEETS.events]: [
    ...BASE_COLS, 'localDate', 'occurredAt', 'category', 'severityFelt', 'sinceWhen', 'extraSigns',
    'description', 'whatHelped', 'whatSeemedWorse', 'triageLevel', 'triageRuleId', 'actionTaken',
    'outcomeNote', 'mediaIds', 'isConcern',
  ],
  [SHEETS.questions]: [
    ...BASE_COLS, 'text', 'context', 'status', 'answeredAt', 'answerText', 'answeredBy',
  ],
  [SHEETS.instructions]: [
    ...BASE_COLS, 'localDate', 'vetName', 'clinic', 'type', 'instructionText', 'rationale',
    'reviewDate', 'status', 'mediaIds', 'derivedTaskIds',
  ],
  [SHEETS.appointments]: [
    ...BASE_COLS, 'localDate', 'time', 'vetName', 'clinic', 'reason', 'type', 'status', 'summaryNote',
  ],
  [SHEETS.moments]: [...BASE_COLS, 'localDate', 'text', 'mediaIds'],
  [SHEETS.devices]: [
    ...BASE_COLS, 'label', 'role', 'lastSeenAt', 'revokedAt', 'userAgent',
  ],
  [SHEETS.audit]: ['at', 'actor', 'action', 'entity', 'entityId', 'result', 'errorCode', 'durationMs'],
  [SHEETS.meta]: ['key', 'value', 'updatedAt'],
};

/** Campos que se guardan serializados como JSON en una celda. */
export const JSON_FIELDS = new Set([
  'mobilitySigns', 'discomfortSigns', 'stoolFlags', 'mood', 'daysOfWeek', 'timesOfDay',
  'extraSigns', 'mediaIds', 'derivedTaskIds',
]);

export const BOOL_FIELDS = new Set([
  'birthDateIsApproximate', 'sterilized', 'noDiscomfortObserved', 'isRetroactive', 'active',
  'protected', 'neededToStop', 'neededHelp', 'wantedToContinue', 'isFavorite', 'isConcern',
]);

export const NUMBER_FIELDS = new Set([
  'schemaVersion', 'overallState', 'currentWeightKg', 'targetWeightKg', 'order', 'versionNumber',
  'weightKg', 'bcsValue', 'durationMin', 'sizeBytes', 'durationSec',
]);

/** Colección de la API → hoja. */
export const COLLECTION_SHEET: Record<string, string> = {
  dog: SHEETS.dog,
  diagnoses: SHEETS.diagnoses,
  dailyLogs: SHEETS.dailyLogs,
  tasks: SHEETS.tasks,
  completions: SHEETS.completions,
  medications: SHEETS.medications,
  medicationVersions: SHEETS.medicationVersions,
  doses: SHEETS.doses,
  foods: SHEETS.foods,
  feedingPlan: SHEETS.feedingPlan,
  feedingLogs: SHEETS.feedingLogs,
  weights: SHEETS.weights,
  activities: SHEETS.activities,
  media: SHEETS.media,
  events: SHEETS.events,
  questions: SHEETS.questions,
  instructions: SHEETS.instructions,
  appointments: SHEETS.appointments,
  moments: SHEETS.moments,
};

export const ROOT_FOLDER_NAME = 'Dalila Care';
export const MAX_UPLOAD_BYTES = 250 * 1024 * 1024;
