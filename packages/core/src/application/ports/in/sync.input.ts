import { z } from 'zod';

const syncInsumoSchema = z.object({
  id: z.string(),
  codigo: z.string().max(20),
  nombre: z.string().max(255),
  unidad: z.enum(['M3', 'KG', 'UND', 'GL']),
  cost_base: z.string(),
  created_by: z.string().optional(),
});

const syncApuSchema = z.object({
  id: z.string(),
  codigo: z.string().max(20),
  nombre: z.string().max(255),
  tipo: z.string().max(50),
  created_by: z.string().optional(),
});

const syncCotizacionSchema = z.object({
  id: z.string(),
  projecto_id: z.string(),
  codigo: z.string().max(50),
  version: z.number().int().optional(),
  estado: z.string().optional(),
  cliente_id: z.string().optional(),
  created_by: z.string().optional(),
});

export const syncPayloadSchema = z.object({
  insumos: z.array(syncInsumoSchema).default([]),
  apus: z.array(syncApuSchema).default([]),
  cotizaciones: z.array(syncCotizacionSchema).default([]),
  apuInsumos: z
    .array(
      z.object({
        id: z.string(),
        apu_id: z.string(),
        insumo_id: z.string(),
        rendimiento: z.string(),
        desperdicio: z.string().optional(),
        unit_price_snapshot: z.string(),
      }),
    )
    .default([]),
  cotizacionItems: z
    .array(
      z.object({
        id: z.string(),
        cotizacion_id: z.string(),
        apu_id: z.string(),
        cantidad: z.string(),
      }),
    )
    .default([]),
}).strict();

export type SyncPayloadInput = z.infer<typeof syncPayloadSchema>;

export interface SyncResult {
  accepted: number;
  conflicts: number;
}
