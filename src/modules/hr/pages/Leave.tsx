import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock, Download, Plus, X } from 'lucide-react';
import type { LeaveRequest, LeaveStatus } from '@/types';
import { decideLeave, listLeaveRequests } from '@/services/leave';
import { exportTable, leaveRegisterReport } from '@/services/reports';
import { db, displayName, getEmployee } from '@/lib/mock/db';
import { useUIStore } from '@/stores/ui';
import { cn, formatDate, relativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, Badge, EmptyState, InfoTip, Skeleton } from '@/components/ui/misc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NativeSelect } from '@/components/ui/input';
import { PageFooter, PageHeader } from '@/modules/shell/PageHeader';

const STATUS_TONE: Record<LeaveStatus, 'warning' | 'success' | 'danger' | 'neutral'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
};

const TYPE_LABEL: Record<string, string> = {
  annual: 'Annual',
  sick: 'Sick',
  unpaid: 'Unpaid',
  maternity: 'Maternity',
  paternity: 'Paternity',
  hajj: 'Hajj',
  marriage: 'Marriage',
  bereavement: 'Bereavement',
};

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay()); // Sunday-first
  const weeks: Date[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export default function Leave() {
  const [params] = useSearchParams();
  const locale = useUIStore((s) => s.locale);
  const queryClient = useQueryClient();
  const [tab, setTab] = React.useState(params.get('tab') ?? 'pending');
  const [statusFilter, setStatusFilter] = React.useState<'all' | LeaveStatus>('all');
  const [cursor, setCursor] = React.useState(new Date(2026, 9, 1));

  const { data: requests, isLoading } = useQuery({ queryKey: ['leave', 'hr'], queryFn: () => listLeaveRequests() });

  const decide = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => decideLeave(id, status, 'Noura Al-Otaibi'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leave'] });
      void queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const pending = (requests ?? []).filter((request) => request.status === 'pending');
  const approvedThisMonth = (requests ?? []).filter((request) => request.status === 'approved' && request.startDate.startsWith('2026-10'));
  const onLeaveToday = (requests ?? []).filter((request) => request.status === 'approved' && request.startDate <= '2026-10-31' && request.endDate >= '2026-10-31');
  const filtered = (requests ?? []).filter((request) => statusFilter === 'all' || request.status === statusFilter);

  const weeks = monthMatrix(cursor.getFullYear(), cursor.getMonth());
  const monthLabel = cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  function requestsOn(date: Date) {
    const key = date.toISOString().slice(0, 10);
    return db.leave.filter((request) => request.status !== 'rejected' && request.status !== 'cancelled' && request.startDate <= key && request.endDate >= key);
  }

  return (
    <>
      <PageHeader
        eyebrow="Workforce · Time off"
        title="Leave & attendance"
        description="Approve requests in one pass, keep the calendar honest, and make sure nobody comes back to a mountain of work."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => exportTable(leaveRegisterReport(), 'csv')}>
              <Download className="size-3.5" /> Export register
            </Button>
            <Button variant="primary" size="sm">
              <Plus className="size-3.5" /> New request
            </Button>
          </>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          { label: 'Awaiting approval', value: pending.length, tone: 'text-warning', hint: 'oldest request 4 days ago' },
          { label: 'Approved this month', value: approvedThisMonth.length, tone: 'text-success', hint: 'October 2026' },
          { label: 'On leave today', value: onLeaveToday.length, tone: 'text-info', hint: 'approved and in range' },
          { label: 'Avg. approval time', value: '1.8 d', tone: 'text-ink', hint: 'target under 2 days' },
        ].map((stat) => (
          <Card key={stat.label} className="p-3.5">
            <p className="text-[10.5px] text-ink-3">{stat.label}</p>
            <p className={cn('num mt-1 text-[20px] font-semibold leading-none', stat.tone)}>{stat.value}</p>
            <p className="mt-1 truncate text-[9.5px] text-ink-4">{stat.hint}</p>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-wrap items-center gap-2">
          <TabsList>
            <TabsTrigger value="pending">
              Pending
              {pending.length ? <span className="rounded-full bg-warning-soft px-1.5 text-[9.5px] font-semibold text-warning">{pending.length}</span> : null}
            </TabsTrigger>
            <TabsTrigger value="all">All requests</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>
          {tab === 'all' ? (
            <NativeSelect
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="ms-auto h-8 w-auto text-[11.5px]"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </NativeSelect>
          ) : null}
        </div>

        <TabsContent value="pending" className="mt-3">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : pending.length === 0 ? (
            <Card>
              <EmptyState title="Inbox zero" description="Nothing is waiting for approval. Nice." icon={<Check className="size-5" />} />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
              {pending.map((request) => {
                const employee = getEmployee(request.employeeId);
                const balance = employee?.leave.annualEntitlement ?? 0;
                const taken = employee?.leave.annualTaken ?? 0;
                return (
                  <Card key={request.id} className="p-3.5">
                    <div className="flex items-start gap-2.5">
                      <Avatar name={displayName(employee!)} hue={employee?.avatarHue} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-[12.5px] font-semibold text-ink">{displayName(employee!)}</p>
                          <Badge tone="warning">{TYPE_LABEL[request.type]}</Badge>
                        </div>
                        <p className="truncate text-[10.5px] text-ink-4">
                          {employee?.jobTitle} · submitted {relativeTime(request.submittedAt, locale)}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-surface-2 px-2.5 py-1.5 text-[10.5px]">
                          <span className="inline-flex items-center gap-1 text-ink-2">
                            <CalendarDays className="size-3 text-ink-4" />
                            {formatDate(request.startDate, 'd MMM', locale)} – {formatDate(request.endDate, 'd MMM yyyy', locale)}
                          </span>
                          <span className="num text-ink-3">{request.days} days</span>
                          <span className="text-ink-4">
                            balance {Math.max(0, balance - taken)} d
                            <InfoTip>Annual entitlement is 30 days. The remaining balance already accounts for approved leave.</InfoTip>
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-[10.5px] leading-relaxed text-ink-3">{request.reason}</p>
                        {request.handoverTo ? (
                          <p className="mt-1 text-[10px] text-ink-4">Handover to {displayName(getEmployee(request.handoverTo)!)}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-end gap-2 border-t border-line pt-2.5">
                      <Button variant="ghost" size="sm" onClick={() => decide.mutate({ id: request.id, status: 'rejected' })}>
                        <X className="size-3.5" /> Decline
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => decide.mutate({ id: request.id, status: 'approved' })}>
                        <Check className="size-3.5" /> Approve
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-3">
          <Card flush>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  <tr className="border-b border-line bg-surface-2">
                    {['Employee', 'Type', 'Dates', 'Days', 'Submitted', 'Handover', 'Status'].map((heading) => (
                      <th key={heading} className="px-3 py-2 text-start text-[9.5px] font-semibold uppercase tracking-wide text-ink-4">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.slice(0, 40).map((request) => {
                    const employee = getEmployee(request.employeeId);
                    return (
                      <tr key={request.id} className="transition-colors hover:bg-surface-2">
                        <td className="px-3 py-2">
                          <span className="flex items-center gap-2">
                            <Avatar name={displayName(employee!)} hue={employee?.avatarHue} size="xs" />
                            <span className="truncate text-[11.5px] text-ink-2">{displayName(employee!)}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[11.5px] text-ink-3">{TYPE_LABEL[request.type]}</td>
                        <td className="num px-3 py-2 text-[11px] text-ink-3">
                          {formatDate(request.startDate, 'd MMM', locale)} – {formatDate(request.endDate, 'd MMM', locale)}
                        </td>
                        <td className="num px-3 py-2 text-[11.5px] text-ink-2">{request.days}</td>
                        <td className="px-3 py-2 text-[10.5px] text-ink-4">{relativeTime(request.submittedAt, locale)}</td>
                        <td className="px-3 py-2 text-[10.5px] text-ink-4">
                          {request.handoverTo ? displayName(getEmployee(request.handoverTo)!) : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <Badge tone={STATUS_TONE[request.status]} dot>
                            {request.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line bg-surface-2 px-3 py-2 text-[10.5px] text-ink-4">
              Showing {Math.min(40, filtered.length)} of {filtered.length} requests
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="mt-3">
          <Card>
            <div className="flex items-center justify-between px-5 pt-4">
              <div>
                <h3 className="text-[13.5px] font-semibold text-ink">{monthLabel}</h3>
                <p className="text-[10.5px] text-ink-4">Approved and pending absence across the group.</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="secondary" size="icon-sm" aria-label="Previous month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
                  <ChevronLeft className="size-3.5 rtl:rotate-180" />
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setCursor(new Date(2026, 9, 1))}>
                  Today
                </Button>
                <Button variant="secondary" size="icon-sm" aria-label="Next month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
                  <ChevronRight className="size-3.5 rtl:rotate-180" />
                </Button>
              </div>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-7 gap-1 pb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="px-1.5 pb-1 text-[9.5px] font-semibold uppercase tracking-wide text-ink-4">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {weeks.flat().map((date) => {
                  const inMonth = date.getMonth() === cursor.getMonth();
                  const isWeekend = date.getDay() === 5 || date.getDay() === 6;
                  const items = requestsOn(date);
                  return (
                    <div
                      key={date.toISOString()}
                      className={cn(
                        'min-h-[74px] rounded-md border p-1.5 transition-colors',
                        inMonth ? 'border-line bg-surface' : 'border-transparent bg-surface-2/60',
                        isWeekend && inMonth && 'bg-surface-3/70',
                        date.toISOString().slice(0, 10) === '2026-10-31' && 'ring-1 ring-primary/50',
                      )}
                    >
                      <p className={cn('num mb-1 text-[10px]', inMonth ? 'text-ink-3' : 'text-ink-4/60')}>{date.getDate()}</p>
                      <div className="flex flex-col gap-0.5">
                        {items.slice(0, 3).map((request) => {
                          const employee = getEmployee(request.employeeId);
                          return (
                            <span
                              key={request.id}
                              className={cn(
                                'truncate rounded px-1 py-0.5 text-[8.5px] font-medium',
                                request.status === 'pending' ? 'bg-warning-soft text-warning' : request.type === 'sick' ? 'bg-danger-soft text-danger' : 'bg-accent-soft text-accent-ink',
                              )}
                              title={`${displayName(employee!)} · ${request.type}`}
                            >
                              {displayName(employee!).split(' ')[0]}
                            </span>
                          );
                        })}
                        {items.length > 3 ? <span className="px-1 text-[8.5px] text-ink-4">+{items.length - 3} more</span> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-2 text-[9.5px] text-ink-4">
              <span className="inline-flex items-center gap-1">
                <i className="size-2 rounded bg-accent-soft" /> Approved annual
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="size-2 rounded bg-danger-soft" /> Sick
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="size-2 rounded bg-warning-soft" /> Pending
              </span>
              <span className="ms-auto inline-flex items-center gap-1">
                <Clock className="size-2.5" /> Weekend: Friday & Saturday
              </span>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <PageFooter note="Leave balances recalculate on approval." right="Policy: 30 days annual, 30 days sick, 15 days unpaid" />
    </>
  );
}

export type { LeaveRequest };
