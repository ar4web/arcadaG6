import { useQuery } from '@tanstack/react-query';
import type { Employee } from '@/types';
import { analyticsFor, db } from '@/lib/mock/db';

export function useAnalytics(scope?: Employee[], scopeKey = 'all') {
  return useQuery({
    queryKey: ['analytics', scopeKey],
    queryFn: async () => analyticsFor(scope ?? db.employees),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => db.notifications,
  });
}
