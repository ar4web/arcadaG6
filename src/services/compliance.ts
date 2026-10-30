import { db } from '@/lib/mock/db';
import { request } from './api';

export async function gosiPeriods() {
  return request(() => [...db.gosi].reverse());
}

export async function complianceOverview() {
  return request(() => {
    const active = db.employees.filter((e) => e.status !== 'terminated');
    const saudis = active.filter((e) => e.nationality === 'Saudi').length;
    return {
      nitaqatBand: 'Platinum',
      saudization: Math.round((saudis / Math.max(1, active.length)) * 1000) / 10,
      saudis,
      expats: active.length - saudis,
      iqamaExpiring: db.documents.filter((d) => d.type === 'iqama' && d.status === 'expiring').length,
      iqamaExpired: db.documents.filter((d) => d.type === 'iqama' && d.status === 'expired').length,
      contractsExpiring: active.filter((e) => e.compliance.contractExpiry && new Date(e.compliance.contractExpiry) < new Date('2027-03-01')).length,
      gosiStatus: db.gosi[db.gosi.length - 1]?.status ?? 'filed',
      wpsStatus: db.payrollRuns[db.payrollRuns.length - 1]?.wpsSubmitted ? 'submitted' : 'pending',
    };
  });
}

export async function saudizationByDepartment() {
  return request(() => {
    const active = db.employees.filter((e) => e.status !== 'terminated');
    return db.departments.map((dept) => {
      const people = active.filter((e) => e.departmentId === dept.id);
      const saudis = people.filter((p) => p.nationality === 'Saudi').length;
      return {
        department: dept.name,
        saudis,
        expats: people.length - saudis,
        rate: people.length ? Math.round((saudis / people.length) * 100) : 0,
        target: 40,
      };
    });
  });
}
