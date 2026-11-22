import { checkConnection } from '../config/database.js';

/**
 * Health check for the backend Express application.
 * GET /api/health
 */
export async function getHealth(req, res) {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
}

/**
 * Health check for the database connection.
 * GET /api/health/db
 */
export async function getDatabaseHealth(req, res) {
  try {
    const health = await checkConnection();

    if (health.connected) {
      return res.status(200).json({
        success: true,
        data: {
          status: 'connected',
          database: 'MySQL (Aiven)'
        }
      });
    }

    return res.status(503).json({
      success: false,
      error: 'DATABASE_UNAVAILABLE',
      message: health.error || 'Database ping failed'
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      error: 'DATABASE_UNAVAILABLE',
      message: err.message || 'Database ping failed'
    });
  }
}

export default {
  getHealth,
  getDatabaseHealth
};
