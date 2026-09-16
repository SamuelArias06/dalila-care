# Dalila Care 🐾

Un lugar tranquilo para cuidar a Dalila todos los días.

**App:** https://samuelarias06.github.io/dalila-care/

Dalila es una Golden Retriever de ~7 años con espondilosis/espondiloartrosis. Esta app es su diario de cuidado:
registrar cómo está en menos de un minuto, no olvidar su rutina, guardar vídeos de cómo se mueve, y llegar a la
consulta veterinaria con información real en vez de recuerdos borrosos.

**No es un dispositivo médico y no sustituye al veterinario.**
Ver [docs/POLITICA_CONTENIDO_MEDICO.md](docs/POLITICA_CONTENIDO_MEDICO.md).

---

## Arquitectura

```
 iPhone ──► PWA estática (GitHub Pages)
                │  JSON sobre HTTPS
                ▼
           Apps Script Web App ──► Google Sheets  (datos)
                │                  Google Drive   (vídeos, fotos, documentos)
                └── abre sesiones de subida reanudables
                    y el navegador sube los vídeos directo a Drive
```

**Por qué la PWA no vive dentro de Apps Script:** Apps Script sirve el HTML dentro de un iframe de otro origen, así
que no admite service workers ni manifest efectivo. Sin eso no hay offline, ni instalación real, ni notificaciones.
El backend sigue siendo Apps Script al 100 %. Detalle en
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#f-puede-apps-script-servir-esta-pwa).

### Stack

| Capa | Tecnología |
|---|---|
| Frontend | Preact + TypeScript + Vite · PWA con service worker · IndexedDB |
| Backend | Google Apps Script (TypeScript compilado con esbuild, desplegado con `clasp`) |
| Datos | Google Sheets |
| Archivos | Google Drive (alcance `drive.file`: sólo lo que la app crea) |
| Acceso | Enlace mágico de un solo uso + token de dispositivo firmado con HMAC |
| Hosting | GitHub Pages |
| Coste | 0 € |

### Por qué el repositorio es público

No contiene ningún secreto. Todo lo sensible vive en `PropertiesService` del backend o en `.secrets.json`, que está
fuera de Git. La URL del backend sí está en el código, porque acaba dentro del JavaScript que descarga el navegador
— ocultarla sería teatro. Lo que protege los datos es que **toda acción de la API exige un token de dispositivo
válido**. Un repositorio público permite además GitHub Pages gratis y obliga a que nunca se cuele un secreto.

---

## Puesta en marcha

```bash
npm install
npm run setup          # crea la hoja, las carpetas de Drive y los enlaces de acceso
```

Si `npm run setup` dice que falta autorizar el script, abre la URL que imprime, entra con tu cuenta de Google y
acepta los permisos (una sola vez). Después vuelve a ejecutarlo.

### Comandos

```bash
npm run dev            # PWA en local
npm test               # 105 pruebas del núcleo compartido
npm run typecheck      # comprobación de tipos de todo el monorepo
npm run build:web      # compila la PWA
npm run push:api       # compila y publica el backend con clasp
npm run setup          # arranque idempotente del backend
node scripts/generate-icons.mjs   # regenera iconos y splash desde el SVG
```

El despliegue de la PWA es automático: cada `push` a `main` ejecuta las pruebas y publica en GitHub Pages
(`.github/workflows/deploy-web.yml`).

---

## Estructura

```
apps/web/          PWA (Preact + Vite)
  src/app/         shell, router, barra de pestañas, estado de sincronización
  src/screens/     las 22 pantallas
  src/components/  piezas compartidas (gráficos, captura de media, resumen nocturno)
  src/data/        IndexedDB, cola de salida, sincronización, cliente de API, media
  src/ui/          kit de componentes e iconos
  src/styles/      tokens de diseño y base

apps/api/          backend de Apps Script (raíz de clasp)
  src/main.ts      enrutado RPC, autenticación y handlers
  src/auth.ts      enlaces mágicos y tokens de dispositivo
  src/sheets.ts    única capa que conoce Google Sheets
  src/drive.ts     Drive vía API REST con alcance drive.file
  src/bootstrap.ts arranque idempotente

packages/shared/   lo mismo en cliente y servidor: tipos, validación,
                   reglas de alarma, resúmenes, fechas de Bogotá
```

`packages/shared` es la pieza clave: la **misma validación corre en el navegador y en Apps Script**, así que no
pueden divergir. Ahí vive también el 100 % de las pruebas.

---

## Reglas de trabajo

- Git es la fuente de verdad. **No se edita código en el editor web de Apps Script.**
- Ninguna funcionalidad se da por terminada sin pruebas en verde **y** sin probarla en el iPhone.
- Sin secretos en el repositorio: todo en `PropertiesService` o en `.secrets.json` (ignorado por Git).
- El manifiesto canónico de Apps Script es `apps/api/appsscript.template.json` — `clasp` sobrescribe
  `appsscript.json`, por eso no se versiona.

---

## Documentación

| Documento | Contenido |
|---|---|
| [00-DESCUBRIMIENTO.md](docs/00-DESCUBRIMIENTO.md) | Visión, recorrido de la usuaria, arquitectura de información |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura, análisis PWA + Apps Script, vídeos |
| [DATA_MODEL.md](docs/DATA_MODEL.md) | Entidades, versionado de esquema, backups |
| [UX.md](docs/UX.md) | Sistema visual, tono y pantallas |
| [VET_RESEARCH.md](docs/VET_RESEARCH.md) | Investigación veterinaria con fuentes y niveles de evidencia |
| [RED_FLAGS.md](docs/RED_FLAGS.md) | Señales de alarma y orientación segura |
| [POLITICA_CONTENIDO_MEDICO.md](docs/POLITICA_CONTENIDO_MEDICO.md) | Qué puede y qué no puede decir la app |
| [SECURITY.md](docs/SECURITY.md) | Autenticación, permisos, validación, privacidad |
| [REPORTE_VETERINARIO.md](docs/REPORTE_VETERINARIO.md) | Especificación del resumen para la consulta |
| [ROADMAP.md](docs/ROADMAP.md) | Sprints y estrategia de pruebas |
| [DECISIONES.md](docs/DECISIONES.md) | Decisiones tomadas y su porqué |
| [RUNBOOK.md](docs/RUNBOOK.md) | Operación: restaurar backup, revocar acceso, migrar esquema |
