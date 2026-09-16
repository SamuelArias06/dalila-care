import { useMemo, useState } from 'preact/hooks';
import {
  TIME_OF_DAY_LABEL,
  TIME_OF_DAY_ORDER,
  newId,
  type RoutineTask,
  type TimeOfDay,
} from '@dalila/shared';
import {
  Button,
  Card,
  Chip,
  Field,
  Header,
  Input,
  Notice,
  Section,
  Select,
  Textarea,
  toast,
  useConfirm,
} from '../ui/Kit.js';
import { IconLock, IconPlus, IconTrash } from '../ui/Icons.js';
import { data, remove, save } from '../data/store.js';
import { back, go } from '../app/router.js';

const WEEKDAYS = [
  { n: 1, label: 'L' }, { n: 2, label: 'M' }, { n: 3, label: 'X' }, { n: 4, label: 'J' },
  { n: 5, label: 'V' }, { n: 6, label: 'S' }, { n: 7, label: 'D' },
];

const CATEGORIES = [
  { value: 'comida', label: 'Comida' },
  { value: 'medicacion', label: 'Medicación' },
  { value: 'actividad', label: 'Actividad' },
  { value: 'higiene', label: 'Higiene' },
  { value: 'terapia', label: 'Terapia' },
  { value: 'registro', label: 'Registro' },
  { value: 'otro', label: 'Otro' },
];

const EMOJIS = ['🥣', '💊', '🐕', '💧', '🌙', '🔥', '🪥', '🧴', '🦴', '🧸', '☀️', '🛁', '✨', '📝'];

export function RoutinesScreen() {
  const d = data.value;
  const { confirm, dialog } = useConfirm();

  const active = d.tasks.filter((t) => !t.deletedAt && t.active);
  const paused = d.tasks.filter((t) => !t.deletedAt && !t.active);

  const byTime = useMemo(() => {
    const map = new Map<TimeOfDay, RoutineTask[]>();
    for (const tod of TIME_OF_DAY_ORDER) map.set(tod, []);
    for (const t of active) map.get(t.timeOfDay)?.push(t);
    for (const list of map.values()) {
      list.sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? '') || a.order - b.order);
    }
    return map;
  }, [active]);

  const move = async (task: RoutineTask, dir: -1 | 1) => {
    const siblings = byTime.get(task.timeOfDay) ?? [];
    const idx = siblings.findIndex((t) => t.id === task.id);
    const target = siblings[idx + dir];
    if (!target) return;
    await save('tasks', task.id, { order: target.order });
    await save('tasks', target.id, { order: task.order });
  };

  return (
    <div class="stack-lg">
      <Header
        title="Rutinas"
        subtitle="Cámbialas cuando quieras. Esta app se adapta a Dalila, no al revés."
        back="/dalila"
        action={
          <Button variant="primary" size="sm" onClick={() => go(`/rutinas/${newId('tsk')}`)}>
            <IconPlus size={17} /> Nueva
          </Button>
        }
      />

      {active.length === 0 && paused.length === 0 && (
        <Card>
          <p class="t-body t-soft center" style="padding:var(--s-4) 0">
            Todavía no hay tareas. Crea la primera y aparecerá en la pantalla de Hoy.
          </p>
        </Card>
      )}

      {TIME_OF_DAY_ORDER.map((tod) => {
        const list = byTime.get(tod) ?? [];
        if (list.length === 0) return null;
        return (
          <Section key={tod} title={TIME_OF_DAY_LABEL[tod]}>
            <Card pad={false}>
              <div class="list">
                {list.map((t, i) => (
                  <div key={t.id} class="list-item">
                    <span style="font-size:19px;width:26px;text-align:center">{t.emoji || '·'}</span>
                    <button
                      type="button"
                      class="grow"
                      style="text-align:left;min-width:0"
                      onClick={() => go(`/rutinas/${t.id}`)}
                    >
                      <span class="t-body t-medium" style="display:block">{t.title}</span>
                      <span class="t-xs t-soft">
                        {t.scheduledTime || 'Sin hora'}
                        {t.daysOfWeek.length > 0 && t.daysOfWeek.length < 7
                          ? ` · ${t.daysOfWeek.map((n) => WEEKDAYS.find((w) => w.n === n)?.label).join('')}`
                          : ''}
                        {t.recommendedBy === 'veterinario' ? ' · indicado por el veterinario' : ''}
                        {t.recommendedBy === 'fisioterapeuta' ? ' · lo sugirió la fisioterapeuta' : ''}
                      </span>
                    </button>
                    {t.protected && (
                      <span style="color:var(--ink-mute)" title="Viene de una indicación veterinaria">
                        <IconLock size={15} />
                      </span>
                    )}
                    <div class="row" style="gap:2px;flex-shrink:0">
                      <button
                        type="button"
                        aria-label="Subir"
                        disabled={i === 0}
                        style={`padding:6px;color:var(--ink-mute);opacity:${i === 0 ? 0.3 : 1}`}
                        onClick={() => void move(t, -1)}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        aria-label="Bajar"
                        disabled={i === list.length - 1}
                        style={`padding:6px;color:var(--ink-mute);opacity:${i === list.length - 1 ? 0.3 : 1}`}
                        onClick={() => void move(t, 1)}
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Section>
        );
      })}

      {paused.length > 0 && (
        <Section title={`En pausa (${paused.length})`}>
          <Card pad={false}>
            <div class="list">
              {paused.map((t) => (
                <div key={t.id} class="list-item" style="opacity:.7">
                  <span style="font-size:19px;width:26px;text-align:center">{t.emoji || '·'}</span>
                  <span class="grow t-body">{t.title}</span>
                  <Button variant="soft" size="sm" onClick={() => void save('tasks', t.id, { active: true })}>
                    Reanudar
                  </Button>
                  <button
                    type="button"
                    aria-label={`Eliminar ${t.title}`}
                    style="padding:8px;color:var(--ink-mute)"
                    onClick={async () => {
                      if (
                        await confirm({
                          title: `¿Eliminar "${t.title}"?`,
                          body: 'Los registros anteriores de esta tarea se conservan.',
                          confirmLabel: 'Eliminar',
                          danger: true,
                        })
                      ) {
                        await remove('tasks', t.id);
                        toast('Tarea eliminada');
                      }
                    }}
                  >
                    <IconTrash size={17} />
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

// ── Editor de tarea ──────────────────────────────────────────────────────────

export function TaskEditScreen({ id }: { id: string }) {
  const d = data.value;
  const existing = d.tasks.find((t) => t.id === id && !t.deletedAt) ?? null;
  const { confirm, dialog } = useConfirm();

  const [form, setForm] = useState({
    title: existing?.title ?? '',
    emoji: existing?.emoji ?? '',
    timeOfDay: (existing?.timeOfDay ?? 'manana') as TimeOfDay,
    scheduledTime: existing?.scheduledTime ?? '',
    daysOfWeek: existing?.daysOfWeek ?? [],
    category: existing?.category ?? 'otro',
    recommendedBy: existing?.recommendedBy ?? 'cuidadora',
    recommendedByName: existing?.recommendedByName ?? '',
    notes: existing?.notes ?? '',
    active: existing?.active ?? true,
  });
  const [error, setError] = useState('');

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const submit = async () => {
    if (!form.title.trim()) {
      setError('Ponle un nombre a la tarea.');
      return;
    }
    await save(
      'tasks',
      id,
      {
        ...form,
        title: form.title.trim(),
        order: existing?.order ?? d.tasks.length,
        protected: existing?.protected ?? form.recommendedBy === 'veterinario',
      },
      'tsk',
    );
    toast(existing ? 'Tarea actualizada' : 'Tarea creada');
    back('/rutinas');
  };

  return (
    <div class="stack-lg">
      <Header title={existing ? 'Editar tarea' : 'Nueva tarea'} back="/rutinas" />

      <Card>
        <div class="stack">
          <Field label="¿Qué hay que hacer?" error={error}>
            <Input
              value={form.title}
              placeholder="Compresa tibia en la espalda"
              onInput={(e) => {
                set('title', (e.target as HTMLInputElement).value);
                setError('');
              }}
            />
          </Field>

          <Field label="Icono">
            <div class="chip-grid">
              {EMOJIS.map((em) => (
                <Chip key={em} small selected={form.emoji === em} onToggle={() => set('emoji', form.emoji === em ? '' : em)}>
                  <span style="font-size:17px">{em}</span>
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Momento del día">
            <Select
              value={form.timeOfDay}
              onChange={(e) => set('timeOfDay', (e.target as HTMLSelectElement).value as TimeOfDay)}
            >
              {TIME_OF_DAY_ORDER.map((t) => (
                <option key={t} value={t}>{TIME_OF_DAY_LABEL[t]}</option>
              ))}
            </Select>
          </Field>

          <Field label="Hora" hint="Opcional. Sirve para ordenar la lista de Hoy.">
            <Input
              type="time"
              value={form.scheduledTime}
              onInput={(e) => set('scheduledTime', (e.target as HTMLInputElement).value)}
            />
          </Field>

          <Field label="Días" hint="Si no marcas ninguno, se repite todos los días.">
            <div class="row" style="gap:6px">
              {WEEKDAYS.map((w) => {
                const on = form.daysOfWeek.includes(w.n);
                return (
                  <button
                    key={w.n}
                    type="button"
                    aria-pressed={on}
                    class="grow"
                    style={`min-height:44px;border-radius:var(--r-sm);font-weight:600;font-size:var(--t-sm);
                      border:1.5px solid ${on ? 'var(--accent)' : 'var(--border)'};
                      background:${on ? 'var(--accent-soft)' : 'transparent'};
                      color:${on ? 'var(--accent-ink)' : 'var(--ink-soft)'}`}
                    onClick={() =>
                      set(
                        'daysOfWeek',
                        on ? form.daysOfWeek.filter((n) => n !== w.n) : [...form.daysOfWeek, w.n].sort(),
                      )
                    }
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Tipo">
            <Select value={form.category} onChange={(e) => set('category', (e.target as HTMLSelectElement).value as never)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </Field>

          <Field
            label="¿Quién lo recomendó?"
            hint="Queda registrado y aparece en el resumen para el veterinario. Sirve para responder «¿por qué hacemos esto?»."
          >
            <Select
              value={form.recommendedBy}
              onChange={(e) => set('recommendedBy', (e.target as HTMLSelectElement).value as never)}
            >
              <option value="cuidadora">Lo decidí yo</option>
              <option value="veterinario">El veterinario</option>
              <option value="fisioterapeuta">La fisioterapeuta</option>
              <option value="otro">Otra persona</option>
            </Select>
          </Field>

          {form.recommendedBy !== 'cuidadora' && (
            <Field label="Nombre de quien lo indicó">
              <Input
                value={form.recommendedByName}
                onInput={(e) => set('recommendedByName', (e.target as HTMLInputElement).value)}
              />
            </Field>
          )}

          <Field label="Notas">
            <Textarea
              rows={2}
              value={form.notes}
              onInput={(e) => set('notes', (e.target as HTMLTextAreaElement).value)}
            />
          </Field>
        </div>
      </Card>

      <Button variant="primary" size="lg" block onClick={() => void submit()}>
        {existing ? 'Guardar cambios' : 'Crear tarea'}
      </Button>

      {existing && (
        <>
          <Button variant="soft" block onClick={() => void save('tasks', id, { active: !existing.active })}>
            {existing.active ? 'Pausar esta tarea' : 'Reanudar esta tarea'}
          </Button>

          {existing.protected && (
            <Notice tone="warn" title="Viene de una indicación veterinaria">
              Si el veterinario indicó suspenderla, regístralo en el plan veterinario en vez de borrarla:
              así el historial sigue contando lo que realmente pasó.
            </Notice>
          )}

          <Button
            variant="alert-soft"
            block
            onClick={async () => {
              const ok = await confirm({
                title: `¿Eliminar "${existing.title}"?`,
                body: existing.protected
                  ? 'Esta tarea nació de una indicación veterinaria. ¿El veterinario indicó suspenderla? Los registros anteriores se conservan.'
                  : 'Dejará de aparecer en Hoy. Los registros anteriores se conservan.',
                confirmLabel: 'Eliminar',
                danger: true,
              });
              if (ok) {
                await remove('tasks', id);
                toast('Tarea eliminada');
                back('/rutinas');
              }
            }}
          >
            <IconTrash size={18} /> Eliminar tarea
          </Button>
        </>
      )}

      {dialog}
    </div>
  );
}
