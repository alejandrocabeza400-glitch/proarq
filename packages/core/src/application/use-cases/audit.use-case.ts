import type { AuditLog } from '../../domain/entities/audit-log.entity';
import type { AuditFilters, AuditRepository } from '../ports/out/audit-repository.port';

export class AuditUseCase {
  constructor(private readonly auditRepo: AuditRepository) {}

  async createLog(data: {
    tableName: string;
    recordId: string;
    action: string;
    userId: string;
    dataHistory: {
      before: Record<string, any>;
      after: Record<string, any>;
    };
  }): Promise<AuditLog> {
    return this.auditRepo.create(data);
  }

  async findLogs(filters?: AuditFilters): Promise<AuditLog[]> {
    return this.auditRepo.findAll(filters);
  }
}
