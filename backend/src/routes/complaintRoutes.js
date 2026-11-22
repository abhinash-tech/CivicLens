import { Router } from 'express';
import { uploadSingleImage } from '../middleware/uploadMiddleware.js';
import { complaintSubmissionLimiter, publicApiLimiter } from '../middleware/rateLimitMiddleware.js';
import { submitComplaint, trackComplaint } from '../controllers/complaintsController.js';

const router = Router();

// POST /api/complaints
router.post(
  '/',
  complaintSubmissionLimiter,
  uploadSingleImage('image'),
  submitComplaint
);

// GET /api/complaints/track/:code
router.get(
  '/track/:code',
  publicApiLimiter,
  trackComplaint
);

export default router;
