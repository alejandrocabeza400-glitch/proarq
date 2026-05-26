import { useQuery } from '@tanstack/react-query';
import type { Insumo } from '../services/api/insumos.api';
import { insumosApi } from '../services/api/insumos.api';
import { db } from '../services/storage/database';

function mapCachedToInsumo(cached: any): Insumo {
  return {
    id: cached.id,
    codigo: cached.codigo,
    nombre: cached.nombre,
    unidad: cached.unidad,
    costBase: cached.costBase,
    createdBy: cached.createdBy,
    createdAt: cached.createdAt,
    updatedAt: cached.updatedAt,
  };
}

export function useInsumosWithCache(search = '') {
  return useQuery<Insumo[]>({
    queryKey: ['insumos', 'cached', search],
    queryFn: async () => {
      // Try fetching from API first
      const res = await insumosApi.list({ nombre: search || undefined });
      const apiData = res.data || [];

      // Update Dexie cache in the background (fire and forget)
      if (apiData.length > 0) {
        const now = Date.now();
        db.transaction('rw', db.insumos, async () => {
          // Use bulkPut to update existing or add new ones without clearing
          await db.insumos.bulkPut(
            apiData.map((item) => ({
              id: item.id,
              codigo: item.codigo,
              nombre: item.nombre,
              unidad: item.unidad,
              costBase: item.costBase,
              createdBy: item.createdBy,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              _lastSyncedAt: now,
            })),
          );
        }).catch((_err) => {});
      }

      return apiData;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Reads insumos from Dexie cache synchronously (for instant display).
 * Falls back to empty array if cache is unavailable.
 */
export async function getCachedInsumos(): Promise<Insumo[]> {
  try {
    const cached = await db.insumos.toArray();
    return cached.map(mapCachedToInsumo);
  } catch {
    return [];
  }
}
