import type { Department, Employee } from '@/types';
import { db, departmentMap, getEmployee } from '@/lib/mock/db';
import { request } from './api';
import { average } from '@/lib/utils';

export interface DepartmentSummary extends Department {
  headcount: number;
  headcountFte: number;
  head: Employee | undefined;
  avgEngagement: number;
  avgRating: number;
  attritionRisk: number;
  openRoles: number;
  payrollCost: number;
}

export async function listDepartments(): Promise<DepartmentSummary[]> {
  return request(() => {
    const active = db.employees.filter((e) => e.status !== 'terminated');
    return db.departments.map((dept) => {
      const people = active.filter((e) => e.departmentId === dept.id);
      return {
        ...dept,
        headcount: people.length,
        headcountFte: people.filter((p) => p.employmentType === 'full_time').length,
        head: getEmployee(dept.headId ?? null),
        avgEngagement: Math.round(average(people.map((p) => p.engagement)) * 10) / 10,
        avgRating: Math.round(average(people.map((p) => p.performance.rating)) * 10) / 10,
        attritionRisk: Math.round((people.filter((p) => p.flightRisk === 'high').length / Math.max(1, people.length)) * 100),
        openRoles: db.jobs.filter((j) => j.departmentId === dept.id && j.status === 'open').reduce((sum, j) => sum + (j.openings - j.filled), 0),
        payrollCost: people.reduce((sum, p) => sum + p.salary.basic + p.salary.housing + p.salary.transport + p.salary.allowances, 0),
      };
    });
  });
}

export async function getDepartment(id: string) {
  return request(() => departmentMap.get(id));
}
