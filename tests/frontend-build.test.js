import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('====================================================');
console.log('  TEST SUITE: Frontend Build & Client Architecture');
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

// ----------------------------------------------------
// 1. Production Build Artifacts (frontend/dist/)
// ----------------------------------------------------
console.log('--- 1. Production Build Artifacts Verification ---');

const distDir = path.resolve('frontend/dist');
const assetsDir = path.resolve('frontend/dist/assets');
const distHtmlFile = path.resolve('frontend/dist/index.html');
const vercelConfigFile = path.resolve('frontend/vercel.json');

runTest('frontend/dist directory exists and contains index.html', () => {
  assert.ok(fs.existsSync(distDir), 'frontend/dist directory must exist');
  assert.ok(fs.existsSync(distHtmlFile), 'frontend/dist/index.html must exist');

  const htmlContent = fs.readFileSync(distHtmlFile, 'utf8');
  assert.ok(htmlContent.includes('id="root"'), 'dist/index.html must contain root mount point');
  assert.ok(htmlContent.includes('CivicLens'), 'dist/index.html must contain CivicLens branding');
  assert.ok(htmlContent.includes('<script type="module"'), 'dist/index.html must contain module script tag');
});

runTest('frontend/dist/assets contains compiled JS and CSS bundles with production sizes', () => {
  assert.ok(fs.existsSync(assetsDir), 'frontend/dist/assets directory must exist');
  const assetFiles = fs.readdirSync(assetsDir);

  const jsFiles = assetFiles.filter(f => f.endsWith('.js'));
  const cssFiles = assetFiles.filter(f => f.endsWith('.css'));

  assert.ok(jsFiles.length > 0, 'Must have at least one compiled JS bundle');
  assert.ok(cssFiles.length > 0, 'Must have at least one compiled CSS bundle');

  // Verify JS bundle size is substantial (full React + Lucide + UI app)
  const jsStats = fs.statSync(path.join(assetsDir, jsFiles[0]));
  assert.ok(jsStats.size > 50000, `JS bundle size ${jsStats.size} bytes should exceed 50KB`);

  // Verify CSS bundle size is substantial (full Tailwind compiled styles)
  const cssStats = fs.statSync(path.join(assetsDir, cssFiles[0]));
  assert.ok(cssStats.size > 5000, `CSS bundle size ${cssStats.size} bytes should exceed 5KB`);
});

runTest('frontend/vercel.json provides SPA client routing fallback configuration', () => {
  assert.ok(fs.existsSync(vercelConfigFile), 'frontend/vercel.json must exist');
  const vercelJson = JSON.parse(fs.readFileSync(vercelConfigFile, 'utf8'));

  assert.ok(Array.isArray(vercelJson.rewrites), 'vercel.json must have rewrites array');
  const catchAll = vercelJson.rewrites.find(r => r.source === '/(.*)' && r.destination === '/index.html');
  assert.ok(catchAll, 'vercel.json must have SPA rewrite from /(.*) to /index.html');
});

// ----------------------------------------------------
// 2. React Router Route Registrations (frontend/src/App.jsx)
// ----------------------------------------------------
console.log('\n--- 2. Route Registration Audit (App.jsx) ---');

const appJsxPath = path.resolve('frontend/src/App.jsx');

runTest('App.jsx exists and imports all required page components', () => {
  assert.ok(fs.existsSync(appJsxPath), 'frontend/src/App.jsx must exist');
  const appContent = fs.readFileSync(appJsxPath, 'utf8');

  assert.ok(appContent.includes("import HomePage from './pages/HomePage'"), 'Imports HomePage');
  assert.ok(appContent.includes("import ReportPage from './pages/ReportPage'"), 'Imports ReportPage');
  assert.ok(appContent.includes("import TrackPage from './pages/TrackPage'"), 'Imports TrackPage');
  assert.ok(appContent.includes("import TransparencyPage from './pages/TransparencyPage'"), 'Imports TransparencyPage');
  assert.ok(appContent.includes("import AdminLoginPage from './pages/AdminLoginPage'"), 'Imports AdminLoginPage');
  assert.ok(appContent.includes("import AdminDashboardPage from './pages/AdminDashboardPage'"), 'Imports AdminDashboardPage');
});

runTest('App.jsx registers all 5 required municipal and citizen routes + 404 fallback', () => {
  const appContent = fs.readFileSync(appJsxPath, 'utf8');

  // 1. Citizen Home
  assert.ok(appContent.includes('path="/"') && appContent.includes('<HomePage'), 'Registers / -> HomePage');

  // 2. Complaint Filing Portal
  assert.ok(appContent.includes('path="/report"') && appContent.includes('<ReportPage'), 'Registers /report -> ReportPage');

  // 3. Citizen Tracking Portal
  assert.ok(appContent.includes('path="/track"') && appContent.includes('<TrackPage'), 'Registers /track -> TrackPage');
  assert.ok(appContent.includes('path="/track/:code"'), 'Registers /track/:code param route');

  // 4. Public Transparency Dashboard
  assert.ok(appContent.includes('path="/transparency"') && appContent.includes('<TransparencyPage'), 'Registers /transparency -> TransparencyPage');

  // 5. Admin Login & Dashboard
  assert.ok(appContent.includes('path="/admin/login"') && appContent.includes('<AdminLoginPage'), 'Registers /admin/login -> AdminLoginPage');
  assert.ok(appContent.includes('path="/admin"') && appContent.includes('<AdminDashboardPage'), 'Registers /admin -> AdminDashboardPage');

  // 6. Catch-all NotFoundPage
  assert.ok(appContent.includes('path="*"') && appContent.includes('NotFoundPage'), 'Registers path="*" 404 handler');
});

runTest('App.jsx incorporates global Navbar, Footer, and ScrollToTop components', () => {
  const appContent = fs.readFileSync(appJsxPath, 'utf8');

  assert.ok(appContent.includes('<Navbar'), 'Mounts global Navbar');
  assert.ok(appContent.includes('<Footer'), 'Mounts global Footer');
  assert.ok(appContent.includes('<ScrollToTop'), 'Mounts ScrollToTop navigation helper');
});

// ----------------------------------------------------
// 3. API Client Integration (frontend/src/services/api.js)
// ----------------------------------------------------
console.log('\n--- 3. API Client Integration Audit (api.js) ---');

const apiJsPath = path.resolve('frontend/src/services/api.js');

runTest('api.js exists and configures base URL with /api fallback', () => {
  assert.ok(fs.existsSync(apiJsPath), 'frontend/src/services/api.js must exist');
  const apiContent = fs.readFileSync(apiJsPath, 'utf8');

  assert.ok(apiContent.includes('import.meta.env.VITE_API_BASE_URL'), 'Reads VITE_API_BASE_URL');
  assert.ok(apiContent.includes("'/api'"), 'Has /api default fallback');
});

runTest('api.js request helper manages Authorization header and 401 token cleanup', () => {
  const apiContent = fs.readFileSync(apiJsPath, 'utf8');

  assert.ok(apiContent.includes("localStorage.getItem('civiclens_token')"), 'Reads JWT token from localStorage');
  assert.ok(apiContent.includes("`Bearer ${token}`"), 'Sets Bearer token Authorization header');
  assert.ok(apiContent.includes("response.status === 401"), 'Detects HTTP 401 Unauthorized status');
  assert.ok(apiContent.includes("localStorage.removeItem('civiclens_token')"), 'Purges token on 401 session expiry');
});

runTest('api.js implements all required contract methods matching docs/api-contract.md', () => {
  const apiContent = fs.readFileSync(apiJsPath, 'utf8');

  // System Health
  assert.ok(apiContent.includes('getHealth:'), 'api.getHealth method defined');
  assert.ok(apiContent.includes('getDbHealth:'), 'api.getDbHealth method defined');

  // Citizen Complaint
  assert.ok(apiContent.includes('submitComplaint:'), 'api.submitComplaint method defined');
  assert.ok(apiContent.includes('trackComplaint:'), 'api.trackComplaint method defined');

  // Public Transparency
  assert.ok(apiContent.includes('getPublicStats:'), 'api.getPublicStats method defined');
  assert.ok(apiContent.includes('getPublicRecent:'), 'api.getPublicRecent method defined');

  // Admin Portal
  assert.ok(apiContent.includes('adminLogin:'), 'api.adminLogin method defined');
  assert.ok(apiContent.includes('getAdminComplaints:'), 'api.getAdminComplaints method defined');
  assert.ok(apiContent.includes('getAdminComplaintDetail:'), 'api.getAdminComplaintDetail method defined');
  assert.ok(apiContent.includes('updateComplaintStatus:'), 'api.updateComplaintStatus method defined');
});

// ----------------------------------------------------
// 4. UI Components & Pages Verification
// ----------------------------------------------------
console.log('\n--- 4. UI Components & Pages Verification ---');

const expectedPages = [
  'HomePage.jsx',
  'ReportPage.jsx',
  'TrackPage.jsx',
  'TransparencyPage.jsx',
  'AdminLoginPage.jsx',
  'AdminDashboardPage.jsx'
];

for (const page of expectedPages) {
  runTest(`Page frontend/src/pages/${page} exists and is non-empty`, () => {
    const pagePath = path.resolve(`frontend/src/pages/${page}`);
    assert.ok(fs.existsSync(pagePath), `${page} must exist`);
    const content = fs.readFileSync(pagePath, 'utf8');
    assert.ok(content.length > 500, `${page} must contain full implementation`);
  });
}

const expectedComponents = [
  'AIAssessmentCard.jsx',
  'SeverityBadge.jsx',
  'StatusBadge.jsx',
  'Navbar.jsx',
  'Footer.jsx',
  'Modal.jsx'
];

for (const comp of expectedComponents) {
  runTest(`Component frontend/src/components/${comp} exists and is non-empty`, () => {
    const compPath = path.resolve(`frontend/src/components/${comp}`);
    assert.ok(fs.existsSync(compPath), `${comp} must exist`);
    const content = fs.readFileSync(compPath, 'utf8');
    assert.ok(content.length > 200, `${comp} must contain valid implementation`);
  });
}

console.log('\n----------------------------------------------------');
console.log(`Frontend Build Test Summary: ${passCount} Passed, ${failCount} Failed`);
console.log('----------------------------------------------------');

if (failCount > 0) {
  process.exit(1);
}
