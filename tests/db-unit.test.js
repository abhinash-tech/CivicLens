import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import bcryptjs from '../backend/node_modules/bcryptjs/index.js';

import {
  pool,
  query,
  checkConnection,
  ping,
  withTransaction,
  dbConfig,
} from '../backend/src/config/database.js';

import {
  parseSqlStatements,
  runMigrations,
} from '../backend/database/run-migrations.js';

import {
  SAMPLE_COMPLAINTS,
  seedAdmin,
  seedComplaints,
  seed,
} from '../backend/database/seed.js';

import {
  complaintsRepository,
  generateComplaintCode,
  formatComplaintRow,
  createComplaint,
  getComplaintByCode,
  getComplaintById,
  listComplaints,
  updateComplaintStatus,
  getPublicStats,
  getPublicRecentComplaints,
  adminRepository,
  formatAdminRow,
  findAdminByEmail,
  createAdmin,
  findAdminById,
  statusHistoryRepository,
  formatStatusHistoryRow,
  getComplaintStatusHistory,
  addComplaintStatusHistory,
} from '../backend/src/repositories/index.js';

console.log('--- TEST 1: Database Config & Resilient Fallback ---');
assert.ok(pool, 'pool must be defined');
assert.strictEqual(typeof query, 'function', 'query helper must be a function');
assert.strictEqual(typeof checkConnection, 'function', 'checkConnection must be a function');
assert.strictEqual(typeof ping, 'function', 'ping must be a function');
assert.strictEqual(typeof withTransaction, 'function', 'withTransaction must be a function');

const health = await checkConnection();
assert.strictEqual(typeof health.connected, 'boolean', 'health.connected must be boolean');
assert.ok(health.database, 'health.database must be present');
console.log('✓ Test 1 passed: Database config and ping helper are resilient.');

console.log('\n--- TEST 2: Schema.sql and Migration Parser ---');
const schemaPath = path.resolve('backend/database/schema.sql');
assert.ok(fs.existsSync(schemaPath), 'schema.sql file must exist');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');
const statements = parseSqlStatements(schemaSql);
assert.strictEqual(statements.length, 3, 'Must parse exactly 3 CREATE TABLE statements');

assert.ok(statements[0].includes('CREATE TABLE IF NOT EXISTS admins'), 'Statement 1 must create admins table');
assert.ok(statements[1].includes('CREATE TABLE IF NOT EXISTS complaints'), 'Statement 2 must create complaints table');
assert.ok(statements[2].includes('CREATE TABLE IF NOT EXISTS complaint_status_history'), 'Statement 3 must create complaint_status_history table');

assert.ok(schemaSql.includes('ON DELETE CASCADE'), 'Must contain ON DELETE CASCADE constraint');
assert.ok(schemaSql.includes('idx_complaints_code'), 'Must index complaint_code');
assert.ok(schemaSql.includes('idx_complaints_status'), 'Must index status');
assert.ok(schemaSql.includes('idx_complaints_severity'), 'Must index severity');
assert.ok(schemaSql.includes('idx_complaints_department'), 'Must index department');
assert.ok(schemaSql.includes('idx_complaints_created_at'), 'Must index created_at');
console.log('✓ Test 2 passed: Schema and parser verified with all indexes & constraints.');

console.log('\n--- TEST 3: Seed Script & Sample Complaints ---');
assert.strictEqual(SAMPLE_COMPLAINTS.length, 6, 'Must have 6 sample complaints');
for (const sample of SAMPLE_COMPLAINTS) {
  assert.ok(sample.complaint_code.startsWith('CL-'), `Invalid code ${sample.complaint_code}`);
  assert.ok(sample.title, 'Complaint must have title');
  assert.ok(sample.description, 'Complaint must have description');
  assert.ok(sample.locality, 'Complaint must have locality');
  assert.ok(sample.issue_type, 'Complaint must have issue_type');
  assert.ok(sample.severity, 'Complaint must have severity');
  assert.ok(sample.department, 'Complaint must have department');
  assert.ok(sample.status, 'Complaint must have status');
  assert.ok(Array.isArray(sample.history), 'Complaint must have history array');
}

const samplePassword = 'AdminSecureCivic2025!';
const hash = await bcryptjs.hash(samplePassword, 10);
const isMatch = await bcryptjs.compare(samplePassword, hash);
assert.strictEqual(isMatch, true, 'Bcrypt password hashing must verify correctly');
console.log('✓ Test 3 passed: Seed data and bcrypt hashing verified.');

console.log('\n--- TEST 4: Repositories Logic & Formatting ---');
const code = generateComplaintCode();
assert.match(code, /^CL-\d{4}-\d{4}$/, 'Complaint code must match CL-YYYY-XXXX format');

const mockRow = {
  id: 42,
  complaint_code: 'CL-2025-9999',
  title: 'Water pipe leak',
  description: 'Gushing water on road',
  locality: 'Indiranagar',
  landmark: 'Metro Station',
  citizen_name: 'Jane Doe',
  citizen_phone: '9999988888',
  citizen_email: 'jane@example.com',
  image_url: 'https://example.com/img.jpg',
  image_public_id: 'img123',
  issue_type: 'Water Leak',
  severity: 'High',
  department: 'Water Supply',
  ai_summary: 'Major pipeline fracture',
  ai_risk_reason: 'Road flooding hazard',
  ai_recommended_action: 'Close isolation valve',
  ai_confidence: 'High',
  needs_human_review: 0,
  status: 'SUBMITTED',
  admin_notes: null,
  created_at: new Date('2025-11-22T10:00:00Z'),
  updated_at: new Date('2025-11-22T10:00:00Z'),
};

const mockHistory = [
  {
    id: 1,
    fromStatus: null,
    toStatus: 'SUBMITTED',
    changedBy: 'Citizen',
    changeReason: 'Report lodged',
    createdAt: new Date('2025-11-22T10:00:00Z'),
  },
];

const formatted = formatComplaintRow(mockRow, mockHistory);
assert.strictEqual(formatted.complaintCode, 'CL-2025-9999');
assert.strictEqual(formatted.aiAssessment.summary, 'Major pipeline fracture');
assert.strictEqual(formatted.aiAssessment.severity, 'High');
assert.strictEqual(formatted.needsHumanReview, false);
assert.strictEqual(formatted.timeline.length, 1);
assert.strictEqual(formatted.timeline[0].status, 'SUBMITTED');

const mockAdminRow = {
  id: 1,
  email: 'admin@civiclens.gov',
  password_hash: hash,
  full_name: 'Chief Admin',
  role: 'admin',
  created_at: new Date(),
};
const formattedAdmin = formatAdminRow(mockAdminRow);
assert.strictEqual(formattedAdmin.email, 'admin@civiclens.gov');
assert.strictEqual(formattedAdmin.fullName, 'Chief Admin');

const mockHistoryRow = {
  id: 10,
  complaint_id: 42,
  from_status: 'SUBMITTED',
  to_status: 'IN_REVIEW',
  changed_by: 'Admin',
  change_reason: 'Investigating',
  created_at: new Date(),
};
const formattedHist = formatStatusHistoryRow(mockHistoryRow);
assert.strictEqual(formattedHist.complaintId, 42);
assert.strictEqual(formattedHist.fromStatus, 'SUBMITTED');
assert.strictEqual(formattedHist.toStatus, 'IN_REVIEW');

console.log('✓ Test 4 passed: All domain mapping, normalizations, and helpers verified.');

console.log('\n--- TEST 5: Repositories Index Exports ---');
assert.strictEqual(typeof createComplaint, 'function');
assert.strictEqual(typeof getComplaintByCode, 'function');
assert.strictEqual(typeof getComplaintById, 'function');
assert.strictEqual(typeof listComplaints, 'function');
assert.strictEqual(typeof updateComplaintStatus, 'function');
assert.strictEqual(typeof getPublicStats, 'function');
assert.strictEqual(typeof getPublicRecentComplaints, 'function');
assert.strictEqual(typeof findAdminByEmail, 'function');
assert.strictEqual(typeof createAdmin, 'function');
assert.strictEqual(typeof findAdminById, 'function');
assert.strictEqual(typeof getComplaintStatusHistory, 'function');
assert.strictEqual(typeof addComplaintStatusHistory, 'function');
assert.ok(complaintsRepository);
assert.ok(adminRepository);
assert.ok(statusHistoryRepository);
console.log('✓ Test 5 passed: All repository exports verified cleanly.');

await pool.end();
console.log('\nALL DATABASE UNIT TESTS PASSED SUCCESSFULLY! 🚀');
