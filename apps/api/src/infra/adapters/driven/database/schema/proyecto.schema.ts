import { sql } from 'drizzle-orm';
import { check, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './user.schema';

export const proyectos = pgTable(
  'proyectos',
  {
    id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
    codigo: varchar('codigo', { length: 50 }).unique().notNull(),
    nombre: text('nombre').notNull(),
    descripcion: text('descripcion'),
    estado: varchar('estado', { length: 20 }).notNull().default('PLANIFICACION'),
    clienteId: text('cliente_id').references(() => users.id, { onDelete: 'set null' }),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    estadoCheck: check(
      'estado_check',
      sql`${table.estado} IN ('PLANIFICACION','EN_EJECUCION','FINALIZADO','SUSPENDIDO')`,
    ),
  }),
);
