# Reporte para el veterinario

> Especificación del entregable del punto 47. Se implementa en el Sprint 12.

## Principios

- **Un veterinario le dedicará entre 30 y 90 segundos.** Todo lo importante cabe en la primera página.
- **Datos, nunca conclusiones.** Ver [POLITICA_CONTENIDO_MEDICO.md](POLITICA_CONTENIDO_MEDICO.md).
- **Siempre el denominador.** "11 de 24 días registrados", nunca "11 días" a secas.
- **Legible impreso en blanco y negro.** Nada depende del color.
- Formatos: vista en pantalla · imprimible (`@media print`) · PDF · texto plano para pegar en WhatsApp.

---

## Estructura

```
────────────────────────────────────────────────────────────
  DALILA · Golden Retriever · 7 años · hembra
  Resumen del 17 de agosto al 15 de septiembre de 2026
  Registros en 24 de 30 días
  Preparado por [nombre] · 15/09/2026
────────────────────────────────────────────────────────────

DIAGNÓSTICOS REGISTRADOS
  Espondilosis / espondiloartrosis
  Radiografía · Dra. Muñoz · 12 ago 2026

MEDICACIÓN ACTUAL
  [Medicamento]   "1 tableta cada 24 h con comida"
                  Dra. Muñoz · desde el 12 ago
                  Tomas registradas: 27 de 30 días
                  Omitidas: 2 (14 y 22 ago) · Tarde: 1

  Cambios en el periodo: ninguno

PESO
  17 ago  33.4 kg   (casa)
  31 ago  33.2 kg   (clínica)
   7 sep  33.0 kg   (casa)
  14 sep  32.8 kg   (casa)
  Peso objetivo indicado: 31 kg   BCS 7/9 (Dra. Muñoz, 12 ago)

────────────────────────────────────────────────────────────
ESTADO GENERAL   (24 días con registro)

  Muy bien    2  ██
  Bien       11  ███████████
  Regular     7  ███████
  Mal         3  ███
  Muy mal     1  █
  Sin dato    6

  Semana 1 (17–23 ago)   4 bien · 2 regular · 1 sin dato
  Semana 2 (24–30 ago)   5 bien · 1 regular · 1 mal
  Semana 3 (31 ago–6 sep) 2 bien · 2 regular · 1 mal · 2 sin dato
  Semana 4 (7–13 sep)    2 bien · 2 regular · 1 mal · 2 sin dato

MOVILIDAD

  Días con alguna dificultad anotada:  9 de 24
    Semana 1: 1    Semana 2: 2    Semana 3: 3    Semana 4: 3

  Observaciones más frecuentes:
    Le costó levantarse ................ 8 días
    Rigidez al empezar a caminar ....... 6 días
    Se resbaló en piso liso ............ 3 días
    Evitó subir ........................ 2 días
    Arrastró las uñas .................. 1 día  (11 sep)   ⚠

  ⚠ marca observaciones que la cuidadora anotó por primera vez en el periodo.

SIGNOS DE INCOMODIDAD OBSERVADOS

  Días con al menos un signo anotado:  11 de 24
    Inquietud / no encuentra postura ... 7 días
    Jadeo sin calor ni ejercicio ....... 4 días
    Se lame la cadera derecha .......... 3 días
    Vocalizó ........................... 1 día

APETITO E INGESTA
  Normal 19 · Comió menos 4 · No quiso comer 1 (2 sep)
  Agua: normal 21 · más 2 · menos 1

ORINA Y HECES
  Orina: normal 23 · 1 accidente en casa (5 sep)
  Heces: normal 20 · blandas 3 · sin registro 1
  Sin sangre visible en ningún registro.

ACTIVIDAD
  Paseos registrados: 22 · duración media 14 min (rango 5–25)
  Necesitó detenerse: 3 paseos
  Necesitó ayuda: 0

ALIMENTACIÓN
  Principal:    Concentrado senior X · 2 tazas · mañana y noche
                Indicado por Dra. Muñoz · desde el 3 ago
  Complementos: Sardina en agua, media lata, lunes y jueves (decisión de la cuidadora)
                Arándanos, ocasional (decisión de la cuidadora)
  Cambios:      El 3 de agosto se cambió desde "Concentrado adulto Y"

  Registro de tolerancia:
    Sardina    12 de 12 sin reacción anotada
    Arándanos   5 de 6 sin reacción · 1 vez heces blandas después (9 sep)

────────────────────────────────────────────────────────────
EVENTOS Y PREOCUPACIONES REGISTRADOS

  2 sep   No quiso comer en todo el día. Decaída por la tarde.
          La app sugirió contactar al veterinario. Se llamó a la clínica.

  11 sep  Al levantarse arrastró las uñas de la pata trasera izquierda.
          Duró unos segundos. Vídeo adjunto.

  14 sep  Le costó mucho levantarse por la mañana. Mejoró tras caminar.

VÍDEOS SELECCIONADOS (4)

  1.  18 ago  Caminando de lado     0:12   "Día bueno, de referencia"
  2.  11 sep  Levantarse            0:09   "Arrastró las uñas"
  3.  11 sep  Caminando desde atrás 0:14
  4.  14 sep  Levantarse            0:11   "Comparar con el del 11"

  [enlaces / QR]   Acceso compartido con: [correo de la clínica]

────────────────────────────────────────────────────────────
PREGUNTAS

  1. ¿Podemos aumentar la duración de las caminatas?
  2. ¿Lo que anoté el 11 de septiembre (arrastrar las uñas) es algo que
     debamos vigilar de forma especial?
  3. ¿Mantenemos el suplemento que empezamos en agosto?

NOTAS DE LA CUIDADORA
  "Las mañanas frías parecen costarle más, pero no estoy segura."

────────────────────────────────────────────────────────────
  Generado por Dalila Care el 15/09/2026.
  Contiene observaciones registradas en casa por la cuidadora.
  No constituye una valoración clínica.
────────────────────────────────────────────────────────────
```

---

## Notas de implementación

- **El marcador ⚠ señala "primera vez en el periodo", no gravedad.** Es la única marca interpretativa del reporte, y
  es puramente factual: este signo no aparecía antes. Lo que significa lo decide el veterinario.
- La comparación semanal se muestra como **conteos por semana**, nunca como flechas de tendencia ni porcentajes de
  cambio.
- Los signos se ordenan por frecuencia, y solo se listan los que aparecieron **al menos una vez** (no hay ceros que
  llenen la página).
- Los eventos se incluyen **con el texto literal de ella**, sin resumir ni reinterpretar.
- La sección de vídeos incluye enlaces solo si se ha compartido con la clínica; si no, se listan con fecha para verlos
  en el móvil durante la consulta.
- El PDF se genera en el backend (`HtmlService` → `getAs('application/pdf')`), se guarda en
  `Dalila Care/Exportaciones/` y se comparte desde ahí.
- La versión de texto plano contiene las mismas secciones sin arte ASCII, para pegar en WhatsApp o correo.
