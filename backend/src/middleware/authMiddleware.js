import { verifyToken } from '../services/auth/jwtService.js';

/**
 * Authentication middleware for protecting admin endpoints.
 * Validates Bearer JWT from Authorization header and sets req.admin.
 */
export function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication token missing or invalid'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication token missing or invalid'
      });
    }

    const decoded = verifyToken(token);
    req.admin = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication token missing or invalid'
    });
  }
}

export default authenticateAdmin;
