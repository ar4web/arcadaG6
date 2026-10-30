import * as React from 'react';
import { cn } from '@/lib/utils';
import { InfoTip, Skeleton } from '@/components/ui/misc';
import { Sparkline } from './primitives';

export interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  invertDelta?: boolean;
  trend?: number[];
  icon?: React.ReactNode;
  tone?: 'primary' | 'accent' | 'info' | 'warning' | 'danger';
  hint?: string;
  footer?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

const TONES = {
  primary: 'bg-primary-soft text-primary-ink',
  accent: 'bg-accent-soft text-accent-ink',
  info: 'bg-info-soft text-info',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
} as const;

export function KpiCard({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  invertDelta,
  trend,
  icon,
  tone = 'primary',
  hint,
  footer,
  loading,
  className,
}: KpiCardProps) {
  const positive = delta === undefined ? null : invertDelta ? delta <= 0 : delta >= 0;

  if (loading) {
    return (
      <div className={cn('rounded-lg border border-line bg-surface p-4 shadow-xs', className)}>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-7 w-20" />
        <Skeleton className="mt-3 h-3 w-32" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between rounded-lg border border-line bg-surface p-4 shadow-xs transition-[box-shadow,border-color] duration-200 hover:border-line-2 hover:shadow-sm',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-ink-3">
          {label}
          {hint ? <InfoTip>{hint}</InfoTip> : null}
        </span>
        {icon ? (
          <span className={cn('grid size-7 shrink-0 place-items-center rounded-md [&_svg]:size-3.5', TONES[tone])}>{icon}</span>
        ) : null}
      </div>

      <div className="mt-2.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="num flex items-baseline gap-1 text-[26px] font-semibold leading-none tracking-[-0.02em] text-ink">
            {value}
            {unit ? <span className="text-[12px] font-normal tracking-normal text-ink-4">{unit}</span> : null}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            {delta !== undefined ? (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold num',
                  positive ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
                )}
              >
                <svg viewBox="0 0 12 12" className="size-2" aria-hidden="true">
                  <path d={positive ? 'M6 2.5 10 8H2z' : 'M6 9.5 2 4h8z'} fill="currentColor" />
                </svg>
                {Math.abs(delta).toFixed(1)}%
              </span>
            ) : null}
            {deltaLabel ? <span className="text-[10.5px] text-ink-4">{deltaLabel}</span> : null}
          </div>
        </div>
        {trend?.length ? <Sparkline values={trend} className="mb-0.5 shrink-0 opacity-90" /> : null}
      </div>

      {footer ? <div className="mt-3 border-t border-line pt-2 text-[10.5px] text-ink-4">{footer}</div> : null}
    </div>
  );
}
