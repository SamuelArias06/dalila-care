import { useState } from 'preact/hooks';
import { newId, nowIso, type DayTask } from '@dalila/shared';
import { Button, Field, Sheet, Textarea, toast } from '../ui/Kit.js';
import { save } from '../data/store.js';
import { go } from '../app/router.js';

/** Opciones de una tarea del día: nota, omitir con motivo, o ir a editarla. */
export function TaskActionSheet({
  task,
  onClose,
  date,
}: {
  task: DayTask | null;
  onClose: () => void;
  date: string;
}) {
  const [note, setNote] = useState('');
  const [skipping, setSkipping] = useState(false);

  if (!task) return null;

  const upsert = async (patch: Record<string, unknown>) => {
    await save(
      'completions',
      task.completion?.id ?? newId('tcp'),
      {
        taskId: task.task.id,
        localDate: date,
        titleSnapshot: task.task.title,
        scheduledTimeSnapshot: task.task.scheduledTime ?? '',
        ...patch,
      },
      'tcp',
    );
  };

  const close = () => {
    setNote('');
    setSkipping(false);
    onClose();
  };

  return (
    <Sheet open onClose={close} title={task.task.title}>
      <div class="stack">
        {!skipping ? (
          <>
            <Field label="Añadir una nota">
              <Textarea
                value={note}
                rows={3}
                placeholder="Lo que quieras recordar de esta tarea hoy…"
                onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)}
              />
            </Field>
            <Button
              variant="primary"
              block
              disabled={!note.trim()}
              onClick={async () => {
                await upsert({ status: task.done ? 'hecha' : 'pospuesta', note: note.trim() });
                toast('Nota guardada');
                close();
              }}
            >
              Guardar nota
            </Button>

            <hr class="divider" />

            <Button
              variant="soft"
              block
              onClick={async () => {
                await upsert({ status: 'hecha', completedAt: nowIso() });
                close();
              }}
            >
              Marcar como hecha
            </Button>
            <Button variant="soft" block onClick={() => setSkipping(true)}>
              No se hizo hoy
            </Button>
            <Button
              variant="quiet"
              block
              onClick={() => {
                close();
                go(`/rutinas/${task.task.id}`);
              }}
            >
              Editar esta tarea
            </Button>
          </>
        ) : (
          <>
            <p class="t-body t-soft">
              No pasa nada. Si quieres, anota por qué: ayuda a entender el día cuando lo mires después.
            </p>
            <Field label="Motivo (opcional)">
              <Textarea
                value={note}
                rows={3}
                placeholder="Estaba muy rígida y preferí no sacarla…"
                onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)}
              />
            </Field>
            <Button
              variant="primary"
              block
              onClick={async () => {
                await upsert({ status: 'omitida', skipReason: note.trim(), completedAt: '' });
                close();
              }}
            >
              Guardar
            </Button>
            <Button variant="quiet" block onClick={() => setSkipping(false)}>
              Volver
            </Button>
          </>
        )}
      </div>
    </Sheet>
  );
}
