import bcryptjs from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, checkConnection } from '../src/config/database.js';
import { runMigrations } from './run-migrations.js';

const __filename = fileURLToPath(import.meta.url);

export const SAMPLE_COMPLAINTS = [
  {
    complaint_code: 'CL-2025-9481',
    title: 'Large hazardous pothole on 4th Main Road',
    description: 'Deep pothole spanning approximately 1.5 meters across the northbound lane right next to Metro pillar 42. Poses high risk to two-wheelers and night commuters.',
    locality: 'Indiranagar',
    landmark: 'Near Indiranagar Metro Pillar 42',
    citizen_name: 'Rahul Sharma',
    citizen_phone: '+91 98765 43210',
    citizen_email: 'rahul.sharma@example.com',
    image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    image_public_id: 'seed/pothole_indiranagar',
    issue_type: 'Roads and Potholes',
    severity: 'High',
    department: 'Roads and Infrastructure',
    ai_summary: 'Severe road cavity endangering vehicular traffic and two-wheelers.',
    ai_risk_reason: 'High vehicular accident risk, particularly under low light or wet conditions.',
    ai_recommended_action: 'Deploy emergency asphalt cold-mix crew for immediate patching and barrier placement.',
    ai_confidence: 'High',
    needs_human_review: false,
    status: 'IN_PROGRESS',
    admin_notes: 'Road maintenance crew #3 dispatched on morning schedule.',
    history: [
      { from_status: null, to_status: 'SUBMITTED', changed_by: 'Citizen', change_reason: 'Complaint lodged with photo evidence' },
      { from_status: 'SUBMITTED', to_status: 'IN_REVIEW', changed_by: 'Chief Administrator', change_reason: 'Verified by Municipal Traffic Safety cell' },
      { from_status: 'IN_REVIEW', to_status: 'IN_PROGRESS', changed_by: 'Chief Administrator', change_reason: 'Assigned to Ward 82 Road Works division' },
    ],
  },
  {
    complaint_code: 'CL-2025-8312',
    title: 'Overflowing commercial waste bin near market entrance',
    description: 'Commercial waste bin has not been cleared for three consecutive days. Stray animals are scattering plastic waste onto the main pedestrian sidewalk.',
    locality: 'Koramangala',
    landmark: 'Opposite Koramangala 5th Block BDA Complex',
    citizen_name: 'Priya Narayanan',
    citizen_phone: '+91 98450 11223',
    citizen_email: 'priya.n@example.com',
    image_url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    image_public_id: 'seed/garbage_koramangala',
    issue_type: 'Garbage & Waste Management',
    severity: 'Medium',
    department: 'Solid Waste Management',
    ai_summary: 'Unattended open municipal bin overflow spilling onto pedestrian thoroughfare.',
    ai_risk_reason: 'Sanitation concern, pest harborage, and obstruction to pedestrian walkway.',
    ai_recommended_action: 'Schedule compactor truck clearance and sanitize container surroundings.',
    ai_confidence: 'High',
    needs_human_review: false,
    status: 'RESOLVED',
    admin_notes: 'Waste collected by truck KA-01-EA-9912 and area disinfected.',
    history: [
      { from_status: null, to_status: 'SUBMITTED', changed_by: 'Citizen', change_reason: 'Complaint submitted with photo' },
      { from_status: 'SUBMITTED', to_status: 'IN_REVIEW', changed_by: 'Sanitation Supervisor', change_reason: 'Reviewed by ward sanitation officer' },
      { from_status: 'IN_REVIEW', to_status: 'ACTION_SCHEDULED', changed_by: 'Sanitation Supervisor', change_reason: 'Compactor route updated for morning shift' },
      { from_status: 'ACTION_SCHEDULED', to_status: 'RESOLVED', changed_by: 'Sanitation Supervisor', change_reason: 'Bin cleared and ground disinfected' },
    ],
  },
  {
    complaint_code: 'CL-2025-7190',
    title: 'Multiple malfunctioning streetlights along residential lane',
    description: 'A stretch of 4 streetlights on 7th Cross are completely dead, plunging the entire residential lane into darkness for over a week.',
    locality: 'Whitefield',
    landmark: 'Near Hope Farm Junction, 7th Cross',
    citizen_name: 'Amitabh Sengupta',
    citizen_phone: '+91 97412 88765',
    citizen_email: 'amitabh.s@example.com',
    image_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    image_public_id: 'seed/streetlight_whitefield',
    issue_type: 'Street Lighting & Electrical',
    severity: 'High',
    department: 'Electrical & Streetlights',
    ai_summary: 'Sequential streetlight failure creating dark corridor across residential area.',
    ai_risk_reason: 'Elevated safety and security hazard for nighttime pedestrians and commuters.',
    ai_recommended_action: 'Inspect circuit feeder pillar and replace damaged LED luminaire fixtures.',
    ai_confidence: 'High',
    needs_human_review: true,
    status: 'ACTION_SCHEDULED',
    admin_notes: 'Electrical contractor notified to replace LED fixtures.',
    history: [
      { from_status: null, to_status: 'SUBMITTED', changed_by: 'Citizen', change_reason: 'Initial complaint received' },
      { from_status: 'SUBMITTED', to_status: 'IN_REVIEW', changed_by: 'Ward Officer', change_reason: 'Transferred to electrical subdivision' },
      { from_status: 'IN_REVIEW', to_status: 'ACTION_SCHEDULED', changed_by: 'Ward Officer', change_reason: 'Replacement parts ordered, work scheduled' },
    ],
  },
  {
    complaint_code: 'CL-2025-6604',
    title: 'Fresh water main line leaking heavily on sidewalk',
    description: 'Clean drinking water is gushing out from an underground distribution pipe fracture, flooding the curb and wasting hundreds of liters per hour.',
    locality: 'Jayanagar',
    landmark: 'Opposite Jayanagar 4th Block Post Office',
    citizen_name: 'Sneha Deshmukh',
    citizen_phone: '+91 99001 54321',
    citizen_email: 'sneha.d@example.com',
    image_url: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80',
    image_public_id: 'seed/water_leak_jayanagar',
    issue_type: 'Water Supply & Leakage',
    severity: 'Critical',
    department: 'Water Supply & Drainage',
    ai_summary: 'Major pressurized potable water pipeline rupture causing localized street flooding.',
    ai_risk_reason: 'Severe loss of municipal drinking water and undermining of sub-surface road base.',
    ai_recommended_action: 'Isolate upstream sector valve immediately and initiate trench excavation repair.',
    ai_confidence: 'High',
    needs_human_review: false,
    status: 'IN_PROGRESS',
    admin_notes: 'Sector valve shut off; maintenance team excavating pipe joint.',
    history: [
      { from_status: null, to_status: 'SUBMITTED', changed_by: 'Citizen', change_reason: 'Citizen report received with emergency priority' },
      { from_status: 'SUBMITTED', to_status: 'IN_PROGRESS', changed_by: 'Chief Administrator', change_reason: 'Emergency water division dispatched immediately' },
    ],
  },
  {
    complaint_code: 'CL-2025-5120',
    title: 'Missing storm water manhole cover on walking path',
    description: 'Storm water drain cover is missing or broken right next to the bus stop. Extremely dangerous hazard for children and elderly commuters.',
    locality: 'Malleshwaram',
    landmark: '18th Cross Bus Stop',
    citizen_name: 'Kavitha R',
    citizen_phone: '+91 98860 33445',
    citizen_email: 'kavitha.r@example.com',
    image_url: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=800&q=80',
    image_public_id: 'seed/manhole_malleshwaram',
    issue_type: 'Drainage & Sewage',
    severity: 'Critical',
    department: 'Water Supply & Drainage',
    ai_summary: 'Uncovered storm drain cavity directly on pedestrian walkway adjacent to bus shelter.',
    ai_risk_reason: 'Critical fall and severe injury hazard for pedestrians, especially after dusk.',
    ai_recommended_action: 'Install heavy-duty ductile iron / RCC manhole cover immediately and place temporary cones.',
    ai_confidence: 'High',
    needs_human_review: false,
    status: 'SUBMITTED',
    admin_notes: null,
    history: [
      { from_status: null, to_status: 'SUBMITTED', changed_by: 'Citizen', change_reason: 'Complaint recorded with high severity alert' },
    ],
  },
  {
    complaint_code: 'CL-2025-4209',
    title: 'Large storm-felled bough obstructing lane',
    description: 'Heavy rains caused a thick tree limb to snap and fall across the 2nd stage service road, partially blocking traffic.',
    locality: 'BTM Layout',
    landmark: 'Near BTM Water Tank',
    citizen_name: 'Vikram Joshi',
    citizen_phone: '+91 94480 77665',
    citizen_email: 'vikram.j@example.com',
    image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    image_public_id: 'seed/tree_branch_btm',
    issue_type: 'Trees & Parks',
    severity: 'Low',
    department: 'Horticulture & Forestry',
    ai_summary: 'Snapped tree limb partially obstructing vehicular service lane.',
    ai_risk_reason: 'Mild traffic slowdown; no electrical wire entanglement observed.',
    ai_recommended_action: 'Chainsaw crew to cut and clear branch onto verge for wood disposal truck.',
    ai_confidence: 'High',
    needs_human_review: true,
    status: 'IN_REVIEW',
    admin_notes: 'Forestry department team assigned to afternoon clearing run.',
    history: [
      { from_status: null, to_status: 'SUBMITTED', changed_by: 'Citizen', change_reason: 'Complaint lodged' },
      { from_status: 'SUBMITTED', to_status: 'IN_REVIEW', changed_by: 'Ward Officer', change_reason: 'Assigned to horticulture subdivision' },
    ],
  },
];

/**
 * Seeds default administrator user if not already present.
 * @param {import('mysql2/promise').PoolConnection} connection
 */
export async function seedAdmin(connection) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@civiclens.gov';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecureCivic2025!';
  const adminFullName = process.env.ADMIN_FULL_NAME || 'Chief Municipal Administrator';

  const [existing] = await connection.query(
    'SELECT id, email FROM admins WHERE email = ? LIMIT 1',
    [adminEmail]
  );

  if (Array.isArray(existing) && existing.length > 0) {
    console.log(`[Seed] Admin user already exists: ${adminEmail}`);
    return existing[0];
  }

  const saltRounds = 10;
  const passwordHash = await bcryptjs.hash(adminPassword, saltRounds);

  const [result] = await connection.query(
    'INSERT INTO admins (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
    [adminEmail, passwordHash, adminFullName, 'admin']
  );

  console.log(`[Seed] Created default admin user: ${adminEmail} (id: ${result.insertId})`);
  return { id: result.insertId, email: adminEmail };
}

/**
 * Seeds realistic sample complaints and status histories if table is empty.
 * @param {import('mysql2/promise').PoolConnection} connection
 * @param {boolean} force
 */
export async function seedComplaints(connection, force = false) {
  const [countResult] = await connection.query('SELECT COUNT(*) as total FROM complaints');
  const count = countResult[0]?.total || 0;

  if (count > 0 && !force) {
    console.log(`[Seed] Complaints table already has ${count} records. Skipping sample complaint seed.`);
    return;
  }

  console.log(`[Seed] Seeding ${SAMPLE_COMPLAINTS.length} sample complaints...`);

  for (const c of SAMPLE_COMPLAINTS) {
    const [complaintResult] = await connection.query(
      `INSERT INTO complaints (
        complaint_code, title, description, locality, landmark,
        citizen_name, citizen_phone, citizen_email,
        image_url, image_public_id,
        issue_type, severity, department,
        ai_summary, ai_risk_reason, ai_recommended_action,
        ai_confidence, needs_human_review,
        status, admin_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.complaint_code,
        c.title,
        c.description,
        c.locality,
        c.landmark,
        c.citizen_name,
        c.citizen_phone,
        c.citizen_email,
        c.image_url,
        c.image_public_id,
        c.issue_type,
        c.severity,
        c.department,
        c.ai_summary,
        c.ai_risk_reason,
        c.ai_recommended_action,
        c.ai_confidence,
        c.needs_human_review,
        c.status,
        c.admin_notes,
      ]
    );

    const complaintId = complaintResult.insertId;

    if (c.history && c.history.length > 0) {
      for (const h of c.history) {
        await connection.query(
          `INSERT INTO complaint_status_history (
            complaint_id, from_status, to_status, changed_by, change_reason
          ) VALUES (?, ?, ?, ?, ?)`,
          [complaintId, h.from_status, h.to_status, h.changed_by, h.change_reason]
        );
      }
    }

    console.log(`[Seed] Inserted complaint ${c.complaint_code} (ID: ${complaintId}) with ${c.history?.length || 0} history records.`);
  }

  console.log('[Seed] Sample complaints seed completed.');
}

/**
 * Main seed function.
 * @param {{ forceComplaints?: boolean }} options
 */
export async function seed(options = {}) {
  console.log('[Seed] Starting CivicLens database seed process...');

  const health = await checkConnection();
  if (!health.connected) {
    console.error(`[Seed] Database connection failed: ${health.error}`);
    throw new Error(`Database connection failed: ${health.error}`);
  }

  // Ensure migrations are executed
  await runMigrations();

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await seedAdmin(connection);
    await seedComplaints(connection, options.forceComplaints);

    await connection.commit();
    console.log('[Seed] Database seed completed successfully!');
    return true;
  } catch (err) {
    await connection.rollback();
    console.error(`[Seed Error] Transaction rolled back due to error: ${err.message}`);
    throw err;
  } finally {
    connection.release();
  }
}

// Check if script is run directly
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectRun) {
  seed()
    .then(() => {
      console.log('[Seed] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Seed script failed:', err.message);
      process.exit(1);
    })
    .finally(async () => {
      try {
        await pool.end();
      } catch {
        // ignore
      }
    });
}
