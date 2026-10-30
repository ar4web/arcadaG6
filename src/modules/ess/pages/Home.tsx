import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, CalendarDays, Clock4, Coffee, FileText, Receipt, Sun, Target } from 'lucide-react';
import { leaveBalances } from '@/services/leave';
import { payslipsFor } from '@/services/payroll';
import { goalsFor } from '@/services/performance';
import { attendanceFor } from '@/services/attendance';
import { db, displayName, fullName, getEmployee } from '@/lib/mock/db';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { formatDate, formatSAR, relativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeading } from '@/components/ui/card';
import { Avatar, Progress, Skeleton } from '@/components/ui/misc';
import { PageFooter, PageHeader } from '@/modules/shell/PageHeader';

export default function EssHome() {
  const locale = useUIStore((s) => s.locale);
  const session = useAuthStore((s) => s.session);
  const employeeId = session?.employeeId ?? db.employees[0]!.id;
  const employee = getEmployee(employeeId);

  const { data: balances } = useQuery({ queryKey: ['my-balances', employeeId], queryFn: () => leaveBalances(employeeId) });
  const { data: slips } = useQuery({ queryKey: ['my-payslips', employeeId], queryFn: () => payslipsFor(employeeId) });
  const { data: goals } = useQuery({ queryKey: ['my-goals', employeeId], queryFn: () => goalsFor(employeeId) });
  const { data: attendance } = useQuery({ queryKey: ['my-attendance', employeeId], queryFn: () => attendanceFor(employeeId, 12) });

  if (!employee) return <Skeleton className="h-72 w-full rounded-lg" />;

  const annual = balances?.find((balance) => balance.type === 'annual');
  const latestSlip = slips?.[0];
  const presentDays = attendance?.filter((day) => day.status === 'present' || day.status === 'remote').length ?? 0;
  const nextLeave = db.leave.filter((request) => request.employeeId === employeeId && request.status === 'approved' && request.startDate > '2026-10-31')[0];
  const pending = db.leave.filter((request) => request.employeeId === employeeId && request.status === 'pending');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <PageHeader
        eyebrow={`${greeting}, ${employee.firstName}`}
        title="Your workspace"
        description={`${employee.jobTitle} · ${db.departments.find((d) => d.id === employee.departmentId)?.name} · ${db.locations.find((l) => l.id === employee.locationId)?.city}`}
        actions={
          <>
            <Button variant="secondary" size="sm" asChild>
              <Link to="/me/payslips">
                <Receipt className="size-3.5" /> Payslips
              </Link>
            </Button>
            <Button variant="primary" size="sm" asChild>
              <Link to="/me/leave">
                <CalendarDays className="size-3.5" /> Request leave
              </Link>
            </Button>
          </>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Card className="p-3.5">
          <div className="flex items-start justify-between">
            <p className="text-[10.5px] text-ink-3">Annual leave left</p>
            <Coffee className="size-3.5 text-ink-4" />
          </div>
          <p className="num mt-1 text-[22px] font-semibold leading-none text-ink">
            {annual?.remaining ?? 0}
            <span className="ms-1 text-[11px] font-normal text-ink-4">days</span>
          </p>
          <Progress value={((annual?.taken ?? 0) / Math.max(1, annual?.entitlement ?? 1)) * 100} tone="accent" className="mt-2" height="h-1" />
        </Card>
        <Card className="p-3.5">
          <div className="flex items-start justify-between">
            <p className="text-[10.5px] text-ink-3">Last net pay</p>
            <Receipt className="size-3.5 text-ink-4" />
          </div>
          <p className="num mt-1 text-[19px] font-semibold leading-none text-ink">{latestSlip ? formatSAR(latestSlip.net, locale) : '—'}</p>
          <p className="mt-1.5 text-[9.5px] text-ink-4">{latestSlip ? `Paid ${formatDate(latestSlip.issuedAt, 'd MMM', locale)}` : 'No payslip yet'}</p>
        </Card>
        <Card className="p-3.5">
          <div className="flex items-start justify-between">
            <p className="text-[10.5px] text-ink-3">Days present</p>
            <Clock4 className="size-3.5 text-ink-4" />
          </div>
          <p className="num mt-1 text-[22px] font-semibold leading-none text-ink">{presentDays}</p>
          <p className="mt-1.5 text-[9.5px] text-ink-4">of the last 12 working days</p>
        </Card>
        <Card className="p-3.5">
          <div className="flex items-start justify-between">
            <p className="text-[10.5px] text-ink-3">Goals on track</p>
            <Target className="size-3.5 text-ink-4" />
          </div>
          <p className="num mt-1 text-[22px] font-semibold leading-none text-ink">
            {goals?.filter((goal) => goal.status === 'on_track' || goal.status === 'done').length ?? 0}
            <span className="ms-1 text-[11px] font-normal text-ink-4">of {goals?.length ?? 0}</span>
          </p>
          <p className="mt-1.5 text-[9.5px] text-ink-4">H2 2026 cycle</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeading
            title="Next up"
            description="A quick look at what is coming."
            action={
              <Button variant="ghost" size="xs" asChild>
                <Link to="/me/attendance">
                  Attendance <ArrowUpRight className="size-3" />
                </Link>
              </Button>
            }
          />
          <div className="grid grid-cols-1 gap-2 px-5 pb-5 sm:grid-cols-3">
            <div className="rounded-md border border-line p-3">
              <p className="text-[10px] text-ink-4">Next time off</p>
              {nextLeave ? (
                <>
                  <p className="mt-1 text-[12px] font-medium text-ink">{formatDate(nextLeave.startDate, 'd MMM', locale)}</p>
                  <p className="mt-0.5 text-[9.5px] capitalize text-ink-4">
                    {nextLeave.type.replace('_', ' ')} · {nextLeave.days} days
                  </p>
                </>
              ) : (
                <p className="mt-1 text-[11px] text-ink-3">Nothing booked</p>
              )}
            </div>
            <div className="rounded-md border border-line p-3">
              <p className="text-[10px] text-ink-4">Pending requests</p>
              <p className="num mt-1 text-[17px] font-semibold text-ink">{pending.length}</p>
              <p className="mt-0.5 text-[9.5px] text-ink-4">{pending.length ? 'awaiting your manager' : 'all clear'}</p>
            </div>
            <div className="rounded-md border border-line p-3">
              <p className="text-[10px] text-ink-4">Next payday</p>
              <p className="mt-1 text-[12px] font-medium text-ink">28 Nov 2026</p>
              <p className="mt-0.5 text-[9.5px] text-ink-4">WPS transfer</p>
            </div>
          </div>

          <div className="mx-5 mb-5 rounded-lg border border-accent/25 bg-accent-soft/60 p-3">
            <p className="flex items-center gap-1.5 text-[10.5px] font-semibold text-accent-ink">
              <Sun className="size-3.5" /> Wellbeing nudge
            </p>
            <p className="mt-1 text-[10.5px] leading-relaxed text-ink-3">
              You have {annual?.remaining ?? 0} days of annual leave remaining. Taking leave in blocks of five days or more improves recovery, and your balance resets on 1 January.
            </p>
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Card>
            <CardHeading title="My documents" description="Contracts and certificates." action={<Link to="/me/documents" className="text-[10.5px] text-primary hover:underline">View all</Link>} />
            <div className="flex flex-col px-5 pb-5">
              {['Employment contract', 'Iqama copy', 'Medical insurance card'].map((name) => (
                <div key={name} className="flex items-center gap-2 border-b border-line py-2 last:border-0">
                  <span className="grid size-6 place-items-center rounded bg-surface-3 text-ink-4">
                    <FileText className="size-3" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-ink-2">{name}</span>
                  <ArrowRight className="size-3 text-ink-4" />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeading title="Team" description="People you work with." />
            <div className="flex flex-col px-5 pb-5">
              {[getEmployee(employee.managerId), ...db.employees.filter((item) => item.managerId === employee.managerId && item.id !== employee.id).slice(0, 3)]
                .filter(Boolean)
                .map((person, index) => (
                  <div key={person!.id} className="flex items-center gap-2 border-b border-line py-1.5 last:border-0">
                    <Avatar name={fullName(person!)} hue={person!.avatarHue} size="xs" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-medium text-ink">{fullName(person!)}</span>
                      <span className="block truncate text-[9px] text-ink-4">{index === 0 ? 'Manager' : person!.jobTitle}</span>
                    </span>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>

      <PageFooter note={`Signed in as ${session?.name ?? displayName(employee)}`} right={`Updated ${relativeTime(new Date().toISOString(), locale)}`} />
    </>
  );
}
