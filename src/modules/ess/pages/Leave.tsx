import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Check, Plus, X } from 'lucide-react';
import type { LeaveType } from '@/types';
import { createLeaveRequest, leaveBalances, listLeaveRequests } from '@/services/leave';
import { LEAVE_TYPES } from '@/lib/mock/master';
import { db } from '@/lib/mock/db';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { cn, daysBetween, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeading } from '@/components/ui/card';
import { Badge, EmptyState, Progress } from '@/components/ui/misc';
import { Field, Input, NativeSelect, Textarea } from '@/components/ui/input';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageFooter, PageHeader } from '@/modules/shell/PageHeader';
import { toast } from 'sonner';

export default function EssLeave() {
  const locale = useUIStore((s) => s.locale);
  const session = useAuthStore((s) => s.session);
  const employeeId = session?.employeeId ?? db.employees[0]!.id;
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<LeaveType>('annual');
  const [start, setStart] = React.useState('2026-11-16');
  const [end, setEnd] = React.useState('2026-11-20');
  const [reason, setReason] = React.useState('');

  const { data: balances } = useQuery({ queryKey: ['my-balances', employeeId], queryFn: () => leaveBalances(employeeId) });
  const { data: requests } = useQuery({ queryKey: ['my-leave', employeeId], queryFn: () => listLeaveRequests({ employeeId }) });

  const submit = useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-leave'] });
      void queryClient.invalidateQueries({ queryKey: ['my-balances'] });
      setOpen(false);
      setReason('');
      toast.success('Leave request submitted for approval');
    },
  });

  const days = Math.max(1, daysBetween(start, end) + 1);
  const annual = balances?.find((balance) => balance.type === 'annual');

  return (
    <>
      <PageHeader
        eyebrow="My workspace"
        title="My leave"
        description="Check your balance, request time off, and follow the approval."
        actions={
          <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" /> Request leave
          </Button>
        }
      />

      <div className="mb-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {balances?.map((balance) => (
          <Card key={balance.type} className="p-3.5">
            <div className="flex items-start justify-between">
              <p className="text-[10.5px] capitalize text-ink-3">{balance.type} leave</p>
              <Badge tone={balance.remaining > 10 ? 'success' : balance.remaining > 4 ? 'warning' : 'danger'}>{balance.remaining} left</Badge>
            </div>
            <p className="num mt-1 text-[21px] font-semibold leading-none text-ink">
              {balance.taken}
              <span className="ms-1 text-[11px] font-normal text-ink-4">of {balance.entitlement} used</span>
            </p>
            <Progress value={(balance.taken / Math.max(1, balance.entitlement)) * 100} tone={balance.remaining > 10 ? 'accent' : 'warning'} className="mt-2" height="h-1" />
            {balance.pending ? <p className="mt-1 text-[9.5px] text-warning">{balance.pending} days pending approval</p> : null}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2" flush>
          <CardHeading title="My requests" description="This leave year." />
          {requests?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-y border-line bg-surface-2">
                    {['Type', 'Dates', 'Days', 'Status', 'Decided by'].map((heading) => (
                      <th key={heading} className="px-3 py-1.5 text-start text-[9.5px] font-semibold uppercase tracking-wide text-ink-4">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-surface-2">
                      <td className="px-3 py-2 text-[11.5px] capitalize text-ink-2">{request.type.replace('_', ' ')}</td>
                      <td className="num px-3 py-2 text-[11px] text-ink-3">
                        {formatDate(request.startDate, 'd MMM', locale)} – {formatDate(request.endDate, 'd MMM yyyy', locale)}
                      </td>
                      <td className="num px-3 py-2 text-[11px] text-ink-2">{request.days}</td>
                      <td className="px-3 py-2">
                        <Badge tone={request.status === 'approved' ? 'success' : request.status === 'pending' ? 'warning' : request.status === 'rejected' ? 'danger' : 'neutral'} dot>
                          {request.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-[10.5px] text-ink-4">{request.decidedAt ? formatDate(request.decidedAt, 'd MMM', locale) : 'Awaiting manager'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No requests yet" description="Request time off and it will appear here." icon={<CalendarDays className="size-5" />} />
          )}
        </Card>

        <Card>
          <CardHeading title="How approval works" description="Typical path for an annual leave request." />
          <ol className="flex flex-col gap-2.5 px-5 pb-5">
            {[
              ['You submit', 'Include a handover note for your team.'],
              ['Line manager reviews', `${db.departments.find((d) => d.id === db.employees.find((e) => e.id === employeeId)?.departmentId)?.name ?? 'Your team'} head typically responds within 2 days.`],
              ['HR confirms balance', 'Automatic if the balance covers the request.'],
              ['Calendar updates', 'Your team sees the absence immediately.'],
            ].map(([title, body], index) => (
              <li key={title} className="flex gap-2.5">
                <span className="num grid size-5 shrink-0 place-items-center rounded-full bg-surface-3 text-[9.5px] font-semibold text-ink-3">{index + 1}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-ink">{title}</p>
                  <p className="text-[10px] leading-relaxed text-ink-4">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <PageFooter note="Balances include approved leave only." right={`Entitlement ${annual?.entitlement ?? 30} days`} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Request leave</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-3">
              <Field label="Leave type" required>
                <NativeSelect value={type} onChange={(event) => setType(event.target.value as LeaveType)}>
                  {LEAVE_TYPES.filter((entry) => entry.id === 'annual' || entry.id === 'sick' || entry.id === 'unpaid').map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.en}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="From" required>
                  <Input type="date" value={start} onChange={(event) => setStart(event.target.value)} />
                </Field>
                <Field label="To" required>
                  <Input type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
                </Field>
              </div>
              <div className={cn('rounded-md px-2.5 py-1.5 text-[10.5px]', days > (annual?.remaining ?? 0) && type === 'annual' ? 'bg-danger-soft text-danger' : 'bg-surface-2 text-ink-3')}>
                {days} working days requested
                {type === 'annual' ? ` · ${annual?.remaining ?? 0} remaining` : ''}
              </div>
              <Field label="Reason & handover" hint="Your manager sees this note.">
                <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Family trip; Layla will cover the weekly review." />
              </Field>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              <X className="size-3.5" /> Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={submit.isPending}
              onClick={() => submit.mutate({ employeeId, type, startDate: start, endDate: end, reason: reason || 'Personal' })}
            >
              <Check className="size-3.5" /> Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
