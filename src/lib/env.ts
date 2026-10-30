/** Typed, validated access to the build-time environment. */

interface AppEnv {
  supabaseUrl: string | undefined;
  supabaseAnonKey: string | undefined;
  dataSource: 'mock' | 'supabase';
  appName: string;
  version: string;
  locale: 'en' | 'ar';
  timezone: string;
}

const rawSource = (import.meta.env.VITE_DATA_SOURCE ?? 'mock').trim();
const rawLocale = (import.meta.env.VITE_DEFAULT_LOCALE ?? 'en').trim();

export const env: AppEnv = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.trim() || undefined,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || undefined,
  dataSource: rawSource === 'supabase' ? 'supabase' : 'mock',
  appName: import.meta.env.VITE_APP_NAME?.trim() || 'Qimma Group',
  version: typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.1.0',
  locale: rawLocale === 'ar' ? 'ar' : 'en',
  timezone: import.meta.env.VITE_DEFAULT_TIMEZONE?.trim() || 'Asia/Riyadh',
};

/** Fail fast at boot if the app is pointed at Supabase without credentials. */
export function assertEnvironment(): string[] {
  const problems: string[] = [];
  if (env.dataSource === 'supabase') {
    if (!env.supabaseUrl) problems.push('VITE_SUPABASE_URL is required when VITE_DATA_SOURCE=supabase');
    if (!env.supabaseAnonKey) problems.push('VITE_SUPABASE_ANON_KEY is required when VITE_DATA_SOURCE=supabase');
  }
  return problems;
}
