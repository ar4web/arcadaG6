import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Download, Plus, Search, X } from 'lucide-react';
import type { ExpenseClaim, ExpenseStatus } from '@/types';
import { createExpense, decideExpense, expenseSummary, listExpenses } from '@/services/expenses';
import { displayName, getEmployee } from '@/lib/mock/db';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { formatDate, formatSAR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, Badge, EmptyState, Skeleton } from '@/components/ui/misc';
import { Input, NativeSelect } from '@/components/ui/input';
import { PageFooter, PageHeader } from '@/modules/shell/PageHeader';
import { toast } from 'sonner';

const STATUS_TONE: Record<ExpenseStatus, 'neutral' | 'warning' | 'info' | 'success' | 'danger'> = {
  draft: 'neutral',
  submitted: 'warning',
  approved: 'info',
  rejected: 'danger',
  reimbursed: 'success',
};

export default function Expenses({ self = false }: { self?: boolean }) {
  const locale = useUIStore((s) => s.locale);
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState<ExpenseStatus | 'all'>('all');
  const [search, setSearch] = React.useState('');

  const employeeId = self ? session?.employeeId : undefined;
  const { data: claims, isLoading } = useQuery({ queryKey: ['expenses', employeeId], queryFn: () => listExpenses({ employeeId }) });
  const { data: summary } = useQuery({ queryKey: ['expense-summary'], queryFn: expenseSummary });

  const decide = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => decideExpense(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Claim updated');
    },
  });

  const create = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Claim submitted for approval');
    },
  });

  const rows = (claims ?? []).filter((claim) => {
    if (status !== 'all' && claim.status !== status) return false;
    if (!search) return true;
    const employee = getEmployee(claim.employeeId);
    return `${claim.description} ${employee ? displayName(employee) : ''}`.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <>
      <PageHeader
        eyebrow={self ? 'My workspace' : 'Money · Spend'}
        title={self ? 'My expenses' : 'Expenses'}
        description={self ? 'Claim what you spend on the company. Reimbursement lands with the next payroll run.' : 'Approve, reject and reimburse. Receipts are mandatory above SAR 500.'}
        actions={
          <>
            <Button variant="secondary" size="sm">
              <Download className="size-3.5" /> Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={create.isPending}
              onClick={() =>
                create.mutate({
                  employeeId: session?.employeeId ?? '',
                  category: 'travel',
                  description: 'Client visit — Riyadh to Jeddah',
                  amount: 1850,
                  date: new Date().toISOString().slice(0, 10),
                })
              }
            >
              <Plus className="size-3.5" /> {self ? 'New claim' : 'Add claim'}
            </Button>
          </>
        }
      />

      {!self ? (
        <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {[
            { label: 'Total claimed', value: formatSAR(summary?.total ?? 0, locale, { compact: true }) },
            { label: 'Awaiting review', value: `${summary?.awaiting ?? 0}` },
            { label: 'To reimburse', value: formatSAR(summary?.awaitingValue ?? 0, locale, { compact: true }) },
            { label: 'Reimbursed YTD', value: formatSAR(summary?.reimbursed ?? 0, locale, { compact: true }) },
          ].map((stat) => (
            <Card key={stat.label} className="p-3.5">
              <p className="text-[10.5px] text-ink-3">{stat.label}</p>
              <p className="num mt-1 text-[19px] font-semibold leading-none text-ink">{stat.value}</p>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search claims…" icon={<Search />} className="h-8 max-w-xs text-[11.5px]" />
        <NativeSelect value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-8 w-auto text-[11.5px]">
          <option value="all">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="reimbursed">Reimbursed</option>
          <option value="rejected">Rejected</option>
        </NativeSelect>
        <span className="ms-auto text-[10.5px] text-ink-4">{rows.length} claims</span>
      </div>

      <Card flush>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-line bg-surface-2">
                {['Claim', self ? 'Category' : 'Employee', 'Date', 'Amount', 'Receipt', 'Status', ''].map((heading) => (
                  <th key={heading} className="px-3 py-2 text-start text-[9.5px] font-semibold uppercase tracking-wide text-ink-4">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading
                ? Array.from({ length: 8 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={7} className="p-1.5">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))
                : rows.map((claim: ExpenseClaim) => {
                    const employee = getEmployee(claim.employeeId);
                    return (
                      <tr key={claim.id} className="hover:bg-surface-2">
                        <td className="px-3 py-2">
                          <p className="truncate text-[11.5px] text-ink-2">{claim.description}</p>
                          <p className="truncate text-[9px] capitalize text-ink-4">{claim.category}</p>
                        </td>
                        <td className="px-3 py-2">
                          {self ? (
                            <span className="text-[11px] capitalize text-ink-3">{claim.category}</span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <Avatar name={displayName(employee!)} hue={employee?.avatarHue} size="xs" className="size-5 text-[7px]" />
                              <span className="truncate text-[11px] text-ink-3">{displayName(employee!)}</span>
                            </span>
                          )}
                        </td>
                        <td className="num px-3 py-2 text-[10.5px] text-ink-4">{formatDate(claim.date, 'd MMM yyyy', locale)}</td>
                        <td className="num px-3 py-2 text-[11.5px] font-medium text-ink">{formatSAR(claim.amount, locale)}</td>
                        <td className="px-3 py-2 text-[10px] text-ink-4">{claim.receiptName ?? <span className="text-danger">Missing</span>}</td>
                        <td className="px-3 py-2">
                          <Badge tone={STATUS_TONE[claim.status]} dot>
                            {claim.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-end">
                          {!self && claim.status === 'submitted' ? (
                            <span className="inline-flex gap-1">
                              <Button size="icon-sm" variant="ghost" aria-label="Approve" onClick={() => decide.mutate({ id: claim.id, status: 'approved' })}>
                                <Check className="size-3.5 text-success" />
                              </Button>
                              <Button size="icon-sm" variant="ghost" aria-label="Reject" onClick={() => decide.mutate({ id: claim.id, status: 'rejected' })}>
                                <X className="size-3.5 text-danger" />
                              </Button>
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
        {!isLoading && rows.length === 0 ? <EmptyState title="No claims" description="Nothing matches those filters." /> : null}
        <div className="border-t border-line bg-surface-2 px-3 py-2 text-[10.5px] text-ink-4">{rows.length} claims shown</div>
      </Card>

      <PageFooter note="Reimbursements settle with the next payroll run." right="VAT on expenses is recoverable where a compliant invoice exists" />
    </>
  );
}
