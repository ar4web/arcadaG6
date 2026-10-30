/** Supabase-backed implementation of the leave service. */
import { supabase } from '@/lib/supabase';
import type { LeaveBalance, LeaveRequest, LeaveStatus, LeaveType } from '@/types';
import { daysBetween } from '@/lib/utils';
import { ApiError } from '../api';
import { toLeaveRequest } from './mappers';

const LEAVE_CODE: Record<LeaveType, string> = {
  annual: 'ANNUAL',
  sick: 'SICK',
  unpaid: 'UNPAID',
  maternity: 'MATERNITY',
  paternity: 'PATERNITY',
  hajj: 'HAJJ',
  marriage: 'MARRIAGE',
  bereavement: 'BEREAVEMENT',
};

const SELECT = '*, leave_types(code)';

export async function listLeaveRequests(filters: { status?: LeaveStatus | 'all'; department?: string; employeeId?: string } = {}) {
  let query = supabase().from('leave_requests').select(filters.department ? `${SELECT}, employees!inner(department_id)` : SELECT);

  if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
  if (filters.employeeId) query = query.eq('employee_id', filters.employeeId);
  if (filters.department && filters.department !== 'all') query = query.eq('employees.department_id', filters.department);

  const { data, error } = await query.order('submitted_at', { ascending: false });
  if (error) throw new ApiError(error.message, 'network');
  return (data ?? []).map((row) => toLeaveRequest(row as never));
}

export async function leaveBalances(employeeId: string): Promise<LeaveBalance[]> {
  const { data, error } = await supabase()
    .from('leave_balances')
    .select('*, leave_types(code)')
    .eq('employee_id', employeeId)
    .eq('year', new Date().getFullYear());
  if (error) throw new ApiError(error.message, 'network');

  type BalanceRow = {
    entitlement: number;
    carried_over: number;
    taken: number;
    pending: number;
    leave_types?: { code: string } | null;
  };
  const rows = (data ?? []) as unknown as BalanceRow[];
  return rows.map((row) => {
    const code = String(row.leave_types?.code ?? '').toLowerCase() as LeaveType;
    const entitlement = Number(row.entitlement) + Number(row.carried_over);
    const taken = Number(row.taken);
    const pending = Number(row.pending);
    return {
      employeeId,
      type: (LEAVE_CODE[code] ? code : 'annual') as LeaveType,
      entitlement,
      taken,
      pending,
      remaining: entitlement - taken - pending,
    };
  });
}

export async function decideLeave(id: string, status: Extract<LeaveStatus, 'approved' | 'rejected'>, note?: string) {
  const { data, error } = await supabase()
    .rpc('decide_leave_request', { p_request_id: id, p_status: status, p_note: note })
    .single();
  if (error) throw new ApiError(error.message, error.code === 'P0002' ? 'not_found' : 'validation');
  return toLeaveRequest(data as never);
}

export async function createLeaveRequest(input: {
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  handoverTo?: string;
}): Promise<LeaveRequest> {
  const { data: type, error: typeError } = await supabase()
    .from('leave_types')
    .select('id, org_id')
    .eq('code', LEAVE_CODE[input.type])
    .maybeSingle();
  if (typeError) throw new ApiError(typeError.message, 'network');
  if (!type) throw new ApiError(`Leave type ${input.type} is not configured`, 'validation');

  const { data, error } = await supabase()
    .from('leave_requests')
    .insert({
      org_id: type.org_id,
      employee_id: input.employeeId,
      leave_type_id: type.id,
      start_date: input.startDate,
      end_date: input.endDate,
      working_days: Math.max(1, daysBetween(input.startDate, input.endDate) + 1),
      reason: input.reason,
      decision_note: input.handoverTo ?? null,
      status: 'pending',
    })
    .select(SELECT)
    .single();
  if (error) throw new ApiError(error.message, 'validation');
  return toLeaveRequest(data as never);
}

export async function cancelLeave(id: string) {
  const { data, error } = await supabase()
    .from('leave_requests')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select(SELECT)
    .single();
  if (error) throw new ApiError(error.message, 'validation');
  return toLeaveRequest(data as never);
}

export async function upcomingAbsences(days = 21) {
  const today = new Date().toISOString().slice(0, 10);
  const until = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await supabase()
    .from('leave_requests')
    .select(SELECT)
    .in('status', ['pending', 'approved'])
    .lte('start_date', until)
    .gte('end_date', today)
    .order('start_date');
  if (error) throw new ApiError(error.message, 'network');
  return (data ?? []).map((row) => toLeaveRequest(row as never));
}
