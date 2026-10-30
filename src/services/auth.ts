import type { RoleId, SessionUser } from '@/types';
import { sessionFor } from '@/lib/mock/db';
import { ApiError, request, write } from './api';

const STORAGE_KEY = 'arcada.session';

export async function getSession(): Promise<SessionUser | null> {
  return request(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { role: RoleId };
      return sessionFor(parsed.role);
    } catch {
      return null;
    }
  }, 20);
}

export async function signIn(input: {
  email?: string;
  phone?: string;
  password?: string;
  provider: SessionUser['authProvider'];
  role?: RoleId;
}): Promise<SessionUser> {
  return write(() => {
    if (input.provider === 'email' && (!input.email || !input.password)) {
      throw new ApiError('Enter your work email and password.', 'validation');
    }
    if (input.provider === 'phone' && !input.phone) {
      throw new ApiError('Enter the mobile number registered with your account.', 'validation');
    }
    const role = input.role ?? 'admin';
    const session = sessionFor(role);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ role }));
    return session;
  });
}

export async function signOut() {
  return write(() => {
    localStorage.removeItem(STORAGE_KEY);
  });
}

export async function switchRole(role: RoleId): Promise<SessionUser> {
  return write(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ role }));
    return sessionFor(role);
  });
}

export async function enrollMfa(): Promise<{ secret: string; recoveryCodes: string[] }> {
  return write(() => ({
    secret: 'JBSW Y3DP EHPK 3PXP',
    recoveryCodes: Array.from({ length: 6 }, (_, i) => `ARC-${2400 + i}-${(i * 7331).toString(36).toUpperCase()}`),
  }));
}
