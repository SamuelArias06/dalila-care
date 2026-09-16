# Política de señales de alarma

> Documento 6 de 9. Cubre **K** y el punto 21.

---

## Principios

1. **Tres niveles, no dos.** Un sistema binario ("normal" / "corre al veterinario") produce alarmismo o, peor,
   indiferencia. Tres niveles permiten que el mensaje sea proporcional.
2. **Cada regla tiene un `ruleId` y una fuente.** La interfaz siempre ofrece "→ De dónde viene esto".
3. **Las reglas describen la acción, nunca la causa.** Decimos *"esto merece valoración veterinaria hoy"*, jamás
   *"esto puede ser una torsión gástrica"*. Nombrar la enfermedad asusta y además puede equivocarse.
4. **Ante la duda, subir de nivel.** El coste de una llamada innecesaria al veterinario es bajo; el de una urgencia
   no detectada, no.
5. **El texto nunca culpa.** Ni "deberías haber...", ni "es urgente que actúes YA".
6. **Todo disparo se registra** (`triageLevel`, `triageRuleId`, `triageShownAt`) para poder revisar después si la
   regla acertó y corregirla.

---

## Los tres niveles

| Nivel | Etiqueta en la app | Mensaje tipo | Acción ofrecida |
|---|---|---|---|
| 🟢 **Observar** | *"Queda registrado"* | "Anotado. Si se repite o va a más, coméntalo con tu veterinario." | Guardar como pregunta para la consulta |
| 🟡 **Consultar pronto** | *"Esto merece valoración veterinaria"* | "Este cambio conviene que lo valore tu veterinario en los próximos días." | Llamar a la clínica · guardar pregunta · programar cita |
| 🟠 **Contactar hoy** | *"Llama hoy a tu veterinario"* | "Por lo que registraste, conviene que hables con tu veterinario hoy." | 📞 Llamar a la clínica · 🚨 Urgencias |
| 🔴 **Urgencia** | *"Busca atención veterinaria urgente"* | "Esto necesita atención veterinaria ahora. Si tu clínica está cerrada, acude a urgencias." | 🚨 Urgencias (número guardado en el perfil) |

El nivel rojo es visualmente distinto (fondo `--alert` sólido, ocupa la pantalla) y **no se puede descartar por
accidente**: requiere tocar "Entendido".

---

## Reglas rojas — urgencia veterinaria inmediata

Estos son signos ampliamente reconocidos como emergencias en la literatura veterinaria de urgencias. La app los trata
como disparadores directos, sin combinaciones ni umbrales.

| ruleId | Disparador | Texto mostrado |
|---|---|---|
| `RF-R01` | **Intenta vomitar sin sacar nada + abdomen hinchado o duro** (con o sin inquietud, babeo, debilidad) | "Esto necesita atención veterinaria **ahora mismo**. No esperes a ver si mejora." |
| `RF-R02` | **No puede levantarse ni mover las patas traseras** (parálisis, no solo dificultad) | "Busca atención veterinaria urgente." |
| `RF-R03` | **Colapso o pérdida de conciencia** | "Busca atención veterinaria urgente." |
| `RF-R04` | **Dificultad para respirar** (respiración con esfuerzo, cuello estirado, lengua o encías azuladas) | "Busca atención veterinaria urgente." |
| `RF-R05` | **Encías pálidas, blancas o azuladas** | "Busca atención veterinaria urgente." |
| `RF-R06` | **Convulsiones**, o varias seguidas | "Busca atención veterinaria urgente." |
| `RF-R07` | **Intenta orinar sin conseguirlo** repetidamente | "Busca atención veterinaria urgente." |
| `RF-R08` | **Sangrado que no se detiene**, o vómito/heces con sangre abundante junto a decaimiento marcado | "Busca atención veterinaria urgente." |
| `RF-R09` | **Dolor intenso y repentino** (grita al moverse, no deja que la toquen, no puede acomodarse de ninguna manera) | "Busca atención veterinaria urgente." |
| `RF-R10` | **Golpe de calor**: jadeo extremo tras calor o esfuerzo, tambaleo, vómito, encías muy rojas | "Busca atención veterinaria urgente. Mientras vas, llévala a un sitio fresco." |
| `RF-R11` | **Ingesta de algo tóxico** (uvas/pasas, xilitol, chocolate, medicamento humano, veneno) | "Llama ya al veterinario o a un centro toxicológico veterinario, aunque parezca estar bien." |
| `RF-R12` | **Traumatismo**: atropello, caída importante, pelea | "Busca valoración veterinaria urgente aunque parezca estar bien." |

**Nota especial sobre `RF-R01` (Dalila es una Golden Retriever):** la dilatación-torsión gástrica es una emergencia
que puede pasar de los primeros signos a poner la vida en riesgo **en una o dos horas**, y afecta sobre todo a razas
grandes y de pecho profundo. Por eso los signos iniciales —inquietud, babeo excesivo, arcadas improductivas, mirarse
el abdomen— disparan nivel rojo **directamente**, sin pedir más datos. Es la única regla donde aceptamos
deliberadamente falsos positivos.

---

## Reglas naranjas — contactar al veterinario hoy

| ruleId | Disparador | Texto |
|---|---|---|
| `RF-O01` | No quiere o no puede levantarse (pero sí mueve las patas), nuevo o peor que otros días | "Que le cueste mucho levantarse o que no quiera hacerlo es un cambio que conviene valorar pronto, sobre todo si es nuevo o va a más." |
| `RF-O02` | Cambio brusco y marcado en la forma de caminar | "Un cambio brusco en cómo camina merece que lo vea tu veterinario hoy." |
| `RF-O03` | Arrastra las uñas / se le voltea una pata / pierde el equilibrio | "Esto conviene que lo valore tu veterinario. Si puedes, graba un vídeo corto: le será muy útil." |
| `RF-O04` | Sin comer > 24 h, o 2 comidas seguidas rechazadas + decaimiento | "Que un perro adulto no coma en todo un día merece una llamada al veterinario." |
| `RF-O05` | Vómitos repetidos (≥ 3 en el día) o vómito + decaimiento | "Conviene hablar hoy con tu veterinario." |
| `RF-O06` | Diarrea con sangre, o diarrea + decaimiento, o > 48 h | "Conviene hablar hoy con tu veterinario." |
| `RF-O07` | Cualquier cambio urinario: esfuerzo, sangre, ir mucho más, accidentes nuevos en casa | "Los cambios al orinar conviene valorarlos pronto." |
| `RF-O08` | Beber mucho más de lo normal varios días seguidos | "Un aumento sostenido de la sed conviene comentarlo con tu veterinario." |
| `RF-O09` | Posible reacción a un medicamento registrada | "Anótalo y llama hoy a quien se lo recetó. No suspendas ni cambies la dosis por tu cuenta: consúltalo primero." |
| `RF-O10` | Hinchazón nueva, bulto que crece, herida que no cierra | "Conviene que lo vea tu veterinario." |

---

## Reglas amarillas — consultar en los próximos días

Se generan sobre todo por **acumulación**, y la redacción es siempre descriptiva y sin dramatismo.

| ruleId | Disparador | Texto |
|---|---|---|
| `RF-Y01` | ≥ 3 días de los últimos 7 con dificultad de movilidad anotada, siendo más que la semana previa | "En los últimos 7 días anotaste 4 días con más dificultad para levantarse, frente a 1 la semana anterior. Puede ser buen momento para comentarlo con tu veterinario." |
| `RF-Y02` | Estado general "mal" o "muy mal" ≥ 2 días seguidos | "Llevas dos días anotando que no está bien. Podría valer la pena consultarlo." |
| `RF-Y03` | Apetito por debajo de lo normal ≥ 3 días de 5 | "Has anotado menos apetito varios días. Conviene comentarlo." |
| `RF-Y04` | Pérdida o ganancia de peso > 5 % en 30 días sin que sea un objetivo registrado | "El peso cambió más de lo habitual este mes. Buen tema para la próxima consulta." |
| `RF-Y05` | ≥ 3 dosis omitidas del mismo medicamento en 7 días | "Se registraron varias dosis sin administrar esta semana. Si hay algún problema con el medicamento, coméntalo con tu veterinario." |
| `RF-Y06` | Nuevo signo neurológico anotado una sola vez | "Anotaste algo que conviene vigilar. Si se repite, coméntalo con tu veterinario y graba un vídeo si puedes." |
| `RF-Y07` | Heces anormales ≥ 3 de 5 días | "Varios días con heces distintas. Buen tema para comentar." |

**Importante sobre las reglas amarillas:** se muestran **como máximo una vez cada 72 h por regla**, y **nunca en la
pantalla de inicio de la mañana**. Aparecen en el resumen nocturno o al entrar en Historial. El objetivo es informar,
no sobresaltar a alguien que acaba de despertarse.

---

## Cómo se presenta (obligatorio en todas las reglas)

Toda pantalla de orientación contiene, sin excepción:

1. **La acción**, en una frase corta y en imperativo suave.
2. **El porqué observacional**, describiendo lo que ella registró — nunca una causa posible.
3. **Botones de acción real**: llamar a la clínica, llamar a urgencias, guardar como pregunta.
4. **El descargo**, siempre visible, nunca en letra pequeña gris ilegible:
   > Esta orientación es general y no sustituye la valoración de un veterinario.
5. **"→ De dónde viene esto"**, que abre la fuente concreta de esa regla.

### Lo que estos mensajes nunca hacen

- Nombrar una enfermedad concreta como posible causa.
- Usar palabras como "grave", "peligroso", "puede morir", "no pierdas tiempo".
- Dar probabilidades o estadísticas de riesgo.
- Sugerir qué hacer en casa más allá de medidas de seguridad evidentes (sitio fresco, no dar de comer si va a
  urgencias, no dar medicamentos por cuenta propia).
- Sugerir esperar cuando la regla dice consultar.
- Mostrarse dos veces por el mismo hecho.

---

## Configuración y mantenimiento

- Las reglas viven en `packages/shared/redflags.ts` como **datos**, no como código disperso: `id`, `nivel`,
  `condición`, `textos`, `fuente`, `vigenteDesde`.
- Son **funciones puras** sobre los registros → se testean íntegramente con Vitest, sin tocar Google
  (punto 50 del encargo).
- Los números de teléfono (clínica habitual y urgencias 24 h) se configuran en el perfil. **Si no hay número de
  urgencias guardado, el onboarding lo pide explícitamente**: una pantalla de urgencia sin a quién llamar no sirve
  de nada.
- Ninguna regla se añade sin fuente. Las fuentes están en [VET_RESEARCH.md](VET_RESEARCH.md).
- **Revisión pendiente:** cuando tengáis confianza con el veterinario de Dalila, enseñadle esta tabla. Es la parte de
  la app donde una corrección profesional vale más que cualquier cosa que podamos investigar nosotros — y
  probablemente quiera añadir algo específico del caso de Dalila.
