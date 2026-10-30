import * as React from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  tabs,
  className,
  compact,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn('mb-4', className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          {eyebrow ? <p className="mb-1 text-[9.5px] font-semibold uppercase tracking-[0.13em] text-ink-4">{eyebrow}</p> : null}
          <h1
            className={cn(
              'font-display font-extrabold leading-[1.1] tracking-[-0.028em] text-ink',
              compact ? 'text-[21px]' : 'text-[26px] sm:text-[29px]',
            )}
          >
            {title}
          </h1>
          {description ? <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-ink-3">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {tabs ? <div className="mt-3.5">{tabs}</div> : null}
    </div>
  );
}

export function PageFooter({ note, right }: { note?: string; right?: React.ReactNode }) {
  return (
    <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[10px] text-ink-4">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-accent" />
        {note ?? 'Your people, in perspective.'}
      </span>
      <span className="flex items-center gap-2">
        {right ?? 'Demo workspace · figures are synthetic'}
      </span>
    </footer>
  );
}

export function MethodologyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-line bg-surface-2 px-3.5 py-2.5">
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded bg-surface-3 text-ink-4">
        <svg viewBox="0 0 12 12" className="size-2.5" fill="currentColor" aria-hidden="true">
          <path d="M6 1 11 4v4L6 11 1 8V4L6 1Z" opacity=".35" />
          <path d="M5.4 3.5h1.2v.9H5.4zM5.4 5.2h1.2v3.3H5.4z" />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold text-ink-2">Behind the numbers</p>
        <p className="mt-0.5 text-[10.5px] leading-relaxed text-ink-3">{children}</p>
      </div>
    </div>
  );
}
