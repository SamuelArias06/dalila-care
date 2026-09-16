/** Componentes reutilizables de la interfaz. */

import { signal } from '@preact/signals';
import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { IconCheck, IconChevronLeft, IconChevronRight, IconClose } from './Icons.js';
import { go } from '../app/router.js';

// ── Tarjeta ──────────────────────────────────────────────────────────────────

export function Card({
  children,
  pad = true,
  class: cls = '',
  ...rest
}: { children: ComponentChildren; pad?: boolean } & JSX.IntrinsicElements['div']) {
  return (
    <div class={`glass ${pad ? 'pad' : ''} ${cls}`} {...rest}>
      {children}
    </div>
  );
}

export function Section({
  title,
  action,
  children,
}: {
  title?: string;
  action?: ComponentChildren;
  children: ComponentChildren;
}) {
  return (
    <section class="stack">
      {(title || action) && (
        <div class="row-between" style="padding-inline:2px">
          {title && <h2 class="t-label">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// ── Botón ────────────────────────────────────────────────────────────────────

type Variant = 'primary' | 'accent' | 'soft' | 'ghost' | 'quiet' | 'alert' | 'alert-soft';

export function Button({
  variant = 'soft',
  size,
  block,
  children,
  class: cls = '',
  ...rest
}: {
  variant?: Variant;
  size?: 'sm' | 'lg';
  block?: boolean;
  children: ComponentChildren;
} & JSX.IntrinsicElements['button']) {
  return (
    <button
      type="button"
      class={`btn btn--${variant} ${size ? `btn--${size}` : ''} ${block ? 'btn--block' : ''} ${cls}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// ── Cabecera de pantalla ─────────────────────────────────────────────────────

export function Header({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: string | (() => void);
  action?: ComponentChildren;
}) {
  return (
    <header class="row-between" style="margin-bottom:var(--s-5);gap:var(--s-3)">
      {back != null && (
        <button
          type="button"
          class="btn btn--soft"
          style="min-height:42px;width:42px;padding:0;border-radius:var(--r-full);flex-shrink:0"
          aria-label="Volver"
          onClick={() => (typeof back === 'function' ? back() : go(back))}
        >
          <IconChevronLeft size={20} />
        </button>
      )}
      <div class="grow">
        <h1 class="t-heading">{title}</h1>
        {subtitle && <p class="t-sm t-soft" style="margin-top:2px">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

// ── Chip seleccionable ───────────────────────────────────────────────────────

export function Chip({
  selected,
  onToggle,
  children,
  brand,
  small,
}: {
  selected: boolean;
  onToggle: () => void;
  children: ComponentChildren;
  brand?: boolean;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      class={`chip ${brand ? 'chip--brand' : ''} ${small ? 'chip--sm' : ''}`}
      aria-pressed={selected}
      onClick={onToggle}
    >
      {children}
    </button>
  );
}

/** Grupo de opciones excluyentes. Volver a tocar la activa la deselecciona. */
export function ChoiceGroup<T extends string>({
  options,
  value,
  onChange,
  brand,
}: {
  options: readonly { value: T; label: string }[];
  value: T | '' | undefined;
  onChange: (v: T | '') => void;
  brand?: boolean;
}) {
  return (
    <div class="chip-grid">
      {options.map((o) => (
        <Chip
          key={o.value}
          brand={brand}
          selected={value === o.value}
          onToggle={() => onChange(value === o.value ? '' : o.value)}
        >
          {o.label}
        </Chip>
      ))}
    </div>
  );
}

/** Selección múltiple sobre una lista de ids. */
export function MultiSelect({
  options,
  values,
  onChange,
}: {
  options: readonly { id: string; label: string }[];
  values: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div class="chip-grid">
      {options.map((o) => (
        <Chip
          key={o.id}
          selected={values.includes(o.id)}
          onToggle={() =>
            onChange(values.includes(o.id) ? values.filter((v) => v !== o.id) : [...values, o.id])
          }
        >
          {o.label}
        </Chip>
      ))}
    </div>
  );
}

// ── Campos ───────────────────────────────────────────────────────────────────

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: ComponentChildren;
}) {
  return (
    <div class="field">
      {label && <label>{label}</label>}
      {children}
      {hint && !error && <p class="t-xs t-mute">{hint}</p>}
      {error && <p class="field-error">{error}</p>}
    </div>
  );
}

export function Input(props: JSX.IntrinsicElements['input']) {
  return <input class="input" {...props} />;
}

export function Textarea(props: JSX.IntrinsicElements['textarea']) {
  return <textarea class="textarea" {...props} />;
}

export function Select({ children, ...rest }: JSX.IntrinsicElements['select']) {
  return (
    <select class="select" {...rest}>
      {children}
    </select>
  );
}

// ── Fila de lista ────────────────────────────────────────────────────────────

export function Row({
  icon,
  title,
  subtitle,
  right,
  onClick,
  chevron,
}: {
  icon?: ComponentChildren;
  title: ComponentChildren;
  subtitle?: ComponentChildren;
  right?: ComponentChildren;
  onClick?: () => void;
  chevron?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} class="list-item" onClick={onClick}>
      {icon && <span style="flex-shrink:0;display:grid;place-items:center;font-size:19px;width:26px">{icon}</span>}
      <span class="grow">
        <span class="t-body t-medium" style="display:block">{title}</span>
        {subtitle && <span class="t-sm t-soft" style="display:block;margin-top:1px">{subtitle}</span>}
      </span>
      {right}
      {chevron && <IconChevronRight size={18} class="list-item__chevron" />}
    </Tag>
  );
}

// ── Casilla de completado ────────────────────────────────────────────────────

export function CheckCircle({ done }: { done: boolean }) {
  return (
    <span class={`check ${done ? 'is-done' : ''}`} aria-hidden="true">
      {done && <IconCheck size={17} />}
    </span>
  );
}

// ── Hoja modal ───────────────────────────────────────────────────────────────

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ComponentChildren;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div class="scrim" onClick={onClose} aria-hidden="true" />
      <div class="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div class="sheet__inner">
          <div class="sheet__grabber" />
          {title && (
            <div class="row-between" style="margin-bottom:var(--s-4)">
              <h2 class="t-subtitle">{title}</h2>
              <button
                type="button"
                class="btn btn--quiet"
                style="min-height:36px;width:36px;padding:0;border-radius:var(--r-full)"
                aria-label="Cerrar"
                onClick={onClose}
              >
                <IconClose size={19} />
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </>
  );
}

// ── Estado vacío ─────────────────────────────────────────────────────────────

export function Empty({
  emoji = '🌿',
  title,
  body,
  action,
}: {
  emoji?: string;
  title: string;
  body?: string;
  action?: ComponentChildren;
}) {
  return (
    <div class="empty">
      <div class="empty__art" aria-hidden="true">{emoji}</div>
      <p class="t-md t-bold" style="color:var(--ink)">{title}</p>
      {body && <p class="t-sm t-soft" style="max-width:30ch">{body}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ h = 20, w = '100%', r }: { h?: number; w?: string; r?: number }) {
  return <div class="skeleton" style={`height:${h}px;width:${w};border-radius:${r ?? 12}px`} />;
}

export function CardSkeleton() {
  return (
    <div class="glass pad stack-sm">
      <Skeleton h={14} w="45%" />
      <Skeleton h={26} w="72%" />
      <Skeleton h={14} w="60%" />
    </div>
  );
}

// ── Avisos ───────────────────────────────────────────────────────────────────

export function Notice({
  tone = 'info',
  title,
  children,
  icon,
}: {
  tone?: 'info' | 'ok' | 'warn' | 'alert';
  title?: string;
  children?: ComponentChildren;
  icon?: ComponentChildren;
}) {
  const bg = {
    info: 'var(--accent-soft)',
    ok: 'var(--ok-soft)',
    warn: 'var(--warn-soft)',
    alert: 'var(--alert-soft)',
  }[tone];
  const fg = {
    info: 'var(--accent-ink)',
    ok: 'var(--verde-600)',
    warn: 'var(--warn)',
    alert: 'var(--alert)',
  }[tone];

  return (
    <div
      class="row"
      style={`align-items:flex-start;gap:var(--s-3);background:${bg};border-radius:var(--r-md);padding:var(--s-4)`}
    >
      {icon && <span style={`color:${fg};flex-shrink:0;margin-top:1px`}>{icon}</span>}
      <div class="grow">
        {title && <p class="t-body t-bold" style={`color:${fg};margin-bottom:2px`}>{title}</p>}
        {children && <div class="t-sm" style="color:var(--ink-soft)">{children}</div>}
      </div>
    </div>
  );
}

// ── Control segmentado ───────────────────────────────────────────────────────

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      class="row"
      style="gap:2px;background:var(--surface-sunken);padding:3px;border-radius:var(--r-sm);border:1px solid var(--border)"
      role="tablist"
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="tab"
            aria-selected={on}
            class="grow"
            style={`min-height:36px;border-radius:calc(var(--r-sm) - 3px);font-size:var(--t-sm);font-weight:${on ? 650 : 550};
              background:${on ? 'var(--surface-solid)' : 'transparent'};
              color:${on ? 'var(--ink)' : 'var(--ink-soft)'};
              box-shadow:${on ? 'var(--shadow-xs)' : 'none'};
              transition:all var(--dur) var(--ease)`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Avisos flotantes ─────────────────────────────────────────────────────────

export const toastMessage = signal<{ text: string; tone: 'ok' | 'alert' } | null>(null);
let toastTimer: number | undefined;

export function toast(text: string, tone: 'ok' | 'alert' = 'ok'): void {
  toastMessage.value = { text, tone };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastMessage.value = null), 3200) as unknown as number;
}

export function Toaster() {
  const t = toastMessage.value;
  if (!t) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={`position:fixed;left:50%;transform:translateX(-50%);
        bottom:calc(var(--tabbar-h) + var(--safe-bottom) + var(--s-4));
        z-index:var(--z-toast);max-width:min(440px,calc(100vw - 32px));
        padding:var(--s-3) var(--s-5);border-radius:var(--r-full);
        background:${t.tone === 'ok' ? 'var(--ink)' : 'var(--alert)'};color:#fff;
        font-size:var(--t-sm);font-weight:600;box-shadow:var(--shadow-lg);
        animation:rise var(--dur) var(--ease-out)`}
    >
      {t.text}
    </div>
  );
}

// ── Confirmación ─────────────────────────────────────────────────────────────

export function useConfirm() {
  const [state, setState] = useState<{
    title: string;
    body?: string;
    confirmLabel: string;
    danger?: boolean;
    resolve: (v: boolean) => void;
  } | null>(null);

  const confirm = (opts: { title: string; body?: string; confirmLabel?: string; danger?: boolean }) =>
    new Promise<boolean>((resolve) =>
      setState({ ...opts, confirmLabel: opts.confirmLabel ?? 'Continuar', resolve }),
    );

  const dialog = state ? (
    <Sheet
      open
      onClose={() => {
        state.resolve(false);
        setState(null);
      }}
      title={state.title}
    >
      {state.body && <p class="t-body t-soft" style="margin-bottom:var(--s-5)">{state.body}</p>}
      <div class="stack-sm">
        <Button
          variant={state.danger ? 'alert' : 'primary'}
          block
          onClick={() => {
            state.resolve(true);
            setState(null);
          }}
        >
          {state.confirmLabel}
        </Button>
        <Button
          variant="quiet"
          block
          onClick={() => {
            state.resolve(false);
            setState(null);
          }}
        >
          Cancelar
        </Button>
      </div>
    </Sheet>
  ) : null;

  return { confirm, dialog };
}

// ── Desplazamiento al inicio en cada cambio de pantalla ──────────────────────

export function useScrollTop(dep: unknown) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [dep]);
}
