import {
  createProyectoSchema,
  updateProyectoSchema,
} from '@proarq/core/application/ports/in/proyecto.input';
import { ManageProyectoUseCase } from '@proarq/core/application/use-cases/manage-proyecto.use-case';
import { Router } from 'express';
import { postgresAuditRepo } from '../../driven/repositories/postgres-audit.repository';
import { postgresProyectoRepo } from '../../driven/repositories/postgres-proyecto.repository';
import {
  createProyectoController,
  deleteProyectoController,
  exportPdfProyectosController,
  getProyectoController,
  listProyectosController,
  updateProyectoController,
} from '../controllers/proyecto.controller';
import { checkRole, decodeJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const manageProyecto = new ManageProyectoUseCase(postgresProyectoRepo, postgresAuditRepo);

export const router = Router();

const operRoles = ['ADMIN', 'GERENTE_OBRA'];
const allRoles = ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA', 'CLIENTE', 'REPRESENTANTE'];

router.post(
  '/',
  decodeJWT,
  checkRole(...operRoles),
  validate(createProyectoSchema),
  createProyectoController(manageProyecto),
);

router.get('/pdf', decodeJWT, checkRole(...allRoles), exportPdfProyectosController(manageProyecto));

router.get('/', decodeJWT, checkRole(...allRoles), listProyectosController(manageProyecto));

router.get('/:id', decodeJWT, checkRole(...allRoles), getProyectoController(manageProyecto));

router.put(
  '/:id',
  decodeJWT,
  checkRole(...operRoles),
  validate(updateProyectoSchema),
  updateProyectoController(manageProyecto),
);

router.delete('/:id', decodeJWT, checkRole(...operRoles), deleteProyectoController(manageProyecto));
