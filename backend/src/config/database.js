import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables if not already loaded
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendEnvPath = path.resolve(__dirname, '../../.env');
const rootEnvPath = path.resolve(__dirname, '../../../.env');

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

/**
 * Configure SSL based on environment variables.
 * Enables SSL with rejectUnauthorized: false when DB_SSL is 'true'
 * or when connecting to an Aiven Cloud host (*.aivencloud.com).
 * Supports a custom CA cert path via DB_SSL_CA_PATH.
 */
function resolveSslConfig() {
  const isExplicitlyDisabled = process.env.DB_SSL === 'false' || process.env.DB_SSL === '0';
  if (isExplicitlyDisabled) {
    return undefined;
  }

  const isExplicitlyEnabled = process.env.DB_SSL === 'true' || process.env.DB_SSL === '1';
  const isAivenHost = Boolean(process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud.com'));

  if (!isExplicitlyEnabled && !isAivenHost) {
    return undefined;
  }

  const caPath = process.env.DB_SSL_CA_PATH;
  if (caPath && fs.existsSync(caPath)) {
    try {
      const caCert = fs.readFileSync(caPath, 'utf8');
      return {
        ca: caCert,
        rejectUnauthorized: true,
      };
    } catch (err) {
      console.warn(`[DatabaseConfig] Failed to read DB_SSL_CA_PATH at "${caPath}", falling back to rejectUnauthorized: false: ${err.message}`);
    }
  }

  return {
    rejectUnauthorized: false,
  };
}

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 25060,
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'civiclens',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: resolveSslConfig(),
};

// Create MySQL connection pool
export const pool = mysql.createPool(dbConfig);

/**
 * Helper to execute a parameterized query with pool.
 * @param {string} sql - SQL query string with ? placeholders
 * @param {Array} params - Array of parameters
 * @returns {Promise<[any, any]>} - Result tuple [rows, fields]
 */
export async function query(sql, params = []) {
  try {
    return await pool.query(sql, params);
  } catch (err) {
    console.error(`[Database Query Error] ${err.message}`, { sql, params });
    throw err;
  }
}

/**
 * Ping / health check for database connection
 * Returns { connected: boolean, database: string, error?: string }
 */
export async function checkConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    const isOk = Array.isArray(rows) && rows.length > 0 && rows[0].ok === 1;
    return {
      connected: isOk,
      database: dbConfig.ssl ? 'MySQL (Aiven SSL)' : 'MySQL',
    };
  } catch (err) {
    return {
      connected: false,
      database: 'MySQL',
      error: err.message || 'Database connection failed',
    };
  }
}

export const ping = checkConnection;

/**
 * Transaction runner helper that manages beginTransaction, commit, and rollback safely.
 * @template T
 * @param {(connection: import('mysql2/promise').PoolConnection) => Promise<T>} callback
 * @returns {Promise<T>}
 */
export async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export default {
  pool,
  dbConfig,
  query,
  checkConnection,
  ping,
  withTransaction,
};
