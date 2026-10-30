import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

/** Service-role client — bypasses RLS, so every handler must authorise first. */
export function adminClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Caller-scoped client, so RLS still applies to user reads. */
export function callerClient(request: Request): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const authorization = request.headers.get('Authorization') ?? '';
  return createClient(url, anon, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
}

export async function requireUser(request: Request) {
  const client = callerClient(request);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error('unauthorized');
  return data.user;
}
