# Roadmap técnico

> Documento 9 de 9. Cubre **M** y los puntos 49–51.

---

## Reglas de los sprints

1. **Cada sprint termina con algo que funciona y se puede usar de verdad.** Nada de crear veinte archivos vacíos.
2. **Cada sprint termina con tests en verde y un commit desplegable.**
3. **Una funcionalidad terminada antes de empezar la siguiente.**
4. Al final de cada sprint hay una **demo real en el iPhone de ella** — no en Chrome de escritorio. La mitad de los
   problemas de este proyecto solo aparecen en iOS.
5. Si un sprint se alarga, se recorta el alcance del sprint, no la calidad.

Las estimaciones son en **sesiones de trabajo** (una sesión ≈ media jornada enfocada), no en días de calendario.

---

## Sprint 0 — Suelo firme *(2 sesiones)*

**Objetivo:** que exista un repositorio del que salga un despliegue real, aunque no haga nada.

- Monorepo con workspaces npm: `apps/web`, `apps/api`, `packages/shared`.
- TypeScript configurado en los tres paquetes, ESLint + Prettier, Vitest.
- `apps/api` con `clasp` 3, build con esbuild, `doGet` devolviendo `{ ok: true, version }`.
- Dos despliegues de Apps Script (`DEV`, `PROD`) con sus `PropertiesService` respectivas.
- `apps/web` con Vite + Preact, una pantalla que llama al backend y muestra la versión.
- GitHub Action: lint + typecheck + test en cada push.
- `README.md` con el setup completo.

**Hecho cuando:** `npm run deploy:api:dev` despliega, y una página en local muestra la versión que devuelve el backend.

**Riesgo a despejar aquí:** el CORS de Apps Script. Es el primer sitio donde puede torcerse todo. Si la llamada
`fetch` con `text/plain` desde otro origen no funciona, **hay que saberlo el primer día**, no en el sprint 6.

---

## Sprint 1 — Identidad y datos *(2 sesiones)*

**Objetivo:** que solo entre quien debe, y que escribir en Sheets sea sólido.

- "Entrar con Google" (GIS) en el frontend.
- Verificación de ID token + lista blanca + token de sesión HMAC en el backend.
- Script `bootstrap`: crea la hoja con todas sus pestañas y cabeceras, y el árbol de carpetas de Drive.
- Capa `repo/`: lectura y escritura por nombre de cabecera, `LockService`, idempotencia por `clientRequestId`,
  borrado suave, `schemaVersion`.
- `packages/shared`: tipos, ULID, fechas locales, esquemas de validación, migraciones — **con tests**.
- Formato de error unificado con `userMessage` en español.

**Hecho cuando:** una petición autenticada crea y lee un registro; una petición sin token es rechazada; los tests de
`shared` pasan.

---

## Sprint 2 — PWA de verdad *(2 sesiones)*

**Objetivo:** que se instale en el iPhone y funcione sin conexión. **Este sprint es el que decide si el proyecto es
una app o una web.**

- `manifest.webmanifest`, iconos e imágenes de arranque generados desde un SVG.
- Service worker: app shell precacheado, estrategia stale-while-revalidate, actualización con aviso discreto.
- IndexedDB + outbox + motor de sincronización (apertura, `visibilitychange`, `online`, reintentos con backoff).
- Indicador de estado de sincronización.
- Safe areas, tema claro/oscuro, `reduced-motion`, tamaños táctiles, sin zoom en inputs.
- Shell de navegación con las 4 pestañas.
- Despliegue a GitHub Pages con dominio propio.

**Hecho cuando:** la app está instalada en su iPhone, se abre en pantalla completa, arranca en modo avión, guarda algo
sin conexión y lo sincroniza al volver la red.

---

## Sprint 3 — Perfil de Dalila *(1–2 sesiones)*

- Onboarding de 4 pasos, todos saltables.
- Perfil: datos, foto, edad calculada, diagnósticos, contactos de emergencia.
- Subida de **una sola foto** (caso sencillo de Drive, sin reanudación) → sirve de ensayo general para el sprint de
  vídeos.
- Ajustes básicos.

**Hecho cuando:** ella completa el onboarding sola, desde su móvil, sin que nadie le explique nada.

---

## Sprint 4 — HOY y rutinas *(3 sesiones — el sprint más grande)*

- Pantalla Hoy completa, con sus tres estados (mañana / en progreso / noche).
- Estado general con un toque.
- Rutinas: crear, editar, reordenar, pausar, eliminar, días de la semana, horarios.
- Completar tareas, posponer, omitir con motivo, notas.
- `TaskCompletion` con snapshots.
- Rutina base precargada y editable.
- Microinteracciones: check animado, "rutina completa hoy".

**Hecho cuando:** ella usa la app un día entero de verdad y no necesita preguntar nada.

---

## Sprint 5 — Check-in y medicamentos *(3 sesiones)*

- Check-in diario completo con catálogo de signos editable.
- Catálogo precargado según [VET_RESEARCH.md](VET_RESEARCH.md).
- Medicamentos con versionado (`Medication` + `MedicationVersion`).
- Registro de tomas con los cuatro estados.
- Textos de seguridad fijos y advertencia de analgésicos humanos.
- Resumen nocturno "Hoy con Dalila".

**Hecho cuando:** un check-in completo se hace en menos de 60 segundos, cronometrado en su móvil.

---

## Sprint 6 — Registro rápido, eventos y preocupaciones *(2 sesiones)*

- Hoja "➕ Registrar" con las nueve acciones rápidas.
- Notas y eventos.
- Flujo completo de "Me preocupa algo" con el motor de reglas de [RED_FLAGS.md](RED_FLAGS.md).
- Reglas como datos, **con tests unitarios de cada una**.
- Preguntas para el veterinario (CRUD + marcar respondida + guardar respuesta).
- Registro rápido de comida, agua, orina, heces, paseo, peso.

**Hecho cuando:** todas las reglas rojas y naranjas tienen un test que demuestra que disparan, y ninguna dispara de
más.

---

## Sprint 7 — Historial y cierre de V1 *(2 sesiones)*

- Línea de tiempo por días con scroll infinito.
- Detalle del día, editable.
- Registro retroactivo.
- Resumen de consulta **en texto compartible** (versión barata, vía Web Share API).
- Pulido: mensajes de error, estados vacíos, accesibilidad, rendimiento.
- Pantalla de diagnóstico para `admin`.
- **Prueba de restauración de backup.**

**🎉 Fin de V1.** Total ≈ **17–18 sesiones**.

> **Sugerencia de proceso:** aquí conviene parar dos semanas y **solo usarla**. Los cambios que pida el uso real van
> a ser más valiosos que cualquier cosa de la lista de V1.1. Es el momento de mayor retorno de todo el proyecto.

---

## Sprint 8 — Prueba técnica de vídeo *(1 sesión — solo experimento)*

**No se escribe interfaz en este sprint.** Se resuelven las incógnitas:

- ¿Funciona la sesión de subida reanudable creada por el backend y consumida desde el navegador?
- ¿Hace falta la cabecera `Authorization` en los trozos siguientes? Si sí → plan B con token `drive.file`.
- ¿Cómo se comporta `<input capture>` en iOS instalado como app? ¿Qué tamaño real tiene un clip de 15 s?
- ¿Funciona generar el póster con canvas desde un vídeo en iOS?
- ¿Cuánto tarda en descargarse y reproducirse un clip con token?

**Hecho cuando:** hay un `docs/SPIKE_VIDEO.md` con resultados medidos y una decisión. Si algo no funciona, **se decide
aquí**, no a mitad del sprint siguiente.

---

## Sprint 9–10 — Vídeos y momentos *(3–4 sesiones)*

- Captura, póster, cola de subida offline con estado "pendiente".
- Línea de tiempo visual por meses.
- Reproducción privada.
- Categorías de vídeo y guía breve de grabación.
- Momentos ❤️ (fotos + frase), separados de lo clínico.
- Compartir con el veterinario (por correo, revocable, registrado).

---

## Sprint 11 — Alimentación y peso *(2–3 sesiones)*

- Catálogo de alimentos, con la lista de alimentos peligrosos precargada y sus avisos con fuente.
- Plan alimenticio con vigencia (`effectiveFrom`/`effectiveTo`).
- Registro de comidas y tolerancia.
- Peso y BCS registrado por el veterinario.

---

## Sprint 12 — Preparar consulta y reporte *(2–3 sesiones)*

- Plan veterinario (indicaciones → tareas / medicamentos / alimentos).
- Pantalla "Preparar consulta".
- Reporte imprimible ([REPORTE_VETERINARIO.md](REPORTE_VETERINARIO.md)) y exportación a PDF.
- Tendencias con gráficos SVG.

---

## Sprint 13 — Recordatorios *(1–2 sesiones)*

- Calendario "Dalila Care" gestionado por Apps Script.
- Sincronización de rutinas y medicación como eventos recurrentes con alerta.
- Citas veterinarias.
- Ajustes de recordatorios.

**🎉 Fin de V1.1.**

---

## Más adelante (V2)

Web Push con VAPID · módulo "Aprender" · tratamientos y terapias · exportación completa CSV/JSON · "Un día como hoy" ·
segundo cuidador con permisos diferenciados.

---

## Estrategia de pruebas (punto 50)

El problema conocido: **Apps Script es difícil de testear**. La solución es no intentar testearlo.

```
packages/shared/     ← ~80 % de los tests viven aquí. Funciones puras, Vitest, rápido.
     · validación de esquemas
     · migraciones
     · reglas de alarma      ← cada regla, con casos que disparan y que no
     · cálculo de resúmenes y tendencias
     · fechas locales y zonas horarias   ← la fuente clásica de bugs
     · generación y orden de ULIDs

apps/web/            ← tests del motor de sincronización con un backend simulado
     · la cola no pierde nada
     · un reintento no duplica
     · un conflicto no borra datos

apps/api/            ← lo más fino posible. Todo detrás de una interfaz Repository.
     · los handlers se testean con un repositorio en memoria
     · la única parte no testeada automáticamente es la que habla con Sheets/Drive,
       y se cubre con un script de humo contra el entorno DEV
```

Regla: **si una lógica es importante, vive en `packages/shared` y tiene test.** Si está en `apps/api`, es porque
necesita hablar con Google — y entonces debe ser lo más tonta posible.

Antes de dar por terminada cualquier funcionalidad: tests en verde **y** probada en el iPhone.

---

## Documentación (punto 51)

| Archivo | Contenido | Estado |
|---|---|---|
| `README.md` | Setup, clasp, despliegue, estructura, entornos, backup | Sprint 0 |
| `docs/00-DESCUBRIMIENTO.md` | Visión, journey, arquitectura de información, alcance | ✅ |
| `docs/ARCHITECTURE.md` | Arquitectura, PWA, vídeos, repositorio | ✅ |
| `docs/DATA_MODEL.md` | Entidades, relaciones, migraciones, backups | ✅ |
| `docs/UX.md` | Sistema visual y pantallas | ✅ |
| `docs/VET_RESEARCH.md` | Investigación veterinaria con fuentes | ✅ |
| `docs/RED_FLAGS.md` | Política de señales de alarma | ✅ |
| `docs/POLITICA_CONTENIDO_MEDICO.md` | Qué puede y qué no puede decir la app | ✅ |
| `docs/SECURITY.md` | Auth, permisos, validación, privacidad, observabilidad | ✅ |
| `docs/ROADMAP.md` | Este documento | ✅ |
| `docs/REPORTE_VETERINARIO.md` | Especificación del reporte | ✅ |
| `docs/DECISIONES.md` | Decisiones tomadas y pendientes | ✅ |
| `docs/SPIKE_VIDEO.md` | Resultados del experimento de vídeo | Sprint 8 |
| `docs/RUNBOOK.md` | Restaurar backup, rotar secretos, revocar acceso, migrar esquema | Sprint 7 |
