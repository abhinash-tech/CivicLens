import { Router } from 'express';
import { z } from 'zod';
import { authenticateAdmin } from '../middleware/authMiddleware.js';
import { adminAuthLimiter } from '../middleware/rateLimitMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import {
  login,
  getComplaints,
  getComplaint,
  updateStatus
} from '../controllers/adminController.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required')
});

const statusUpdateSchema = z.object({
  status: z.enum([
    'SUBMITTED',
    'IN_REVIEW',
    'ACTION_SCHEDULED',
    'IN_PROGRESS',
    'RESOLVED',
    'REJECTED'
  ], {
    errorMap: () => ({ message: "Status must be one of 'SUBMITTED', 'IN_REVIEW', 'ACTION_SCHEDULED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'" })
  }),
  adminNotes: z.string().max(2000).optional().nullable(),
  reason: z.string().max(500).optional().nullable()
});

// POST /api/admin/auth/login
router.post(
  '/auth/login',
  adminAuthLimiter,
  validate({ body: loginSchema }),
  login
);

// Protected routes (require valid JWT)
router.use(authenticateAdmin);

// GET /api/admin/complaints
router.get('/complaints', getComplaints);

// GET /api/admin/complaints/:id
router.get('/complaints/:id', getComplaint);

// PATCH /api/admin/complaints/:id/status
router.patch(
  '/complaints/:id/status',
  validate({ body: statusUpdateSchema }),
  updateStatus
);

export default router;
