import { sql } from 'drizzle-orm';
import { index, numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { apus } from './apu.schema';
import { insumosMaestro } from './insumo.schema';

export const apuInsumos = pgTable(
  'apu_insumos',
  {
    id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
    apuId: text('apu_id')
      .notNull()
      .references(() => apus.id, { onDelete: 'cascade' }),
    insumoId: text('insumo_id')
      .notNull()
      .references(() => insumosMaestro.id, { onDelete: 'cascade' }),
    rendimiento: numeric('rendimiento', { precision: 12, scale: 4 }).notNull(),
    desperdicio: numeric('desperdicio', { precision: 5, scale: 2 }).default('0'),
    unitPriceSnapshot: numeric('unit_price_snapshot', { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    apuIdx: index('apu_insumos_apu_idx').on(table.apuId),
    insumoIdx: index('apu_insumos_insumo_idx').on(table.insumoId),
  }),
);
