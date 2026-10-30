import {
  BarChart3,
  Banknote,
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Clock4,
  FileSpreadsheet,
  FileText,
  Fingerprint,
  Goal,
  LayoutDashboard,
  Receipt,
  ScrollText,
  Settings2,
  ShieldCheck,
  UserRound,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react';
import type { AppId, Permission } from '@/types';

export interface NavItem {
  key: string;
  /** i18n key under `nav.*` */
  labelKey: string;
  path: string;
  icon: typeof LayoutDashboard;
  permission?: Permission;
  badge?: 'pendingLeave' | 'pendingExpenses';
}

export interface NavGroup {
  key: string;
  labelKey: string;
  items: NavItem[];
}

export const NAV: Record<AppId, NavGroup[]> = {
  hr: [
    {
      key: 'work',
      labelKey: 'groups.work',
      items: [
        { key: 'overview', labelKey: 'nav.overview', path: '/hr', icon: LayoutDashboard },
        { key: 'people', labelKey: 'nav.directory', path: '/hr/people', icon: Users, permission: 'employees.read' },
        { key: 'org', labelKey: 'nav.orgChart', path: '/hr/org', icon: Building2, permission: 'employees.read' },
      ],
    },
    {
      key: 'workforce',
      labelKey: 'groups.workforce',
      items: [
        { key: 'leave', labelKey: 'nav.leave', path: '/hr/leave', icon: CalendarDays, badge: 'pendingLeave' },
        { key: 'attendance', labelKey: 'nav.attendance', path: '/hr/attendance', icon: Clock4 },
        { key: 'recruitment', labelKey: 'nav.recruitment', path: '/hr/recruitment', icon: UsersRound, permission: 'recruitment.write' },
        { key: 'performance', labelKey: 'nav.performance', path: '/hr/performance', icon: Goal, permission: 'performance.write' },
      ],
    },
    {
      key: 'operations',
      labelKey: 'groups.operations',
      items: [
        { key: 'analytics', labelKey: 'nav.analytics', path: '/hr/analytics', icon: BarChart3 },
        { key: 'compliance', labelKey: 'nav.compliance', path: '/hr/compliance', icon: ShieldCheck, permission: 'compliance.read' },
        { key: 'documents', labelKey: 'nav.documents', path: '/hr/documents', icon: FileText },
      ],
    },
    {
      key: 'admin',
      labelKey: 'groups.admin',
      items: [
        { key: 'settings', labelKey: 'nav.settings', path: '/hr/settings', icon: Settings2, permission: 'settings.write' },
        { key: 'audit', labelKey: 'nav.audit', path: '/hr/audit', icon: ScrollText, permission: 'audit.read' },
      ],
    },
  ],
  ess: [
    {
      key: 'me',
      labelKey: 'groups.me',
      items: [
        { key: 'home', labelKey: 'nav.myHome', path: '/me', icon: LayoutDashboard },
        { key: 'my-leave', labelKey: 'nav.myLeave', path: '/me/leave', icon: CalendarDays },
        { key: 'my-payslips', labelKey: 'nav.myPayslips', path: '/me/payslips', icon: Receipt },
        { key: 'my-attendance', labelKey: 'nav.myAttendance', path: '/me/attendance', icon: Fingerprint },
        { key: 'my-profile', labelKey: 'nav.myProfile', path: '/me/profile', icon: UserRound },
      ],
    },
    {
      key: 'work',
      labelKey: 'groups.work',
      items: [
        { key: 'my-expenses', labelKey: 'nav.expenses', path: '/me/expenses', icon: Banknote },
        { key: 'my-goals', labelKey: 'nav.performance', path: '/me/goals', icon: Goal },
        { key: 'my-docs', labelKey: 'nav.documents', path: '/me/documents', icon: FileText },
      ],
    },
  ],
  finance: [
    {
      key: 'work',
      labelKey: 'groups.work',
      items: [
        { key: 'finance-overview', labelKey: 'nav.overview', path: '/finance', icon: LayoutDashboard },
        { key: 'payroll', labelKey: 'nav.payroll', path: '/finance/payroll', icon: Wallet, permission: 'payroll.read' },
        { key: 'expenses', labelKey: 'nav.expenses', path: '/finance/expenses', icon: Banknote, badge: 'pendingExpenses' },
      ],
    },
    {
      key: 'money',
      labelKey: 'groups.money',
      items: [
        { key: 'invoices', labelKey: 'nav.invoices', path: '/finance/invoices', icon: FileSpreadsheet, permission: 'finance.read' },
        { key: 'gosi', labelKey: 'nav.compliance', path: '/finance/compliance', icon: ShieldCheck, permission: 'compliance.read' },
        { key: 'reports', labelKey: 'nav.reports', path: '/finance/reports', icon: ClipboardList },
      ],
    },
    {
      key: 'operations',
      labelKey: 'groups.operations',
      items: [{ key: 'attendance-finance', labelKey: 'nav.attendance', path: '/finance/attendance', icon: CalendarCheck }],
    },
  ],
};

export const APP_META: Record<AppId, { labelKey: string; path: string; short: string }> = {
  hr: { labelKey: 'app.hr', path: '/hr', short: 'HR' },
  ess: { labelKey: 'app.ess', path: '/me', short: 'ME' },
  finance: { labelKey: 'app.finance', path: '/finance', short: 'FIN' },
};

export function appForPath(pathname: string): AppId {
  if (pathname.startsWith('/finance')) return 'finance';
  if (pathname.startsWith('/me')) return 'ess';
  return 'hr';
}

export function navItemForPath(app: AppId, pathname: string) {
  const groups = NAV[app];
  for (const group of groups) {
    for (const item of group.items) {
      if (item.path === pathname) return item;
      if (item.path !== `/${app}` && pathname.startsWith(`${item.path}/`)) return item;
    }
  }
  return undefined;
}

export const HR_APP: AppId = 'hr';
