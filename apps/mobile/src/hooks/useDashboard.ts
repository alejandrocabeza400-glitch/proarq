import { useQuery } from '@tanstack/react-query';
import type { Cotizacion } from '../services/api/cotizaciones.api';
import { cotizacionesApi } from '../services/api/cotizaciones.api';
import type { Proyecto } from '../services/api/projects.api';
import { proyectosApi } from '../services/api/projects.api';

interface DashboardData {
  projects: Proyecto[];
  quotes: Cotizacion[];
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [projRes, quotRes] = await Promise.all([
        proyectosApi.list(),
        cotizacionesApi.list({ limit: 5 }),
      ]);
      return {
        projects: projRes.data || [],
        quotes: quotRes.data || [],
      };
    },
  });
}
