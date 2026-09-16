import { useState } from 'preact/hooks';
import {
  CONCERN_SIGNS,
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABEL,
  TRIAGE_LABEL,
  localDateOf,
  newId,
  nowIso,
  triageConcern,
  type EventCategory,
  type TriageResult,
} from '@dalila/shared';
import { Button, Card, Chip, Field, Header, Notice, Textarea, toast } from '../ui/Kit.js';
import { IconAlert, IconPhone, IconQuestion, IconVideo } from '../ui/Icons.js';
import { data, save } from '../data/store.js';
import { back, go } from '../app/router.js';
import { MediaCaptureButton } from '../components/MediaCapture.js';

type SinceWhen = 'ahora' | 'hoy' | 'ayer' | 'varios_dias';

const SINCE_OPTIONS: { value: SinceWhen; label: string }[] = [
  { value: 'ahora', label: 'Ahora mismo' },
  { value: 'hoy', label: 'Desde hoy' },
  { value: 'ayer', label: 'Desde ayer' },
  { value: 'varios_dias', label: 'Varios días' },
];

/**
 * "Me preocupa algo" en tres pasos.
 *
 * La orientación sale del motor de reglas documentado en docs/RED_FLAGS.md.
 * Nunca nombra una enfermedad ni da un diagnóstico: describe la acción y cita
 * la fuente. Se guarda qué regla se mostró, para poder revisarla después.
 */
export function ConcernScreen() {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<EventCategory | ''>('');
  const [since, setSince] = useState<SinceWhen | ''>('');
  const [signs, setSigns] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<TriageResult | null>(null);
  const [eventId, setEventId] = useState('');
  const [showSource, setShowSource] = useState(false);

  const dog = data.value.dog;

  const submit = async () => {
    const triage = triageConcern({
      category: (category || 'otro') as EventCategory,
      sinceWhen: since || '',
      signs,
    });
    setResult(triage);

    const id = newId('evt');
    setEventId(id);
    await save(
      'events',
      id,
      {
        localDate: localDateOf(),
        occurredAt: nowIso(),
        category: category || 'otro',
        sinceWhen: since || '',
        extraSigns: signs,
        description: description.trim(),
        triageLevel: triage.level,
        triageRuleId: triage.rule.id,
        isConcern: true,
        mediaIds: [],
      },
      'evt',
    );
    setStep(2);
  };

  return (
    <div class="stack-lg">
      <Header
        title="Me preocupa algo"
        back={() => (step === 0 ? back('/') : setStep((s) => s - 1))}
      />

      {step === 0 && (
        <div class="stack-lg rise">
          <p class="t-md t-soft">¿Qué notaste?</p>
          <div class="stack-sm">
            {EVENT_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                class="glass"
                style={`display:flex;align-items:center;gap:var(--s-3);padding:var(--s-4) var(--s-5);text-align:left;
                  border-color:${category === c ? 'var(--brand)' : 'var(--border)'}`}
                onClick={() => {
                  setCategory(c);
                  setStep(1);
                }}
              >
                <span class="grow t-body t-medium">{EVENT_CATEGORY_LABEL[c]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div class="stack-lg rise">
          <div>
            <p class="t-heading">{EVENT_CATEGORY_LABEL[category || 'otro']}</p>
            <p class="t-sm t-soft" style="margin-top:2px">Cuéntame un poco más.</p>
          </div>

          <Card>
            <p class="t-label" style="margin-bottom:var(--s-3)">¿Desde cuándo?</p>
            <div class="chip-grid">
              {SINCE_OPTIONS.map((o) => (
                <Chip key={o.value} selected={since === o.value} onToggle={() => setSince(o.value)}>
                  {o.label}
                </Chip>
              ))}
            </div>
          </Card>

          <Card>
            <p class="t-label">¿Pasa algo más?</p>
            <p class="t-xs t-soft" style="margin-top:4px;margin-bottom:var(--s-3)">
              Marca todo lo que veas. Esto cambia la orientación que te damos.
            </p>
            <div class="chip-grid">
              {CONCERN_SIGNS.map((s) => (
                <Chip
                  key={s.id}
                  selected={signs.includes(s.id)}
                  onToggle={() =>
                    setSigns((prev) => (prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]))
                  }
                >
                  {s.label}
                </Chip>
              ))}
            </div>
          </Card>

          <Card>
            <Field label="Describe lo que viste">
              <Textarea
                rows={3}
                value={description}
                placeholder="Al levantarse se quedó parada un rato…"
                onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
              />
            </Field>
          </Card>

          <Button variant="primary" size="lg" block onClick={() => void submit()}>
            Registrar
          </Button>
        </div>
      )}

      {step === 2 && result && (
        <div class="stack-lg rise">
          <div class="badge badge--ok" style="align-self:flex-start">Registrado ✓</div>

          <TriageCard result={result} showSource={showSource} onToggleSource={() => setShowSource((s) => !s)} />

          {(result.level === 'urgencia' || result.level === 'contactar_hoy') && (
            <div class="stack-sm">
              {dog?.emergencyPhone && (
                <a class="btn btn--alert btn--block" href={`tel:${dog.emergencyPhone}`}>
                  <IconPhone size={19} /> Urgencias · {dog.emergencyPhone}
                </a>
              )}
              {dog?.vetPhone && (
                <a class="btn btn--soft btn--block" href={`tel:${dog.vetPhone}`}>
                  <IconPhone size={19} /> Llamar a {dog.vetClinic || 'la clínica'}
                </a>
              )}
              {!dog?.emergencyPhone && !dog?.vetPhone && (
                <Notice tone="warn">
                  No tienes guardado un teléfono de urgencias.{' '}
                  <button
                    type="button"
                    style="color:var(--accent-ink);font-weight:600;text-decoration:underline"
                    onClick={() => go('/perfil')}
                  >
                    Añádelo ahora
                  </button>
                  {' '}— es lo primero que vas a necesitar si algún día pasa algo.
                </Notice>
              )}
            </div>
          )}

          <Card>
            <p class="t-label" style="margin-bottom:var(--s-3)">¿Quieres añadir algo?</p>
            <div class="stack-sm">
              <MediaCaptureButton
                kind="video"
                purpose="seguimiento"
                category="episodio"
                linkedEventId={eventId}
                label="Grabar un vídeo de lo que ves"
                icon={<IconVideo size={19} />}
              />
              <Button
                variant="soft"
                block
                onClick={async () => {
                  await save('questions', newId('vtq'), {
                    text: `Sobre lo que pasó el ${localDateOf()}: ${EVENT_CATEGORY_LABEL[category || 'otro']}. ${description.trim()}`.trim(),
                    context: 'Creada desde "Me preocupa algo"',
                    status: 'pendiente',
                  }, 'vtq');
                  toast('Guardado para la próxima consulta');
                }}
              >
                <IconQuestion size={19} /> Guardar como pregunta para la consulta
              </Button>
            </div>
          </Card>

          <Button variant="quiet" block onClick={() => back('/')}>
            Volver a Hoy
          </Button>
        </div>
      )}
    </div>
  );
}

function TriageCard({
  result,
  showSource,
  onToggleSource,
}: {
  result: TriageResult;
  showSource: boolean;
  onToggleSource: () => void;
}) {
  const urgent = result.level === 'urgencia';
  const warm = result.level === 'contactar_hoy';

  const bg = urgent ? 'var(--alert)' : warm ? 'var(--alert-soft)' : 'var(--warn-soft)';
  const fg = urgent ? '#fff' : warm ? 'var(--alert)' : 'var(--warn)';
  const bodyColor = urgent ? 'rgba(255,255,255,.92)' : 'var(--ink-soft)';

  return (
    <div style={`background:${bg};border-radius:var(--r-lg);padding:var(--s-5);box-shadow:var(--shadow-md)`}>
      <div class="row" style="align-items:flex-start;gap:var(--s-3)">
        <span style={`color:${fg};flex-shrink:0;margin-top:2px`}>
          <IconAlert size={24} />
        </span>
        <div class="grow">
          <p class="t-xs t-bold" style={`color:${fg};opacity:.8;text-transform:uppercase;letter-spacing:.06em`}>
            {TRIAGE_LABEL[result.level]}
          </p>
          <p class="t-subtitle" style={`color:${fg};margin-top:4px`}>{result.rule.title}</p>
          <p class="t-body" style={`color:${bodyColor};margin-top:var(--s-3)`}>{result.rule.body}</p>
        </div>
      </div>

      <hr style={`border:none;height:1px;background:${urgent ? 'rgba(255,255,255,.22)' : 'var(--border)'};margin:var(--s-4) 0`} />

      <p class="t-xs" style={`color:${urgent ? 'rgba(255,255,255,.8)' : 'var(--ink-mute)'}`}>
        Esta orientación es general y no sustituye la valoración de un veterinario.
      </p>

      <button
        type="button"
        class="t-xs t-medium"
        style={`color:${urgent ? '#fff' : 'var(--accent-ink)'};margin-top:var(--s-2);text-decoration:underline`}
        onClick={onToggleSource}
      >
        {showSource ? 'Ocultar' : '→ De dónde viene esto'}
      </button>

      {showSource && (
        <div style={`margin-top:var(--s-3);font-size:var(--t-xs);color:${urgent ? 'rgba(255,255,255,.85)' : 'var(--ink-soft)'}`}>
          <p><strong>Regla {result.rule.id}</strong></p>
          <p style="margin-top:4px">Fuente: {result.rule.source}</p>
          {result.matched.length > 1 && (
            <p style="margin-top:4px">
              También se cumplieron: {result.matched.slice(1).map((m) => m.id).join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
