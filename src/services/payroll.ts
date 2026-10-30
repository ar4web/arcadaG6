import type { Payslip, PayrollRun } from '@/types';
import { db, getEmployee } from '@/lib/mock/db';
import { request, write } from './api';

export async function listPayrollRuns(): Promise<PayrollRun[]> {
  return request(() => [...db.payrollRuns].reverse());
}

export async function getPayrollRun(id: string): Promise<PayrollRun | undefined> {
  return request(() => db.payrollRuns.find((r) => r.id === id));
}

export async function currentPayrollRun(): Promise<PayrollRun> {
  return request(() => db.payrollRuns[db.payrollRuns.length - 1]!);
}

export async function payslipsFor(employeeId: string): Promise<Payslip[]> {
  return request(() =>
    db.payslips.filter((p) => p.employeeId === employeeId).sort((a, b) => b.period.localeCompare(a.period)),
  );
}

export async function payslip(employeeId: string, period: string) {
  return request(() => db.payslips.find((p) => p.employeeId === employeeId && p.period === period));
}

export async function approveRun(id: string, actor = 'Finance controller') {
  return write(() => {
    const run = db.payrollRuns.find((r) => r.id === id);
    if (!run) throw new Error('Payroll run not found');
    run.status = 'approved';
    db.audit.unshift({
      id: `aud_${Date.now()}`,
      actor,
      actorId: 'user_finance',
      action: `Approved payroll run ${run.period}`,
      entity: 'payroll_run',
      entityId: id,
      at: new Date().toISOString(),
      ip: '10.0.7.22',
    });
    return run;
  });
}

export async function submitWps(id: string) {
  return write(() => {
    const run = db.payrollRuns.find((r) => r.id === id);
    if (!run) throw new Error('Payroll run not found');
    run.wpsSubmitted = true;
    run.status = 'paid';
    run.paidAt = new Date().toISOString();
    return run;
  });
}

export async function payrollRegister(runId: string) {
  return request(() => {
    const run = db.payrollRuns.find((r) => r.id === runId);
    if (!run) return [];
    return db.employees
      .filter((e) => e.status !== 'terminated')
      .map((e) => {
        const gross = e.salary.basic + e.salary.housing + e.salary.transport + e.salary.allowances;
        const gosi = e.nationality === 'Saudi' ? Math.round((e.salary.basic + e.salary.housing) * 0.0975) : 0;
        return { employee: e, gross, gosi, net: gross - gosi, iban: e.iban, bank: e.bankName };
      });
  });
}

export async function payslipForPeriod(employeeId: string, period: string) {
  return request(() => {
    const employee = getEmployee(employeeId);
    const slip = db.payslips.find((p) => p.employeeId === employeeId && p.period === period);
    return { employee, slip };
  });
}
