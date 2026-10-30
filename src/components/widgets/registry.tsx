import * as React from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Cake,
  CalendarDays,
  CircleDollarSign,
  Clock4,
  Compass,
  Flame,
  Globe2,
  Goal,
  GraduationCap,
  HeartPulse,
  Landmark,
  Layers,
  MapPin,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import type { AnalyticsSnapshot, Locale } from '@/types';
import { Avatar, Badge, Delta, EmptyState, Progress } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/charts/kpi-card';
import {
  AreaTrend,
  BarCompare,
  ChartCard,
  DonutChart,
  HeatStrip,
  HorizontalBars,
  LineTrend,
  RadialGauge,
} from '@/components/charts/primitives';
import type { ChartPalette } from '@/components/charts/theme';
import { db, displayName, getEmployee } from '@/lib/mock/db';
import { formatDate, formatNumber, formatSAR, relativeTime } from '@/lib/utils';

export interface WidgetContext {
  analytics: AnalyticsSnapshot;
  /** Resolved chart palette, computed once by the dashboard host. */
  palette: ChartPalette;
  locale: Locale;
  navigate: (path: string) => void;
  departmentFilter: string;
}

export interface WidgetDefinition {
  id: string;
  title: string;
  description: string;
  category: 'kpi' | 'chart' | 'list' | 'table' | 'insight';
  span: 1 | 2 | 3 | 4;
render: (ctx: WidgetContext) => React.ReactNode;
}

const activeEmployees = () => db.employees.filter((e) => e.status !== 'terminated');

function departmentHealthRow(departmentId: string) {
  const people = activeEmployees().filter((e) => e.departmentId === departmentId);
  const engagement = people.length ? people.reduce((a, p) => a + p.engagement, 0) / people.length : 0;
  const goals = people.length ? (people.reduce((a, p) => a + p.performance.goalsCompleted / p.performance.goalsTotal, 0) / people.length) * 100 : 0;
  const highRisk = people.filter((p) => p.flightRisk === 'high').length;
  return {
    headcount: people.length,
    engagement,
    goals,
    health: highRisk > people.length * 0.16 ? 'watch' : 'healthy',
  };
}

export const WIDGETS: WidgetDefinition[] = [
  /* --------------------------------- KPI ---------------------------------- */
  {
    id: 'kpi-headcount',
    title: 'Total employees',
    description: 'Active headcount across all entities.',
    category: 'kpi',
    span: 1,
    render: ({ analytics }) => (
      <KpiCard
        label="Total employees"
        value={formatNumber(analytics.headcount.value)}
        delta={analytics.headcount.previous ? ((analytics.headcount.value - analytics.headcount.previous) / analytics.headcount.previous) * 100 : undefined}
        deltaLabel={analytics.headcount.deltaLabel}
        trend={analytics.headcount.trend}
        icon={<Users />}
        tone="primary"
        hint="Includes employees on probation and on leave. Excludes alumni and pending offers."
      />
    ),
  },
  {
    id: 'kpi-new-hires',
    title: 'New hires',
    description: 'Year-to-date joiners.',
    category: 'kpi',
    span: 1,
    render: ({ analytics }) => (
      <KpiCard
        label="New hires"
        value={formatNumber(analytics.newHires.value)}
        delta={analytics.newHires.previous ? ((analytics.newHires.value - analytics.newHires.previous) / analytics.newHires.previous) * 100 : undefined}
        deltaLabel="year to date"
        trend={analytics.newHires.trend}
        icon={<UserPlus />}
        tone="accent"
        hint="Counts contracts signed with a start date inside the current calendar year."
      />
    ),
  },
  {
    id: 'kpi-turnover',
    title: 'Employee turnover',
    description: 'Rolling annualised attrition.',
    category: 'kpi',
    span: 1,
    render: ({ analytics }) => (
      <KpiCard
        label="Employee turnover"
        value={analytics.turnover.value.toFixed(1)}
        unit="%"
        delta={analytics.turnover.value - (analytics.turnover.previous ?? analytics.turnover.value)}
        invertDelta
        deltaLabel={analytics.turnover.deltaLabel}
        trend={analytics.turnover.trend}
        icon={<TrendingDown />}
        tone="warning"
        hint="Exits divided by average headcount for the period. Voluntary and involuntary combined."
      />
    ),
  },
  {
    id: 'kpi-on-leave',
    title: 'On leave today',
    description: 'Approved absences in effect.',
    category: 'kpi',
    span: 1,
    render: ({ analytics }) => (
      <KpiCard
        label="On leave today"
        value={formatNumber(analytics.onLeave.value)}
        deltaLabel={analytics.onLeave.deltaLabel}
        trend={analytics.onLeave.trend}
        icon={<CalendarDays />}
        tone="info"
        hint="Approved requests where today falls between the start and end date."
      />
    ),
  },
  {
    id: 'kpi-engagement',
    title: 'Engagement',
    description: 'Average team engagement score.',
    category: 'kpi',
    span: 1,
    render: ({ analytics }) => (
      <KpiCard
        label="Engagement"
        value={analytics.engagement.value.toFixed(1)}
        unit="/ 10"
        delta={analytics.engagement.previous ? ((analytics.engagement.value - analytics.engagement.previous) / analytics.engagement.previous) * 100 : undefined}
        deltaLabel="vs. last quarter"
        trend={analytics.engagement.trend}
        icon={<HeartPulse />}
        tone="accent"
        hint="Average of the latest pulse survey. Scores below 7.0 raise a retention flag."
      />
    ),
  },
  {
    id: 'kpi-payroll-cost',
    title: 'Monthly payroll',
    description: 'Gross payroll for the current run.',
    category: 'kpi',
    span: 1,
    render: ({ analytics, locale }) => (
      <KpiCard
        label="Monthly payroll"
        value={formatSAR(analytics.payrollCost.value, locale, { compact: true })}
        delta={analytics.payrollCost.previous ? ((analytics.payrollCost.value - analytics.payrollCost.previous) / analytics.payrollCost.previous) * 100 : undefined}
        deltaLabel={analytics.payrollCost.deltaLabel}
        trend={analytics.payrollCost.trend}
        icon={<Wallet />}
        tone="primary"
        hint="Gross salaries and allowances before GOSI. Excludes employer contributions and end-of-service accrual."
      />
    ),
  },
  {
    id: 'kpi-absenteeism',
    title: 'Absenteeism',
    description: 'Share of scheduled days lost.',
    category: 'kpi',
    span: 1,
    render: ({ analytics }) => (
      <KpiCard
        label="Absenteeism"
        value={analytics.absenteeism.value.toFixed(1)}
        unit="%"
        delta={analytics.absenteeism.value - (analytics.absenteeism.previous ?? 0)}
        invertDelta
        deltaLabel="of scheduled days"
        trend={analytics.absenteeism.trend}
        icon={<Clock4 />}
        tone="warning"
        hint="Unapproved absence over scheduled working days. The Saudi workweek is Sunday to Thursday."
      />
    ),
  },
  {
    id: 'kpi-saudization',
    title: 'Saudization',
    description: 'Share of Saudi nationals.',
    category: 'kpi',
    span: 1,
    render: ({ analytics }) => {
      const total = analytics.headcount.value || 1;
      const saudis = activeEmployees().filter((e) => e.nationality === 'Saudi').length;
      return (
        <KpiCard
          label="Saudization"
          value={((saudis / total) * 100).toFixed(1)}
          unit="%"
          deltaLabel={`${saudis} of ${total} employees`}
          icon={<ShieldCheck />}
          tone="accent"
          hint="Nitaqat ratio used for the Platinum band. Calculated on active headcount."
          footer={
            <span className="flex items-center gap-1.5">
              <Badge tone="success" dot>
                Platinum band
              </Badge>
              <span>above the 40% target</span>
            </span>
          }
        />
      );
    },
  },

  /* -------------------------------- Charts -------------------------------- */
  {
    id: 'chart-headcount',
    title: 'Workforce growth',
    description: 'Headcount, hires and exits over the last 13 months.',
    category: 'chart',
    span: 3,
    render: ({ analytics, palette }) => {
        const rows = analytics.headcountTrend.map((point, index) => ({
        label: String(point.label),
        key: String(point.key ?? ''),
        headcount: Number(point.headcount ?? 0),
        hires: Number(analytics.movementTrend[index]?.hires ?? 0),
        exits: Number(analytics.movementTrend[index]?.exits ?? 0),
      }));
      const first = Number(rows[0]?.headcount ?? 0);
      const last = Number(rows[rows.length - 1]?.headcount ?? 0);
      return (
        <ChartCard
          title="Workforce growth"
          description="A growing team, built for what's next."
          legend={[
            { label: 'Headcount', color: palette.series[0]! },
            { label: 'Hires', color: palette.series[2]! },
            { label: 'Exits', color: palette.danger },
          ]}
          ariaLabel={`Headcount trend, ending at ${last} employees`}
          bodyClassName="px-2 pb-1"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                Jan – Oct 2026 · {last > first ? `+${last - first}` : last - first} net change
              </span>
              <span className="flex items-center gap-1 text-success">
                <TrendingUp className="size-3" /> {first ? (((last - first) / first) * 100).toFixed(1) : 0}% year to date
              </span>
            </div>
          }
        >
          <div className="mb-1 flex items-baseline gap-2 px-3 pt-1">
            <span className="num text-[22px] font-semibold leading-none text-ink">{formatNumber(last)}</span>
            <span className="text-[10.5px] text-ink-4">employees today</span>
          </div>
          <AreaTrend
            data={rows}
            xKey="label"
            height={196}
            series={[{ key: 'headcount', label: 'Headcount', color: palette.series[0]! }]}
            formatter={(value) => `${formatNumber(value)} employees`}
          />
        </ChartCard>
      );
    },
  },
  {
    id: 'chart-departments',
    title: 'People by department',
    description: 'Different strengths. One team.',
    category: 'chart',
    span: 1,
    render: ({ analytics, navigate, palette }) => {
        const total = analytics.byDepartment.reduce((a, d) => a + d.value, 0);
      return (
        <ChartCard
          title="People by department"
          description="Different strengths. One team."
          action={
            <Button variant="ghost" size="icon-sm" aria-label="Open analytics" onClick={() => navigate('/hr/analytics')}>
              <ArrowUpRight />
            </Button>
          }
          footer={`${analytics.byDepartment.length} departments · click a segment to filter`}
          bodyClassName="px-3"
        >
          <DonutChart
            data={analytics.byDepartment.map((d, i) => ({ label: d.label, value: d.value, color: palette.series[i % palette.series.length] }))}
            centerValue={total}
            centerLabel="Total people"
            height={168}
            innerRadius={50}
            outerRadius={70}
            formatter={(value) => `${value} people`}
          />
          <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1">
            {analytics.byDepartment.slice(0, 6).map((dept, index) => (
              <div key={dept.id} className="flex items-center gap-1.5 text-[10px] text-ink-3">
                <span className="size-1.5 shrink-0 rounded-full" style={{ background: palette.series[index % palette.series.length] }} />
                <span className="truncate">{dept.label}</span>
                <span className="num ms-auto font-medium text-ink-2">{dept.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      );
    },
  },
  {
    id: 'chart-movement',
    title: 'Hiring and exits',
    description: 'Monthly joiners versus leavers.',
    category: 'chart',
    span: 2,
    render: ({ analytics, palette }) => {
        return (
        <ChartCard
          title="Hiring and exits"
          description="Where the team is growing and where it is moving on."
          legend={[
            { label: 'Hires', color: palette.series[2]! },
            { label: 'Exits', color: palette.danger },
          ]}
          bodyClassName="px-2"
        >
          <BarCompare
            data={analytics.movementTrend}
            xKey="label"
            series={[
              { key: 'hires', label: 'Hires', color: palette.series[2]! },
              { key: 'exits', label: 'Exits', color: palette.danger },
            ]}
            height={190}
            formatter={(value, name) => `${value} ${name.toLowerCase()}`}
          />
        </ChartCard>
      );
    },
  },
  {
    id: 'chart-attrition-reasons',
    title: 'Why employees leave',
    description: 'Turn insights into better experiences.',
    category: 'chart',
    span: 1,
    render: ({ analytics, navigate }) => {
      const total = analytics.attritionReasons.reduce((a, r) => a + r.value, 0) || 1;
      return (
        <ChartCard
          title="Why employees leave"
          description="Exit interview themes."
          action={
            <Button variant="ghost" size="xs" onClick={() => navigate('/hr/analytics')}>
              Explore <ArrowRight className="size-3" />
            </Button>
          }
          footer="Based on exit interviews recorded in the last 12 months"
          bodyClassName="px-2 pt-1"
        >
          <HorizontalBars
            data={analytics.attritionReasons.slice(0, 5).map((reason) => ({
              label: reason.label,
              value: reason.value,
              suffix: `${Math.round((reason.value / total) * 100)}%`,
            }))}
            formatter={(value) => `${value}`}
          />
        </ChartCard>
      );
    },
  },
  {
    id: 'chart-turnover-trend',
    title: 'Turnover trend',
    description: 'Read as a rolling annualised rate.',
    category: 'chart',
    span: 2,
    render: ({ analytics, palette }) => {
        return (
        <ChartCard title="Turnover trend" description="Annualised attrition by month." bodyClassName="px-2">
          <LineTrend
            data={analytics.turnoverTrend}
            xKey="label"
            series={[{ key: 'turnover', label: 'Turnover', color: palette.series[0]! }]}
            height={186}
          />
        </ChartCard>
      );
    },
  },
  {
    id: 'chart-attendance',
    title: 'Attendance pattern',
    description: 'Remote, late and absent days.',
    category: 'chart',
    span: 2,
    render: ({ analytics, palette }) => {
        return (
        <ChartCard
          title="Attendance pattern"
          description="Hybrid work is holding steady across the last six months."
          legend={[
            { label: 'Remote', color: palette.series[2]! },
            { label: 'Late', color: palette.series[4]! },
            { label: 'Absent', color: palette.danger },
          ]}
          bodyClassName="px-2"
        >
          <BarCompare
            data={analytics.attendanceTrend}
            xKey="label"
            stacked
            series={[
              { key: 'remote', label: 'Remote', color: palette.series[2]! },
              { key: 'late', label: 'Late', color: palette.series[4]! },
              { key: 'absent', label: 'Absent', color: palette.danger },
            ]}
            height={186}
            formatter={(value, name) => `${value}% ${name.toLowerCase()}`}
          />
        </ChartCard>
      );
    },
  },
  {
    id: 'chart-payroll-cost',
    title: 'Payroll cost',
    description: 'Gross and net cost in thousands of riyals.',
    category: 'chart',
    span: 2,
    render: ({ analytics, palette }) => {
        return (
        <ChartCard
          title="Payroll cost"
          description="Twelve months of gross and net payroll, in SAR thousands."
          legend={[
            { label: 'Gross', color: palette.series[0]! },
            { label: 'Net', color: palette.series[3]! },
          ]}
          bodyClassName="px-2"
        >
          <AreaTrend
            data={analytics.payrollTrend}
            xKey="label"
            height={186}
            series={[
              { key: 'gross', label: 'Gross', color: palette.series[0]! },
              { key: 'net', label: 'Net', color: palette.series[3]! },
            ]}
            formatter={(value) => `SAR ${formatNumber(value)}k`}
          />
        </ChartCard>
      );
    },
  },
  {
    id: 'chart-tenure',
    title: 'Tenure mix',
    description: 'How long people stay.',
    category: 'chart',
    span: 1,
    render: ({ analytics, palette }) => {
        return (
        <ChartCard title="Tenure mix" description="Years of service." bodyClassName="px-2">
          <BarCompare
            data={analytics.byTenure}
            xKey="label"
            series={[{ key: 'value', label: 'Employees', color: palette.series[2]! }]}
            height={172}
            formatter={(value) => `${value} employees`}
          />
        </ChartCard>
      );
    },
  },
  {
    id: 'chart-locations',
    title: 'Headcount by location',
    description: 'Office footprint across the Kingdom.',
    category: 'chart',
    span: 1,
    render: ({ analytics, palette }) => {
        const total = analytics.byLocation.reduce((a, l) => a + l.value, 0) || 1;
      return (
        <ChartCard title="By location" description="Where the team works from." bodyClassName="px-2 pt-2">
          <HorizontalBars
            data={analytics.byLocation.map((location, index) => ({
              label: location.label,
              value: location.value,
              suffix: `${Math.round((location.value / total) * 100)}%`,
              color: palette.series[index % palette.series.length],
            }))}
          />
        </ChartCard>
      );
    },
  },
  {
    id: 'chart-gender',
    title: 'Gender balance',
    description: 'Company-wide split.',
    category: 'chart',
    span: 1,
    render: ({ analytics, palette }) => {
        const total = analytics.byGender.reduce((a, g) => a + g.value, 0);
      const female = analytics.byGender.find((g) => g.label === 'Female')?.value ?? 0;
      return (
        <ChartCard title="Gender balance" description="Company-wide split." bodyClassName="px-3">
          <DonutChart
            data={[
              { label: 'Female', value: female, color: palette.series[0]! },
              { label: 'Male', value: total - female, color: palette.series[3]! },
            ]}
            centerValue={`${Math.round((female / Math.max(1, total)) * 100)}%`}
            centerLabel="Female"
            height={150}
            innerRadius={44}
            outerRadius={62}
            formatter={(value) => `${value} employees`}
          />
          <div className="mt-1 flex justify-center gap-4 text-[10px] text-ink-4">
            <span className="inline-flex items-center gap-1">
              <i className="size-1.5 rounded-full" style={{ background: palette.series[0] }} /> Female {female}
            </span>
            <span className="inline-flex items-center gap-1">
              <i className="size-1.5 rounded-full" style={{ background: palette.series[3] }} /> Male {total - female}
            </span>
          </div>
        </ChartCard>
      );
    },
  },
  {
    id: 'chart-age',
    title: 'Age distribution',
    description: 'Generational mix.',
    category: 'chart',
    span: 1,
    render: ({ analytics, palette }) => {
        return (
        <ChartCard title="Age distribution" description="Generational mix." bodyClassName="px-2">
          <BarCompare
            data={analytics.byAge}
            xKey="label"
            series={[{ key: 'value', label: 'Employees', color: palette.series[4]! }]}
            height={150}
            formatter={(value) => `${value} employees`}
          />
        </ChartCard>
      );
    },
  },
  {
    id: 'chart-goals',
    title: 'Goal completion',
    description: 'Average completion by department.',
    category: 'chart',
    span: 2,
    render: ({ analytics, palette }) => {
        return (
        <ChartCard
          title="Goal completion by department"
          description="Against an 80% target for the H2 cycle."
          legend={[
            { label: 'Completion', color: palette.series[2]! },
            { label: 'Target', color: palette.series[7]! },
          ]}
          bodyClassName="px-2"
        >
          <BarCompare
            data={analytics.goalCompletion.map((row) => ({ ...row, label: row.department }))}
            xKey="label"
            series={[
              { key: 'value', label: 'Completion', color: palette.series[2]! },
              { key: 'target', label: 'Target', color: palette.series[7]! },
            ]}
            height={186}
            formatter={(value) => `${value}%`}
          />
        </ChartCard>
      );
    },
  },
  {
    id: 'chart-employment-type',
    title: 'Employment type',
    description: 'Contract mix.',
    category: 'chart',
    span: 1,
    render: ({ analytics, palette }) => {
        const total = analytics.byEmploymentType.reduce((a, t) => a + t.value, 0) || 1;
      return (
        <ChartCard title="Employment type" description="Contract mix." bodyClassName="px-2 pt-2">
          <div className="flex flex-col gap-2 px-1">
            {analytics.byEmploymentType.map((type, index) => (
              <div key={type.label}>
                <div className="mb-1 flex items-center justify-between text-[10.5px]">
                  <span className="text-ink-3">{type.label}</span>
                  <span className="num text-ink-2">{type.value}</span>
                </div>
                <Progress value={(type.value / total) * 100} tone={index === 0 ? 'primary' : index === 1 ? 'accent' : 'info'} />
              </div>
            ))}
          </div>
          <p className="mt-3 px-1 text-[10px] text-ink-4">{Math.round((analytics.byEmploymentType[0]!.value / total) * 100)}% of the team is on a permanent contract.</p>
          <span className="sr-only">{`${palette.series[0]}`}</span>
        </ChartCard>
      );
    },
  },

  /* --------------------------------- Lists -------------------------------- */
  {
    id: 'leave-balance',
    title: 'Room to recharge',
    description: 'Leave taken versus entitled.',
    category: 'list',
    span: 1,
    render: ({ analytics, navigate }) => {
      const total = activeEmployees();
      const taken = total.reduce((a, e) => a + e.leave.annualTaken, 0);
      const entitled = total.reduce((a, e) => a + e.leave.annualEntitlement, 0);
      const avgRemaining = Math.round(total.reduce((a, e) => a + (e.leave.annualEntitlement - e.leave.annualTaken), 0) / Math.max(1, total.length));
      return (
        <ChartCard
          title="Room to recharge"
          description="A healthy balance for a happier team."
          action={
            <Button variant="ghost" size="xs" onClick={() => navigate('/hr/leave')}>
              View leave
            </Button>
          }
          bodyClassName="px-5 pt-1"
          footer={
            <button className="flex w-full items-center gap-1.5 text-warning" onClick={() => navigate('/hr/leave?tab=pending')}>
              <span className="size-1.5 rounded-full bg-warning" />
              {db.leave.filter((r) => r.status === 'pending').length} requests need attention
              <ArrowRight className="ms-auto size-3" />
            </button>
          }
        >
          <div className="flex items-end gap-4 py-2">
            <div>
              <p className="num text-[23px] font-semibold leading-none text-ink">
                {formatNumber(analytics.onLeave.value)} <span className="text-[11px] font-normal text-ink-4">people</span>
              </p>
              <p className="mt-1 text-[10.5px] text-ink-3">On leave today</p>
            </div>
            <span className="mb-1 h-8 w-px bg-line" />
            <div>
              <p className="num text-[23px] font-semibold leading-none text-ink">
                {avgRemaining} <span className="text-[11px] font-normal text-ink-4">days</span>
              </p>
              <p className="mt-1 text-[10.5px] text-ink-3">Avg. remaining</p>
            </div>
          </div>
          <div className="pb-3">
            <div className="mb-1.5 flex items-center justify-between text-[10px]">
              <span className="text-ink-4">Annual entitlement used</span>
              <span className="num text-ink-2">{Math.round((taken / Math.max(1, entitled)) * 100)}%</span>
            </div>
            <Progress value={(taken / Math.max(1, entitled)) * 100} tone="accent" />
          </div>
        </ChartCard>
      );
    },
  },
  {
    id: 'upcoming-leave',
    title: 'Upcoming time off',
    description: 'A little planning goes a long way.',
    category: 'list',
    span: 1,
    render: ({ navigate, locale }) => {
      const upcoming = db.leave
        .filter((r) => r.status === 'approved' && r.endDate >= '2026-10-31')
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .slice(0, 4);
      return (
        <ChartCard
          title="Upcoming time off"
          description="A little planning goes a long way."
          action={
            <Button variant="ghost" size="xs" onClick={() => navigate('/hr/leave')}>
              View all
            </Button>
          }
          bodyClassName="px-3 pb-3 pt-0"
        >
          {upcoming.length === 0 ? (
            <EmptyState title="No upcoming absence" description="Approved leave will appear here." />
          ) : (
            <ul className="flex flex-col">
              {upcoming.map((request) => {
                const employee = getEmployee(request.employeeId);
                return (
                  <li key={request.id} className="flex items-center gap-2.5 border-b border-line py-2.5 last:border-0">
                    <Avatar name={displayName(employee!)} hue={employee?.avatarHue} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11.5px] font-medium text-ink">{displayName(employee!)}</p>
                      <p className="truncate text-[10px] text-ink-4">
                        {request.type.replace('_', ' ')} · {request.days} days
                      </p>
                    </div>
                    <span className="num shrink-0 text-[10px] text-ink-4">{formatDate(request.startDate, 'd MMM', locale)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </ChartCard>
      );
    },
  },
  {
    id: 'list-flight-risk',
    title: 'Flight risk',
    description: 'Low engagement, high performance.',
    category: 'list',
    span: 1,
    render: ({ navigate, locale }) => {
      const risky = activeEmployees()
        .filter((e) => e.flightRisk === 'high')
        .sort((a, b) => a.engagement - b.engagement)
        .slice(0, 4);
      return (
        <ChartCard
          title={
            <span className="inline-flex items-center gap-1.5">
              <Flame className="size-3.5 text-danger" /> Flight risk
            </span>
          }
          description="Scored nightly from engagement and reviews."
          action={
            <Button variant="ghost" size="xs" onClick={() => navigate('/hr/people?risk=high')}>
              All
            </Button>
          }
          bodyClassName="px-3 pb-3"
        >
          <ul className="flex flex-col">
            {risky.map((employee) => (
              <li key={employee.id} className="flex items-center gap-2.5 border-b border-line py-2 last:border-0">
                <Avatar name={displayName(employee)} hue={employee.avatarHue} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-medium text-ink">{displayName(employee)}</p>
                  <p className="truncate text-[10px] text-ink-4">{employee.jobTitle}</p>
                </div>
                <Badge tone={employee.engagement < 7 ? 'danger' : 'warning'}>{employee.engagement.toFixed(1)}</Badge>
              </li>
            ))}
          </ul>
          <p className="pt-2 text-[10px] text-ink-4">
            {risky.length} people · reviewed {formatDate('2026-10-30', 'd MMM', locale)}
          </p>
        </ChartCard>
      );
    },
  },
  {
    id: 'list-top-performers',
    title: 'Top performers',
    description: 'Latest review cycle.',
    category: 'list',
    span: 1,
    render: ({ locale }) => {
      const top = activeEmployees()
        .filter((e) => e.performance.potential === 3)
        .sort((a, b) => b.performance.rating - a.performance.rating)
        .slice(0, 4);
      return (
        <ChartCard title="Top performers" description="High performance, high potential." bodyClassName="px-3 pb-3">
          <ul className="flex flex-col">
            {top.map((employee) => (
              <li key={employee.id} className="flex items-center gap-2.5 border-b border-line py-2 last:border-0">
                <Avatar name={displayName(employee)} hue={employee.avatarHue} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-medium text-ink">{displayName(employee)}</p>
                  <p className="truncate text-[10px] text-ink-4">
                    {db.departments.find((d) => d.id === employee.departmentId)?.name}
                  </p>
                </div>
                <span className="num text-[11px] font-semibold text-ink-2">{employee.performance.rating.toFixed(1)}</span>
              </li>
            ))}
          </ul>
          <p className="pt-2 text-[10px] text-ink-4">H1 2026 cycle · {formatDate('2026-06-30', 'd MMM yyyy', locale)}</p>
        </ChartCard>
      );
    },
  },
  {
    id: 'list-activity',
    title: 'Recent activity',
    description: 'Workspace audit trail.',
    category: 'list',
    span: 2,
    render: ({ locale, navigate }) => (
      <ChartCard
        title="Recent activity"
        description="Every privileged action is written to the audit log."
        action={
          <Button variant="ghost" size="xs" onClick={() => navigate('/hr/settings?tab=audit')}>
            Audit log
          </Button>
        }
        bodyClassName="px-4 pb-3"
      >
        <ul className="flex flex-col">
          {db.audit.slice(0, 5).map((event) => (
            <li key={event.id} className="flex items-start gap-2.5 border-b border-line py-2 last:border-0">
              <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-surface-3 text-ink-4">
                <Compass className="size-2.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11.5px] text-ink-2">
                  <span className="font-medium text-ink">{event.actor}</span> {event.action.toLowerCase()}
                </p>
                <p className="num text-[10px] text-ink-4">
                  {relativeTime(event.at, locale)} · {event.ip}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </ChartCard>
    ),
  },
  {
    id: 'insight-actions',
    title: 'Next moves',
    description: 'Suggested focus areas.',
    category: 'insight',
    span: 1,
    render: ({ analytics, navigate, palette }) => {
        const highBalance = activeEmployees().filter((e) => e.leave.annualEntitlement - e.leave.annualTaken > 20).length;
      const topReason = analytics.attritionReasons[0];
      return (
        <div className="relative flex h-full flex-col overflow-hidden rounded-lg border border-accent/25 bg-gradient-to-br from-accent-soft to-surface p-4">
          <div className="flex items-center gap-2 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-accent-ink/80">
            <Sparkles className="size-3.5" />
            The bigger picture
            <Badge tone="accent" className="ms-auto">
              Insights
            </Badge>
          </div>
          <h3 className="mt-2.5 text-[19px] leading-[1.15] font-bold tracking-[-0.02em] text-ink">
            Small steps.
            <br />
            Stronger teams.
          </h3>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-ink-3">
            A few opportunities to help your people — and your company — thrive.
          </p>
          <div className="mt-3 flex flex-col gap-1.5">
            <button
              className="flex items-start gap-2 rounded-md border border-line/70 bg-surface/70 p-2 text-start transition-colors hover:border-accent/40"
              onClick={() => navigate('/hr/analytics')}
            >
              <TrendingDown className="mt-0.5 size-3 shrink-0 text-accent" />
              <span className="min-w-0">
                <span className="block text-[10.5px] font-medium text-ink">Make room for growth</span>
                <span className="block truncate text-[9.5px] text-ink-4">
                  {topReason?.value ?? 0} exits cited {topReason?.label.toLowerCase() ?? 'career growth'}.
                </span>
              </span>
            </button>
            <button
              className="flex items-start gap-2 rounded-md border border-line/70 bg-surface/70 p-2 text-start transition-colors hover:border-accent/40"
              onClick={() => navigate('/hr/leave')}
            >
              <CalendarDays className="mt-0.5 size-3 shrink-0 text-accent" />
              <span className="min-w-0">
                <span className="block text-[10.5px] font-medium text-ink">Help your team switch off</span>
                <span className="block truncate text-[9.5px] text-ink-4">{highBalance} people have 20+ days remaining.</span>
              </span>
            </button>
          </div>
          <button
            className="mt-auto flex items-center gap-1 pt-3 text-[10.5px] font-medium text-accent-ink hover:underline"
            onClick={() => navigate('/hr/analytics')}
          >
            Explore people insights <ArrowUpRight className="size-3" />
          </button>
          <span className="sr-only">{palette.accent}</span>
        </div>
      );
    },
  },

  /* --------------------------------- Table -------------------------------- */
  {
    id: 'table-departments',
    title: 'Department health',
    description: 'Healthy teams. Stronger outcomes.',
    category: 'table',
    span: 2,
    render: ({ navigate, locale }) => (
      <ChartCard
        title="Department health"
        description="Healthy teams. Stronger outcomes."
        action={
          <Button variant="ghost" size="xs" onClick={() => navigate('/hr/people')}>
            View employees
          </Button>
        }
        bodyClassName="px-0 pb-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-y border-line bg-surface-2">
                {['Department', 'People', 'Engagement', 'Goal completion', 'Health'].map((heading, index) => (
                  <th
                    key={heading}
                    className={`whitespace-nowrap px-3 py-1.5 text-[9.5px] font-semibold uppercase tracking-wide text-ink-4 ${index === 0 ? 'text-start' : index === 4 ? 'text-end' : 'text-start'}`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {db.departments.map((department) => {
                const row = departmentHealthRow(department.id);
                return (
                  <tr key={department.id} className="group">
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-2">
                        <span className="grid size-5 place-items-center rounded bg-surface-3 text-[9px] font-semibold text-ink-3">
                          {department.code.slice(0, 1)}
                        </span>
                        <span className="text-[11.5px] font-medium text-ink">{department.name}</span>
                      </span>
                    </td>
                    <td className="num px-3 py-2 text-[11.5px] text-ink-2">{row.headcount}</td>
                    <td className="num px-3 py-2 text-[11.5px] text-ink-2">
                      {row.engagement.toFixed(1)} <span className="text-[10px] text-ink-4">/ 10</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Progress value={row.goals} className="w-16" tone="accent" />
                        <span className="num text-[11px] text-ink-2">{Math.round(row.goals)}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-end">
                      <Badge tone={row.health === 'healthy' ? 'success' : 'warning'} dot>
                        {row.health === 'healthy' ? 'Healthy' : 'Watch'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-line px-3 py-1.5 text-[9.5px] text-ink-4">
          <span>Health flags teams with more than 16% high flight risk.</span>
          <span>Updated {formatDate('2026-10-31', 'd MMM', locale)}</span>
        </div>
      </ChartCard>
    ),
  },
  {
    id: 'list-compliance',
    title: 'Compliance watchlist',
    description: 'Documents expiring soon.',
    category: 'list',
    span: 1,
    render: ({ navigate }) => {
      const expiring = db.documents
        .filter((d) => d.status === 'expiring' || d.status === 'expired')
        .sort((a, b) => (a.expiresAt ?? '').localeCompare(b.expiresAt ?? ''))
        .slice(0, 4);
      return (
        <ChartCard
          title="Compliance watchlist"
          description="Iqamas, contracts and insurance."
          action={
            <Button variant="ghost" size="xs" onClick={() => navigate('/hr/compliance')}>
              Review
            </Button>
          }
          bodyClassName="px-3 pb-3"
        >
          {expiring.length === 0 ? (
            <EmptyState title="All documents valid" description="Nothing expires in the next 45 days." icon={<ShieldCheck className="size-5" />} />
          ) : (
            <ul className="flex flex-col">
              {expiring.map((document) => {
                const employee = getEmployee(document.employeeId);
                return (
                  <li key={document.id} className="flex items-center gap-2.5 border-b border-line py-2 last:border-0">
                    <span
                      className={`grid size-6 shrink-0 place-items-center rounded ${document.status === 'expired' ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-warning'}`}
                    >
                      <Landmark className="size-3" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-ink">{displayName(employee!)}</p>
                      <p className="truncate text-[9.5px] capitalize text-ink-4">{document.type.replace('_', ' ')} · {document.expiresAt ?? '—'}</p>
                    </div>
                    <Delta value={0} suffix="" className="opacity-0" />
                  </li>
                );
              })}
            </ul>
          )}
        </ChartCard>
      );
    },
  },
  {
    id: 'payroll-status',
    title: 'Payroll status',
    description: 'Current run and WPS readiness.',
    category: 'list',
    span: 1,
    render: ({ analytics, navigate, locale }) => {
      const run = db.payrollRuns[db.payrollRuns.length - 1]!;
      return (
        <ChartCard
          title="Payroll status"
          description="Current run and WPS readiness."
          action={
            <Button variant="ghost" size="xs" onClick={() => navigate('/finance/payroll')}>
              Open
            </Button>
          }
          bodyClassName="px-4 pb-3"
        >
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="num text-[20px] font-semibold leading-none text-ink">{formatSAR(analytics.payrollCost.value, locale, { compact: true })}</p>
              <p className="mt-1 text-[10px] text-ink-4">
                {run.headcount} employees · {run.period}
              </p>
            </div>
            <Badge tone={run.status === 'paid' ? 'success' : run.status === 'approved' ? 'info' : 'warning'} dot>
              {run.status}
            </Badge>
          </div>
          <div className="mt-3 flex flex-col gap-1.5 text-[10.5px]">
            <div className="flex items-center justify-between">
              <span className="text-ink-3">WPS submission</span>
              <span className={run.wpsSubmitted ? 'text-success' : 'text-warning'}>{run.wpsSubmitted ? 'Submitted' : 'Pending'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-3">GOSI share (employer)</span>
              <span className="num text-ink-2">{formatSAR(run.gosiEmployer, locale, { compact: true })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-3">Due date</span>
              <span className="num text-ink-2">{formatDate(run.dueDate, 'd MMM', locale)}</span>
            </div>
          </div>
        </ChartCard>
      );
    },
  },
  {
    id: 'insight-radial',
    title: 'Engagement gauge',
    description: 'Current pulse.',
    category: 'insight',
    span: 1,
    render: ({ analytics, palette }) => {
        return (
        <ChartCard title="Engagement gauge" description="Latest pulse survey." bodyClassName="px-4 pb-4">
          <div className="flex flex-col items-center gap-2 pt-3">
            <RadialGauge value={analytics.engagement.value} max={10} label={analytics.engagement.value.toFixed(1)} sublabel="out of 10" />
            <div className="grid w-full grid-cols-2 gap-2 pt-1">
              <div className="rounded-md border border-line bg-surface-2 p-2">
                <p className="text-[9.5px] text-ink-4">High risk</p>
                <p className="num text-[13px] font-semibold text-danger">{activeEmployees().filter((e) => e.flightRisk === 'high').length}</p>
              </div>
              <div className="rounded-md border border-line bg-surface-2 p-2">
                <p className="text-[9.5px] text-ink-4">Advocates</p>
                <p className="num text-[13px] font-semibold text-success">{activeEmployees().filter((e) => e.engagement >= 8.8).length}</p>
              </div>
            </div>
          </div>
          <span className="sr-only">{palette.accent}</span>
        </ChartCard>
      );
    },
  },
  {
    id: 'list-diversity',
    title: 'Nationality mix',
    description: 'Top nationalities in the workforce.',
    category: 'list',
    span: 1,
    render: () => {
      const counts = new Map<string, number>();
      activeEmployees().forEach((e) => counts.set(e.nationality, (counts.get(e.nationality) ?? 0) + 1));
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
      const total = activeEmployees().length || 1;
      return (
        <ChartCard title="Nationality mix" description="Top nationalities in the workforce." bodyClassName="px-4 pb-3">
          <div className="flex flex-col gap-2 pt-1">
            {top.map(([nationality, count]) => (
              <div key={nationality}>
                <div className="mb-1 flex items-center justify-between text-[10.5px]">
                  <span className="inline-flex items-center gap-1.5 text-ink-3">
                    <Globe2 className="size-2.5" /> {nationality}
                  </span>
                  <span className="num text-ink-2">
                    {count} <span className="text-[9.5px] text-ink-4">({Math.round((count / total) * 100)}%)</span>
                  </span>
                </div>
                <Progress value={(count / total) * 100} tone="accent" height="h-1" />
              </div>
            ))}
          </div>
        </ChartCard>
      );
    },
  },
  {
    id: 'list-anniversaries',
    title: 'Work anniversaries',
    description: 'Milestones this month.',
    category: 'list',
    span: 1,
    render: ({ locale }) => {
      const thisMonth = '10';
      const people = activeEmployees()
        .filter((e) => e.hireDate.slice(5, 7) === thisMonth)
        .slice(0, 4);
      return (
        <ChartCard title="Work anniversaries" description="Milestones this month." bodyClassName="px-3 pb-3">
          {people.length === 0 ? (
            <EmptyState title="No milestones" description="Nobody joined in October." icon={<Cake className="size-5" />} />
          ) : (
            <ul className="flex flex-col">
              {people.map((employee) => {
                const years = new Date('2026-10-31').getFullYear() - new Date(employee.hireDate).getFullYear();
                return (
                  <li key={employee.id} className="flex items-center gap-2.5 border-b border-line py-2 last:border-0">
                    <Avatar name={displayName(employee)} hue={employee.avatarHue} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-ink">{displayName(employee)}</p>
                      <p className="truncate text-[9.5px] text-ink-4">{formatDate(employee.hireDate, 'd MMM yyyy', locale)}</p>
                    </div>
                    <Badge tone="accent">{years || 1} yr</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </ChartCard>
      );
    },
  },
  {
    id: 'insight-saudization',
    title: 'Nitaqat readiness',
    description: 'Saudization by department.',
    category: 'table',
    span: 1,
    render: () => {
      const rows = db.departments.map((department) => {
        const people = activeEmployees().filter((e) => e.departmentId === department.id);
        const saudis = people.filter((p) => p.nationality === 'Saudi').length;
        return { name: department.name, rate: people.length ? Math.round((saudis / people.length) * 100) : 0, count: people.length };
      });
      return (
        <ChartCard title="Nitaqat readiness" description="Saudization by department." bodyClassName="px-4 pb-3">
          <div className="flex flex-col gap-2 pt-1">
            {rows.map((row) => (
              <div key={row.name}>
                <div className="mb-1 flex items-center justify-between text-[10.5px]">
                  <span className="truncate text-ink-3">{row.name}</span>
                  <span className={`num ${row.rate >= 40 ? 'text-success' : 'text-warning'}`}>{row.rate}%</span>
                </div>
                <Progress value={row.rate} tone={row.rate >= 40 ? 'accent' : 'warning'} height="h-1" />
              </div>
            ))}
          </div>
        </ChartCard>
      );
    },
  },
  {
    id: 'list-open-roles',
    title: 'Open roles',
    description: 'Live requisitions and progress.',
    category: 'list',
    span: 1,
    render: ({ navigate }) => {
      const roles = db.jobs.filter((job) => job.status === 'open').slice(0, 4);
      return (
        <ChartCard
          title="Open roles"
          description="Live requisitions and progress."
          action={
            <Button variant="ghost" size="xs" onClick={() => navigate('/hr/recruitment')}>
              Pipeline
            </Button>
          }
          bodyClassName="px-3 pb-3"
        >
          <ul className="flex flex-col">
            {roles.map((job) => (
              <li key={job.id} className="flex items-center gap-2.5 border-b border-line py-2 last:border-0">
                <span className="grid size-6 shrink-0 place-items-center rounded bg-primary-soft text-primary-ink">
                  <Layers className="size-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-ink">{job.title}</p>
                  <p className="truncate text-[9.5px] text-ink-4">
                    {job.filled}/{job.openings} filled · {job.stage}
                  </p>
                </div>
                <span className="num text-[10px] text-ink-4">{db.candidates.filter((c) => c.jobId === job.id).length}</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      );
    },
  },
  {
    id: 'chart-heat-attendance',
    title: 'Attendance heat',
    description: 'Daily presence over four weeks.',
    category: 'chart',
    span: 1,
    render: () => {
      const values = Array.from({ length: 20 }, (_, i) => 82 + Math.round(Math.sin(i / 2) * 6) + (i % 3));
      return (
        <ChartCard title="Attendance heat" description="Presence over the last 20 working days." bodyClassName="px-2 pb-3">
          <HeatStrip values={values} legend={['20 days ago', 'today']} />
          <p className="px-3 pt-2 text-[9.5px] text-ink-4">Average presence {Math.round(values.reduce((a, b) => a + b, 0) / values.length)}%</p>
        </ChartCard>
      );
    },
  },
  {
    id: 'list-department-heads',
    title: 'Leadership',
    description: 'Department heads.',
    category: 'list',
    span: 1,
    render: ({ locale }) => (
      <ChartCard title="Leadership" description="Department heads." bodyClassName="px-3 pb-3">
        <ul className="flex flex-col">
          {db.departments.slice(0, 4).map((department) => {
            const head = getEmployee(department.headId);
            if (!head) return null;
            return (
              <li key={department.id} className="flex items-center gap-2.5 border-b border-line py-2 last:border-0">
                <Avatar name={displayName(head)} hue={head.avatarHue} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-ink">{displayName(head)}</p>
                  <p className="truncate text-[9.5px] text-ink-4">{department.name}</p>
                </div>
                <span className="text-[9.5px] text-ink-4">{formatDate(head.hireDate, 'yyyy', locale)}</span>
              </li>
            );
          })}
        </ul>
      </ChartCard>
    ),
  },
  {
    id: 'chart-goal-radial',
    title: 'Goal progress',
    description: 'Company-wide completion.',
    category: 'insight',
    span: 1,
    render: ({ analytics }) => {
      const avg = Math.round(analytics.goalCompletion.reduce((a, g) => a + g.value, 0) / Math.max(1, analytics.goalCompletion.length));
      return (
        <ChartCard title="Goal progress" description="Company-wide completion." bodyClassName="px-4 pb-4">
          <div className="flex items-center justify-center pt-3">
            <RadialGauge value={avg} label={`${avg}%`} sublabel="against an 80% target" />
          </div>
          <div className="mt-1 flex items-center justify-center gap-3 text-[9.5px] text-ink-4">
            <span className="inline-flex items-center gap-1">
              <Goal className="size-2.5" /> {db.goals.length} goals tracked
            </span>
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="size-2.5" /> H2 cycle
            </span>
          </div>
        </ChartCard>
      );
    },
  },
  {
    id: 'insight-cost',
    title: 'Cost per hire',
    description: 'Recruitment efficiency.',
    category: 'kpi',
    span: 1,
    render: ({ locale }) => {
      const hires = db.candidates.filter((c) => c.stage === 'hired').length || 1;
      const spend = 486_000;
      return (
        <KpiCard
          label="Cost per hire"
          value={formatSAR(Math.round(spend / hires), locale, { compact: true })}
          delta={-8.4}
          invertDelta
          deltaLabel="cheaper than last year"
          icon={<CircleDollarSign />}
          tone="info"
          hint="Recruitment spend divided by accepted offers in the trailing twelve months."
          footer={<span className="inline-flex items-center gap-1"><MapPin className="size-2.5" /> Riyadh-weighted agency costs</span>}
        />
      );
    },
  },
];
