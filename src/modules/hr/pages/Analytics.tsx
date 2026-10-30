import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useAnalytics } from '@/lib/hooks';
import { flightRiskRegister } from '@/services/analytics';
import { exportTable, leaveRegisterReport } from '@/services/reports';
import { db, displayName } from '@/lib/mock/db';
import { useUIStore } from '@/stores/ui';
import { formatNumber, formatPercent, formatSAR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeading } from '@/components/ui/card';
import { Avatar, Badge, Delta, Progress, Skeleton } from '@/components/ui/misc';
import { Segmented } from '@/components/ui/misc';
import {
  AreaTrend,
  BarCompare,
  ChartCard,
  DonutChart,
  HorizontalBars,
  LineTrend,
} from '@/components/charts/primitives';
import { useChartPalette } from '@/components/charts/theme';
import { methodology } from '@/lib/copy';
import { MethodologyNote, PageFooter, PageHeader } from '@/modules/shell/PageHeader';

export default function Analytics() {
  const locale = useUIStore((s) => s.locale);
  const palette = useChartPalette();
  const [period, setPeriod] = React.useState<'6m' | '12m'>('12m');
  const { data: analytics, isLoading } = useAnalytics();
  const { data: risky } = useQuery({ queryKey: ['flight-risk'], queryFn: flightRiskRegister });

  if (isLoading || !analytics) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const slice = (rows: typeof analytics.headcountTrend) => (period === '6m' ? rows.slice(-6) : rows);
  const totalHeadcount = analytics.headcount.value;

  return (
    <>
      <PageHeader
        eyebrow="People intelligence"
        title="Workforce analytics"
        description="Every number traces back to a record. Export anything you see to CSV, Excel or PDF."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => exportTable(leaveRegisterReport(), 'csv')}>
              <Download className="size-3.5" /> CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={() => exportTable(leaveRegisterReport(), 'xlsx')}>
              <FileSpreadsheet className="size-3.5" /> Excel
            </Button>
            <Button variant="primary" size="sm">
              <FileText className="size-3.5" /> Board pack
            </Button>
          </>
        }
        tabs={
          <div className="flex items-center gap-2 border-b border-line pb-1.5">
            <Segmented
              value={period}
              onChange={setPeriod}
              options={[
                { value: '6m', label: 'Last 6 months' },
                { value: '12m', label: 'Last 12 months' },
              ]}
            />
            <span className="ms-auto text-[10px] text-ink-4">Figures reconcile to the HRIS on every load</span>
          </div>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          { label: 'Headcount', value: formatNumber(analytics.headcount.value, locale), delta: 12.4, hint: 'year over year' },
          { label: 'Attrition', value: formatPercent(analytics.turnover.value, locale), delta: -2.1, hint: 'points improved', invert: true },
          { label: 'Engagement', value: `${analytics.engagement.value.toFixed(1)} / 10`, delta: 0.6, hint: 'this quarter' },
          { label: 'Payroll run rate', value: formatSAR(analytics.payrollCost.value * 12, locale, { compact: true }), delta: 4.2, hint: 'annualised gross' },
        ].map((stat) => (
          <Card key={stat.label} className="p-3.5">
            <p className="text-[10.5px] text-ink-3">{stat.label}</p>
            <div className="mt-1 flex items-end justify-between">
              <p className="num text-[21px] font-semibold leading-none text-ink">{stat.value}</p>
              <span className="flex items-center gap-1">
                <Delta value={stat.delta} invert={stat.invert} />
              </span>
            </div>
            <p className="mt-1 text-[9.5px] text-ink-4">{stat.hint}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <ChartCard
          title="Headcount trajectory"
          description="Net change after hires and exits."
          className="lg:col-span-2"
          legend={[{ label: 'Headcount', color: palette.series[0]! }]}
          bodyClassName="px-2"
          footer={`Started the period at ${formatNumber(Number(slice(analytics.headcountTrend)[0]?.headcount ?? 0))} and closed at ${formatNumber(totalHeadcount)}.`}
        >
          <AreaTrend
            data={slice(analytics.headcountTrend)}
            xKey="label"
            series={[{ key: 'headcount', label: 'Headcount', color: palette.series[0]! }]}
            height={224}
            formatter={(value) => `${formatNumber(value)} people`}
          />
        </ChartCard>

        <ChartCard title="Where people work" description="Headcount by city." bodyClassName="px-3 pt-2">
          <HorizontalBars
            data={analytics.byLocation.map((location, index) => ({
              label: location.label,
              value: location.value,
              color: palette.series[index % palette.series.length],
              suffix: `${Math.round((location.value / Math.max(1, totalHeadcount)) * 100)}%`,
            }))}
          />
        </ChartCard>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <ChartCard title="Tenure distribution" description="Years at the company." bodyClassName="px-2">
          <BarCompare data={analytics.byTenure} xKey="label" series={[{ key: 'value', label: 'Employees', color: palette.series[2]! }]} height={186} />
        </ChartCard>

        <ChartCard title="Age profile" description="Four generational cohorts." bodyClassName="px-2">
          <BarCompare data={analytics.byAge} xKey="label" series={[{ key: 'value', label: 'Employees', color: palette.series[4]! }]} height={186} />
        </ChartCard>

        <ChartCard title="Gender balance" description="Company-wide split." bodyClassName="px-3">
          <DonutChart
            data={analytics.byGender.map((entry, index) => ({ ...entry, color: palette.series[index === 0 ? 0 : 3] }))}
            centerValue={formatNumber(totalHeadcount)}
            centerLabel="Employees"
            height={186}
            formatter={(value, name) => `${value} ${name.toLowerCase()}`}
          />
        </ChartCard>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartCard title="Turnover trend" description="Annualised attrition per month." bodyClassName="px-2">
          <LineTrend data={analytics.turnoverTrend} xKey="label" series={[{ key: 'turnover', label: 'Turnover', color: palette.series[0]! }]} height={200} />
        </ChartCard>

        <ChartCard title="Hiring momentum" description="Monthly joiners and leavers." bodyClassName="px-2" legend={[{ label: 'Hires', color: palette.series[2]! }, { label: 'Exits', color: palette.danger }]}>
          <BarCompare
            data={slice(analytics.movementTrend)}
            xKey="label"
            series={[
              { key: 'hires', label: 'Hires', color: palette.series[2]! },
              { key: 'exits', label: 'Exits', color: palette.danger },
            ]}
            height={200}
          />
        </ChartCard>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeading title="Voluntary attrition drivers" description="Exit interview themes, last 12 months." />
          <div className="px-5 pb-5">
            {analytics.attritionReasons.map((reason) => {
              const total = analytics.attritionReasons.reduce((sum, item) => sum + item.value, 0) || 1;
              return (
                <div key={reason.label} className="mb-2.5 last:mb-0">
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="text-ink-2">{reason.label}</span>
                    <span className="num text-ink-3">
                      {reason.value} <span className="text-ink-4">({Math.round((reason.value / total) * 100)}%)</span>
                    </span>
                  </div>
                  <Progress value={(reason.value / total) * 100} tone="primary" height="h-1.5" />
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeading title="Flight risk register" description="Highest predicted attrition risk." />
          <div className="flex flex-col px-5 pb-5">
            {risky?.slice(0, 6).map((employee) => (
              <div key={employee.id} className="flex items-center gap-2 border-b border-line py-1.5 last:border-0">
                <Avatar name={displayName(employee)} hue={employee.avatarHue} size="xs" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-medium text-ink">{displayName(employee)}</span>
                  <span className="block truncate text-[9px] text-ink-4">{employee.jobTitle}</span>
                </span>
                <Badge tone={employee.flightRisk === 'high' ? 'danger' : 'warning'}>{employee.engagement.toFixed(1)}</Badge>
              </div>
            ))}
            <p className="pt-2 text-[9.5px] text-ink-4">Scored nightly from engagement, tenure and review history.</p>
          </div>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartCard title="Payroll cost" description="Gross versus net, SAR thousands." bodyClassName="px-2" legend={[{ label: 'Gross', color: palette.series[0]! }, { label: 'Net', color: palette.series[3]! }]}>
          <AreaTrend
            data={analytics.payrollTrend}
            xKey="label"
            series={[
              { key: 'gross', label: 'Gross', color: palette.series[0]! },
              { key: 'net', label: 'Net', color: palette.series[3]! },
            ]}
            height={200}
            formatter={(value) => `SAR ${formatNumber(value)}k`}
          />
        </ChartCard>

        <ChartCard title="Department share" description={`${db.departments.length} departments.`} bodyClassName="px-3">
          <DonutChart
            data={analytics.byDepartment.map((dept, index) => ({ label: dept.label, value: dept.value, color: palette.series[index % palette.series.length] }))}
            centerValue={formatNumber(totalHeadcount)}
            centerLabel="Employees"
            height={200}
            formatter={(value) => `${value} people`}
          />
          <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
            {analytics.byDepartment.map((dept, index) => (
              <div key={dept.id} className="flex items-center gap-1.5 text-[10px] text-ink-3">
                <span className="size-1.5 shrink-0 rounded-full" style={{ background: palette.series[index % palette.series.length] }} />
                <span className="truncate">{dept.label}</span>
                <span className="num ms-auto text-ink-2">{dept.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <MethodologyNote>{methodology.turnover} {methodology.headcount}</MethodologyNote>
      <PageFooter note="Analytics recompute on every load." right="Exports respect the active filters" />
    </>
  );
}
