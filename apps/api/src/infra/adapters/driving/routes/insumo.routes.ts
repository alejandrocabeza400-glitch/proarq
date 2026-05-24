import {
  createInsumoSchema,
  updateInsumoSchema,
} from '@proarq/core/application/ports/in/insumo.input';
import { ManageInsumoUseCase } from '@proarq/core/application/use-cases/manage-insumo.use-case';
import { Router } from 'express';
import { postgresAuditRepo } from '../../driven/repositories/postgres-audit.repository';
import { postgresInsumoRepo } from '../../driven/repositories/postgres-insumo.repository';
import {
  bulkUploadInsumoController,
  createInsumoController,
  deleteInsumoController,
  exportPdfInsumosController,
  getInsumoController,
  listInsumosController,
  updateInsumoController,
} from '../controllers/insumo.controller';
import { checkRole, decodeJWT } from '../middleware/auth.middleware';
import { uploadCsvMemory } from '../middleware/upload.middleware';
import { validate } from '../middleware/validate.middleware';

const manageInsumo = new ManageInsumoUseCase(postgresInsumoRepo, postgresAuditRepo);

export const router = Router();

router.post(
  '/',
  decodeJWT,
  checkRole('ADMIN'),
  validate(createInsumoSchema),
  createInsumoController(manageInsumo),
);

router.get(
  '/pdf',
  decodeJWT,
  checkRole('ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'),
  exportPdfInsumosController(manageInsumo),
);

router.get(
  '/',
  decodeJWT,
  checkRole('ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'),
  listInsumosController(manageInsumo),
);

router.get(
  '/:id',

  decodeJWT,
  checkRole('ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'),
  getInsumoController(manageInsumo),
);

router.put(
  '/:id',
  decodeJWT,
  checkRole('ADMIN'),
  validate(updateInsumoSchema),
  updateInsumoController(manageInsumo),
);

router.delete('/:id', decodeJWT, checkRole('ADMIN'), deleteInsumoController(manageInsumo));

router.post(
  '/bulk-upload',
  decodeJWT,
  checkRole('ADMIN'),
  uploadCsvMemory,
  bulkUploadInsumoController(manageInsumo),
);
