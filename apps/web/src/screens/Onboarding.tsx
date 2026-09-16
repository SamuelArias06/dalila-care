import { useState } from 'preact/hooks';
import { localDateOf, newId, nowIso, SEED_TASKS, findFoodWarning } from '@dalila/shared';
import { Button, Field, Input, Notice, Select, Textarea, toast } from '../ui/Kit.js';
import { IconAlert, Logo } from '../ui/Icons.js';
import { save } from '../data/store.js';
import { PhotoPicker } from '../components/PhotoPicker.js';

/**
 * Onboarding en pasos cortos.
 *
 * Sólo el nombre es obligatorio. Todo lo demás tiene "Lo completaré después":
 * forzar un formulario largo en el minuto tres es la forma más rápida de perder
 * a la usuaria, y nada de esto se puede inventar.
 */

interface Draft {
  name: string;
  photo: string;
  breed: string;
  birthDate: string;
  birthApprox: boolean;
  sex: string;
  weight: string;
  vetName: string;
  vetClinic: string;
  vetPhone: string;
  emergencyPhone: string;
  diagnosis: string;
  allergies: string;
  food: string;
  meds: string;
}

const EMPTY: Draft = {
  name: '', photo: '', breed: '', birthDate: '', birthApprox: true, sex: '', weight: '',
  vetName: '', vetClinic: '', vetPhone: '', emergencyPhone: '', diagnosis: '', allergies: '',
  food: '', meds: '',
};

const STEPS = ['bienvenida', 'nombre', 'datos', 'veterinario', 'salud', 'rutina'] as const;

export function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    if (!d.name.trim()) {
      setError('Necesitamos al menos su nombre.');
      setStep(1);
      return;
    }
    setBusy(true);
    try {
      const dogId = newId('dog');
      const today = localDateOf();

      await save('dog', dogId, {
        name: d.name.trim(),
        photoMediaId: d.photo || '',
        breed: d.breed.trim(),
        birthDate: d.birthDate,
        birthDateIsApproximate: d.birthApprox,
        sex: d.sex,
        currentWeightKg: d.weight ? Number(d.weight.replace(',', '.')) : null,
        vetName: d.vetName.trim(),
        vetClinic: d.vetClinic.trim(),
        vetPhone: d.vetPhone.trim(),
        emergencyPhone: d.emergencyPhone.trim(),
        allergies: d.allergies.trim(),
      });

      if (d.photo) {
        // La foto se guarda en local como data URL hasta que haya conexión.
        await save('media', newId('mda'), {
          kind: 'foto',
          purpose: 'momento',
          fileName: 'perfil.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: Math.round(d.photo.length * 0.75),
          capturedAt: nowIso(),
          localDate: today,
          posterDataUrl: d.photo,
          uploadState: 'pendiente',
          isFavorite: true,
          note: 'Foto de perfil',
        }, 'mda');
      }

      if (d.diagnosis.trim()) {
        await save('diagnoses', newId('dgn'), {
          name: d.diagnosis.trim(),
          status: 'activo',
          diagnosedBy: d.vetName.trim(),
          clinic: d.vetClinic.trim(),
          confirmationMethod: '',
        }, 'dgn');
      }

      if (d.weight) {
        await save('weights', newId('wgt'), {
          localDate: today,
          weightKg: Number(d.weight.replace(',', '.')),
          measuredAt: 'casa',
          note: 'Registro inicial',
        }, 'wgt');
      }

      if (d.food.trim()) {
        const foodId = newId('fdi');
        const warning = findFoodWarning(d.food.trim());
        await save('foods', foodId, {
          name: d.food.trim(),
          type: 'principal',
          active: true,
          safetyNote: warning?.warning ?? '',
          safetySource: warning?.source ?? '',
        }, 'fdi');
        await save('feedingPlan', newId('fpi'), {
          foodId,
          amountText: '',
          timesOfDay: ['manana', 'noche'],
          effectiveFrom: today,
          active: true,
          recommendedBy: 'cuidadora',
        }, 'fpi');
      }

      if (d.meds.trim()) {
        const medId = newId('med');
        await save('medications', medId, {
          name: d.meds.trim(),
          status: 'activo',
          prescribedBy: d.vetName.trim(),
          clinic: d.vetClinic.trim(),
          startedOn: today,
        }, 'med');
        await save('medicationVersions', newId('mdv'), {
          medicationId: medId,
          versionNumber: 1,
          doseText: 'Según indicación del veterinario',
          effectiveFrom: today,
          prescribedBy: d.vetName.trim(),
        }, 'mdv');
      }

      // Rutina base: editable por completo desde el primer día.
      let order = 0;
      for (const t of SEED_TASKS) {
        await save('tasks', newId('tsk'), {
          title: t.title,
          emoji: t.emoji,
          timeOfDay: t.timeOfDay,
          scheduledTime: t.scheduledTime,
          daysOfWeek: [],
          category: t.category,
          order: order++,
          active: true,
          recommendedBy: 'cuidadora',
        }, 'tsk');
      }

      toast(`Todo listo. Bienvenida al espacio de ${d.name.trim()} ❤️`);
    } catch {
      setError('No pudimos guardar. Inténtalo otra vez en un momento.');
    } finally {
      setBusy(false);
    }
  };

  const current = STEPS[step];

  return (
    <main class="screen screen--no-tabbar">
      {step > 0 && (
        <div class="row" style="gap:6px;margin-bottom:var(--s-6)">
          {STEPS.slice(1).map((s, i) => (
            <span
              key={s}
              style={`height:4px;flex:1;border-radius:999px;transition:background var(--dur) var(--ease);
                background:${i <= step - 1 ? 'var(--brand)' : 'var(--border)'}`}
            />
          ))}
        </div>
      )}

      <div class="stack-lg rise" key={current}>
        {current === 'bienvenida' && (
          <div class="stack-lg" style="text-align:center;padding-top:var(--s-10)">
            <div class="stack" style="align-items:center;gap:var(--s-4)">
              <Logo size={76} />
              <h1 class="t-title">Este será el espacio de cuidado de Dalila</h1>
              <p class="t-md t-soft" style="max-width:32ch;margin:0 auto">
                Un lugar para saber qué toca cada día, anotar cómo está y llegar a la consulta
                con información de verdad en vez de recuerdos borrosos.
              </p>
            </div>
            <Notice tone="info">
              Vamos a preguntarte unas pocas cosas. Nada es obligatorio salvo su nombre: lo demás
              lo puedes completar cuando quieras.
            </Notice>
            <Button variant="primary" size="lg" block onClick={next}>
              Empezar
            </Button>
          </div>
        )}

        {current === 'nombre' && (
          <Step title="¿Cómo se llama?" onNext={next} onSkip={null} nextDisabled={!d.name.trim()}>
            <Field error={error}>
              <Input
                value={d.name}
                placeholder="Dalila"
                autocomplete="off"
                onInput={(e) => {
                  set('name', (e.target as HTMLInputElement).value);
                  setError('');
                }}
              />
            </Field>
            <div style="display:grid;place-items:center;margin-top:var(--s-4)">
              <PhotoPicker value={d.photo} onChange={(v) => set('photo', v)} />
            </div>
          </Step>
        )}

        {current === 'datos' && (
          <Step title="Cuéntanos un poco de ella" onNext={next} onSkip={next}>
            <Field label="Raza">
              <Input
                value={d.breed}
                placeholder="Golden Retriever"
                onInput={(e) => set('breed', (e.target as HTMLInputElement).value)}
              />
            </Field>
            <Field label="Fecha de nacimiento" hint="Si no la sabes exacta, una aproximada sirve.">
              <Input
                type="date"
                value={d.birthDate}
                max={localDateOf()}
                onInput={(e) => set('birthDate', (e.target as HTMLInputElement).value)}
              />
            </Field>
            <Field label="Sexo">
              <Select value={d.sex} onChange={(e) => set('sex', (e.target as HTMLSelectElement).value)}>
                <option value="">Prefiero no decirlo ahora</option>
                <option value="hembra">Hembra</option>
                <option value="macho">Macho</option>
              </Select>
            </Field>
            <Field label="Peso actual (kg)" hint="Si no lo sabes, lo puedes añadir después.">
              <Input
                type="text"
                inputMode="decimal"
                value={d.weight}
                placeholder="32.8"
                onInput={(e) => set('weight', (e.target as HTMLInputElement).value)}
              />
            </Field>
          </Step>
        )}

        {current === 'veterinario' && (
          <Step title="Su veterinario" onNext={next} onSkip={next}>
            <Field label="Nombre del veterinario">
              <Input value={d.vetName} onInput={(e) => set('vetName', (e.target as HTMLInputElement).value)} />
            </Field>
            <Field label="Clínica">
              <Input value={d.vetClinic} onInput={(e) => set('vetClinic', (e.target as HTMLInputElement).value)} />
            </Field>
            <Field label="Teléfono de la clínica">
              <Input
                type="tel"
                value={d.vetPhone}
                onInput={(e) => set('vetPhone', (e.target as HTMLInputElement).value)}
              />
            </Field>
            <Field
              label="Teléfono de urgencias 24 h"
              hint="Es el que la app te ofrecerá si algún día algo va mal. Vale la pena tenerlo."
            >
              <Input
                type="tel"
                value={d.emergencyPhone}
                onInput={(e) => set('emergencyPhone', (e.target as HTMLInputElement).value)}
              />
            </Field>
          </Step>
        )}

        {current === 'salud' && (
          <Step title="Lo que ya sabes de su salud" onNext={next} onSkip={next}>
            <Field label="Diagnóstico registrado" hint="Escribe lo que te dijo el veterinario, con sus palabras.">
              <Textarea
                value={d.diagnosis}
                placeholder="Espondilosis / espondiloartrosis"
                onInput={(e) => set('diagnosis', (e.target as HTMLTextAreaElement).value)}
              />
            </Field>
            <Field label="Alergias o intolerancias conocidas">
              <Input value={d.allergies} onInput={(e) => set('allergies', (e.target as HTMLInputElement).value)} />
            </Field>
            <Field label="Alimento principal">
              <Input
                value={d.food}
                placeholder="Concentrado senior"
                onInput={(e) => set('food', (e.target as HTMLInputElement).value)}
              />
            </Field>
            {d.food.trim() && findFoodWarning(d.food.trim()) && (
              <Notice tone="warn" title={findFoodWarning(d.food.trim())!.label} icon={<IconAlert size={20} />}>
                {findFoodWarning(d.food.trim())!.warning}
                <p class="t-xs t-mute" style="margin-top:var(--s-2)">
                  Fuente: {findFoodWarning(d.food.trim())!.source}
                </p>
              </Notice>
            )}
            <Field
              label="Medicamento recetado"
              hint="Sólo lo que haya indicado un veterinario. La app nunca sugiere ni calcula dosis."
            >
              <Input value={d.meds} onInput={(e) => set('meds', (e.target as HTMLInputElement).value)} />
            </Field>
          </Step>
        )}

        {current === 'rutina' && (
          <div class="stack-lg">
            <div class="stack">
              <h1 class="t-heading">Le preparamos una rutina para empezar</h1>
              <p class="t-body t-soft">
                Podrás cambiarla entera: horarios, nombres, días, lo que quieras. Es sólo un punto de partida
                para que no arranques con una pantalla vacía.
              </p>
            </div>

            <div class="glass pad stack-sm">
              {SEED_TASKS.map((t) => (
                <div key={`${t.title}-${t.scheduledTime}`} class="row">
                  <span style="font-size:18px;width:26px;text-align:center">{t.emoji}</span>
                  <span class="grow t-body">{t.title}</span>
                  <span class="t-sm t-mute">{t.scheduledTime}</span>
                </div>
              ))}
            </div>

            {error && <p class="field-error">{error}</p>}

            <div class="stack-sm">
              <Button variant="primary" size="lg" block disabled={busy} onClick={() => void finish()}>
                {busy ? 'Preparando todo…' : 'Empezar a cuidar a Dalila'}
              </Button>
              <Button variant="quiet" block onClick={prev}>
                Volver
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Step({
  title,
  children,
  onNext,
  onSkip,
  nextDisabled,
}: {
  title: string;
  children: preact.ComponentChildren;
  onNext: () => void;
  onSkip: (() => void) | null;
  nextDisabled?: boolean;
}) {
  return (
    <div class="stack-lg">
      <h1 class="t-heading">{title}</h1>
      <div class="stack">{children}</div>
      <div class="stack-sm">
        <Button variant="primary" size="lg" block disabled={nextDisabled} onClick={onNext}>
          Continuar
        </Button>
        {onSkip && (
          <Button variant="quiet" block onClick={onSkip}>
            Lo completaré después
          </Button>
        )}
      </div>
    </div>
  );
}
