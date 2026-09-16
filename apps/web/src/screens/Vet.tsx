import { useMemo, useState } from 'preact/hooks';
import {
  INSTRUCTION_TYPES,
  INSTRUCTION_TYPE_LABEL,
  addDays,
  buildConsultReport,
  formatDateLong,
  formatDateNumeric,
  formatDayMonthShort,
  formatDuration,
  localDateOf,
  newId,
  nowIso,
  type ConsultReport,
} from '@dalila/shared';
import {
  Button, Card, Empty, Field, Header, Input, Notice, Section, Segmented, Select, Sheet, Textarea, toast, useConfirm,
} from '../ui/Kit.js';
import { IconPlus, IconShare, IconStethoscope, IconTrash } from '../ui/Icons.js';
import { data, remove, save } from '../data/store.js';
import { back, go } from '../app/router.js';

// ── Preguntas para el veterinario ────────────────────────────────────────────

export function QuestionsScreen() {
  const d = data.value;
  const [text, setText] = useState('');
  const [answering, setAnswering] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const { confirm, dialog } = useConfirm();

  const pending = d.questions.filter((q) => !q.deletedAt && q.status === 'pendiente');
  const answered = d.questions
    .filter((q) => !q.deletedAt && q.status === 'respondida')
    .sort((a, b) => ((a.answeredAt ?? '') < (b.answeredAt ?? '') ? 1 : -1));

  const add = async () => {
    if (!text.trim()) return;
    await save('questions', newId('vtq'), { text: text.trim(), status: 'pendiente' }, 'vtq');
    setText('');
    toast('Guardada para la próxima consulta');
  };

  return (
    <div class="stack-lg">
      <Header title="Preguntas" subtitle="Para la próxima consulta" back="/dalila" />

      <Card>
        <Field label="¿Qué quieres preguntarle al veterinario?">
          <Textarea
            rows={2}
            value={text}
            placeholder="¿Podemos aumentar las caminatas?"
            onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
          />
        </Field>
        <Button variant="primary" block disabled={!text.trim()} style="margin-top:var(--s-3)" onClick={() => void add()}>
          <IconPlus size={18} /> Añadir pregunta
        </Button>
      </Card>

      {pending.length === 0 && answered.length === 0 && (
        <Empty
          emoji="❓"
          title="Sin preguntas todavía"
          body="Apunta aquí cualquier duda que se te ocurra. En la consulta las tendrás todas a mano."
        />
      )}

      {pending.length > 0 && (
        <Section title={`Pendientes (${pending.length})`}>
          <div class="stack-sm">
            {pending.map((q) => (
              <Card key={q.id}>
                <p class="t-body">{q.text}</p>
                {q.context && <p class="t-xs t-mute" style="margin-top:4px">{q.context}</p>}
                <div class="row" style="gap:var(--s-2);margin-top:var(--s-3);flex-wrap:wrap">
                  <Button variant="soft" size="sm" onClick={() => { setAnswering(q.id); setAnswer(''); }}>
                    Ya me respondieron
                  </Button>
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={async () => {
                      if (await confirm({ title: '¿Eliminar esta pregunta?', confirmLabel: 'Eliminar', danger: true })) {
                        await remove('questions', q.id);
                      }
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {answered.length > 0 && (
        <Section title="Respondidas">
          <div class="stack-sm">
            {answered.map((q) => (
              <Card key={q.id}>
                <p class="t-sm t-soft">{q.text}</p>
                <div style="margin-top:var(--s-3);padding-left:var(--s-3);border-left:3px solid var(--ok)">
                  <p class="t-body">{q.answerText}</p>
                  <p class="t-xs t-mute" style="margin-top:4px">
                    {q.answeredBy || 'Veterinario'}
                    {q.answeredAt ? ` · ${formatDateNumeric(q.answeredAt.slice(0, 10))}` : ''}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}

      <Sheet open={!!answering} onClose={() => setAnswering(null)} title="¿Qué te respondieron?">
        <div class="stack">
          <Field label="Respuesta">
            <Textarea rows={4} value={answer} onInput={(e) => setAnswer((e.target as HTMLTextAreaElement).value)} />
          </Field>
          <Button
            variant="primary"
            block
            disabled={!answer.trim()}
            onClick={async () => {
              if (!answering) return;
              await save('questions', answering, {
                status: 'respondida',
                answerText: answer.trim(),
                answeredAt: nowIso(),
                answeredBy: d.dog?.vetName ?? '',
              });
              setAnswering(null);
              toast('Respuesta guardada ✓');
            }}
          >
            Guardar
          </Button>
        </div>
      </Sheet>

      {dialog}
    </div>
  );
}

// ── Plan veterinario ─────────────────────────────────────────────────────────

export function VetPlanScreen() {
  const d = data.value;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    localDate: localDateOf(),
    vetName: d.dog?.vetName ?? '',
    clinic: d.dog?.vetClinic ?? '',
    type: 'seguimiento',
    instructionText: '',
    rationale: '',
    reviewDate: '',
  });
  const { confirm, dialog } = useConfirm();

  const instructions = d.instructions
    .filter((i) => !i.deletedAt)
    .sort((a, b) => (a.localDate < b.localDate ? 1 : -1));

  const submit = async () => {
    if (!form.instructionText.trim()) return;
    await save('instructions', newId('vti'), { ...form, instructionText: form.instructionText.trim(), status: 'vigente', mediaIds: [], derivedTaskIds: [] }, 'vti');
    setForm({ ...form, instructionText: '', rationale: '', reviewDate: '' });
    setOpen(false);
    toast('Indicación guardada ✓');
  };

  const toTask = async (instructionId: string, text: string) => {
    const taskId = newId('tsk');
    await save('tasks', taskId, {
      title: text.slice(0, 110),
      timeOfDay: 'manana',
      daysOfWeek: [],
      category: 'terapia',
      recommendedBy: 'veterinario',
      recommendedByName: d.dog?.vetName ?? '',
      vetInstructionId: instructionId,
      order: d.tasks.length,
      active: true,
      protected: true,
    }, 'tsk');
    await save('instructions', instructionId, { derivedTaskIds: [taskId] });
    toast('Añadida a la rutina ✓');
  };

  return (
    <div class="stack-lg">
      <Header
        title="Plan veterinario"
        back="/dalila"
        action={
          <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
            <IconPlus size={17} /> Añadir
          </Button>
        }
      />

      <Notice tone="info">
        Guarda aquí lo que te indique el veterinario. Después puedes convertir cada indicación en una
        tarea de la rutina, y la app recordará de dónde salió.
      </Notice>

      {instructions.length === 0 ? (
        <Empty emoji="🩺" title="Sin indicaciones registradas" body="Apunta lo que te digan en la consulta para no olvidarlo." />
      ) : (
        <div class="stack-sm">
          {instructions.map((i) => (
            <Card key={i.id}>
              <div class="row-between">
                <span class="badge badge--accent">{INSTRUCTION_TYPE_LABEL[i.type] ?? i.type}</span>
                <span class="t-xs t-mute">{formatDateNumeric(i.localDate)}</span>
              </div>
              <p class="t-body" style="margin-top:var(--s-3)">{i.instructionText}</p>
              {i.rationale && <p class="t-sm t-soft" style="margin-top:var(--s-2)">{i.rationale}</p>}
              <p class="t-xs t-mute" style="margin-top:var(--s-2)">
                {i.vetName || 'Veterinario'}{i.clinic ? ` · ${i.clinic}` : ''}
                {i.reviewDate ? ` · revisar el ${formatDateNumeric(i.reviewDate)}` : ''}
              </p>
              <div class="row" style="gap:var(--s-2);margin-top:var(--s-3);flex-wrap:wrap">
                {i.derivedTaskIds.length === 0 && (
                  <Button variant="soft" size="sm" onClick={() => void toTask(i.id, i.instructionText)}>
                    Convertir en tarea
                  </Button>
                )}
                {i.derivedTaskIds.length > 0 && <span class="badge badge--ok">Ya está en la rutina</span>}
                <Button
                  variant="quiet"
                  size="sm"
                  onClick={async () => {
                    if (await confirm({ title: '¿Eliminar esta indicación?', confirmLabel: 'Eliminar', danger: true })) {
                      await remove('instructions', i.id);
                    }
                  }}
                >
                  <IconTrash size={15} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Nueva indicación">
        <div class="stack">
          <Field label="Fecha">
            <Input type="date" value={form.localDate} onInput={(e) => setForm({ ...form, localDate: (e.target as HTMLInputElement).value })} />
          </Field>
          <Field label="Tipo">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: (e.target as HTMLSelectElement).value })}>
              {INSTRUCTION_TYPES.map((t) => (
                <option key={t} value={t}>{INSTRUCTION_TYPE_LABEL[t]}</option>
              ))}
            </Select>
          </Field>
          <Field label="¿Qué te indicó?">
            <Textarea
              rows={3}
              value={form.instructionText}
              placeholder="Caminatas de 10 minutos, dos veces al día, en pasto"
              onInput={(e) => setForm({ ...form, instructionText: (e.target as HTMLTextAreaElement).value })}
            />
          </Field>
          <Field label="¿Por qué?">
            <Input value={form.rationale} onInput={(e) => setForm({ ...form, rationale: (e.target as HTMLInputElement).value })} />
          </Field>
          <Field label="Veterinario">
            <Input value={form.vetName} onInput={(e) => setForm({ ...form, vetName: (e.target as HTMLInputElement).value })} />
          </Field>
          <Field label="Fecha de revisión">
            <Input type="date" value={form.reviewDate} onInput={(e) => setForm({ ...form, reviewDate: (e.target as HTMLInputElement).value })} />
          </Field>
          <Button variant="primary" block disabled={!form.instructionText.trim()} onClick={() => void submit()}>
            Guardar
          </Button>
        </div>
      </Sheet>

      {dialog}
    </div>
  );
}

// ── Preparar consulta ────────────────────────────────────────────────────────

const PERIODS = [
  { value: 7, label: '7 días' },
  { value: 14, label: '14 días' },
  { value: 30, label: '30 días' },
] as const;

export function ConsultScreen() {
  const d = data.value;
  const today = localDateOf();
  const [period, setPeriod] = useState<number>(30);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);

  const from = addDays(today, -(period - 1));
  const report = useMemo(() => buildConsultReport(d, from, today), [d, from, today]);

  const videos = d.media.filter(
    (m) => !m.deletedAt && m.kind === 'video' && m.localDate >= from && m.localDate <= today,
  );
  const questions = d.questions.filter((q) => !q.deletedAt && q.status === 'pendiente');

  return (
    <div class="stack-lg">
      <Header title="Preparar consulta" back="/historial" />

      <Card>
        <p class="t-label" style="margin-bottom:var(--s-3)">Periodo</p>
        <Segmented options={PERIODS} value={period} onChange={setPeriod} />
        <p class="t-sm t-soft" style="margin-top:var(--s-3)">
          Del {formatDayMonthShort(from)} al {formatDayMonthShort(today)} · {report.daysRecorded} de{' '}
          {report.daysInRange} días con registro
        </p>
      </Card>

      <ReportPreview report={report} compact />

      {videos.length > 0 && (
        <Section title={`Vídeos (${selectedMedia.length} de ${videos.length} seleccionados)`}>
          <div class="scroll-x">
            {videos.map((m) => {
              const on = selectedMedia.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  style={`width:118px;text-align:left;border-radius:var(--r-md);overflow:hidden;
                    border:2.5px solid ${on ? 'var(--brand)' : 'transparent'};padding:2px`}
                  onClick={() =>
                    setSelectedMedia((prev) => (on ? prev.filter((x) => x !== m.id) : [...prev, m.id]))
                  }
                >
                  {m.posterDataUrl ? (
                    <img src={m.posterDataUrl} alt="" style="width:100%;height:112px;object-fit:cover;border-radius:var(--r-sm)" />
                  ) : (
                    <div class="glass" style="width:100%;height:112px;display:grid;place-items:center">📹</div>
                  )}
                  <p class="t-xs t-medium" style="margin-top:4px">{formatDayMonthShort(m.localDate)}</p>
                  {m.note && <p class="t-xs t-mute">{m.note.slice(0, 26)}</p>}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {questions.length > 0 && (
        <Section title={`Preguntas (${questions.length})`}>
          <Card pad={false}>
            <div class="list">
              {questions.map((q, i) => (
                <div key={q.id} class="list-item">
                  <span class="t-sm t-bold" style="width:20px;color:var(--brand)">{i + 1}</span>
                  <span class="grow t-body">{q.text}</span>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      )}

      <Button
        variant="primary"
        size="lg"
        block
        onClick={() => go(`/reporte?dias=${period}&videos=${selectedMedia.join(',')}`)}
      >
        <IconStethoscope size={19} /> Ver resumen completo
      </Button>

      <Button
        variant="soft"
        block
        onClick={async () => {
          const text = buildPlainText(d, report, questions.map((q) => q.text));
          try {
            if (navigator.share) await navigator.share({ title: `Resumen de ${d.dog?.name ?? 'Dalila'}`, text });
            else {
              await navigator.clipboard.writeText(text);
              toast('Resumen copiado ✓');
            }
          } catch {
            /* la usuaria canceló el diálogo de compartir */
          }
        }}
      >
        <IconShare size={19} /> Compartir resumen en texto
      </Button>
    </div>
  );
}

// ── Reporte imprimible ───────────────────────────────────────────────────────

export function ReportScreen() {
  const d = data.value;
  const today = localDateOf();
  const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
  const period = Number(params.get('dias') ?? 30);
  const videoIds = (params.get('videos') ?? '').split(',').filter(Boolean);

  const from = addDays(today, -(period - 1));
  const report = useMemo(() => buildConsultReport(d, from, today), [d, from, today]);
  const questions = d.questions.filter((q) => !q.deletedAt && q.status === 'pendiente');
  const videos = d.media.filter((m) => videoIds.includes(m.id));

  const dog = d.dog;
  const meds = d.medications.filter((m) => !m.deletedAt && m.status === 'activo');

  return (
    <div class="stack-lg">
      <div class="row-between" style="margin-bottom:var(--s-2)">
        <Button variant="soft" size="sm" onClick={() => back('/consulta')}>Volver</Button>
        <Button variant="primary" size="sm" onClick={() => window.print()}>Imprimir o guardar PDF</Button>
      </div>

      <Card>
        <div style="text-align:center;padding-bottom:var(--s-4);border-bottom:2px solid var(--border)">
          <h1 class="t-title" style="text-transform:uppercase;letter-spacing:.03em">{dog?.name ?? 'Dalila'}</h1>
          <p class="t-sm t-soft" style="margin-top:4px">
            {[dog?.breed, dog?.sex === 'hembra' ? 'hembra' : dog?.sex === 'macho' ? 'macho' : '']
              .filter(Boolean)
              .join(' · ')}
          </p>
          <p class="t-body t-medium" style="margin-top:var(--s-3)">
            Resumen del {formatDateLong(from, true)} al {formatDateLong(today, true)}
          </p>
          <p class="t-sm t-soft">Registros en {report.daysRecorded} de {report.daysInRange} días</p>
        </div>

        <div class="stack-lg" style="margin-top:var(--s-5)">
          {d.diagnoses.filter((x) => !x.deletedAt).length > 0 && (
            <ReportBlock title="Diagnósticos registrados">
              {d.diagnoses.filter((x) => !x.deletedAt).map((x) => (
                <p key={x.id} class="t-body">
                  {x.name}
                  <span class="t-sm t-soft">
                    {x.diagnosedBy ? ` · ${x.diagnosedBy}` : ''}
                    {x.diagnosedOn ? ` · ${formatDateNumeric(x.diagnosedOn)}` : ''}
                  </span>
                </p>
              ))}
            </ReportBlock>
          )}

          {meds.length > 0 && (
            <ReportBlock title="Medicación actual">
              {meds.map((m) => {
                const v = d.medicationVersions
                  .filter((x) => !x.deletedAt && x.medicationId === m.id && !x.effectiveTo)
                  .sort((a, b) => b.versionNumber - a.versionNumber)[0];
                return (
                  <div key={m.id} style="margin-bottom:var(--s-3)">
                    <p class="t-body t-medium">{m.name}</p>
                    {v && <p class="t-sm">"{v.doseText}"{v.frequencyText ? ` · ${v.frequencyText}` : ''}</p>}
                    <p class="t-xs t-soft">
                      {m.prescribedBy ? `${m.prescribedBy}` : ''}
                      {m.startedOn ? ` · desde el ${formatDateNumeric(m.startedOn)}` : ''}
                    </p>
                  </div>
                );
              })}
              <p class="t-sm" style="margin-top:var(--s-2)">
                Tomas registradas: {report.adherence.given} de {report.adherence.total}
                {report.adherence.omitted > 0 ? ` · omitidas: ${report.adherence.omitted}` : ''}
                {report.adherence.late > 0 ? ` · tarde: ${report.adherence.late}` : ''}
                {report.adherence.reactions > 0 ? ` · posible reacción: ${report.adherence.reactions}` : ''}
              </p>
            </ReportBlock>
          )}

          {report.weights.length > 0 && (
            <ReportBlock title="Peso">
              {report.weights.map((w) => (
                <p key={w.date} class="t-body">
                  {formatDateNumeric(w.date)} — {w.value} kg
                </p>
              ))}
              {dog?.targetWeightKg && (
                <p class="t-sm t-soft" style="margin-top:var(--s-2)">
                  Peso objetivo indicado: {dog.targetWeightKg} kg
                </p>
              )}
            </ReportBlock>
          )}

          <ReportBlock title={`Estado general (${report.states.daysRecorded} días con registro)`}>
            {report.states.buckets.filter((b) => b.count > 0).map((b) => (
              <p key={b.value} class="t-body">
                {b.label}: {b.count}
              </p>
            ))}
            {report.states.noRecord > 0 && (
              <p class="t-sm t-soft">Sin registro: {report.states.noRecord}</p>
            )}
          </ReportBlock>

          {report.mobilitySignCounts.length > 0 && (
            <ReportBlock title="Movilidad">
              <p class="t-sm t-soft" style="margin-bottom:var(--s-2)">
                Días con alguna dificultad anotada, por semana:{' '}
                {report.weeklyMobility.map((w) => w.count).join(' · ')}
              </p>
              {report.mobilitySignCounts.map((s) => (
                <p key={s.label} class="t-body">
                  {s.label}: {s.count} {s.count === 1 ? 'día' : 'días'}
                  {s.neuro ? ' ⚠' : ''}
                </p>
              ))}
              {report.firstTimeSigns.length > 0 && (
                <p class="t-sm" style="margin-top:var(--s-3);color:var(--warn)">
                  ⚠ Anotado por primera vez en el periodo:{' '}
                  {report.firstTimeSigns.map((f) => `${f.label} (${formatDayMonthShort(f.date)})`).join(', ')}
                </p>
              )}
            </ReportBlock>
          )}

          {report.discomfortSignCounts.length > 0 && (
            <ReportBlock title="Señales de incomodidad observadas">
              {report.discomfortSignCounts.map((s) => (
                <p key={s.label} class="t-body">{s.label}: {s.count} {s.count === 1 ? 'día' : 'días'}</p>
              ))}
            </ReportBlock>
          )}

          <ReportBlock title="Apetito e ingesta">
            <p class="t-body">
              Normal {report.appetite.normal} · comió menos {report.appetite.less} ·
              {' '}comió más {report.appetite.more} · no quiso comer {report.appetite.refused}
            </p>
            <p class="t-body">
              Agua: normal {report.water.normal} · menos {report.water.less} · más {report.water.more}
            </p>
          </ReportBlock>

          <ReportBlock title="Orina y heces">
            <p class="t-body">Orina: normal {report.urine.normal} · distinta {report.urine.abnormal}</p>
            <p class="t-body">
              Heces: normal {report.stool.normal} · distintas {report.stool.abnormal}
              {report.stool.bloodSeen ? ' · se anotó sangre visible' : ''}
            </p>
          </ReportBlock>

          {report.activity.sessions > 0 && (
            <ReportBlock title="Actividad">
              <p class="t-body">
                {report.activity.sessions} registros · {formatDuration(report.activity.totalMinutes)} en total ·
                {' '}media de {report.activity.avgMinutes} min
              </p>
              {(report.activity.neededToStop > 0 || report.activity.neededHelp > 0) && (
                <p class="t-body">
                  Necesitó detenerse en {report.activity.neededToStop} · necesitó ayuda en{' '}
                  {report.activity.neededHelp}
                </p>
              )}
            </ReportBlock>
          )}

          {report.events.length > 0 && (
            <ReportBlock title="Eventos registrados">
              {report.events.map((e) => (
                <div key={e.id} style="margin-bottom:var(--s-3)">
                  <p class="t-body t-medium">
                    {formatDayMonthShort(e.localDate)} — {e.category}
                  </p>
                  {e.description && <p class="t-sm">{e.description}</p>}
                </div>
              ))}
            </ReportBlock>
          )}

          {videos.length > 0 && (
            <ReportBlock title={`Vídeos seleccionados (${videos.length})`}>
              {videos.map((v, i) => (
                <p key={v.id} class="t-body">
                  {i + 1}. {formatDayMonthShort(v.localDate)} — {v.category?.replace(/_/g, ' ') ?? 'vídeo'}
                  {v.note ? ` · "${v.note}"` : ''}
                </p>
              ))}
            </ReportBlock>
          )}

          {questions.length > 0 && (
            <ReportBlock title="Preguntas">
              {questions.map((q, i) => (
                <p key={q.id} class="t-body">{i + 1}. {q.text}</p>
              ))}
            </ReportBlock>
          )}
        </div>

        <p class="t-xs t-mute" style="margin-top:var(--s-8);padding-top:var(--s-4);border-top:1px solid var(--border);text-align:center">
          Generado por Dalila Care el {formatDateNumeric(today)}. Contiene observaciones registradas en casa
          por la cuidadora. No constituye una valoración clínica.
        </p>
      </Card>
    </div>
  );
}

function ReportBlock({ title, children }: { title: string; children: preact.ComponentChildren }) {
  return (
    <section style="break-inside:avoid">
      <h2 class="t-label" style="margin-bottom:var(--s-2);padding-bottom:4px;border-bottom:1px solid var(--border)">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ReportPreview({ report, compact }: { report: ConsultReport; compact?: boolean }) {
  const top = report.mobilitySignCounts.slice(0, compact ? 3 : 10);
  return (
    <Card>
      <p class="t-label" style="margin-bottom:var(--s-3)">Lo que verá el veterinario</p>
      <div class="stack-sm">
        <Line label="Días con registro" value={`${report.daysRecorded} de ${report.daysInRange}`} />
        {report.states.buckets.filter((b) => b.count > 0).map((b) => (
          <Line key={b.value} label={b.label} value={String(b.count)} />
        ))}
        {top.length > 0 && <div class="divider" />}
        {top.map((s) => (
          <Line key={s.label} label={s.label} value={`${s.count} ${s.count === 1 ? 'día' : 'días'}`} warn={s.neuro} />
        ))}
        {report.adherence.total > 0 && (
          <>
            <div class="divider" />
            <Line label="Tomas registradas" value={`${report.adherence.given} de ${report.adherence.total}`} />
          </>
        )}
      </div>
    </Card>
  );
}

function Line({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div class="row-between">
      <span class="t-sm t-soft">{warn ? '⚠ ' : ''}{label}</span>
      <span class="t-sm t-bold" style={warn ? 'color:var(--warn)' : ''}>{value}</span>
    </div>
  );
}

function buildPlainText(
  d: typeof data.value,
  report: ConsultReport,
  questions: string[],
): string {
  const L: string[] = [];
  L.push(`${(d.dog?.name ?? 'Dalila').toUpperCase()} — resumen`);
  L.push(`Del ${formatDateNumeric(report.from)} al ${formatDateNumeric(report.to)}`);
  L.push(`Registros en ${report.daysRecorded} de ${report.daysInRange} días`);
  L.push('');

  L.push('ESTADO GENERAL');
  for (const b of report.states.buckets.filter((x) => x.count > 0)) L.push(`  ${b.label}: ${b.count}`);
  if (report.states.noRecord > 0) L.push(`  Sin registro: ${report.states.noRecord}`);
  L.push('');

  if (report.mobilitySignCounts.length > 0) {
    L.push('MOVILIDAD');
    for (const s of report.mobilitySignCounts) {
      L.push(`  ${s.label}: ${s.count} ${s.count === 1 ? 'día' : 'días'}${s.neuro ? ' (*)' : ''}`);
    }
    if (report.firstTimeSigns.length > 0) {
      L.push(`  (*) Primera vez en el periodo: ${report.firstTimeSigns.map((f) => f.label).join(', ')}`);
    }
    L.push('');
  }

  if (report.discomfortSignCounts.length > 0) {
    L.push('SEÑALES DE INCOMODIDAD');
    for (const s of report.discomfortSignCounts) L.push(`  ${s.label}: ${s.count}`);
    L.push('');
  }

  L.push('APETITO');
  L.push(`  Normal ${report.appetite.normal} · menos ${report.appetite.less} · no quiso ${report.appetite.refused}`);
  L.push('');

  if (report.adherence.total > 0) {
    L.push('MEDICACIÓN');
    L.push(`  ${report.adherence.given} de ${report.adherence.total} tomas registradas`);
    if (report.adherence.omitted) L.push(`  Omitidas: ${report.adherence.omitted}`);
    L.push('');
  }

  if (report.weights.length > 0) {
    L.push('PESO');
    for (const w of report.weights) L.push(`  ${formatDateNumeric(w.date)}: ${w.value} kg`);
    L.push('');
  }

  if (report.events.length > 0) {
    L.push('EVENTOS');
    for (const e of report.events) {
      L.push(`  ${formatDateNumeric(e.localDate)} — ${e.category}${e.description ? `: ${e.description}` : ''}`);
    }
    L.push('');
  }

  if (questions.length > 0) {
    L.push('PREGUNTAS');
    questions.forEach((q, i) => L.push(`  ${i + 1}. ${q}`));
    L.push('');
  }

  L.push('Observaciones registradas en casa. No constituye una valoración clínica.');
  return L.join('\n');
}
