import {
  createCotizacionSchema,
  updateCotizacionSchema,
} from '@proarq/core/application/ports/in/cotizacion.input';
import { BranchCotizacionUseCase } from '@proarq/core/application/use-cases/branch-cotizacion.use-case';
import { ManageCotizacionUseCase } from '@proarq/core/application/use-cases/manage-cotizacion.use-case';
import { Router } from 'express';
import { postgresAuditRepo } from '../../driven/repositories/postgres-audit.repository';
import { postgresCotizacionRepo } from '../../driven/repositories/postgres-cotizacion.repository';
import {
  branchCotizacionController,
  createCotizacionController,
  deleteCotizacionController,
  exportPdfCotizacionesController,
  getCotizacionController,
  listCotizacionesController,
  pdfCotizacionController,
  updateCotizacionController,
} from '../controllers/cotizacion.controller';
import { checkRole, decodeJWT } from '../middleware/auth.middleware';
import { validateProfitMargin } from '../middleware/financial.middleware';
import { validate } from '../middleware/validate.middleware';

const manageCotizacion = new ManageCotizacionUseCase(postgresCotizacionRepo, postgresAuditRepo);
const branchCotizacion = new BranchCotizacionUseCase(postgresCotizacionRepo, postgresAuditRepo);

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

router.delete(
  '/:id',
  decodeJWT,
  checkRole(...operRoles),
  deleteCotizacionController(manageCotizacion),
);

router.get(
  '/pdf',
  decodeJWT,
  checkRole(...operRoles),
  exportPdfCotizacionesController(manageCotizacion),
);

router.get('/', decodeJWT, checkRole(...operRoles), listCotizacionesController(manageCotizacion));

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
