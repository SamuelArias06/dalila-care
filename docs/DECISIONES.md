# Decisiones

> Cubre **O**. Dos partes: lo que he decidido yo (y por qué), y lo poco que necesita tu criterio.

---

# Parte 1 — Decisiones ya tomadas

No te pregunto por estas porque hay una opción claramente mejor. Cámbialas si no estás de acuerdo, pero no hace falta
que pienses en ellas.

| # | Decisión | Alternativa descartada | Por qué |
|---|---|---|---|
| A1 | **PWA estática + Apps Script como API JSON** | Servir la PWA desde Apps Script | Apps Script **no puede** servir una PWA real: el HTML vive en un iframe de otro origen, así que no hay service worker, ni manifest efectivo, ni modo standalone. Ver [ARCHITECTURE.md](ARCHITECTURE.md#f-puede-apps-script-servir-esta-pwa) |
| A2 | **GitHub Pages** para el frontend | Cloudflare Pages, Vercel, Netlify | Gratis, ya usas Git, HTTPS y dominio propio incluidos, cero cuentas nuevas. El repo puede ser público porque no contiene secretos. Cambiar de hosting son 10 minutos |
| A3 | **Preact + TypeScript + Vite** | React, Vue, Vanilla, Lit | ~5 KB de runtime frente a ~45 KB de React, con el mismo modelo mental. Vanilla no escala con estado compartido + sincronización |
| A4 | **Google Sheets como base de datos** | Firestore, SQLite en Drive | Con ~6 000 filas/año estamos 3 órdenes de magnitud por debajo del límite. Es inspeccionable a mano, que aquí es una virtud. Todo el acceso va detrás de una interfaz `Repository` por si algún día cambia |
| A5 | **Un solo endpoint RPC** en vez de REST | REST con rutas y verbos | Apps Script no maneja bien el *preflight* CORS. Un POST con `text/plain` y un campo `action` lo evita por completo |
| A6 | **Vídeos: subida directa a Drive con sesión reanudable creada por el backend** | Subir a través de Apps Script | El cuerpo POST está limitado a ~50 MB, en base64 (+33 %), sin reanudación ni progreso. Además Apps Script no debe tocar los bytes. Ver [ARCHITECTURE.md](ARCHITECTURE.md#g-vídeos) |
| A7 | **Alcance `drive.file`, no `drive`** | Acceso completo a Drive | Da acceso solo a lo que la app crea. Aunque un token se filtrase, el resto del Drive queda intacto. A cambio, la app debe crear sus propias carpetas |
| A8 | **Autenticación propia con Google Identity Services + lista blanca** | "Cualquiera con cuenta de Google" en el despliegue | Esa opción rompe el `fetch` desde otro origen (redirige a una página de login). Verificamos el ID token nosotros |
| A9 | **Recordatorios vía Google Calendar en V1.1; Web Push en V2** | Web Push desde el principio | Web Push exige firmar VAPID con ECDSA P-256, y **Apps Script no tiene ECDSA nativo**. Calendar da notificaciones nativas reales del sistema con un día de trabajo |
| A10 | **Check-in propio, sin escalas clínicas con copyright** | Incrustar LOAD / CBPI / HCPI | LOAD y CBPI tienen restricciones de licencia. Además, una puntuación agregada invita a interpretarla en casa, que es justo lo que no queremos. Ver [VET_RESEARCH.md](VET_RESEARCH.md#10-escalas-clínicas-punto-29-qué-recomiendo-y-por-qué) |
| A11 | **Escala de heces con descriptores propios** | Reproducir la de Purina o WALTHAM | Ambas son materiales corporativos sin condiciones públicas de reutilización. Los descriptores en lenguaje llano funcionan igual de bien en casa |
| A12 | **Versionado por vigencia + snapshots** en medicamentos y alimentos | Editar el registro en sitio | Es la única forma de que el histórico de septiembre siga diciendo lo que pasaba en septiembre (tu punto 46) |
| A13 | **ULID generado en el cliente** como identificador | Autoincremento o número de fila | Hace que los reintentos sean idempotentes: red caída + reenvío no produce duplicados. Y es ordenable por tiempo |
| A14 | **`localDate` como campo explícito** | Derivar el día del timestamp | Evita el bug clásico en el que un registro de las 22:00 en Bogotá aparece como del día siguiente |
| A15 | **Gráficos en SVG a mano** | Chart.js, Recharts | 70 KB para dibujar 7 barras no se justifica, y el resultado encajaría peor con el diseño |
| A16 | **Sin analítica, sin Sentry, sin CDN, sin fuentes externas** | Lo habitual | Es una app privada sobre la salud de un animal. Cero terceros es la postura correcta y además la más simple |
| A17 | **Vídeos y alimentación bajan a V1.1; preguntas al veterinario sube a V1** | Tu lista del punto 48 | Explicado en [00-DESCUBRIMIENTO.md](00-DESCUBRIMIENTO.md#lo-que-cambiaría-de-tu-lista-inicial-y-por-qué) |
| A18 | **Español de Colombia como idioma único** | i18n desde el principio | Un solo idioma, un solo usuario objetivo. La infraestructura de traducción se añade si algún día hace falta |

---

# Parte 2 — Decisiones que necesito de ti

Seis. Las tres primeras bloquean el Sprint 0; las otras tres pueden esperar.

---

## D1 · ¿En qué cuenta de Google viven los datos? 🔴 *bloquea Sprint 0*

**Mi recomendación: crear una cuenta nueva y dedicada** (`dalila.care.algo@gmail.com`), con verificación en dos pasos,
cuyas credenciales tengáis los dos.

Razonamiento completo en [SECURITY.md](SECURITY.md#dónde-viven-los-datos). En resumen:

- **Tu cuenta personal:** los datos de la perra de ella quedan bajo tu control, y si cambias de cuenta o el proyecto se
  acaba, ella se queda sin nada.
- **Su cuenta personal:** es lo más correcto en cuanto a propiedad, pero para desarrollar yo tendría que trabajar con
  acceso a su cuenta personal completa. Incómodo y evitable.
- **Cuenta dedicada:** contenedor limpio, transferible, sin datos personales de nadie más dentro.

**Lo que necesito:** que la crees y me digas el correo. (O que me digas que prefieres otra opción.)

---

## D2 · ¿Dónde estáis? 🔴 *bloquea decisiones de PWA*

Deduzco **Colombia** por el vocabulario ("fórmula médica", "concentrado"), pero necesito confirmarlo por dos motivos
concretos:

1. **Zona horaria.** Va escrita en el modelo de datos (`America/Bogota`, UTC−05:00). Equivocarse aquí corrompe todos
   los cortes por día.
2. **Unión Europea.** Esto importa mucho: desde iOS 17.4, por el DMA, **las PWA en la UE no se ejecutan en modo
   standalone y no reciben push**. Si estuvierais en la UE, toda la estrategia de instalación y recordatorios
   cambiaría.

**Lo que necesito:** ciudad y país.

---

## D3 · ¿Repositorio público o privado? 🟡 *bloquea Sprint 0, pero tiene respuesta por defecto*

**Mi recomendación: público.** El código no contiene ningún secreto (están todos en `PropertiesService`), los datos de
Dalila no están en el repositorio, y así GitHub Pages funciona gratis con la configuración más simple.

Si prefieres privado por pudor o principio —es una razón perfectamente válida—, cambiamos el hosting a **Cloudflare
Pages**, que permite repos privados en el plan gratuito. Cuesta 15 minutos de configuración y ninguna línea de código.

**Lo que necesito:** público (por defecto) o privado.

---

## D4 · ¿Qué sabemos realmente del caso de Dalila? 🟡 *afecta al contenido, no al código*

No voy a inventar nada (tu punto 58), pero esto cambia **qué observaciones ponemos en primer plano** en el catálogo
del check-in:

- ¿Hay informe radiográfico escrito? ¿Qué zona de la columna?
- ¿El veterinario ha mencionado o descartado algo además de la espondilosis? Específicamente: **estenosis lumbosacra**
  (frecuente en Golden Retriever justo a los 6–7 años) o cualquier signo neurológico.
- ¿Toma algún medicamento ahora mismo? (No hace falta que me digas cuál: solo si sí o no, para saber si el módulo de
  medicación tiene que estar listo el día 1.)
- ¿Ha habido alguna vez episodios de arrastrar las uñas, perder equilibrio o que se le voltee una pata?

**Por qué lo pregunto:** el catálogo de signos neurológicos que propongo en
[VET_RESEARCH.md](VET_RESEARCH.md#1-espondilosis-deformante-lo-más-importante-de-todo-el-documento) es probablemente
la parte clínicamente más valiosa de la app, porque es lo que permite distinguir rigidez de un problema neurológico.
Si el veterinario ya lo tiene en el radar, lo ponemos arriba del todo.

**Lo que necesito:** lo que tengáis, aunque sea una foto del informe o "no tenemos nada por escrito".

---

## D5 · ¿Cuándo es la próxima consulta? 🟡

Si hay cita en menos de un mes, adelanto el "resumen de consulta en texto" al Sprint 5 en lugar del 7, y pospongo el
historial. Son unas horas de trabajo y cambia por completo el valor de la primera consulta con la app.

**Lo que necesito:** fecha aproximada, o "no hay nada programado".

---

## D6 · ¿Le enseñáis la política de alarmas al veterinario? 🟢 *más adelante*

Cuando tengáis confianza, me gustaría que el veterinario de Dalila revisara [RED_FLAGS.md](RED_FLAGS.md) y el catálogo
de signos. Cinco minutos de una consulta valen más que toda mi investigación: puede corregir un umbral, añadir algo
específico de Dalila, o decir "si pasa X, llámame directamente".

También decide él si tiene sentido usar alguna vez el **HCPI en español** (versión validada desde 2025) como
cuestionario mensual — y si fuera que sí, pediríamos permiso formal a la Universidad de Helsinki antes de incluirlo.

**Lo que necesito:** que lo tengas en mente para la próxima visita. No bloquea nada.

---

## Cosas que NO te pregunto, y por qué

Para que quede claro que no te estoy trasladando trabajo mío:

- **Qué framework usar** → decidido (A3). Es una decisión técnica con respuesta clara.
- **Cómo estructurar las hojas** → decidido, en [DATA_MODEL.md](DATA_MODEL.md).
- **Cómo autenticar** → decidido (A8). Solo hay un camino que funcione con esta arquitectura.
- **Qué paleta de colores** → propuesta en [UX.md](UX.md). La verás en pantalla en el Sprint 2 y la ajustamos ahí, que
  es donde se decide bien el color: mirándolo, no leyéndolo.
- **Nombre definitivo** → "Dalila Care" sirve para trabajar. El nombre bonito se piensa cuando la app exista y sepáis
  qué se siente al usarla.
- **Qué alimentos darle a Dalila** → eso no lo decide ni la app ni yo. Lo decide su veterinario.
