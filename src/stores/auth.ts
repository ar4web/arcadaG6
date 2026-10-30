import { create } from 'zustand';
import type { RoleId, SessionUser } from '@/types';
import { getSession, signIn as apiSignIn, signOut as apiSignOut, switchRole as apiSwitchRole } from '@/services/auth';
import { sessionFor } from '@/lib/mock/db';

interface AuthState {
  session: SessionUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'anonymous';
  hydrate: () => Promise<void>;
  signIn: (input: Parameters<typeof apiSignIn>[0]) => Promise<SessionUser>;
  signOut: () => Promise<void>;
  switchRole: (role: RoleId) => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const ROLE_PERMISSIONS: Record<RoleId, string[]> = {
  admin: ['*'],
  hr_manager: ['employees.read', 'employees.write', 'leave.approve', 'payroll.read', 'compliance.read', 'recruitment.write', 'performance.write', 'audit.read', 'finance.read'],
  recruiter: ['employees.read', 'recruitment.write'],
  finance: ['employees.read', 'payroll.read', 'payroll.write', 'payroll.approve', 'finance.read', 'finance.write', 'compliance.read'],
  manager: ['employees.read', 'leave.approve', 'performance.write'],
  employee: [],
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  status: 'idle',
  hydrate: async () => {
    if (get().status === 'loading') return;
    set({ status: 'loading' });
    const session = await getSession();
    // A preview workspace always has an identity; /signin can replace it.
    set({ session: session ?? sessionFor('admin'), status: 'authenticated' });
  },
  signIn: async (input) => {
    set({ status: 'loading' });
    const session = await apiSignIn(input);
    set({ session, status: 'authenticated' });
    return session;
  },
  signOut: async () => {
    await apiSignOut();
    set({ session: null, status: 'anonymous' });
  },
  switchRole: async (role) => {
    const session = await apiSwitchRole(role);
    set({ session });
  },
  hasPermission: (permission) => {
    const role = get().session?.role;
    if (!role) return false;
    const permissions = ROLE_PERMISSIONS[role] ?? [];
    return permissions.includes('*') || permissions.includes(permission);
  },
}));
