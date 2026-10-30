import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Search, ShieldCheck } from 'lucide-react';
import { auditStats, listAudit } from '@/services/audit';
import { useUIStore } from '@/stores/ui';
import { formatDate, relativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge, EmptyState, Skeleton } from '@/components/ui/misc';
import { Input } from '@/components/ui/input';
import { PageFooter, PageHeader } from '@/modules/shell/PageHeader';

export default function Audit() {
  const locale = useUIStore((s) => s.locale);
  const [search, setSearch] = React.useState('');
  const { data: events, isLoading } = useQuery({ queryKey: ['audit'], queryFn: () => listAudit(120) });
  const { data: stats } = useQuery({ queryKey: ['audit-stats'], queryFn: auditStats });

  const rows = (events ?? []).filter((event) => !search || `${event.actor} ${event.action} ${event.entity}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <PageHeader
        eyebrow="Administration · Governance"
        title="Audit log"
        description="Append-only record of every privileged action. Immutable once written; retained for seven years."
        actions={
          <Button variant="secondary" size="sm">
            <Download className="size-3.5" /> Export
          </Button>
        }
      />

      <div className="mb-3 grid grid-cols-3 gap-2.5">
        {[
          { label: 'Events retained', value: stats?.total ?? 0 },
          { label: 'Today', value: stats?.today ?? 0 },
          { label: 'Privileged changes', value: stats?.privileged ?? 0 },
        ].map((stat) => (
          <Card key={stat.label} className="p-3">
            <p className="text-[10px] text-ink-3">{stat.label}</p>
            <p className="num mt-1 text-[18px] font-semibold leading-none text-ink">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="mb-2 flex items-center gap-2">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter by actor, action or entity…" icon={<Search />} className="h-8 max-w-sm text-[11.5px]" />
        <span className="ms-auto inline-flex items-center gap-1 text-[10px] text-ink-4">
          <ShieldCheck className="size-3" /> Tamper-evident
        </span>
      </div>

      <Card flush>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-line bg-surface-2">
                {['When', 'Actor', 'Action', 'Entity', 'Source IP'].map((heading) => (
                  <th key={heading} className="px-3 py-2 text-start text-[9.5px] font-semibold uppercase tracking-wide text-ink-4">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading
                ? Array.from({ length: 10 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={5} className="p-2">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))
                : rows.map((event) => (
                    <tr key={event.id} className="hover:bg-surface-2">
                      <td className="whitespace-nowrap px-3 py-2 text-[10.5px] text-ink-4">
                        <span className="num">{formatDate(event.at, 'd MMM, HH:mm', locale)}</span>
                        <span className="ms-1 text-ink-4/70">· {relativeTime(event.at, locale)}</span>
                      </td>
                      <td className="px-3 py-2 text-[11.5px] font-medium text-ink-2">{event.actor}</td>
                      <td className="px-3 py-2 text-[11.5px] text-ink-3">{event.action}</td>
                      <td className="px-3 py-2">
                        <Badge tone="neutral">{event.entity.replace('_', ' ')}</Badge>
                      </td>
                      <td className="num px-3 py-2 text-[10.5px] text-ink-4">{event.ip}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {!isLoading && rows.length === 0 ? <EmptyState title="No matching events" description="Try a different filter." /> : null}
        <div className="border-t border-line bg-surface-2 px-3 py-2 text-[10.5px] text-ink-4">{rows.length} events shown</div>
      </Card>

      <PageFooter note="Audit records are append-only." right="Retention: 7 years" />
    </>
  );
}
