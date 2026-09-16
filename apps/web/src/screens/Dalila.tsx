import { useEffect, useState } from 'preact/hooks';
import { formatAge, formatDateNumeric, formatSince, localDateOf, newId } from '@dalila/shared';
import {
  Button, Card, Field, Header, Input, Notice, Row, Section, Select, Sheet, Textarea, toast, useConfirm,
} from '../ui/Kit.js';
import {
  IconBowl, IconChart, IconDoc, IconPhone, IconPill, IconQuestion, IconRefresh, IconSettings,
  IconStethoscope, IconTrash, IconVideo, IconWalk, IconWeight, IconNote, IconHeart,
} from '../ui/Icons.js';
import { data, hardRefresh, isAdmin, lastSyncedAt, pendingCount, pendingUploads, remove, save, session, signOut, sync } from '../data/store.js';
import { go } from '../app/router.js';
import { DogPhoto } from '../components/DogPhoto.js';
import { PhotoPicker } from '../components/PhotoPicker.js';
import { call } from '../data/api.js';
import * as db from '../data/db.js';
import { processUploadQueue } from '../data/media.js';
import { openTour } from '../components/Tour.js';

// ── Hub ──────────────────────────────────────────────────────────────────────

export function DalilaScreen() {
  const d = data.value;
  const dog = d.dog;
  const pendingQuestions = d.questions.filter((q) => !q.deletedAt && q.status === 'pendiente').length;
  const activeMeds = d.medications.filter((m) => !m.deletedAt && m.status === 'activo').length;

  return (
    <div class="stack-lg">
      <div class="stack" style="align-items:center;text-align:center;padding-top:var(--s-4)">
        <DogPhoto size={116} />
        <div>
          <h1 class="t-title">{dog?.name ?? 'Dalila'}</h1>
          <p class="t-sm t-soft" style="margin-top:2px">
            {[
              dog?.breed,
              dog?.birthDate ? formatAge(dog.birthDate) : '',
              dog?.currentWeightKg ? `${dog.currentWeightKg} kg` : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </div>

      {(dog?.emergencyPhone || dog?.vetPhone) && (
        <a
          class="row"
          href={`tel:${dog.emergencyPhone || dog.vetPhone}`}
          style="gap:var(--s-3);padding:var(--s-4) var(--s-5);border-radius:var(--r-lg);
            background:var(--alert-soft);text-decoration:none"
        >
          <span style="color:var(--alert)"><IconPhone size={21} /></span>
          <span class="grow">
            <span class="t-body t-bold" style="display:block;color:var(--alert)">Urgencias</span>
            <span class="t-xs t-soft">
              {dog.emergencyClinicName || dog.vetClinic || 'Clínica'} · {dog.emergencyPhone || dog.vetPhone}
            </span>
          </span>
        </a>
      )}

      <Section title="Su cuidado">
        <Card pad={false}>
          <div class="list">
            <Row icon={<IconPill size={20} />} title="Medicamentos" subtitle={activeMeds > 0 ? `${activeMeds} activos` : 'Ninguno registrado'} chevron onClick={() => go('/medicamentos')} />
            <Row icon={<IconBowl size={20} />} title="Alimentación" chevron onClick={() => go('/alimentacion')} />
            <Row icon={<IconNote size={20} />} title="Rutinas" chevron onClick={() => go('/rutinas')} />
            <Row icon={<IconWeight size={20} />} title="Peso" subtitle={dog?.currentWeightKg ? `${dog.currentWeightKg} kg` : undefined} chevron onClick={() => go('/peso')} />
            <Row icon={<IconWalk size={20} />} title="Actividad" chevron onClick={() => go('/actividad')} />
          </div>
        </Card>
      </Section>

      <Section title="Veterinario">
        <Card pad={false}>
          <div class="list">
            <Row
              icon={<IconQuestion size={20} />}
              title="Preguntas"
              subtitle={pendingQuestions > 0 ? `${pendingQuestions} pendientes` : 'Ninguna pendiente'}
              chevron
              onClick={() => go('/preguntas')}
            />
            <Row icon={<IconStethoscope size={20} />} title="Plan veterinario" chevron onClick={() => go('/plan')} />
            <Row icon={<IconChart size={20} />} title="Preparar consulta" chevron onClick={() => go('/consulta')} />
            <Row icon={<IconDoc size={20} />} title="Documentos" chevron onClick={() => go('/documentos')} />
          </div>
        </Card>
      </Section>

      <Section title="Recuerdos">
        <Card pad={false}>
          <div class="list">
            <Row icon={<IconVideo size={20} />} title="Vídeos y fotos" chevron onClick={() => go('/videos')} />
            <Row icon={<IconHeart size={20} />} title="Momentos" chevron onClick={() => go('/momentos')} />
            <Row icon={<IconNote size={20} />} title="Notas y eventos" chevron onClick={() => go('/eventos')} />
          </div>
        </Card>
      </Section>

      <Card pad={false}>
        <div class="list">
          <Row icon={<IconSettings size={20} />} title={`Perfil de ${dog?.name ?? 'Dalila'}`} chevron onClick={() => go('/perfil')} />
          <Row icon={<IconSettings size={20} />} title="Ajustes" chevron onClick={() => go('/ajustes')} />
        </div>
      </Card>
    </div>
  );
}

// ── Perfil ───────────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const d = data.value;
  const dog = d.dog;
  const { confirm, dialog } = useConfirm();
  const [photo, setPhoto] = useState('');
  const [diagOpen, setDiagOpen] = useState(false);
  const [diagName, setDiagName] = useState('');

  const [form, setForm] = useState({
    name: dog?.name ?? '',
    breed: dog?.breed ?? '',
    birthDate: dog?.birthDate ?? '',
    sex: dog?.sex ?? '',
    targetWeightKg: dog?.targetWeightKg != null ? String(dog.targetWeightKg) : '',
    targetWeightSetBy: dog?.targetWeightSetBy ?? '',
    vetName: dog?.vetName ?? '',
    vetClinic: dog?.vetClinic ?? '',
    vetPhone: dog?.vetPhone ?? '',
    emergencyPhone: dog?.emergencyPhone ?? '',
    emergencyClinicName: dog?.emergencyClinicName ?? '',
    allergies: dog?.allergies ?? '',
    notes: dog?.notes ?? '',
  });

  const diagnoses = d.diagnoses.filter((x) => !x.deletedAt);

  const submit = async () => {
    if (!dog) return;
    await save('dog', dog.id, {
      ...form,
      targetWeightKg: form.targetWeightKg ? Number(form.targetWeightKg.replace(',', '.')) : null,
    });
    toast('Perfil actualizado ✓');
  };

  useEffect(() => {
    if (!photo || !dog) return;
    void (async () => {
      const id = newId('mda');
      await save('media', id, {
        kind: 'foto',
        purpose: 'momento',
        fileName: 'perfil.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: Math.round(photo.length * 0.75),
        capturedAt: new Date().toISOString(),
        localDate: localDateOf(),
        posterDataUrl: photo,
        uploadState: 'pendiente',
        isFavorite: true,
        note: 'Foto de perfil',
      }, 'mda');
      await save('dog', dog.id, { photoMediaId: id });
      setPhoto('');
      toast('Foto actualizada ✓');
    })();
  }, [photo, dog]);

  return (
    <div class="stack-lg">
      <Header title="Perfil" back="/dalila" action={<Button variant="ghost" size="sm" onClick={() => void submit()}>Guardar</Button>} />

      <div style="display:grid;place-items:center">
        <PhotoPicker value={photo} onChange={setPhoto} size={118} />
      </div>

      <Card>
        <div class="stack">
          <Field label="Nombre">
            <Input value={form.name} onInput={(e) => setForm({ ...form, name: (e.target as HTMLInputElement).value })} />
          </Field>
          <Field label="Raza">
            <Input value={form.breed} onInput={(e) => setForm({ ...form, breed: (e.target as HTMLInputElement).value })} />
          </Field>
          <Field label="Fecha de nacimiento" hint={form.birthDate ? `Edad: ${formatAge(form.birthDate)}` : undefined}>
            <Input type="date" max={localDateOf()} value={form.birthDate} onInput={(e) => setForm({ ...form, birthDate: (e.target as HTMLInputElement).value })} />
          </Field>
          <Field label="Sexo">
            <Select value={form.sex} onChange={(e) => setForm({ ...form, sex: (e.target as HTMLSelectElement).value as never })}>
              <option value="">Sin especificar</option>
              <option value="hembra">Hembra</option>
              <option value="macho">Macho</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Section title="Salud">
        <Card>
          <div class="stack">
            <Field
              label="Peso objetivo (kg)"
              hint="Sólo si lo definió un veterinario. La app nunca fija un objetivo por su cuenta."
            >
              <Input
                type="text"
                inputMode="decimal"
                value={form.targetWeightKg}
                onInput={(e) => setForm({ ...form, targetWeightKg: (e.target as HTMLInputElement).value })}
              />
            </Field>
            {form.targetWeightKg && (
              <Field label="¿Quién lo indicó?">
                <Input value={form.targetWeightSetBy} onInput={(e) => setForm({ ...form, targetWeightSetBy: (e.target as HTMLInputElement).value })} />
              </Field>
            )}
            <Field label="Alergias e intolerancias">
              <Textarea rows={2} value={form.allergies} onInput={(e) => setForm({ ...form, allergies: (e.target as HTMLTextAreaElement).value })} />
            </Field>
            <Field label="Notas importantes">
              <Textarea rows={3} value={form.notes} onInput={(e) => setForm({ ...form, notes: (e.target as HTMLTextAreaElement).value })} />
            </Field>
          </div>
        </Card>
      </Section>

      <Section
        title="Diagnósticos"
        action={
          <button type="button" class="t-xs t-medium" style="color:var(--accent-ink)" onClick={() => setDiagOpen(true)}>
            + Añadir
          </button>
        }
      >
        <Card pad={false}>
          {diagnoses.length === 0 ? (
            <p class="t-sm t-soft center pad">Ninguno registrado.</p>
          ) : (
            <div class="list">
              {diagnoses.map((x) => (
                <div key={x.id} class="list-item">
                  <span class="grow">
                    <span class="t-body t-medium" style="display:block">{x.name}</span>
                    <span class="t-xs t-soft">
                      {x.diagnosedBy || 'Sin veterinario'}
                      {x.diagnosedOn ? ` · ${formatDateNumeric(x.diagnosedOn)}` : ''}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label="Eliminar"
                    style="padding:8px;color:var(--ink-mute)"
                    onClick={async () => {
                      if (await confirm({ title: '¿Eliminar este diagnóstico?', confirmLabel: 'Eliminar', danger: true })) {
                        await remove('diagnoses', x.id);
                      }
                    }}
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Section>

      <Section title="Contactos">
        <Card>
          <div class="stack">
            <Field label="Veterinario">
              <Input value={form.vetName} onInput={(e) => setForm({ ...form, vetName: (e.target as HTMLInputElement).value })} />
            </Field>
            <Field label="Clínica">
              <Input value={form.vetClinic} onInput={(e) => setForm({ ...form, vetClinic: (e.target as HTMLInputElement).value })} />
            </Field>
            <Field label="Teléfono de la clínica">
              <Input type="tel" value={form.vetPhone} onInput={(e) => setForm({ ...form, vetPhone: (e.target as HTMLInputElement).value })} />
            </Field>
            <Field label="Clínica de urgencias 24 h">
              <Input value={form.emergencyClinicName} onInput={(e) => setForm({ ...form, emergencyClinicName: (e.target as HTMLInputElement).value })} />
            </Field>
            <Field
              label="Teléfono de urgencias"
              hint="Es el que la app te ofrecerá si algún día algo va mal."
            >
              <Input type="tel" value={form.emergencyPhone} onInput={(e) => setForm({ ...form, emergencyPhone: (e.target as HTMLInputElement).value })} />
            </Field>
          </div>
        </Card>
      </Section>

      <Button variant="primary" size="lg" block onClick={() => void submit()}>Guardar cambios</Button>

      <Sheet open={diagOpen} onClose={() => setDiagOpen(false)} title="Añadir diagnóstico">
        <div class="stack">
          <Field label="¿Qué te dijo el veterinario?">
            <Textarea rows={2} value={diagName} onInput={(e) => setDiagName((e.target as HTMLTextAreaElement).value)} />
          </Field>
          <Button
            variant="primary"
            block
            disabled={!diagName.trim()}
            onClick={async () => {
              await save('diagnoses', newId('dgn'), {
                name: diagName.trim(),
                status: 'activo',
                diagnosedBy: form.vetName,
                clinic: form.vetClinic,
                diagnosedOn: localDateOf(),
              }, 'dgn');
              setDiagName('');
              setDiagOpen(false);
              toast('Guardado ✓');
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

// ── Ajustes ──────────────────────────────────────────────────────────────────

export function SettingsScreen() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('dalila.theme') ?? 'auto';
    } catch {
      return 'auto';
    }
  });
  const { confirm, dialog } = useConfirm();

  const applyTheme = (t: string) => {
    setTheme(t);
    try {
      localStorage.setItem('dalila.theme', t);
    } catch {
      /* ignorado */
    }
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
  };

  const exportData = async () => {
    const d = data.value;
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dalila-care-${localDateOf()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Datos exportados ✓');
  };

  return (
    <div class="stack-lg">
      <Header title="Ajustes" back="/dalila" />

      <Section title="Ayuda">
        <Card pad={false}>
          <div class="list">
            <Row icon={<IconHeart size={19} />} title="Cómo usar Dalila Care" subtitle="Un recorrido de un minuto" chevron onClick={openTour} />
          </div>
        </Card>
      </Section>

      <Section title="Apariencia">
        <Card pad={false}>
          <div class="list">
            {[
              ['auto', 'Automático', 'Sigue al sistema'],
              ['light', 'Claro', ''],
              ['dark', 'Oscuro', ''],
            ].map(([value, label, sub]) => (
              <Row
                key={value}
                title={label!}
                subtitle={sub || undefined}
                right={theme === value ? <span style="color:var(--accent)">✓</span> : undefined}
                onClick={() => applyTheme(value!)}
              />
            ))}
          </div>
        </Card>
      </Section>

      <Section title="Sincronización">
        <Card pad={false}>
          <div class="list">
            <Row
              icon={<IconRefresh size={19} />}
              title="Sincronizar ahora"
              subtitle={lastSyncedAt.value ? `Última vez ${formatSince(lastSyncedAt.value)}` : 'Nunca'}
              onClick={() => {
                void sync();
                void processUploadQueue();
                toast('Sincronizando…');
              }}
            />
            {pendingCount.value > 0 && (
              <Row title="Cambios pendientes" subtitle={`${pendingCount.value} esperando conexión`} />
            )}
            {pendingUploads.value > 0 && (
              <Row title="Archivos pendientes" subtitle={`${pendingUploads.value} por subir`} />
            )}
          </div>
        </Card>
      </Section>

      <Section title="Tus datos">
        <Card pad={false}>
          <div class="list">
            <Row icon={<IconDoc size={19} />} title="Exportar todo en JSON" subtitle="Los datos son tuyos" onClick={() => void exportData()} />
          </div>
        </Card>
      </Section>

      {isAdmin.value && (
        <Section title="Administración">
          <Card pad={false}>
            <div class="list">
              <Row title="Diagnóstico técnico" chevron onClick={() => go('/diagnostico')} />
            </div>
          </Card>
        </Section>
      )}

      <Button
        variant="alert-soft"
        block
        onClick={async () => {
          const ok = await confirm({
            title: '¿Cerrar sesión en este dispositivo?',
            body: 'Necesitarás un enlace nuevo para volver a entrar. Los datos guardados en la nube no se tocan.',
            confirmLabel: 'Cerrar sesión',
            danger: true,
          });
          if (ok) {
            await signOut();
            location.reload();
          }
        }}
      >
        Cerrar sesión
      </Button>

      <p class="t-xs t-mute center">
        Dalila Care · hecho con cariño para cuidarla mejor
      </p>

      {dialog}
    </div>
  );
}

// ── Diagnóstico (sólo admin) ─────────────────────────────────────────────────

export function AdminScreen() {
  const [info, setInfo] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [storage, setStorage] = useState<{ usageMB: number; quotaMB: number } | null>(null);
  const [invite, setInvite] = useState('');
  const [rejected, setRejected] = useState<unknown[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        setInfo(await call<Record<string, unknown>>('admin.diagnostics'));
      } catch (e) {
        setError((e as Error).message);
      }
      setStorage(await db.storageEstimate());
      setRejected((await db.kvGet<unknown[]>('rejected')) ?? []);
    })();
  }, []);

  if (!isAdmin.value) {
    return (
      <div class="stack-lg">
        <Header title="Diagnóstico" back="/ajustes" />
        <Notice tone="info">Esta sección no está disponible para este acceso.</Notice>
      </div>
    );
  }

  return (
    <div class="stack-lg">
      <Header title="Diagnóstico" back="/ajustes" />

      <Card>
        <p class="t-label" style="margin-bottom:var(--s-3)">Este dispositivo</p>
        <div class="stack-sm">
          <KV k="Sesión" v={session.value?.label ?? '—'} />
          <KV k="Rol" v={session.value?.role ?? '—'} />
          <KV k="Última sincronización" v={lastSyncedAt.value ? formatSince(lastSyncedAt.value) : 'nunca'} />
          <KV k="Cambios en cola" v={String(pendingCount.value)} />
          <KV k="Archivos en cola" v={String(pendingUploads.value)} />
          <KV k="Almacenamiento" v={storage ? `${storage.usageMB} MB de ~${storage.quotaMB} MB` : '—'} />
          <KV k="Modo app instalada" v={window.matchMedia('(display-mode: standalone)').matches ? 'sí' : 'no'} />
        </div>
      </Card>

      <Card>
        <p class="t-label" style="margin-bottom:var(--s-3)">Servidor</p>
        {error ? (
          <Notice tone="alert">{error}</Notice>
        ) : !info ? (
          <p class="t-sm t-mute">Consultando…</p>
        ) : (
          <div class="stack-sm">
            <KV k="Versión" v={String(info['version'] ?? '')} />
            <KV k="Esquema" v={String(info['schemaVersion'] ?? '')} />
            <KV k="Zona horaria" v={String(info['timeZone'] ?? '')} />
            <KV k="Hoja" v={String(info['sheetId'] ?? '')} />
            <KV k="Último backup" v={String(info['lastBackupAt'] ?? 'nunca')} />
            <div class="divider" />
            {Object.entries((info['counts'] ?? {}) as Record<string, number>)
              .filter(([, n]) => n > 0)
              .map(([k, n]) => (
                <KV key={k} k={k} v={String(n)} />
              ))}
          </div>
        )}
      </Card>

      <Card>
        <p class="t-label" style="margin-bottom:var(--s-3)">Invitar un dispositivo</p>
        <div class="stack-sm">
          <Button
            variant="soft"
            block
            onClick={async () => {
              try {
                const r = await call<{ code: string }>('auth.createInvite', { role: 'caregiver' });
                const url = `${location.origin}${location.pathname}#/invitacion/${r.code}`;
                setInvite(url);
                await navigator.clipboard.writeText(url).catch(() => undefined);
                toast('Enlace copiado ✓');
              } catch (e) {
                toast((e as Error).message, 'alert');
              }
            }}
          >
            Crear enlace de acceso
          </Button>
          {invite && (
            <div style="padding:var(--s-3);background:var(--surface-sunken);border-radius:var(--r-sm);word-break:break-all">
              <p class="t-xs">{invite}</p>
            </div>
          )}
          <p class="t-xs t-mute">El enlace es de un solo uso y caduca a los 14 días.</p>
        </div>
      </Card>

      <Card>
        <p class="t-label" style="margin-bottom:var(--s-3)">Mantenimiento</p>
        <div class="stack-sm">
          <Button variant="soft" block onClick={() => void hardRefresh()}>
            Recargar todo desde el servidor
          </Button>
          <Button
            variant="soft"
            block
            onClick={async () => {
              try {
                const r = await call<{ counts: Record<string, number> }>('admin.backup');
                toast(`Backup creado (${Object.values(r.counts).reduce((a, b) => a + b, 0)} registros)`);
              } catch (e) {
                toast((e as Error).message, 'alert');
              }
            }}
          >
            Crear copia de seguridad ahora
          </Button>
        </div>
      </Card>

      {rejected.length > 0 && (
        <Card>
          <p class="t-label" style="margin-bottom:var(--s-3)">Cambios rechazados ({rejected.length})</p>
          <div class="stack-sm">
            {rejected.slice(-10).map((r, i) => (
              <p key={i} class="t-xs t-soft" style="word-break:break-word">
                {JSON.stringify(r).slice(0, 220)}
              </p>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div class="row-between">
      <span class="t-sm t-soft">{k}</span>
      <span class="t-sm t-medium" style="text-align:right;word-break:break-all">{v}</span>
    </div>
  );
}
