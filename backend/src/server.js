import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables before importing app
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendEnvPath = path.resolve(__dirname, '../.env');
const rootEnvPath = path.resolve(__dirname, '../../.env');

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

import app from './app.js';
import { pool } from './config/database.js';

const PORT = parseInt(process.env.PORT, 10) || 5000;

const server = app.listen(PORT, () => {
  console.log(`[CivicLens Backend] Server running on port ${PORT}`);
  console.log(`[CivicLens Backend] API available at http://localhost:${PORT}/api`);
  console.log(`[CivicLens Backend] Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown handling
async function gracefulShutdown(signal) {
  console.log(`\n[CivicLens Backend] Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('[CivicLens Backend] Closed HTTP server.');
    try {
      if (pool && typeof pool.end === 'function') {
        await pool.end();
        console.log('[CivicLens Backend] Closed MySQL connection pool.');
      }
    } catch (err) {
      console.error('[CivicLens Backend] Error while closing MySQL pool:', err.message);
    }
    process.exit(0);
  });

  // Force shutdown if taking longer than 10s
  setTimeout(() => {
    console.error('[CivicLens Backend] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
