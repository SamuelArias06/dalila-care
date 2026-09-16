# Dalila Care — Fase de descubrimiento

> Documento 1 de 9. Cubre los puntos **A, B, C, D** del encargo.
> Fecha: 2026-09-15 · Estado: propuesta para revisión.

---

## A. Visión del producto

**Dalila Care es el diario de cuidado de una perra concreta, no una app de salud para perros.**

La diferencia importa. Una app de salud para perros intenta ser genérica, completa y "correcta". Un diario de cuidado
intenta ser fiel a un animal específico y fácil de mantener un martes a las 6:40 de la mañana. Todo lo que sigue se
deriva de esa decisión.

La app existe para resolver un problema muy humano: **cuando llega la consulta veterinaria, la memoria falla.**
"Creo que la semana pasada estuvo peor", "no sé si fueron tres o cuatro días", "hubo un día que no quiso levantarse,
¿fue antes o después de cambiarle el alimento?". Dalila Care convierte esa niebla en observaciones fechadas, y
convierte esas observaciones en una conversación mejor con el veterinario. Ese es el valor central. Todo lo demás
—rutinas, recordatorios, gráficos— es infraestructura para que el registro diario ocurra de verdad.

Hay un segundo valor, menos obvio y probablemente más importante en el día a día: **reducir la carga mental de tu
novia.** Cuidar a un animal con dolor crónico es agotador sobre todo por la sensación de estar olvidando algo. La app
debe responder cada mañana a "¿qué toca hoy?" sin que ella tenga que recordarlo, y debe cerrar el día diciéndole,
con honestidad, que hizo lo que había que hacer.

Y un tercero, que es el que evita que el producto se vuelva deprimente: **Dalila no es su enfermedad.** La app guarda
también los días buenos, las fotos, el momento en que volvió a querer la pelota. Si dentro de un año esta app solo
contiene síntomas, habremos construido algo triste y ella dejará de abrirla.

### Lo que Dalila Care es

- Un registro diario rápido (30–60 s) con posibilidad de profundizar.
- Una rutina viva, que **ella** define y cambia cuando quiera.
- Un archivo de vídeos y fotos organizado por fecha y por intención ("caminando de frente", "levantándose").
- Un puente ordenado hacia el veterinario: qué pasó, cuándo, con qué frecuencia, y qué queremos preguntar.
- Un lugar donde queda registrado quién recomendó cada cosa (veterinario, fisioterapeuta, o ella misma).

### Lo que Dalila Care NO es, por diseño

- No interpreta, no diagnostica, no sugiere dosis, no ajusta tratamientos.
- No calcula un "índice de salud" ni un porcentaje de mejoría. (Ver [POLITICA_CONTENIDO_MEDICO.md](POLITICA_CONTENIDO_MEDICO.md).)
- No tiene rachas, ni penalizaciones, ni notificaciones que culpabilicen.
- No es un panel de administración. No hay tablas. No hay formularios de 40 campos.
- No es un producto para terceros (de momento): es para dos personas y una perra.

### Criterio de éxito

A los 30 días, tres señales:

1. Ella abre la app **sin que nadie se lo recuerde** la mayoría de los días.
2. El registro de un día normal le toma **menos de un minuto**.
3. En la siguiente consulta, **usa la app delante del veterinario** en vez de intentar recordar.

Si a los 30 días ella la abre por obligación, el producto falló aunque el código sea perfecto.

---

## B. User journey (día 0 → día 30)

### Día 0 — Primera apertura (objetivo: < 4 minutos, y que pueda saltarse casi todo)

Ella recibe un enlace por WhatsApp. Lo abre en Safari. Lo primero que ve **no** es un login corporativo: ve una
pantalla con espacio para la foto de Dalila y una frase corta.

1. **Instalación.** Antes que nada, una hoja inferior explica en 3 pasos con imágenes: Compartir → Añadir a pantalla
   de inicio. La app detecta si ya está instalada y no vuelve a mostrarlo. *(Sin esto no hay notificaciones, ni
   offline fiable, ni pantalla completa. Es el paso más importante del onboarding.)*
2. **Identificarse.** Un botón "Entrar con Google". Una sola vez. Sin contraseñas.
3. **Conocer a Dalila.** Cuatro pantallas de una pregunta cada una: nombre y foto → fecha de nacimiento (o edad
   aproximada) → peso actual (o "no lo sé ahora") → "¿qué te dijo el veterinario?" (campo libre + posibilidad de
   foto de la fórmula/informe).
   **Cada paso tiene "Ahora no".** El perfil se puede completar después; forzarlo aquí es la forma más rápida de
   perder a la usuaria.
4. **Rutina inicial.** No le pedimos que construya su rutina desde cero (es la peor tarea posible en el minuto 3).
   Le proponemos una rutina base editable: desayuno, agua, paseo suave, cena, check-in nocturno. Ella puede tocar
   cualquiera para cambiar hora, renombrar, eliminar o añadir. Si tiene medicación, un paso aparte y explícito
   ("¿Dalila toma algún medicamento recetado?") con la advertencia de que solo se registra lo que indicó el veterinario.
5. **Llegada a HOY.** La primera pantalla real que ve ya tiene contenido suyo. Nunca un estado vacío.

### Día 1 — Primer día completo

- **Mañana (~25 s).** Abre. "Buenos días ❤️ ¿Cómo amaneció Dalila?" → toca una carita. Marca desayuno y medicación
  con dos toques desde la misma pantalla. Cierra.
- **Durante el día.** Solo vuelve si pasa algo. Botón grande "➕ Registrar" siempre accesible.
- **Noche (~40 s).** La app muestra el **Resumen del día** ya rellenado con lo que marcó, y solo le pregunta lo que
  falta: ¿cómo estuvo la movilidad? ¿comió? ¿alguna molestia? Termina con una frase de cierre tranquila.

### Días 2–6 — Formación del hábito

El riesgo aquí es el abandono. Tácticas, todas de bajo coste:

- La app **nunca** empieza vacía: precarga las tareas del día y recuerda las respuestas de ayer como sugerencia
  ("ayer marcaste 'normal para ella'").
- Si un día no registra nada, al día siguiente **no la regaña**. Simplemente ofrece "¿quieres añadir algo de ayer?"
  y permite registrar en retroactivo (crítico: la vida real no ocurre dentro de la app).
- Día 3: primera pregunta guardada para el veterinario, sugerida por la app a partir de algo que ella escribió.

### Días 7–14 — La app empieza a devolver valor

- Día 7: aparece por primera vez **"Así estuvo esta semana"** — descriptivo, sin juicio: *"Registraste 5 días. En 2 de
  ellos anotaste que le costó levantarse."* Nada más. Sin flechas rojas, sin porcentajes.
- Aquí es cuando probablemente grabe su primer vídeo, porque ya tiene la intuición de que "esto sirve para la consulta".
  La app lo propone una sola vez, en el contexto adecuado (tras registrar un día con dificultad de movilidad):
  *"¿Quieres grabar 15 segundos de cómo camina hoy? Puede ayudar al veterinario a comparar más adelante."*

### Días 15–29 — Vida real

- Cambia el concentrado → actualiza alimentación. Los registros de septiembre **siguen diciendo el alimento anterior**.
- El veterinario cambia una dosis → registra la nueva indicación. El histórico queda intacto y fechado.
- Un mal día → botón "Me preocupa algo" → registra, la app le muestra orientación segura y, si aplica, le dice
  claramente que esto merece llamada al veterinario.
- Acumula 3 preguntas en "Preguntar en la próxima consulta".

### Día 30 — El momento de la verdad

Antes de la cita abre **Preparar consulta**. En una pantalla:

- Datos de Dalila, diagnósticos, medicación actual con fechas.
- "Del 1 al 30 de septiembre: 18 días registrados. 11 clasificados como bien, 5 regular, 2 mal."
- "En 6 días anotaste dificultad para levantarse; 4 de ellos en la última semana."
- Peso: 33.2 → 32.8 kg.
- 4 vídeos seleccionables.
- 3 preguntas pendientes.

Lo comparte o lo enseña desde el móvil. **Ese día la app se justifica sola**, y a partir de ahí el registro diario
deja de sentirse como una obligación.

---

## C. Arquitectura de información

### Navegación principal

Barra inferior fija de **4 destinos**, más un botón de acción central. No más de cuatro: en una app de uso diario y con
una sola mano, cada pestaña extra reduce el uso de todas las demás.

```
┌──────────────────────────────────────────────┐
│                                              │
│                  CONTENIDO                   │
│                                              │
├──────────────────────────────────────────────┤
│   🏠        📅        ➕       ❤️       🐾    │
│  Hoy    Historial  Registrar Momentos  Dalila│
└──────────────────────────────────────────────┘
```

- **Hoy** — el 80 % del uso. Estado del día + rutina + accesos rápidos.
- **Historial** — línea de tiempo por día; desde aquí se entra a Tendencias y a Preparar consulta.
- **➕ Registrar** — acción, no pestaña. Abre una hoja con las 6 acciones más comunes.
- **Momentos** — fotos y vídeos bonitos. Deliberadamente separado de lo clínico.
- **Dalila** — perfil, salud, plan, ajustes. Todo lo que se configura poco y se consulta a veces.

### Mapa completo

```
Hoy
├── Cabecera: foto + saludo + "¿Cómo amaneció?" (si no hay check-in matinal)
├── Estado del día (editable todo el día)
├── Rutina de hoy  ─────────────────► Editar rutinas
│     └── [tarea] ─► marcar / posponer / nota / omitir con motivo
├── Atajos: 📹 Vídeo · 📝 Nota · ⚠️ Me preocupa algo
└── (de noche) Resumen "Hoy con Dalila" ─► Check-in nocturno

➕ Registrar  (hoja modal)
├── Estado / cómo está ahora
├── Comida
├── Medicamento
├── Paseo o actividad
├── Pipí / popó
├── Vídeo o foto
├── Nota libre
└── ⚠️ Me preocupa algo ─► Registro de preocupación
                            └── Orientación segura ─► ¿Llamar al veterinario? ─► Guardar como pregunta

Historial
├── Línea de tiempo (día a día, scroll infinito)
│     └── Detalle del día ─► editar cualquier registro
├── Tendencias  (estado · movilidad · apetito · peso · actividad · adherencia)
├── Eventos y preocupaciones (filtro)
└── 🩺 Preparar consulta
      ├── Rango de fechas
      ├── Qué incluir (secciones activables)
      ├── Seleccionar vídeos
      ├── Preguntas pendientes
      └── Vista de resumen ─► Compartir / Imprimir / PDF

Momentos ❤️
├── Galería (fotos + vídeos marcados como "momento")
├── Añadir momento (foto + frase)
└── "Un día como hoy" (recuerdos del año anterior, cuando haya datos)

Dalila
├── Perfil (datos, foto, edad, contacto de emergencia)
├── Salud
│     ├── Diagnósticos
│     ├── Peso y condición corporal
│     ├── Alergias / intolerancias
│     └── Documentos (fórmulas, exámenes, radiografías)
├── Medicamentos y tratamientos
│     ├── Activos  ─► detalle · historial de tomas · marcar suspendido por indicación vet.
│     ├── Histórico (inactivos, con fechas)
│     └── Tratamientos no farmacológicos (fisio, láser, hidroterapia…)
├── Alimentación
│     ├── Plan actual (principal + complementos)
│     ├── Catálogo de alimentos (propios + base segura)
│     └── Historial de tolerancia
├── Rutinas
│     └── Mañana / Mediodía / Tarde / Noche ─► crear, editar, reordenar, pausar
├── Plan veterinario
│     ├── Indicaciones (fecha, vet, tipo, texto, adjuntos)
│     └── Preguntas para la próxima consulta
├── Citas y calendario
├── Aprender  (contenido educativo con fuentes)  [V2]
└── Ajustes
      ├── Cuenta y acceso
      ├── Recordatorios
      ├── Exportar datos
      └── Diagnóstico técnico  (oculto; solo para ti)
```

### Reglas de navegación

- **Máximo 3 toques** desde Hoy hasta cualquier acción de registro.
- Todo lo destructivo es reversible (borrado suave + "deshacer" durante 10 s).
- Nada obliga a completar un formulario: guardar parcialmente siempre es válido.
- Los detalles avanzados viven detrás de "Añadir detalle", nunca en la primera pantalla.

---

## D. Alcance: V1 / V1.1 / V2

Criterio para entrar en V1: **¿se usa a diario y el producto carece de sentido sin ello?** Todo lo demás espera.

### V1 — El hábito (lo único que importa al principio)

| Módulo | Por qué es V1 |
|---|---|
| PWA instalable + offline + sync | Sin esto no es una app, es una web. Es la base técnica de todo lo demás. |
| Acceso privado (Google) | Requisito no negociable de privacidad. |
| Perfil de Dalila (mínimo) | Da identidad emocional y contexto a todo el resto. |
| **Pantalla Hoy** | Es el producto. |
| **Rutinas editables + completar tareas** | Responde "¿qué toca hoy?", que es la carga mental principal. |
| **Check-in diario** (mañana y noche) | Es la materia prima de todo lo demás. |
| **Medicamentos + registro de tomas** | Lo de mayor consecuencia real si se olvida. |
| Notas y eventos + **"Me preocupa algo"** | Captura lo que no cabe en un formulario; es la válvula de escape. |
| **Preguntas para el veterinario** | Coste de implementación ínfimo, valor altísimo. Es una lista. |
| Historial (línea de tiempo simple) | Para que registrar se sienta acumulativo desde el día 2. |
| Resumen nocturno "Hoy con Dalila" | Es solo renderizar datos que ya tenemos, y es el cierre emocional del día. |
| Resumen de consulta **en texto compartible** | Versión barata del reporte bonito. Si hay cita antes de V1.1, salva la situación. |

**Fuera de V1, a propósito:** vídeos, alimentación completa, peso/BCS, gráficos, PDF, recordatorios, módulo educativo.

### V1.1 — El valor para la consulta (2–4 semanas después)

| Módulo | Por qué aquí y no antes |
|---|---|
| **Vídeos y fotos → Drive** | Es la pieza técnicamente más arriesgada (ver [ARCHITECTURE.md](ARCHITECTURE.md#g-vídeos)). No debe bloquear el lanzamiento. |
| **Momentos felices ❤️** | Llega con las fotos; es el contrapeso emocional. |
| **Alimentación** (plan + catálogo + tolerancia) | Importante, pero cambia poco día a día. En V1 basta una tarea "Desayuno". |
| **Peso y condición corporal** | Se registra cada 2–4 semanas, no a diario. |
| **Preparar consulta + reporte imprimible / PDF** | Necesita datos acumulados para tener sentido. |
| **Plan veterinario** (indicaciones → tareas) | Depende de tener el módulo de rutinas maduro. |
| Recordatorios vía Google Calendar | Ver [ARCHITECTURE.md](ARCHITECTURE.md#recordatorios-y-notificaciones). |
| Tendencias (gráficos simples) | Necesita ≥3 semanas de datos para no mentir. |

### V2 — Lo que mejora una app que ya funciona

- **Web Push real** (requiere trabajo criptográfico no trivial en Apps Script; ver análisis F).
- **Aprender**: módulo educativo con fuentes citadas y niveles de evidencia.
- **Tratamientos y terapias** (fisio, hidroterapia, láser) como módulo propio con seguimiento.
- Calendario completo y citas con integración opcional a Google Calendar bidireccional.
- Exportación completa CSV/JSON y backups automáticos verificados.
- Pantalla de diagnóstico/admin para ti.
- "Un día como hoy" y recuerdos.
- Segundo cuidador con permisos diferenciados.

### Lo que cambiaría de tu lista inicial, y por qué

Tu intuición era buena. Tres ajustes:

1. **Subiría "Preguntas para el veterinario" a V1.** Lo pusiste en el nº 15 del documento y ni siquiera en el MVP,
   pero es una lista de texto: medio día de trabajo y es, junto con el check-in, lo que más va a cambiar la calidad
   de las consultas. Es el mejor ratio valor/coste de todo el proyecto.
2. **Bajaría "Vídeos" y "Alimentación" a V1.1.** Los pusiste en el MVP. Vídeos es el módulo con más riesgo técnico
   (subida desde iPhone, Drive, offline, reproducción privada) y alimentación es el que más pantallas necesita para
   un beneficio que se nota a las semanas, no a los días. Si los metemos en V1, V1 no sale en un mes.
3. **Añadiría el resumen nocturno a V1** (tu punto 55). Lo planteaste como "una idea a explorar" y creo que es de las
   mejores del documento: es casi gratis de implementar —solo muestra datos ya registrados— y es lo que convierte
   el registro en un ritual en lugar de una tarea. Es el cierre emocional que hace que vuelva mañana.

Y una cosa que **no** cambiaría: tienes razón en que la personalización total (punto 26) no es una función, es una
restricción de diseño. Está incorporada al modelo de datos desde V1 (todo catálogo es editable, nada está hardcodeado).
