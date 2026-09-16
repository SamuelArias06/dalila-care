# Arquitectura técnica

> Documento 2 de 9. Cubre **E (arquitectura), F (PWA + Apps Script), G (vídeos), N (repositorio)**.
> Todo lo marcado como ⚠️ es una limitación real verificada, no una suposición.

---

## Resumen ejecutivo (si solo lees un párrafo)

**Apps Script no puede servir una PWA de verdad.** No es una cuestión de esfuerzo ni de trucos: el HTML que devuelve
Apps Script se ejecuta dentro de un iframe de otro origen, y un service worker no puede registrarse ahí. Sin service
worker no hay offline, ni instalación en pantalla de inicio en condiciones, ni push, ni control del icono. Insistir
produciría exactamente lo que pediste evitar: *"una falsa PWA que simplemente tenga un manifest y funcione mal"*.

La solución **no** requiere abandonar tu stack. Requiere partirlo en dos:

```
  PWA estática (HTML/JS/CSS)          Apps Script (backend JSON)
  origen propio, service worker  ───►  doGet/doPost, valida, escribe
  instalable, offline, rápida          Sheets (datos) + Drive (archivos)
```

Sigues teniendo **Apps Script + Sheets + Drive + clasp + Git** como núcleo. Lo único que añadimos es un *hosting
estático gratuito* para los archivos del frontend. Cero servidores, cero base de datos gestionada, cero AWS.

---

## E. Arquitectura recomendada

### Diagrama

```
 iPhone (Safari → app en pantalla de inicio)
 ┌────────────────────────────────────────────┐
 │  PWA  —  https://<dominio>/                │
 │  · Preact + TypeScript (build con Vite)    │
 │  · Service Worker (app shell + offline)    │
 │  · IndexedDB: datos locales + cola de      │
 │    cambios pendientes (outbox)             │
 │  · Sign in with Google (GIS) → ID token    │
 └───────┬───────────────────────┬────────────┘
         │ 1. JSON sobre HTTPS   │ 3. Subida directa de bytes
         │    (POST text/plain)  │    (resumable upload)
         ▼                       ▼
 ┌─────────────────────┐   ┌──────────────────────────┐
 │  Apps Script Web App│   │  googleapis.com/upload   │
 │  · verifica identidad│──►│  /drive/v3/files         │
 │  · valida y escribe │ 2.│  (sesión creada por el   │
 │  · crea la sesión de│   │   backend, no por el      │
 │    subida resumable │   │   cliente)                │
 └────────┬────────────┘   └───────────┬──────────────┘
          │                            │
          ▼                            ▼
 ┌──────────────────┐         ┌──────────────────┐
 │ Google Sheets    │         │ Google Drive     │
 │ (base de datos)  │◄────────│ (vídeos, fotos,  │
 │  metadata de     │  ids    │  documentos)     │
 │  cada archivo    │         └──────────────────┘
 └──────────────────┘
```

### Decisiones y su justificación

| Decisión | Elección | Por qué (y qué descarté) |
|---|---|---|
| **Frontend framework** | **Preact + TypeScript** (~5 KB runtime) | React son ~45 KB gzip solo de runtime para una app de 10 pantallas: no se justifica. Vanilla JS puro se vuelve inmanejable en cuanto hay estado compartido (rutina + sync + offline). Preact da JSX y componentes con el peso de una librería pequeña, y se puede migrar a React sin reescribir si algún día hiciera falta. Vue y Lit son opciones razonables; Preact gana por tamaño + familiaridad del ecosistema. |
| **Build** | **Vite** | Estándar, rápido, cero configuración para este caso. |
| **Estado** | `@preact/signals` (~2 KB) | Reactividad fina sin Redux ni Context gigante. |
| **Router** | Hash router propio (~60 líneas) | Evita dependencias y funciona sin configuración de servidor. El hosting estático no necesita reglas de reescritura. |
| **Gráficos** | SVG a mano | Chart.js son ~70 KB para dibujar 7 barras. Los gráficos que necesitamos (barras semanales, línea de peso, sparkline) son 100 líneas de SVG y encajan mejor con el diseño. |
| **Fechas** | `Intl` nativo + helpers propios | `date-fns`/`dayjs` no aportan aquí. `Intl.DateTimeFormat('es-CO')` cubre todo el formateo. |
| **Persistencia local** | **IndexedDB** vía `idb` (1.2 KB) | `localStorage` es síncrono, limitado a ~5 MB y no sirve para Blobs de vídeo. |
| **Backend** | **Apps Script Web App** (`doGet`/`doPost`) | Es tu stack. Para 2 usuarios y ~20 escrituras/día es más que suficiente y cuesta 0. |
| **Base de datos** | **Google Sheets** | Ver análisis abajo. Sí, sirve. |
| **Archivos** | **Google Drive** | Sí, pero **no subiendo a través de Apps Script**. Ver sección G. |
| **Hosting del frontend** | **GitHub Pages** | Gratis, ya usas Git, HTTPS y dominio propio incluidos, despliegue con una GitHub Action. El repo puede ser público sin riesgo: **no contiene ningún secreto** (el Client ID de OAuth es público por diseño y la URL del Web App está protegida por autenticación). Alternativa equivalente si quieres el repo privado: Cloudflare Pages (también gratis, permite repos privados y control de cabeceras). Cambiar de uno a otro son 10 minutos porque solo son archivos estáticos. |

### ⚠️ Limitaciones reales de Apps Script que debemos asumir

Ninguna de estas es bloqueante para este proyecto, pero conviene tenerlas escritas:

| Límite | Valor | Impacto aquí |
|---|---|---|
| Tiempo máximo de ejecución | 6 min/ejecución (cuentas gratuitas) | Irrelevante: nuestras peticiones son de 200–1500 ms. Relevante solo para backups y migraciones → hacerlos por lotes. |
| Ejecuciones simultáneas | ~30 | Irrelevante con 2 usuarios. |
| `UrlFetchApp` | 20 000 llamadas/día | Solo se usa para verificar tokens; se cachea. |
| Tamaño del cuerpo POST | ~50 MB (y el JSON llega como texto, hay que parsearlo entero en memoria) | **Por esto los vídeos NO pasan por Apps Script.** |
| Latencia en frío | 0.5–2 s la primera llamada | Mitigado: la UI es optimista, nunca espera al servidor para pintar. |
| Sin cabeceras HTTP personalizadas | No podemos enviar `Authorization` | El token viaja en el cuerpo del POST. Feo pero funcional y seguro sobre HTTPS. |
| CORS | El Web App responde con redirección a `script.googleusercontent.com` | Funciona con `fetch` si se usa `Content-Type: text/plain;charset=utf-8` (evita el *preflight*, que Apps Script no responde bien). Esto condiciona el diseño de la API: **un solo endpoint POST con un campo `action`**, no REST clásico. |
| Sin transacciones en Sheets | — | Se resuelve con `LockService` + operaciones idempotentes con ID generado en cliente. |

### ¿Google Sheets sirve como base de datos? Sí, para esto.

**A favor:** 0 € , inspección y edición manual (que en un proyecto personal es una función, no un defecto), backup
trivial, exportación nativa, y el límite duro de 10 millones de celdas por hoja de cálculo.

**Volumen real esperado:** ~10–20 filas/día entre todas las entidades → ~6 000 filas/año → ~120 000 celdas/año.
Estamos tres órdenes de magnitud por debajo del límite. **No se va a quedar corto nunca en este proyecto.**

**Contras honestos y cómo los mitigamos:**

- *No hay transacciones.* → `LockService.getScriptLock()` en toda escritura + IDs generados en cliente (ULID) para que
  reintentar una operación no duplique nada.
- *Leer la hoja entera se vuelve lento con decenas de miles de filas.* → Usamos la **Sheets API v4 avanzada**
  (`batchGet`/`batchUpdate`) en lugar de `SpreadsheetApp` para las rutas calientes, cacheamos en `CacheService`, y las
  entidades de alto volumen se particionan por año (`DailyLogs_2026`) si algún día hiciera falta.
- *Es editable a mano y alguien puede romperla.* → Rangos protegidos, hoja `_meta` con `schemaVersion`, y validación
  en lectura: una fila corrupta se ignora y se registra, nunca tumba la app.
- *No hay índices.* → Mantenemos un mapa `id → fila` en `CacheService`/`PropertiesService` para los accesos por ID.

**Cuándo dejaría de servir:** si algún día esto se convirtiera en producto multiusuario. Por eso todo el acceso a
datos vive detrás de una interfaz `Repository` (ver [DATA_MODEL.md](DATA_MODEL.md)) y cambiar Sheets por Firestore
sería reescribir una sola capa, no la app.

---

## F. ¿Puede Apps Script servir esta PWA?

**Respuesta corta: no.** No "parcialmente con esfuerzo": no.

### El problema de raíz

Cuando despliegas un Web App, la usuaria abre `https://script.google.com/macros/s/AKfy.../exec`, pero **el HTML que
escribiste no se ejecuta ahí**. Google lo mete dentro de un `<iframe>` sandboxed servido desde
`https://script.googleusercontent.com/...`. Desde marzo de 2020 el modo `IFRAME` es el único disponible (`NATIVE` y
`EMULATED` fueron retirados).

De ahí se derivan todos los bloqueos:

| Requisito PWA | Estado en Apps Script | Motivo |
|---|---|---|
| **Service worker** | ❌ Imposible | Un SW debe servirse **como archivo propio desde el mismo origen** que la página y con un *scope* que la cubra. `HtmlService` devuelve una sola respuesta HTML por petición, y el documento vive en un origen (`script.googleusercontent.com`) que no controlamos ni podemos servir archivos sueltos. Sin SW: **no hay offline, ni caché, ni push, ni instalación fiable.** |
| **manifest.json** | ❌ No efectivo | iOS lee el manifest **del documento de nivel superior**. El de nivel superior es la página de Google, no la nuestra. Un `<link rel="manifest">` dentro del iframe no hace nada. |
| **Pantalla de inicio (standalone)** | ❌ | Por lo mismo: `apple-mobile-web-app-capable` dentro del iframe es ignorado. Se añadiría un marcador que abre Safari con la barra de Google. |
| **Icono y splash** | ❌ | Sin control del documento raíz. |
| **Cabeceras HTTP / MIME / caché** | ❌ | Apps Script no permite fijar cabeceras de respuesta. |
| **Routing / URLs limpias** | ❌ | Solo `?page=x` sobre la URL `/exec`. |
| **Notificaciones push** | ❌ | Requiere service worker. |
| **Carga rápida** | ⚠️ Mala | Cada navegación re-ejecuta el script en el servidor; no hay caché de app shell. |

La comunidad lo ha intentado durante años; la conclusión pública es la misma: no se ha conseguido desplegar un Web App
de Apps Script como PWA real.

### Arquitectura recomendada en su lugar

**PWA estática en un origen propio + Apps Script como API JSON.** Es exactamente la alternativa que tú mismo planteaste
en el punto 34, y es la correcta.

Qué ganamos:

- Control total de `sw.js`, `manifest.webmanifest`, iconos, *scope*, caché y cabeceras.
- Instalación en iPhone que se comporta como app nativa (pantalla completa, sin barra de Safari, icono propio).
- Offline real y arranque instantáneo (app shell cacheado).
- La puerta abierta a Web Push más adelante sin rehacer nada.

Qué conservamos:

- Apps Script sigue siendo **todo el backend**: autenticación, validación, lógica, Sheets, Drive.
- `clasp` + Git siguen gestionando ese backend igual que planeabas.
- Los datos siguen viviendo íntegramente en una cuenta de Google que controlamos.

Qué cuesta: un repositorio con dos carpetas en vez de una, y un flujo de despliegue con dos comandos
(`npm run deploy:web` y `npm run deploy:api`). Eso es todo.

### La API: un solo endpoint

Por la limitación de CORS descrita arriba, **no** hacemos REST con verbos y rutas. Hacemos un endpoint RPC:

```http
POST https://script.google.com/macros/s/<ID>/exec
Content-Type: text/plain;charset=utf-8     ← evita el preflight que Apps Script no maneja

{
  "action": "dailyLog.upsert",
  "token":  "<session token>",
  "clientRequestId": "01JBX...",            ← idempotencia
  "payload": { ... },
  "schemaVersion": 1
}
```

Respuesta siempre con la misma forma:

```json
{ "ok": true,  "data": {...}, "serverTime": "2026-09-15T21:04:00-05:00" }
{ "ok": false, "error": { "code": "VALIDATION", "message": "...", "userMessage": "No pudimos guardar..." } }
```

`userMessage` es el texto en español apto para mostrar a la usuaria (punto 44 del encargo). El `code` y el detalle
técnico van al log, no a la pantalla.

### Offline y sincronización

Estrategia **local-first**: la app escribe primero en IndexedDB y pinta inmediatamente; la sincronización ocurre
después y puede fallar sin que la usuaria lo note.

```
Acción de la usuaria
      │
      ├─► IndexedDB (estado local)  ──► UI actualizada al instante ✅
      │
      └─► Outbox (cola de mutaciones con ULID + timestamp)
                │
                ├─ al hacerse la acción, si hay red
                ├─ al abrir la app
                ├─ al volver a primer plano (visibilitychange)
                └─ al recuperar conexión (evento online)
                        │
                        ▼
                 POST /exec  ──► ok: marcar sincronizado
                             └─► error de red: reintentar con backoff (máx. 5)
                             └─► error de validación: marcar como conflicto y avisar
```

Detalles que evitan pérdida silenciosa de datos (punto 35):

- Las mutaciones llevan **ULID generado en el cliente**: reenviar la misma mutación dos veces produce el mismo
  resultado, nunca un duplicado.
- La cola **nunca se vacía sola**: solo se borra una entrada cuando el servidor confirma con el mismo ULID.
- Conflictos: *last-write-wins por campo* con `updatedAt`. Con dos usuarias y edición mayoritariamente del día actual,
  los conflictos reales serán casi inexistentes; aun así el servidor guarda la versión anterior en el log de auditoría.
- La UI muestra siempre el estado: `Todo guardado` / `Guardando…` / `3 cambios pendientes` / `Sin conexión`.
- ⚠️ **No usamos Background Sync**: no está soportado en iOS. La sincronización ocurre solo con la app abierta. Esto es
  una limitación real de la plataforma, no una elección.

### ⚠️ Persistencia del almacenamiento en iOS (importante)

Safari borra el almacenamiento de un sitio (IndexedDB, localStorage, registros de service worker) tras **7 días sin
interacción**. **Las apps añadidas a la pantalla de inicio están explícitamente exentas** de esa regla: tienen su
propio contador de uso y su dominio se salta el algoritmo de borrado.

Consecuencia de producto, no técnica: **instalar la app no es opcional.** Si ella la usa desde una pestaña de Safari,
puede perder los datos pendientes de sincronizar tras una semana sin abrirla. Por eso el onboarding empieza por la
instalación y la app insiste (con suavidad) mientras no esté instalada. Además llamamos a
`navigator.storage.persist()`.

### Recordatorios y notificaciones

Aquí hay que ser preciso porque es donde más mitos hay.

**Lo que sí funciona hoy en iPhone:**

- Web Push **funciona** desde iOS 16.4 (marzo 2023), **pero solo** si la web está añadida a la pantalla de inicio y
  la usuaria concede permiso desde dentro de la app instalada (nunca desde una pestaña de Safari).
- Badge API (número en el icono) funciona desde iOS 16.4, atado al permiso de notificaciones.
- Desde iOS 26, cualquier sitio añadido a la pantalla de inicio se abre como app por defecto.
- ⚠️ **En la Unión Europea**, desde iOS 17.4 las PWA no se ejecutan en modo standalone y **no hay push**. Si estáis en
  la UE esto cambia el plan; si estáis en Colombia (que es lo que deduzco del vocabulario: "fórmula médica",
  "concentrado"), no aplica. **Confírmame esto.**

**Lo que NO existe en ninguna plataforma web:** notificaciones locales programadas. No hay forma de decirle al móvil
"avísame a las 8:00" sin un servidor que envíe el push. La `Notification Triggers API` nunca llegó a estándar.

**⚠️ Y aquí está el problema real:** enviar un Web Push exige firmar un JWT VAPID con **ECDSA P-256 (ES256)**. Apps
Script ofrece `Utilities.computeRsaSha256Signature` y HMAC, **pero no tiene ECDSA nativo**. Además, enviar carga útil
cifrada requiere ECDH + HKDF + AES-GCM (RFC 8291). Es viable metiendo una librería de curvas elípticas en JS puro
dentro del bundle de Apps Script, pero es trabajo real y frágil, y no debe estar en el camino crítico de V1.

**Recomendación por fases:**

| Fase | Mecanismo | Coste | Fiabilidad |
|---|---|---|---|
| **V1** | Sin notificaciones del sistema. La app usa señales visuales al abrirla y el resumen nocturno. | 0 | — |
| **V1.1** | **Google Calendar.** Apps Script crea y mantiene un calendario "Dalila Care" con eventos recurrentes (medicación, comidas, citas) y alertas. Ella lo ve en la app Calendario de su iPhone con notificaciones nativas reales. | ~1 día de trabajo | Alta. Es la app de calendario del sistema. |
| **V2** | Web Push propio con VAPID, si después de usar Calendar sigue haciendo falta. | ~3–5 días | Alta, pero con mantenimiento. |

La opción de Calendar es, con diferencia, la mejor relación valor/complejidad: notificaciones nativas del sistema
operativo, cero infraestructura nueva, y ella ya tiene la app instalada. Recomiendo no tocar Web Push hasta V2.

### iPhone: detalles concretos que hay que acertar

- `viewport-fit=cover` + `env(safe-area-inset-*)` para notch / Dynamic Island / barra inferior.
- `apple-mobile-web-app-status-bar-style` y color de tema coherente con el fondo (claro y oscuro).
- Iconos: `apple-touch-icon` 180×180 (iOS **no** usa los iconos del manifest para el icono de inicio) + set completo
  en el manifest para el resto.
- Splash: iOS requiere `apple-touch-startup-image` con *media queries* por tamaño de pantalla; se generan en build.
- `overscroll-behavior: none` y scroll contenido para evitar el rebote que delata que es web.
- Inputs con `font-size ≥ 16px` para que iOS no haga zoom al enfocar.
- Teclado: el teclado no redimensiona el viewport en standalone; usar `visualViewport` para reposicionar la barra de
  acciones.
- Pull-to-refresh deshabilitado; refresco manual explícito.
- `prefers-reduced-motion` y `prefers-color-scheme` respetados.

---

## G. Vídeos

Este es el módulo con más riesgo, y donde tu idea inicial necesita un ajuste importante.

### ⚠️ Por qué NO subir los vídeos a través de Apps Script

Tu instinto (Drive para archivos, Sheets para metadata) es **correcto**. Lo que no funciona es el camino
`iPhone → Apps Script → Drive`:

1. El cuerpo de un POST a un Web App está limitado a ~50 MB, y el binario tendría que ir en **base64**, que infla el
   tamaño un 33 %.
2. Apps Script tiene que **parsear ese string entero en memoria** antes de que tu código lo vea. Con vídeos de decenas
   de MB esto es lento y propenso a agotar memoria o tiempo.
3. No hay reanudación: si la subida se corta en el 90 % (metro, ascensor, mala cobertura), se pierde todo.
4. No hay progreso real para mostrar en la UI.

### La buena noticia: iOS comprime los vídeos por nosotros

Al grabar o elegir un vídeo mediante `<input type="file" accept="video/*" capture="environment">`, **iOS recodifica a
720p** antes de entregar el archivo. Un clip de 15–20 segundos queda típicamente en **3–8 MB**. Eso hace todo el
problema mucho más manejable. (El límite de grabación desde el input es de 10 minutos, irrelevante aquí.)

### Flujo recomendado: subida directa a Drive con sesión reanudable

```
1. Ella toca "Grabar vídeo"
      └─ <input type="file" accept="video/*" capture>  → iOS abre la cámara nativa
                                                        → devuelve un File de ~5 MB, 720p

2. En el navegador, antes de subir nada:
      ├─ Se genera un póster: <video> → seek a 1s → canvas → JPEG ~40 KB
      ├─ Se guarda el Blob en IndexedDB con estado "pendiente"   ◄── nunca se pierde
      └─ La UI ya muestra el vídeo en la línea de tiempo, marcado "Pendiente de subir"

3. POST a Apps Script: { action: "media.createUploadSession", name, mimeType, size, category }
      └─ El backend valida (MIME permitido, tamaño máximo, usuaria autorizada),
         crea la carpeta del mes si no existe, y llama a la API de Drive para abrir
         una SESIÓN DE SUBIDA REANUDABLE. Devuelve solo la URI de esa sesión.

4. El navegador sube los bytes DIRECTAMENTE a googleapis.com, por trozos de 8 MB,
   con progreso real y reanudación si se corta.        ◄── Apps Script no toca los bytes

5. Al terminar, POST { action: "media.confirm", uploadId, driveFileId }
      └─ El backend verifica contra Drive (existe, tamaño y MIME coinciden),
         escribe la fila en la hoja Media y sube también el póster (40 KB, ese sí
         puede ir por Apps Script sin problema).

6. El Blob local se borra de IndexedDB solo tras la confirmación del servidor.
```

**El punto clave de seguridad:** el token OAuth del backend se usa **solo en el paso 3**, dentro de Apps Script. El
navegador recibe únicamente la URI de sesión, que es un permiso de un solo uso para escribir *ese* archivo concreto.
Nunca exponemos un token con acceso general a Drive.

> **A verificar en el Sprint de vídeos:** si Google exigiera cabecera `Authorization` también en los trozos
> siguientes, el plan B es devolver al cliente un token de `ScriptApp.getOAuthToken()` con alcance limitado a
> `drive.file` (patrón bien conocido y usado). Aun así el daño potencial estaría acotado a archivos creados por la
> propia app, nunca al resto del Drive de la cuenta. Es el primer experimento a hacer en ese sprint, antes de escribir
> UI.

### Reproducción privada

Los archivos **no se hacen públicos**. Para ver un vídeo:

```
GET https://www.googleapis.com/drive/v3/files/<id>?alt=media
     con token de corta duración obtenido del backend
  → Blob → URL.createObjectURL() → <video src>
```

Con clips de 3–8 MB esto es instantáneo en WiFi y aceptable en datos. Los pósters (40 KB) se cachean agresivamente con
la Cache API, así que **la línea de tiempo se ve completa al instante y sin descargar ningún vídeo**. Solo se descarga
el vídeo que ella toca.

### Compartir con el veterinario

Dos modos, ambos revocables y registrados en una hoja `Shares`:

1. **Por correo (recomendado, por defecto):** el backend concede permiso de lectura al email del veterinario sobre los
   archivos seleccionados. Queda registrado quién, qué y cuándo. Un botón revoca.
2. **Enlace temporal:** permiso "cualquiera con el enlace" con aviso explícito en la UI de que ese enlace es público
   mientras exista, y un botón de revocar bien visible + recordatorio a los 7 días.

Nunca se comparte la carpeta completa, solo archivos concretos seleccionados para esa consulta.

### Estructura en Drive

Poca profundidad, nombres predecibles, y **la verdad siempre en Sheets** (Drive es solo el almacén de bytes):

```
Dalila Care/                       ← creada por la app (alcance drive.file)
├── Media/
│   ├── 2026-09/                   ← una carpeta por mes. ~30-60 archivos cada una.
│   │   ├── 20260915-0812-video-caminata-01JBX7....mp4
│   │   ├── 20260915-0812-poster-01JBX7....jpg
│   │   └── 20260915-1940-foto-01JBX8....jpg
│   └── 2026-10/
├── Documentos/                    ← fórmulas, exámenes, radiografías, informes
│   └── 2026-09/
├── Exportaciones/                 ← reportes PDF generados y backups JSON
└── Dalila Care.gsheet             ← la base de datos
```

Por qué mes y no día: carpeta por día generaría ~365 carpetas/año casi vacías; por mes son 12 y cada una se mantiene
navegable a mano desde la app de Drive, que es exactamente lo que quieres si algún día la app deja de existir.

El nombre del archivo incluye fecha, categoría e ID: **si alguien encuentra la carpeta dentro de diez años sin la app,
sigue entendiendo qué es cada cosa.**

---

## N. Estructura del repositorio

```
dalila-care/
├── apps/
│   ├── web/                       # La PWA (se despliega a GitHub Pages)
│   │   ├── public/
│   │   │   ├── manifest.webmanifest
│   │   │   ├── icons/             # generados por script desde un único SVG
│   │   │   ├── splash/            # generados por script
│   │   │   └── offline.html
│   │   ├── src/
│   │   │   ├── app/               # shell, router, layout, tabs
│   │   │   ├── screens/           # today, checkin, history, dalila, ...
│   │   │   ├── components/        # ui reutilizable
│   │   │   ├── data/
│   │   │   │   ├── db.ts          # IndexedDB
│   │   │   │   ├── outbox.ts      # cola de sincronización
│   │   │   │   ├── sync.ts
│   │   │   │   └── api.ts         # cliente del endpoint RPC
│   │   │   ├── auth/              # Google Identity Services
│   │   │   ├── styles/            # tokens de diseño, temas
│   │   │   └── sw.ts              # service worker
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── api/                       # El proyecto de Apps Script (raíz de clasp)
│       ├── src/
│       │   ├── main.ts            # doGet / doPost / enrutado de acciones
│       │   ├── auth/              # verificación de identidad y sesiones
│       │   ├── handlers/          # una función por acción de la API
│       │   ├── repo/              # acceso a Sheets (la única capa que conoce Sheets)
│       │   ├── drive/             # sesiones de subida, permisos, carpetas
│       │   ├── jobs/              # triggers: backup, calendario, limpieza
│       │   └── lib/               # utilidades sin dependencias de GAS
│       ├── build/                 # ← salida de esbuild; rootDir de clasp. En .gitignore
│       ├── appsscript.json
│       ├── .clasp.json            # ← .gitignore (contiene el scriptId)
│       ├── .clasp.json.example
│       └── package.json
│
├── packages/
│   └── shared/                    # ⭐ Lo mismo en cliente y servidor
│       ├── src/
│       │   ├── types.ts           # entidades del modelo de datos
│       │   ├── schema.ts          # validación (se ejecuta en AMBOS lados)
│       │   ├── ids.ts             # ULID
│       │   ├── dates.ts           # días locales, zona horaria
│       │   ├── migrations.ts      # schemaVersion → transformaciones
│       │   └── summaries.ts       # lógica pura de resúmenes y tendencias
│       └── __tests__/             # aquí vive la mayoría de los tests
│
├── docs/                          # estos documentos
├── scripts/
│   ├── generate-icons.mjs
│   ├── bootstrap-sheet.mjs        # crea la hoja con sus pestañas y cabeceras
│   └── backup-check.mjs
├── .github/workflows/
│   ├── ci.yml                     # lint + typecheck + tests en cada push
│   └── deploy-web.yml             # build + publicar a GitHub Pages en main
├── package.json                   # workspaces npm
├── tsconfig.base.json
├── README.md
└── .gitignore
```

### Notas sobre `clasp` y el flujo de trabajo

- **`clasp` 3.x ya no transpila TypeScript.** Escribimos TS y lo compilamos nosotros con **esbuild** a un único archivo
  IIFE en `apps/api/build/`, que es el `rootDir` de `.clasp.json`. Esto tiene dos ventajas grandes:
  - `packages/shared` se puede importar tal cual en el backend → **la misma validación corre en cliente y servidor**,
    que es literalmente lo que pediste en el punto 43.
  - Todo el backend es un solo archivo en el editor web, así que nadie tiene la tentación de editarlo ahí.
- El entry point expone las funciones globales que Apps Script necesita:
  ```ts
  globalThis.doGet  = handleGet;
  globalThis.doPost = handlePost;
  globalThis.dailyBackup = dailyBackup;   // trigger temporal
  ```
- Requiere **Node ≥ 20** (usamos 24).
- Comandos:
  ```bash
  npm run dev              # Vite en local, apuntando al despliegue de pruebas de la API
  npm run test             # Vitest sobre packages/shared y apps/web
  npm run build:api        # esbuild → apps/api/build
  npm run deploy:api:dev   # build + clasp push + clasp deploy (despliegue DEV)
  npm run deploy:api:prod  # idem, despliegue PROD (id fijo, la URL nunca cambia)
  npm run deploy:web       # lo hace la GitHub Action al hacer merge a main
  ```
- **Dos despliegues de Apps Script, dos hojas de cálculo, dos carpetas de Drive:** `DEV` y `PROD`. Se distinguen por
  `PropertiesService` (`ENV=dev|prod`). Nunca se prueba contra los datos reales de Dalila.
- `.clasp.json` va en `.gitignore` (contiene el `scriptId`); se versiona `.clasp.json.example`.
- Git es la fuente de verdad. `clasp pull` solo se usa para detectar que alguien tocó el editor web, y esa
  diferencia se trata como un incidente, no como un cambio.
