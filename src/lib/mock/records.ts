import type { AppNotification, AuditEvent, DocumentRecord, DocumentStatus } from '@/types';
import { EMPLOYEES } from './people';
import { pick, randomInt, seededRandom } from '@/lib/utils';
import { daysBetween } from '@/lib/utils';

const rand = seededRandom(90911);
const ACTIVE = EMPLOYEES.filter((e) => e.status !== 'terminated');
const TODAY = new Date('2026-10-31T00:00:00Z');
const iso = (d: Date) => d.toISOString().slice(0, 10);

export const DEMO = (() => {
  const hrAdmin = EMPLOYEES.find((e) => e.departmentId === 'people' && e.grade.startsWith('M')) ?? ACTIVE[0]!;
  const finance = EMPLOYEES.find((e) => e.departmentId === 'finance' && e.grade.startsWith('M')) ?? ACTIVE[1]!;
  const employee =
    EMPLOYEES.find((e) => e.departmentId === 'product' && e.grade === 'G4' && e.status === 'active') ?? ACTIVE[20]!;
  const recruiter = EMPLOYEES.find((e) => e.jobTitle.includes('Talent')) ?? hrAdmin;
  return { hrAdmin, finance, employee, recruiter };
})();

/* -------------------------------- Documents -------------------------------- */

function statusFor(expiresAt?: string): DocumentStatus {
  if (!expiresAt) return 'valid';
  const remaining = daysBetween(TODAY, expiresAt);
  if (remaining < 0) return 'expired';
  if (remaining < 45) return 'expiring';
  return 'valid';
}

const DOC_TYPES: { type: DocumentRecord['type']; label: string; bucket: DocumentRecord['filesBucket'] }[] = [
  { type: 'iqama', label: 'Iqama (residency permit)', bucket: 'hr-documents' },
  { type: 'passport', label: 'Passport copy', bucket: 'hr-documents' },
  { type: 'contract', label: 'Employment contract', bucket: 'contracts' },
  { type: 'insurance', label: 'Medical insurance card', bucket: 'hr-documents' },
  { type: 'national_id', label: 'National ID', bucket: 'hr-documents' },
  { type: 'certificate', label: 'Professional certificate', bucket: 'hr-documents' },
  { type: 'work_permit', label: 'Work permit', bucket: 'hr-documents' },
];

export const DOCUMENTS: DocumentRecord[] = [];
ACTIVE.slice(0, 120).forEach((employee) => {
  DOC_TYPES.forEach((doc, idx) => {
    if (doc.type === 'iqama' && employee.nationality === 'Saudi') return;
    if (doc.type === 'national_id' && employee.nationality !== 'Saudi') return;
    if (doc.type === 'work_permit' && employee.nationality === 'Saudi') return;
    if (idx > 3 && rand() < 0.55) return;

    const expiresAt =
      doc.type === 'iqama'
        ? employee.compliance.iqamaExpiry
        : doc.type === 'contract'
          ? employee.compliance.contractExpiry
          : doc.type === 'insurance'
            ? employee.compliance.insuranceExpiry
            : doc.type === 'passport'
              ? employee.compliance.passportExpiry
              : undefined;

    DOCUMENTS.push({
      id: `doc_${employee.id}_${doc.type}`,
      employeeId: employee.id,
      type: doc.type,
      name: `${doc.label} — ${employee.firstName} ${employee.lastName}`,
      issuedAt: iso(new Date(TODAY.getTime() - randomInt(rand, 200, 1400) * 86_400_000)),
      expiresAt,
      status: statusFor(expiresAt),
      sizeKb: randomInt(rand, 180, 4200),
      filesBucket: doc.bucket,
    });
  });
});

/* ------------------------------ Notifications ------------------------------ */

export const NOTIFICATIONS: AppNotification[] = [
  { id: 'ntf_1', kind: 'leave', title: '9 leave requests awaiting approval', body: 'The oldest request has been pending for 4 days. Avg. approval time is 1.8 days.', createdAt: new Date(TODAY.getTime() - 24 * 60 * 60_000).toISOString(), read: false, href: '/hr/leave?tab=pending', priority: 'high' },
  { id: 'ntf_2', kind: 'compliance', title: '7 iqamas expire within 45 days', body: 'Renewal documents must be lodged with Jawazat at least 3 weeks before expiry.', createdAt: new Date(TODAY.getTime() - 3 * 60 * 60_000).toISOString(), read: false, href: '/hr/compliance', priority: 'high' },
  { id: 'ntf_3', kind: 'payroll', title: 'October payroll run is ready for review', body: '194 employees · SAR 4.15M gross. Approve before the 28th to meet the WPS deadline.', createdAt: new Date(TODAY.getTime() - 5 * 60 * 60_000).toISOString(), read: false, href: '/finance/payroll', priority: 'high' },
  { id: 'ntf_4', kind: 'recruitment', title: 'Offer accepted — Senior Product Manager', body: 'Dana Refai accepted the offer. Contract generation is queued.', createdAt: new Date(TODAY.getTime() - 8 * 60 * 60_000).toISOString(), read: false, href: '/hr/recruitment', priority: 'normal' },
  { id: 'ntf_5', kind: 'expense', title: '6 expense claims need your review', body: 'Total value SAR 18,420. Two claims are missing receipts.', createdAt: new Date(TODAY.getTime() - 26 * 60 * 60_000).toISOString(), read: true, href: '/finance/expenses', priority: 'normal' },
  { id: 'ntf_6', kind: 'invoice', title: '4 invoices are overdue', body: 'SAR 412,500 outstanding past 30 days. ZATCA status is reported for all four.', createdAt: new Date(TODAY.getTime() - 30 * 60 * 60_000).toISOString(), read: true, href: '/finance/invoices', priority: 'normal' },
  { id: 'ntf_7', kind: 'system', title: 'GOSI contribution file accepted', body: 'September 2026 filing was accepted by the GOSI portal at 09:14.', createdAt: new Date(TODAY.getTime() - 50 * 60 * 60_000).toISOString(), read: true, href: '/finance/compliance', priority: 'normal' },
  { id: 'ntf_8', kind: 'leave', title: 'Leave balance policy updated', body: 'Carry-over cap changed from 10 to 15 days effective 1 January 2027.', createdAt: new Date(TODAY.getTime() - 74 * 60 * 60_000).toISOString(), read: true, href: '/hr/settings', priority: 'normal' },
];

export const NOTIFICATION_SEED = NOTIFICATIONS;

/* ---------------------------------- Audit ---------------------------------- */

const AUDIT_ACTIONS: { action: string; entity: string }[] = [
  { action: 'Approved annual leave request', entity: 'leave_request' },
  { action: 'Created employee record', entity: 'employee' },
  { action: 'Updated salary for', entity: 'employee' },
  { action: 'Exported payroll register', entity: 'payroll_run' },
  { action: 'Submitted WPS file to bank', entity: 'payroll_run' },
  { action: 'Generated offer letter', entity: 'candidate' },
  { action: 'Moved candidate to interview', entity: 'candidate' },
  { action: 'Uploaded iqama renewal', entity: 'document' },
  { action: 'Filed GOSI contribution', entity: 'gosi_period' },
  { action: 'Changed permission matrix', entity: 'role' },
  { action: 'Rejected expense claim', entity: 'expense' },
  { action: 'Issued ZATCA invoice', entity: 'invoice' },
  { action: 'Archived job opening', entity: 'job' },
  { action: 'Signed in with Google SSO', entity: 'session' },
];

const ACTORS = [
  { name: 'Noura Al-Otaibi', id: DEMO.hrAdmin.id },
  { name: 'Khalid Al-Harbi', id: DEMO.finance.id },
  { name: 'Sara Al-Zahrani', id: DEMO.recruiter.id },
  { name: 'System', id: 'system' },
  { name: 'Abdullah Al-Qahtani', id: ACTIVE[5]!.id },
];

export const AUDIT_EVENTS: AuditEvent[] = Array.from({ length: 64 }, (_, i) => {
  const seed = pick(AUDIT_ACTIONS, rand);
  const actor = pick(ACTORS, rand);
  const target = ACTIVE[randomInt(rand, 0, ACTIVE.length - 1)]!;
  return {
    id: `aud_${2000 + i}`,
    actor: actor.name,
    actorId: actor.id,
    action: seed.entity === 'employee' || seed.entity === 'leave_request' ? `${seed.action} ${target.firstName} ${target.lastName}` : seed.action,
    entity: seed.entity,
    entityId: `ent_${randomInt(rand, 1000, 9999)}`,
    at: new Date(TODAY.getTime() - i * randomInt(rand, 40, 260) * 60_000).toISOString(),
    ip: `10.${randomInt(rand, 0, 40)}.${randomInt(rand, 0, 255)}.${randomInt(rand, 2, 250)}`,
  };
});
