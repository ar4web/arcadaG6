import { WORKSPACE } from '@/lib/mock/master';
import { request, write } from './api';

export interface WorkspaceSettings {
  name: string;
  nameAr: string;
  vatNumber: string;
  crNumber: string;
  gosiNumber: string;
  timezone: string;
  workweek: string;
  annualEntitlement: number;
  carryOverCap: number;
  probationDays: number;
  gosiEnabled: boolean;
  wpsEnabled: boolean;
  zatcaEnabled: boolean;
  pdplConsent: boolean;
  emailDigest: boolean;
}

const DEFAULTS: WorkspaceSettings = {
  name: WORKSPACE.name,
  nameAr: WORKSPACE.nameAr,
  vatNumber: WORKSPACE.vatNumber,
  crNumber: WORKSPACE.crNumber,
  gosiNumber: WORKSPACE.gosiNumber,
  timezone: WORKSPACE.timezone,
  workweek: 'sunday–thursday',
  annualEntitlement: 30,
  carryOverCap: 15,
  probationDays: 90,
  gosiEnabled: true,
  wpsEnabled: true,
  zatcaEnabled: true,
  pdplConsent: true,
  emailDigest: true,
};

export async function getSettings(): Promise<WorkspaceSettings> {
  return request(() => {
    const raw = localStorage.getItem('arcada.settings');
    if (!raw) return DEFAULTS;
    try {
      return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<WorkspaceSettings>) };
    } catch {
      return DEFAULTS;
    }
  }, 30);
}

export async function updateSettings(patch: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
  return write(() => {
    const raw = localStorage.getItem('arcada.settings');
    const current = raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<WorkspaceSettings>) } : DEFAULTS;
    const next = { ...current, ...patch };
    localStorage.setItem('arcada.settings', JSON.stringify(next));
    return next;
  });
}
