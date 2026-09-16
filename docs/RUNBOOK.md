# Runbook

Procedimientos de operación. Corto a propósito: si algo no cabe aquí, es que es demasiado complicado.

---

## Dar acceso a un dispositivo nuevo

1. En la app: **Ajustes → Diagnóstico → Crear enlace de acceso**.
2. Se copia solo al portapapeles. Mándalo por WhatsApp.
3. Quien lo abra en su móvil queda dentro para siempre en ese dispositivo.

El enlace es **de un solo uso** y caduca a los 14 días. Reenviarlo después no sirve de nada.

Si no puedes entrar a la app (por ejemplo, perdiste tu propio acceso):

```bash
npm run setup      # es idempotente y genera enlaces nuevos
```

---

## Quitarle el acceso a un dispositivo

En **Ajustes → Diagnóstico** aparecen los dispositivos. Revocar uno tiene efecto inmediato en su siguiente petición:
el backend comprueba la lista de revocados en cada llamada.

Si hace falta invalidar **todos** los accesos de golpe, borra la propiedad `SESSION_SECRET` en
`Configuración del proyecto → Propiedades del script` de Apps Script. Todos los tokens dejan de validar al instante y
hay que repartir enlaces nuevos.

---

## Restaurar una copia de seguridad

Los backups diarios están en `Dalila Care/Exportaciones/` en Drive, como `dalila-backup-YYYY-MM-DD.json`.

1. Abre la hoja actual y comprueba qué se perdió.
2. Si hay que volver atrás del todo: duplica el JSON del día bueno y vuelve a importar los registros que falten.
3. Los archivos de Drive **no se tocan nunca**: la hoja sólo guarda sus identificadores, así que un vídeo no se
   pierde aunque la hoja se corrompa.

Drive además guarda 30 días de papelera, y la propia hoja tiene historial de versiones de Google.

Para forzar un backup: **Ajustes → Diagnóstico → Crear copia de seguridad ahora**.

---

## Publicar un cambio

```bash
# Backend
npm run push:api
cd apps/api && clasp create-deployment --deploymentId <ID_DEL_DESPLIEGUE> --description "qué cambia"

# PWA
git push          # las GitHub Actions hacen el resto
```

El `deploymentId` está en `.secrets.json`. Reutilizarlo es importante: mantiene la **misma URL** del backend, así que
no hay que tocar nada en el frontend.

---

## Si alguien editó el código en el editor web de Apps Script

Eso rompe la regla de "Git es la fuente de verdad". Procedimiento:

```bash
cd apps/api && clasp pull      # traer lo que haya
git diff                       # ver qué cambió
```

Incorpora el cambio al código fuente en `apps/api/src/`, recompila y vuelve a publicar. Nunca dejes que el editor web
y el repositorio diverjan.

---

## Migrar el esquema de datos

Cada fila guarda su propio `schemaVersion` y las columnas se leen por nombre, no por posición. Por lo tanto:

- **Añadir un campo** no requiere migración: se añade a `HEADERS` en `apps/api/src/config.ts` y a su validador en
  `packages/shared/src/entities.ts`. Las filas antiguas simplemente no lo tienen.
- **Cambiar el significado de un campo** sí requiere migración: añade una función en `migrations.ts`, súbele el
  número a `SCHEMA_VERSION` y deja que se aplique al leer. Nunca hay una migración masiva que pueda fallar a mitad.
- **Nunca** se renombra ni se reutiliza el nombre de un campo existente.

---

## Diagnosticar un fallo que reportó la usuaria

Si la app le mostró un código tipo `E-7F3A`:

1. Apps Script → **Ejecuciones**, busca ese código en los logs.
2. La hoja `_audit` tiene acción, resultado y duración de cada petición, **sin contenido de las notas ni datos
   personales**.
3. **Ajustes → Diagnóstico** en la app muestra la cola pendiente, el almacenamiento usado y los últimos cambios
   rechazados.

---

## Qué hacer si Sheets se queda corto

No va a pasar con este volumen (~6 000 filas al año frente a un límite de 10 millones de celdas), pero si algún día
ocurre: todo el acceso a datos está detrás de `apps/api/src/sheets.ts`. Cambiar a otro almacenamiento es reescribir
ese archivo, no la aplicación.
