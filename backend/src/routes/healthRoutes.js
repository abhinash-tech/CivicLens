import { Router } from 'express';
import { getHealth, getDatabaseHealth } from '../controllers/healthController.js';

const router = Router();

router.get('/health', getHealth);
router.get('/health/db', getDatabaseHealth);

export default router;
