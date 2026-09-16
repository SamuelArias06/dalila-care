import { useMemo, useState } from 'preact/hooks';
import {
  OVERALL_STATE,
  formatDateLong,
  greetingFor,
  localDateOf,
  localTimeOf,
  newId,
  nowIso,
  summarizeDay,
  tasksForDay,
  weekdayOf,
  type DayTask,
} from '@dalila/shared';
import { Button, Card, Section, toast } from '../ui/Kit.js';
import { CheckCircle } from '../ui/Kit.js';
import { IconAlert, IconChevronRight, IconMoon, IconNote, IconVideo } from '../ui/Icons.js';
import { data, save } from '../data/store.js';
import { go } from '../app/router.js';
import { DogPhoto, useDogPhoto } from '../components/DogPhoto.js';
import { NightSummarySheet } from '../components/NightSummary.js';
import { TaskActionSheet } from '../components/TaskActionSheet.js';

export function TodayScreen() {
  const today = localDateOf();
  const d = data.value;
  const dog = d.dog;
  const greeting = greetingFor();
  const hour = Number(localTimeOf().slice(0, 2));
  const photo = useDogPhoto();

  const [nightOpen, setNightOpen] = useState(false);
  const [taskSheet, setTaskSheet] = useState<DayTask | null>(null);

  const log = d.dailyLogs.find((l) => !l.deletedAt && l.localDate === today) ?? null;
  const dayTasks = useMemo(
    () => tasksForDay(d.tasks, d.completions, today, weekdayOf(today)),
    [d.tasks, d.completions, today],
  );
  const summary = useMemo(() => summarizeDay(d, today, weekdayOf(today)), [d, today]);

  const done = dayTasks.filter((t) => t.done).length;
  const allDone = dayTasks.length > 0 && done === dayTasks.length;
  const askMorning = log?.overallState == null;

  const setState = async (value: number) => {
    await save(
      'dailyLogs',
      log?.id ?? newId('dlg'),
      {
        localDate: today,
        overallState: value,
        morningCheckAt: log?.morningCheckAt ?? nowIso(),
      },
      'dlg',
    );
  };

  const toggleTask = async (t: DayTask) => {
    if (t.done && t.completion) {
      await save('completions', t.completion.id, { status: 'pospuesta', completedAt: '' });
      return;
    }
    await save(
      'completions',
      t.completion?.id ?? newId('tcp'),
      {
        taskId: t.task.id,
        localDate: today,
        status: 'hecha',
        completedAt: nowIso(),
        titleSnapshot: t.task.title,
        scheduledTimeSnapshot: t.task.scheduledTime ?? '',
      },
      'tcp',
    );
    if (dayTasks.filter((x) => x.done).length + 1 === dayTasks.length) {
      toast(`${dog?.name ?? 'Dalila'} tuvo su rutina completa hoy ❤️`);
    }
  };

  return (
    <div class="stack-lg">
      {/* Cabecera con su foto */}
      <div class="hero rise">
        {photo ? <img class="hero__img" src={photo} alt="" /> : null}
        <div class="hero__scrim" />
        <div class="grow">
          <p class="t-sm" style="opacity:.92;font-weight:600">
            {greeting.text} ❤️
          </p>
          <h1 class="t-title" style="color:#fff;margin-top:2px">
            {askMorning
              ? `¿Cómo ${hour < 12 ? 'amaneció' : 'está'} ${dog?.name ?? 'Dalila'}?`
              : `${dog?.name ?? 'Dalila'} hoy`}
          </h1>
          {!askMorning && (
            <p class="t-sm" style="opacity:.94;margin-top:4px">
              {summary.overallEmoji} {summary.overallLabel}
            </p>
          )}
        </div>
      </div>

      {/* Estado general */}
      <Card>
        <p class="t-label" style="margin-bottom:var(--s-3)">
          {askMorning ? 'Estado general' : 'Estado de hoy · toca para cambiar'}
        </p>
        <div class="row" style="gap:var(--s-2);justify-content:space-between">
          {OVERALL_STATE.map((o) => {
            const on = log?.overallState === o.value;
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={on}
                aria-label={o.label}
                onClick={() => void setState(o.value)}
                class="grow"
                style={`display:flex;flex-direction:column;align-items:center;gap:5px;padding:var(--s-2) 2px;
                  border-radius:var(--r-md);transition:all var(--dur) var(--ease);
                  background:${on ? 'var(--brand-soft)' : 'transparent'};
                  border:1.5px solid ${on ? 'var(--brand)' : 'transparent'};
                  transform:${on ? 'scale(1.03)' : 'scale(1)'}`}
              >
                <span style={`font-size:27px;filter:${on ? 'none' : 'saturate(.72) opacity(.72)'}`}>{o.emoji}</span>
                <span
                  class="t-xs"
                  style={`font-weight:${on ? 650 : 500};color:${on ? 'var(--rosa-700)' : 'var(--ink-mute)'};line-height:1.15;text-align:center`}
                >
                  {o.label}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Rutina del día */}
      <Section
        title={`Hoy · ${formatDateLong(today)}`}
        action={
          <button type="button" class="t-xs t-medium" style="color:var(--accent-ink)" onClick={() => go('/rutinas')}>
            Editar rutina
          </button>
        }
      >
        {dayTasks.length === 0 ? (
          <Card>
            <div class="stack-sm" style="text-align:center;padding:var(--s-4) 0">
              <p class="t-body t-soft">Todavía no hay tareas para hoy.</p>
              <Button variant="soft" onClick={() => go('/rutinas')}>
                Crear su rutina
              </Button>
            </div>
          </Card>
        ) : (
          <Card pad={false}>
            {allDone && (
              <div
                class="row"
                style="gap:var(--s-2);padding:var(--s-3) var(--s-4);background:var(--ok-soft);
                  border-radius:var(--r-lg) var(--r-lg) 0 0;color:var(--verde-600)"
              >
                <span aria-hidden="true">✨</span>
                <span class="t-sm t-bold">{dog?.name ?? 'Dalila'} tuvo su rutina completa hoy</span>
              </div>
            )}
            <div class="list">
              {dayTasks.map((t) => (
                <div key={t.task.id} class="list-item" style="padding-right:var(--s-2)">
                  <button
                    type="button"
                    onClick={() => void toggleTask(t)}
                    aria-label={t.done ? `Desmarcar ${t.task.title}` : `Marcar ${t.task.title}`}
                    aria-pressed={t.done}
                    style="display:flex;align-items:center;gap:var(--s-3);flex:1;min-width:0;text-align:left"
                  >
                    <CheckCircle done={t.done} />
                    <span class="grow" style="min-width:0">
                      <span
                        class="t-body"
                        style={`display:block;font-weight:${t.done ? 500 : 560};
                          color:${t.done ? 'var(--ink-mute)' : 'var(--ink)'};
                          text-decoration:${t.done ? 'line-through' : 'none'}`}
                      >
                        {t.task.emoji ? `${t.task.emoji} ` : ''}
                        {t.task.title}
                      </span>
                      {t.completion?.note && (
                        <span class="t-xs t-soft" style="display:block">{t.completion.note}</span>
                      )}
                    </span>
                    {t.task.scheduledTime && (
                      <span class="t-sm t-mute" style="flex-shrink:0">{t.task.scheduledTime}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label={`Más opciones de ${t.task.title}`}
                    style="padding:var(--s-2);color:var(--ink-mute);flex-shrink:0"
                    onClick={() => setTaskSheet(t)}
                  >
                    <IconChevronRight size={18} />
                  </button>
                </div>
              ))}
            </div>
            <div class="row" style="padding:var(--s-3) var(--s-4);border-top:1px solid var(--border)">
              <span class="t-sm t-soft grow">
                {done} de {dayTasks.length}
                {done > 0 && !allDone ? ' · vas bien' : ''}
              </span>
              <div class="bar-track" style="width:104px">
                <div class="bar-fill" style={`width:${Math.round((done / dayTasks.length) * 100)}%`} />
              </div>
            </div>
          </Card>
        )}
      </Section>

      {/* Atajos */}
      <div class="row" style="gap:var(--s-2)">
        <QuickTile icon={<IconVideo size={21} />} label="Vídeo" onClick={() => go('/videos')} />
        <QuickTile icon={<IconNote size={21} />} label="Nota" onClick={() => go('/eventos')} />
        <QuickTile icon={<IconMoon size={21} />} label="Check-in" onClick={() => go('/checkin')} />
      </div>

      {/* Resumen nocturno */}
      {hour >= 18 && summary.hasAnyRecord && (
        <Card>
          <div class="row">
            <span style="font-size:22px" aria-hidden="true">🌙</span>
            <div class="grow">
              <p class="t-body t-bold">Hoy con {dog?.name ?? 'Dalila'}</p>
              <p class="t-sm t-soft">Mira cómo fue el día antes de dormir.</p>
            </div>
            <Button variant="soft" size="sm" onClick={() => setNightOpen(true)}>
              Ver
            </Button>
          </div>
        </Card>
      )}

      {/* Me preocupa algo */}
      <button
        type="button"
        onClick={() => go('/preocupa')}
        class="row"
        style="gap:var(--s-3);width:100%;padding:var(--s-4) var(--s-5);border-radius:var(--r-lg);
          background:var(--alert-soft);border:1.5px solid transparent;text-align:left;
          transition:transform var(--dur-fast) var(--ease)"
      >
        <span style="color:var(--alert);flex-shrink:0">
          <IconAlert size={23} />
        </span>
        <span class="grow">
          <span class="t-body t-bold" style="display:block;color:var(--alert)">Me preocupa algo</span>
          <span class="t-xs t-soft" style="display:block">Regístralo y te orientamos sobre qué hacer.</span>
        </span>
        <IconChevronRight size={18} style="color:var(--alert);flex-shrink:0" />
      </button>

      <NightSummarySheet open={nightOpen} onClose={() => setNightOpen(false)} date={today} />
      <TaskActionSheet task={taskSheet} onClose={() => setTaskSheet(null)} date={today} />
    </div>
  );
}

function QuickTile({
  icon,
  label,
  onClick,
}: {
  icon: preact.ComponentChildren;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      class="glass grow"
      style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:var(--s-4) var(--s-2);
        color:var(--accent-ink);transition:transform var(--dur-fast) var(--ease)"
    >
      {icon}
      <span class="t-xs t-medium" style="color:var(--ink-soft)">{label}</span>
    </button>
  );
}
