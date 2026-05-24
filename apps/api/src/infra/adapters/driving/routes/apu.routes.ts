import { Router } from 'express';
import { decodeJWT, checkRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { ManageApuUseCase } from '@proarq/core/application/use-cases/manage-apu.use-case';
import { createApuSchema, updateApuSchema, addApuInsumoSchema } from '@proarq/core/application/ports/in/apu.input';
import { postgresApuRepo } from '../../driven/repositories/postgres-apu.repository';
import { postgresInsumoRepo } from '../../driven/repositories/postgres-insumo.repository';
import {
  createApuController,
  listApusController,
  getApuController,
  updateApuController,
  addApuInsumoController,
  removeApuInsumoController,
} from '../controllers/apu.controller';

const manageApu = new ManageApuUseCase(postgresApuRepo, postgresInsumoRepo);

export const router = Router();

const operRoles = ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'];

router.post(
  '/',
  decodeJWT,
  checkRole(...operRoles),
  validate(createApuSchema),
  createApuController(manageApu),
);

router.get(
  '/',
  decodeJWT,
  checkRole(...operRoles),
  listApusController(manageApu),
);

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
