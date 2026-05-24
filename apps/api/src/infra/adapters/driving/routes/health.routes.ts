import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller';

export const router = Router();
router.get('/', healthCheck);
