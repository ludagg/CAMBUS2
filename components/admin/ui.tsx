'use client';
/**
 * Easy Travel admin design system.
 *
 * One visual language for every management interface (super admin, company,
 * agency, station): cream canvas, white cards with hairline borders, deep
 * green sidebar, the brand green (#13ec5b) reserved for primary actions and
 * active states, Inter Tight headings, tabular numbers.
 */
import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';

export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

/* ── Surfaces ─────────────────────────────────────────────────────────── */

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { padded?: boolean }> = ({
  className,
  padded = true,
  ...rest
}) => (
  <div
    {...rest}
    className={cx(
      'rounded-2xl border border-ink-100 dark:border-white/10 bg-white dark:bg-surface-dark shadow-subtle',
      padded && 'p-5 md:p-6',
      className,
    )}
  />
);

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, icon, action, className }) => (
  <div className={cx('flex items-start justify-between gap-3 flex-wrap mb-4', className)}>
    <div className="flex items-start gap-3 min-w-0">
      {icon && (
        <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-teal-accent dark:text-primary ring-1 ring-inset ring-primary/20">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </span>
      )}
      <div className="min-w-0">
        <h2 className="font-display text-base font-semibold tracking-tight text-text-main dark:text-white">{title}</h2>
        {subtitle && <p className="text-sm text-text-muted dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

export const PageHeader: React.FC<{
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}> = ({ eyebrow, title, description, actions }) => (
  <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
    <div className="min-w-0">
      {eyebrow && (
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-accent dark:text-primary mb-1.5">
          {eyebrow}
        </div>
      )}
      <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-text-main dark:text-white">
        {title}
      </h1>
      {description && <p className="mt-1.5 text-sm md:text-[15px] text-text-muted dark:text-gray-400 max-w-2xl">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
  </div>
);

/* ── Buttons ──────────────────────────────────────────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-ink-950 hover:bg-primary-600 shadow-subtle',
  secondary:
    'bg-white dark:bg-white/5 text-text-main dark:text-white border border-ink-200 dark:border-white/15 hover:bg-ink-50 dark:hover:bg-white/10',
  ghost: 'text-text-main dark:text-gray-200 hover:bg-ink-100/70 dark:hover:bg-white/10',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  dark: 'bg-ink-900 text-white hover:bg-ink-800 dark:bg-white dark:text-ink-950 dark:hover:bg-gray-200',
};

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: 'sm' | 'md';
    icon?: string;
    loading?: boolean;
  }
> = ({ variant = 'secondary', size = 'md', icon, loading, children, className, disabled, type = 'button', ...rest }) => (
  <button
    {...rest}
    type={type}
    disabled={disabled || loading}
    className={cx(
      'inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold tracking-tight whitespace-nowrap transition-all',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-ink-950',
      'disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-px',
      size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm',
      BUTTON_VARIANTS[variant],
      className,
    )}
  >
    {loading ? (
      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
    ) : (
      icon && <span className={cx('material-symbols-outlined', size === 'sm' ? 'text-[16px]' : 'text-[18px]')}>{icon}</span>
    )}
    {children}
  </button>
);

export const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: string; label: string; tone?: 'default' | 'danger' }
> = ({ icon, label, tone = 'default', className, type = 'button', ...rest }) => (
  <button
    {...rest}
    type={type}
    aria-label={label}
    title={label}
    className={cx(
      'inline-flex size-9 items-center justify-center rounded-xl transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
      tone === 'danger'
        ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
        : 'text-text-muted hover:text-text-main hover:bg-ink-100/70 dark:hover:bg-white/10 dark:hover:text-white',
      className,
    )}
  >
    <span className="material-symbols-outlined text-[20px]">{icon}</span>
  </button>
);

/* ── Badges, avatars ──────────────────────────────────────────────────── */

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';
const BADGE_TONES: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700 dark:bg-white/10 dark:text-gray-300',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  danger: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  brand: 'bg-primary/15 text-teal-accent dark:text-primary',
};
const DOT_TONES: Record<Tone, string> = {
  neutral: 'bg-ink-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-sky-500',
  brand: 'bg-primary',
};

export const Badge: React.FC<{ tone?: Tone; dot?: boolean; children: React.ReactNode; className?: string }> = ({
  tone = 'neutral',
  dot,
  children,
  className,
}) => (
  <span
    className={cx(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-tight whitespace-nowrap',
      BADGE_TONES[tone],
      className,
    )}
  >
    {dot && <span className={cx('size-1.5 rounded-full', DOT_TONES[tone])} />}
    {children}
  </span>
);

/** Shared status vocabulary so every screen says the same thing in the same colour. */
export const STATUS: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: 'Actif', tone: 'success' },
  INACTIVE: { label: 'Inactif', tone: 'neutral' },
  SCHEDULED: { label: 'Prévu', tone: 'info' },
  DELAYED: { label: 'Retardé', tone: 'warning' },
  CANCELLED: { label: 'Annulé', tone: 'danger' },
  COMPLETED: { label: 'Terminé', tone: 'neutral' },
  PENDING: { label: 'En attente', tone: 'warning' },
  CONFIRMED: { label: 'Confirmé', tone: 'success' },
  BOARDED: { label: 'Embarqué', tone: 'brand' },
  SUCCEEDED: { label: 'Payé', tone: 'success' },
  FAILED: { label: 'Échoué', tone: 'danger' },
  REFUNDED: { label: 'Remboursé', tone: 'info' },
  WAITING: { label: 'En attente', tone: 'warning' },
  NOTIFIED: { label: 'Prévenu', tone: 'info' },
  PROMOTED: { label: 'Promu', tone: 'success' },
  EXPIRED: { label: 'Expiré', tone: 'neutral' },
  LOW: { label: 'Faible', tone: 'neutral' },
  MEDIUM: { label: 'Moyen', tone: 'warning' },
  HIGH: { label: 'Élevé', tone: 'danger' },
  CRITICAL: { label: 'Critique', tone: 'danger' },
};

export const StatusBadge: React.FC<{ status: string; dot?: boolean }> = ({ status, dot = true }) => {
  const s = STATUS[status] ?? { label: status, tone: 'neutral' as Tone };
  return (
    <Badge tone={s.tone} dot={dot}>
      {s.label}
    </Badge>
  );
};

export const ROLE_LABELS: Record<string, string> = {
  USER: 'Client',
  SUPER_ADMIN: 'Super administrateur',
  COMPANY_ADMIN: 'Administrateur compagnie',
  AGENCY_ADMIN: 'Administrateur agence',
  STATION_MANAGER: 'Chef de gare',
};

export const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg'; color?: string }> = ({ name, size = 'md', color }) => (
  <span
    className={cx(
      'inline-flex shrink-0 items-center justify-center rounded-xl font-display font-semibold',
      size === 'sm' ? 'size-8 text-xs' : size === 'lg' ? 'size-12 text-base' : 'size-10 text-sm',
      !color && 'bg-primary/10 text-teal-accent dark:text-primary ring-1 ring-inset ring-primary/20',
    )}
    style={color ? { backgroundColor: color, color: '#fff' } : undefined}
    aria-hidden
  >
    {name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?'}
  </span>
);

/* ── Metrics ──────────────────────────────────────────────────────────── */

export const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: string;
  hint?: string;
  tone?: 'brand' | 'info' | 'warning' | 'danger';
}> = ({ label, value, icon, hint, tone = 'brand' }) => {
  const chip: Record<string, string> = {
    brand: 'bg-primary/10 text-teal-accent dark:text-primary ring-primary/20',
    info: 'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/20',
    warning: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20',
    danger: 'bg-red-50 text-red-700 ring-red-100 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/20',
  };
  return (
    <Card className="!p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] font-medium text-text-muted dark:text-gray-400">{label}</div>
          <div className="mt-2 font-display text-[28px] leading-none font-semibold tracking-tight text-text-main dark:text-white tabular-nums">
            {value}
          </div>
          {hint && <div className="mt-2 text-xs text-text-muted dark:text-gray-500">{hint}</div>}
        </div>
        <span className={cx('inline-flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', chip[tone])}>
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </span>
      </div>
    </Card>
  );
};

export const formatXAF = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} FCFA`;

export const formatDateTime = (iso: string | Date) =>
  new Date(iso).toLocaleString('fr-FR', {
    timeZone: 'Africa/Douala',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

/* ── States ───────────────────────────────────────────────────────────── */

export const Spinner: React.FC<{ className?: string }> = ({ className }) => (
  <span className={cx('material-symbols-outlined animate-spin text-primary', className ?? 'text-4xl')}>progress_activity</span>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cx('animate-pulse rounded-xl bg-ink-100 dark:bg-white/10', className ?? 'h-16')} />
);

export const SkeletonList: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="space-y-3" aria-busy="true" aria-label="Chargement">
    {Array.from({ length: rows }, (_, i) => (
      <Skeleton key={i} className="h-16" />
    ))}
  </div>
);

export const EmptyState: React.FC<{
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon = 'inbox', title, description, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-14 px-6">
    <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-ink-100/80 dark:bg-white/10 text-ink-500 dark:text-gray-400 mb-4">
      <span className="material-symbols-outlined text-[28px]">{icon}</span>
    </span>
    <h3 className="font-display text-base font-semibold text-text-main dark:text-white">{title}</h3>
    {description && <p className="mt-1 text-sm text-text-muted dark:text-gray-400 max-w-sm">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div
    role="alert"
    className="flex items-center justify-between gap-3 flex-wrap rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4"
  >
    <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
      <span className="material-symbols-outlined">error</span>
      <span className="text-sm font-medium">{message}</span>
    </div>
    {onRetry && (
      <Button variant="danger" size="sm" icon="refresh" onClick={onRetry}>
        Réessayer
      </Button>
    )}
  </div>
);

export const InlineAlert: React.FC<{ tone?: 'danger' | 'warning' | 'success' | 'info'; children: React.ReactNode }> = ({
  tone = 'danger',
  children,
}) => {
  const tones = {
    danger: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
    info: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30',
  };
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cx('rounded-xl border px-3.5 py-2.5 text-sm font-medium', tones[tone])}
    >
      {children}
    </div>
  );
};

/* ── Forms ────────────────────────────────────────────────────────────── */

export const inputCls =
  'w-full h-10 px-3 rounded-xl border border-ink-200 dark:border-white/15 bg-white dark:bg-ink-950/40 text-sm text-text-main dark:text-white ' +
  'placeholder:text-ink-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60';

export const Field: React.FC<{
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label, hint, error, className, children }) => (
  <label className={cx('block', className)}>
    <span className="block text-[12px] font-semibold text-text-main dark:text-gray-200 mb-1.5">{label}</span>
    {children}
    {hint && !error && <span className="block text-xs text-text-muted mt-1">{hint}</span>}
    {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
  </label>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => <input ref={ref} {...rest} className={cx(inputCls, className)} />,
);
Input.displayName = 'Input';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...rest }, ref) => <select ref={ref} {...rest} className={cx(inputCls, 'pr-8', className)} />,
);
Select.displayName = 'Select';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...rest }, ref) => <textarea ref={ref} {...rest} className={cx(inputCls, 'h-auto py-2.5', className)} />,
);
Textarea.displayName = 'Textarea';

export const SearchInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}> = ({ value, onChange, placeholder = 'Rechercher…', className, label = 'Rechercher' }) => (
  <div className={cx('relative', className)}>
    <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-ink-400">search</span>
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={label}
      className={cx(inputCls, 'pl-10')}
    />
  </div>
);

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string; icon?: string }>;
  label?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-xl bg-ink-100/80 dark:bg-white/10 p-1 gap-0.5"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all',
            value === o.value
              ? 'bg-white dark:bg-ink-800 text-text-main dark:text-white shadow-subtle'
              : 'text-text-muted hover:text-text-main dark:hover:text-white',
          )}
        >
          {o.icon && <span className="material-symbols-outlined text-[16px]">{o.icon}</span>}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** In-page sub navigation (e.g. inside a section). */
export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  tabs: Array<{ value: T; label: string; count?: number }>;
  label?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-ink-100 dark:border-white/10 mb-5">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cx(
            'relative px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors -mb-px border-b-2',
            value === t.value
              ? 'border-primary text-text-main dark:text-white'
              : 'border-transparent text-text-muted hover:text-text-main dark:hover:text-white',
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className="ml-1.5 rounded-full bg-ink-100 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ── Tables ───────────────────────────────────────────────────────────── */

export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cx('overflow-x-auto rounded-2xl border border-ink-100 dark:border-white/10 bg-white dark:bg-surface-dark shadow-subtle', className)}>
    <table className="w-full text-sm">{children}</table>
  </div>
);

export const THead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="bg-ink-50/80 dark:bg-white/5">
    <tr>{children}</tr>
  </thead>
);

export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...rest }) => (
  <th
    {...rest}
    scope="col"
    className={cx(
      'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted dark:text-gray-400 whitespace-nowrap',
      className,
    )}
  />
);

export const TR: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, ...rest }) => (
  <tr
    {...rest}
    className={cx('border-t border-ink-100 dark:border-white/10 transition-colors hover:bg-ink-50/60 dark:hover:bg-white/5', className)}
  />
);

export const TD: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...rest }) => (
  <td {...rest} className={cx('px-4 py-3 align-middle text-text-main dark:text-gray-200', className)} />
);

/* ── Toasts ───────────────────────────────────────────────────────────── */

type ToastTone = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}
const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const push = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = nextId.current++;
    setItems((prev) => [...prev, { id, tone, message }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), tone === 'error' ? 6000 : 3500);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(92vw,360px)] flex-col gap-2" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={cx(
              'pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-medium shadow-elevated animate-fadeIn',
              t.tone === 'error'
                ? 'bg-red-600 border-red-700 text-white'
                : t.tone === 'info'
                  ? 'bg-ink-900 border-ink-800 text-white'
                  : 'bg-ink-950 border-primary/40 text-white',
            )}
          >
            <span className={cx('material-symbols-outlined text-[20px]', t.tone === 'success' && 'text-primary')}>
              {t.tone === 'error' ? 'error' : t.tone === 'info' ? 'info' : 'check_circle'}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/* ── Dialog (modal) & confirm ─────────────────────────────────────────── */

export const Dialog: React.FC<{
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}> = ({ title, description, onClose, children, footer, size = 'md' }) => {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink-950/60 backdrop-blur-sm animate-fadeIn"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          'flex max-h-[92vh] w-full flex-col overflow-hidden bg-white dark:bg-surface-dark shadow-elevated outline-none',
          'rounded-t-3xl sm:rounded-3xl border border-ink-100 dark:border-white/10',
          size === 'sm' ? 'sm:max-w-md' : size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-xl',
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-ink-100 dark:border-white/10">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-lg font-semibold tracking-tight text-text-main dark:text-white">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-text-muted dark:text-gray-400">{description}</p>}
          </div>
          <IconButton icon="close" label="Fermer" onClick={onClose} className="-mr-2 -mt-1" />
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-6 py-4 border-t border-ink-100 dark:border-white/10 bg-ink-50/60 dark:bg-white/5">{footer}</div>}
      </div>
    </div>
  );
};

export const ConfirmDialog: React.FC<{
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, message, confirmLabel = 'Confirmer', tone = 'danger', loading, onConfirm, onCancel }) => (
  <Dialog
    title={title}
    size="sm"
    onClose={onCancel}
    footer={
      <>
        <Button variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </>
    }
  >
    <div className="text-sm text-text-muted dark:text-gray-300 leading-relaxed">{message}</div>
  </Dialog>
);

/** Small hook: promise-based confirm dialog rendered by the caller. */
export function useConfirm() {
  const [state, setState] = useState<null | {
    title: string;
    message: React.ReactNode;
    confirmLabel?: string;
    tone?: 'danger' | 'primary';
    resolve: (ok: boolean) => void;
  }>(null);

  const confirm = useCallback(
    (opts: { title: string; message: React.ReactNode; confirmLabel?: string; tone?: 'danger' | 'primary' }) =>
      new Promise<boolean>((resolve) => setState({ ...opts, resolve })),
    [],
  );

  const dialog = useMemo(
    () =>
      state ? (
        <ConfirmDialog
          title={state.title}
          message={state.message}
          confirmLabel={state.confirmLabel}
          tone={state.tone}
          onCancel={() => {
            state.resolve(false);
            setState(null);
          }}
          onConfirm={() => {
            state.resolve(true);
            setState(null);
          }}
        />
      ) : null,
    [state],
  );

  return { confirm, dialog };
}
