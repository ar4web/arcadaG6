import { db } from '@/lib/mock/db';
import { request } from './api';

export async function listAudit(limit = 100) {
  return request(() => db.audit.slice(0, limit));
}

export async function auditStats() {
  return request(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: db.audit.length,
      today: db.audit.filter((a) => a.at.startsWith(today)).length,
      privileged: db.audit.filter((a) => a.action.includes('permission') || a.action.includes('salary')).length,
    };
  });
}
