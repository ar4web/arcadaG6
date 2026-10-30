
import { db } from '@/lib/mock/db';
import { request } from './api';

export async function listDocuments(filters: { employeeId?: string; type?: string } = {}) {
  return request(() => {
    let rows = [...db.documents];
    if (filters.employeeId) rows = rows.filter((d) => d.employeeId === filters.employeeId);
    if (filters.type && filters.type !== 'all') rows = rows.filter((d) => d.type === filters.type);
    return rows;
  });
}

export async function expiringDocuments(days = 60) {
  return request(() => db.documents.filter((d) => d.status === 'expiring' || d.status === 'expired'), days);
}

export async function documentSummary() {
  return request(() => {
    const rows = db.documents;
    return {
      total: rows.length,
      valid: rows.filter((d) => d.status === 'valid').length,
      expiring: rows.filter((d) => d.status === 'expiring').length,
      expired: rows.filter((d) => d.status === 'expired').length,
      missing: rows.filter((d) => d.status === 'missing').length,
    };
  });
}
