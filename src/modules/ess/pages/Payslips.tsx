import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Printer, Receipt } from 'lucide-react';
import { payslipsFor } from '@/services/payroll';
import { db, displayName, getEmployee } from '@/lib/mock/db';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { cn, formatDate, formatSAR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeading } from '@/components/ui/card';
import { Badge, EmptyState } from '@/components/ui/misc';
import { PageFooter, PageHeader } from '@/modules/shell/PageHeader';

export default function Payslips() {
  const locale = useUIStore((s) => s.locale);
  const session = useAuthStore((s) => s.session);
  const employeeId = session?.employeeId ?? db.employees[0]!.id;
  const employee = getEmployee(employeeId);
  const { data: slips } = useQuery({ queryKey: ['my-payslips', employeeId], queryFn: () => payslipsFor(employeeId) });
  const [selected, setSelected] = React.useState(0);

  const current = slips?.[selected];
  const departments = db.departments.find((dept) => dept.id === employee?.departmentId);

  return (
    <>
      <PageHeader
        eyebrow="My workspace"
        title="Payslips"
        description="Every payslip is generated from the payroll run and archived for seven years."
        actions={
          <>
            <Button variant="secondary" size="sm">
              <Printer className="size-3.5" /> Print
            </Button>
            <Button variant="primary" size="sm">
              <Download className="size-3.5" /> Download PDF
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card flush>
          <CardHeading title="History" description={`${slips?.length ?? 0} payslips archived.`} />
          <div className="max-h-[30rem] overflow-y-auto">
            {slips?.map((slip, index) => (
              <button
                key={slip.id}
                onClick={() => setSelected(index)}
                className={cn(
                  'flex w-full items-center gap-2 border-b border-line px-4 py-2.5 text-start transition-colors last:border-0 hover:bg-surface-2',
                  index === selected && 'bg-primary-soft/50',
                )}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded bg-surface-3 text-ink-4">
                  <Receipt className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11.5px] font-medium text-ink">{formatDate(`${slip.period}-01`, 'MMMM yyyy', locale)}</span>
                  <span className="block text-[9.5px] text-ink-4">Net {formatSAR(slip.net, locale)}</span>
                </span>
                <Badge tone={slip.status === 'paid' ? 'success' : 'info'}>{slip.status}</Badge>
              </button>
            ))}
            {!slips?.length ? <EmptyState title="No payslips" description="Your first payslip appears after the next payroll run." /> : null}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          {current && employee ? (
            <>
              <div className="flex items-start justify-between border-b border-line px-5 py-4">
                <div>
                  <h3 className="font-display text-[15px] font-bold tracking-tight text-ink">Payslip · {formatDate(`${current.period}-01`, 'MMMM yyyy', locale)}</h3>
                  <p className="mt-0.5 text-[10.5px] text-ink-4">
                    {displayName(employee)} · {employee.employeeNo} · {departments?.name}
                  </p>
                </div>
                <Badge tone={current.status === 'paid' ? 'success' : 'info'} dot>
                  {current.status}
                </Badge>
              </div>

              <div className="px-5 py-4">
                <div className="mb-3 grid grid-cols-3 gap-2">
                  {[
                    ['Gross', current.gross],
                    ['Deductions', -current.deductions],
                    ['Net pay', current.net],
                  ].map(([label, value], index) => (
                    <div key={label as string} className={cn('rounded-md border p-2.5', index === 2 ? 'border-accent/30 bg-accent-soft' : 'border-line bg-surface-2')}>
                      <p className="text-[9.5px] uppercase tracking-wide text-ink-4">{label}</p>
                      <p className="num mt-1 text-[14px] font-semibold text-ink">{formatSAR(Number(value), locale)}</p>
                    </div>
                  ))}
                </div>

                <table className="w-full">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="py-1.5 text-start text-[9.5px] font-semibold uppercase tracking-wide text-ink-4">Line</th>
                      <th className="py-1.5 text-end text-[9.5px] font-semibold uppercase tracking-wide text-ink-4">Amount (SAR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {current.lines.map((line) => (
                      <tr key={line.label}>
                        <td className="py-1.5 text-[11.5px] text-ink-2">
                          {locale === 'ar' ? line.labelAr : line.label}
                          {line.kind === 'employer' ? <span className="ms-1.5 text-[9px] text-ink-4">(employer)</span> : null}
                        </td>
                        <td className={cn('num py-1.5 text-end text-[11.5px]', line.kind === 'deduction' ? 'text-danger' : line.kind === 'employer' ? 'text-ink-4' : 'text-ink-2')}>
                          {formatSAR(line.amount, locale, { decimals: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-3 flex items-center justify-between rounded-md bg-ink px-3 py-2.5 text-ink-inverse">
                  <span className="text-[11px]">Net pay transferred</span>
                  <span className="num text-[15px] font-semibold">{formatSAR(current.net, locale, { decimals: 2 })}</span>
                </div>

                <p className="mt-2 text-[9.5px] leading-relaxed text-ink-4">
                  Paid to {employee.bankName} · {employee.iban.slice(0, 2)}••••{employee.iban.slice(-4)} · GOSI contribution {formatSAR(current.deductions, locale)}. Employer GOSI is shown for transparency and is not deducted from net pay.
                </p>
              </div>
            </>
          ) : (
            <EmptyState title="Select a payslip" description="Choose a period from the list." icon={<FileText className="size-5" />} />
          )}
        </Card>
      </div>

      <PageFooter note="Payslips are immutable once issued." right="Disputes must be raised within 30 days" />
    </>
  );
}
