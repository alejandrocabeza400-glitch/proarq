import { sql } from 'drizzle-orm';
import { check, jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './user.schema';

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
    tableName: varchar('table_name', { length: 100 }).notNull(),
    recordId: text('record_id').notNull(),
    action: varchar('action', { length: 10 }).notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    dataHistory: jsonb('data_history').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    actionCheck: check('action_check', sql`${table.action} IN ('INSERT','UPDATE','DELETE')`),
  }),
);
