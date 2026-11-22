/**
 * Custom application error class with HTTP status code support.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_SERVER_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found middleware for unhandled routes.
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
}

/**
 * Centralized error-handling middleware.
 * Formats errors into standard CivicLens API response and prevents stack leak.
 */
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || err.code || 'INTERNAL_SERVER_ERROR';

  // Log error server-side for diagnostics, but never expose raw stack or db creds to client
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    statusCode,
    errorCode,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });

  const response = {
    success: false,
    error: errorCode,
    message: statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'An unexpected error occurred'
  };

  if (err.details) {
    response.details = err.details;
  }

  res.status(statusCode).json(response);
}

export default {
  AppError,
  notFoundHandler,
  errorHandler
};
