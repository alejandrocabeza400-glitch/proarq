import { db } from '../database/connection';
import { auditLogs } from '../database/schema/audit-log.schema';
import { eq, and } from 'drizzle-orm';
import type { AuditRepository, AuditFilters } from '@proarq/core/application/ports/out/audit-repository.port';
import type { AuditLog } from '@proarq/core/domain/entities/audit-log.entity';

export const postgresAuditRepo: AuditRepository = {
  async create(data: {
    tableName: string;
    recordId: string;
    action: string;
    userId: string;
    dataHistory: { before: Record<string, any>; after: Record<string, any> };
  }): Promise<AuditLog> {
    const [log] = await db
      .insert(auditLogs)
      .values({
        tableName: data.tableName,
        recordId: data.recordId,
        action: data.action,
        userId: data.userId,
        dataHistory: data.dataHistory,
      })
      .returning();
    return log as unknown as AuditLog;
  },

  async findAll(filters?: AuditFilters): Promise<AuditLog[]> {
    const conditions: ReturnType<typeof eq>[] = [];

    if (filters?.tableName) {
      conditions.push(eq(auditLogs.tableName, filters.tableName));
    }
    if (filters?.recordId) {
      conditions.push(eq(auditLogs.recordId, filters.recordId));
    }
    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }

    const query = db.select().from(auditLogs);
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 10;
    const offset = (page - 1) * limit;

    return query.limit(limit).offset(offset) as unknown as Promise<AuditLog[]>;
  },
};
