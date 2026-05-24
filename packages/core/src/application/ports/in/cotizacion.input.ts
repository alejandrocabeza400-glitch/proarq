import { z } from 'zod';

const cotizacionEstadoEnum = z.enum(['BORRADOR', 'ENVIADA', 'APROBADA', 'REEMPLAZADA']);

export const cotizacionItemInputSchema = z.object({
  apuId: z.string().uuid('Invalid APU ID'),
  cantidad: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Invalid cantidad format'),
});

export const createCotizacionSchema = z.object({
  projectoId: z.string().uuid('Invalid project ID'),
  codigo: z.string().min(1, 'Code is required').max(50),
  clienteId: z.string().uuid('Invalid client ID').optional(),
  items: z.array(cotizacionItemInputSchema).default([]),
});

export type CreateCotizacionInput = z.infer<typeof createCotizacionSchema>;

export const updateCotizacionSchema = z.object({
  estado: cotizacionEstadoEnum.optional(),
  clienteId: z.string().uuid().optional().nullable(),
  items: z.array(cotizacionItemInputSchema).optional(),
  factorAPercentage: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  factorBPercentage: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  profitMarginPercent: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
});

export type UpdateCotizacionInput = z.infer<typeof updateCotizacionSchema>;

export const cotizacionQuerySchema = z.object({
  projecto_id: z.string().optional(),
  estado: cotizacionEstadoEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type CotizacionQueryInput = z.infer<typeof cotizacionQuerySchema>;
