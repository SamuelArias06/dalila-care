# Diseño de producto y pantallas

> Documento 4 de 9. Cubre **I** (UX) y los puntos 36–37 (visual, accesibilidad) y 54–57 (experiencia emocional).

---

## Lenguaje visual

### Paleta

Cálida, con contraste real. No rosa de app infantil, no azul de software clínico.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--bg` | `#FBF7F2` crema papel | `#17150F` | Fondo |
| `--surface` | `#FFFFFF` | `#221F19` | Tarjetas |
| `--surface-2` | `#F3EDE4` | `#2C2820` | Tarjetas secundarias |
| `--ink` | `#2A2622` | `#F2EDE6` | Texto principal |
| `--ink-soft` | `#6B6259` | `#A79D91` | Texto secundario (contraste ≥ 4.5:1) |
| `--accent` | `#3F6B52` verde salvia profundo | `#7FB295` | Acción principal, "hecho" |
| `--accent-soft` | `#E4EEE7` | `#22362B` | Fondos de estado positivo |
| `--warm` | `#C4703F` terracota | `#E0955F` | Acentos cálidos, destacados |
| `--alert` | `#A8443A` | `#E07F72` | Preocupación / urgencia (nunca rojo saturado) |
| `--rose` | `#F0DFDA` | `#3A2C29` | Momentos, afecto |

Regla: **el color nunca es el único portador de información.** Cada estado lleva icono + texto además de color.

### Tipografía

- Sistema nativo (`-apple-system`, SF Pro en iOS): carga instantánea, legibilidad óptima, se adapta al tamaño de
  texto del sistema.
- Escala con `rem` y respeta *Dynamic Type*. Nada en `px` fijo para texto.
- Base 17 px. Inputs nunca por debajo de 16 px (iOS hace zoom si no).
- Un solo peso extra (600) para títulos; sin fuentes decorativas.

### Forma y movimiento

- Radio 20 px en tarjetas, 14 px en botones, 999 px en chips.
- Sombras muy suaves y de baja opacidad; profundidad por color de superficie, no por sombra dura.
- Áreas táctiles ≥ 48×48 px reales, con separación ≥ 8 px.
- Transiciones 180–220 ms, `ease-out`. **Todas** desactivadas bajo `prefers-reduced-motion`.
- Una sola animación con carácter: el check de tarea completada (un trazo que se dibuja, 240 ms). Nada más rebota.

### Tono de voz

| En vez de | Decimos |
|---|---|
| "Registro guardado correctamente" | "Listo ✓" |
| "Error 500" | "No pudimos guardar. Tus cambios están seguros en este dispositivo y lo intentaremos de nuevo." |
| "Has perdido tu racha" | *(no existe)* |
| "Dalila empeoró un 23 %" | "Esta semana anotaste 2 días con más dificultad. La semana pasada fue 1." |
| "Cumplimiento: 87 %" | "Esta semana marcaste la medicación 13 de 14 veces." |
| "Nivel de dolor: 4/5" | "Signos de incomodidad observados: 3" |

Nunca se usan segundas personas acusatorias ("no registraste", "olvidaste"). Siempre en primera persona del plural o
neutro ("no hay registro de ayer").

---

## Pantallas

### 1. Onboarding

```
┌────────────────────────────────┐      ┌────────────────────────────────┐
│                                │      │                                │
│          ╭──────────╮          │      │   Para que funcione bien       │
│          │   🐾     │          │      │   en tu iPhone                 │
│          ╰──────────╯          │      │                                │
│                                │      │   1  Toca  ⬆️  abajo            │
│         Dalila Care            │      │   2  "Añadir a pantalla         │
│                                │      │       de inicio"                │
│   Un lugar tranquilo para      │      │   3  Ábrela desde el icono      │
│   cuidarla todos los días.     │      │                                │
│                                │      │   Así funciona sin conexión     │
│                                │      │   y se abre como una app.       │
│  ┌──────────────────────────┐  │      │                                │
│  │   Entrar con Google      │  │      │  ┌──────────────────────────┐  │
│  └──────────────────────────┘  │      │  │       Entendido          │  │
│                                │      │  └──────────────────────────┘  │
│  Tus datos se guardan en tu    │      │        Ahora no                │
│  propia cuenta de Google.      │      │                                │
└────────────────────────────────┘      └────────────────────────────────┘
```

Luego 4 pasos de una pregunta cada uno, con **"Ahora no"** siempre visible:

```
┌────────────────────────────────┐
│  ←                      1 de 4 │
│                                │
│   ¿Cómo se llama?              │
│                                │
│   ┌──────────────────────────┐ │
│   │ Dalila                   │ │
│   └──────────────────────────┘ │
│                                │
│        ╭────────────╮          │
│        │     📷     │          │
│        │  Añadir    │          │
│        │   foto     │          │
│        ╰────────────╯          │
│                                │
│  ┌──────────────────────────┐  │
│  │        Continuar         │  │
│  └──────────────────────────┘  │
│           Ahora no             │
└────────────────────────────────┘
```

---

### 2. Hoy — la pantalla principal

**Estado A — mañana, sin check-in todavía:**

```
┌────────────────────────────────────┐
│ ●●○ Todo guardado         ⚙        │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ ░░░░░ foto de Dalila ░░░░░░░ │  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │                              │  │
│  │  Buenos días ❤️              │  │
│  │  ¿Cómo amaneció Dalila?      │  │
│  └──────────────────────────────┘  │
│                                    │
│   😄      🙂      😐     😟     😣  │
│  Muy     Bien  Regular  Mal   Muy  │
│  bien                         mal  │
│                                    │
│  ──────────────────────────────    │
│  HOY · Martes 15 de septiembre     │
│                                    │
│  ○  08:00  🥣  Desayuno            │
│  ○  08:00  💊  Medicación mañana   │
│  ○  08:30  🐕  Caminata suave      │
│  ○  13:00  💧  Agua fresca         │
│  ○  18:00  🐕  Paseo               │
│  ○  20:00  🥣  Cena                │
│  ○  21:00  💊  Medicación noche    │
│  ○  21:30  🌙  Check-in nocturno   │
│                                    │
│  ┌────────────────────────────┐    │
│  │  ⚠️  Me preocupa algo       │    │
│  └────────────────────────────┘    │
├────────────────────────────────────┤
│  🏠      📅      ➕     ❤️     🐾   │
└────────────────────────────────────┘
```

**Estado B — media tarde, con progreso:**

```
│  ┌──────────────────────────────┐  │
│  │ ░░ foto ░░   🙂 Bien         │  │
│  │              toca para cambiar│  │
│  └──────────────────────────────┘  │
│                                    │
│  HOY · Martes 15 de septiembre     │
│  4 de 8 · vas bien                 │   ← nunca un %, nunca una barra de "cumplimiento"
│                                    │
│  ✓  08:05  🥣  Desayuno            │
│  ✓  08:10  💊  Medicación mañana   │
│  ✓  08:40  🐕  Caminata suave      │
│  ✓  13:15  💧  Agua fresca         │
│  ○  18:00  🐕  Paseo          ahora│
│  ○  20:00  🥣  Cena                │
```

Una tarea se marca con **un toque**. Mantener pulsado abre: añadir nota · posponer · omitir con motivo · editar tarea.

**Estado C — noche, resumen (punto 55):**

```
┌────────────────────────────────────┐
│                                    │
│      Hoy con Dalila                │
│      Martes 15 de septiembre       │
│                                    │
│   🙂  Estado general: Bien          │
│   🥣  Comió sus dos comidas         │
│   💊  Medicamentos completos        │
│   🐕  Caminó 18 minutos             │
│   💧  Hidratación normal            │
│   📹  Grabaste 1 vídeo              │
│                                    │
│   📝 "Por la tarde estuvo más       │
│       activa que ayer."             │
│                                    │
│   ─────────────────────────────    │
│                                    │
│        Descansen ❤️                 │
│                                    │
│  ┌──────────────────────────────┐  │
│  │   Añadir algo más            │  │
│  └──────────────────────────────┘  │
│           Cerrar                   │
└────────────────────────────────────┘
```

Si el día estuvo mal, el cierre cambia de tono pero nunca dramatiza:
*"Hoy fue un día difícil. Lo registraste, y eso ayuda. Mañana es otro día ❤️"*

---

### 3. Check-in diario

Una tarjeta por pregunta, **desplazamiento vertical**, todo opcional, guardado continuo. No hay botón "Enviar" que
pueda perderse: se guarda al tocar.

```
┌────────────────────────────────────┐
│  ←   Check-in                  ✓   │
│      Martes 15 de septiembre       │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ Cómo se movió hoy            │  │
│  │                              │  │
│  │ ( ) Mejor que otros días     │  │
│  │ (•) Normal para ella         │  │
│  │ ( ) Algo peor                │  │
│  │ ( ) Bastante peor            │  │
│  │                              │  │
│  │ ¿Notaste algo de esto?       │  │
│  │ ┌─────────┐ ┌──────────────┐ │  │
│  │ │Le costó │ │ Se resbaló   │ │  │
│  │ │levantar-│ └──────────────┘ │  │
│  │ │se    ✓  │ ┌──────────────┐ │  │
│  │ └─────────┘ │ Evitó subir  │ │  │
│  │ ┌─────────┐ └──────────────┘ │  │
│  │ │Tropezó  │  + Añadir        │  │
│  │ └─────────┘                  │  │
│  │                              │  │
│  │  + Añadir detalle            │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ Señales de incomodidad       │  │
│  │ Cosas que a veces se ven     │  │
│  │ cuando algo le molesta.      │  │
│  │                              │  │
│  │ ┌────────┐┌────────┐┌──────┐ │  │
│  │ │Jadeo   ││Inquieta││Le    │ │  │
│  │ │sin     ││        ││cuesta│ │  │
│  │ │calor   ││        ││acomo-│ │  │
│  │ └────────┘└────────┘│darse │ │  │
│  │                     └──────┘ │  │
│  │ ┌────────┐┌──────────┐       │  │
│  │ │Se lame ││Postura   │       │  │
│  │ │una zona││distinta  │       │  │
│  │ └────────┘└──────────┘       │  │
│  │                              │  │
│  │ ○ No noté nada de esto       │  │
│  └──────────────────────────────┘  │
│                                    │
│         … apetito, agua,           │
│         orina, heces, sueño,       │
│         ánimo, nota libre          │
└────────────────────────────────────┘
```

Detalles que importan:

- Cada grupo tiene **"No noté nada de esto"**: un no-hallazgo registrado vale tanto como un hallazgo. Sin esto no se
  puede distinguir "no pasó" de "no lo registró", y esa distinción es la que hace útil el resumen para el veterinario.
- Las secciones recuerdan la respuesta de ayer en gris claro como sugerencia tocable.
- **Nunca se pide "nivel de dolor 1-10".** Solo observaciones (ver [POLITICA_CONTENIDO_MEDICO.md](POLITICA_CONTENIDO_MEDICO.md)).

---

### 4. Registrar (hoja de acción rápida)

```
┌────────────────────────────────────┐
│                                    │
│         ────                       │
│                                    │
│   ¿Qué quieres registrar?          │
│                                    │
│   ┌────────┐ ┌────────┐ ┌────────┐ │
│   │   🙂   │ │   🥣   │ │   💊   │ │
│   │ Cómo   │ │ Comida │ │ Medi-  │ │
│   │ está   │ │        │ │ camento│ │
│   └────────┘ └────────┘ └────────┘ │
│   ┌────────┐ ┌────────┐ ┌────────┐ │
│   │   🐕   │ │   📹   │ │   📝   │ │
│   │ Paseo  │ │ Vídeo  │ │  Nota  │ │
│   │        │ │ o foto │ │        │ │
│   └────────┘ └────────┘ └────────┘ │
│   ┌────────┐ ┌────────┐ ┌────────┐ │
│   │   💧   │ │   🚽   │ │   ⚖️   │ │
│   │  Agua  │ │ Pipí / │ │  Peso  │ │
│   │        │ │  popó  │ │        │ │
│   └────────┘ └────────┘ └────────┘ │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  ⚠️  Me preocupa algo         │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

---

### 5. "Me preocupa algo"

Tres pasos. El tono es firme pero nunca alarmista.

```
PASO 1                              PASO 2
┌──────────────────────────────┐   ┌──────────────────────────────┐
│  ←  Me preocupa algo         │   │  ←  Cuéntame un poco más     │
│                              │   │                              │
│  ¿Qué notaste?               │   │  No quiere levantarse        │
│                              │   │                              │
│  ○ No quiere levantarse      │   │  ¿Desde cuándo?              │
│  ○ Camina muy diferente      │   │  ( ) Ahora mismo             │
│  ○ Se ve muy incómoda        │   │  (•) Desde esta mañana       │
│  ○ No quiere comer           │   │  ( ) Desde ayer              │
│  ○ Vomitó                    │   │  ( ) Varios días             │
│  ○ Diarrea                   │   │                              │
│  ○ Problema para orinar      │   │  ¿Pasa algo más? (opcional)  │
│  ○ Se cayó                   │   │  ┌────────┐┌────────┐        │
│  ○ Comportamiento extraño    │   │  │Tampoco ││ Jadea  │        │
│  ○ Otra cosa                 │   │  │ come   ││        │        │
│                              │   │  └────────┘└────────┘        │
│                              │   │                              │
│                              │   │  📹 Grabar un vídeo          │
│                              │   │  📝 Describir                │
└──────────────────────────────┘   └──────────────────────────────┘

PASO 3 — orientación
┌────────────────────────────────────┐
│                                    │
│   Registrado ✓                     │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  Esto merece que llames hoy  │  │
│  │  al veterinario.             │  │
│  │                              │  │
│  │  Que un perro no pueda o no  │  │
│  │  quiera levantarse es un     │  │
│  │  cambio que conviene valorar │  │
│  │  pronto, sobre todo si es    │  │
│  │  nuevo o va a más.           │  │
│  │                              │  │
│  │  ┌────────────────────────┐  │  │
│  │  │  📞 Llamar a la clínica │  │  │
│  │  └────────────────────────┘  │  │
│  │  ┌────────────────────────┐  │  │
│  │  │  🚨 Urgencias           │  │  │
│  │  └────────────────────────┘  │  │
│  │                              │  │
│  │  Esta orientación es general │  │
│  │  y no sustituye una          │  │
│  │  valoración veterinaria.     │  │
│  │  → De dónde viene esto       │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ Guardar como pregunta para   │  │
│  │ la próxima consulta          │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

"→ De dónde viene esto" abre la fuente concreta de esa regla. Cada mensaje de alarma es rastreable
(ver [RED_FLAGS.md](RED_FLAGS.md)).

---

### 6. Rutinas

```
┌────────────────────────────────────┐
│  ←  Rutinas                    ➕  │
│                                    │
│  MAÑANA                            │
│  ⠿ 🥣 Desayuno            08:00  ▸ │
│  ⠿ 💊 Medicación          08:00  ▸ │
│     recetado · Dra. Muñoz     🔒   │
│  ⠿ 🐕 Caminata suave      08:30  ▸ │
│                                    │
│  MEDIODÍA                          │
│  ⠿ 💧 Agua fresca         13:00  ▸ │
│                                    │
│  TARDE                             │
│  ⠿ 🐕 Paseo               18:00  ▸ │
│  ⠿ 🔥 Compresa tibia      19:00  ▸ │
│     lo sugirió la fisioterapeuta   │
│                                    │
│  NOCHE                             │
│  ⠿ 🥣 Cena                20:00  ▸ │
│  ⠿ 💊 Medicación          21:00  🔒│
│  ⠿ 🌙 Check-in            21:30  ▸ │
│                                    │
│  En pausa (1)                    ▾ │
└────────────────────────────────────┘
```

- `⠿` arrastra para reordenar. `🔒` marca tareas ligadas a una receta: se pueden pausar, pero al intentar eliminarlas
  la app pregunta *"¿El veterinario indicó suspenderla?"* y ofrece registrarlo como cambio en el plan, en vez de
  borrarlo sin dejar rastro (punto 57).
- Crear una tarea pregunta siempre **"¿quién lo recomendó?"**: veterinario / fisioterapeuta / yo. Ese dato aparece
  después en el reporte y contesta la pregunta "¿por qué hacemos esto?".

---

### 7. Alimentación

```
┌────────────────────────────────────┐
│  ←  Alimentación               ➕  │
│                                    │
│  PLAN ACTUAL                       │
│  ┌──────────────────────────────┐  │
│  │ 🥣 Concentrado senior X       │  │
│  │    2 tazas · mañana y noche   │  │
│  │    Indicado por Dra. Muñoz    │  │
│  │    Desde el 3 de agosto       │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ 🐟 Sardina en agua            │  │
│  │    Media lata · lunes y jueves│  │
│  │    "Por el omega-3"           │  │
│  │    Decisión propia            │  │
│  │    Bien tolerada (12 de 12)   │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ 🫐 Arándanos                  │  │
│  │    Un puñado · a veces        │  │
│  │    ⚠️ 1 de 6 veces con         │  │
│  │       heces blandas después   │  │
│  └──────────────────────────────┘  │
│                                    │
│  HISTÓRICO                         │
│  Concentrado adulto Y              │
│  hasta el 3 de agosto           ▸  │
└────────────────────────────────────┘
```

La nota de tolerancia es **descriptiva y honesta**: dice cuántas veces de cuántas, no "le sienta mal". Con 6
observaciones no se puede concluir causalidad, y la app no lo hace.

Al añadir un alimento, si coincide con la lista de alimentos peligrosos, aparece **antes de guardar**:

```
  ⚠️  Las uvas y las pasas pueden causar
      daño renal en perros, incluso en
      cantidades pequeñas.
      Fuente: ASPCA Animal Poison Control

      [ Entendido, no lo añado ]
      [ Añadirlo de todas formas ]
```

Informa; no prohíbe. Y registra que se mostró el aviso.

---

### 8. Medicamentos

```
┌────────────────────────────────────┐
│  ←  Medicamentos               ➕  │
│                                    │
│  ACTIVOS                           │
│  ┌──────────────────────────────┐  │
│  │ 💊 [Nombre del medicamento]   │  │
│  │    "1 tableta cada 24 h       │  │
│  │     con comida"               │  │
│  │    Dra. Muñoz · desde 12 ago  │  │
│  │                              │  │
│  │    Últimos 7 días             │  │
│  │    ✓ ✓ ✓ ⏰ ✓ ✓ ○            │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  Registrar toma de ahora     │  │
│  └──────────────────────────────┘  │
│                                    │
│  HISTÓRICO                         │
│  [Medicamento anterior]            │
│  12 jul – 12 ago · suspendido      │
│  por indicación veterinaria     ▸  │
└────────────────────────────────────┘
```

Al registrar una toma: `✅ Administrado` · `⏰ Tarde` · `❌ Omitido` · `🤢 Posible reacción`.
Si marca posible reacción, la app **no interpreta**: guarda, sugiere describirlo o grabarlo, y ofrece
*"Guardar como pregunta para la consulta"* y, según el caso, recomienda contactar al veterinario.

Al añadir un medicamento, texto fijo en la pantalla:

> Escribe aquí exactamente lo que indicó el veterinario. Esta app no calcula dosis ni sugiere medicamentos.

---

### 9. Vídeos y línea de tiempo visual

```
┌────────────────────────────────────┐
│  ←  Vídeos                     📹  │
│                                    │
│  ⏳ 1 vídeo pendiente de subir     │
│     Se subirá cuando haya conexión │
│                                    │
│  SEPTIEMBRE                        │
│  ┌──────────┐ ┌──────────┐         │
│  │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│         │
│  │▓ 0:14  ▓▓│ │▓ 0:09  ▓▓│         │
│  └──────────┘ └──────────┘         │
│   15 sep       15 sep              │
│   Caminando    Levantarse          │
│   "Amaneció                        │
│    rígida"                         │
│  ┌──────────┐ ┌──────────┐         │
│  │▓▓▓▓▓▓▓▓▓▓│ │▓▓ ⏳ ▓▓▓▓│         │
│  │▓ 0:20  ▓▓│ │▓▓▓▓▓▓▓▓▓▓│         │
│  └──────────┘ └──────────┘         │
│   12 sep       11 sep              │
│   Caminando    Episodio            │
│   "Mejor que                       │
│    el lunes"                       │
│                                    │
│  Comparar dos vídeos            ▸  │
└────────────────────────────────────┘
```

Al grabar, la app propone la categoría pero **nunca obliga**:
*Caminando de frente · de lado · desde atrás · Levantarse · Sentarse · Episodio · Libre*

Y da una guía breve y opcional de cómo grabar para que sirva de verdad: buena luz, superficie no resbalosa, cámara a
la altura de ella, 10–20 segundos, misma toma cada vez. **Siempre dentro de lo que el veterinario haya autorizado**;
la app no pide nunca que haga subir escaleras ni ninguna maniobra que pueda doler.

---

### 10. Historial

```
┌────────────────────────────────────┐
│  Historial          Tendencias  🩺 │
│                                    │
│  ─── Esta semana ───               │
│                                    │
│  MARTES 15 SEP              hoy    │
│  🙂 Bien                           │
│  🥣 Comió todo   💊 Completos      │
│  🐕 18 min       📹 2 vídeos       │
│  📝 "Le costó levantarse después   │
│      de dormir."                ▸  │
│                                    │
│  LUNES 14 SEP                      │
│  😐 Regular                        │
│  🥣 Comió 80%    💊 Completos      │
│  🐕 10 min                         │
│  ⚠️ Preocupación registrada     ▸  │
│                                    │
│  DOMINGO 13 SEP                    │
│  🙂 Bien                           │
│  ❤️ "Quiso jugar con su pelota"    │
│                                 ▸  │
│                                    │
│  SÁBADO 12 SEP                     │
│  Sin registro                      │
│  + Añadir algo de este día         │
└────────────────────────────────────┘
```

"Sin registro" se muestra en gris, sin icono de alerta y sin juicio, con una invitación amable a completarlo.

---

### 11. Tendencias

```
┌────────────────────────────────────┐
│  ←  Tendencias        7d 14d [30d] │
│                                    │
│  ASÍ HA ESTADO DALILA              │
│                                    │
│  Muy bien  ▓▓                      │
│  Bien      ▓▓▓▓▓▓▓▓▓▓▓             │
│  Regular   ▓▓▓▓▓                   │
│  Mal       ▓▓                      │
│  Muy mal                           │
│  Sin dato  ▓▓▓▓                    │
│                                    │
│  Del 17 ago al 15 sep · 24 días    │
│  registrados de 30                 │
│                                    │
│  ──────────────────────────────    │
│  MOVILIDAD                         │
│                                    │
│  Días con dificultad anotada       │
│                                    │
│   Sem 1  ▓▓                   2    │
│   Sem 2  ▓                    1    │
│   Sem 3  ▓▓▓▓                 4    │
│   Sem 4  ▓▓▓                  3    │
│                                    │
│  ──────────────────────────────    │
│  PESO                              │
│   33.4 ●───●                       │
│         33.2 ●──────●              │
│                    32.8            │
│   17ago  31ago  7sep  14sep        │
│   Peso objetivo indicado: 31 kg    │
│                                    │
│  ──────────────────────────────    │
│  Estos números describen lo que    │
│  registraste. No explican por qué  │
│  pasó ni si un tratamiento está    │
│  funcionando.                      │
└────────────────────────────────────┘
```

Esa última nota es permanente. Es la barrera que impide que la app se convierta en un oráculo (puntos 14 y 56).

---

### 12. Preparar consulta

```
┌────────────────────────────────────┐
│  ←  Preparar consulta              │
│                                    │
│  Cita: 22 de septiembre, 10:00     │
│  Dra. Muñoz · Clínica X            │
│                                    │
│  Periodo a incluir                 │
│  [ Últimos 30 días          ▾ ]    │
│                                    │
│  Qué incluir                       │
│  ☑ Datos de Dalila                 │
│  ☑ Diagnósticos                    │
│  ☑ Medicamentos y cumplimiento     │
│  ☑ Peso                            │
│  ☑ Estado general y movilidad      │
│  ☑ Apetito y digestivo             │
│  ☑ Eventos y preocupaciones        │
│  ☑ Alimentación                    │
│  ☑ Preguntas (3)                   │
│  ☑ Vídeos (4 de 11 seleccionados)  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │      Ver resumen             │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  Compartir con la clínica    │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

El resumen generado está especificado en [REPORTE_VETERINARIO.md](REPORTE_VETERINARIO.md).

---

### 13. Momentos ❤️

```
┌────────────────────────────────────┐
│  Momentos                      ➕  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ ░░░░░░░░ foto ░░░░░░░░░░░░░░ │  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │                              │  │
│  │ "Hoy quiso jugar con su      │  │
│  │  pelota otra vez."           │  │
│  │  13 de septiembre            │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────┐ ┌──────────┐         │
│  │░░ foto ░░│ │░░ foto ░░│         │
│  └──────────┘ └──────────┘         │
│  "Durmió toda  "Nos recibió        │
│   la tarde      moviendo           │
│   al sol"       la cola"           │
└────────────────────────────────────┘
```

Esta pantalla **no muestra ningún dato clínico**. Ni estado, ni medicación, ni síntomas. Es deliberado.

---

### 14. Perfil de Dalila

```
┌────────────────────────────────────┐
│  Dalila                        ⚙   │
│                                    │
│        ╭──────────────╮            │
│        │░░░░ foto ░░░░│            │
│        ╰──────────────╯            │
│           Dalila                   │
│     Golden Retriever · 7 años      │
│           32.8 kg                  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 🚨 Urgencias                 │  │
│  │    Clínica X · 300 000 0000  │  │
│  └──────────────────────────────┘  │
│                                    │
│  🩺 Salud                       ▸  │
│  💊 Medicamentos (2)            ▸  │
│  🥣 Alimentación                ▸  │
│  📋 Rutinas                     ▸  │
│  🗒 Plan veterinario            ▸  │
│  ❓ Preguntas (3)               ▸  │
│  📅 Citas                       ▸  │
│  📎 Documentos                  ▸  │
│  ⚙️ Ajustes                     ▸  │
└────────────────────────────────────┘
```

El botón de urgencias está siempre a un toque desde el perfil y desde "Me preocupa algo". Es el único elemento de la
app con color de alerta permanente.

---

## Microinteracciones y momentos positivos

Pocos, bien elegidos y nunca condescendientes:

- **Rutina completa:** el encabezado cambia a *"Dalila tuvo su rutina completa hoy ❤️"* con un fondo cálido suave.
  Sin confeti, sin sonido, sin medalla.
- **Primer vídeo:** *"Guardado. Dentro de unas semanas podrás comparar cómo caminaba hoy."*
- **Día 7:** *"Llevas una semana de registros. Esto va a servir mucho en la próxima consulta."*
- **Tras un día difícil:** *"Hoy fue un día difícil. Lo registraste, y eso ayuda."*
- **Vuelve tras varios días sin abrir:** *"Qué bueno verte. ¿Quieres añadir algo de estos días?"* — nunca
  *"llevas 5 días sin registrar"*.
- **Sin conexión:** una línea discreta arriba, nunca un modal que bloquee.

Lo que **no** existe, por decisión explícita (punto 54): rachas, porcentajes de salud, puntuaciones, comparativas con
otros perros, badges, recordatorios que insistan, y cualquier frase que sugiera que ella lo está haciendo mal.

## Accesibilidad (punto 37)

- Contraste ≥ 4.5:1 en todo el texto; ≥ 3:1 en iconografía significativa. Validado en claro y oscuro.
- Texto escalable hasta 200 % sin romper el diseño (layouts fluidos, sin alturas fijas).
- Estados nunca solo por color: siempre icono + etiqueta.
- Áreas táctiles ≥ 48 px, con margen.
- Todo navegable con VoiceOver: `aria-label` en cada control, orden de foco lógico, anuncios en cambios de estado.
- `prefers-reduced-motion` y `prefers-color-scheme` respetados de verdad.
- Los emojis son decorativos (`aria-hidden`) y siempre acompañados de texto.
