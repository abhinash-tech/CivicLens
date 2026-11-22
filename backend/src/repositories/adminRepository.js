import { pool, query } from '../config/database.js';

/**
 * Formats an admin database row into camelCase.
 * @param {object} row
 * @returns {object|null}
 */
export function formatAdminRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    fullName: row.full_name,
    role: row.role,
    createdAt: row.created_at,
  };
}

/**
 * Finds an admin record by email address.
 * @param {string} email
 * @param {import('mysql2/promise').PoolConnection} [connection]
 * @returns {Promise<object|null>}
 */
export async function findAdminByEmail(email, connection) {
  if (!email) return null;

  const sql = `
    SELECT id, email, password_hash, full_name, role, created_at
    FROM admins
    WHERE LOWER(email) = LOWER(?)
    LIMIT 1
  `;

  const executor = connection || pool;
  const [rows] = await executor.query(sql, [email.trim()]);

  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  return formatAdminRow(rows[0]);
}

/**
 * Creates a new administrator account.
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.passwordHash
 * @param {string} params.fullName
 * @param {string} [params.role='admin']
 * @param {import('mysql2/promise').PoolConnection} [connection]
 * @returns {Promise<object>}
 */
export async function createAdmin(
  { email, passwordHash, fullName, role = 'admin' },
  connection
) {
  const sql = `
    INSERT INTO admins (email, password_hash, full_name, role)
    VALUES (?, ?, ?, ?)
  `;

  const executor = connection || pool;
  const [result] = await executor.query(sql, [
    email.toLowerCase().trim(),
    passwordHash,
    fullName.trim(),
    role || 'admin',
  ]);

  return {
    id: result.insertId,
    email: email.toLowerCase().trim(),
    fullName: fullName.trim(),
    role: role || 'admin',
  };
}

/**
 * Finds an admin record by primary key ID.
 * @param {number} id
 * @param {import('mysql2/promise').PoolConnection} [connection]
 * @returns {Promise<object|null>}
 */
export async function findAdminById(id, connection) {
  if (!id) return null;

  const sql = `
    SELECT id, email, password_hash, full_name, role, created_at
    FROM admins
    WHERE id = ?
    LIMIT 1
  `;

  const executor = connection || pool;
  const [rows] = await executor.query(sql, [id]);

  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  return formatAdminRow(rows[0]);
}

export default {
  formatAdminRow,
  findAdminByEmail,
  createAdmin,
  findAdminById,
};
