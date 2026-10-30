import type { AnalyticsSnapshot, Employee } from '@/types';
import { analyticsFor, db } from '@/lib/mock/db';
import { request } from './api';

export async function snapshot(scope?: Employee[]): Promise<AnalyticsSnapshot> {
  return request(() => analyticsFor(scope), 160);
}

export async function flightRiskRegister() {
  return request(() =>
    db.employees
      .filter((e) => e.status !== 'terminated' && e.flightRisk !== 'low')
      .sort((a, b) => a.engagement - b.engagement)
      .slice(0, 12),
  );
}

export async function headcountByDepartmentTrend() {
  return request(() => {
    const active = db.employees.filter((e) => e.status !== 'terminated');
    return db.departments.map((dept) => {
      const people = active.filter((e) => e.departmentId === dept.id);
      return {
        department: dept.name,
        headcount: people.length,
        highPotential: people.filter((p) => p.performance.potential === 3).length,
        engagement: people.length ? Math.round((people.reduce((a, p) => a + p.engagement, 0) / people.length) * 10) / 10 : 0,
      };
    });
  });
}
