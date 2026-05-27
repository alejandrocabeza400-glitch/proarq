import { z } from 'zod';

export const unidadEnum = z.enum(['M3', 'KG', 'UND', 'GL', 'M2', 'ML']);

export const createInsumoSchema = z.object({
  nombre: z.string().min(1, 'Name is required').max(255),
  unidad: unidadEnum,
  costBase: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid cost base format'),
});

export type CreateInsumoInput = z.infer<typeof createInsumoSchema>;

export const updateInsumoSchema = z.object({
  nombre: z.string().min(1).max(255).optional(),
  unidad: unidadEnum.optional(),
  costBase: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid cost base format')
    .optional(),
});

export type UpdateInsumoInput = z.infer<typeof updateInsumoSchema>;

export const insumoQuerySchema = z.object({
  codigo: z.string().optional(),
  nombre: z.string().optional(),
  unidad: unidadEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type InsumoQueryInput = z.infer<typeof insumoQuerySchema>;

export const bulkInsumoSchema = z.object({
  codigo: z.string().min(1).max(20),
  nombre: z.string().min(1).max(255),
  unidad: unidadEnum,
  costBase: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid cost base format'),
});

export type BulkInsumoInput = z.infer<typeof bulkInsumoSchema>;

export const bulkUploadResponseSchema = z.object({
  imported: z.number(),
  skipped: z.number(),
  errors: z.array(
    z.object({
      row: z.number(),
      errors: z.array(z.string()),
    }),
  ),
});

export type BulkUploadResponse = z.infer<typeof bulkUploadResponseSchema>;
