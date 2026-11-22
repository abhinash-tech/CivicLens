import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import complaintRoutes from './complaintRoutes.js';
import publicRoutes from './publicRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

// Health routes: /api/health, /api/health/db
router.use('/', healthRoutes);

// Complaint routes: /api/complaints, /api/complaints/track/:code
router.use('/complaints', complaintRoutes);

// Public transparency routes: /api/public/stats, /api/public/recent
router.use('/public', publicRoutes);

// Admin routes: /api/admin/auth/login, /api/admin/complaints, etc.
router.use('/admin', adminRoutes);

export default router;
