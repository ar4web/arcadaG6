import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BellRing, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StripMessage {
  id: string;
  tone: 'warning' | 'danger' | 'info';
  message: string;
  actionLabel: string;
  href: string;
}

const MESSAGES: StripMessage[] = [
  {
    id: 'wps',
    tone: 'warning',
    message: 'October payroll closes in 3 days. WPS file must reach the bank by 27 Oct.',
    actionLabel: 'Review payroll',
    href: '/finance/payroll',
  },
  {
    id: 'iqama',
    tone: 'danger',
    message: '7 iqamas expire within 45 days — renewals must be lodged with Jawazat.',
    actionLabel: 'Open compliance',
    href: '/hr/compliance',
  },
  {
    id: 'review',
    tone: 'info',
    message: 'H2 2026 review cycle is 61% complete. 76 reviews are still outstanding.',
    actionLabel: 'Nudge managers',
    href: '/hr/performance',
  },
];

export function NotificationStrip({ className }: { className?: string }) {
  const [dismissed, setDismissed] = React.useState<string[]>([]);
  const visible = MESSAGES.filter((message) => !dismissed.includes(message.id));
  if (!visible.length) return null;

  const toneClass: Record<StripMessage['tone'], string> = {
    warning: 'border-warning/25 bg-warning-soft text-warning',
    danger: 'border-danger/25 bg-danger-soft text-danger',
    info: 'border-info/25 bg-info-soft text-info',
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {visible.map((message) => (
        <div
          key={message.id}
          className={cn('flex items-center gap-2.5 rounded-md border px-3 py-1.5 text-[11px]', toneClass[message.tone])}
          role="status"
        >
          <BellRing className="size-3.5 shrink-0" />
          <p className="min-w-0 flex-1 truncate">{message.message}</p>
          <Link to={message.href} className="hidden shrink-0 items-center gap-1 font-medium underline-offset-2 hover:underline sm:inline-flex">
            {message.actionLabel}
            <ArrowRight className="size-3" />
          </Link>
          <button
            onClick={() => setDismissed((current) => [...current, message.id])}
            aria-label="Dismiss"
            className="grid size-5 shrink-0 place-items-center rounded opacity-60 transition-colors hover:bg-black/5 hover:text-current"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
