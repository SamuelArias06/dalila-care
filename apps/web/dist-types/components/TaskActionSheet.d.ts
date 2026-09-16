import { type DayTask } from '@dalila/shared';
/** Opciones de una tarea del día: nota, omitir con motivo, o ir a editarla. */
export declare function TaskActionSheet({ task, onClose, date, }: {
    task: DayTask | null;
    onClose: () => void;
    date: string;
}): import("preact").JSX.Element | null;
