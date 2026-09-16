# Investigación veterinaria

> Documento 5 de 9. Cubre **J** y el punto 53.
>
> **Este documento es material de diseño para decidir qué registra la app y qué NO afirma.
> No es consejo veterinario para Dalila.** Nadie ha explorado a Dalila, no tenemos sus radiografías, ni su historia
> clínica, ni sus analíticas. Todo lo que sigue es conocimiento general publicado, y su función es exactamente la
> contraria a la habitual: sirve para decidir **qué no puede decir la app**.

---

## Clasificación de evidencia usada

| Nivel | Significado | Qué puede hacer la app con ello |
|---|---|---|
| **A — Sólida** | Ensayos controlados en perros, guías de consenso profesional, manuales de referencia | Contenido educativo con fuente visible |
| **B — Moderada** | Estudios pequeños, observacionales, o consenso sin ensayos robustos | Educativo, señalando la limitación |
| **C — Limitada / inconsistente** | Resultados contradictorios o de baja calidad | Solo si se pregunta, y siempre diciendo que la evidencia es débil |
| **D — Insuficiente** | Sin evidencia veterinaria útil | La app no lo promueve; si la usuaria lo registra, lo registra sin validarlo |

---

## 1. Espondilosis deformante: lo más importante de todo el documento

**Hallazgo central, nivel A:** la espondilosis deformante es habitualmente **un hallazgo radiográfico incidental**, y
el *Merck/MSD Veterinary Manual* afirma explícitamente que **no hay correlación entre la presencia de espondilosis y
los signos clínicos**. Es infrecuente en perros menores de 2 años y, a los 9 años, afecta al **25–70 % de todos los
perros**. Solo en casos raros produce hiperestesia espinal que requiera analgesia.

Un estudio de 172 casos evaluó específicamente la asociación entre espondilosis deformante y signos clínicos de
enfermedad del disco intervertebral.

### Qué significa esto para Dalila Care

Es la razón por la que **la app nunca debe atribuir un síntoma a la espondilosis**. Si Dalila tiene un día con
dificultad para levantarse, la app registra "dificultad para levantarse", con fecha. No escribe "hoy su espondilosis
estuvo peor", porque:

1. La espondilosis puede ser un hallazgo de imagen sin relación con lo que ella siente.
2. Los signos podrían venir de otra cosa que el veterinario aún tiene que valorar.
3. Una app que atribuye causas enseña a la cuidadora a dejar de preguntarse por otras causas. **Eso es un daño real.**

> El vocabulario del producto usa "espondilosis/espondiloartrosis" únicamente como **diagnóstico registrado por el
> veterinario**, nunca como explicación de un síntoma del día.

### Diferenciales que un perro Golden de ~7 años con estos signos puede tener a la vez

Esto **no** es para que la app diagnostique. Es para que las observaciones que pedimos sean las que ayudan al
veterinario a distinguir entre estas posibilidades:

| Posibilidad | Por qué es relevante aquí | Qué observación la distingue |
|---|---|---|
| **Estenosis lumbosacra degenerativa (DLSS)** | Los Golden Retriever están entre las razas más afectadas, y la edad típica de presentación es **6–7 años** — exactamente la de Dalila. Además coincide anatómicamente con la zona donde suele verse espondilosis (L7-S1) | Dolor al tocar o mover la zona lumbar baja; dificultad para saltar o subir; cola/miembros posteriores |
| **Osteoartritis de cadera / rodilla** | Muy frecuente en la raza; convive con problemas de columna | Rigidez que mejora al moverse, cojera de un lado, dificultad tras el descanso |
| **Mielopatía degenerativa (MD)** | Normalmente > 8 años. En fases tempranas **se parece a la artrosis**, y es la confusión más común | Diferencia clave documentada: el perro con MD **tiene dificultad para sentir y colocar bien las patas** (arrastra los dedos, se le voltea la pata); el artrósico no |
| **Enfermedad discal (IVDD)** | Puede coexistir | Inicio agudo, dolor marcado, cambios neurológicos |
| **Otras causas no espinales** | Un Golden de 7 años puede tener problemas ajenos al esqueleto que se manifiestan como decaimiento o menos ganas de moverse | Cambios en apetito, sed, respiración, encías |

**Consecuencia de diseño concreta:** por eso el catálogo de observaciones incluye signos específicamente
neurológicos — *"arrastra las uñas / los dedos"*, *"se le voltea la pata"*, *"pierde el equilibrio"* — separados de
los signos de rigidez o dolor. La app no interpreta la diferencia, pero **captura la información que permite al
veterinario hacerlo.** Es probablemente la aportación clínica más valiosa de todo el producto.

Cualquiera de estos cuadros requiere valoración veterinaria; el diagnóstico de DLSS o IVDD necesita imagen avanzada
(TC o RM), no radiografía simple.

---

## 2. Signos de incomodidad: qué es razonable pedir que observe

Las guías de consenso reconocen que el dolor crónico en perros se manifiesta sobre todo como **cambios de
comportamiento y de actividad**, no como quejido. Esto es lo que justifica el enfoque entero del check-in.

### Catálogo propuesto (precargado y ampliable)

**Movilidad**
- Le costó levantarse
- Necesitó ayuda para levantarse
- Se levantó más lento que de costumbre
- Rigidez al empezar a caminar que luego mejora
- Cojea o apoya menos una pata
- Se resbaló en piso liso
- Tropezó
- Arrastra las uñas o los dedos *(marcado internamente como signo neurológico)*
- Se le volteó una pata al apoyarla *(neurológico)*
- Evitó subir o bajar
- No quiso caminar / se paró en el paseo
- Le costó acomodarse para echarse
- Se sienta de forma distinta

**Posible incomodidad**
- Jadeo sin calor ni ejercicio
- Inquietud, cambia mucho de posición
- No encuentra postura para descansar
- Vocaliza (gime, se queja)
- Postura distinta (espalda arqueada, cabeza baja)
- Se lame o muerde una zona concreta
- Evita que la toquen en algún sitio
- Se mueve menos de lo normal
- Tiembla

**Ánimo y conducta**
- Alegre / Normal / Tranquila / Apagada / Irritable / Busca compañía / Se aísla
- Menos interés en jugar o en pasear
- Cambio en el saludo al llegar a casa

> **Encuadre obligatorio en la interfaz:** estos son *"signos que a veces se ven cuando algo molesta"*, no
> *"nivel de dolor"*. Ninguno se puntúa, ninguno se suma, y ninguno se convierte en un índice.

---

## 3. Peso corporal: la intervención con mejor evidencia

**Nivel A.** Es, con diferencia, lo mejor documentado de este documento:

- El estudio longitudinal de Kealy et al. (*JAVMA* 2002) siguió 48 Labradores emparejados durante toda su vida; el
  grupo que comió **un 25 % menos** vivió una **mediana 1,8 años más**.
- En el mismo cohorte, la restricción **retrasó o previno los signos radiográficos de artrosis de cadera**: lesiones
  en 15 de 22 perros del grupo control frente a **3 de 21** en el grupo restringido. Publicaciones posteriores (2006,
  2009) confirmaron el efecto en cadera y codo.
- Las guías de manejo del dolor de AAHA (2022) y el consenso internacional COAST (2023) sitúan el **control de peso
  como componente central** del abordaje multimodal de la artrosis canina.

**Lo que la app hace con esto:** registra peso y permite guardar el **peso objetivo y el BCS que indique el
veterinario**. Muestra la tendencia.

**Lo que la app NO hace, y es importante:** no calcula cuánto debe comer, no dice "está obesa", no fija un objetivo,
no propone una dieta de reducción. Un plan de pérdida de peso en un perro con dolor crónico y posible enfermedad
concurrente es una decisión clínica con riesgos (pérdida de masa muscular, enmascaramiento de otra enfermedad) que
requiere valoración profesional. La app aporta **los datos** para esa conversación, no la conclusión.

### Body Condition Score

La escala estándar es la de **9 puntos de WSAVA**, disponible gratuitamente en varios idiomas (incluido español) en su
Global Nutrition Toolkit. WSAVA invita a reproducir sus materiales educativos siguiendo sus condiciones de
atribución.

**Decisión:** la app **enlaza** al PDF oficial de WSAVA en español en lugar de copiar las ilustraciones. Si más
adelante quisiéramos incrustarlas, hay que verificar las condiciones vigentes y citar la atribución exacta. El BCS se
**almacena con quién lo asignó**, nunca se calcula.

---

## 4. Omega-3 (EPA/DHA)

**Nivel A para el efecto, con matices importantes.**

Dos ensayos aleatorizados y controlados publicados en *JAVMA* en 2010 (Roush et al.; Fritsch et al.) en perros con
artrosis mostraron mejoría medida con **plataforma de fuerza** —es decir, medición objetiva, no opinión del
propietario— y, en el estudio de Fritsch, **menor necesidad de carprofeno**. En uno de los ensayos, el 82 % de los
perros con la dieta rica en omega-3 mejoró en fuerza vertical pico a 90 días, frente al 38 % de los controles. El
estudio de Roush incluyó 127 perros de 18 clínicas.

### Los matices que la app tiene que respetar

1. **Lo que se estudió fueron dietas terapéuticas completas** con contenido de omega-3 muy elevado (~31 veces el de la
   dieta control), no una cucharada de aceite de pescado añadida a la comida. No es lo mismo.
2. Las dosis eficaces son **altas** y hay que ajustarlas al peso. Dosis altas de EPA/DHA tienen efectos reales:
   alteración de la agregación plaquetaria, alteraciones digestivas, aporte calórico añadido (relevante si además se
   busca perder peso), y cuestiones de calidad/oxidación del producto.
3. Por lo tanto: **la app no sugiere ninguna dosis de omega-3.** Puede explicar que existe evidencia de buena calidad
   y que **es una conversación para tener con el veterinario**, citando los estudios.

Si el veterinario la indica, se registra como suplemento, con su dosis en texto, igual que cualquier otra indicación.

---

## 5. Glucosamina y condroitina

**Nivel C — evidencia débil e inconsistente.** Una revisión sistemática y metaanálisis de 2022 sobre dietas
terapéuticas y nutracéuticos en artrosis de perros y gatos encontró un **efecto marcadamente nulo** para los
nutracéuticos de condroitina-glucosamina, y recomendó explícitamente **dejar de recomendarlos** para el manejo del
dolor en la artrosis canina. Revisiones anteriores ya habían concluido que no hay evidencia de beneficio. Se señala
además el **efecto placebo del cuidador** como explicación plausible de las mejorías percibidas.

**Lo que la app hace:** si el veterinario lo indica, se registra y punto — no cuestiona a su veterinario. Pero la app
**nunca lo sugiere por su cuenta** y, en el módulo educativo, lo clasifica como evidencia limitada, citando la
revisión. Esto es exactamente el punto 28 de tu encargo.

---

## 6. Otros suplementos citados con frecuencia

| Suplemento | Evidencia | Postura de la app |
|---|---|---|
| Mejillón de labio verde | B — algunos ensayos positivos, pero pequeños y heterogéneos | Se puede mencionar señalando que la evidencia es limitada |
| Colágeno no desnaturalizado tipo II | C — algún efecto débil en revisiones | Igual, con la limitación explícita |
| Insaponificables de aguacate y soja (ASU) | C | Igual |
| **Cúrcuma / curcumina** | **C–D** — biodisponibilidad oral muy baja, sin ensayos de calidad en perros; además tiene efecto antiagregante que puede importar si hay AINE o cirugía | **La app nunca la propone.** Si la usuaria la registra, se muestra un aviso neutro de que conviene comentarlo con el veterinario |
| Caldo de huesos "regenerador de cartílago" | **D — sin base** | La app no lo menciona como tratamiento |
| Cannabidiol (CBD) | B/C — investigación en curso, calidad y legalidad de producto muy variables | Solo si el veterinario lo indica. La app no orienta |

---

## 7. Fármacos: lo que la app no hará jamás

La app **no recomienda, no sugiere, no calcula y no ajusta ningún medicamento.** Registra lo que indicó el
veterinario. Aun así, dos contenidos de seguridad sí son responsabilidad de la app porque previenen daño:

### 7.1 Analgésicos humanos — advertencia permanente

**Nivel A.** Ibuprofeno, naproxeno y acetaminofén/paracetamol son **tóxicos para los perros**, incluso en cantidades
pequeñas: úlceras gástricas, fallo renal, daño hepático y afectación del transporte de oxígeno. Los efectos pueden
empezar en 1–2 horas. El *Merck Veterinary Manual* dedica un capítulo a las intoxicaciones por analgésicos humanos en
animales.

La app muestra esto de forma fija en el módulo de medicamentos y, si alguien registra un fármaco cuyo nombre coincide
con uno de estos principios activos, muestra el aviso **antes de guardar** e indica contactar al veterinario o al
centro toxicológico de inmediato si ya se administró.

### 7.2 Contexto neutro sobre tratamientos actuales de artrosis canina

Solo como contenido educativo con fuente, nunca como recomendación:

- Existen AINE veterinarios específicos y otros fármacos aprobados para el dolor de la artrosis canina; su elección,
  dosis y controles (incluidos análisis de sangre periódicos) corresponden al veterinario.
- **Bedinvetmab (Librela)**, anticuerpo monoclonal anti-NGF, fue aprobado por la FDA en mayo de 2023. En 2024–2025 la
  FDA emitió una *Dear Veterinarian Letter* por notificaciones de eventos adversos (signos neurológicos como ataxia,
  convulsiones, paresia y decúbito; incontinencia urinaria; poliuria/polidipsia; y algunos casos de muerte o
  eutanasia), y Zoetis actualizó la ficha técnica estadounidense en **febrero de 2025**; la empresa señala que, con
  casi 25 millones de dosis distribuidas, ningún signo adverso individual se ha notificado por encima de la categoría
  "raro" de la EMA (< 10 por cada 10 000 animales tratados).

Postura de la app: **si Dalila recibe cualquier fármaco, la app ofrece registrar "posible reacción" y describirla.**
No opina sobre si el fármaco es adecuado. Ese registro estructurado, con fechas, es justamente lo que le sirve al
veterinario — y, si procede, al sistema de farmacovigilancia.

---

## 8. Alimentos peligrosos (lista precargada)

**Nivel A.** Según ASPCA Animal Poison Control y el *Merck Veterinary Manual*, entre los alimentos que deben evitarse
están: **uvas y pasas** (daño renal; se ha señalado al ácido tartárico como responsable), **xilitol** (liberación
rápida de insulina, convulsiones, fallo hepático), **chocolate**, **cebolla, ajo y cebollín** (daño de glóbulos rojos,
anemia), **nueces de macadamia** (debilidad, temblores, hipertermia), **alcohol**, **cafeína** y **aguacate**.

La app precarga estos elementos en el catálogo de alimentos marcados con su fuente, para poder avisar **antes** de que
se añadan al plan. Informa; no bloquea.

---

## 9. Ejercicio y rehabilitación

Las guías de consenso (AAHA 2022, COAST 2023) recomiendan un enfoque **multimodal**: fármacos, control de peso,
modalidades físicas, rehabilitación y adaptaciones del entorno. La rehabilitación y la fisioterapia forman parte del
estándar de cuidado.

**Pero la dosificación del ejercicio en un perro con sospecha de enfermedad de columna es una decisión clínica**, y
hacerlo mal puede empeorar el cuadro. Por eso:

- La app **no propone planes de ejercicio, ni objetivos de minutos, ni progresiones.**
- Las tareas de actividad se crean **a partir de lo que indique el veterinario o el fisioterapeuta**, y el campo
  "¿quién lo recomendó?" es obligatorio.
- La app registra cómo empezó y cómo terminó cada paseo, si tuvo que parar y si necesitó ayuda — datos que le sirven
  al profesional para ajustar.
- **No hay gamificación de la actividad**, ni "meta diaria de pasos", ni nada que empuje a hacer más. Sería
  potencialmente dañino.

Adaptaciones del entorno de bajo riesgo y ampliamente recomendadas (alfombras antideslizantes en pisos lisos, rampa
en vez de saltos al coche o al sofá, cama de apoyo adecuada, comederos a altura cómoda, uñas cortas) se pueden ofrecer
en el módulo educativo como **sugerencias generales de entorno**, no como tratamiento, y siempre con "coméntalo con
tu veterinario".

---

## 10. Escalas clínicas (punto 29): qué recomiendo y por qué

Existen instrumentos validados y rellenados por el propietario para el dolor crónico canino. Los tres más usados:

| Instrumento | Qué es | Situación legal | Recomendación |
|---|---|---|---|
| **HCPI** (Helsinki Chronic Pain Index) | 11 preguntas de comportamiento y actividad, 0–4 puntos cada una, total 0–44. Lo rellena el propietario | Desarrollado en la Universidad de Helsinki (Hielm-Björkman). De acceso libre para uso no comercial. **Existe desde 2025 una versión en español lingüísticamente validada**, publicada con licencia CC-BY; sus autores pidieron autorización a la desarrolladora antes de traducirlo | **La mejor candidata** si algún día queremos un instrumento validado en español. Antes de incorporarlo hay que **pedir permiso expreso** a la Dra. Hielm-Björkman / Universidad de Helsinki. No lo incluyo en V1 |
| **LOAD** (Liverpool Osteoarthritis in Dogs) | Cuestionario validado de movilidad | Propiedad de la Universidad de Liverpool, con licencia a una empresa comercial | **No reproducir.** Solo enlazar o mencionar |
| **CBPI** (Canine Brief Pain Inventory) | Inventario breve de dolor | Universidad de Pensilvania; requiere solicitar permiso, y el uso comercial necesita licencia | **No reproducir.** Solo enlazar o mencionar |

### Recomendación

**Para V1: check-in propio, basado únicamente en observaciones descriptivas, sin puntuación agregada.**

Razones, en orden de importancia:

1. **No hay problema legal.** Descripciones de comportamiento en lenguaje llano no son de nadie.
2. **Encaja con el producto.** Un cuestionario de 11 ítems cada día es lo contrario de "30 segundos". El check-in
   diario es un diario, no una escala.
3. **Evita un riesgo clínico sutil.** Una puntuación agregada ("Dalila: 18/44") invita a interpretarla, a compararla
   y a tomar decisiones con ella. Esas escalas están validadas para ser usadas **por un veterinario dentro de un
   seguimiento clínico**, no para que un cuidador ajuste el cuidado en casa. Un número mal interpretado es peor que
   ningún número.

**Para V1.2, si el veterinario lo quiere:** añadir el HCPI en español como cuestionario **opcional, mensual**, tras
obtener permiso por escrito, presentado explícitamente como *"cuestionario de la Universidad de Helsinki"* con su
atribución, y con la puntuación visible **para el veterinario**, no como métrica de la app. Esto es una decisión que
debería tomar el veterinario de Dalila, no nosotros. → Ver [DECISIONES.md](DECISIONES.md).

### Escala de heces

Existen dos sistemas ampliamente usados: la **Purina Fecal Scoring Chart** (Nestlé Purina) y el **WALTHAM Faeces
Scoring System** (Mars). Ambos son materiales corporativos con ilustraciones propias; las búsquedas no han arrojado
condiciones públicas de reutilización por terceros.

**Recomendación:** no reproducir ninguna de las dos escalas ni sus ilustraciones. La app usa **descriptores propios en
lenguaje llano** —*normal y formada · un poco blanda · muy blanda · líquida · dura y seca · no hizo*— más señales
marcables (sangre visible, moco, esfuerzo). Es suficiente para el seguimiento doméstico, comprensible para cualquiera,
y no tiene problemas de licencia. Si el veterinario pide una escala numérica concreta, la app puede **enlazar** al PDF
oficial correspondiente.

---

## 11. Fuentes

**Espondilosis y columna**
- MSD/Merck Veterinary Manual — *Degenerative Diseases of the Spinal Column and Cord in Animals*: https://www.merckvetmanual.com/nervous-system/diseases-of-the-spinal-column-and-cord/degenerative-diseases-of-the-spinal-column-and-cord-in-animals
- Merck Veterinary Manual (versión propietarios) — *Disorders of the Spinal Column and Cord in Dogs*: https://www.merckvetmanual.com/dog-owners/brain-spinal-cord-and-nerve-disorders-of-dogs/disorders-of-the-spinal-column-and-cord-in-dogs
- Levine et al., *Evaluation of the association between spondylosis deformans and clinical signs of intervertebral disk disease in dogs: 172 cases (1999–2000)*: https://pubmed.ncbi.nlm.nih.gov/16426177/
- VCA Animal Hospitals — *Spondylosis Deformans in Dogs*: https://vcahospitals.com/know-your-pet/spondylosis-deformans-in-dogs
- dvm360 — *Degenerative lumbosacral stenosis in dogs*: https://www.dvm360.com/view/degenerative-lumbosacral-stenosis-dogs
- Cornell University College of Veterinary Medicine — *Degenerative myelopathy*: https://www.vet.cornell.edu/departments-centers-and-institutes/riney-canine-health-center/canine-health-topics/degenerative-myelopathy

**Dolor y artrosis**
- 2022 AAHA Pain Management Guidelines for Dogs and Cats: https://www.aaha.org/wp-content/uploads/globalassets/02-guidelines/2022-pain-management/resources/2022-aaha-pain-management-guidelines-for-dog-and-cats_updated_060622.pdf
- COAST Development Group — *International consensus guidelines for the treatment of canine osteoarthritis* (Frontiers in Veterinary Science, 2023): https://www.frontiersin.org/journals/veterinary-science/articles/10.3389/fvets.2023.1137888/full
- MSD Veterinary Manual — *Recognition and Assessment of Pain in Animals*: https://www.msdvetmanual.com/therapeutics/pain-assessment-and-management/recognition-and-assessment-of-pain-in-animals
- Pye et al. (2024) — *Current evidence for non-pharmaceutical, non-surgical treatments of canine osteoarthritis* (JSAP): https://onlinelibrary.wiley.com/doi/10.1111/jsap.13670

**Peso**
- Kealy et al. (2002) — *Effects of diet restriction on life span and age-related changes in dogs*, JAVMA: https://pubmed.ncbi.nlm.nih.gov/11991408/
- Kealy et al. (2006) — *Lifelong diet restriction and radiographic evidence of osteoarthritis of the hip joint in dogs*: https://pubmed.ncbi.nlm.nih.gov/16948575/
- Runge et al. (2009) — *Lifetime food restriction and osteoarthritis of the canine elbow*: https://pubmed.ncbi.nlm.nih.gov/19236677/
- WSAVA Global Nutrition Guidelines y Body Condition Score: https://wsava.org/global-guidelines/global-nutrition-guidelines/ · https://wsava.org/wp-content/uploads/2025/06/WSAVA_BCSCat_BCSDog_Nutrition_250612.pdf

**Nutrición y suplementos**
- Roush et al. (2010) — *Multicenter veterinary practice assessment of the effects of omega-3 fatty acids on osteoarthritis in dogs*, JAVMA: https://pubmed.ncbi.nlm.nih.gov/20043800/
- Barbeau-Grégoire et al. (2022) — *A 2022 Systematic Review and Meta-Analysis of Enriched Therapeutic Diets and Nutraceuticals in Canine and Feline Osteoarthritis*: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9499673/
- Bhathal et al. (2017) — *Glucosamine and chondroitin use in canines for osteoarthritis: a review*: https://pubmed.ncbi.nlm.nih.gov/28331832/
- ASPCA — *People Foods to Avoid Feeding Your Pets*: https://www.aspca.org/pet-care/aspca-poison-control/people-foods-avoid-feeding-your-pets
- Merck Veterinary Manual — *Toxicoses From Human Analgesics in Animals*: https://www.merckvetmanual.com/toxicology/toxicoses-from-human-analgesics/toxicoses-from-human-analgesics-in-animals

**Fármacos**
- Zoetis — *U.S. Label Update for Librela (bedinvetmab injection)*, feb. 2025: https://news.zoetis.com/press-releases/press-release-details/2025/Zoetis-Announces-U.S.-Label-Update-for-Librela-bedinvetmab-injection-a-Treatment-to-Control-Canine-Osteoarthritis-OA-Pain/default.aspx
- AVMA — *FDA: Adverse events in dogs reported with monoclonal antibody drug*: https://www.avma.org/news/fda-adverse-events-dogs-reported-monoclonal-antibody-drug
- AAHA — *Librela update: Changes to Librela label from Zoetis*: https://www.aaha.org/trends-magazine/publications/librela-update-changes-to-librela-label-from-zoetis/

**Escalas**
- Walton et al. (2013) — *Evaluation of Construct and Criterion Validity for the LOAD Clinical Metrology Instrument and Comparison to Two Other Instruments*, PLOS ONE: https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0058125
- *Translation and Linguistic Validation into Spanish of the Owner-Reported Outcome Measure "Helsinki Chronic Pain Index" (HCPI)* (2025, CC-BY): https://pmc.ncbi.nlm.nih.gov/articles/PMC12474355/
- Today's Veterinary Practice — *Assessing Chronic Pain in Dogs*: https://todaysveterinarypractice.com/pain_management/assessing-chronic-pain-in-dogs/

---

## 12. Recomendaciones que NO debemos convertir en consejo automático

Lista explícita, para que quede en el repositorio y nadie la cruce por descuido más adelante:

| Tentación | Por qué no |
|---|---|
| "Dale X g de omega-3 al día" | Depende del peso, de la dieta base y del criterio veterinario. Hay efectos adversos reales |
| "Dalila debería pesar X kg" | El peso objetivo lo fija el veterinario tras valorarla |
| "Baja de peso Y g por semana" | Plan clínico con riesgos, especialmente con enfermedad concurrente |
| "Camina 20 minutos al día" | La dosificación del ejercicio en enfermedad de columna es decisión clínica |
| "Hoy su espondilosis está peor" | No hay correlación establecida entre espondilosis y signos clínicos |
| "La glucosamina le ayudará a las articulaciones" | Evidencia débil o nula |
| "La cúrcuma es un antiinflamatorio natural" | Evidencia insuficiente y posible interacción |
| "El tratamiento está funcionando" | La app no puede establecer causalidad con datos observacionales de un solo perro |
| "Puedes darle media aspirina" | Los analgésicos humanos pueden matar a un perro |
| "Esta semana empeoró un 23 %" | Falsa precisión sobre datos subjetivos |
| "Probablemente sea mielopatía degenerativa" | La app no diagnostica. Nunca |
