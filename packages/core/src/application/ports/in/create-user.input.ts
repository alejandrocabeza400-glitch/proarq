import { z } from 'zod';

const roleEnum = z.enum(['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA', 'CLIENTE', 'REPRESENTANTE']);

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: roleEnum.default('CLIENTE'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: roleEnum.optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const userQuerySchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  role: roleEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type UserQueryInput = z.infer<typeof userQuerySchema>;
