import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Banknote, Download, Receipt, TrendingUp, Wallet } from 'lucide-react';
import { useAnalytics } from '@/lib/hooks';
import { expenseSummary } from '@/services/expenses';
import { invoiceSummary } from '@/services/invoices';
import { db } from '@/lib/mock/db';
import { useUIStore } from '@/stores/ui';
import { formatNumber, formatSAR, pctChange } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeading } from '@/components/ui/card';
import { Badge, Delta } from '@/components/ui/misc';
import { AreaTrend, ChartCard, DonutChart, HorizontalBars } from '@/components/charts/primitives';
import { useChartPalette } from '@/components/charts/theme';
import { methodology } from '@/lib/copy';
import { MethodologyNote, PageFooter, PageHeader } from '@/modules/shell/PageHeader';

export default function FinanceOverview() {
  const locale = useUIStore((s) => s.locale);
  const palette = useChartPalette();
  const { data: analytics } = useAnalytics();
  const { data: expenses } = useQuery({ queryKey: ['expense-summary'], queryFn: expenseSummary });
  const { data: invoices } = useQuery({ queryKey: ['invoice-summary'], queryFn: invoiceSummary });

  const run = db.payrollRuns[db.payrollRuns.length - 1]!;
  const previousRun = db.payrollRuns[db.payrollRuns.length - 2]!;

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Finance overview"
        description="Payroll, expenses and invoicing in one view — reconciled to the ledger at every close."
        actions={
          <>
            <Button variant="secondary" size="sm">
              <Download className="size-3.5" /> Export
            </Button>
            <Button variant="primary" size="sm" asChild>
              <Link to="/finance/payroll">
                <Wallet className="size-3.5" /> October payroll
              </Link>
            </Button>
          </>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          { label: 'Gross payroll', value: formatSAR(run.gross, locale, { compact: true }), delta: pctChange(run.gross, previousRun.gross), hint: `${run.headcount} employees`, icon: Wallet },
          { label: 'Expenses to reimburse', value: formatSAR(expenses?.awaitingValue ?? 0, locale, { compact: true }), delta: -6.2, hint: `${expenses?.awaiting ?? 0} claims pending`, icon: Banknote },
          { label: 'Invoices outstanding', value: formatSAR(invoices?.outstandingValue ?? 0, locale, { compact: true }), delta: 8.4, hint: `${invoices?.pendingZatca ?? 0} awaiting ZATCA`, icon: Receipt },
          { label: 'VAT collected', value: formatSAR(invoices?.vatCollected ?? 0, locale, { compact: true }), delta: 11.3, hint: 'last 12 months', icon: TrendingUp },
        ].map((stat) => (
          <Card key={stat.label} className="p-3.5">
            <div className="flex items-start justify-between">
              <p className="text-[10.5px] text-ink-3">{stat.label}</p>
              <stat.icon className="size-3.5 text-ink-4" />
            </div>
            <div className="mt-1 flex items-end justify-between">
              <p className="num text-[19px] font-semibold leading-none text-ink">{stat.value}</p>
              <Delta value={stat.delta} />
            </div>
            <p className="mt-1 truncate text-[9.5px] text-ink-4">{stat.hint}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <ChartCard
          title="Payroll cost trend"
          description="Gross and net in SAR thousands."
          className="lg:col-span-2"
          legend={[
            { label: 'Gross', color: palette.series[0]! },
            { label: 'Net', color: palette.series[3]! },
          ]}
          bodyClassName="px-2"
          footer={`Run-rate is ${formatSAR((analytics?.payrollCost.value ?? 0) * 12, locale, { compact: true })} annualised.`}
        >
          <AreaTrend
            data={analytics?.payrollTrend ?? []}
            xKey="label"
            series={[
              { key: 'gross', label: 'Gross', color: palette.series[0]! },
              { key: 'net', label: 'Net', color: palette.series[3]! },
            ]}
            height={218}
            formatter={(value) => `SAR ${formatNumber(value)}k`}
          />
        </ChartCard>

        <Card>
          <CardHeading title="Month-end checklist" description="Before the WPS deadline." />
          <div className="flex flex-col gap-2 px-5 pb-5">
            {[
              ['Payroll register reviewed', true],
              ['Overtime signed off', true],
              ['GOSI file generated', true],
              ['WPS file submitted to bank', Boolean(run.wpsSubmitted)],
              ['ZATCA invoices cleared', false],
            ].map(([label, done]) => (
              <div key={String(label)} className="flex items-center gap-2">
                <span className={`grid size-4 shrink-0 place-items-center rounded-full ${done ? 'bg-success-soft text-success' : 'border border-line-strong text-transparent'}`}>
                  <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m2.5 6 2.5 2.5L9.5 4" />
                  </svg>
                </span>
                <span className={`text-[10.5px] ${done ? 'text-ink-3 line-through' : 'text-ink-2'}`}>{label}</span>
              </div>
            ))}
            <div className="mt-1 rounded-md bg-warning-soft px-2.5 py-1.5 text-[10px] text-warning">WPS closes 27 Oct · 3 days remaining</div>
          </div>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <ChartCard title="Expenses by category" description="Submitted and reimbursed." bodyClassName="px-3 pt-2">
          <HorizontalBars
            data={(expenses?.byCategory ?? []).map((entry, index) => ({
              label: entry.label,
              value: Math.round(entry.value),
              color: palette.series[index % palette.series.length],
            }))}
            formatter={(value) => formatSAR(value, locale, { compact: true })}
          />
        </ChartCard>

        <ChartCard title="Invoice status" description="Where receivables sit today." bodyClassName="px-3">
          <DonutChart
            data={[
              { label: 'Paid', value: db.invoices.filter((invoice) => invoice.status === 'paid').length, color: palette.accent },
              { label: 'Sent', value: db.invoices.filter((invoice) => invoice.status === 'sent').length, color: palette.series[4] },
              { label: 'Overdue', value: db.invoices.filter((invoice) => invoice.status === 'overdue').length, color: palette.danger },
              { label: 'Draft', value: db.invoices.filter((invoice) => invoice.status === 'draft').length, color: palette.series[7] },
            ]}
            centerValue={formatSAR(invoices?.outstandingValue ?? 0, locale, { compact: true })}
            centerLabel="Outstanding"
            height={186}
            formatter={(value) => `${value} invoices`}
          />
        </ChartCard>

        <Card>
          <CardHeading
            title="Obligations"
            description="Next 30 days."
            action={
              <Button variant="ghost" size="xs" asChild>
                <Link to="/finance/compliance">
                  Detail <ArrowUpRight className="size-3" />
                </Link>
              </Button>
            }
          />
          <div className="flex flex-col gap-2 px-5 pb-5">
            {[
              ['WPS submission', '27 Oct 2026', formatSAR(run.gross, locale, { compact: true }), 'warning'],
              ['GOSI contribution', '15 Nov 2026', formatSAR(run.gosiEmployer, locale, { compact: true }), 'neutral'],
              ['ZATCA VAT return', '30 Nov 2026', formatSAR(Math.round((invoices?.vatCollected ?? 0) / 4), locale, { compact: true }), 'neutral'],
            ].map(([label, date, amount, tone]) => (
              <div key={String(label)} className="flex items-center justify-between border-b border-line pb-2 last:border-0">
                <div className="min-w-0">
                  <p className="truncate text-[11px] text-ink-2">{label}</p>
                  <p className="num text-[9.5px] text-ink-4">{date}</p>
                </div>
                <Badge tone={tone as 'warning' | 'neutral'}>{amount}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <MethodologyNote>{methodology.payroll}</MethodologyNote>
      <PageFooter note="Figures reconcile to the general ledger." right="Preview workspace — no payment is executed" />
    </>
  );
}
