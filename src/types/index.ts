/**
 * Domain model for the Arcada People Suite.
 *
 * These types describe the *contract* between the UI and the services layer.
 * In Phase 1 every service is backed by the deterministic mock store; Phase 2
 * swaps the implementation for Supabase queries without touching screens.
 */

export type Locale = 'en' | 'ar';
export type Theme = 'light' | 'dark' | 'system';

/* ---------------------------------- People --------------------------------- */

export type AppId = 'hr' | 'ess' | 'finance';

export type EmployeeStatus = 'active' | 'probation' | 'on_leave' | 'notice' | 'terminated';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern';
export type Gender = 'male' | 'female';

export interface Salary {
  basic: number;
  housing: number;
  transport: number;
  allowances: number;
  currency: 'SAR';
}

export interface ComplianceDates {
  iqamaExpiry?: string;
  passportExpiry?: string;
  contractExpiry?: string;
  insuranceExpiry?: string;
}

export interface Employee {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  nameAr: string;
  email: string;
  phone: string;
  avatarHue: number;
  gender: Gender;
  birthDate: string;
  nationality: string;
  nationalId: string;
  jobTitle: string;
  jobTitleAr: string;
  departmentId: string;
  managerId: string | null;
  locationId: string;
  grade: string;
  status: EmployeeStatus;
  employmentType: EmploymentType;
  hireDate: string;
  endDate?: string;
  endReason?: string;
  salary: Salary;
  bankName: string;
  iban: string;
  gosiNumber: string;
  leave: {
    annualEntitlement: number;
    annualTaken: number;
    annualPending: number;
    sickTaken: number;
  };
  performance: {
    /** 1–5 rating from the last cycle. */
    rating: number;
    /** 9-box potential score, 1–3. */
    potential: 1 | 2 | 3;
    goalsCompleted: number;
    goalsTotal: number;
    lastReview: string;
  };
  engagement: number;
  flightRisk: 'low' | 'medium' | 'high';
  compliance: ComplianceDates;
  skills: string[];
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  colorVar: string;
  headId: string | null;
  costCenter: string;
  budget: number;
}

export interface Location {
  id: string;
  name: string;
  nameAr: string;
  city: string;
  country: string;
  timezone: string;
}

/* ---------------------------------- Leave ---------------------------------- */

export type LeaveType = 'annual' | 'sick' | 'unpaid' | 'maternity' | 'paternity' | 'hajj' | 'marriage' | 'bereavement';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
  reason: string;
  submittedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  handoverTo?: string;
}

export interface LeaveBalance {
  employeeId: string;
  type: LeaveType;
  entitlement: number;
  taken: number;
  pending: number;
  remaining: number;
}

/* -------------------------------- Attendance ------------------------------- */

export type AttendanceStatus = 'present' | 'remote' | 'late' | 'absent' | 'leave' | 'holiday';

export interface AttendanceDay {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  hours: number;
  overtime: number;
}

export interface Timesheet {
  employeeId: string;
  period: string;
  presentDays: number;
  remoteDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  overtimeHours: number;
  avgHours: number;
}

/* --------------------------------- Payroll --------------------------------- */

export type PayrollStatus = 'draft' | 'review' | 'approved' | 'paid';

export interface PayrollRun {
  id: string;
  period: string;
  status: PayrollStatus;
  headcount: number;
  gross: number;
  deductions: number;
  gosiEmployee: number;
  gosiEmployer: number;
  net: number;
  dueDate: string;
  paidAt?: string;
  wpsSubmitted?: boolean;
}

export interface PayslipLine {
  label: string;
  labelAr: string;
  amount: number;
  kind: 'earning' | 'deduction' | 'employer';
}

export interface Payslip {
  id: string;
  employeeId: string;
  period: string;
  runId: string;
  gross: number;
  deductions: number;
  net: number;
  lines: PayslipLine[];
  status: 'issued' | 'paid';
  issuedAt: string;
}

export interface GosiRecord {
  period: string;
  employeeShare: number;
  employerShare: number;
  occupationalHazard: number;
  employees: number;
  status: 'filed' | 'pending' | 'overdue';
  dueDate: string;
}

/* --------------------------------- Expenses -------------------------------- */

export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed';

export interface ExpenseClaim {
  id: string;
  employeeId: string;
  category: 'travel' | 'meals' | 'equipment' | 'training' | 'medical' | 'other';
  description: string;
  amount: number;
  currency: 'SAR';
  date: string;
  status: ExpenseStatus;
  submittedAt: string;
  receiptName?: string;
  approvedBy?: string;
}

/* --------------------------------- Invoices -------------------------------- */

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientName: string;
  clientVat: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  subtotal: number;
  vat: number;
  total: number;
  zatcaStatus: 'reported' | 'pending' | 'not_required';
  uuid: string;
}

/* -------------------------------- Recruitment ------------------------------ */

export type JobStatus = 'open' | 'paused' | 'closed';

export interface JobOpening {
  id: string;
  title: string;
  departmentId: string;
  locationId: string;
  type: EmploymentType;
  status: JobStatus;
  openings: number;
  filled: number;
  openedAt: string;
  hiringManagerId: string;
  salaryRange: [number, number];
  stage: 'sourcing' | 'interviewing' | 'offer' | 'closing';
}

export type PipelineStage = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  jobId: string;
  stage: PipelineStage;
  source: 'linkedin' | 'referral' | 'website' | 'agency' | 'job_board';
  appliedAt: string;
  rating: number;
  avatarHue: number;
  nationality: string;
  notes: string;
}

/* -------------------------------- Performance ------------------------------ */

export interface ReviewCycle {
  id: string;
  name: string;
  period: string;
  status: 'draft' | 'active' | 'calibration' | 'closed';
  participants: number;
  completed: number;
  dueDate: string;
}

export interface Goal {
  id: string;
  employeeId: string;
  title: string;
  weight: number;
  progress: number;
  status: 'on_track' | 'at_risk' | 'done' | 'not_started';
  dueDate: string;
  category: 'business' | 'development' | 'people';
}

/* --------------------------------- Documents ------------------------------- */

export type DocumentStatus = 'valid' | 'expiring' | 'expired' | 'missing';

export interface DocumentRecord {
  id: string;
  employeeId: string;
  type:
    | 'iqama'
    | 'passport'
    | 'contract'
    | 'insurance'
    | 'national_id'
    | 'work_permit'
    | 'certificate'
    | 'payslip';
  name: string;
  issuedAt: string;
  expiresAt?: string;
  status: DocumentStatus;
  sizeKb: number;
  filesBucket: 'hr-documents' | 'payslips' | 'contracts' | 'avatars' | 'receipts';
}

/* ------------------------------- Notifications ----------------------------- */

export type NotificationKind = 'leave' | 'payroll' | 'compliance' | 'recruitment' | 'expense' | 'system' | 'invoice';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
  actorId?: string;
  priority: 'normal' | 'high';
}

/* ---------------------------------- Audit ---------------------------------- */

export interface AuditEvent {
  id: string;
  actor: string;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  at: string;
  ip: string;
}

/* ---------------------------------- User ----------------------------------- */

export type RoleId = 'admin' | 'hr_manager' | 'recruiter' | 'finance' | 'manager' | 'employee';

export interface Role {
  id: RoleId;
  name: string;
  description: string;
  apps: AppId[];
  permissions: Permission[];
}

export type Permission =
  | 'employees.read'
  | 'employees.write'
  | 'employees.delete'
  | 'leave.approve'
  | 'payroll.read'
  | 'payroll.write'
  | 'payroll.approve'
  | 'finance.read'
  | 'finance.write'
  | 'recruitment.write'
  | 'performance.write'
  | 'compliance.read'
  | 'settings.write'
  | 'audit.read';

export interface SessionUser {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  role: RoleId;
  employeeId: string;
  avatarHue: number;
  workspaceId: string;
  mfaEnabled: boolean;
  authProvider: 'google' | 'email' | 'phone';
}

/* -------------------------------- Analytics -------------------------------- */

export interface KpiPoint {
  label: string;
  value: number;
  previous?: number;
  unit?: 'count' | 'percent' | 'currency' | 'score' | 'days';
  deltaLabel?: string;
  trend?: number[];
}

export interface SeriesPoint {
  label: string;
  [key: string]: string | number;
}

export interface AnalyticsSnapshot {
  headcount: KpiPoint;
  newHires: KpiPoint;
  turnover: KpiPoint;
  onLeave: KpiPoint;
  avgTenure: KpiPoint;
  engagement: KpiPoint;
  payrollCost: KpiPoint;
  absenteeism: KpiPoint;
  headcountTrend: SeriesPoint[];
  movementTrend: SeriesPoint[];
  byDepartment: { id: string; label: string; value: number }[];
  byLocation: { label: string; value: number }[];
  byTenure: { label: string; value: number }[];
  byEmploymentType: { label: string; value: number }[];
  byGender: { label: string; value: number }[];
  byAge: { label: string; value: number }[];
  attritionReasons: { label: string; value: number }[];
  turnoverTrend: SeriesPoint[];
  attendanceTrend: SeriesPoint[];
  payrollTrend: SeriesPoint[];
  goalCompletion: { department: string; value: number; target: number }[];
}

/* -------------------------------- Dashboard -------------------------------- */

export type WidgetId = string;

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: { id: WidgetId; span: 1 | 2 | 3 | 4 }[];
}

/* ---------------------------------- Misc ----------------------------------- */

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type SortDirection = 'asc' | 'desc';

export interface TableQuery {
  search?: string;
  sort?: { key: string; direction: SortDirection };
  page?: number;
  pageSize?: number;
  filters?: Record<string, string | string[] | undefined>;
}
