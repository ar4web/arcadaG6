import { db } from '@/lib/mock/db';

/** Live badge counts for the shell. Phase 2 replaces this with a realtime query. */
export function useShellCounts() {
  return {
    pendingLeave: db.leave.filter((r) => r.status === 'pending').length,
    pendingExpenses: db.expenses.filter((r) => r.status === 'submitted').length,
  };
}
