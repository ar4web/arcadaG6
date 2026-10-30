import type { LeaveBalance, LeaveRequest, LeaveStatus, LeaveType } from '@/types';
import { db, getEmployee } from '@/lib/mock/db';
import { request, write } from './api';
import { addDaysISO, daysBetween, todayISO } from '@/lib/utils';

export async function listLeaveRequests(filters: { status?: LeaveStatus | 'all'; department?: string; employeeId?: string } = {}) {
  return request(() => {
    let rows = [...db.leave];
    if (filters.status && filters.status !== 'all') rows = rows.filter((r) => r.status === filters.status);
    if (filters.employeeId) rows = rows.filter((r) => r.employeeId === filters.employeeId);
    if (filters.department && filters.department !== 'all') {
      rows = rows.filter((r) => getEmployee(r.employeeId)?.departmentId === filters.department);
    }
    return rows.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  });
}

export async function leaveBalances(employeeId: string): Promise<LeaveBalance[]> {
  return request(() => {
    const employee = getEmployee(employeeId);
    if (!employee) return [];
    const used = db.leave.filter((r) => r.employeeId === employeeId);
    const takenOf = (type: LeaveType) => used.filter((r) => r.type === type && r.status === 'approved').reduce((a, r) => a + r.days, 0);
    const pendingOf = (type: LeaveType) => used.filter((r) => r.type === type && r.status === 'pending').reduce((a, r) => a + r.days, 0);
    return [
      { employeeId, type: 'annual', entitlement: employee.leave.annualEntitlement, taken: takenOf('annual'), pending: pendingOf('annual'), remaining: employee.leave.annualEntitlement - takenOf('annual') - pendingOf('annual') },
      { employeeId, type: 'sick', entitlement: 30, taken: takenOf('sick'), pending: pendingOf('sick'), remaining: 30 - takenOf('sick') },
      { employeeId, type: 'unpaid', entitlement: 15, taken: takenOf('unpaid'), pending: pendingOf('unpaid'), remaining: 15 - takenOf('unpaid') },
    ];
  });
}

export async function decideLeave(id: string, status: Extract<LeaveStatus, 'approved' | 'rejected'>, actor = 'HR admin') {
  return write(() => {
    const request = db.leave.find((r) => r.id === id);
    if (!request) throw new Error('Leave request not found');
    request.status = status;
    request.decidedAt = new Date().toISOString();
    request.decidedBy = actor;
    if (status === 'approved') {
      const employee = getEmployee(request.employeeId);
      if (employee && request.type === 'annual') {
        employee.leave.annualTaken += request.days;
      }
    }
    db.audit.unshift({
      id: `aud_${Date.now()}`,
      actor,
      actorId: 'user_admin',
      action: `${status === 'approved' ? 'Approved' : 'Rejected'} ${request.type} leave for ${getEmployee(request.employeeId)?.firstName ?? 'employee'}`,
      entity: 'leave_request',
      entityId: id,
      at: new Date().toISOString(),
      ip: '10.0.4.18',
    });
    return request;
  });
}

export async function createLeaveRequest(input: {
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  handoverTo?: string;
}): Promise<LeaveRequest> {
  return write(() => {
    const days = Math.max(1, daysBetween(input.startDate, input.endDate) + 1);
    const request: LeaveRequest = {
      id: `lv_${Date.now()}`,
      employeeId: input.employeeId,
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      days,
      status: 'pending',
      reason: input.reason,
      submittedAt: new Date().toISOString(),
      handoverTo: input.handoverTo,
    };
    db.leave.unshift(request);
    return request;
  });
}

export async function cancelLeave(id: string) {
  return write(() => {
    const request = db.leave.find((r) => r.id === id);
    if (!request) throw new Error('Leave request not found');
    request.status = 'cancelled';
    return request;
  });
}

export async function upcomingAbsences(days = 21) {
  return request(() => {
    const from = todayISO();
    const to = addDaysISO(from, days);
    return db.leave
      .filter((r) => r.status !== 'rejected' && r.status !== 'cancelled' && r.endDate >= from && r.startDate <= to)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  });
}
