import type { Employee, RoleId, SessionUser } from '@/types';
import { DEPARTMENTS, LOCATIONS, WORKSPACE } from './master';
import { EMPLOYEES } from './people';
import {
  ATTENDANCE,
  EXPENSES,
  GOSI_RECORDS,
  INVOICES,
  LEAVE_REQUESTS,
  PAYROLL_RUNS,
  PAYSLIPS,
  TIMESHEETS,
} from './operations';
import { CANDIDATES, GOALS, JOBS, REVIEW_CYCLES } from './talent';
import { AUDIT_EVENTS, DEMO, DOCUMENTS, NOTIFICATIONS } from './records';
import { buildAnalytics } from './analytics';

/**
 * The mock database.
 *
 * Mutable by design: Phase 1 screens perform real writes against this object
 * so that optimistic UI, validation and audit trails are exercised exactly as
 * they will be once Supabase replaces it.
 */
export const db = {
  employees: EMPLOYEES,
  departments: DEPARTMENTS,
  locations: LOCATIONS,
  leave: LEAVE_REQUESTS,
  attendance: ATTENDANCE,
  timesheets: TIMESHEETS,
  payrollRuns: PAYROLL_RUNS,
  payslips: PAYSLIPS,
  gosi: GOSI_RECORDS,
  expenses: EXPENSES,
  invoices: INVOICES,
  jobs: JOBS,
  candidates: CANDIDATES,
  reviewCycles: REVIEW_CYCLES,
  goals: GOALS,
  documents: DOCUMENTS,
  notifications: NOTIFICATIONS,
  audit: AUDIT_EVENTS,
};

export const employeeMap = new Map(db.employees.map((e) => [e.id, e]));
export const departmentMap = new Map(db.departments.map((d) => [d.id, d]));
export const locationMap = new Map(db.locations.map((l) => [l.id, l]));

export const fullName = (employee: Employee | undefined) =>
  employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';

export function getEmployee(id: string | null | undefined) {
  return id ? employeeMap.get(id) : undefined;
}

export function displayName(employee: Employee, locale: 'en' | 'ar' = 'en') {
  return locale === 'ar' ? employee.nameAr : `${employee.firstName} ${employee.lastName}`;
}

export const activeEmployees = () => db.employees.filter((e) => e.status !== 'terminated');

export const departmentHead = (departmentId: string) => getEmployee(departmentMap.get(departmentId)?.headId);

export function directReports(managerId: string) {
  return db.employees.filter((e) => e.managerId === managerId && e.status !== 'terminated');
}

export function chainOfCommand(employee: Employee) {
  const chain: Employee[] = [];
  let current = employee.managerId ? getEmployee(employee.managerId) : undefined;
  let guard = 0;
  while (current && guard < 8) {
    chain.push(current);
    current = current.managerId ? getEmployee(current.managerId) : undefined;
    guard += 1;
  }
  return chain;
}

export function analyticsFor(scope: Employee[] = db.employees) {
  return buildAnalytics(scope);
}

/* -------------------------------- Session --------------------------------- */

const SESSION_PROFILES: Record<RoleId, { employee: Employee; name: string; nameAr: string; email: string }> = {
  admin: { employee: DEMO.hrAdmin, name: `${DEMO.hrAdmin.firstName} ${DEMO.hrAdmin.lastName}`, nameAr: DEMO.hrAdmin.nameAr, email: DEMO.hrAdmin.email },
  hr_manager: { employee: DEMO.hrAdmin, name: `${DEMO.hrAdmin.firstName} ${DEMO.hrAdmin.lastName}`, nameAr: DEMO.hrAdmin.nameAr, email: DEMO.hrAdmin.email },
  recruiter: { employee: DEMO.recruiter, name: `${DEMO.recruiter.firstName} ${DEMO.recruiter.lastName}`, nameAr: DEMO.recruiter.nameAr, email: DEMO.recruiter.email },
  finance: { employee: DEMO.finance, name: `${DEMO.finance.firstName} ${DEMO.finance.lastName}`, nameAr: DEMO.finance.nameAr, email: DEMO.finance.email },
  manager: { employee: getEmployee(activeEmployees()[3]!.managerId) ?? DEMO.employee, name: 'Layla Haddad', nameAr: 'ليلى حداد', email: 'layla.haddad@qimma.sa' },
  employee: { employee: DEMO.employee, name: `${DEMO.employee.firstName} ${DEMO.employee.lastName}`, nameAr: DEMO.employee.nameAr, email: DEMO.employee.email },
};

export function sessionFor(role: RoleId): SessionUser {
  const profile = SESSION_PROFILES[role];
  const employee = profile.employee;
  return {
    id: `user_${role}`,
    name: `${employee.firstName} ${employee.lastName}`,
    nameAr: employee.nameAr,
    email: employee.email,
    role,
    employeeId: employee.id,
    avatarHue: employee.avatarHue,
    workspaceId: WORKSPACE.id,
    mfaEnabled: role !== 'employee',
    authProvider: role === 'finance' ? 'email' : 'google',
  };
}

export const DEMO_EMPLOYEES = DEMO;
export { WORKSPACE };
