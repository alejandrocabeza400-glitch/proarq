import { AuditUseCase } from '@proarq/core/application/use-cases/audit.use-case';
import { Router } from 'express';
import { postgresAuditRepo } from '../../driven/repositories/postgres-audit.repository';
import {
  exportPdfAuditLogsController,
  listAuditLogsController,
} from '../controllers/audit.controller';
import { checkRole, decodeJWT } from '../middleware/auth.middleware';

const auditUseCase = new AuditUseCase(postgresAuditRepo);

export const router = Router();

router.get('/pdf', decodeJWT, checkRole('ADMIN'), exportPdfAuditLogsController(auditUseCase));

router.get('/', decodeJWT, checkRole('ADMIN'), listAuditLogsController(auditUseCase));
