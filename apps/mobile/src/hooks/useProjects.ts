import { useQuery } from '@tanstack/react-query';
import type { Proyecto } from '../services/api/projects.api';
import { proyectosApi } from '../services/api/projects.api';

export function useProjects(search = '') {
  return useQuery<Proyecto[]>({
    queryKey: ['proyectos', search],
    queryFn: async () => {
      const res = await proyectosApi.list({ nombre: search || undefined });
      return res.data || [];
    },
  });
}
