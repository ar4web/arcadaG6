import type { Department, Location, Role, RoleId, LeaveType } from '@/types';

/** Reference data. In Phase 2 these become Supabase lookup tables. */

export const WORKSPACE = {
  id: 'qimma',
  name: 'Qimma Group',
  nameAr: 'مجموعة قِمّة',
  legalName: 'Qimma Group Holding Company',
  vatNumber: '310123456700003',
  crNumber: '1010456789',
  gosiNumber: 'GOSI-8823140',
  city: 'Riyadh',
  country: 'SA',
  timezone: 'Asia/Riyadh',
  fiscalYearStart: '01-01',
  workweek: 'sun-thu',
} as const;

export const DEPARTMENTS: Department[] = [
  { id: 'tech', name: 'Technology', nameAr: 'التقنية', code: 'TECH', colorVar: 'chart-1', headId: null, costCenter: 'CC-1001', budget: 14_800_000 },
  { id: 'product', name: 'Product & Design', nameAr: 'المنتجات والتصميم', code: 'PROD', colorVar: 'chart-2', headId: null, costCenter: 'CC-1002', budget: 7_400_000 },
  { id: 'sales', name: 'Sales', nameAr: 'المبيعات', code: 'SLS', colorVar: 'chart-3', headId: null, costCenter: 'CC-1003', budget: 9_200_000 },
  { id: 'marketing', name: 'Marketing', nameAr: 'التسويق', code: 'MKT', colorVar: 'chart-4', headId: null, costCenter: 'CC-1004', budget: 5_100_000 },
  { id: 'finance', name: 'Finance', nameAr: 'المالية', code: 'FIN', colorVar: 'chart-5', headId: null, costCenter: 'CC-1005', budget: 4_300_000 },
  { id: 'people', name: 'People & Culture', nameAr: 'الموارد البشرية', code: 'PPL', colorVar: 'chart-6', headId: null, costCenter: 'CC-1006', budget: 3_600_000 },
  { id: 'operations', name: 'Operations', nameAr: 'العمليات', code: 'OPS', colorVar: 'chart-7', headId: null, costCenter: 'CC-1007', budget: 6_700_000 },
  { id: 'legal', name: 'Legal & Compliance', nameAr: 'الشؤون القانونية والامتثال', code: 'LEG', colorVar: 'chart-8', headId: null, costCenter: 'CC-1008', budget: 2_900_000 },
];

export const LOCATIONS: Location[] = [
  { id: 'riyadh', name: 'Riyadh HQ', nameAr: 'المقر الرئيسي - الرياض', city: 'Riyadh', country: 'SA', timezone: 'Asia/Riyadh' },
  { id: 'jeddah', name: 'Jeddah Branch', nameAr: 'فرع جدة', city: 'Jeddah', country: 'SA', timezone: 'Asia/Riyadh' },
  { id: 'dammam', name: 'Dammam Hub', nameAr: 'مركز الدمام', city: 'Dammam', country: 'SA', timezone: 'Asia/Riyadh' },
  { id: 'remote', name: 'Remote — KSA', nameAr: 'عن بُعد - السعودية', city: 'Distributed', country: 'SA', timezone: 'Asia/Riyadh' },
];

export const LEAVE_TYPES: { id: LeaveType; en: string; ar: string; tone: 'primary' | 'accent' | 'info' | 'warning' | 'danger' }[] = [
  { id: 'annual', en: 'Annual leave', ar: 'إجازة سنوية', tone: 'primary' },
  { id: 'sick', en: 'Sick leave', ar: 'إجازة مرضية', tone: 'danger' },
  { id: 'unpaid', en: 'Unpaid leave', ar: 'إجازة بدون راتب', tone: 'info' },
  { id: 'maternity', en: 'Maternity leave', ar: 'إجازة أمومة', tone: 'accent' },
  { id: 'paternity', en: 'Paternity leave', ar: 'إجازة أبوة', tone: 'accent' },
  { id: 'hajj', en: 'Hajj leave', ar: 'إجازة حج', tone: 'warning' },
  { id: 'marriage', en: 'Marriage leave', ar: 'إجازة زواج', tone: 'info' },
  { id: 'bereavement', en: 'Bereavement', ar: 'إجازة وفاة', tone: 'info' },
];

export const PERMISSIONS_BY_ROLE: Record<RoleId, Role['permissions']> = {
  admin: [
    'employees.read', 'employees.write', 'employees.delete', 'leave.approve', 'payroll.read',
    'payroll.write', 'payroll.approve', 'finance.read', 'finance.write', 'recruitment.write',
    'performance.write', 'compliance.read', 'settings.write', 'audit.read',
  ],
  hr_manager: [
    'employees.read', 'employees.write', 'leave.approve', 'payroll.read', 'compliance.read',
    'recruitment.write', 'performance.write', 'audit.read', 'finance.read',
  ],
  recruiter: ['employees.read', 'recruitment.write'],
  finance: ['employees.read', 'payroll.read', 'payroll.write', 'payroll.approve', 'finance.read', 'finance.write', 'compliance.read'],
  manager: ['employees.read', 'leave.approve', 'performance.write'],
  employee: [],
};

export const ROLES: Role[] = [
  { id: 'admin', name: 'Workspace admin', description: 'Unrestricted access across all three apps.', apps: ['hr', 'ess', 'finance'], permissions: PERMISSIONS_BY_ROLE.admin },
  { id: 'hr_manager', name: 'HR manager', description: 'People operations, recruitment and performance.', apps: ['hr', 'ess'], permissions: PERMISSIONS_BY_ROLE.hr_manager },
  { id: 'recruiter', name: 'Recruiter', description: 'Pipeline and job openings only.', apps: ['hr', 'ess'], permissions: PERMISSIONS_BY_ROLE.recruiter },
  { id: 'finance', name: 'Finance controller', description: 'Payroll, expenses, invoicing and GOSI.', apps: ['finance', 'ess'], permissions: PERMISSIONS_BY_ROLE.finance },
  { id: 'manager', name: 'Line manager', description: 'Team leave approvals and reviews.', apps: ['hr', 'ess'], permissions: PERMISSIONS_BY_ROLE.manager },
  { id: 'employee', name: 'Employee', description: 'Self-service portal only.', apps: ['ess'], permissions: PERMISSIONS_BY_ROLE.employee },
];

export const NATIONALITIES: { en: string; ar: string; saudi: boolean; weight: number }[] = [
  { en: 'Saudi', ar: 'سعودي', saudi: true, weight: 58 },
  { en: 'Egyptian', ar: 'مصري', saudi: false, weight: 9 },
  { en: 'Indian', ar: 'هندي', saudi: false, weight: 8 },
  { en: 'Pakistani', ar: 'باكستاني', saudi: false, weight: 5 },
  { en: 'Jordanian', ar: 'أردني', saudi: false, weight: 4 },
  { en: 'Filipino', ar: 'فلبيني', saudi: false, weight: 3 },
  { en: 'Lebanese', ar: 'لبناني', saudi: false, weight: 3 },
  { en: 'Sudanese', ar: 'سوداني', saudi: false, weight: 2 },
  { en: 'Syrian', ar: 'سوري', saudi: false, weight: 2 },
  { en: 'British', ar: 'بريطاني', saudi: false, weight: 2 },
  { en: 'Yemeni', ar: 'يمني', saudi: false, weight: 1 },
  { en: 'Turkish', ar: 'تركي', saudi: false, weight: 1 },
  { en: 'American', ar: 'أمريكي', saudi: false, weight: 1 },
  { en: 'Indonesian', ar: 'إندونيسي', saudi: false, weight: 1 },
];

export const BANKS = [
  { name: 'Al Rajhi Bank', code: 'RJHI' },
  { name: 'Saudi National Bank', code: 'SNB' },
  { name: 'Riyad Bank', code: 'RIBL' },
  { name: 'Banque Saudi Fransi', code: 'BSFR' },
  { name: 'Saudi Awwal Bank', code: 'SABB' },
  { name: 'Alinma Bank', code: 'ALIN' },
  { name: 'Bank Albilad', code: 'ALBI' },
];

export const GRADES = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'M1', 'M2'] as const;

/** Basic salary bands per grade, in SAR/month. */
export const GRADE_BANDS: Record<string, [number, number]> = {
  G1: [5_500, 8_500],
  G2: [8_500, 13_000],
  G3: [13_000, 19_000],
  G4: [19_000, 28_000],
  G5: [28_000, 40_000],
  G6: [40_000, 58_000],
  M1: [45_000, 68_000],
  M2: [70_000, 105_000],
};

export const SAUDI_HOLIDAYS = [
  { date: '2026-02-20', name: 'Founding Day', nameAr: 'يوم التأسيس' },
  { date: '2026-03-20', name: 'Eid Al-Fitr', nameAr: 'عيد الفطر' },
  { date: '2026-05-27', name: 'Eid Al-Adha', nameAr: 'عيد الأضحى' },
  { date: '2026-09-23', name: 'National Day', nameAr: 'اليوم الوطني' },
];
