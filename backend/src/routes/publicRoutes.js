import { Router } from 'express';
import { publicApiLimiter } from '../middleware/rateLimitMiddleware.js';
import { getStats, getRecent } from '../controllers/publicController.js';

const router = Router();

// GET /api/public/stats
router.get('/stats', publicApiLimiter, getStats);

// GET /api/public/recent
router.get('/recent', publicApiLimiter, getRecent);

export default router;
