import { useQuery } from '@tanstack/react-query';
import type { Cotizacion } from '../services/api/cotizaciones.api';
import { cotizacionesApi } from '../services/api/cotizaciones.api';

export function useCotizaciones(statusFilter = '') {
  return useQuery<Cotizacion[]>({
    queryKey: ['cotizaciones', statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter) params.estado = statusFilter;
      const res = await cotizacionesApi.list(params);
      return res.data || [];
    },
  });
}
