import type { ExpenseClaim, ExpenseStatus } from '@/types';
import { db } from '@/lib/mock/db';
import { request, write } from './api';

export async function listExpenses(filters: { status?: ExpenseStatus | 'all'; employeeId?: string } = {}) {
  return request(() => {
    let rows = [...db.expenses];
    if (filters.status && filters.status !== 'all') rows = rows.filter((r) => r.status === filters.status);
    if (filters.employeeId) rows = rows.filter((r) => r.employeeId === filters.employeeId);
    return rows.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  });
}

export async function expenseSummary() {
  return request(() => {
    const rows = db.expenses;
    const total = rows.reduce((a, r) => a + r.amount, 0);
    return {
      total,
      count: rows.length,
      awaiting: rows.filter((r) => r.status === 'submitted').length,
      awaitingValue: rows.filter((r) => r.status === 'submitted').reduce((a, r) => a + r.amount, 0),
      reimbursed: rows.filter((r) => r.status === 'reimbursed').reduce((a, r) => a + r.amount, 0),
      byCategory: ['travel', 'meals', 'equipment', 'training', 'medical', 'other'].map((category) => ({
        label: category,
        value: rows.filter((r) => r.category === category).reduce((a, r) => a + r.amount, 0),
      })),
    };
  });
}

export async function decideExpense(id: string, status: Extract<ExpenseStatus, 'approved' | 'rejected' | 'reimbursed'>) {
  return write(() => {
    const claim = db.expenses.find((r) => r.id === id);
    if (!claim) throw new Error('Expense claim not found');
    claim.status = status;
    claim.approvedBy = 'user_finance';
    return claim;
  });
}

export async function createExpense(input: Pick<ExpenseClaim, 'employeeId' | 'category' | 'description' | 'amount' | 'date'>) {
  return write(() => {
    const claim: ExpenseClaim = {
      id: `exp_${Date.now()}`,
      ...input,
      currency: 'SAR',
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };
    db.expenses.unshift(claim);
    return claim;
  });
}
