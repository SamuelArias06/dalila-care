import { useMemo, useState } from 'preact/hooks';
import {
  TIME_OF_DAY_LABEL,
  TIME_OF_DAY_ORDER,
  feedingToleranceFor,
  findFoodWarning,
  formatDateNumeric,
  localDateOf,
  newId,
  type FeedingPlanItem,
  type FoodItem,
  type TimeOfDay,
} from '@dalila/shared';
import {
  Button, Card, Chip, Field, Header, Input, Notice, Section, Select, Sheet, Textarea, toast, useConfirm,
} from '../ui/Kit.js';
import { IconAlert, IconPlus } from '../ui/Icons.js';
import { data, remove, save } from '../data/store.js';
import { back, go } from '../app/router.js';

export function FoodScreen() {
  const d = data.value;
  const [logging, setLogging] = useState<{ plan: FeedingPlanItem; food: FoodItem } | null>(null);

  const foods = new Map(d.foods.filter((f) => !f.deletedAt).map((f) => [f.id, f]));
  const active = d.feedingPlan.filter((p) => !p.deletedAt && p.active && !p.effectiveTo);
  const past = d.feedingPlan.filter((p) => !p.deletedAt && (!p.active || p.effectiveTo));

  return (
    <div class="stack-lg">
      <Header
        title="Alimentación"
        back="/dalila"
        action={
          <Button variant="primary" size="sm" onClick={() => go(`/alimentacion/${newId('fpi')}`)}>
            <IconPlus size={17} /> Añadir
          </Button>
        }
      />

      {active.length === 0 && (
        <Card>
          <p class="t-body t-soft center" style="padding:var(--s-4) 0">
            Todavía no hay un plan de alimentación.
          </p>
        </Card>
      )}

      {active.length > 0 && (
        <Section title="Plan actual">
          <div class="stack-sm">
            {active.map((p) => {
              const food = foods.get(p.foodId);
              if (!food) return null;
              const tol = feedingToleranceFor(d.feedingLogs, food.id);
              return (
                <Card key={p.id}>
                  <button type="button" style="text-align:left;width:100%" onClick={() => go(`/alimentacion/${p.id}`)}>
                    <p class="t-subtitle">
                      {food.type === 'principal' ? '🥣' : food.type === 'suplemento' ? '💊' : '🫐'} {food.name}
                    </p>
                    <p class="t-body t-soft" style="margin-top:var(--s-2)">
                      {p.amountText || 'Sin cantidad anotada'}
                      {p.timesOfDay.length > 0
                        ? ` · ${p.timesOfDay.map((t) => TIME_OF_DAY_LABEL[t as TimeOfDay]?.toLowerCase()).join(' y ')}`
                        : ''}
                    </p>
                    {p.purpose && <p class="t-sm t-soft" style="margin-top:4px">"{p.purpose}"</p>}
                    <p class="t-xs t-mute" style="margin-top:var(--s-2)">
                      {p.recommendedBy === 'veterinario'
                        ? `Indicado por ${p.recommendedByName || 'el veterinario'}`
                        : 'Decisión de la cuidadora'}
                      {p.effectiveFrom ? ` · desde el ${formatDateNumeric(p.effectiveFrom)}` : ''}
                    </p>

                    {tol.total > 0 && (
                      <p
                        class="t-xs"
                        style={`margin-top:var(--s-2);color:${tol.withReaction > 0 ? 'var(--warn)' : 'var(--verde-600)'}`}
                      >
                        {tol.withReaction === 0
                          ? `Bien tolerada (${tol.total} de ${tol.total})`
                          : `⚠️ ${tol.withReaction} de ${tol.total} veces con alguna reacción anotada`}
                      </p>
                    )}
                  </button>

                  {food.safetyNote && (
                    <div style="margin-top:var(--s-3)">
                      <Notice tone="warn" icon={<IconAlert size={18} />}>
                        {food.safetyNote}
                        <p class="t-xs t-mute" style="margin-top:4px">Fuente: {food.safetySource}</p>
                      </Notice>
                    </div>
                  )}

                  <Button variant="soft" block style="margin-top:var(--s-4)" onClick={() => setLogging({ plan: p, food })}>
                    Registrar comida
                  </Button>
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      {past.length > 0 && (
        <Section title="Histórico">
          <Card pad={false}>
            <div class="list">
              {past.map((p) => {
                const food = foods.get(p.foodId);
                return (
                  <div key={p.id} class="list-item" style="opacity:.75">
                    <span class="grow">
                      <span class="t-body" style="display:block">{food?.name ?? 'Alimento'}</span>
                      <span class="t-xs t-soft">
                        {p.effectiveFrom ? formatDateNumeric(p.effectiveFrom) : ''}
                        {p.effectiveTo ? ` – ${formatDateNumeric(p.effectiveTo)}` : ''}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </Section>
      )}

      <p class="t-xs t-mute center" style="padding:0 var(--s-4)">
        Esta app no recomienda cantidades ni dietas. Lo que come Dalila lo decide su veterinario.
      </p>

      <FeedingSheet entry={logging} onClose={() => setLogging(null)} />
    </div>
  );
}

function FeedingSheet({
  entry,
  onClose,
}: {
  entry: { plan: FeedingPlanItem; food: FoodItem } | null;
  onClose: () => void;
}) {
  const [reaction, setReaction] = useState('ninguna');
  const [note, setNote] = useState('');

  if (!entry) return null;

  const record = async (result: string) => {
    await save(
      'feedingLogs',
      newId('flg'),
      {
        localDate: localDateOf(),
        feedingPlanItemId: entry.plan.id,
        foodId: entry.food.id,
        result,
        reaction,
        reactionNote: reaction !== 'ninguna' ? note.trim() : '',
        foodNameSnapshot: entry.food.name,
        amountTextSnapshot: entry.plan.amountText,
        note: note.trim(),
      },
      'flg',
    );
    toast('Registrado ✓');
    setReaction('ninguna');
    setNote('');
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title={entry.food.name}>
      <div class="stack">
        <Field label="¿Le sentó bien?">
          <Select value={reaction} onChange={(e) => setReaction((e.target as HTMLSelectElement).value)}>
            <option value="ninguna">Sin reacción</option>
            <option value="vomito">Vómito</option>
            <option value="diarrea">Diarrea</option>
            <option value="picor">Picor</option>
            <option value="decaimiento">Decaimiento</option>
            <option value="otro">Otra cosa</option>
          </Select>
        </Field>

        <Field label="Nota (opcional)">
          <Textarea rows={2} value={note} onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)} />
        </Field>

        <Button variant="primary" block onClick={() => void record('comio_todo')}>✅ Comió todo</Button>
        <Button variant="soft" block onClick={() => void record('comio_parcial')}>➖ Comió parte</Button>
        <Button variant="soft" block onClick={() => void record('no_quiso')}>❌ No quiso</Button>
      </div>
    </Sheet>
  );
}

// ── Editor ───────────────────────────────────────────────────────────────────

export function FoodEditScreen({ id }: { id: string }) {
  const d = data.value;
  const existingPlan = d.feedingPlan.find((p) => p.id === id && !p.deletedAt) ?? null;
  const existingFood = existingPlan ? d.foods.find((f) => f.id === existingPlan.foodId) ?? null : null;
  const { confirm, dialog } = useConfirm();

  const [form, setForm] = useState({
    name: existingFood?.name ?? '',
    type: existingFood?.type ?? 'complemento',
    amountText: existingPlan?.amountText ?? '',
    timesOfDay: (existingPlan?.timesOfDay ?? []) as string[],
    frequencyText: existingPlan?.frequencyText ?? '',
    purpose: existingPlan?.purpose ?? '',
    recommendedBy: existingPlan?.recommendedBy ?? 'cuidadora',
    recommendedByName: existingPlan?.recommendedByName ?? '',
    notes: existingPlan?.notes ?? '',
  });
  const [error, setError] = useState('');
  const [ackWarning, setAckWarning] = useState(false);

  const warning = useMemo(() => findFoodWarning(form.name), [form.name]);
  const blocked = !!warning && !ackWarning && !existingFood;

  const submit = async () => {
    if (!form.name.trim()) {
      setError('¿Qué alimento es?');
      return;
    }

    const foodId = existingFood?.id ?? newId('fdi');
    await save('foods', foodId, {
      name: form.name.trim(),
      type: form.type,
      active: true,
      safetyNote: warning?.warning ?? '',
      safetySource: warning?.source ?? '',
    }, 'fdi');

    await save('feedingPlan', id, {
      foodId,
      amountText: form.amountText.trim(),
      timesOfDay: form.timesOfDay,
      frequencyText: form.frequencyText.trim(),
      purpose: form.purpose.trim(),
      recommendedBy: form.recommendedBy,
      recommendedByName: form.recommendedByName.trim(),
      effectiveFrom: existingPlan?.effectiveFrom ?? localDateOf(),
      active: true,
      notes: form.notes.trim(),
    }, 'fpi');

    toast(existingPlan ? 'Actualizado' : 'Añadido al plan');
    back('/alimentacion');
  };

  return (
    <div class="stack-lg">
      <Header title={existingPlan ? 'Editar alimento' : 'Añadir alimento'} back="/alimentacion" />

      {warning && (
        <Notice tone="alert" title={warning.label} icon={<IconAlert size={20} />}>
          {warning.warning}
          <p class="t-xs t-mute" style="margin-top:var(--s-2)">Fuente: {warning.source}</p>
          {!ackWarning && !existingFood && (
            <div class="row" style="gap:var(--s-2);margin-top:var(--s-3);flex-wrap:wrap">
              <Button variant="soft" size="sm" onClick={() => back('/alimentacion')}>
                Entendido, no lo añado
              </Button>
              <Button variant="quiet" size="sm" onClick={() => setAckWarning(true)}>
                Añadirlo de todas formas
              </Button>
            </div>
          )}
        </Notice>
      )}

      <Card>
        <div class="stack">
          <Field label="Nombre" error={error}>
            <Input
              value={form.name}
              placeholder="Concentrado senior, sardina, zanahoria…"
              onInput={(e) => { setForm({ ...form, name: (e.target as HTMLInputElement).value }); setError(''); setAckWarning(false); }}
            />
          </Field>

          <Field label="Tipo">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: (e.target as HTMLSelectElement).value as never })}>
              <option value="principal">Alimento principal</option>
              <option value="complemento">Complemento</option>
              <option value="premio">Premio</option>
              <option value="suplemento">Suplemento indicado</option>
            </Select>
          </Field>

          <Field label="Cantidad" hint="Tal como se la das: «2 tazas», «media lata»…">
            <Input value={form.amountText} onInput={(e) => setForm({ ...form, amountText: (e.target as HTMLInputElement).value })} />
          </Field>

          <Field label="¿Cuándo?">
            <div class="chip-grid">
              {TIME_OF_DAY_ORDER.map((t) => (
                <Chip
                  key={t}
                  selected={form.timesOfDay.includes(t)}
                  onToggle={() =>
                    setForm({
                      ...form,
                      timesOfDay: form.timesOfDay.includes(t)
                        ? form.timesOfDay.filter((x) => x !== t)
                        : [...form.timesOfDay, t],
                    })
                  }
                >
                  {TIME_OF_DAY_LABEL[t]}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Frecuencia">
            <Input
              value={form.frequencyText}
              placeholder="Todos los días · lunes y jueves · de vez en cuando"
              onInput={(e) => setForm({ ...form, frequencyText: (e.target as HTMLInputElement).value })}
            />
          </Field>

          <Field label="¿Por qué se lo das?">
            <Input
              value={form.purpose}
              placeholder="Por el omega-3"
              onInput={(e) => setForm({ ...form, purpose: (e.target as HTMLInputElement).value })}
            />
          </Field>

          <Field label="¿Quién lo recomendó?">
            <Select
              value={form.recommendedBy}
              onChange={(e) => setForm({ ...form, recommendedBy: (e.target as HTMLSelectElement).value as never })}
            >
              <option value="cuidadora">Lo decidí yo</option>
              <option value="veterinario">El veterinario</option>
              <option value="otro">Otra persona</option>
            </Select>
          </Field>

          {form.recommendedBy !== 'cuidadora' && (
            <Field label="Nombre">
              <Input value={form.recommendedByName} onInput={(e) => setForm({ ...form, recommendedByName: (e.target as HTMLInputElement).value })} />
            </Field>
          )}

          <Field label="Notas">
            <Textarea rows={2} value={form.notes} onInput={(e) => setForm({ ...form, notes: (e.target as HTMLTextAreaElement).value })} />
          </Field>
        </div>
      </Card>

      <Button variant="primary" size="lg" block disabled={blocked} onClick={() => void submit()}>
        Guardar
      </Button>

      {existingPlan && (
        <Button
          variant="alert-soft"
          block
          onClick={async () => {
            const ok = await confirm({
              title: '¿Quitarlo del plan?',
              body: 'Dejará de aparecer en el plan actual, pero las comidas ya registradas se conservan tal como fueron.',
              confirmLabel: 'Quitar del plan',
              danger: true,
            });
            if (ok) {
              await save('feedingPlan', id, { active: false, effectiveTo: localDateOf() });
              toast('Quitado del plan');
              back('/alimentacion');
            }
          }}
        >
          Quitar del plan actual
        </Button>
      )}

      {dialog}
    </div>
  );
}
