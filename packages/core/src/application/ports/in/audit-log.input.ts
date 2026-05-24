import { z } from 'zod';

export const auditLogQuerySchema = z.object({
  tableName: z.string().optional(),
  recordId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;
