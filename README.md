# Dalila Care 🐾

Un lugar tranquilo para cuidar a Dalila todos los días.

Dalila es una Golden Retriever de ~7 años con espondilosis/espondiloartrosis. Esta app es su diario de cuidado: sirve
para registrar cómo está cada día en menos de un minuto, no olvidar su rutina, guardar vídeos de cómo se mueve, y
llegar a la consulta veterinaria con información real en vez de recuerdos borrosos.

**No es un dispositivo médico y no sustituye al veterinario.** Ver
[docs/POLITICA_CONTENIDO_MEDICO.md](docs/POLITICA_CONTENIDO_MEDICO.md).

---

## Estado

**Fase de descubrimiento y arquitectura — completada.**
Todavía no hay código: el diseño está en `docs/` y hay decisiones pendientes en
[docs/DECISIONES.md](docs/DECISIONES.md).

---

## Documentación

| Documento | Contenido |
|---|---|
| [00-DESCUBRIMIENTO.md](docs/00-DESCUBRIMIENTO.md) | Visión, recorrido de la usuaria, arquitectura de información, alcance de V1 / V1.1 / V2 |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura técnica, análisis PWA + Apps Script, vídeos, estructura del repositorio |
| [DATA_MODEL.md](docs/DATA_MODEL.md) | Entidades, relaciones, versionado de esquema, backups |
| [UX.md](docs/UX.md) | Sistema visual, tono, pantallas y accesibilidad |
| [VET_RESEARCH.md](docs/VET_RESEARCH.md) | Investigación veterinaria con fuentes y niveles de evidencia |
| [RED_FLAGS.md](docs/RED_FLAGS.md) | Señales de alarma y política de orientación segura |
| [POLITICA_CONTENIDO_MEDICO.md](docs/POLITICA_CONTENIDO_MEDICO.md) | Qué puede y qué no puede decir la app |
| [SECURITY.md](docs/SECURITY.md) | Autenticación, permisos, validación, privacidad |
| [REPORTE_VETERINARIO.md](docs/REPORTE_VETERINARIO.md) | Especificación del resumen para la consulta |
| [ROADMAP.md](docs/ROADMAP.md) | Sprints, pruebas y documentación |
| [DECISIONES.md](docs/DECISIONES.md) | Decisiones tomadas y las que necesitan tu criterio |

---

## Arquitectura en una imagen

```
 iPhone  ──►  PWA estática (GitHub Pages)
                  │  JSON sobre HTTPS
                  ▼
             Apps Script Web App  ──►  Google Sheets  (datos)
                  │                     Google Drive  (archivos)
                  └── crea sesiones de subida ──► el navegador sube
                                                  los vídeos directo a Drive
```

**Por qué la PWA no vive dentro de Apps Script:** Apps Script sirve el HTML dentro de un iframe de otro origen, así que
no admite service workers, ni manifest efectivo, ni modo standalone. Sin eso no hay offline, ni instalación real, ni
notificaciones. El backend sigue siendo Apps Script al 100 %.
Detalle en [ARCHITECTURE.md](docs/ARCHITECTURE.md#f-puede-apps-script-servir-esta-pwa).

---

## Stack

- **Frontend:** Preact + TypeScript + Vite · PWA con service worker · IndexedDB
- **Backend:** Google Apps Script (TypeScript, compilado con esbuild, desplegado con `clasp`)
- **Datos:** Google Sheets
- **Archivos:** Google Drive (alcance `drive.file`)
- **Auth:** Google Identity Services + lista blanca de correos
- **Hosting:** GitHub Pages
- **Coste:** 0 €

---

## Setup

> Se completará en el Sprint 0. Requisitos previos: Node ≥ 20 (probado con 24), una cuenta de Google dedicada
> ([D1](docs/DECISIONES.md#d1--en-qué-cuenta-de-google-viven-los-datos--bloquea-sprint-0)) y `clasp` 3.x.

```bash
npm install
npm run dev              # PWA en local contra el backend DEV
npm run test             # tests de packages/shared y apps/web
npm run deploy:api:dev   # build + clasp push + clasp deploy (entorno DEV)
npm run deploy:api:prod  # entorno PROD
```

## Reglas de trabajo

- Git es la fuente de verdad. **No se edita código en el editor web de Apps Script.**
- Dos entornos (`DEV` / `PROD`) con hoja y carpeta de Drive distintas. Nunca se prueba contra los datos reales.
- Ninguna funcionalidad se da por terminada sin tests en verde **y** sin probarla en el iPhone.
- Sin secretos en el repositorio: todo en `PropertiesService`.
- Una funcionalidad terminada antes de empezar la siguiente.
