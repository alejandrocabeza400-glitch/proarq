import { useQuery } from '@tanstack/react-query';
import type { Insumo } from '../services/api/insumos.api';
import { insumosApi } from '../services/api/insumos.api';

export function useInsumos(search = '') {
  return useQuery<Insumo[]>({
    queryKey: ['insumos', search],
    queryFn: async () => {
      const res = await insumosApi.list({ nombre: search || undefined });
      return res.data || [];
    },
  });
}
