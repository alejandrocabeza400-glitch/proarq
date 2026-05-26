import { useQuery } from '@tanstack/react-query';
import type { AnalyticsStats } from '../services/api/analytics.api';
import { analyticsApi } from '../services/api/analytics.api';

export function useAnalytics() {
  return useQuery<AnalyticsStats>({
    queryKey: ['analytics'],
    queryFn: async () => analyticsApi.getStats(),
  });
}
