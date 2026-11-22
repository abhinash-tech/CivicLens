import rateLimit from 'express-rate-limit';

const standardResponse = (message) => (req, res) => {
  res.status(429).json({
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: message || 'Too many requests. Please try again later.'
  });
};

/**
 * Rate limiter for complaint submissions to prevent spam.
 */
export const complaintSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 submissions per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: standardResponse('Too many complaint submissions from this IP. Please try again later.')
});

/**
 * Rate limiter for admin login attempts to prevent brute-force attacks.
 */
export const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: standardResponse('Too many login attempts. Please try again in 15 minutes.')
});

/**
 * General rate limiter for public viewing endpoints.
 */
export const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: standardResponse('Too many requests. Please slow down and try again later.')
});

export default {
  complaintSubmissionLimiter,
  adminAuthLimiter,
  publicApiLimiter
};
