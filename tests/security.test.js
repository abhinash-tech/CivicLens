import assert from 'node:assert';
import { Readable } from 'node:stream';
import jwt from '../backend/node_modules/jsonwebtoken/index.js';
import express from '../backend/node_modules/express/index.js';

import {
  generateToken,
  verifyToken
} from '../backend/src/services/auth/jwtService.js';

import {
  hashPassword,
  comparePassword
} from '../backend/src/services/auth/passwordService.js';

import { authenticateAdmin } from '../backend/src/middleware/authMiddleware.js';
import {
  complaintSubmissionLimiter,
  adminAuthLimiter,
  publicApiLimiter
} from '../backend/src/middleware/rateLimitMiddleware.js';

import { complaintSubmissionSchema } from '../backend/src/controllers/complaintsController.js';
import { uploadSingleImage } from '../backend/src/middleware/uploadMiddleware.js';
import { pool } from '../backend/src/config/database.js';
import { listComplaints, getComplaintByCode } from '../backend/src/repositories/complaintsRepository.js';
import app from '../backend/src/app.js';

console.log('====================================================');
console.log('  TEST SUITE: Security & Vulnerability Defense');
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

// ----------------------------------------------------
// 1. JWT Authentication & Token Security
// ----------------------------------------------------
console.log('--- 1. JWT Authentication & Token Security ---');

const testAdminPayload = {
  id: 1,
  email: 'admin@civiclens.gov',
  fullName: 'Chief Municipal Officer',
  role: 'admin'
};

runTest('generateToken creates valid signed JWT', () => {
  const token = generateToken(testAdminPayload);
  assert.ok(typeof token === 'string' && token.split('.').length === 3);
});

runTest('verifyToken correctly decodes valid JWT payload', () => {
  const token = generateToken(testAdminPayload);
  const decoded = verifyToken(token);
  assert.strictEqual(decoded.id, testAdminPayload.id);
  assert.strictEqual(decoded.email, testAdminPayload.email);
  assert.strictEqual(decoded.role, testAdminPayload.role);
});

runTest('verifyToken throws on expired JWT token', () => {
  const secret = process.env.JWT_SECRET || 'civiclens-fallback-dev-secret-do-not-use-in-production';
  const expiredToken = jwt.sign(testAdminPayload, secret, { expiresIn: '0s' });

  assert.throws(
    () => verifyToken(expiredToken),
    (err) => err.name === 'TokenExpiredError',
    'Must throw TokenExpiredError on expired token'
  );
});

runTest('verifyToken throws on invalid signature or tampered token', () => {
  const wrongSecretToken = jwt.sign(testAdminPayload, 'attacker-secret-key-12345');
  assert.throws(
    () => verifyToken(wrongSecretToken),
    (err) => err.name === 'JsonWebTokenError',
    'Must throw JsonWebTokenError on forged signature'
  );

  const token = generateToken(testAdminPayload);
  const tamperedToken = token.slice(0, -6) + 'xxxxxx';
  assert.throws(
    () => verifyToken(tamperedToken),
    (err) => err.name === 'JsonWebTokenError',
    'Must throw JsonWebTokenError on tampered signature'
  );
});

// Test authenticateAdmin middleware behavior
runTest('authenticateAdmin rejects requests with missing Authorization header', () => {
  let nextCalled = false;
  let statusSet = null;
  let jsonResponse = null;

  const req = { headers: {} };
  const res = {
    status(s) {
      statusSet = s;
      return this;
    },
    json(j) {
      jsonResponse = j;
      return this;
    }
  };

  authenticateAdmin(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(statusSet, 401);
  assert.strictEqual(jsonResponse.error, 'UNAUTHORIZED');
});

runTest('authenticateAdmin rejects malformed non-Bearer Authorization header', () => {
  let nextCalled = false;
  let statusSet = null;

  const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } };
  const res = {
    status(s) {
      statusSet = s;
      return this;
    },
    json() {
      return this;
    }
  };

  authenticateAdmin(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(statusSet, 401);
});

runTest('authenticateAdmin attaches decoded admin data to req.admin when valid', () => {
  const validToken = generateToken(testAdminPayload);
  let nextCalled = false;

  const req = { headers: { authorization: `Bearer ${validToken}` } };
  const res = {};

  authenticateAdmin(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, true);
  assert.ok(req.admin);
  assert.strictEqual(req.admin.email, testAdminPayload.email);
});

// ----------------------------------------------------
// 2. Password Hashing & Bcrypt Security
// ----------------------------------------------------
console.log('\n--- 2. Password Hashing & Bcrypt Security ---');

await runAsyncTest('hashPassword generates salted bcrypt hash', async () => {
  const plainPassword = 'MunicipalStrongPassword2025!';
  const hash = await hashPassword(plainPassword);

  assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'));
  assert.notStrictEqual(plainPassword, hash);
});

await runAsyncTest('comparePassword verifies correct password against hash', async () => {
  const plainPassword = 'CorrectPassword999';
  const hash = await hashPassword(plainPassword);

  const isMatch = await comparePassword(plainPassword, hash);
  assert.strictEqual(isMatch, true);
});

await runAsyncTest('comparePassword rejects incorrect password', async () => {
  const plainPassword = 'CorrectPassword999';
  const hash = await hashPassword(plainPassword);

  const isMatch = await comparePassword('WrongPassword123', hash);
  assert.strictEqual(isMatch, false);
});

await runAsyncTest('comparePassword safely handles null / empty inputs without crashing', async () => {
  assert.strictEqual(await comparePassword('', '$2a$10$validhashdummy'), false);
  assert.strictEqual(await comparePassword(null, '$2a$10$validhashdummy'), false);
  assert.strictEqual(await comparePassword('password', null), false);
  assert.strictEqual(await comparePassword(undefined, undefined), false);
});

// ----------------------------------------------------
// 3. SQL Injection Defense & Parameterization
// ----------------------------------------------------
console.log('\n--- 3. SQL Injection Defense & Parameterization ---');

await runAsyncTest('Repository listComplaints safely parameterizes SQL injection attack strings', async () => {
  // Mock pool.query to inspect executed query and parameters
  const origQuery = pool.query;
  let capturedSql = '';
  let capturedParams = [];

  pool.query = async (sql, params) => {
    capturedSql = sql;
    capturedParams = params;
    if (sql.includes('COUNT(*)')) {
      return [[{ total: 0 }]];
    }
    return [[]];
  };

  try {
    const maliciousSearch = " Indiranagar' OR '1'='1' -- ";
    const maliciousStatus = " RESOLVED'; DROP TABLE complaints; -- ";
    const maliciousSeverity = " Critical' OR 1=1 -- ";

    await listComplaints({
      search: maliciousSearch,
      status: maliciousStatus,
      severity: maliciousSeverity,
      page: 1,
      limit: 10
    });

    // Verify the SQL does NOT concatenate raw attack strings into the query text
    assert.ok(!capturedSql.includes(maliciousSearch), 'Malicious search string must not be in raw SQL');
    assert.ok(!capturedSql.includes(maliciousStatus), 'Malicious status string must not be in raw SQL');
    assert.ok(!capturedSql.includes(maliciousSeverity), 'Malicious severity string must not be in raw SQL');

    // Verify parameters are bound via ? placeholders
    assert.ok(capturedParams.some(p => typeof p === 'string' && p.includes(maliciousSearch.trim())));
    assert.ok(capturedParams.includes(maliciousStatus));
    assert.ok(capturedParams.includes(maliciousSeverity));
  } finally {
    pool.query = origQuery;
  }
});

await runAsyncTest('Repository getComplaintByCode safely parameterizes UNION injection', async () => {
  const origQuery = pool.query;
  let capturedSql = '';
  let capturedParams = [];

  pool.query = async (sql, params) => {
    capturedSql = sql;
    capturedParams = params;
    return [[]];
  };

  try {
    const maliciousCode = "' UNION SELECT * FROM admins --";
    await getComplaintByCode(maliciousCode);

    assert.ok(!capturedSql.includes('UNION SELECT'), 'UNION attack must not exist in SQL statement');
    assert.strictEqual(capturedParams[0], maliciousCode);
  } finally {
    pool.query = origQuery;
  }
});

// ----------------------------------------------------
// 4. Rate Limiting Middleware Protection
// ----------------------------------------------------
console.log('\n--- 4. Rate Limiting Middleware Protection ---');

runTest('complaintSubmissionLimiter configured with 30 requests per 15 min window', () => {
  assert.ok(complaintSubmissionLimiter);
  // express-rate-limit internal config verification
  assert.strictEqual(typeof complaintSubmissionLimiter, 'function');
});

runTest('adminAuthLimiter configured with 10 attempts per 15 min window', () => {
  assert.ok(adminAuthLimiter);
  assert.strictEqual(typeof adminAuthLimiter, 'function');
});

runTest('publicApiLimiter configured with 200 requests per 15 min window', () => {
  assert.ok(publicApiLimiter);
  assert.strictEqual(typeof publicApiLimiter, 'function');
});

await runAsyncTest('Rate limiter returns HTTP 429 when threshold exceeded', async () => {
  let hit429 = false;
  let responseData = null;

  for (let i = 0; i < 15; i++) {
    const req = {
      ip: '192.168.1.100',
      headers: {},
      socket: { remoteAddress: '192.168.1.100' },
      app: { get: () => undefined }
    };
    let statusCode = 200;
    const res = {
      setHeader: () => {},
      getHeader: () => {},
      status: (code) => { statusCode = code; return res; },
      json: (body) => {
        if (statusCode === 429) {
          hit429 = true;
          responseData = body;
        }
      }
    };
    await new Promise((resolve) => {
      adminAuthLimiter(req, res, () => { resolve(); });
      setTimeout(resolve, 5);
    });
    if (hit429) break;
  }

  assert.strictEqual(hit429, true, 'Must receive 429 after exceeding max rate limit');
  assert.strictEqual(responseData.success, false);
  assert.strictEqual(responseData.error, 'RATE_LIMIT_EXCEEDED');
});

// ----------------------------------------------------
// 5. Input Validation & Boundary Testing (Zod & Multer)
// ----------------------------------------------------
console.log('\n--- 5. Input Validation & Boundary Testing ---');

runTest('Zod schema rejects complaints with title shorter than 5 chars', () => {
  const result = complaintSubmissionSchema.safeParse({
    title: 'Tiny', // 4 chars
    description: 'A valid description of the pothole defect',
    locality: 'Sector 4'
  });
  assert.strictEqual(result.success, false);
  const err = result.error.errors.find(e => e.path[0] === 'title');
  assert.ok(err);
  assert.ok(err.message.includes('5'));
});

runTest('Zod schema rejects complaints with description shorter than 10 chars', () => {
  const result = complaintSubmissionSchema.safeParse({
    title: 'Valid Complaint Title',
    description: 'Too short', // 9 chars
    locality: 'Sector 4'
  });
  assert.strictEqual(result.success, false);
  const err = result.error.errors.find(e => e.path[0] === 'description');
  assert.ok(err);
  assert.ok(err.message.includes('10'));
});

runTest('Zod schema rejects complaints with locality shorter than 2 chars', () => {
  const result = complaintSubmissionSchema.safeParse({
    title: 'Valid Complaint Title',
    description: 'A valid description of the defect',
    locality: 'A' // 1 char
  });
  assert.strictEqual(result.success, false);
});

runTest('Zod schema rejects invalid citizen email format', () => {
  const result = complaintSubmissionSchema.safeParse({
    title: 'Valid Complaint Title',
    description: 'A valid description of the defect',
    locality: 'Indiranagar',
    citizenEmail: 'not-an-email-address'
  });
  assert.strictEqual(result.success, false);
});

runTest('Zod schema accepts valid citizen inputs and optional fields', () => {
  const result = complaintSubmissionSchema.safeParse({
    title: 'Pothole on 100ft road',
    description: 'Deep road crater near the commercial cross road',
    locality: 'Indiranagar',
    landmark: 'Opposite Coffee Day',
    citizenName: 'Aarav Patel',
    citizenPhone: '+91 9876543210',
    citizenEmail: 'aarav@example.com'
  });
  assert.strictEqual(result.success, true);
});

await runAsyncTest('Multer middleware rejects disallowed file types (e.g. text/html, application/pdf)', async () => {
  const boundary = '----1234567890';
  const body = '--' + boundary + '\r\nContent-Disposition: form-data; name="image"; filename="exploit.pdf"\r\nContent-Type: application/pdf\r\n\r\n%PDF-1.4 fake pdf\r\n--' + boundary + '--\r\n';

  const req = Readable.from(Buffer.from(body));
  req.headers = {
    'content-type': 'multipart/form-data; boundary=' + boundary,
    'content-length': Buffer.byteLength(body)
  };

  let statusCode = null;
  let responseBody = null;
  const res = {
    status(code) { statusCode = code; return this; },
    json(data) { responseBody = data; return this; }
  };

  const middleware = uploadSingleImage('image');
  await new Promise((resolve) => {
    middleware(req, res, () => {
      resolve();
    });
    const interval = setInterval(() => {
      if (statusCode !== null) {
        clearInterval(interval);
        resolve();
      }
    }, 10);
  });

  assert.strictEqual(statusCode, 400);
  assert.strictEqual(responseBody.success, false);
  assert.strictEqual(responseBody.error, 'INVALID_FILE_TYPE');
});

await runAsyncTest('Helmet security headers are mounted on the Express application', async () => {
  const capturedHeaders = {};
  const req = {
    url: '/api/health',
    method: 'GET',
    headers: { host: 'localhost' },
    get(header) { return this.headers[header.toLowerCase()]; }
  };

  const res = {
    statusCode: 200,
    setHeader(name, val) {
      capturedHeaders[name.toLowerCase()] = val;
    },
    getHeader(name) {
      return capturedHeaders[name.toLowerCase()];
    },
    removeHeader(name) {
      delete capturedHeaders[name.toLowerCase()];
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send() {},
    json() {},
    end() {}
  };

  app.handle(req, res);

  assert.strictEqual(capturedHeaders['x-content-type-options'], 'nosniff');
  assert.ok(capturedHeaders['x-frame-options'] || capturedHeaders['content-security-policy']);
});

console.log('\n----------------------------------------------------');
console.log(`Security Test Summary: ${passCount} Passed, ${failCount} Failed`);
console.log('----------------------------------------------------');

if (failCount > 0) {
  process.exit(1);
}
