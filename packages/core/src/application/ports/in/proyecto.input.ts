import { z } from 'zod';

const estadoProyectoEnum = z.enum(['PLANIFICACION', 'EN_EJECUCION', 'FINALIZADO', 'SUSPENDIDO']);

export const createProyectoSchema = z.object({
  nombre: z.string().min(1, 'Nombre is required'),
  descripcion: z.string().optional().nullable(),
  estado: estadoProyectoEnum.default('PLANIFICACION'),
  clienteId: z.string().uuid('Invalid cliente ID format').optional().nullable(),
});

export type CreateProyectoInput = z.infer<typeof createProyectoSchema>;

export const updateProyectoSchema = z.object({
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional().nullable(),
  estado: estadoProyectoEnum.optional(),
  clienteId: z.string().uuid().optional().nullable(),
});

export type UpdateProyectoInput = z.infer<typeof updateProyectoSchema>;

export const proyectoQuerySchema = z.object({
  codigo: z.string().optional(),
  nombre: z.string().optional(),
  estado: estadoProyectoEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type ProyectoQueryInput = z.infer<typeof proyectoQuerySchema>;
