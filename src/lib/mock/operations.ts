import type {
  AttendanceDay,
  AttendanceStatus,
  ExpenseClaim,
  ExpenseStatus,
  GosiRecord,
  Invoice,
  InvoiceStatus,
  LeaveRequest,
  LeaveType,
  Payslip,
  PayslipLine,
  PayrollRun,
  Timesheet,
} from '@/types';
import { EMPLOYEES } from './people';
import { pick, randomInt, seededRandom, trailingMonths } from '@/lib/utils';

const rand = seededRandom(77123);

const ACTIVE = EMPLOYEES.filter((e) => e.status !== 'terminated');

import { TODAY } from '@/lib/utils';

export { TODAY };
export const CURRENT_PERIOD = '2026-10';

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

/* --------------------------------- Leave ---------------------------------- */

const LEAVE_REASONS: Record<LeaveType, string[]> = {
  annual: ['Family vacation', 'Travel abroad', 'Personal time', 'Wedding in the family', 'Umrah trip'],
  sick: ['Medical certificate attached', 'Flu — 3 days rest', 'Dental procedure', 'Post-surgery recovery'],
  unpaid: ['Extended personal leave', 'Accompanying a dependent'],
  maternity: ['Maternity leave per Article 151'],
  paternity: ['Paternity leave — newborn'],
  hajj: ['Hajj pilgrimage'],
  marriage: ['Marriage leave'],
  bereavement: ['Bereavement leave'],
};

function buildLeave(): LeaveRequest[] {
  const requests: LeaveRequest[] = [];
  const types: LeaveType[] = ['annual', 'annual', 'annual', 'annual', 'sick', 'sick', 'unpaid', 'paternity', 'maternity', 'hajj', 'marriage', 'bereavement'];

  for (let i = 0; i < 54; i++) {
    const employee = ACTIVE[randomInt(rand, 0, ACTIVE.length - 1)]!;
    const type = pick(types, rand);
    const days = type === 'maternity' ? 70 : type === 'paternity' ? 3 : type === 'sick' ? randomInt(rand, 1, 5) : randomInt(rand, 1, 12);
    const offset = randomInt(rand, -25, 45);
    const start = new Date(TODAY.getTime() + offset * 86_400_000);
    const end = new Date(start.getTime() + (days - 1) * 86_400_000);

    const statusRoll = rand();
    const status: LeaveRequest['status'] =
      offset < -12 ? (statusRoll < 0.86 ? 'approved' : 'rejected') : offset < 6 ? (statusRoll < 0.55 ? 'approved' : statusRoll < 0.88 ? 'pending' : 'rejected') : statusRoll < 0.42 ? 'pending' : 'approved';

    requests.push({
      id: `lv_${2000 + i}`,
      employeeId: employee.id,
      type,
      startDate: iso(start),
      endDate: iso(end),
      days,
      status,
      reason: pick(LEAVE_REASONS[type], rand),
      submittedAt: new Date(start.getTime() - randomInt(rand, 3, 21) * 86_400_000).toISOString(),
      decidedAt: status === 'pending' ? undefined : new Date(start.getTime() - randomInt(rand, 1, 6) * 86_400_000).toISOString(),
      decidedBy: status === 'pending' ? undefined : 'emp_1001',
      handoverTo: rand() < 0.5 ? ACTIVE[randomInt(rand, 0, ACTIVE.length - 1)]!.id : undefined,
    });
  }

  // Guarantee a healthy pending queue for the approval screen.
  const pendingTargets = ACTIVE.filter((_, i) => i % 7 === 0).slice(0, 9);
  pendingTargets.forEach((employee, idx) => {
    const start = new Date(TODAY.getTime() + (idx + 2) * 86_400_000);
    requests.push({
      id: `lv_pending_${idx}`,
      employeeId: employee.id,
      type: idx === 4 ? 'sick' : 'annual',
      startDate: iso(start),
      endDate: iso(new Date(start.getTime() + 4 * 86_400_000)),
      days: 5,
      status: 'pending',
      reason: idx === 4 ? 'Medical certificate attached' : pick(LEAVE_REASONS.annual, rand),
      submittedAt: new Date(TODAY.getTime() - (idx + 1) * 86_400_000).toISOString(),
      handoverTo: ACTIVE[(idx * 3) % ACTIVE.length]!.id,
    });
  });

  return requests.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export const LEAVE_REQUESTS = buildLeave();

/* ------------------------------- Attendance -------------------------------- */

function isWeekend(d: Date) {
  const day = d.getDay(); // 0 Sun … 6 Sat. Saudi weekend = Fri/Sat.
  return day === 5 || day === 6;
}

function buildAttendance(): AttendanceDay[] {
  const rows: AttendanceDay[] = [];
  const days: Date[] = [];
  const cursor = new Date(TODAY);
  while (days.length < 20) {
    if (!isWeekend(cursor)) days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }

  ACTIVE.forEach((employee, empIdx) => {
    days.forEach((day, dayIdx) => {
      const roll = rand();
      let status: AttendanceStatus = 'present';
      if (employee.status === 'on_leave' && dayIdx < 3) status = 'leave';
      else if (roll < 0.035) status = 'absent';
      else if (roll < 0.2) status = 'remote';
      else if (roll < 0.27) status = 'late';

      const checkInHour = status === 'late' ? 9 : 7;
      const checkIn = status === 'absent' || status === 'leave' ? undefined : `${String(checkInHour).padStart(2, '0')}:${String(randomInt(rand, status === 'late' ? 20 : 5, status === 'late' ? 55 : 58)).padStart(2, '0')}`;
      const checkOut = status === 'absent' || status === 'leave' ? undefined : `1${randomInt(rand, 6, 8)}:${String(randomInt(rand, 0, 59)).padStart(2, '0')}`;
      const hours = status === 'absent' || status === 'leave' ? 0 : Math.round((7.4 + rand() * 1.6) * 10) / 10;

      rows.push({
        id: `att_${empIdx}_${dayIdx}`,
        employeeId: employee.id,
        date: iso(day),
        status,
        checkIn,
        checkOut,
        hours,
        overtime: hours > 8.5 ? Math.round((hours - 8.5) * 10) / 10 : 0,
      });
    });
  });

  return rows;
}

export const ATTENDANCE = buildAttendance();

export const TIMESHEETS: Timesheet[] = ACTIVE.map((employee) => {
  const rows = ATTENDANCE.filter((a) => a.employeeId === employee.id);
  const present = rows.filter((r) => r.status === 'present').length;
  const remote = rows.filter((r) => r.status === 'remote').length;
  const late = rows.filter((r) => r.status === 'late').length;
  const absent = rows.filter((r) => r.status === 'absent').length;
  const leave = rows.filter((r) => r.status === 'leave').length;
  const overtime = Math.round(rows.reduce((a, r) => a + r.overtime, 0) * 10) / 10;
  return {
    employeeId: employee.id,
    period: '2026-10',
    presentDays: present,
    remoteDays: remote,
    lateDays: late,
    absentDays: absent,
    leaveDays: leave,
    overtimeHours: overtime,
    avgHours: Math.round((rows.reduce((a, r) => a + r.hours, 0) / Math.max(1, rows.length)) * 10) / 10,
  };
});

/* --------------------------------- Payroll --------------------------------- */

export function gosiFor(employee: (typeof EMPLOYEES)[number]) {
  const contributory = employee.salary.basic + employee.salary.housing;
  const isSaudi = employee.nationality === 'Saudi';
  const employeeShare = isSaudi ? Math.round(contributory * 0.0975 * 100) / 100 : 0;
  const employerShare = isSaudi ? Math.round(contributory * 0.1175 * 100) / 100 : 0;
  const hazard = Math.round(contributory * 0.02 * 100) / 100;
  return { employeeShare, employerShare, hazard, total: employeeShare + employerShare + hazard };
}

export const PAYROLL_RUNS: PayrollRun[] = trailingMonths(13).map((month, idx) => {
  const headcount = ACTIVE.length - (12 - idx);
  const grossPerHead = 21_400;
  const gross = headcount * grossPerHead;
  const deductions = Math.round(gross * 0.0975);
  const gosiEmployee = deductions;
  const gosiEmployer = Math.round(gross * 0.1375);
  const last = idx === 12;
  return {
    id: `run_${month.key}`,
    period: month.key,
    status: last ? 'review' : idx === 11 ? 'approved' : 'paid',
    headcount,
    gross,
    deductions,
    gosiEmployee,
    gosiEmployer,
    net: gross - deductions,
    dueDate: `${month.key}-28`,
    paidAt: idx < 11 ? `${month.key}-27T09:12:00.000Z` : undefined,
    wpsSubmitted: idx < 11,
  };
});

function salaryLines(employee: (typeof EMPLOYEES)[number]): PayslipLine[] {
  const gosi = gosiFor(employee);
  const lines: PayslipLine[] = [
    { label: 'Basic salary', labelAr: 'الراتب الأساسي', amount: employee.salary.basic, kind: 'earning' },
    { label: 'Housing allowance', labelAr: 'بدل السكن', amount: employee.salary.housing, kind: 'earning' },
    { label: 'Transport allowance', labelAr: 'بدل النقل', amount: employee.salary.transport, kind: 'earning' },
  ];
  if (employee.salary.allowances) {
    lines.push({ label: 'Other allowances', labelAr: 'بدلات أخرى', amount: employee.salary.allowances, kind: 'earning' });
  }
  if (gosi.employeeShare) {
    lines.push({ label: 'GOSI — employee share', labelAr: 'التأمينات الاجتماعية — حصة الموظف', amount: -gosi.employeeShare, kind: 'deduction' });
  }
  lines.push({ label: 'GOSI — employer share', labelAr: 'التأمينات الاجتماعية — حصة صاحب العمل', amount: gosi.employerShare, kind: 'employer' });
  lines.push({ label: 'Occupational hazard', labelAr: 'الأخطار المهنية', amount: gosi.hazard, kind: 'employer' });
  return lines;
}

function buildPayslips(): Payslip[] {
  const periods = trailingMonths(4).map((m) => m.key);
  const slips: Payslip[] = [];
  ACTIVE.forEach((employee) => {
    periods.forEach((period) => {
      const lines = salaryLines(employee);
      const gross = lines.filter((l) => l.kind === 'earning').reduce((a, l) => a + l.amount, 0);
      const deductions = Math.abs(lines.filter((l) => l.kind === 'deduction').reduce((a, l) => a + l.amount, 0));
      slips.push({
        id: `slip_${employee.id}_${period}`,
        employeeId: employee.id,
        period,
        runId: `run_${period}`,
        gross,
        deductions,
        net: gross - deductions,
        lines,
        status: period === periods[periods.length - 1] ? 'issued' : 'paid',
        issuedAt: `${period}-28T08:00:00.000Z`,
      });
    });
  });
  return slips;
}

export const PAYSLIPS = buildPayslips();

export const GOSI_RECORDS: GosiRecord[] = trailingMonths(6).map((month, idx) => {
  const employees = ACTIVE.length - (5 - idx);
  const avgContributory = 24_800;
  return {
    period: month.key,
    employeeShare: Math.round(employees * avgContributory * 0.0975),
    employerShare: Math.round(employees * avgContributory * 0.1375),
    occupationalHazard: Math.round(employees * avgContributory * 0.02),
    employees,
    status: idx === 5 ? 'pending' : 'filed',
    dueDate: `${month.key}-15`,
  };
});

/* -------------------------------- Expenses --------------------------------- */

const EXPENSE_CATEGORIES: ExpenseClaim['category'][] = ['travel', 'meals', 'equipment', 'training', 'medical', 'other'];
const EXPENSE_TITLES: Record<ExpenseClaim['category'], string[]> = {
  travel: ['Riyadh → Jeddah client visit', 'Dubai conference airfare', 'Hotel — Dammam site audit', 'Ride-hailing during client visit'],
  meals: ['Team lunch — sprint close', 'Client dinner — Al Faisaliah', 'Ifar catering for the office'],
  equipment: ['MacBook Pro 14" replacement', 'Monitor for remote setup', 'Ergonomic chair'],
  training: ['PMP certification course', 'Saudi labor law workshop', 'AWS Solutions Architect exam'],
  medical: ['Annual medical check-up', 'Prescription reimbursement'],
  other: ['Courier — contract originals', 'Ministry attestation fees'],
};

function buildExpenses(): ExpenseClaim[] {
  const claims: ExpenseClaim[] = [];
  for (let i = 0; i < 48; i++) {
    const employee = ACTIVE[randomInt(rand, 0, ACTIVE.length - 1)]!;
    const category = pick(EXPENSE_CATEGORIES, rand);
    const amount =
      category === 'travel' ? randomInt(rand, 450, 4200) : category === 'equipment' ? randomInt(rand, 600, 9500) : category === 'training' ? randomInt(rand, 900, 7800) : category === 'meals' ? randomInt(rand, 80, 950) : randomInt(rand, 120, 1600);
    const statusRoll = rand();
    const status: ExpenseStatus = statusRoll < 0.18 ? 'submitted' : statusRoll < 0.36 ? 'approved' : statusRoll < 0.55 ? 'reimbursed' : statusRoll < 0.62 ? 'rejected' : statusRoll < 0.75 ? 'draft' : 'reimbursed';
    const date = new Date(TODAY.getTime() - randomInt(rand, 1, 60) * 86_400_000);
    claims.push({
      id: `exp_${3000 + i}`,
      employeeId: employee.id,
      category,
      description: pick(EXPENSE_TITLES[category], rand),
      amount,
      currency: 'SAR',
      date: iso(date),
      status,
      submittedAt: new Date(date.getTime() + 86_400_000).toISOString(),
      receiptName: rand() < 0.82 ? `receipt-${3000 + i}.pdf` : undefined,
      approvedBy: status === 'approved' || status === 'reimbursed' ? 'emp_1001' : undefined,
    });
  }
  return claims.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export const EXPENSES = buildExpenses();

/* -------------------------------- Invoices --------------------------------- */

const CLIENTS = [
  { name: 'Almarai Company', vat: '300123456700003' },
  { name: 'Saudi Electricity Company', vat: '300234567800003' },
  { name: 'STC Pay', vat: '300345678900003' },
  { name: 'Riyadh Air', vat: '300456789000003' },
  { name: 'NEOM Company', vat: '300567890100003' },
  { name: 'Saudi Aramco', vat: '300678901200003' },
  { name: 'Bank Albilad', vat: '300789012300003' },
  { name: 'Jarir Bookstore', vat: '300890123400003' },
  { name: 'Tamara Finance', vat: '300901234500003' },
  { name: 'Foodics', vat: '300012345600003' },
];

const SERVICES = [
  { description: 'HR platform subscription — annual', price: 96_000 },
  { description: 'Payroll processing — per 100 employees', price: 42_000 },
  { description: 'Compliance advisory retainer', price: 28_500 },
  { description: 'Implementation and onboarding services', price: 65_000 },
  { description: 'Custom reporting module', price: 18_750 },
  { description: 'API integration — IoT attendance devices', price: 34_000 },
];

function buildInvoices(): Invoice[] {
  const invoices: Invoice[] = [];
  for (let i = 0; i < 32; i++) {
    const client = pick(CLIENTS, rand);
    const lineCount = randomInt(rand, 1, 3);
    const lines = Array.from({ length: lineCount }, () => {
      const service = pick(SERVICES, rand);
      return { description: service.description, quantity: randomInt(rand, 1, 4), unitPrice: service.price, vatRate: 15 };
    });
    const subtotal = lines.reduce((a, l) => a + l.quantity * l.unitPrice, 0);
    const vat = Math.round(subtotal * 0.15);
    const issue = new Date(TODAY.getTime() - randomInt(rand, 2, 92) * 86_400_000);
    const due = new Date(issue.getTime() + 30 * 86_400_000);
    const roll = rand();
    const status: InvoiceStatus = roll < 0.42 ? 'paid' : roll < 0.66 ? 'sent' : roll < 0.86 ? 'overdue' : roll < 0.94 ? 'draft' : 'void';
    invoices.push({
      id: `inv_${4000 + i}`,
      number: `INV-2026-${String(1000 + i)}`,
      clientName: client.name,
      clientVat: client.vat,
      issueDate: iso(issue),
      dueDate: iso(due),
      status,
      lines,
      subtotal,
      vat,
      total: subtotal + vat,
      zatcaStatus: status === 'draft' ? 'not_required' : rand() < 0.85 ? 'reported' : 'pending',
      uuid: `8f3c${randomInt(rand, 100000, 999999)}-${randomInt(rand, 1000, 9999)}-4a2b-9c1d-${randomInt(rand, 100000, 999999)}e5f2`,
    });
  }
  return invoices.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
}

export const INVOICES = buildInvoices();
