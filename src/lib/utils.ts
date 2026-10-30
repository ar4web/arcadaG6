import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNowStrict, parseISO, differenceInCalendarDays } from 'date-fns';
import { arSA, enGB } from 'date-fns/locale';
import type { Locale } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const localeMap = { en: enGB, ar: arSA } as const;
const intlLocale = { en: 'en-GB', ar: 'ar-SA' } as const;

export function dateLocale(locale: Locale = 'en') {
  return localeMap[locale];
}

export function toDate(value: string | Date) {
  return value instanceof Date ? value : parseISO(value);
}

export function formatDate(value: string | Date | undefined, pattern = 'd MMM yyyy', locale: Locale = 'en') {
  if (!value) return '—';
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, pattern, { locale: dateLocale(locale) });
}

export function formatHijri(value: string | Date | undefined) {
  if (!value) return '—';
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function relativeTime(value: string | Date, locale: Locale = 'en') {
  const date = toDate(value);
  return formatDistanceToNowStrict(date, { addSuffix: true, locale: dateLocale(locale) });
}

export function daysBetween(a: string | Date, b: string | Date) {
  return differenceInCalendarDays(toDate(b), toDate(a));
}

/**
 * The workspace clock. Rendering against a fixed "today" keeps snapshots,
 * tests and demo data stable — swap this for the server clock when the API
 * layer lands.
 */
export const TODAY_ISO = '2026-10-31';
export const TODAY = new Date(`${TODAY_ISO}T00:00:00Z`);

/** Signed calendar days from the workspace today to `target` (negative = past). */
export function daysFromToday(target: string | Date | undefined | null) {
  if (!target) return undefined;
  return differenceInCalendarDays(toDate(target), TODAY);
}

export function formatNumber(value: number, locale: Locale = 'en', options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(intlLocale[locale], options).format(value);
}

export function compact(value: number, locale: Locale = 'en') {
  return new Intl.NumberFormat(intlLocale[locale], {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatSAR(value: number, locale: Locale = 'en', options?: { compact?: boolean; decimals?: 0 | 2 }) {
  const decimals = options?.decimals ?? 0;
  if (options?.compact && Math.abs(value) >= 10_000) {
    return `${compact(value, locale)} ﷼`;
  }
  return new Intl.NumberFormat(intlLocale[locale], {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    currencyDisplay: 'narrowSymbol',
  }).format(value);
}

export function formatPercent(value: number, locale: Locale = 'en', decimals = 1) {
  return new Intl.NumberFormat(intlLocale[locale], {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

export function formatHours(value: number, locale: Locale = 'en') {
  return `${formatNumber(value, locale, { maximumFractionDigits: 1 })}h`;
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function groupBy<T, K extends string | number>(items: T[], key: (item: T) => K) {
  return items.reduce<Record<K, T[]>>(
    (acc, item) => {
      const k = key(item);
      (acc[k] ||= []).push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}

export function sum(values: number[]) {
  return values.reduce((a, b) => a + b, 0);
}

export function average(values: number[]) {
  return values.length ? sum(values) / values.length : 0;
}

export function pctChange(current: number, previous: number) {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

/** Mask an IBAN for display: SA•• •••• 1234 */
export function maskIban(iban: string) {
  const clean = iban.replace(/\s+/g, '');
  return `${clean.slice(0, 2)}•• •••• ${clean.slice(-4)}`;
}

export function maskNationalId(id: string) {
  return id.length > 4 ? `${'•'.repeat(id.length - 4)}${id.slice(-4)}` : id;
}

export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Deterministic pseudo-random generator so mock data is stable across reloads. */
export function seededRandom(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function pick<T>(items: readonly T[], rand: () => number): T {
  return items[Math.floor(rand() * items.length)]!;
}

export function randomInt(rand: () => number, min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

export function addDaysISO(iso: string, days: number) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** Last N months as `{ key: '2026-10', label: 'Oct' }` ending at `end` (default: now). */
export function trailingMonths(n: number, end = new Date()) {
  const out: { key: string; label: string; index: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: MONTHS[d.getMonth()]!,
      index: i,
    });
  }
  return out;
}
