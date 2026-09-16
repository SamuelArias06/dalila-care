import { useMemo, useState } from 'preact/hooks';
import {
  findFoodWarning,
  formatDateNumeric,
  lastNDays,
  localDateOf,
  newId,
  nowIso,
  triageMedicationReaction,
  type Medication,
  type MedicationVersion,
} from '@dalila/shared';
import {
  Button,
  Card,
  Field,
  Header,
  Input,
  Notice,
  Section,
  Select,
  Sheet,
  Textarea,
  toast,
  useConfirm,
} from '../ui/Kit.js';
import { IconAlert, IconPlus } from '../ui/Icons.js';
import { data, remove, save } from '../data/store.js';
import { back, go } from '../app/router.js';

/** Devuelve la versión vigente de la prescripción de un medicamento. */
function currentVersion(versions: MedicationVersion[], medId: string): MedicationVersion | null {
  return (
    versions
      .filter((v) => !v.deletedAt && v.medicationId === medId && !v.effectiveTo)
      .sort((a, b) => b.versionNumber - a.versionNumber)[0] ?? null
  );
}

export function MedicationsScreen() {
  const d = data.value;
  const [logging, setLogging] = useState<Medication | null>(null);

  const active = d.medications.filter((m) => !m.deletedAt && m.status === 'activo');
  const past = d.medications.filter((m) => !m.deletedAt && m.status !== 'activo');

  return (
    <div class="stack-lg">
      <Header
        title="Medicamentos"
        back="/dalila"
        action={
          <Button variant="primary" size="sm" onClick={() => go(`/medicamentos/${newId('med')}`)}>
            <IconPlus size={17} /> Nuevo
          </Button>
        }
      />

      <Notice tone="info">
        Aquí sólo se registra lo que indicó un veterinario. Esta app nunca calcula dosis,
        no sugiere medicamentos y no propone cambiar un tratamiento.
      </Notice>

      {active.length === 0 && past.length === 0 && (
        <Card>
          <p class="t-body t-soft center" style="padding:var(--s-4) 0">
            No hay medicamentos registrados.
          </p>
        </Card>
      )}

      {active.length > 0 && (
        <Section title="Activos">
          <div class="stack-sm">
            {active.map((m) => (
              <MedicationCard key={m.id} med={m} onLog={() => setLogging(m)} />
            ))}
          </div>
        </Section>
      )}

      {past.length > 0 && (
        <Section title="Histórico">
          <Card pad={false}>
            <div class="list">
              {past.map((m) => (
                <button key={m.id} type="button" class="list-item" onClick={() => go(`/medicamentos/${m.id}`)}>
                  <span class="grow">
                    <span class="t-body t-medium" style="display:block">{m.name}</span>
                    <span class="t-xs t-soft">
                      {m.startedOn ? formatDateNumeric(m.startedOn) : '—'}
                      {m.endedOn ? ` – ${formatDateNumeric(m.endedOn)}` : ''} ·{' '}
                      {m.status === 'suspendido' ? 'suspendido' : 'finalizado'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </Section>
      )}

      <DoseSheet med={logging} onClose={() => setLogging(null)} />
    </div>
  );
}

function MedicationCard({ med, onLog }: { med: Medication; onLog: () => void }) {
  const d = data.value;
  const version = currentVersion(d.medicationVersions, med.id);
  const week = lastNDays(7);

  const byDay = useMemo(() => {
    const map = new Map<string, string>();
    for (const dose of d.doses) {
      if (dose.deletedAt || dose.medicationId !== med.id) continue;
      map.set(dose.localDate, dose.status);
    }
    return map;
  }, [d.doses, med.id]);

  return (
    <Card>
      <button type="button" style="text-align:left;width:100%" onClick={() => go(`/medicamentos/${med.id}`)}>
        <p class="t-subtitle">💊 {med.name}</p>
        {version && (
          <p class="t-body" style="margin-top:var(--s-2);color:var(--ink-soft)">
            "{version.doseText}"
            {version.frequencyText ? ` · ${version.frequencyText}` : ''}
          </p>
        )}
        <p class="t-xs t-mute" style="margin-top:var(--s-2)">
          {med.prescribedBy ? `${med.prescribedBy}` : 'Sin veterinario registrado'}
          {med.startedOn ? ` · desde el ${formatDateNumeric(med.startedOn)}` : ''}
        </p>
      </button>

      <div class="row" style="gap:5px;margin-top:var(--s-4)">
        {week.map((day) => {
          const status = byDay.get(day);
          const icon = status ? { administrado: '✓', omitido: '✕', administrado_tarde: '⏰', posible_reaccion: '!' }[status] : '';
          const color = status === 'administrado' ? 'var(--ok)'
            : status === 'administrado_tarde' ? 'var(--warn)'
            : status === 'omitido' || status === 'posible_reaccion' ? 'var(--alert)'
            : 'var(--border)';
          return (
            <div
              key={day}
              title={formatDateNumeric(day)}
              class="grow"
              style={`height:30px;border-radius:var(--r-xs);display:grid;place-items:center;font-size:12px;font-weight:700;
                background:${status ? 'transparent' : 'var(--surface-sunken)'};
                border:1.5px solid ${color};color:${color}`}
            >
              {icon}
            </div>
          );
        })}
      </div>
      <p class="t-xs t-mute" style="margin-top:6px">Últimos 7 días</p>

      <Button variant="soft" block onClick={onLog} style="margin-top:var(--s-4)">
        Registrar toma
      </Button>
    </Card>
  );
}

function DoseSheet({ med, onClose }: { med: Medication | null; onClose: () => void }) {
  const d = data.value;
  const [note, setNote] = useState('');
  const [reaction, setReaction] = useState(false);

  if (!med) return null;
  const version = currentVersion(d.medicationVersions, med.id);

  const record = async (status: string) => {
    await save(
      'doses',
      newId('dos'),
      {
        medicationId: med.id,
        medicationVersionId: version?.id ?? '',
        localDate: localDateOf(),
        administeredAt: status === 'omitido' ? '' : nowIso(),
        status,
        note: note.trim(),
        reactionNote: status === 'posible_reaccion' ? note.trim() : '',
        medicationNameSnapshot: med.name,
        doseTextSnapshot: version?.doseText ?? '',
      },
      'dos',
    );

    if (status === 'posible_reaccion') {
      setReaction(true);
      return;
    }
    toast('Registrado ✓');
    setNote('');
    onClose();
  };

  if (reaction) {
    const triage = triageMedicationReaction();
    return (
      <Sheet open onClose={() => { setReaction(false); setNote(''); onClose(); }} title="Registrado">
        <div class="stack">
          <div style="background:var(--alert-soft);border-radius:var(--r-lg);padding:var(--s-5)">
            <div class="row" style="align-items:flex-start;gap:var(--s-3)">
              <span style="color:var(--alert);flex-shrink:0"><IconAlert size={22} /></span>
              <div class="grow">
                <p class="t-subtitle" style="color:var(--alert)">{triage.rule.title}</p>
                <p class="t-body t-soft" style="margin-top:var(--s-2)">{triage.rule.body}</p>
              </div>
            </div>
            <p class="t-xs t-mute" style="margin-top:var(--s-4)">
              Esta orientación es general y no sustituye la valoración de un veterinario. Fuente: {triage.rule.source}
            </p>
          </div>

          {d.dog?.vetPhone && (
            <a class="btn btn--alert btn--block" href={`tel:${d.dog.vetPhone}`}>
              Llamar a {d.dog.vetClinic || 'la clínica'}
            </a>
          )}

          <Button
            variant="soft"
            block
            onClick={async () => {
              await save('questions', newId('vtq'), {
                text: `Posible reacción a ${med.name} el ${formatDateNumeric(localDateOf())}. ${note}`.trim(),
                status: 'pendiente',
                context: 'Registrada desde medicamentos',
              }, 'vtq');
              toast('Guardado para la consulta');
            }}
          >
            Guardar como pregunta para la consulta
          </Button>

          <Button variant="quiet" block onClick={() => { setReaction(false); setNote(''); onClose(); }}>
            Cerrar
          </Button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open onClose={onClose} title={med.name}>
      <div class="stack">
        {version && <p class="t-body t-soft">"{version.doseText}"</p>}

        <Field label="Nota (opcional)">
          <Textarea
            rows={2}
            value={note}
            placeholder="La tomó sin problema con la comida…"
            onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)}
          />
        </Field>

        <Button variant="primary" block onClick={() => void record('administrado')}>
          ✅ Administrado
        </Button>
        <Button variant="soft" block onClick={() => void record('administrado_tarde')}>
          ⏰ Administrado tarde
        </Button>
        <Button variant="soft" block onClick={() => void record('omitido')}>
          ❌ Omitido
        </Button>
        <Button variant="alert-soft" block onClick={() => void record('posible_reaccion')}>
          🤢 Posible reacción
        </Button>
      </div>
    </Sheet>
  );
}

// ── Editor ───────────────────────────────────────────────────────────────────

export function MedicationEditScreen({ id }: { id: string }) {
  const d = data.value;
  const existing = d.medications.find((m) => m.id === id && !m.deletedAt) ?? null;
  const version = existing ? currentVersion(d.medicationVersions, id) : null;
  const { confirm, dialog } = useConfirm();

  const [form, setForm] = useState({
    name: existing?.name ?? '',
    presentation: existing?.presentation ?? '',
    reason: existing?.reason ?? '',
    prescribedBy: existing?.prescribedBy ?? d.dog?.vetName ?? '',
    clinic: existing?.clinic ?? d.dog?.vetClinic ?? '',
    startedOn: existing?.startedOn ?? localDateOf(),
    notes: existing?.notes ?? '',
  });
  const [dose, setDose] = useState({
    doseText: version?.doseText ?? '',
    frequencyText: version?.frequencyText ?? '',
    withFood: version?.withFood ?? '',
    changeReason: '',
  });
  const [error, setError] = useState('');

  const warning = findFoodWarning(form.name);
  const doseChanged = !!version && dose.doseText.trim() !== version.doseText;

  const submit = async () => {
    if (!form.name.trim()) {
      setError('Escribe el nombre del medicamento.');
      return;
    }
    if (!dose.doseText.trim()) {
      setError('Escribe la dosis tal como la indicó el veterinario.');
      return;
    }

    await save('medications', id, { ...form, name: form.name.trim(), status: existing?.status ?? 'activo' }, 'med');

    if (!version) {
      await save('medicationVersions', newId('mdv'), {
        medicationId: id,
        versionNumber: 1,
        doseText: dose.doseText.trim(),
        frequencyText: dose.frequencyText.trim(),
        withFood: dose.withFood,
        effectiveFrom: form.startedOn || localDateOf(),
        prescribedBy: form.prescribedBy,
      }, 'mdv');
    } else if (doseChanged || dose.frequencyText !== (version.frequencyText ?? '') || dose.withFood !== (version.withFood ?? '')) {
      // Cambiar la prescripción no edita nada: cierra la versión vigente y crea
      // la siguiente. El historial de los meses anteriores sigue diciendo lo que
      // realmente se le dio entonces.
      const today = localDateOf();
      await save('medicationVersions', version.id, { effectiveTo: today });
      await save('medicationVersions', newId('mdv'), {
        medicationId: id,
        versionNumber: version.versionNumber + 1,
        doseText: dose.doseText.trim(),
        frequencyText: dose.frequencyText.trim(),
        withFood: dose.withFood,
        effectiveFrom: today,
        changeReason: dose.changeReason.trim(),
        prescribedBy: form.prescribedBy,
      }, 'mdv');
    }

    toast(existing ? 'Medicamento actualizado' : 'Medicamento guardado');
    back('/medicamentos');
  };

  const history = d.medicationVersions
    .filter((v) => !v.deletedAt && v.medicationId === id)
    .sort((a, b) => b.versionNumber - a.versionNumber);

  return (
    <div class="stack-lg">
      <Header title={existing ? 'Editar medicamento' : 'Nuevo medicamento'} back="/medicamentos" />

      <Notice tone="warn" icon={<IconAlert size={20} />}>
        Escribe exactamente lo que indicó el veterinario. Esta app no calcula dosis ni sugiere medicamentos,
        y nunca debes darle a Dalila analgésicos humanos.
      </Notice>

      {warning && (
        <Notice tone="alert" title={warning.label} icon={<IconAlert size={20} />}>
          {warning.warning}
          <p class="t-xs t-mute" style="margin-top:var(--s-2)">Fuente: {warning.source}</p>
        </Notice>
      )}

      <Card>
        <div class="stack">
          <Field label="Nombre" error={error}>
            <Input
              value={form.name}
              onInput={(e) => { setForm({ ...form, name: (e.target as HTMLInputElement).value }); setError(''); }}
            />
          </Field>
          <Field label="Presentación" hint="Tabletas, jarabe, inyectable…">
            <Input value={form.presentation} onInput={(e) => setForm({ ...form, presentation: (e.target as HTMLInputElement).value })} />
          </Field>
          <Field label="Dosis indicada" hint="Cópiala literal de la fórmula médica.">
            <Input
              value={dose.doseText}
              placeholder="1 tableta cada 24 horas con comida"
              onInput={(e) => setDose({ ...dose, doseText: (e.target as HTMLInputElement).value })}
            />
          </Field>
          <Field label="Frecuencia y horario">
            <Input
              value={dose.frequencyText}
              placeholder="Una vez al día, por la mañana"
              onInput={(e) => setDose({ ...dose, frequencyText: (e.target as HTMLInputElement).value })}
            />
          </Field>
          <Field label="¿Con comida?">
            <Select value={dose.withFood} onChange={(e) => setDose({ ...dose, withFood: (e.target as HTMLSelectElement).value as never })}>
              <option value="">No lo indicó</option>
              <option value="con">Con comida</option>
              <option value="sin">Sin comida</option>
              <option value="indiferente">Indiferente</option>
            </Select>
          </Field>

          {doseChanged && (
            <Field label="¿Por qué cambió la dosis?" hint="Se guarda como una versión nueva; el historial anterior no se toca.">
              <Input
                value={dose.changeReason}
                placeholder="La Dra. lo ajustó en el control del 12 de agosto"
                onInput={(e) => setDose({ ...dose, changeReason: (e.target as HTMLInputElement).value })}
              />
            </Field>
          )}

          <Field label="Motivo">
            <Input value={form.reason} onInput={(e) => setForm({ ...form, reason: (e.target as HTMLInputElement).value })} />
          </Field>
          <Field label="Veterinario que lo indicó">
            <Input value={form.prescribedBy} onInput={(e) => setForm({ ...form, prescribedBy: (e.target as HTMLInputElement).value })} />
          </Field>
          <Field label="Fecha de inicio">
            <Input type="date" value={form.startedOn} onInput={(e) => setForm({ ...form, startedOn: (e.target as HTMLInputElement).value })} />
          </Field>
          <Field label="Notas">
            <Textarea rows={2} value={form.notes} onInput={(e) => setForm({ ...form, notes: (e.target as HTMLTextAreaElement).value })} />
          </Field>
        </div>
      </Card>

      <Button variant="primary" size="lg" block onClick={() => void submit()}>
        Guardar
      </Button>

      {history.length > 1 && (
        <Section title="Historial de la prescripción">
          <Card pad={false}>
            <div class="list">
              {history.map((v) => (
                <div key={v.id} class="list-item">
                  <span class="grow">
                    <span class="t-sm t-medium" style="display:block">"{v.doseText}"</span>
                    <span class="t-xs t-soft">
                      Desde {formatDateNumeric(v.effectiveFrom)}
                      {v.effectiveTo ? ` hasta ${formatDateNumeric(v.effectiveTo)}` : ' · vigente'}
                      {v.changeReason ? ` · ${v.changeReason}` : ''}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      )}

      {existing && existing.status === 'activo' && (
        <Button
          variant="soft"
          block
          onClick={async () => {
            const ok = await confirm({
              title: '¿El veterinario indicó suspenderlo?',
              body: 'Se marcará como suspendido y dejará de aparecer entre los activos. El historial de tomas se conserva intacto.',
              confirmLabel: 'Sí, lo indicó el veterinario',
            });
            if (ok) {
              await save('medications', id, { status: 'suspendido', endedOn: localDateOf(), endedReason: 'Indicado por el veterinario' });
              const v = currentVersion(d.medicationVersions, id);
              if (v) await save('medicationVersions', v.id, { effectiveTo: localDateOf() });
              toast('Marcado como suspendido');
              back('/medicamentos');
            }
          }}
        >
          Marcar como suspendido
        </Button>
      )}

      {existing && (
        <Button
          variant="alert-soft"
          block
          onClick={async () => {
            const ok = await confirm({
              title: `¿Eliminar "${existing.name}"?`,
              body: 'Las tomas ya registradas se conservan en el historial.',
              confirmLabel: 'Eliminar',
              danger: true,
            });
            if (ok) {
              await remove('medications', id);
              toast('Eliminado');
              back('/medicamentos');
            }
          }}
        >
          Eliminar
        </Button>
      )}

      {dialog}
    </div>
  );
}
