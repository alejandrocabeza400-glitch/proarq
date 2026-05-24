import type { Request, Response, NextFunction } from 'express';
import type { AuditUseCase } from '@proarq/core/application/use-cases/audit.use-case';
import { auditLogQuerySchema } from '@proarq/core/application/ports/in/audit-log.input';

export function listAuditLogsController(useCase: AuditUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = auditLogQuerySchema.parse(req.query);
      const logs = await useCase.findLogs(query);
      res.status(200).json({ data: logs });
    } catch (err) {
      next(err);
    }
  };
}
