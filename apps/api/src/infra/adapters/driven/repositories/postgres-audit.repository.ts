import type {
  AuditFilters,
  AuditRepository,
} from '@proarq/core/application/ports/out/audit-repository.port';
import type { AuditLog } from '@proarq/core/domain/entities/audit-log.entity';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../database/connection';
import { auditLogs } from '../database/schema/audit-log.schema';
import { users } from '../database/schema/user.schema';

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
    const conditions: any[] = [];

    if (filters?.tableName) {
      conditions.push(eq(auditLogs.tableName, filters.tableName));
    }
    if (filters?.recordId) {
      conditions.push(eq(auditLogs.recordId, filters.recordId));
    }
    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const offset = (page - 1) * limit;

    const results = await db
      .select({
        id: auditLogs.id,
        tableName: auditLogs.tableName,
        recordId: auditLogs.recordId,
        action: auditLogs.action,
        userId: auditLogs.userId,
        createdAt: auditLogs.createdAt,
        dataHistory: auditLogs.dataHistory,
        userEmail: users.email,
        userName: users.name,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${auditLogs.createdAt} DESC`);

    return results as unknown as AuditLog[];
  },
};
