import type { AttendanceDay, Timesheet } from '@/types';
import { db } from '@/lib/mock/db';
import { request } from './api';

export async function attendanceFor(employeeId: string, limit = 30): Promise<AttendanceDay[]> {
  return request(() =>
    db.attendance
      .filter((a) => a.employeeId === employeeId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit),
  );
}

export async function todayAttendance(): Promise<AttendanceDay[]> {
  return request(() => {
    const latest = db.attendance[0]?.date;
    return latest ? db.attendance.filter((a) => a.date === latest) : [];
  });
}

export async function timesheets(): Promise<Timesheet[]> {
  return request(() => db.timesheets);
}

export async function attendanceSummary() {
  return request(() => {
    const latest = db.attendance[0]?.date;
    const rows = db.attendance.filter((a) => a.date === latest);
    const total = rows.length || 1;
    return {
      date: latest,
      present: rows.filter((r) => r.status === 'present').length,
      remote: rows.filter((r) => r.status === 'remote').length,
      late: rows.filter((r) => r.status === 'late').length,
      absent: rows.filter((r) => r.status === 'absent').length,
      onLeave: rows.filter((r) => r.status === 'leave').length,
      rate: Math.round(((rows.length - rows.filter((r) => r.status === 'absent').length) / total) * 100),
    };
  });
}
