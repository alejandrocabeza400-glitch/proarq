import { Router } from 'express';
import { db } from '../../driven/database/connection';
import { analyticsController } from '../controllers/analytics.controller';
import { checkRole, decodeJWT } from '../middleware/auth.middleware';

export const router = Router();

const allRoles = ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA', 'CLIENTE', 'REPRESENTANTE'];

router.get('/', decodeJWT, checkRole(...allRoles), analyticsController(db));
