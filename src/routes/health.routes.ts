import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

/**
 * Health Check Routes
 * 
 * Mounts:
 * GET /api/v1/health
 */
const router = Router();

router.get('/health', (req, res, next) => healthController.check(req, res, next));

export default router;
