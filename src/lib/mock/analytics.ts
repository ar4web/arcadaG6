import type {
  AnalyticsSnapshot,
  AttendanceDay,
  Employee,
  LeaveRequest,
  Payslip,
  SeriesPoint,
} from '@/types';
import { DEPARTMENTS, LOCATIONS } from './master';
import { average, pctChange, trailingMonths } from '@/lib/utils';
import { ATTENDANCE, LEAVE_REQUESTS, PAYROLL_RUNS, PAYSLIPS, TODAY } from './operations';

const MONTH_ENDS = trailingMonths(13).map((m) => {
  const [year, month] = m.key.split('-').map(Number) as [number, number];
  return { ...m, end: new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10) };
});

function headcountAt(employees: Employee[], date: string) {
  return employees.filter((e) => e.hireDate <= date && (!e.endDate || e.endDate > date)).length;
}

function movementFor(employees: Employee[], key: string) {
  const hires = employees.filter((e) => e.hireDate.startsWith(key)).length;
  const exits = employees.filter((e) => e.endDate?.startsWith(key)).length;
  return { hires, exits };
}

export function buildAnalytics(
  employees: Employee[],
  leave: LeaveRequest[] = LEAVE_REQUESTS,
  attendance: AttendanceDay[] = ATTENDANCE,
  payslips: Payslip[] = PAYSLIPS,
): AnalyticsSnapshot {
  const active = employees.filter((e) => e.status !== 'terminated');
  const currentDate = TODAY.toISOString().slice(0, 10);

  const headcount = headcountAt(employees, currentDate);
  const previousYear = headcountAt(employees, `${TODAY.getUTCFullYear() - 1}-${currentDate.slice(5)}`);
  const hiresThisYear = employees.filter((e) => e.hireDate.startsWith('2026')).length;
  const exitsThisYear = employees.filter((e) => e.endDate?.startsWith('2026')).length;

  const headcountTrend: SeriesPoint[] = MONTH_ENDS.map((m) => ({
    label: m.label,
    key: m.key,
    headcount: headcountAt(employees, m.end),
  }));

  const movementTrend: SeriesPoint[] = MONTH_ENDS.map((m) => {
    const { hires, exits } = movementFor(employees, m.key);
    return { label: m.label, key: m.key, hires, exits };
  });

  const turnoverSeries: SeriesPoint[] = MONTH_ENDS.map((m) => {
    const { exits } = movementFor(employees, m.key);
    const avgHeadcount =
      (headcountAt(employees, m.end) + headcountAt(employees, `${m.key}-01`)) / 2 || 1;
    return { label: m.label, key: m.key, turnover: Math.round((exits / avgHeadcount) * 1000) / 10, exits };
  });

  const onLeaveToday = leave.filter(
    (r) => r.status === 'approved' && r.startDate <= currentDate && r.endDate >= currentDate,
  ).length;

  const byDepartment = DEPARTMENTS.map((d) => ({
    id: d.id,
    label: d.name,
    value: active.filter((e) => e.departmentId === d.id).length,
  }));

  const byLocation = LOCATIONS.map((l) => ({
    label: l.city,
    value: active.filter((e) => e.locationId === l.id).length,
  }));

  const tenureBuckets = [
    { label: '< 1 yr', test: (y: number) => y < 1 },
    { label: '1–2 yrs', test: (y: number) => y >= 1 && y < 2 },
    { label: '2–4 yrs', test: (y: number) => y >= 2 && y < 4 },
    { label: '4–7 yrs', test: (y: number) => y >= 4 && y < 7 },
    { label: '7+ yrs', test: (y: number) => y >= 7 },
  ];
  const tenureYears = (e: Employee) =>
    (TODAY.getTime() - new Date(e.hireDate).getTime()) / (365.25 * 86_400_000);

  const byTenure = tenureBuckets.map((b) => ({
    label: b.label,
    value: active.filter((e) => b.test(tenureYears(e))).length,
  }));

  const employmentTypes: { key: Employee['employmentType']; label: string }[] = [
    { key: 'full_time', label: 'Full time' },
    { key: 'part_time', label: 'Part time' },
    { key: 'contract', label: 'Contract' },
    { key: 'intern', label: 'Intern' },
  ];
  const byEmploymentType = employmentTypes.map((t) => ({
    label: t.label,
    value: active.filter((e) => e.employmentType === t.key).length,
  }));

  const byGender = [
    { label: 'Female', value: active.filter((e) => e.gender === 'female').length },
    { label: 'Male', value: active.filter((e) => e.gender === 'male').length },
  ];

  const ageBuckets = [
    { label: '20–29', min: 20, max: 29 },
    { label: '30–39', min: 30, max: 39 },
    { label: '40–49', min: 40, max: 49 },
    { label: '50+', min: 50, max: 80 },
  ];
  const ages = active.map((e) => (TODAY.getTime() - new Date(e.birthDate).getTime()) / (365.25 * 86_400_000));
  const byAge = ageBuckets.map((b) => ({
    label: b.label,
    value: ages.filter((a) => a >= b.min && a <= b.max).length,
  }));

  const alumni = employees.filter((e) => e.endDate);
  const reasonCounts = new Map<string, number>();
  alumni.forEach((e) => reasonCounts.set(e.endReason ?? 'Other', (reasonCounts.get(e.endReason ?? 'Other') ?? 0) + 1));
  const attritionReasons = [...reasonCounts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const attendanceTrend: SeriesPoint[] = MONTH_ENDS.slice(-6).map((m) => {
    const rows = attendance.filter((r) => r.date.startsWith(m.key));
    const total = rows.length || 1;
    const absent = rows.filter((r) => r.status === 'absent').length;
    const remote = rows.filter((r) => r.status === 'remote').length;
    const late = rows.filter((r) => r.status === 'late').length;
    return {
      label: m.label,
      key: m.key,
      absenteeism: Math.round((absent / total) * 1000) / 10,
      remote: Math.round((remote / total) * 1000) / 10,
      late: Math.round((late / total) * 1000) / 10,
    };
  });

  const payrollTrend: SeriesPoint[] = PAYROLL_RUNS.slice(-12).map((run) => ({
    label: trailingMonths(13).find((m) => m.key === run.period)?.label ?? run.period,
    key: run.period,
    gross: Math.round(run.gross / 1000),
    net: Math.round(run.net / 1000),
  }));

  const goalCompletion = DEPARTMENTS.map((d) => {
    const people = active.filter((e) => e.departmentId === d.id);
    const completion = average(people.map((e) => (e.performance.goalsCompleted / Math.max(1, e.performance.goalsTotal)) * 100));
    return { department: d.name, value: Math.round(completion), target: 80 };
  });

  const currentRun = PAYROLL_RUNS[PAYROLL_RUNS.length - 1]!;
  const lastRun = PAYROLL_RUNS[PAYROLL_RUNS.length - 2]!;
  void payslips;

  const last12Absenteeism = attendanceTrend[attendanceTrend.length - 1];
  const prevAbsenteeism = attendanceTrend[attendanceTrend.length - 2];

  return {
    headcount: {
      label: 'Total employees',
      value: headcount,
      previous: previousYear,
      unit: 'count',
      deltaLabel: `+${hiresThisYear - exitsThisYear} net this year`,
      trend: headcountTrend.map((p) => Number(p.headcount)),
    },
    newHires: {
      label: 'New hires',
      value: hiresThisYear,
      previous: employees.filter((e) => e.hireDate.startsWith('2025')).length,
      unit: 'count',
      deltaLabel: 'year to date',
      trend: movementTrend.map((p) => Number(p.hires)),
    },
    turnover: {
      label: 'Employee turnover',
      value: Math.round((exitsThisYear / Math.max(1, headcount)) * 1000) / 10,
      previous: 13.1,
      unit: 'percent',
      deltaLabel: `${exitsThisYear} exits recorded`,
      trend: turnoverSeries.map((p) => Number(p.turnover)),
    },
    onLeave: {
      label: 'On leave today',
      value: onLeaveToday,
      unit: 'count',
      deltaLabel: `${leave.filter((r) => r.status === 'pending').length} pending requests`,
      trend: [3, 5, 4, 6, 8, 7, 9, 11, 12, onLeaveToday],
    },
    avgTenure: {
      label: 'Average tenure',
      value: Math.round(average(active.map(tenureYears)) * 10) / 10,
      previous: 2.9,
      unit: 'days',
      deltaLabel: 'years per employee',
    },
    engagement: {
      label: 'Engagement',
      value: Math.round(average(active.map((e) => e.engagement)) * 10) / 10,
      previous: 7.6,
      unit: 'score',
      deltaLabel: 'out of 10',
      trend: [7.4, 7.5, 7.6, 7.8, 7.7, 7.9, 8.0, 8.1, 8.2, Math.round(average(active.map((e) => e.engagement)) * 10) / 10],
    },
    payrollCost: {
      label: 'Monthly payroll',
      value: currentRun.gross,
      previous: lastRun.gross,
      unit: 'currency',
      deltaLabel: `${currentRun.headcount} employees`,
      trend: PAYROLL_RUNS.slice(-10).map((r) => r.gross),
    },
    absenteeism: {
      label: 'Absenteeism',
      value: Number(last12Absenteeism?.absenteeism ?? 0),
      previous: Number(prevAbsenteeism?.absenteeism ?? 0),
      unit: 'percent',
      deltaLabel: 'of scheduled days',
      trend: attendanceTrend.map((p) => Number(p.absenteeism)),
    },
    headcountTrend,
    movementTrend,
    byDepartment,
    byLocation,
    byTenure,
    byEmploymentType,
    byGender,
    byAge,
    attritionReasons,
    turnoverTrend: turnoverSeries,
    attendanceTrend,
    payrollTrend,
    goalCompletion,
  };
}

export const analyticsDelta = pctChange;
export const currentRunPeriod = PAYROLL_RUNS[PAYROLL_RUNS.length - 1]!.period;
export const lastPaidSlips = PAYSLIPS.filter((p) => p.period === currentRunPeriod);
