import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'civiclens-fallback-dev-secret-do-not-use-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Signs a JWT token with the provided payload.
 * @param {Object} payload - Data to embed in the token (e.g. { id, email, role, fullName })
 * @param {Object} [options] - Optional JWT sign options
 * @returns {string} Signed JWT token
 */
export function generateToken(payload, options = {}) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    ...options
  });
}

/**
 * Verifies a JWT token and returns the decoded payload.
 * @param {string} token - Bearer JWT token
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export default {
  generateToken,
  verifyToken
};
