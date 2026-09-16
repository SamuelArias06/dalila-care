# Seguridad y privacidad

> Documento 8 de 9. Cubre **L** y los puntos 33, 43 y 45.

---

## Modelo de amenazas (realista, no teatral)

Esto es una app para dos personas y una perra. El modelo de amenazas es corto y honesto:

| Amenaza | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Alguien encuentra la URL del backend y accede a los datos | **Alta** si no hay autenticación (las URLs de Apps Script son adivinables/compartibles) | Alto | Autenticación obligatoria en **todas** las acciones + lista blanca de correos |
| Un vídeo de Drive queda públicamente accesible | Media si se usan enlaces "cualquiera con el enlace" | Medio-alto | Por defecto nunca se hacen públicos; compartir es por correo y revocable |
| Pérdida de datos (borrado accidental, hoja corrompida) | Media | Alto | Borrado suave + backup diario + papelera de Drive |
| Fuga de un token OAuth al cliente | Baja | Medio | Alcance mínimo (`drive.file`), vida corta, y solo tras autenticar |
| Robo del iPhone | Baja | Medio | Los datos locales solo son accesibles tras desbloquear el dispositivo; sesión revocable desde el servidor |
| Ataque dirigido por un actor sofisticado | **Muy baja** | — | No es un objetivo de este proyecto |

**Lo que NO vamos a hacer:** cifrado extremo a extremo, rotación automática de claves, HSM, auditorías de terceros.
Sería complejidad sin beneficio real aquí, y contradice tu punto 60.

---

## Dónde viven los datos

**Recomendación: una cuenta de Google dedicada** (por ejemplo `dalila.care.xxxx@gmail.com`), que es dueña de:

- el proyecto de Apps Script,
- la hoja de cálculo,
- la carpeta de Drive con todos los archivos.

### Por qué una cuenta dedicada y no la tuya ni la de ella

| Opción | Problema |
|---|---|
| Tu cuenta personal | Si tú desapareces del proyecto o cambias de cuenta, ella se queda sin sus datos. Además, los datos de la perra **de ella** están bajo tu control. |
| La cuenta personal de ella | Es lo más correcto en cuanto a propiedad, pero cualquier trasteo tuyo de desarrollo se hace con acceso total a su cuenta personal (su Gmail, su Drive, sus fotos). Incómodo y arriesgado. |
| **Cuenta dedicada compartida** ✅ | Contenedor limpio: solo contiene Dalila Care. Se le puede dar acceso a quien haga falta, se puede transferir entera, y ningún desarrollo toca datos personales de nadie. |

Ambos tenéis las credenciales de esa cuenta (con verificación en dos pasos y códigos de respaldo guardados). Si algún
día el proyecto se acaba, ella se queda con la cuenta: dentro está todo, legible sin la app (una hoja de cálculo y
carpetas con vídeos con nombres descriptivos).

> **Decisión para ti** → ver [DECISIONES.md](DECISIONES.md#d1).

---

## Autenticación

### El problema de fondo

Apps Script ofrece "Solo yo" / "Cualquiera con cuenta de Google" / "Cualquiera". Parecería que
*"Cualquiera con cuenta de Google"* es lo que queremos, pero **no sirve en esta arquitectura**: cuando la PWA (en otro
origen) llama con `fetch`, Google responde con una redirección a una página de login que el navegador no puede
completar dentro de una petición de datos → falla siempre.

Por eso el despliegue es **"Ejecutar como: yo (la cuenta de datos)" + "Quién tiene acceso: Cualquiera"**, y la
autenticación la hacemos nosotros. Sin esa autenticación, **cualquiera con la URL leería todo**. Es el requisito de
seguridad número uno del proyecto.

### El flujo

```
1. La PWA muestra "Entrar con Google" (Google Identity Services)
       ↓
2. Google devuelve un ID token (JWT firmado por Google)
       ↓
3. La PWA lo envía al backend:  { action: "auth.login", idToken: "..." }
       ↓
4. Apps Script lo verifica llamando a
   https://oauth2.googleapis.com/tokeninfo?id_token=...
   y comprueba:
     · iss  = accounts.google.com
     · aud  = nuestro Client ID    ← imprescindible; sin esto, un token
                                      emitido para otra app serviría para entrar
     · exp  no ha pasado
     · email_verified = true
     · email ∈ lista blanca (PropertiesService)
       ↓
5. Si todo encaja, el backend emite su propio token de sesión:
      payload = { email, exp, jti }
      firma   = HMAC-SHA256(payload, SESSION_SECRET de PropertiesService)
       ↓
6. La PWA lo guarda en IndexedDB y lo incluye en el cuerpo de cada petición.
   Vigencia 30 días con renovación deslizante. Revocable desde el servidor.
```

Notas:

- La verificación se hace contra el endpoint de Google (una llamada HTTPS) en lugar de validar la firma RSA a mano:
  más simple, menos código criptográfico propio, y `UrlFetchApp` tiene cuota de sobra. El resultado se cachea 5
  minutos en `CacheService`.
- El token de sesión evita una llamada a Google en cada petición.
- La lista blanca de correos vive en `PropertiesService`, **no en el código**, y se puede cambiar sin desplegar.
- El `Client ID` de OAuth **no es un secreto** (es público por diseño); el `SESSION_SECRET` **sí lo es** y nunca sale
  de `PropertiesService`.
- Revocar el acceso de alguien = quitar su correo de la lista blanca. Efecto inmediato en la siguiente petición.

### Permisos por persona

Dos roles desde V1, aunque al principio ambos sean equivalentes:

| Rol | Puede |
|---|---|
| `caregiver` (ella) | Todo lo relativo al cuidado |
| `admin` (tú) | Lo mismo + pantalla de diagnóstico, exportaciones completas, gestión de la lista blanca |

La pantalla de diagnóstico **no aparece en la navegación** para `caregiver`. No es seguridad por oscuridad —el backend
comprueba el rol en cada acción— sino diseño: ella no debería ver nunca una pantalla de logs.

---

## Alcances OAuth (mínimo privilegio)

`appsscript.json` declara **solo** lo necesario:

```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/script.external_request"
  ]
}
```

La decisión importante es **`drive.file` en lugar de `drive`**: `drive.file` da acceso **únicamente a los archivos y
carpetas que la propia app ha creado**. Aunque un token se filtrara, no da acceso al resto del Drive de esa cuenta.
Es la diferencia entre "una llave de una habitación" y "la llave maestra del edificio".

Consecuencia práctica: **la app debe crear ella misma sus carpetas y su hoja de cálculo** en el primer arranque. No se
puede seleccionar a mano una carpeta preexistente. Vale la pena.

`https://www.googleapis.com/auth/calendar` se añadirá solo cuando se implementen los recordatorios (V1.1).

---

## Validación y sanitización (punto 43)

**La misma validación corre en cliente y en servidor.** Esa es la razón principal de que `packages/shared` exista y de
que el backend se compile con esbuild en lugar de escribirse a mano en el editor de Apps Script.

```
packages/shared/schema.ts
        │
        ├──► apps/web   : feedback inmediato, evita viajes inútiles
        └──► apps/api   : LA de verdad. Nunca confía en el cliente.
```

En el servidor, para cada acción:

1. **Autenticación** — token válido, email en lista blanca, rol suficiente.
2. **Forma** — la acción existe y el payload cumple el esquema (campos, tipos, enums, longitudes máximas).
3. **Semántica** — fechas plausibles (no en el futuro lejano, no antes del nacimiento), referencias que existen,
   transiciones de estado válidas.
4. **Escritura** — dentro de `LockService.getScriptLock()`, idempotente por `clientRequestId`.

Otras defensas:

- **Longitudes máximas** en todo campo de texto (notas 4 000 caracteres, títulos 120). Sin esto, una celda de Sheets
  puede llegar a 50 000 caracteres y degradar la hoja.
- **Ningún texto se interpreta como HTML.** La PWA renderiza como texto (Preact escapa por defecto); nada de
  `dangerouslySetInnerHTML`, nunca.
- **Protección contra fórmulas en Sheets:** un texto que empiece por `=`, `+`, `-` o `@` se escribe precedido de un
  apóstrofo. Si no, escribir `=IMPORTXML(...)` en una nota convierte la hoja de cálculo en un vector de exfiltración.
  Es la vulnerabilidad clásica y específica de usar Sheets como base de datos.
- **Subidas:** MIME en lista blanca (`video/mp4`, `video/quicktime`, `image/jpeg`, `image/png`, `image/heic`,
  `application/pdf`), tamaño máximo por archivo (200 MB) y cuota diaria; el nombre del archivo se normaliza y nunca se
  usa tal cual; al confirmar la subida, el backend **verifica contra Drive** que el archivo existe y que su tamaño y
  MIME coinciden con lo declarado.
- **Límite de peticiones**: contador por sesión en `CacheService`; si algo se dispara, se corta y se registra.
- **CSRF:** no aplica de forma clásica, porque no usamos cookies. La sesión va en el cuerpo de la petición, así que
  una petición desde otro sitio no lleva credenciales automáticamente. Esto es una ventaja accidental del diseño.

---

## Secretos

| Secreto | Dónde vive | Nunca |
|---|---|---|
| `SESSION_SECRET` | `PropertiesService` (script properties) | En el repositorio, ni en el frontend |
| `ALLOWED_EMAILS` | `PropertiesService` | En el código |
| `SHEET_ID`, `ROOT_FOLDER_ID` | `PropertiesService` | En el frontend |
| `OAUTH_CLIENT_ID` | En el frontend (es público por diseño) | — |
| URL del Web App | En el frontend | — |
| `.clasp.json` (scriptId) | Local, en `.gitignore` | En el repositorio |

El repositorio **puede ser público sin riesgo**. Eso es intencional: permite usar GitHub Pages gratis y obliga a que
nunca haya un secreto en el código.

---

## Privacidad

- **Cero terceros.** No hay analítica, ni Sentry, ni fuentes de Google Fonts, ni CDN externos. La PWA solo habla con
  dos dominios: el suyo y `googleapis.com`/`script.google.com`.
- **Los datos no salen** de la cuenta de Google que controláis. No hay servidor intermedio nuestro.
- **Los archivos nunca son públicos por defecto.**
- **Compartir es explícito, nominal y revocable.** Cada compartición se registra (con quién, qué, cuándo) y hay un
  botón de revocar. Los enlaces públicos temporales llevan aviso visible y recordatorio a los 7 días.
- **Logs sin datos sensibles.** El registro de auditoría guarda acción, entidad, id y resultado — **nunca el contenido
  de las notas, ni nombres de medicamentos, ni correos completos** (se guarda un hash corto cuando hace falta
  distinguir actores).
- **Exportar y borrar** están en Ajustes desde V1.1. Ella puede llevarse todo y puede borrarlo todo.

---

## Observabilidad (punto 45)

Sin montar infraestructura:

- **Hoja `_AuditLog`** append-only: `at, actor, action, entity, entityId, result, errorCode, durationMs`. Rotación
  automática a los 90 días.
- **Errores del servidor** al log de Apps Script (`console.error`) con un `errorId` corto que **también se le muestra
  a la usuaria** en el mensaje amable: *"Si vuelve a pasar, dile a Samuel el código E-7F3A."* Esto convierte un
  reporte de fallo inútil en uno útil, sin exponer nada.
- **Pantalla de diagnóstico** (solo `admin`): última sincronización, elementos en la cola, tamaño de las hojas, último
  backup y su resultado, versión desplegada del backend y del frontend, últimos 20 errores.
- **Frontend:** los errores no capturados se guardan localmente en IndexedDB (últimos 50) y se pueden enviar desde la
  pantalla de diagnóstico. **No se envían automáticamente.**

---

## Respaldo y recuperación

Detallado en [DATA_MODEL.md](DATA_MODEL.md#backups-punto-41). Resumen: export JSON diario + copia semanal de la hoja +
verificación de número de filas + exportación manual a un clic. Drive añade su papelera de 30 días.

**Procedimiento de restauración documentado** (y probado una vez antes de dar V1 por terminada — un backup que nunca
se ha restaurado no es un backup):

1. Restaurar la copia de la hoja desde `Exportaciones/`.
2. Actualizar `SHEET_ID` en `PropertiesService`.
3. Verificar el recuento de filas contra el último registro de backup.
4. Los archivos de Drive no se tocan: la hoja solo guarda sus IDs.

---

## Reglas operativas (punto 61)

- Git es la fuente de verdad. **No se edita código en el editor web de Apps Script**, salvo emergencia — y después se
  hace `clasp pull` y se commitea inmediatamente, tratándolo como un incidente.
- Dos entornos separados (`DEV` / `PROD`) con hoja y carpeta de Drive distintas. **Nunca se prueba contra los datos
  reales de Dalila.**
- No se modifican datos de producción a mano, salvo procedimiento documentado y con backup previo.
- Los despliegues salen de `main`, con tests en verde.
- Cada funcionalidad se termina antes de empezar la siguiente.
