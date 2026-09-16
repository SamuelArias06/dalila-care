import { useMemo, useState } from 'preact/hooks';
import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABEL,
  formatDateNumeric,
  formatDuration,
  formatRelativeDay,
  localDateOf,
  newId,
  nowIso,
} from '@dalila/shared';
import {
  Button, Card, ChoiceGroup, Empty, Field, Header, Input, Notice, Section, Select, Textarea, toast, useConfirm,
} from '../ui/Kit.js';
import { IconPlus, IconTrash } from '../ui/Icons.js';
import { data, remove, save } from '../data/store.js';
import { back, go } from '../app/router.js';
import { LineChart } from '../components/Charts.js';

// ── Peso ─────────────────────────────────────────────────────────────────────

export function WeightScreen() {
  const d = data.value;
  const [form, setForm] = useState({ weightKg: '', localDate: localDateOf(), measuredAt: 'casa', bcs: '', bcsBy: '', note: '' });
  const [error, setError] = useState('');
  const { confirm, dialog } = useConfirm();

  const entries = useMemo(
    () => d.weights.filter((w) => !w.deletedAt).sort((a, b) => (a.localDate < b.localDate ? 1 : -1)),
    [d.weights],
  );

  const series = useMemo(
    () => [...entries].reverse().map((w) => ({ date: w.localDate, value: w.weightKg })),
    [entries],
  );

  const submit = async () => {
    const kg = Number(form.weightKg.replace(',', '.'));
    if (!Number.isFinite(kg) || kg <= 0) {
      setError('Escribe el peso en kilos.');
      return;
    }
    await save('weights', newId('wgt'), {
      localDate: form.localDate,
      weightKg: kg,
      measuredAt: form.measuredAt,
      bcsValue: form.bcs ? Number(form.bcs) : null,
      bcsAssessedBy: form.bcsBy.trim(),
      note: form.note.trim(),
    }, 'wgt');
    if (d.dog) await save('dog', d.dog.id, { currentWeightKg: kg });
    setForm({ ...form, weightKg: '', bcs: '', bcsBy: '', note: '' });
    toast('Peso registrado ✓');
  };

  return (
    <div class="stack-lg">
      <Header title="Peso" back="/dalila" />

      {series.length >= 2 && (
        <Card>
          <p class="t-label" style="margin-bottom:var(--s-3)">Evolución</p>
          <LineChart points={series} unit="kg" target={d.dog?.targetWeightKg ?? null} />
          {d.dog?.targetWeightKg && (
            <p class="t-xs t-mute" style="margin-top:var(--s-3)">
              Peso objetivo indicado por el veterinario: {d.dog.targetWeightKg} kg
            </p>
          )}
        </Card>
      )}

      <Card>
        <p class="t-label" style="margin-bottom:var(--s-3)">Registrar peso</p>
        <div class="stack">
          <Field label="Peso (kg)" error={error}>
            <Input
              type="text"
              inputMode="decimal"
              value={form.weightKg}
              placeholder="32.8"
              onInput={(e) => { setForm({ ...form, weightKg: (e.target as HTMLInputElement).value }); setError(''); }}
            />
          </Field>
          <Field label="Fecha">
            <Input type="date" max={localDateOf()} value={form.localDate} onInput={(e) => setForm({ ...form, localDate: (e.target as HTMLInputElement).value })} />
          </Field>
          <Field label="¿Dónde se pesó?">
            <Select value={form.measuredAt} onChange={(e) => setForm({ ...form, measuredAt: (e.target as HTMLSelectElement).value })}>
              <option value="casa">En casa</option>
              <option value="clinica">En la clínica</option>
              <option value="otro">Otro sitio</option>
            </Select>
          </Field>
          <Field
            label="Condición corporal (BCS) asignada por el veterinario"
            hint="Sólo si un veterinario la valoró. La app nunca la calcula ni la estima."
          >
            <Select value={form.bcs} onChange={(e) => setForm({ ...form, bcs: (e.target as HTMLSelectElement).value })}>
              <option value="">No la valoraron</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <option key={n} value={n}>{n} de 9</option>
              ))}
            </Select>
          </Field>
          {form.bcs && (
            <Field label="¿Quién la valoró?">
              <Input value={form.bcsBy} onInput={(e) => setForm({ ...form, bcsBy: (e.target as HTMLInputElement).value })} />
            </Field>
          )}
          <Field label="Nota">
            <Input value={form.note} onInput={(e) => setForm({ ...form, note: (e.target as HTMLInputElement).value })} />
          </Field>
          <Button variant="primary" block onClick={() => void submit()}>Guardar</Button>
        </div>
      </Card>

      {entries.length > 0 && (
        <Section title="Historial">
          <Card pad={false}>
            <div class="list">
              {entries.map((w) => (
                <div key={w.id} class="list-item">
                  <span class="grow">
                    <span class="t-body t-medium" style="display:block">{w.weightKg} kg</span>
                    <span class="t-xs t-soft">
                      {formatDateNumeric(w.localDate)} · {w.measuredAt === 'clinica' ? 'clínica' : 'casa'}
                      {w.bcsValue ? ` · BCS ${w.bcsValue}/9 (${w.bcsAssessedBy || 'veterinario'})` : ''}
                    </span>
                    {w.note && <span class="t-xs t-soft">{w.note}</span>}
                  </span>
                  <button
                    type="button"
                    aria-label="Eliminar registro"
                    style="padding:8px;color:var(--ink-mute)"
                    onClick={async () => {
                      if (await confirm({ title: '¿Eliminar este registro?', confirmLabel: 'Eliminar', danger: true })) {
                        await remove('weights', w.id);
                      }
                    }}
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      )}

      <Notice tone="info">
        El peso objetivo y la condición corporal los define el veterinario tras valorar a Dalila.
        Esta app sólo guarda lo que te indiquen.
      </Notice>

      {dialog}
    </div>
  );
}

// ── Actividad ────────────────────────────────────────────────────────────────

export function ActivityScreen() {
  const d = data.value;
  const [form, setForm] = useState({
    type: 'paseo', durationMin: '', surface: '', intensity: '',
    startedHow: '', endedHow: '', neededToStop: false, neededHelp: false, wantedToContinue: false, note: '',
  });
  const { confirm, dialog } = useConfirm();

  const recent = useMemo(
    () => d.activities.filter((a) => !a.deletedAt).sort((a, b) => (a.localDate < b.localDate ? 1 : -1)).slice(0, 30),
    [d.activities],
  );

  const submit = async () => {
    await save('activities', newId('act'), {
      localDate: localDateOf(),
      type: form.type,
      startedAt: nowIso(),
      durationMin: form.durationMin ? Number(form.durationMin) : null,
      surface: form.surface,
      intensity: form.intensity,
      startedHow: form.startedHow,
      endedHow: form.endedHow,
      neededToStop: form.neededToStop,
      neededHelp: form.neededHelp,
      wantedToContinue: form.wantedToContinue,
      note: form.note.trim(),
    }, 'act');
    setForm({ ...form, durationMin: '', note: '', neededToStop: false, neededHelp: false, wantedToContinue: false });
    toast('Paseo registrado ✓');
  };

  return (
    <div class="stack-lg">
      <Header title="Actividad" back="/dalila" />

      <Notice tone="info">
        Esta app no propone planes de ejercicio ni metas de minutos. Cuánto y cómo debe moverse Dalila
        lo decide su veterinario o su fisioterapeuta.
      </Notice>

      <Card>
        <p class="t-label" style="margin-bottom:var(--s-3)">Registrar</p>
        <div class="stack">
          <Field label="Tipo">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: (e.target as HTMLSelectElement).value })}>
              <option value="paseo">Paseo</option>
              <option value="juego">Juego</option>
              <option value="ejercicio_terapeutico">Ejercicio terapéutico</option>
              <option value="otro">Otro</option>
            </Select>
          </Field>
          <Field label="Duración (minutos)">
            <Input type="number" inputMode="numeric" value={form.durationMin} onInput={(e) => setForm({ ...form, durationMin: (e.target as HTMLInputElement).value })} />
          </Field>
          <Field label="Superficie">
            <ChoiceGroup
              options={[
                { value: 'pasto', label: 'Pasto' }, { value: 'asfalto', label: 'Asfalto' },
                { value: 'piso_liso', label: 'Piso liso' }, { value: 'arena', label: 'Arena' },
                { value: 'mixto', label: 'Mixto' },
              ] as const}
              value={form.surface as never}
              onChange={(v) => setForm({ ...form, surface: v })}
            />
          </Field>
          <Field label="Intensidad">
            <ChoiceGroup
              options={[
                { value: 'muy_suave', label: 'Muy suave' }, { value: 'suave', label: 'Suave' },
                { value: 'moderada', label: 'Moderada' },
              ] as const}
              value={form.intensity as never}
              onChange={(v) => setForm({ ...form, intensity: v })}
            />
          </Field>
          <Field label="¿Cómo empezó?">
            <ChoiceGroup
              options={[
                { value: 'bien', label: 'Bien' }, { value: 'rigida', label: 'Rígida' },
                { value: 'con_dificultad', label: 'Con dificultad' },
              ] as const}
              value={form.startedHow as never}
              onChange={(v) => setForm({ ...form, startedHow: v })}
            />
          </Field>
          <Field label="¿Cómo terminó?">
            <ChoiceGroup
              options={[
                { value: 'bien', label: 'Bien' }, { value: 'cansada', label: 'Cansada' },
                { value: 'cojeando', label: 'Cojeando' }, { value: 'con_dificultad', label: 'Con dificultad' },
              ] as const}
              value={form.endedHow as never}
              onChange={(v) => setForm({ ...form, endedHow: v })}
            />
          </Field>

          <div class="stack-sm">
            {([
              ['neededToStop', 'Necesitó detenerse'],
              ['neededHelp', 'Necesitó ayuda'],
              ['wantedToContinue', 'Quería seguir'],
            ] as const).map(([key, label]) => (
              <label key={key} class="row" style="gap:var(--s-3);cursor:pointer">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: (e.target as HTMLInputElement).checked })}
                  style="width:22px;height:22px;accent-color:var(--accent)"
                />
                <span class="t-body">{label}</span>
              </label>
            ))}
          </div>

          <Field label="Nota">
            <Textarea rows={2} value={form.note} onInput={(e) => setForm({ ...form, note: (e.target as HTMLTextAreaElement).value })} />
          </Field>

          <Button variant="primary" block onClick={() => void submit()}>Guardar</Button>
        </div>
      </Card>

      {recent.length > 0 && (
        <Section title="Últimos registros">
          <Card pad={false}>
            <div class="list">
              {recent.map((a) => (
                <div key={a.id} class="list-item">
                  <span style="width:24px">🐕</span>
                  <span class="grow">
                    <span class="t-body" style="display:block">{formatDuration(a.durationMin ?? 0)}</span>
                    <span class="t-xs t-soft">
                      {formatRelativeDay(a.localDate)}
                      {a.endedHow ? ` · terminó ${a.endedHow.replace('_', ' ')}` : ''}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label="Eliminar"
                    style="padding:8px;color:var(--ink-mute)"
                    onClick={async () => {
                      if (await confirm({ title: '¿Eliminar este registro?', confirmLabel: 'Eliminar', danger: true })) {
                        await remove('activities', a.id);
                      }
                    }}
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      )}

      {dialog}
    </div>
  );
}

// ── Eventos y notas ──────────────────────────────────────────────────────────

export function EventsScreen() {
  const d = data.value;
  const [text, setText] = useState('');
  const [category, setCategory] = useState('otro');
  const { confirm, dialog } = useConfirm();

  const events = useMemo(
    () => d.events.filter((e) => !e.deletedAt).sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1)).slice(0, 60),
    [d.events],
  );

  const submit = async () => {
    if (!text.trim()) return;
    await save('events', newId('evt'), {
      localDate: localDateOf(),
      occurredAt: nowIso(),
      category,
      description: text.trim(),
      isConcern: false,
      extraSigns: [],
      mediaIds: [],
    }, 'evt');
    setText('');
    toast('Nota guardada ✓');
  };

  return (
    <div class="stack-lg">
      <Header title="Notas y eventos" back="/dalila" />

      <Card>
        <div class="stack">
          <Field label="¿Qué quieres anotar?">
            <Textarea
              rows={3}
              value={text}
              placeholder="Le costó levantarse después de dormir…"
              onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
            />
          </Field>
          <Field label="Tipo">
            <Select value={category} onChange={(e) => setCategory((e.target as HTMLSelectElement).value)}>
              {EVENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{EVENT_CATEGORY_LABEL[c]}</option>
              ))}
            </Select>
          </Field>
          <Button variant="primary" block disabled={!text.trim()} onClick={() => void submit()}>
            Guardar nota
          </Button>
        </div>
      </Card>

      <Button variant="alert-soft" block onClick={() => go('/preocupa')}>
        ⚠️ Me preocupa algo
      </Button>

      {events.length === 0 ? (
        <Empty emoji="📝" title="Sin notas todavía" body="Lo que anotes aquí aparecerá también en el historial y en el resumen para el veterinario." />
      ) : (
        <Section title="Registradas">
          <div class="stack-sm">
            {events.map((e) => (
              <Card key={e.id}>
                <div class="row-between">
                  <span class="t-xs t-bold" style={e.isConcern ? 'color:var(--alert)' : 'color:var(--ink-mute)'}>
                    {e.isConcern ? '⚠️ ' : ''}{EVENT_CATEGORY_LABEL[e.category] ?? e.category}
                  </span>
                  <span class="t-xs t-mute">{formatRelativeDay(e.localDate)}</span>
                </div>
                {e.description && <p class="t-body" style="margin-top:var(--s-2)">{e.description}</p>}
                <button
                  type="button"
                  class="t-xs"
                  style="color:var(--ink-mute);margin-top:var(--s-3)"
                  onClick={async () => {
                    if (await confirm({ title: '¿Eliminar esta nota?', confirmLabel: 'Eliminar', danger: true })) {
                      await remove('events', e.id);
                    }
                  }}
                >
                  Eliminar
                </button>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {dialog}
    </div>
  );
}
