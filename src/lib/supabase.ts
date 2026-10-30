import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Supabase access point.
 *
 * Phase 1 ships with `VITE_DATA_SOURCE=mock`, so the client is never created
 * and the workspace renders from `src/lib/mock`. Phase 2 flips the switch; a
 * missing URL/key throws loudly instead of silently serving empty screens.
 */

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const requestedSource = (import.meta.env.VITE_DATA_SOURCE ?? 'mock').trim();

export type DataSource = 'mock' | 'supabase';

export const dataSource: DataSource = requestedSource === 'supabase' ? 'supabase' : 'mock';

/** True only when the app is configured *and* pointed at a real backend. */
export const isSupabaseEnabled = dataSource === 'supabase' && Boolean(url && anonKey);

let client: SupabaseClient<Database> | null = null;

export function supabase(): SupabaseClient<Database> {
  if (!isSupabaseEnabled) {
    throw new Error('Supabase is not configured. Set VITE_DATA_SOURCE=supabase plus VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  if (!client) {
    client = createClient<Database>(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'arcada.session',
      },
      global: { headers: { 'x-application-name': 'arcada-workspace' } },
      db: { schema: 'public' },
    });
  }
  return client;
}

export function resetSupabaseClient() {
  client = null;
}
