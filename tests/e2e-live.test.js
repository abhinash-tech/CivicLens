/**
 * CivicLens End-to-End Live Integration Verification
 * Tests the full Express server with live Aiven Cloud MySQL and Gemini AI.
 */

import assert from 'node:assert';
import http from 'node:http';
import app from '../backend/src/app.js';
import { pool } from '../backend/src/config/database.js';

const PORT = 5005; // Use 5005 for clean test isolate
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

console.log('================================================================');
console.log('         CIVICLENS FULL LIVE END-TO-END VERIFICATION            ');
console.log('  Testing Express Backend + Live Aiven MySQL + Gemini 3.8/2.5   ');
console.log('================================================================\n');

let server;

function startServer() {
  return new Promise((resolve) => {
    server = app.listen(PORT, '127.0.0.1', () => {
      console.log(`[Test Server] Live Express backend listening on ${BASE_URL}\n`);
      resolve();
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('\n[Test Server] Live Express backend stopped cleanly.');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

async function run() {
  await startServer();
  let adminToken = '';
  let newComplaintCode = '';
  let newComplaintId = null;

  try {
    // 1. Health check
    console.log('--- Step 1: Health Check (GET /api/health) ---');
    const resHealth = await fetch(`${BASE_URL}/health`);
    assert.strictEqual(resHealth.status, 200);
    const dataHealth = await resHealth.json();
    assert.strictEqual(dataHealth.success, true);
    assert.strictEqual(dataHealth.data.status, 'ok');
    console.log('  ✓ System Health OK (Uptime:', dataHealth.data.uptime.toFixed(1), 's)');

    // 2. Database Health check
    console.log('\n--- Step 2: Database Health Check (GET /api/health/db) ---');
    const resDbHealth = await fetch(`${BASE_URL}/health/db`);
    assert.strictEqual(resDbHealth.status, 200);
    const dataDbHealth = await resDbHealth.json();
    assert.strictEqual(dataDbHealth.success, true);
    assert.strictEqual(dataDbHealth.data.status, 'connected');
    console.log('  ✓ Database Connected to:', dataDbHealth.data.database);

    // 3. Public Stats
    console.log('\n--- Step 3: Public Analytics (GET /api/public/stats) ---');
    const resStats = await fetch(`${BASE_URL}/public/stats`);
    assert.strictEqual(resStats.status, 200);
    const dataStats = await resStats.json();
    assert.strictEqual(dataStats.success, true);
    assert.ok(dataStats.data.totalComplaints >= 6, 'Must have at least seeded complaints');
    console.log('  ✓ Total Complaints in DB:', dataStats.data.totalComplaints);
    console.log('  ✓ Resolved Complaints:', dataStats.data.resolvedComplaints);
    console.log('  ✓ In Progress Complaints:', dataStats.data.inProgressComplaints);
    console.log('  ✓ Avg Resolution Time:', dataStats.data.avgResolutionTimeDays, 'days');
    console.log('  ✓ Departments Tracked:', dataStats.data.byDepartment.length);

    // 4. Public Recent Complaints
    console.log('\n--- Step 4: Public Recent Feed (GET /api/public/recent) ---');
    const resRecent = await fetch(`${BASE_URL}/public/recent?limit=5`);
    assert.strictEqual(resRecent.status, 200);
    const dataRecent = await resRecent.json();
    assert.strictEqual(dataRecent.success, true);
    assert.ok(Array.isArray(dataRecent.data));
    assert.ok(dataRecent.data.length > 0);
    console.log('  ✓ Retrieved', dataRecent.data.length, 'public complaints');
    console.log('  ✓ Sample recent title:', dataRecent.data[0].title);
    assert.strictEqual(dataRecent.data[0].citizenName, undefined, 'Privacy check: citizenName excluded');
    assert.strictEqual(dataRecent.data[0].citizenPhone, undefined, 'Privacy check: citizenPhone excluded');

    // 5. Complaint Tracking (Seeded Complaint)
    console.log('\n--- Step 5: Complaint Tracking (GET /api/complaints/track/CL-2025-9481) ---');
    const resTrack = await fetch(`${BASE_URL}/complaints/track/CL-2025-9481`);
    assert.strictEqual(resTrack.status, 200);
    const dataTrack = await resTrack.json();
    assert.strictEqual(dataTrack.success, true);
    assert.strictEqual(dataTrack.data.complaintCode, 'CL-2025-9481');
    assert.ok(dataTrack.data.timeline.length >= 2, 'Must have status history entries');
    console.log('  ✓ Found Complaint:', dataTrack.data.title);
    console.log('  ✓ Status:', dataTrack.data.status, '| Severity:', dataTrack.data.severity);
    console.log('  ✓ Audit History steps:', dataTrack.data.timeline.length);

    // 6. Admin Authentication Login
    console.log('\n--- Step 6: Admin Authentication (POST /api/admin/auth/login) ---');
    const resLogin = await fetch(`${BASE_URL}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@civiclens.gov',
        password: 'AdminSecureCivic2025!'
      })
    });
    assert.strictEqual(resLogin.status, 200);
    const dataLogin = await resLogin.json();
    assert.strictEqual(dataLogin.success, true);
    assert.ok(dataLogin.data.token, 'Must return JWT token');
    adminToken = dataLogin.data.token;
    console.log('  ✓ Admin Logged In as:', dataLogin.data.admin.fullName, `(${dataLogin.data.admin.email})`);
    console.log('  ✓ JWT Generated:', adminToken.substring(0, 25) + '...');

    // 7. Protected Admin Complaint Listing
    console.log('\n--- Step 7: Protected Admin Dashboard (GET /api/admin/complaints) ---');
    const resAdminComplaints = await fetch(`${BASE_URL}/admin/complaints?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resAdminComplaints.status, 200);
    const dataAdminComplaints = await resAdminComplaints.json();
    assert.strictEqual(dataAdminComplaints.success, true);
    assert.ok(dataAdminComplaints.data.complaints.length > 0);
    console.log('  ✓ Admin retrieved', dataAdminComplaints.data.complaints.length, 'complaints (Total:', dataAdminComplaints.data.pagination.total, ')');

    // 8. Submit New Citizen Complaint with Live Gemini Triage
    console.log('\n--- Step 8: Citizen Report with Live Gemini AI (POST /api/complaints) ---');
    console.log('  Sending complaint: "Broken storm drain overflow on 100ft road Indiranagar"...');
    
    // We send multipart form data via FormData
    const formData = new FormData();
    formData.append('title', 'Broken storm drain flooding street');
    formData.append('description', 'Storm drain concrete cover broken with sewage and dirty water gushing across pedestrians path');
    formData.append('locality', 'Indiranagar 100ft Road');
    formData.append('landmark', 'Near Metro Pillar 42');
    formData.append('citizenName', 'Aarav Sharma');
    formData.append('citizenPhone', '+91 9876543210');
    formData.append('citizenEmail', 'aarav.sharma@example.com');

    const resSubmit = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      body: formData
    });

    assert.strictEqual(resSubmit.status, 201);
    const dataSubmit = await resSubmit.json();
    assert.strictEqual(dataSubmit.success, true);
    assert.ok(dataSubmit.data.complaintCode.startsWith('CL-'));
    newComplaintCode = dataSubmit.data.complaintCode;
    newComplaintId = dataSubmit.data.id;

    console.log('  ✓ Complaint Successfully Registered in Aiven MySQL!');
    console.log('  ✓ Tracking Code Generated:', newComplaintCode, `(ID: ${newComplaintId})`);
    console.log('  ✓ Live AI Assessment:');
    console.log('    - Category:', dataSubmit.data.aiAssessment.issueType);
    console.log('    - Severity:', dataSubmit.data.aiAssessment.severity);
    console.log('    - Department:', dataSubmit.data.aiAssessment.department);
    console.log('    - Confidence:', dataSubmit.data.aiAssessment.confidence);
    console.log('    - AI Summary:', dataSubmit.data.aiAssessment.summary);
    console.log('    - Recommended Action:', dataSubmit.data.aiAssessment.recommendedAction);

    // 9. Citizen Tracking of Newly Created Complaint
    console.log(`\n--- Step 9: Citizen Track Newly Created Complaint (${newComplaintCode}) ---`);
    const resTrackNew = await fetch(`${BASE_URL}/complaints/track/${newComplaintCode}`);
    assert.strictEqual(resTrackNew.status, 200);
    const dataTrackNew = await resTrackNew.json();
    assert.strictEqual(dataTrackNew.success, true);
    assert.strictEqual(dataTrackNew.data.complaintCode, newComplaintCode);
    assert.strictEqual(dataTrackNew.data.status, 'SUBMITTED');
    console.log('  ✓ Citizen immediately verified complaint status in MySQL!');

    // 10. Admin locates complaint and updates status
    console.log(`\n--- Step 10: Admin Locates Complaint & Updates Status ---`);
    const resFindNew = await fetch(`${BASE_URL}/admin/complaints?search=${newComplaintCode}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resFindNew.status, 200);
    const dataFindNew = await resFindNew.json();
    assert.strictEqual(dataFindNew.data.complaints.length, 1);
    newComplaintId = dataFindNew.data.complaints[0].id;
    console.log(`  ✓ Admin located new complaint in admin dashboard (ID: ${newComplaintId})`);

    const resStatusUpdate = await fetch(`${BASE_URL}/admin/complaints/${newComplaintId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'IN_REVIEW',
        adminNotes: 'Field inspection officer dispatched to inspect the broken drain cover.',
        reason: 'Immediate safety review'
      })
    });

    assert.strictEqual(resStatusUpdate.status, 200);
    const dataStatusUpdate = await resStatusUpdate.json();
    assert.strictEqual(dataStatusUpdate.success, true);
    assert.strictEqual(dataStatusUpdate.data.status, 'IN_REVIEW');
    console.log('  ✓ Admin updated complaint status to:', dataStatusUpdate.data.status);

    // 11. Re-verify Timeline
    const resTrackFinal = await fetch(`${BASE_URL}/complaints/track/${newComplaintCode}`);
    const dataTrackFinal = await resTrackFinal.json();
    assert.strictEqual(dataTrackFinal.data.timeline.length, 2);
    console.log('  ✓ Audit Timeline now has', dataTrackFinal.data.timeline.length, 'verified milestones:');
    for (const item of dataTrackFinal.data.timeline) {
      console.log(`    [${item.status}] by ${item.changedBy} - Reason: ${item.changeReason || 'Initial filing'}`);
    }

    console.log('\n================================================================');
    console.log('🎉 ALL 11 LIVE END-TO-END VERIFICATION STEPS PASSED PERFECTLY!');
    console.log('================================================================');
  } finally {
    await stopServer();
    if (pool && typeof pool.end === 'function') {
      await pool.end();
    }
  }
}

run().catch((err) => {
  console.error('\n❌ E2E LIVE TEST FAILED:', err);
  process.exit(1);
});
