import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendEnvPath = path.resolve(__dirname, '../../../.env');
const rootEnvPath = path.resolve(__dirname, '../../../../.env');

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

export function getJwtSecret() {
  return process.env.JWT_SECRET || 'civiclens-fallback-dev-secret-do-not-use-in-production';
}

export function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || '24h';
}

/**
 * Signs a JWT token with the provided payload.
 * @param {Object} payload - Data to embed in the token (e.g. { id, email, role, fullName })
 * @param {Object} [options] - Optional JWT sign options
 * @returns {string} Signed JWT token
 */
export function generateToken(payload, options = {}) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: options.expiresIn || getJwtExpiresIn(),
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
  return jwt.verify(token, getJwtSecret());
}

export default {
  generateToken,
  verifyToken,
  getJwtSecret,
  getJwtExpiresIn
};
