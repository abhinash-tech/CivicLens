import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, dbConfig, checkConnection } from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parses raw SQL script content into individual executable SQL statements.
 * Strips line comments and splits by semicolons cleanly.
 * @param {string} sqlContent
 * @returns {string[]}
 */
export function parseSqlStatements(sqlContent) {
  // Remove multi-line comments /* ... */
  const noMultiComments = sqlContent.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Split lines and filter out single line comments
  const lines = noMultiComments.split('\n');
  const cleanedLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('--') || trimmed.startsWith('#')) {
      return '';
    }
    // Remove inline comment if present
    const commentIndex = line.indexOf('--');
    if (commentIndex >= 0) {
      return line.substring(0, commentIndex);
    }
    return line;
  });

  const fullCleanSql = cleanedLines.join('\n');

  return fullCleanSql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
}

/**
 * Runs the database schema migrations.
 * @returns {Promise<boolean>}
 */
export async function runMigrations() {
  console.log('[Migration] Starting CivicLens database migration...');
  console.log(`[Migration] Target DB: ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database} (SSL: ${Boolean(dbConfig.ssl)})`);

  // Verify connectivity first
  const health = await checkConnection();
  if (!health.connected) {
    console.error(`[Migration] Database connection failed: ${health.error}`);
    console.error('[Migration] Please ensure valid DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, and DB_NAME are configured in your environment.');
    throw new Error(`Database connection failed: ${health.error}`);
  }

  const schemaPath = path.resolve(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at ${schemaPath}`);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const statements = parseSqlStatements(schemaSql);

  console.log(`[Migration] Found ${statements.length} SQL statements to execute.`);

  const connection = await pool.getConnection();
  try {
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.split('\n')[0].substring(0, 60);
      console.log(`[Migration] Executing [${i + 1}/${statements.length}]: ${preview}...`);
      await connection.query(statement);
    }
    console.log('[Migration] All schema migrations completed successfully.');
    return true;
  } catch (err) {
    console.error(`[Migration Error] Failed executing schema statement: ${err.message}`);
    throw err;
  } finally {
    connection.release();
  }
}

// Check if script is run directly from command line
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectRun) {
  runMigrations()
    .then(() => {
      console.log('[Migration] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migration] Migration process failed:', err.message);
      process.exit(1);
    })
    .finally(async () => {
      try {
        await pool.end();
      } catch {
        // ignore cleanup error
      }
    });
}
