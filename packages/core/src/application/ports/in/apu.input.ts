import { z } from 'zod';

export const createApuSchema = z.object({
  codigo: z.string().min(1, 'Code is required').max(20),
  nombre: z.string().min(1, 'Name is required').max(255),
  tipo: z.string().min(1, 'Type is required').max(50),
});

export type CreateApuInput = z.infer<typeof createApuSchema>;

export const updateApuSchema = z.object({
  nombre: z.string().min(1).max(255).optional(),
  tipo: z.string().min(1).max(50).optional(),
});

export type UpdateApuInput = z.infer<typeof updateApuSchema>;

export const apuQuerySchema = z.object({
  codigo: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type ApuQueryInput = z.infer<typeof apuQuerySchema>;

export const addApuInsumoSchema = z.object({
  insumoId: z.string().uuid('Invalid insumo ID'),
  rendimiento: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Invalid rendimiento format'),
  desperdicio: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid desperdicio format').default('0'),
});

export type AddApuInsumoInput = z.infer<typeof addApuInsumoSchema>;
