import type { Paginated, TableQuery } from '@/types';

/**
 * Transport shim.
 *
 * Phase 1 resolves against the in-memory mock store with realistic latency and
 * failure semantics. Phase 2 replaces `request()` with a Supabase call — every
 * service module keeps the same exported signature, so no screen changes.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: 'not_found' | 'forbidden' | 'validation' | 'conflict' | 'network' = 'validation',
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const BASE_LATENCY = 90;

export async function request<T>(produce: () => T | Promise<T>, latency = BASE_LATENCY): Promise<T> {
  const jitter = BASE_LATENCY * 1.4 * Math.random();
  await new Promise((resolve) => setTimeout(resolve, latency + jitter));
  return produce();
}

/** Simulated optimistic-write latency (short, keeps interactions snappy). */
export const write = <T>(produce: () => T) => request(produce, 40);

export function sortRows<T>(rows: T[], key: string | undefined, direction: 'asc' | 'desc' = 'asc'): T[] {
  if (!key) return rows;
  const read = (row: T) => {
    const path = key.split('.');
    let value: unknown = row;
    for (const segment of path) value = (value as Record<string, unknown> | undefined)?.[segment];
    return value;
  };
  const factor = direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = read(a);
    const bv = read(b);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor;
    return String(av).localeCompare(String(bv), undefined, { numeric: true }) * factor;
  });
}

export function paginate<T>(rows: T[], page = 1, pageSize = 25): Paginated<T> {
  const start = (page - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), total: rows.length, page, pageSize };
}

export function applyTableQuery<T>(rows: T[], query: TableQuery | undefined, searchable: (row: T) => string): Paginated<T> {
  let result = rows;
  const search = query?.search?.trim().toLowerCase();
  if (search) result = result.filter((row) => searchable(row).toLowerCase().includes(search));
  result = sortRows(result, query?.sort?.key, query?.sort?.direction ?? 'asc');
  return paginate(result, query?.page ?? 1, query?.pageSize ?? 25);
}

export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
