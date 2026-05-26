import { sql } from 'drizzle-orm';
import { check, index, numeric, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './user.schema';

export const insumosMaestro = pgTable(
  'insumos_maestro',
  {
    id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
    codigo: varchar('codigo', { length: 20 }).unique().notNull(),
    nombre: varchar('nombre', { length: 255 }).notNull(),
    unidad: varchar('unidad', { length: 5 }).notNull(),
    costBase: numeric('cost_base', { precision: 12, scale: 2 }).notNull(),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    unidadCheck: check('unidad_check', sql`${table.unidad} IN ('M3','KG','UND','GL')`),
    nombreIdx: index('insumos_nombre_idx').on(table.nombre),
  }),
);
