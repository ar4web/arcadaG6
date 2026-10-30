/** Supabase-backed implementation of the people service. */
import { supabase } from '@/lib/supabase';
import type { Employee, Paginated } from '@/types';
import type { Database } from '@/types/database';
import { ApiError } from '../api';
import { toEmployee } from './mappers';
import type { EmployeeFilters } from '../employees';

type Insert = Database['public']['Tables']['employees']['Insert'];
type Update = Database['public']['Tables']['employees']['Update'];

/** Org id is resolved once per session by `ensureOrgId` and cached. */
let cachedOrgId: string | null = null;

export async function orgId(): Promise<string> {
  if (cachedOrgId) return cachedOrgId;
  const { data, error } = await supabase().rpc('my_context');
  if (error) throw new ApiError(error.message, 'network');
  const context = data as { org_id?: string } | null;
  if (!context?.org_id) throw new ApiError('No organization on this profile', 'forbidden');
  cachedOrgId = context.org_id;
  return cachedOrgId;
}

export async function listEmployees(filters: EmployeeFilters = {}): Promise<Paginated<Employee>> {
  const org = await orgId();
  let query = supabase()
    .from('employees')
    .select('*', { count: 'exact' })
    .eq('org_id', org)
    .neq('status', 'terminated');

  if (filters.department && filters.department !== 'all') query = query.eq('department_id', filters.department);
  if (filters.location && filters.location !== 'all') query = query.eq('location_id', filters.location);
  if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status as never);
  if (filters.search?.trim()) {
    const term = filters.search.trim().replace(/[%,]/g, '');
    query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,job_title.ilike.%${term}%,employee_no.ilike.%${term}%`);
  }

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 25;
  const from = (page - 1) * pageSize;

  const { data, error, count } = await query
    .order(filters.sort?.key ?? 'hire_date', { ascending: (filters.sort?.direction ?? 'desc') === 'asc' })
    .range(from, from + pageSize - 1);

  if (error) throw new ApiError(error.message, 'network');
  return {
    rows: (data ?? []).map(toEmployee),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function listAllEmployees(): Promise<Employee[]> {
  const org = await orgId();
  const { data, error } = await supabase()
    .from('employees')
    .select('*')
    .eq('org_id', org)
    .neq('status', 'terminated')
    .order('first_name');
  if (error) throw new ApiError(error.message, 'network');
  return (data ?? []).map(toEmployee);
}

export async function getEmployee(id: string): Promise<Employee> {
  const { data, error } = await supabase().from('employees').select('*').eq('id', id).maybeSingle();
  if (error) throw new ApiError(error.message, 'network');
  if (!data) throw new ApiError('Employee not found', 'not_found');
  return toEmployee(data);
}

export async function createEmployee(input: Partial<Employee>): Promise<Employee> {
  const org = await orgId();
  const row: Insert = {
    org_id: org,
    employee_no: input.employeeNo ?? `Q-${Date.now().toString().slice(-6)}`,
    first_name: input.firstName ?? 'New',
    last_name: input.lastName ?? 'Employee',
    email: input.email ?? `new.${Date.now()}@qimma.sa`,
    job_title: input.jobTitle ?? 'Team member',
    hire_date: input.hireDate ?? new Date().toISOString().slice(0, 10),
    department_id: input.departmentId || null,
    location_id: input.locationId || null,
    manager_id: input.managerId ?? null,
    job_grade: input.grade,
    nationality: input.nationality,
    gender: input.gender,
    phone: input.phone,
    status: 'probation',
    base_salary: input.salary?.basic ?? 0,
    housing_allowance: input.salary?.housing ?? 0,
    transport_allowance: input.salary?.transport ?? 0,
    other_allowances: input.salary?.allowances ?? 0,
    iban: input.iban,
    bank_name: input.bankName,
  };
  const { data, error } = await supabase().from('employees').insert(row).select('*').single();
  if (error) throw new ApiError(error.message, error.code === '23505' ? 'conflict' : 'validation');
  return toEmployee(data);
}

export async function updateEmployee(id: string, patch: Partial<Employee>): Promise<Employee> {
  const row: Update = {
    first_name: patch.firstName,
    last_name: patch.lastName,
    name_ar: patch.nameAr,
    email: patch.email,
    phone: patch.phone,
    job_title: patch.jobTitle,
    department_id: patch.departmentId,
    manager_id: patch.managerId,
    location_id: patch.locationId,
    job_grade: patch.grade,
    base_salary: patch.salary?.basic,
    housing_allowance: patch.salary?.housing,
    transport_allowance: patch.salary?.transport,
    other_allowances: patch.salary?.allowances,
    bank_name: patch.bankName,
    iban: patch.iban,
  };
  Object.keys(row).forEach((key) => row[key as keyof Update] === undefined && delete row[key as keyof Update]);

  const { data, error } = await supabase().from('employees').update(row).eq('id', id).select('*').single();
  if (error) throw new ApiError(error.message, 'validation');
  return toEmployee(data);
}

export async function terminateEmployee(id: string, reason: string): Promise<Employee> {
  const { data, error } = await supabase()
    .from('employees')
    .update({ status: 'terminated', termination_date: new Date().toISOString().slice(0, 10), termination_reason: reason })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new ApiError(error.message, 'validation');
  return toEmployee(data);
}

export async function employeeDirectoryForSelect() {
  const employees = await listAllEmployees();
  return employees
    .slice()
    .sort((a, b) => `${a.firstName}`.localeCompare(`${b.firstName}`))
    .map((employee) => ({
      id: employee.id,
      label: `${employee.firstName} ${employee.lastName}`,
      departmentId: employee.departmentId,
    }));
}
