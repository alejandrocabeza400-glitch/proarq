import { pgTable, text, numeric, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { cotizaciones } from './cotizacion.schema';
import { apus } from './apu.schema';

export const cotizacionItems = pgTable('cotizacion_items', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  cotizacionId: text('cotizacion_id').notNull().references(() => cotizaciones.id, { onDelete: 'cascade' }),
  apuId: text('apu_id').notNull().references(() => apus.id),
  cantidad: numeric('cantidad', { precision: 12, scale: 4 }).notNull(),
  calculatedCostDirect: numeric('calculated_cost_direct', { precision: 15, scale: 4 }).default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
