import { useQuery } from '@tanstack/react-query';
import type { Apu } from '../services/api/apus.api';
import { apusApi } from '../services/api/apus.api';

export function useApus() {
  return useQuery<Apu[]>({
    queryKey: ['apus'],
    queryFn: async () => {
      const res = await apusApi.list();
      return res.data || [];
    },
  });
}
