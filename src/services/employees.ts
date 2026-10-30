import type { Employee, Paginated, TableQuery } from '@/types';
import { db, departmentMap, displayName, locationMap } from '@/lib/mock/db';
import { DEPARTMENTS } from '@/lib/mock/master';
import { applyTableQuery, request, write, sortRows } from './api';
import { uid } from '@/lib/utils';

export interface EmployeeFilters {
  department?: string;
  location?: string;
  status?: string;
  search?: string;
  sort?: TableQuery['sort'];
  page?: number;
  pageSize?: number;
}

const searchIndex = (e: Employee) =>
  [displayName(e), e.nameAr, e.email, e.jobTitle, e.employeeNo, departmentMap.get(e.departmentId)?.name, locationMap.get(e.locationId)?.name]
    .filter(Boolean)
    .join(' ');

export async function listEmployees(filters: EmployeeFilters = {}): Promise<Paginated<Employee>> {
  return request(() => {
    let rows = db.employees.filter((e) => e.status !== 'terminated');
    if (filters.department && filters.department !== 'all') rows = rows.filter((e) => e.departmentId === filters.department);
    if (filters.location && filters.location !== 'all') rows = rows.filter((e) => e.locationId === filters.location);
    if (filters.status && filters.status !== 'all') rows = rows.filter((e) => e.status === filters.status);
    return applyTableQuery(rows, { search: filters.search, sort: filters.sort, page: filters.page, pageSize: filters.pageSize }, searchIndex);
  });
}

export async function listAllEmployees(): Promise<Employee[]> {
  return request(() => db.employees.filter((e) => e.status !== 'terminated'));
}

export async function getEmployee(id: string): Promise<Employee> {
  return request(() => {
    const employee = db.employees.find((e) => e.id === id);
    if (!employee) throw new Error('Employee not found');
    return employee;
  });
}

export async function createEmployee(input: Partial<Employee>): Promise<Employee> {
  return write(() => {
    const nextNo = db.employees.length + 1001;
    const employee: Employee = {
      id: uid('emp'),
      employeeNo: `Q-${nextNo}`,
      firstName: input.firstName ?? 'New',
      lastName: input.lastName ?? 'Employee',
      nameAr: input.nameAr ?? '',
      email: input.email ?? 'new.employee@qimma.sa',
      phone: input.phone ?? '+966500000000',
      avatarHue: Math.floor(Math.random() * 360),
      gender: input.gender ?? 'male',
      birthDate: input.birthDate ?? '1995-01-01',
      nationality: input.nationality ?? 'Saudi',
      nationalId: input.nationalId ?? '1000000000',
      jobTitle: input.jobTitle ?? 'Team member',
      jobTitleAr: input.jobTitleAr ?? 'عضو فريق',
      departmentId: input.departmentId ?? DEPARTMENTS[0]!.id,
      managerId: input.managerId ?? null,
      locationId: input.locationId ?? 'riyadh',
      grade: input.grade ?? 'G3',
      status: 'probation',
      employmentType: input.employmentType ?? 'full_time',
      hireDate: input.hireDate ?? new Date().toISOString().slice(0, 10),
      salary: input.salary ?? { basic: 12_000, housing: 3_000, transport: 1_200, allowances: 0, currency: 'SAR' },
      bankName: input.bankName ?? 'Al Rajhi Bank',
      iban: input.iban ?? 'SA0000000000000000000000',
      gosiNumber: input.gosiNumber ?? `G${Math.floor(Math.random() * 1e8)}`,
      leave: { annualEntitlement: 21, annualTaken: 0, annualPending: 0, sickTaken: 0 },
      performance: { rating: 3, potential: 2, goalsCompleted: 0, goalsTotal: 6, lastReview: '—' },
      engagement: 7.5,
      flightRisk: 'low',
      compliance: {},
      skills: input.skills ?? [],
      createdAt: new Date().toISOString(),
    };
    db.employees.unshift(employee);
    return employee;
  });
}

export async function updateEmployee(id: string, patch: Partial<Employee>): Promise<Employee> {
  return write(() => {
    const index = db.employees.findIndex((e) => e.id === id);
    if (index < 0) throw new Error('Employee not found');
    db.employees[index] = { ...db.employees[index]!, ...patch };
    return db.employees[index]!;
  });
}

export async function terminateEmployee(id: string, reason: string): Promise<Employee> {
  return write(() => {
    const index = db.employees.findIndex((e) => e.id === id);
    if (index < 0) throw new Error('Employee not found');
    const employee = db.employees[index]!;
    const updated: Employee = { ...employee, status: 'terminated', endDate: new Date().toISOString().slice(0, 10), endReason: reason };
    db.employees[index] = updated;
    return updated;
  });
}

export async function employeeDirectoryForSelect() {
  return request(() =>
    sortRows(
      db.employees.filter((e) => e.status !== 'terminated'),
      'firstName',
    ).map((e) => ({ id: e.id, label: `${e.firstName} ${e.lastName}`, departmentId: e.departmentId })),
  );
}
