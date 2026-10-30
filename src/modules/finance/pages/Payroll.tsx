import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Download, FileSpreadsheet, Landmark, Play, Upload } from 'lucide-react';
import { approveRun, listPayrollRuns, payrollRegister, submitWps } from '@/services/payroll';
import { exportTable, payrollRegisterReport } from '@/services/reports';
import { displayName } from '@/lib/mock/db';
import { useUIStore } from '@/stores/ui';
import { cn, formatDate, formatSAR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeading } from '@/components/ui/card';
import { Avatar, Badge, Skeleton } from '@/components/ui/misc';
import { PageFooter, PageHeader } from '@/modules/shell/PageHeader';
import { methodology } from '@/lib/copy';
import { MethodologyNote } from '@/modules/shell/PageHeader';
import { toast } from '@/components/ui/toast';

const STATUS_TONE = { draft: 'neutral', review: 'warning', approved: 'info', paid: 'success' } as const;

export default function Payroll() {
  const locale = useUIStore((s) => s.locale);
  const queryClient = useQueryClient();
  const { data: runs } = useQuery({ queryKey: ['payroll-runs'], queryFn: listPayrollRuns });
  const [selected, setSelected] = React.useState<string | null>(null);

  const current = selected ?? runs?.[0]?.id;
  const { data: register, isLoading } = useQuery({
    queryKey: ['payroll-register', current],
    queryFn: () => payrollRegister(current!),
    enabled: Boolean(current),
  });

  const approve = useMutation({
    mutationFn: (id: string) => approveRun(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      toast.success('Payroll run approved');
    },
  });

  const wps = useMutation({
    mutationFn: (id: string) => submitWps(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      toast.success('WPS file generated and marked as submitted');
    },
  });

  const run = runs?.find((item) => item.id === current);
  const totalGross = register?.reduce((sum, row) => sum + row.gross, 0) ?? 0;
  const totalNet = register?.reduce((sum, row) => sum + row.net, 0) ?? 0;
  const totalGosi = register?.reduce((sum, row) => sum + row.gosi, 0) ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Money · Payroll"
        title="Payroll"
        description="Prepare, approve and submit. The WPS file goes straight to the bank portal."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => exportTable(payrollRegisterReport(), 'xlsx')}>
              <FileSpreadsheet className="size-3.5" /> Register
            </Button>
            <Button variant="primary" size="sm" disabled={!run || run.status === 'paid'} loading={approve.isPending} onClick={() => run && approve.mutate(run.id)}>
              <CheckCircle2 className="size-3.5" /> Approve run
            </Button>
          </>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          { label: 'Headcount', value: run?.headcount ?? 0 },
          { label: 'Gross', value: formatSAR(run?.gross ?? 0, locale, { compact: true }) },
          { label: 'Deductions', value: formatSAR(run?.deductions ?? 0, locale, { compact: true }) },
          { label: 'Net payable', value: formatSAR(run?.net ?? 0, locale, { compact: true }) },
        ].map((stat) => (
          <Card key={stat.label} className="p-3.5">
            <p className="text-[10.5px] text-ink-3">{stat.label}</p>
            <p className="num mt-1 text-[19px] font-semibold leading-none text-ink">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <Card flush>
          <CardHeading title="Runs" description="Thirteen periods." />
          <div className="max-h-[26rem] overflow-y-auto">
            {runs?.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item.id)}
                className={cn(
                  'flex w-full items-center gap-2 border-b border-line px-3 py-2 text-start transition-colors last:border-0 hover:bg-surface-2',
                  item.id === current && 'bg-primary-soft/50',
                )}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded bg-surface-3 text-ink-4">
                  <Landmark className="size-3" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="num block text-[11px] font-medium text-ink">{item.period}</span>
                  <span className="block text-[9px] text-ink-4">{formatSAR(item.net, locale, { compact: true })} net</span>
                </span>
                <Badge tone={STATUS_TONE[item.status]}>{item.status}</Badge>
              </button>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-3 lg:col-span-3">
          <Card>
            <CardHeading
              title={`Register · ${run?.period ?? ''}`}
              description="Every employee in the run with bank routing."
              action={
                <div className="flex items-center gap-1.5">
                  <Button variant="secondary" size="xs" onClick={() => exportTable(payrollRegisterReport(), 'csv')}>
                    <Download className="size-3" /> CSV
                  </Button>
                  <Button variant="secondary" size="xs" loading={wps.isPending} disabled={!run} onClick={() => run && wps.mutate(run.id)}>
                    <Upload className="size-3" /> Submit WPS
                  </Button>
                </div>
              }
            />
            <div className="max-h-[22rem] overflow-auto">
              <table className="w-full min-w-[680px]">
                <thead className="sticky top-0 z-10">
                  <tr className="border-y border-line bg-surface-2">
                    {['Employee', 'Bank', 'IBAN', 'Gross', 'GOSI', 'Net'].map((heading) => (
                      <th key={heading} className="px-3 py-1.5 text-start text-[9.5px] font-semibold uppercase tracking-wide text-ink-4">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {isLoading
                    ? Array.from({ length: 6 }).map((_, index) => (
                        <tr key={index}>
                          <td colSpan={6} className="p-1.5">
                            <Skeleton className="h-6 w-full" />
                          </td>
                        </tr>
                      ))
                    : register?.slice(0, 60).map((row) => (
                        <tr key={row.employee.id} className="hover:bg-surface-2">
                          <td className="px-3 py-1.5">
                            <span className="flex items-center gap-2">
                              <Avatar name={displayName(row.employee)} hue={row.employee.avatarHue} size="xs" className="size-5 text-[7px]" />
                              <span className="truncate text-[11px] text-ink-2">{displayName(row.employee)}</span>
                            </span>
                          </td>
                          <td className="px-3 py-1.5 text-[10.5px] text-ink-4">{row.bank}</td>
                          <td className="num px-3 py-1.5 text-[10px] text-ink-4">{row.iban.slice(0, 4)}••••{row.iban.slice(-4)}</td>
                          <td className="num px-3 py-1.5 text-[11px] text-ink-2">{formatSAR(row.gross, locale)}</td>
                          <td className="num px-3 py-1.5 text-[11px] text-ink-3">{formatSAR(row.gosi, locale)}</td>
                          <td className="num px-3 py-1.5 text-[11px] font-medium text-ink">{formatSAR(row.net, locale)}</td>
                        </tr>
                      ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-line bg-surface-2 text-[11px] font-semibold">
                    <td className="px-3 py-2" colSpan={3}>
                      Totals · {register?.length ?? 0} employees
                    </td>
                    <td className="num px-3 py-2 text-ink">{formatSAR(totalGross, locale, { compact: true })}</td>
                    <td className="num px-3 py-2 text-ink-3">{formatSAR(totalGosi, locale, { compact: true })}</td>
                    <td className="num px-3 py-2 text-ink">{formatSAR(totalNet, locale, { compact: true })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {[
              ['Due date', run ? formatDate(run.dueDate, 'd MMM yyyy', locale) : '—'],
              ['WPS file', run?.wpsSubmitted ? 'Submitted' : 'Not submitted'],
              ['Employer GOSI', formatSAR(run?.gosiEmployer ?? 0, locale, { compact: true })],
            ].map(([label, value]) => (
              <Card key={label} className="p-3">
                <p className="text-[9.5px] uppercase tracking-wide text-ink-4">{label}</p>
                <p className="mt-1 text-[12px] font-medium text-ink">{value}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <MethodologyNote>{methodology.payroll}</MethodologyNote>
      <PageFooter note="Approval is irreversible once submitted." right={<span className="inline-flex items-center gap-1"><Play className="size-2.5" /> Sandbox — no payment executed</span>} />
    </>
  );
}
