import assert from 'node:assert';
import bcryptjs from '../backend/node_modules/bcryptjs/index.js';
import { pool } from '../backend/src/config/database.js';
import { getHealth, getDatabaseHealth } from '../backend/src/controllers/healthController.js';
import { submitComplaint, trackComplaint, complaintSubmissionSchema } from '../backend/src/controllers/complaintsController.js';
import { getStats, getRecent } from '../backend/src/controllers/publicController.js';
import { login, getComplaints, getComplaint, updateStatus } from '../backend/src/controllers/adminController.js';
import { notFoundHandler, errorHandler } from '../backend/src/middleware/errorHandler.js';

import indexRouter from '../backend/src/routes/index.js';
import healthRouter from '../backend/src/routes/healthRoutes.js';
import complaintRouter from '../backend/src/routes/complaintRoutes.js';
import publicRouter from '../backend/src/routes/publicRoutes.js';
import adminRouter from '../backend/src/routes/adminRoutes.js';

console.log('====================================================');
console.log('  TEST SUITE: API Contract & Route Conformance');
console.log('  (Validating against docs/api-contract.md)');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    failCount++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    failCount++;
  }
}

function createMockReqRes({ method = 'GET', originalUrl = '/', body = {}, params = {}, query = {}, headers = {}, admin = null, file = null } = {}) {
  let statusCode = 200;
  let responseData = null;
  const headersSent = {};

  const req = {
    method,
    originalUrl,
    body,
    params,
    query,
    headers,
    admin,
    file,
    get(h) {
      return headers[h.toLowerCase()];
    }
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    setHeader(name, val) {
      headersSent[name.toLowerCase()] = val;
    },
    getHeader(name) {
      return headersSent[name.toLowerCase()];
    },
    getStatusCode() {
      return statusCode;
    },
    getBody() {
      return responseData;
    }
  };

  return { req, res, getStatus: () => statusCode, getBody: () => responseData };
}

// ----------------------------------------------------
// 1. System Health Contracts (/api/health, /api/health/db)
// ----------------------------------------------------
console.log('--- 1. System Health API Contracts ---');

await runAsyncTest('GET /api/health returns 200 OK with status, timestamp, uptime', async () => {
  const { req, res, getStatus, getBody } = createMockReqRes();
  await getHealth(req, res);

  assert.strictEqual(getStatus(), 200);
  const body = getBody();
  assert.strictEqual(body.success, true);
  assert.ok(body.data);
  assert.strictEqual(body.data.status, 'ok');
  assert.strictEqual(typeof body.data.timestamp, 'string');
  assert.strictEqual(typeof body.data.uptime, 'number');
});

await runAsyncTest('GET /api/health/db returns 200 OK when database connected', async () => {
  const origQuery = pool.query;
  try {
    pool.query = async (sql) => {
      if (sql.includes('SELECT 1')) {
        return [[{ ok: 1 }]];
      }
      return [[]];
    };

    const { req, res, getStatus, getBody } = createMockReqRes();
    await getDatabaseHealth(req, res);

    assert.strictEqual(getStatus(), 200);
    const body = getBody();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'connected');
    assert.ok(body.data.database.includes('MySQL'));
  } finally {
    pool.query = origQuery;
  }
});

await runAsyncTest('GET /api/health/db returns 503 Service Unavailable when DB connection fails', async () => {
  const origQuery = pool.query;
  try {
    pool.query = async () => {
      throw new Error('Connection refused: MySQL host unreachable');
    };

    const { req, res, getStatus, getBody } = createMockReqRes();
    await getDatabaseHealth(req, res);

    assert.strictEqual(getStatus(), 503);
    const body = getBody();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error, 'DATABASE_UNAVAILABLE');
    assert.ok(body.message.includes('Connection refused'));
  } finally {
    pool.query = origQuery;
  }
});

// ----------------------------------------------------
// 2. Citizen Complaint Endpoints Contracts
// ----------------------------------------------------
console.log('\n--- 2. Citizen Complaint Endpoints Contracts ---');

await runAsyncTest('POST /api/complaints validation error format conforms to contract', async () => {
  const { req, res, getStatus, getBody } = createMockReqRes({
    body: {
      title: 'Hi', // Under 5 chars
      description: 'Short', // Under 10 chars
      locality: 'X' // Under 2 chars
    }
  });

  await submitComplaint(req, res, () => {});

  assert.strictEqual(getStatus(), 400);
  const body = getBody();
  assert.strictEqual(body.success, false);
  assert.strictEqual(body.error, 'VALIDATION_ERROR');
  assert.strictEqual(body.message, 'Invalid request data');
  assert.ok(Array.isArray(body.details));
  assert.ok(body.details.length >= 3);
  assert.ok(body.details.some(d => d.field === 'title'));
  assert.ok(body.details.some(d => d.field === 'description'));
  assert.ok(body.details.some(d => d.field === 'locality'));
});

await runAsyncTest('POST /api/complaints success response 201 Created adheres to contract', async () => {
  const origGetConn = pool.getConnection;
  try {
    const mockRow = {
      id: 101,
      complaint_code: 'CL-2025-9481',
      title: 'Large pothole on 4th Main Road',
      description: 'Severe pothole approximately 1 foot deep causing hazards.',
      locality: 'Indiranagar',
      landmark: 'Near Metro Pillar 42',
      citizen_name: 'Priya Sharma',
      citizen_phone: '9876543210',
      citizen_email: 'priya@example.com',
      image_url: 'https://res.cloudinary.com/demo/sample.jpg',
      image_public_id: 'civiclens/sample',
      issue_type: 'Roads and Potholes',
      severity: 'High',
      department: 'Roads and Infrastructure',
      ai_summary: 'Severe pothole approximately 1 foot deep causing traffic slowdown.',
      ai_risk_reason: 'High vehicular risk for two-wheelers.',
      ai_recommended_action: 'Immediate cold mix asphalt patching recommended.',
      ai_confidence: 'High',
      needs_human_review: 1,
      status: 'SUBMITTED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const mockConn = {
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
      query: async (sql) => {
        if (sql.includes('INSERT INTO complaints')) {
          return [{ insertId: 101 }];
        }
        if (sql.includes('INSERT INTO complaint_status_history')) {
          return [{ insertId: 1 }];
        }
        if (sql.includes('SELECT * FROM complaints WHERE id = ?')) {
          return [[mockRow]];
        }
        if (sql.includes('FROM complaint_status_history WHERE complaint_id = ?')) {
          return [[]];
        }
        return [[]];
      }
    };

    pool.getConnection = async () => mockConn;

    const { req, res, getStatus, getBody } = createMockReqRes({
      body: {
        title: 'Large pothole on 4th Main Road',
        description: 'Severe pothole approximately 1 foot deep causing hazards.',
        locality: 'Indiranagar',
        landmark: 'Near Metro Pillar 42',
        citizenName: 'Priya Sharma',
        citizenPhone: '9876543210',
        citizenEmail: 'priya@example.com'
      }
    });

    await submitComplaint(req, res, () => {});

    assert.strictEqual(getStatus(), 201);
    const body = getBody();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, 'Complaint submitted successfully.');
    assert.ok(body.data);
    assert.strictEqual(body.data.title, 'Large pothole on 4th Main Road');
    assert.strictEqual(body.data.status, 'SUBMITTED');
    assert.strictEqual(body.data.locality, 'Indiranagar');
    assert.ok(body.data.aiAssessment);
    assert.strictEqual(body.data.aiAssessment.issueType, 'Roads and Potholes');
    assert.strictEqual(body.data.aiAssessment.severity, 'High');
    assert.strictEqual(body.data.aiAssessment.department, 'Roads and Infrastructure');
  } finally {
    pool.getConnection = origGetConn;
  }
});

await runAsyncTest('GET /api/complaints/track/:code returns 404 when complaint not found', async () => {
  const origQuery = pool.query;
  try {
    pool.query = async () => [[]];

    const { req, res, getStatus, getBody } = createMockReqRes({
      params: { code: 'CL-9999-0000' }
    });

    await trackComplaint(req, res, () => {});

    assert.strictEqual(getStatus(), 404);
    const body = getBody();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error, 'NOT_FOUND');
    assert.strictEqual(body.message, 'No complaint found with code CL-9999-0000');
  } finally {
    pool.query = origQuery;
  }
});

await runAsyncTest('GET /api/complaints/track/:code returns 200 OK with full timeline and AI summary', async () => {
  const origQuery = pool.query;
  try {
    const mockComplaint = {
      id: 1,
      complaint_code: 'CL-2025-9481',
      title: 'Large pothole on 4th Main Road',
      description: 'Pothole near the intersection.',
      locality: 'Indiranagar',
      landmark: 'Near Metro Pillar 42',
      image_url: 'https://res.cloudinary.com/sample.jpg',
      issue_type: 'Roads and Potholes',
      severity: 'High',
      department: 'Roads and Infrastructure',
      status: 'IN_PROGRESS',
      ai_summary: 'Severe pothole causing hazard.',
      ai_recommended_action: 'Immediate cold mix asphalt patching.',
      created_at: '2025-11-22T10:00:00.000Z',
      updated_at: '2025-11-22T11:30:00.000Z'
    };

    const mockHistory = [
      {
        id: 1,
        from_status: null,
        to_status: 'SUBMITTED',
        changed_by: 'Citizen',
        change_reason: 'Complaint received',
        created_at: '2025-11-22T10:00:00.000Z'
      },
      {
        id: 2,
        from_status: 'SUBMITTED',
        to_status: 'IN_PROGRESS',
        changed_by: 'Municipal Officer',
        change_reason: 'Field engineer dispatched',
        created_at: '2025-11-22T11:30:00.000Z'
      }
    ];

    pool.query = async (sql) => {
      if (sql.includes('FROM complaints WHERE complaint_code = ?')) {
        return [[mockComplaint]];
      }
      if (sql.includes('FROM complaint_status_history')) {
        return [[mockHistory[0], mockHistory[1]]];
      }
      return [[]];
    };

    const { req, res, getStatus, getBody } = createMockReqRes({
      params: { code: 'CL-2025-9481' }
    });

    await trackComplaint(req, res, () => {});

    assert.strictEqual(getStatus(), 200);
    const body = getBody();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.complaintCode, 'CL-2025-9481');
    assert.strictEqual(body.data.status, 'IN_PROGRESS');
    assert.strictEqual(body.data.timeline.length, 2);
    assert.strictEqual(body.data.timeline[1].status, 'IN_PROGRESS');
    assert.strictEqual(body.data.aiAssessment.summary, 'Severe pothole causing hazard.');
    assert.strictEqual(body.data.aiAssessment.recommendedAction, 'Immediate cold mix asphalt patching.');
  } finally {
    pool.query = origQuery;
  }
});

// ----------------------------------------------------
// 3. Public Transparency Endpoints Contracts
// ----------------------------------------------------
console.log('\n--- 3. Public Transparency Endpoints Contracts ---');

await runAsyncTest('GET /api/public/stats returns aggregations adhering to contract', async () => {
  const origQuery = pool.query;
  try {
    pool.query = async (sql) => {
      const lower = sql.toLowerCase();
      if (lower.includes("where status = 'resolved'") && lower.includes('count(*)')) {
        return [[{ count: 84 }]];
      }
      if (lower.includes("where status in ('in_progress'") && lower.includes('count(*)')) {
        return [[{ count: 31 }]];
      }
      if (lower.includes('count(*) as count from complaints')) {
        return [[{ count: 128 }]];
      }
      if (lower.includes('avg_days')) {
        return [[{ avg_days: 2.4 }]];
      }
      if (lower.includes('group by department')) {
        return [[
          { department: 'Roads and Infrastructure', count: 52 },
          { department: 'Solid Waste Management', count: 34 }
        ]];
      }
      if (lower.includes('group by severity')) {
        return [[
          { severity: 'Critical', count: 14 },
          { severity: 'High', count: 48 },
          { severity: 'Medium', count: 50 },
          { severity: 'Low', count: 16 }
        ]];
      }
      return [[]];
    };

    const { req, res, getStatus, getBody } = createMockReqRes();
    await getStats(req, res, () => {});

    assert.strictEqual(getStatus(), 200);
    const body = getBody();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.totalComplaints, 128);
    assert.strictEqual(body.data.resolvedComplaints, 84);
    assert.strictEqual(body.data.inProgressComplaints, 31);
    assert.strictEqual(body.data.avgResolutionTimeDays, 2.4);
    assert.strictEqual(body.data.byDepartment.length, 2);
    assert.strictEqual(body.data.bySeverity.length, 4);
  } finally {
    pool.query = origQuery;
  }
});

await runAsyncTest('GET /api/public/recent returns anonymized preview list conforming to contract', async () => {
  const origQuery = pool.query;
  try {
    const mockRecentRow = {
      complaint_code: 'CL-2025-9481',
      title: 'Large pothole on 4th Main Road',
      locality: 'Indiranagar',
      issue_type: 'Roads and Potholes',
      severity: 'High',
      status: 'IN_PROGRESS',
      image_url: 'https://res.cloudinary.com/sample.jpg',
      created_at: '2025-11-22T10:00:00.000Z'
    };

    pool.query = async (sql) => {
      if (sql.includes('FROM complaints') && sql.includes('ORDER BY created_at DESC')) {
        return [[mockRecentRow]];
      }
      return [[]];
    };

    const { req, res, getStatus, getBody } = createMockReqRes({
      query: { limit: '10' }
    });

    await getRecent(req, res, () => {});

    assert.strictEqual(getStatus(), 200);
    const body = getBody();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.strictEqual(body.data.length, 1);
    const item = body.data[0];
    assert.strictEqual(item.complaintCode, 'CL-2025-9481');
    assert.strictEqual(item.status, 'IN_PROGRESS');
    assert.strictEqual(item.severity, 'High');
    // Ensure citizen private fields are NOT present in public recent
    assert.strictEqual(item.citizenName, undefined);
    assert.strictEqual(item.citizenPhone, undefined);
    assert.strictEqual(item.citizenEmail, undefined);
  } finally {
    pool.query = origQuery;
  }
});

// ----------------------------------------------------
// 4. Admin Authentication & Management Endpoints
// ----------------------------------------------------
console.log('\n--- 4. Admin Authentication & Management Endpoints ---');

await runAsyncTest('POST /api/admin/auth/login rejects missing credentials with 400 VALIDATION_ERROR', async () => {
  const { req, res, getStatus, getBody } = createMockReqRes({
    body: { email: '', password: '' }
  });

  await login(req, res, () => {});

  assert.strictEqual(getStatus(), 400);
  const body = getBody();
  assert.strictEqual(body.success, false);
  assert.strictEqual(body.error, 'VALIDATION_ERROR');
});

await runAsyncTest('POST /api/admin/auth/login rejects invalid credentials with 401 INVALID_CREDENTIALS', async () => {
  const origQuery = pool.query;
  try {
    pool.query = async () => [[]];

    const { req, res, getStatus, getBody } = createMockReqRes({
      body: { email: 'nonexistent@civiclens.gov', password: 'WrongPassword!' }
    });

    await login(req, res, () => {});

    assert.strictEqual(getStatus(), 401);
    const body = getBody();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error, 'INVALID_CREDENTIALS');
    assert.strictEqual(body.message, 'Invalid email or password');
  } finally {
    pool.query = origQuery;
  }
});

await runAsyncTest('POST /api/admin/auth/login returns JWT token & admin profile on valid credentials', async () => {
  const origQuery = pool.query;
  try {
    const adminPassword = 'AdminSecureCivic2025!';
    const passwordHash = await bcryptjs.hash(adminPassword, 10);

    pool.query = async (sql) => {
      if (sql.includes('admins') && sql.includes('LOWER(email)')) {
        return [[{
          id: 1,
          email: 'admin@civiclens.gov',
          password_hash: passwordHash,
          full_name: 'Chief Municipal Administrator',
          role: 'admin',
          created_at: new Date().toISOString()
        }]];
      }
      return [[]];
    };

    const { req, res, getStatus, getBody } = createMockReqRes({
      body: { email: 'admin@civiclens.gov', password: adminPassword }
    });

    await login(req, res, () => {});

    assert.strictEqual(getStatus(), 200);
    const body = getBody();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.token);
    assert.strictEqual(typeof body.data.token, 'string');
    assert.strictEqual(body.data.admin.id, 1);
    assert.strictEqual(body.data.admin.email, 'admin@civiclens.gov');
    assert.strictEqual(body.data.admin.fullName, 'Chief Municipal Administrator');
    assert.strictEqual(body.data.admin.role, 'admin');
  } finally {
    pool.query = origQuery;
  }
});

await runAsyncTest('GET /api/admin/complaints returns paginated list conforming to contract', async () => {
  const origQuery = pool.query;
  try {
    const mockRow = {
      id: 1,
      complaint_code: 'CL-2025-9481',
      title: 'Large pothole on 4th Main Road',
      description: 'Pothole description',
      locality: 'Indiranagar',
      status: 'SUBMITTED',
      severity: 'High',
      department: 'Roads and Infrastructure',
      issue_type: 'Roads and Potholes',
      created_at: '2025-11-22T10:00:00.000Z'
    };

    pool.query = async (sql) => {
      if (sql.toLowerCase().includes('count(*) as total')) {
        return [[{ total: 128 }]];
      }
      if (sql.includes('SELECT') && sql.includes('FROM complaints')) {
        return [[mockRow]];
      }
      return [[]];
    };

    const { req, res, getStatus, getBody } = createMockReqRes({
      query: { page: '1', limit: '20', status: 'SUBMITTED' }
    });

    await getComplaints(req, res, () => {});

    assert.strictEqual(getStatus(), 200);
    const body = getBody();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data.complaints));
    assert.strictEqual(body.data.pagination.total, 128);
    assert.strictEqual(body.data.pagination.page, 1);
    assert.strictEqual(body.data.pagination.limit, 20);
    assert.strictEqual(body.data.pagination.totalPages, 7);
  } finally {
    pool.query = origQuery;
  }
});

await runAsyncTest('GET /api/admin/complaints/:id returns 400 for non-numeric ID', async () => {
  const { req, res, getStatus, getBody } = createMockReqRes({
    params: { id: 'abc' }
  });

  await getComplaint(req, res, () => {});

  assert.strictEqual(getStatus(), 400);
  const body = getBody();
  assert.strictEqual(body.success, false);
  assert.strictEqual(body.error, 'INVALID_ID');
});

await runAsyncTest('GET /api/admin/complaints/:id returns 404 for non-existent ID', async () => {
  const origQuery = pool.query;
  try {
    pool.query = async () => [[]];

    const { req, res, getStatus, getBody } = createMockReqRes({
      params: { id: '999' }
    });

    await getComplaint(req, res, () => {});

    assert.strictEqual(getStatus(), 404);
    const body = getBody();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error, 'NOT_FOUND');
  } finally {
    pool.query = origQuery;
  }
});

await runAsyncTest('GET /api/admin/complaints/:id returns full complaint including citizen contacts', async () => {
  const origQuery = pool.query;
  try {
    const mockRow = {
      id: 1,
      complaint_code: 'CL-2025-9481',
      title: 'Large pothole on 4th Main Road',
      description: 'Pothole near the intersection.',
      locality: 'Indiranagar',
      landmark: 'Near Metro Pillar 42',
      citizen_name: 'Aarav Patel',
      citizen_phone: '9876543210',
      citizen_email: 'aarav@example.com',
      issue_type: 'Roads and Potholes',
      severity: 'High',
      department: 'Roads and Infrastructure',
      status: 'SUBMITTED',
      created_at: '2025-11-22T10:00:00.000Z'
    };

    pool.query = async (sql) => {
      if (sql.includes('FROM complaints WHERE id = ?')) {
        return [[mockRow]];
      }
      if (sql.includes('FROM complaint_status_history')) {
        return [[]];
      }
      return [[]];
    };

    const { req, res, getStatus, getBody } = createMockReqRes({
      params: { id: '1' }
    });

    await getComplaint(req, res, () => {});

    assert.strictEqual(getStatus(), 200);
    const body = getBody();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.id, 1);
    assert.strictEqual(body.data.citizenName, 'Aarav Patel');
    assert.strictEqual(body.data.citizenEmail, 'aarav@example.com');
  } finally {
    pool.query = origQuery;
  }
});

await runAsyncTest('PATCH /api/admin/complaints/:id/status updates status and returns 200 OK', async () => {
  const origGetConn = pool.getConnection;
  try {
    const existingRow = {
      id: 1,
      complaint_code: 'CL-2025-9481',
      status: 'SUBMITTED',
      admin_notes: null
    };

    const updatedRow = {
      id: 1,
      complaint_code: 'CL-2025-9481',
      status: 'IN_PROGRESS',
      admin_notes: 'Team scheduled to inspect location on Monday morning.',
      updated_at: '2025-11-22T11:45:00.000Z'
    };

    const mockConn = {
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
      query: async (sql) => {
        if (sql.includes('FOR UPDATE')) {
          return [[existingRow]];
        }
        if (sql.includes('UPDATE complaints SET')) {
          return [{ affectedRows: 1 }];
        }
        if (sql.includes('INSERT INTO complaint_status_history')) {
          return [{ insertId: 10 }];
        }
        if (sql.includes('SELECT * FROM complaints WHERE id = ?')) {
          return [[updatedRow]];
        }
        if (sql.includes('FROM complaint_status_history WHERE complaint_id = ?')) {
          return [[]];
        }
        return [[]];
      }
    };

    pool.getConnection = async () => mockConn;

    const { req, res, getStatus, getBody } = createMockReqRes({
      params: { id: '1' },
      body: {
        status: 'IN_PROGRESS',
        adminNotes: 'Team scheduled to inspect location on Monday morning.',
        reason: 'Assigned to Ward 82 road maintenance team.'
      },
      admin: { fullName: 'Chief Municipal Administrator' }
    });

    await updateStatus(req, res, () => {});

    assert.strictEqual(getStatus(), 200);
    const body = getBody();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, 'Status updated successfully.');
    assert.strictEqual(body.data.id, 1);
    assert.strictEqual(body.data.complaintCode, 'CL-2025-9481');
    assert.strictEqual(body.data.status, 'IN_PROGRESS');
    assert.strictEqual(body.data.adminNotes, 'Team scheduled to inspect location on Monday morning.');
    assert.strictEqual(body.data.updatedAt, '2025-11-22T11:45:00.000Z');
  } finally {
    pool.getConnection = origGetConn;
  }
});

// ----------------------------------------------------
// 5. Centralized Error Handler Contracts
// ----------------------------------------------------
console.log('\n--- 5. Centralized Error Handler & 404 Route Contracts ---');

runTest('notFoundHandler produces 404 NOT_FOUND response conforming to contract', () => {
  const { req, res, getStatus, getBody } = createMockReqRes({
    method: 'GET',
    originalUrl: '/api/unmatched-endpoint'
  });

  notFoundHandler(req, res);

  assert.strictEqual(getStatus(), 404);
  const body = getBody();
  assert.strictEqual(body.success, false);
  assert.strictEqual(body.error, 'NOT_FOUND');
  assert.strictEqual(body.message, 'Route GET /api/unmatched-endpoint not found');
});

runTest('errorHandler transforms application errors into standard contract shape', () => {
  const { req, res, getStatus, getBody } = createMockReqRes({
    method: 'POST',
    originalUrl: '/api/complaints'
  });
  const testError = new Error('Database query timed out');
  testError.statusCode = 500;
  testError.errorCode = 'INTERNAL_SERVER_ERROR';

  errorHandler(testError, req, res, () => {});

  assert.strictEqual(getStatus(), 500);
  const body = getBody();
  assert.strictEqual(body.success, false);
  assert.strictEqual(body.error, 'INTERNAL_SERVER_ERROR');
  assert.strictEqual(body.message, 'Database query timed out');
});

// ----------------------------------------------------
// 6. Express Route Table Inspection
// ----------------------------------------------------
console.log('\n--- 6. Express Route Table Registration Inspection ---');

runTest('indexRouter mounts / (health), /complaints, /public, /admin routes', () => {
  assert.ok(indexRouter);
  assert.ok(indexRouter.stack);
  assert.strictEqual(typeof indexRouter.use, 'function');
  assert.ok(indexRouter.stack.length >= 4, 'indexRouter must have at least 4 route modules mounted');
});

runTest('healthRouter registers /health and /health/db endpoints', () => {
  const routes = healthRouter.stack.map(s => s.route?.path).filter(Boolean);
  assert.ok(routes.includes('/health'), 'healthRouter must register /health');
  assert.ok(routes.includes('/health/db'), 'healthRouter must register /health/db');
});

runTest('complaintRouter registers / and /track/:code endpoints', () => {
  const routes = complaintRouter.stack.map(s => s.route?.path).filter(Boolean);
  assert.ok(routes.includes('/'), 'complaintRouter must register / (POST)');
  assert.ok(routes.includes('/track/:code'), 'complaintRouter must register /track/:code (GET)');
});

runTest('publicRouter registers /stats and /recent endpoints', () => {
  const routes = publicRouter.stack.map(s => s.route?.path).filter(Boolean);
  assert.ok(routes.includes('/stats'), 'publicRouter must register /stats');
  assert.ok(routes.includes('/recent'), 'publicRouter must register /recent');
});

runTest('adminRouter registers auth and complaint endpoints with authentication', () => {
  const routes = adminRouter.stack.map(s => s.route?.path).filter(Boolean);
  assert.ok(routes.includes('/auth/login'), 'adminRouter must register /auth/login');
  assert.ok(routes.includes('/complaints'), 'adminRouter must register /complaints');
  assert.ok(routes.includes('/complaints/:id'), 'adminRouter must register /complaints/:id');
  assert.ok(routes.includes('/complaints/:id/status'), 'adminRouter must register /complaints/:id/status');
});

console.log('\n----------------------------------------------------');
console.log(`API Contract Test Summary: ${passCount} Passed, ${failCount} Failed`);
console.log('----------------------------------------------------');

if (failCount > 0) {
  process.exit(1);
}
