import {
  addApuInsumoSchema,
  createApuSchema,
  updateApuSchema,
} from '@proarq/core/application/ports/in/apu.input';
import { ManageApuUseCase } from '@proarq/core/application/use-cases/manage-apu.use-case';
import { Router } from 'express';
import { postgresApuRepo } from '../../driven/repositories/postgres-apu.repository';
import { postgresAuditRepo } from '../../driven/repositories/postgres-audit.repository';
import { postgresInsumoRepo } from '../../driven/repositories/postgres-insumo.repository';
import {
  addApuInsumoController,
  createApuController,
  exportPdfApusController,
  getApuController,
  listApusController,
  removeApuInsumoController,
  updateApuController,
} from '../controllers/apu.controller';
import { checkRole, decodeJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const manageApu = new ManageApuUseCase(postgresApuRepo, postgresInsumoRepo, postgresAuditRepo);

export const router = Router();

const operRoles = ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'];

router.post(
  '/',
  decodeJWT,
  checkRole(...operRoles),
  validate(createApuSchema),
  createApuController(manageApu),
);

router.get('/pdf', decodeJWT, checkRole(...operRoles), exportPdfApusController(manageApu));

router.get('/', decodeJWT, checkRole(...operRoles), listApusController(manageApu));

router.get(
  '/:id',

  decodeJWT,
  checkRole(...operRoles),
  getApuController(manageApu),
);

router.put(
  '/:id',
  decodeJWT,
  checkRole(...operRoles),
  validate(updateApuSchema),
  updateApuController(manageApu),
);

router.post(
  '/:id/insumos',
  decodeJWT,
  checkRole(...operRoles),
  validate(addApuInsumoSchema),
  addApuInsumoController(manageApu),
);

router.delete(
  '/:id/insumos/:itemId',
  decodeJWT,
  checkRole(...operRoles),
  removeApuInsumoController(manageApu),
);
