import * as React from 'react';
import { cn } from '@/lib/utils';

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full border-collapse text-start', className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('sticky top-0 z-10 bg-surface-2', className)} {...props} />;
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-line', className)} {...props} />;
}

export function TR({ className, interactive, ...props }: React.HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean }) {
  return (
    <tr
      className={cn(
        'transition-colors',
        interactive && 'cursor-pointer hover:bg-surface-2',
        className,
      )}
      {...props}
    />
  );
}

export function TH({ className, align = 'start', ...props }: Omit<React.ThHTMLAttributes<HTMLTableCellElement>, 'align'> & { align?: 'start' | 'end' | 'center' }) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap border-b border-line px-2.5 py-2 text-[10.5px] font-semibold uppercase tracking-[0.055em] text-ink-4',
        align === 'end' && 'text-end',
        align === 'center' && 'text-center',
        align === 'start' && 'text-start',
        className,
      )}
      {...props}
    />
  );
}

export function TD({ className, align = 'start', ...props }: Omit<React.TdHTMLAttributes<HTMLTableCellElement>, 'align'> & { align?: 'start' | 'end' | 'center' }) {
  return (
    <td
      className={cn(
        'px-2.5 py-1.5 text-[12.5px] text-ink-2 align-middle',
        align === 'end' && 'text-end',
        align === 'center' && 'text-center',
        className,
      )}
      {...props}
    />
  );
}

export function TableFooterBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-2 px-4 py-2.5', className)}>
      {children}
    </div>
  );
}
