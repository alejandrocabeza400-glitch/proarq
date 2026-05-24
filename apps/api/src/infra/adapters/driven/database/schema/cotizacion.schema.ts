import { pgTable, text, varchar, integer, numeric, timestamp, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './user.schema';

export const cotizaciones = pgTable('cotizaciones', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  projectoId: text('projecto_id').notNull(),
  codigo: varchar('codigo', { length: 50 }).notNull(),
  version: integer('version').default(1),
  estado: varchar('estado', { length: 20 }).notNull().default('BORRADOR'),
  clienteId: text('cliente_id').references(() => users.id, { onDelete: 'set null' }),
  totalCostDirect: numeric('total_cost_direct', { precision: 15, scale: 4 }).default('0'),
  factorAPercentage: numeric('factor_a_percentage', { precision: 5, scale: 2 }).default('0'),
  factorBPercentage: numeric('factor_b_percentage', { precision: 5, scale: 2 }).default('0'),
  profitMarginPercent: numeric('profit_margin_percent', { precision: 5, scale: 2 }).default('0'),
  totalAmount: numeric('total_amount', { precision: 15, scale: 4 }).default('0'),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  estadoCheck: check('estado_check', sql`${table.estado} IN ('BORRADOR','ENVIADA','APROBADA','REEMPLAZADA')`),
}));
