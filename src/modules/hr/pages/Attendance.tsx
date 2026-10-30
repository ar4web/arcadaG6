import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock4, Download, Fingerprint, MapPin, TimerOff, TrendingUp } from 'lucide-react';
import { attendanceFor, attendanceSummary, timesheets } from '@/services/attendance';
import { db, displayName, getEmployee } from '@/lib/mock/db';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeading } from '@/components/ui/card';
import { Avatar, Badge, EmptyState, Progress } from '@/components/ui/misc';
import { BarCompare, ChartCard } from '@/components/charts/primitives';
import { useChartPalette } from '@/components/charts/theme';
import { methodology } from '@/lib/copy';
import { PageFooter, PageHeader, MethodologyNote } from '@/modules/shell/PageHeader';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  present: 'success',
  remote: 'info',
  late: 'warning',
  absent: 'danger',
  leave: 'neutral',
  holiday: 'neutral',
};

export default function Attendance({ self = false, finance = false }: { self?: boolean; finance?: boolean }) {
  const locale = useUIStore((s) => s.locale);
  const session = useAuthStore((s) => s.session);
  const palette = useChartPalette();

  const employeeId = session?.employeeId ?? db.employees[0]!.id;

  const { data: summary, isLoading } = useQuery({ queryKey: ['attendance-summary'], queryFn: attendanceSummary });
  const { data: sheets } = useQuery({ queryKey: ['timesheets'], queryFn: timesheets });
  const { data: personal } = useQuery({ queryKey: ['attendance', employeeId], queryFn: () => attendanceFor(employeeId, 22) });

  const employee = getEmployee(employeeId);

  if (self) {
    const present = personal?.filter((day) => day.status === 'present' || day.status === 'remote').length ?? 0;
    const late = personal?.filter((day) => day.status === 'late').length ?? 0;
    const absent = personal?.filter((day) => day.status === 'absent').length ?? 0;
    const hours = personal?.reduce((sum, day) => sum + day.hours, 0) ?? 0;

    return (
      <>
        <PageHeader
          eyebrow="My workspace"
          title="My attendance"
          description="Your check-ins, working pattern and overtime for the current month."
          actions={
            <Button variant="primary" size="sm">
              <Fingerprint className="size-3.5" /> Check in
            </Button>
          }
        />

        <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {[
            { label: 'Days present', value: present, icon: CheckCircle2, tone: 'text-success' },
            { label: 'Late arrivals', value: late, icon: Clock4, tone: 'text-warning' },
            { label: 'Absences', value: absent, icon: TimerOff, tone: 'text-danger' },
            { label: 'Hours logged', value: `${hours.toFixed(1)}h`, icon: TrendingUp, tone: 'text-ink' },
          ].map((stat) => (
            <Card key={stat.label} className="p-3.5">
              <div className="flex items-start justify-between">
                <p className="text-[10.5px] text-ink-3">{stat.label}</p>
                <stat.icon className="size-3.5 text-ink-4" />
              </div>
              <p className={cn('num mt-1.5 text-[20px] font-semibold leading-none', stat.tone)}>{stat.value}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeading title="This month" description="Daily record from the biometric device and web check-ins." />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr className="border-y border-line bg-surface-2">
                    {['Date', 'Status', 'Check in', 'Check out', 'Hours', 'Overtime'].map((heading) => (
                      <th key={heading} className="px-3 py-1.5 text-start text-[9.5px] font-semibold uppercase tracking-wide text-ink-4">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {personal?.slice(0, 14).map((day) => (
                    <tr key={day.id} className="hover:bg-surface-2">
                      <td className="num px-3 py-1.5 text-[11px] text-ink-3">{formatDate(day.date, 'EEE d MMM', locale)}</td>
                      <td className="px-3 py-1.5">
                        <Badge tone={STATUS_TONE[day.status]}>{day.status}</Badge>
                      </td>
                      <td className="num px-3 py-1.5 text-[11px] text-ink-2">{day.checkIn ?? '—'}</td>
                      <td className="num px-3 py-1.5 text-[11px] text-ink-2">{day.checkOut ?? '—'}</td>
                      <td className="num px-3 py-1.5 text-[11px] text-ink-2">{day.hours ? `${day.hours}h` : '—'}</td>
                      <td className="num px-3 py-1.5 text-[11px] text-ink-3">{day.overtime ? `${day.overtime}h` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex flex-col gap-3">
            <Card>
              <CardHeading title="Work location" description="Configured policy." />
              <div className="flex flex-col gap-2 px-5 pb-5 text-[11.5px]">
                <div className="flex items-center justify-between">
                  <span className="text-ink-3">Pattern</span>
                  <span className="text-ink-2">Hybrid · 3 office days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-3">Core hours</span>
                  <span className="num text-ink-2">09:00 – 16:00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-3">Workweek</span>
                  <span className="text-ink-2">Sun – Thu</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 rounded-md bg-surface-2 px-2.5 py-2 text-[10.5px] text-ink-3">
                  <MapPin className="size-3 text-ink-4" /> Riyadh HQ · Olaya tower, floor 14
                </div>
              </div>
            </Card>
            <Card>
              <CardHeading title="Overtime this month" description={`${employee ? displayName(employee) : ''}`} />
              <div className="px-5 pb-5">
                <p className="num text-[24px] font-semibold leading-none text-ink">
                  {(personal?.reduce((sum, day) => sum + day.overtime, 0) ?? 0).toFixed(1)}
                  <span className="ms-1 text-[11px] font-normal text-ink-4">hours</span>
                </p>
                <p className="mt-1 text-[10px] text-ink-4">Paid at 1.5× the hourly basic rate.</p>
                <Progress value={35} className="mt-2" tone="accent" />
                <p className="mt-1 text-[9.5px] text-ink-4">Cap is 40 hours per month under the Labour Law.</p>
              </div>
            </Card>
          </div>
        </div>

        <PageFooter note="Attendance is synced every 15 minutes." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={finance ? 'Finance · Workforce cost' : 'Workforce · Presence'}
        title={finance ? 'Attendance & overtime cost' : 'Attendance'}
        description={
          finance
            ? 'Overtime liability and absence exposure for the current payroll period.'
            : 'Presence across the group today, with monthly patterns by team. The Saudi workweek runs Sunday to Thursday.'
        }
        actions={
          <Button variant="secondary" size="sm">
            <Download className="size-3.5" /> Export
          </Button>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-5">
        {[
          { label: 'Present', value: summary?.present ?? 0, tone: 'text-success' },
          { label: 'Remote', value: summary?.remote ?? 0, tone: 'text-info' },
          { label: 'Late', value: summary?.late ?? 0, tone: 'text-warning' },
          { label: 'Absent', value: summary?.absent ?? 0, tone: 'text-danger' },
          { label: 'On leave', value: summary?.onLeave ?? 0, tone: 'text-ink-3' },
        ].map((stat) => (
          <Card key={stat.label} className="p-3">
            <p className="text-[10px] text-ink-3">{stat.label}</p>
            <p className={cn('num mt-1 text-[19px] font-semibold leading-none', stat.tone)}>{isLoading ? '—' : formatNumber(stat.value)}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <ChartCard
          title="Monthly pattern"
          description="Remote, late and absent share of scheduled days."
          className="lg:col-span-2"
          legend={[
            { label: 'Remote', color: palette.series[2]! },
            { label: 'Late', color: palette.series[4]! },
            { label: 'Absent', color: palette.danger },
          ]}
          bodyClassName="px-2"
        >
          <BarCompare
            data={[
              { label: 'May', remote: 18.2, late: 4.1, absent: 3.4 },
              { label: 'Jun', remote: 16.8, late: 3.8, absent: 2.9 },
              { label: 'Jul', remote: 14.1, late: 4.6, absent: 3.8 },
              { label: 'Aug', remote: 15.4, late: 3.2, absent: 2.4 },
              { label: 'Sep', remote: 19.6, late: 4.4, absent: 3.1 },
              { label: 'Oct', remote: 17.3, late: 3.6, absent: 2.7 },
            ]}
            xKey="label"
            series={[
              { key: 'remote', label: 'Remote', color: palette.series[2]! },
              { key: 'late', label: 'Late', color: palette.series[4]! },
              { key: 'absent', label: 'Absent', color: palette.danger },
            ]}
            height={200}
            formatter={(value) => `${value}%`}
          />
        </ChartCard>

        <Card>
          <CardHeading title="Presence today" description={summary?.date ? formatDate(summary.date, 'EEEE d MMMM', locale) : '—'} />
          <div className="px-5 pb-5">
            <p className="num text-[26px] font-semibold leading-none text-ink">
              {summary?.rate ?? 0}
              <span className="text-[12px] font-normal text-ink-4">%</span>
            </p>
            <p className="mt-1 text-[10.5px] text-ink-4">of scheduled staff checked in</p>
            <Progress value={summary?.rate ?? 0} tone="accent" className="mt-2" />
            <div className="mt-3 flex flex-col gap-1.5 text-[10.5px]">
              {(finance
                ? [
                    ['Overtime accrued', 'SAR 84,200'],
                    ['Overtime cap exposure', 'SAR 12,400'],
                    ['Unapproved absence cost', 'SAR 38,600'],
                  ]
                : [
                    ['Biometric sync', '15 min ago'],
                    ['Devices online', '6 of 6'],
                    ['Remote approvals', 'Automatic'],
                  ]
              ).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-ink-3">{label}</span>
                  <span className="text-ink-2">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-3" flush>
        <CardHeading title="Timesheets" description="October 2026 · aggregated per employee." />
        <div className="max-h-[26rem] overflow-auto">
          <table className="w-full min-w-[720px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-y border-line bg-surface-2">
                {['Employee', 'Present', 'Remote', 'Late', 'Absent', 'Leave', 'Overtime', 'Avg. hours'].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-3 py-1.5 text-start text-[9.5px] font-semibold uppercase tracking-wide text-ink-4">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sheets?.slice(0, 40).map((sheet) => {
                const employee = getEmployee(sheet.employeeId);
                if (!employee) return null;
                return (
                  <tr key={sheet.employeeId} className="hover:bg-surface-2">
                    <td className="px-3 py-1.5">
                      <span className="flex items-center gap-2">
                        <Avatar name={displayName(employee)} hue={employee.avatarHue} size="xs" />
                        <span className="truncate text-[11.5px] text-ink-2">{displayName(employee)}</span>
                      </span>
                    </td>
                    <td className="num px-3 py-1.5 text-[11px] text-ink-2">{sheet.presentDays}</td>
                    <td className="num px-3 py-1.5 text-[11px] text-ink-3">{sheet.remoteDays}</td>
                    <td className="num px-3 py-1.5 text-[11px] text-warning">{sheet.lateDays}</td>
                    <td className="num px-3 py-1.5 text-[11px] text-danger">{sheet.absentDays}</td>
                    <td className="num px-3 py-1.5 text-[11px] text-ink-3">{sheet.leaveDays}</td>
                    <td className="num px-3 py-1.5 text-[11px] text-ink-2">{sheet.overtimeHours}h</td>
                    <td className="num px-3 py-1.5 text-[11px] text-ink-3">{sheet.avgHours}h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!sheets?.length ? <EmptyState title="No timesheets yet" description="Records appear once the period closes." /> : null}
      </Card>

      <MethodologyNote>{methodology.attendance}</MethodologyNote>
      <PageFooter note="Presence is derived from biometric and web check-ins." right="Late = after 09:15 local time" />
    </>
  );
}
