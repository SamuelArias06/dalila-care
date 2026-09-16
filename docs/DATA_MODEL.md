# Modelo de datos

> Documento 3 de 9. Cubre **H**. Propuesta para revisión: **todavía no se ha creado ninguna hoja.**

---

## Principios

1. **Nunca la fila como identificador.** Cada registro tiene un `id` inmutable generado en el cliente.
2. **El pasado no cambia.** Editar un medicamento o un alimento crea una versión nueva; los registros históricos
   apuntan a la versión que estaba vigente y además guardan una copia del texto relevante.
3. **Nada se borra de verdad.** `deletedAt` marca; el dato sigue ahí.
4. **Todo catálogo es editable por la usuaria.** No hay listas cerradas en el código.
5. **El día local es un campo propio.** Toda entidad diaria guarda `localDate` (`YYYY-MM-DD`) además del timestamp.
6. **El esquema puede crecer sin romper lo viejo.** `schemaVersion` por fila.

### Identificadores

Formato `prefijo_ULID`: `dlg_01JBX7M2K9QZ8F4TVN3RPYHW6C`

**ULID** en vez de UUID porque es ordenable por tiempo de creación (los registros salen de la hoja ya casi ordenados),
es más corto, y se genera en el cliente — lo que permite que **reintentar una operación sea idempotente**: si la red
falló pero el servidor sí escribió, el reintento llega con el mismo `id` y se convierte en un `update` sin efecto en
lugar de crear un duplicado.

Prefijos: `dog_ dlg_ tsk_ tcp_ med_ mdv_ dos_ fdi_ fpi_ flg_ trt_ trl_ wgt_ med_ mda_ evt_ vtq_ vti_ apt_ mom_ shr_`

### Campos comunes (todas las entidades)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | `prefijo_ULID`, inmutable |
| `schemaVersion` | number | versión del esquema de **esa fila** |
| `createdAt` | ISO 8601 con offset | `2026-09-15T08:12:03-05:00` |
| `updatedAt` | ISO 8601 con offset | |
| `createdBy` | string | email o alias del actor |
| `deletedAt` | ISO 8601 \| vacío | borrado suave |

> **Sobre el tiempo:** todo se guarda con offset explícito. El error clásico —guardar UTC y luego preguntar "¿qué pasó
> el día 15?"— hace que un registro de las 22:00 en Bogotá aparezca como del día 16. Por eso `localDate` es un campo
> real y no algo que se calcula al leer.

---

## Entidades

### Núcleo

#### `Dog`
Una sola fila hoy, tabla por si algún día hay otra mascota.

```
id, name, photoMediaId, breed, birthDate, birthDateIsApproximate, sex, sterilized,
microchip, vetName, vetClinic, vetPhone, emergencyPhone, emergencyClinicName,
targetWeightKg, targetWeightSetBy, targetWeightSetOn, notes, timezone
```

#### `Diagnosis`
Separado de `Dog` porque hay varios, con fechas y con quién lo hizo. Esto es clave para no asumir que todo viene de la
espondilosis (ver [VET_RESEARCH.md](VET_RESEARCH.md)).

```
id, dogId, name, diagnosedOn, diagnosedBy, clinic, status(activo|resuelto|en_estudio),
confirmationMethod(radiografía|resonancia|examen_clínico|presuntivo|otro), notes, mediaIds[]
```

#### `Settings`
Clave/valor. `theme`, `remindersEnabled`, `lastBackupAt`, `onboardingCompleted`, `installPromptDismissedAt`…

---

### Registro diario

#### `DailyLog` — **una fila por día**
El corazón de la app. Se hace *upsert* por `localDate`.

```
id, dogId, localDate,
  morningCheckAt, eveningCheckAt,
  overallState(1..5 | vacío),             ← 😄🙂😐😟😣
  mobility(mejor|normal_para_ella|algo_peor|bastante_peor|vacío),
  mobilitySigns[]                          ← ids del catálogo
  discomfortSigns[]                        ← ids del catálogo (NUNCA "nivel de dolor")
  appetite(normal|menos|mas|rechazo|vacío),
  water(normal|menos|mas|no_se|vacío),
  urine(normal|diferente|dificultad|accidente|no_hizo|vacío),
  urineNote,
  stoolConsistency(normal|blandas|diarrea|duras|no_hizo|vacío),
  stoolFlags[]                             ← sangre_visible, moco, esfuerzo…
  stoolNote,
  sleep(bien|despertares|inquieta|cambios_postura|vacío),
  mood[]                                   ← alegre, tranquila, apagada, irritable, busca_compañía, se_aísla
  note,
  weatherNote,                             ← opcional: frío/lluvia, que a veces se correlaciona
  isRetroactive                            ← true si se rellenó días después
```

> **Decisión:** los signos van como **array de ids de catálogo en una sola celda JSON**, no como tabla relacional.
> Con este volumen, una tabla `DailyLogSign` añadiría una lectura y complejidad sin ningún beneficio. Se puede
> normalizar más adelante sin migrar datos (el array sigue siendo la fuente).

#### `SignCatalog` — catálogo editable de observaciones
Precargado con signos veterinariamente razonables (ver [VET_RESEARCH.md](VET_RESEARCH.md)), **ampliable por ella**.

```
id, group(movilidad|incomodidad|ánimo|digestivo|otro), label, emoji, order,
active, isBuiltIn, createdBy, notesForCaregiver
```

---

### Rutinas

#### `RoutineTask` — la plantilla
```
id, dogId, title, emoji, timeOfDay(mañana|mediodía|tarde|noche), scheduledTime,
  daysOfWeek[]                             ← [1..7], vacío = todos
  frequency(diaria|dias_especificos|cada_n_dias|a_demanda), everyNDays,
  category(comida|medicación|actividad|higiene|terapia|otro),
  linkedMedicationId, linkedFeedingPlanItemId,
  recommendedBy(veterinario|fisioterapeuta|cuidadora|otro), recommendedByName,
  vetInstructionId,                        ← si nació de una indicación veterinaria
  order, active, pausedUntil, protected     ← protected = viene de receta; avisa antes de eliminar
```

#### `TaskCompletion` — **inmutable**
```
id, taskId, localDate, status(hecha|omitida|pospuesta), completedAt, note,
  skipReason, titleSnapshot, scheduledTimeSnapshot
```

`titleSnapshot` es lo que hace que un registro de "Paseo 10 min" de septiembre **siga diciendo eso** aunque hoy la
tarea se llame "Paseo 20 min".

---

### Medicamentos — el módulo con versionado estricto

Este es el punto 46 de tu encargo. La solución es separar la **identidad** del medicamento de su **prescripción vigente**.

#### `Medication` — la identidad (rara vez cambia)
```
id, dogId, name, activeIngredient, presentation, reason,
  prescribedBy, clinic, startedOn, endedOn, endedReason, status(activo|suspendido|finalizado),
  notes
```

#### `MedicationVersion` — la prescripción, con vigencia
```
id, medicationId, versionNumber,
  doseText,                                ← texto tal cual lo indicó el veterinario. NUNCA calculado.
  frequencyText, timesOfDay[], withFood(con|sin|indiferente),
  effectiveFrom, effectiveTo,              ← effectiveTo vacío = vigente
  changedBy, changeReason, prescribedBy, vetInstructionId
```

Cambiar la dosis **no edita nada**: cierra la versión vigente (`effectiveTo = hoy`) y crea la siguiente. El historial
de septiembre sigue mostrando la dosis de septiembre.

#### `MedicationDose` — cada toma
```
id, medicationId, medicationVersionId, localDate, scheduledAt, administeredAt,
  status(administrado|omitido|administrado_tarde|posible_reacción|pendiente),
  reactionNote, note,
  medicationNameSnapshot, doseTextSnapshot   ← doble seguro
```

> **Regla de seguridad grabada en el modelo:** no existe ningún campo numérico `doseMg` que la app pueda multiplicar,
> comparar o ajustar. La dosis es **texto libre copiado de la indicación veterinaria**. Es deliberado: un número
> invita a hacer aritmética con él, y esta app no debe hacer aritmética con dosis jamás.

#### `Treatment` / `TreatmentSession` — terapias no farmacológicas
```
Treatment:        id, dogId, type(fisioterapia|hidroterapia|láser|masaje|acupuntura|suplemento|otro),
                  name, prescribedBy, clinic, goal, frequencyText, startedOn, endedOn, status, notes
TreatmentSession: id, treatmentId, localDate, performedAt, durationMin, performedBy,
                  howSheTookIt(bien|regular|mal), note, nameSnapshot
```

---

### Alimentación — mismo patrón de versionado

#### `FoodItem` — catálogo
```
id, name, type(principal|complemento|premio|suplemento|otro), brand, form(seco|húmedo|casero|fresco),
  safetyNote, sourceOfSafetyNote,          ← p. ej. "ASPCA: tóxico para perros"
  isBuiltIn, active, createdBy, notes
```

Se precarga con una **lista de alimentos peligrosos marcados** (uvas/pasas, xilitol, chocolate, cebolla/ajo,
macadamia, alcohol, aguacate…) para que si ella escribe "uvas" la app pueda avisar **antes**, citando la fuente. No
para prohibir: para informar.

#### `FeedingPlanItem` — el plan vigente
```
id, dogId, foodId, amountText, timesOfDay[], frequency,
  purpose,                                 ← "por qué se lo doy"
  recommendedBy(veterinario|nutricionista|cuidadora|otro), recommendedByName,
  effectiveFrom, effectiveTo, active, notes, vetInstructionId
```

#### `FeedingLog`
```
id, localDate, feedingPlanItemId, foodId, timeOfDay, offeredAt,
  result(comió|comió_parcial|rechazó), approxPercentEaten,
  reaction(ninguna|vómito|diarrea|picor|decaimiento|otro), reactionNote,
  foodNameSnapshot, amountTextSnapshot
```

Con esto, "¿cómo le sentó la sardina?" se responde con datos: 14 registros, 1 con reacción. **Descriptivo, sin
concluir causalidad** (ver política de contenido médico).

---

### Peso y condición corporal

#### `WeightEntry`
```
id, dogId, localDate, weightKg, measuredAt(casa|clínica|otro), scaleNote, note
```

#### `BodyConditionEntry`
```
id, dogId, localDate, bcsValue(1..9), scale(WSAVA_9|otra), assessedBy(veterinario|cuidadora),
  assessorName, muscleConditionScore, note, mediaIds[]
```

> La app **nunca calcula ni estima** el BCS, ni dice "Dalila está obesa". Solo almacena lo que alguien registró, junto
> con **quién** lo registró. Si lo puso ella, la app lo muestra como observación propia, no como valoración clínica.

---

### Actividad

#### `ActivityLog`
```
id, localDate, type(paseo|juego|ejercicio_terapéutico|otro), startedAt, durationMin,
  surface(pasto|asfalto|piso_liso|arena|mixto), intensity(muy_suave|suave|moderada),
  startedHow(bien|rígida|con_dificultad), endedHow(bien|cansada|cojeando|con_dificultad),
  neededToStop, neededHelp, wantedToContinue, note, taskId
```

---

### Media y documentos

#### `MediaItem` — **una sola entidad para vídeos, fotos y documentos**
Unificar evita tres módulos que hacen lo mismo.

```
id, kind(video|foto|documento),
  purpose(seguimiento|momento|documento_clínico),
  category,                                ← caminar_frente | caminar_lado | caminar_atras |
                                             levantarse | sentarse | episodio | libre |
                                             fórmula | examen | radiografía | informe
  driveFileId, posterDriveFileId, fileName, mimeType, sizeBytes, durationSec, width, height,
  capturedAt, localDate, note, tags[],
  uploadState(pendiente|subiendo|subido|error), uploadError, localBlobKey,
  linkedEventId, linkedDiagnosisId, linkedVetInstructionId,
  isFavorite                               ← para Momentos ❤️
```

`purpose` es lo que separa "vídeo clínico de la marcha" de "foto de Dalila durmiendo al sol". La galería de **Momentos**
filtra por `purpose = momento OR isFavorite`, y nunca mezcla lo uno con lo otro sin querer.

#### `Share`
```
id, mediaIds[], sharedWithEmail, shareType(email|enlace), drivePermissionIds[],
  createdAt, revokedAt, purpose, appointmentId
```

---

### Eventos y preocupaciones

#### `Event`
```
id, localDate, occurredAt, type(preocupación|episodio|cambio|nota|hito),
  category,                                ← no_quiere_levantarse | camina_diferente |
                                             incomodidad_marcada | no_come | vómito | diarrea |
                                             problema_urinario | caída | comportamiento_extraño | otro
  severityFelt(leve|moderado|fuerte),      ← percepción de la cuidadora, explícitamente subjetiva
  description, durationNote, whatHelped, whatSeemedWorse,
  triageLevel(observar|consultar_pronto|contactar_hoy|urgencia),  ← qué le mostró la app
  triageRuleId, triageShownAt, actionTaken(llamé|fui|observé|nada), outcomeNote,
  mediaIds[], createdVetQuestionId
```

Guardar `triageLevel` y `triageRuleId` permite auditar después si la orientación que dio la app fue adecuada — y
corregir la regla si no lo fue.

---

### Veterinario

#### `VetQuestion`
```
id, text, createdAt, context,              ← qué estaba mirando cuando se le ocurrió
  status(pendiente|hecha|respondida|ya_no_aplica),
  appointmentId, answeredAt, answerText, answeredBy, priority, relatedMediaIds[]
```

#### `VetInstruction` — el plan veterinario
```
id, date, vetName, clinic, type(medicación|actividad|alimentación|rehabilitación|estudio|seguimiento|otro),
  instructionText, rationale, reviewDate, status(vigente|cumplida|suspendida|reemplazada),
  supersededByInstructionId, mediaIds[],
  derivedTaskIds[], derivedMedicationId, derivedFeedingPlanItemIds[]
```

La indicación es **la fuente**; las tareas, medicamentos y alimentos que se creen a partir de ella guardan el enlace.
Así la app puede responder "¿por qué hacemos esto?" con "porque el 12 de agosto la Dra. X indicó…" en lugar de con
nada.

#### `Appointment`
```
id, dateTime, vetName, clinic, reason, type(control|urgencia|terapia|estudio|otro),
  status(programada|realizada|cancelada), preparationId, summaryNote, followUpDate, mediaIds[]
```

#### `ConsultPrep` — el "Preparar consulta" guardado
```
id, appointmentId, rangeFrom, rangeTo, includedSections[], selectedMediaIds[],
  selectedQuestionIds[], generatedAt, exportedDriveFileId, notes
```

---

### Momentos y sistema

#### `Moment`
```
id, localDate, text, mediaIds[], tags[]
```

#### `AuditLog` — append-only, para diagnóstico
```
id, at, actor, action, entity, entityId, clientRequestId, ipHashOrDevice, result, errorCode
```

Sin datos sensibles en los mensajes (ver [SECURITY.md](SECURITY.md)).

---

## Relaciones

```
Dog ─┬─ Diagnosis
     ├─ DailyLog ─── (signos) ──► SignCatalog
     ├─ RoutineTask ──► TaskCompletion            (snapshot del título)
     ├─ Medication ──► MedicationVersion ──► MedicationDose
     ├─ Treatment  ──► TreatmentSession
     ├─ FoodItem ◄── FeedingPlanItem ──► FeedingLog
     ├─ WeightEntry / BodyConditionEntry
     ├─ ActivityLog
     ├─ Event ──► MediaItem, VetQuestion
     ├─ MediaItem ──► Share
     ├─ VetInstruction ──┬─► RoutineTask
     │                   ├─► Medication
     │                   └─► FeedingPlanItem
     ├─ VetQuestion ──► Appointment
     └─ Moment ──► MediaItem
```

---

## Versionado del esquema y migraciones (punto 40)

Estrategia deliberadamente simple, para dos usuarias y un backend de un archivo:

1. **Cada fila lleva su `schemaVersion`.** No hay una versión global de la base de datos.
2. **Las columnas se leen por nombre de cabecera, nunca por posición.** Añadir una columna no rompe nada, y el orden
   en la hoja puede cambiarse a mano sin consecuencias.
3. **Migración perezosa en lectura.** `packages/shared/migrations.ts` contiene funciones puras:
   ```ts
   const migrations: Record<number, (row: any) => any> = {
     1: (r) => ({ ...r, mood: r.mood ?? [] }),          // v1 → v2
     2: (r) => ({ ...r, stoolFlags: splitFlags(r) }),   // v2 → v3
   };
   ```
   Al leer una fila con `schemaVersion < actual`, se aplican en cadena las migraciones que falten. La fila se
   reescribe con la versión nueva solo cuando se edite por otro motivo. **Nunca hay una migración masiva que pueda
   fallar a mitad.**
4. Estas funciones son puras → **se testean con Vitest sin tocar Google** (punto 50).
5. Regla de oro: **solo se añaden campos; nunca se renombra ni se reutiliza un nombre existente.** Un campo que deja
   de usarse se deja en la hoja marcado como obsoleto en el código.

## Backups (punto 41)

- **Diario, automático:** un trigger de Apps Script exporta todas las hojas a un JSON con fecha en
  `Dalila Care/Exportaciones/`, y conserva los últimos 30 días + el día 1 de cada mes indefinidamente.
- **Semanal:** copia completa del propio archivo de Sheets (`makeCopy`), que también sirve como punto de restauración
  de un solo clic.
- **Verificación:** cada backup registra número de filas por entidad; si un backup tiene menos filas que el anterior
  sin que se hayan borrado datos, se registra una alerta visible en la pantalla de diagnóstico.
- **Manual:** botón "Exportar mis datos" en Ajustes → ZIP con JSON + CSV por entidad. Ella nunca queda encerrada
  (punto 42).
- Drive tiene su propia papelera de 30 días como red adicional.
