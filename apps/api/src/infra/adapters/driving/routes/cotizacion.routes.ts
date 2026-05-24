import { Router } from 'express';
import { decodeJWT, checkRole } from '../middleware/auth.middleware';
import { validateProfitMargin } from '../middleware/financial.middleware';
import { validate } from '../middleware/validate.middleware';
import { ManageCotizacionUseCase } from '@proarq/core/application/use-cases/manage-cotizacion.use-case';
import { BranchCotizacionUseCase } from '@proarq/core/application/use-cases/branch-cotizacion.use-case';
import { createCotizacionSchema, updateCotizacionSchema } from '@proarq/core/application/ports/in/cotizacion.input';
import { postgresCotizacionRepo } from '../../driven/repositories/postgres-cotizacion.repository';
import {
  createCotizacionController,
  listCotizacionesController,
  getCotizacionController,
  updateCotizacionController,
  branchCotizacionController,
  pdfCotizacionController,
} from '../controllers/cotizacion.controller';

const manageCotizacion = new ManageCotizacionUseCase(postgresCotizacionRepo);
const branchCotizacion = new BranchCotizacionUseCase(postgresCotizacionRepo);

export const router = Router();

const operRoles = ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'];
const allRoles = ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA', 'CLIENTE', 'REPRESENTANTE'];

router.post(
  '/',
  decodeJWT,
  checkRole(...operRoles),
  validate(createCotizacionSchema),
  createCotizacionController(manageCotizacion),
);

router.patch(
  '/:id',
  decodeJWT,
  checkRole(...operRoles),
  validateProfitMargin,
  validate(updateCotizacionSchema),
  updateCotizacionController(manageCotizacion),
);

router.get(
  '/',
  decodeJWT,
  checkRole(...operRoles),
  listCotizacionesController(manageCotizacion),
);

router.get(
  '/:id',
  decodeJWT,
  checkRole(...operRoles),
  getCotizacionController(manageCotizacion),
);

router.get(
  '/:id/pdf',
  decodeJWT,
  checkRole(...allRoles),
  pdfCotizacionController(manageCotizacion),
);

router.post(
  '/:id/branch',
  decodeJWT,
  checkRole(...operRoles),
  branchCotizacionController(branchCotizacion),
);
