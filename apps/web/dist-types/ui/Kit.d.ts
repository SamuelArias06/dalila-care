/** Componentes reutilizables de la interfaz. */
import type { ComponentChildren, JSX } from 'preact';
export declare function Card({ children, pad, class: cls, ...rest }: {
    children: ComponentChildren;
    pad?: boolean;
} & JSX.IntrinsicElements['div']): JSX.Element;
export declare function Section({ title, action, children, }: {
    title?: string;
    action?: ComponentChildren;
    children: ComponentChildren;
}): JSX.Element;
type Variant = 'primary' | 'accent' | 'soft' | 'ghost' | 'quiet' | 'alert' | 'alert-soft';
export declare function Button({ variant, size, block, children, class: cls, ...rest }: {
    variant?: Variant;
    size?: 'sm' | 'lg';
    block?: boolean;
    children: ComponentChildren;
} & JSX.IntrinsicElements['button']): JSX.Element;
export declare function Header({ title, subtitle, back, action, }: {
    title: string;
    subtitle?: string;
    back?: string | (() => void);
    action?: ComponentChildren;
}): JSX.Element;
export declare function Chip({ selected, onToggle, children, brand, small, }: {
    selected: boolean;
    onToggle: () => void;
    children: ComponentChildren;
    brand?: boolean;
    small?: boolean;
}): JSX.Element;
/** Grupo de opciones excluyentes. Volver a tocar la activa la deselecciona. */
export declare function ChoiceGroup<T extends string>({ options, value, onChange, brand, }: {
    options: readonly {
        value: T;
        label: string;
    }[];
    value: T | '' | undefined;
    onChange: (v: T | '') => void;
    brand?: boolean;
}): JSX.Element;
/** Selección múltiple sobre una lista de ids. */
export declare function MultiSelect({ options, values, onChange, }: {
    options: readonly {
        id: string;
        label: string;
    }[];
    values: string[];
    onChange: (next: string[]) => void;
}): JSX.Element;
export declare function Field({ label, hint, error, children, }: {
    label?: string;
    hint?: string;
    error?: string;
    children: ComponentChildren;
}): JSX.Element;
export declare function Input(props: JSX.IntrinsicElements['input']): JSX.Element;
export declare function Textarea(props: JSX.IntrinsicElements['textarea']): JSX.Element;
export declare function Select({ children, ...rest }: JSX.IntrinsicElements['select']): JSX.Element;
export declare function Row({ icon, title, subtitle, right, onClick, chevron, }: {
    icon?: ComponentChildren;
    title: ComponentChildren;
    subtitle?: ComponentChildren;
    right?: ComponentChildren;
    onClick?: () => void;
    chevron?: boolean;
}): JSX.Element;
export declare function CheckCircle({ done }: {
    done: boolean;
}): JSX.Element;
export declare function Sheet({ open, onClose, title, children, }: {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: ComponentChildren;
}): JSX.Element | null;
export declare function Empty({ emoji, title, body, action, }: {
    emoji?: string;
    title: string;
    body?: string;
    action?: ComponentChildren;
}): JSX.Element;
export declare function Skeleton({ h, w, r }: {
    h?: number;
    w?: string;
    r?: number;
}): JSX.Element;
export declare function CardSkeleton(): JSX.Element;
export declare function Notice({ tone, title, children, icon, }: {
    tone?: 'info' | 'ok' | 'warn' | 'alert';
    title?: string;
    children?: ComponentChildren;
    icon?: ComponentChildren;
}): JSX.Element;
export declare function Segmented<T extends string | number>({ options, value, onChange, }: {
    options: readonly {
        value: T;
        label: string;
    }[];
    value: T;
    onChange: (v: T) => void;
}): JSX.Element;
export declare const toastMessage: import("@preact/signals-core").Signal<{
    text: string;
    tone: "ok" | "alert";
} | null>;
export declare function toast(text: string, tone?: 'ok' | 'alert'): void;
export declare function Toaster(): JSX.Element | null;
export declare function useConfirm(): {
    confirm: (opts: {
        title: string;
        body?: string;
        confirmLabel?: string;
        danger?: boolean;
    }) => Promise<boolean>;
    dialog: JSX.Element | null;
};
export declare function useScrollTop(dep: unknown): void;
export {};
