/**
 * Row → domain mappers.
 *
 * Supabase returns snake_case rows with Postgres nullability; the UI speaks the
 * domain types in `src/types`. All conversion lives here so screens stay
 * backend-agnostic and the mock store and the database produce identical shapes.
 */
import type { Database } from '@/types/database';
import type { Department, Employee, Location, LeaveRequest, LeaveType, EmployeeStatus } from '@/types';

type EmployeeRow = Database['public']['Tables']['employees']['Row'];
type DepartmentRow = Database['public']['Tables']['departments']['Row'];
type LocationRow = Database['public']['Tables']['locations']['Row'];
type LeaveRow = Database['public']['Tables']['leave_requests']['Row'];

/** Stable hue from an id, so avatars keep their colour between sessions. */
export function hueFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) % 360;
  return hash;
}

const STATUS: Record<EmployeeRow['status'], EmployeeStatus> = {
  active: 'active',
  probation: 'probation',
  on_leave: 'on_leave',
  notice: 'notice',
  terminated: 'terminated',
  alumni: 'terminated',
};

const EMPLOYMENT: Record<EmployeeRow['employment_type'], Employee['employmentType']> = {
  full_time: 'full_time',
  part_time: 'part_time',
  contract: 'contract',
  intern: 'intern',
  temporary: 'contract',
};

export function toEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id,
    employeeNo: row.employee_no,
    firstName: row.first_name,
    lastName: row.last_name,
    nameAr: row.name_ar ?? `${row.first_name} ${row.last_name}`,
    email: row.email,
    phone: row.phone ?? '',
    avatarHue: hueFromId(row.id),
    gender: row.gender ?? 'male',
    birthDate: row.birth_date ?? '',
    nationality: row.nationality ?? '',
    nationalId: row.national_id ?? row.iqama_no ?? '',
    jobTitle: row.job_title,
    jobTitleAr: row.job_title_ar ?? row.job_title,
    departmentId: row.department_id ?? '',
    managerId: row.manager_id,
    locationId: row.location_id ?? '',
    grade: row.job_grade ?? '',
    status: STATUS[row.status],
    employmentType: EMPLOYMENT[row.employment_type],
    hireDate: row.hire_date,
    endDate: row.termination_date ?? row.contract_end_date ?? undefined,
    endReason: row.termination_reason ?? undefined,
    salary: {
      basic: Number(row.base_salary),
      housing: Number(row.housing_allowance),
      transport: Number(row.transport_allowance),
      allowances: Number(row.other_allowances),
      currency: 'SAR',
    },
    bankName: row.bank_name ?? '',
    iban: row.iban ?? '',
    gosiNumber: row.gosi_no ?? '',
    // Balances and review data are fetched on demand by their own services.
    leave: { annualEntitlement: row.annual_leave_days, annualTaken: 0, annualPending: 0, sickTaken: 0 },
    performance: { rating: 0, potential: 2, goalsCompleted: 0, goalsTotal: 0, lastReview: '—' },
    engagement: Number(row.engagement_score ?? 0),
    flightRisk: row.flight_risk ?? 'low',
    compliance: {
      iqamaExpiry: (row.metadata as Record<string, string> | null)?.iqama_expiry,
      passportExpiry: (row.metadata as Record<string, string> | null)?.passport_expiry,
      contractExpiry: row.contract_end_date ?? undefined,
      insuranceExpiry: (row.metadata as Record<string, string> | null)?.insurance_expiry,
    },
    skills: Array.isArray((row.metadata as Record<string, unknown> | null)?.skills)
      ? ((row.metadata as Record<string, unknown>).skills as string[])
      : [],
    createdAt: row.created_at,
  };
}

export function toDepartment(row: DepartmentRow): Department {
  return {
    id: row.id,
    name: row.name,
    nameAr: row.name_ar ?? row.name,
    code: row.code,
    colorVar: row.color,
    headId: row.head_id,
    costCenter: row.cost_centre ?? '',
    budget: Number(row.monthly_budget ?? 0),
  };
}

export function toLocation(row: LocationRow): Location {
  return {
    id: row.id,
    name: row.name,
    nameAr: row.name_ar ?? row.name,
    city: row.city,
    country: row.country,
    timezone: row.timezone,
  };
}

const LEAVE_TYPE: Record<string, LeaveType> = {
  ANNUAL: 'annual',
  SICK: 'sick',
  UNPAID: 'unpaid',
  MATERNITY: 'maternity',
  PATERNITY: 'paternity',
  HAJJ: 'hajj',
  MARRIAGE: 'marriage',
  BEREAVEMENT: 'bereavement',
};

const LEAVE_STATUS: Record<LeaveRow['status'], LeaveRequest['status']> = {
  draft: 'pending',
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  cancelled: 'cancelled',
  withdrawn: 'cancelled',
};

export function toLeaveRequest(row: LeaveRow & { leave_types?: { code: string } | null }): LeaveRequest {
  return {
    id: row.id,
    employeeId: row.employee_id,
    type: LEAVE_TYPE[row.leave_types?.code ?? 'ANNUAL'] ?? 'annual',
    startDate: row.start_date,
    endDate: row.end_date,
    days: Number(row.working_days),
    status: LEAVE_STATUS[row.status],
    reason: row.reason ?? '',
    submittedAt: row.submitted_at,
    decidedAt: row.decided_at ?? undefined,
    decidedBy: row.approver_id ?? undefined,
    handoverTo: row.decision_note ?? undefined,
  };
}
