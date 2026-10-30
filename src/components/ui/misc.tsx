import * as React from 'react';
import { Info, Inbox } from 'lucide-react';
import { cn, initials } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
export { Badge } from './badge';

/* --------------------------------- Avatar --------------------------------- */

const SIZES = { xs: 'size-6 text-[9px]', sm: 'size-7 text-[10px]', md: 'size-9 text-[11.5px]', lg: 'size-12 text-sm', xl: 'size-16 text-lg' } as const;

export function Avatar({
  name,
  hue = 0,
  size = 'md',
  className,
  ring,
}: {
  name: string;
  hue?: number;
  size?: keyof typeof SIZES;
  className?: string;
  ring?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full font-semibold uppercase tracking-wide text-white/95 select-none',
        SIZES[size],
        ring && 'ring-2 ring-surface',
        className,
      )}
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 32% 48%), hsl(${(hue + 28) % 360} 34% 38%))`,
      }}
    >
      {initials(name)}
    </span>
  );
}

/* -------------------------------- Skeleton -------------------------------- */

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gradient-to-r from-surface-3 via-canvas-raised to-surface-3 bg-[length:200%_100%]',
        className,
      )}
      {...props}
    />
  );
}

/* -------------------------------- Progress -------------------------------- */

export function Progress({
  value,
  className,
  tone = 'primary',
  height = 'h-1.5',
}: {
  value: number;
  className?: string;
  tone?: 'primary' | 'accent' | 'warning' | 'danger' | 'info';
  height?: string;
}) {
  const toneClass = {
    primary: 'bg-primary',
    accent: 'bg-accent',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
  }[tone];
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('w-full overflow-hidden rounded-full bg-surface-3', height, className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500', toneClass)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

/* -------------------------------- Separator ------------------------------- */

export function Separator({ className, vertical }: { className?: string; vertical?: boolean }) {
  return <div role="separator" className={cn(vertical ? 'h-full w-px' : 'h-px w-full', 'bg-line', className)} />;
}

/* ---------------------------------- Dot ----------------------------------- */

export function StatusDot({ tone = 'success', className }: { tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; className?: string }) {
  const color = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    neutral: 'bg-ink-4',
  }[tone];
  return (
    <span className={cn('relative inline-flex size-1.5 shrink-0 rounded-full', color, className)}>
      <span className={cn('absolute inset-0 animate-ping rounded-full opacity-40', color)} />
    </span>
  );
}

/* -------------------------------- InfoTip --------------------------------- */

export function InfoTip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="More information"
          className="grid size-4 place-items-center rounded-full text-ink-4 transition-colors hover:text-ink-2 focus-visible:ring-2 focus-visible:ring-primary-ring/40 focus-visible:outline-none"
        >
          <Info className="size-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
}

/* ------------------------------- EmptyState ------------------------------- */

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-6 py-14 text-center', className)}>
      <div className="mb-1 grid size-11 place-items-center rounded-full border border-line bg-surface-3 text-ink-4">
        {icon ?? <Inbox className="size-5" />}
      </div>
      <h4 className="text-[13px] font-semibold text-ink">{title}</h4>
      {description ? <p className="max-w-sm text-[11.5px] leading-relaxed text-ink-3">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/* ------------------------------ Segmented --------------------------------- */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = 'sm',
  className,
  ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: React.ReactNode }[];
  size?: 'xs' | 'sm';
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('inline-flex items-center gap-0.5 rounded-md border border-line bg-surface-3 p-0.5', className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-[5px] font-medium transition-all duration-150',
              size === 'xs' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-[11.5px]',
              active ? 'bg-surface text-ink shadow-xs' : 'text-ink-4 hover:text-ink-2',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------- Delta pill ------------------------------- */

export function Delta({ value, suffix, invert = false, className }: { value: number; suffix?: string; invert?: boolean; className?: string }) {
  const positive = invert ? value <= 0 : value >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[10.5px] font-medium num',
        positive ? 'text-success' : 'text-danger',
        className,
      )}
    >
      <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden="true">
        <path d={positive ? 'M6 2.5 10 8H2z' : 'M6 9.5 2 4h8z'} fill="currentColor" />
      </svg>
      {Math.abs(value).toFixed(1)}
      {suffix ?? '%'}
    </span>
  );
}
