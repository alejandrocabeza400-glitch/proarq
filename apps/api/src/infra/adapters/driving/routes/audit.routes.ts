import { Router } from 'express';
import { decodeJWT, checkRole } from '../middleware/auth.middleware';
import { AuditUseCase } from '@proarq/core/application/use-cases/audit.use-case';
import { postgresAuditRepo } from '../../driven/repositories/postgres-audit.repository';
import { listAuditLogsController } from '../controllers/audit.controller';

const auditUseCase = new AuditUseCase(postgresAuditRepo);

export const router = Router();

router.get(
  '/',
  decodeJWT,
  checkRole('ADMIN'),
  listAuditLogsController(auditUseCase),
);
