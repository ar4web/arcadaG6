import type { Goal, ReviewCycle } from '@/types';
import { db } from '@/lib/mock/db';
import { request } from './api';

export async function listCycles(): Promise<ReviewCycle[]> {
  return request(() => [...db.reviewCycles]);
}

export async function goalsFor(employeeId: string): Promise<Goal[]> {
  return request(() => db.goals.filter((g) => g.employeeId === employeeId));
}

export async function nineBox() {
  return request(() => {
    const active = db.employees.filter((e) => e.status !== 'terminated');
    const boxes: Record<string, { performance: number; potential: number; employees: typeof active }> = {};
    active.forEach((employee) => {
      const perf = employee.performance.rating >= 4.3 ? 3 : employee.performance.rating >= 3.4 ? 2 : 1;
      const key = `${perf}-${employee.performance.potential}`;
      boxes[key] ||= { performance: perf, potential: employee.performance.potential as number, employees: [] };
      boxes[key].employees.push(employee);
    });
    return boxes;
  });
}

export async function performanceByDepartment() {
  return request(() => {
    const active = db.employees.filter((e) => e.status !== 'terminated');
    return db.departments.map((dept) => {
      const people = active.filter((e) => e.departmentId === dept.id);
      return {
        department: dept.name,
        average: people.length ? Math.round((people.reduce((a, p) => a + p.performance.rating, 0) / people.length) * 100) / 100 : 0,
        high: people.filter((p) => p.performance.rating >= 4.3).length,
        low: people.filter((p) => p.performance.rating < 3).length,
        goals: people.length
          ? Math.round((people.reduce((a, p) => a + p.performance.goalsCompleted / p.performance.goalsTotal, 0) / people.length) * 100)
          : 0,
      };
    });
  });
}

export async function topPerformers(limit = 8) {
  return request(() =>
    db.employees
      .filter((e) => e.status !== 'terminated')
      .sort((a, b) => b.performance.rating - a.performance.rating)
      .slice(0, limit),
  );
}
