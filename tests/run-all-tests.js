import { spawn } from 'node:child_process';
import path from 'node:path';

const SUITES = [
  { name: 'Database Unit & Repository Layer', file: 'tests/db-unit.test.js', description: 'MySQL config, migrations, seed data, domain models' },
  { name: 'AI & Media Processing Service', file: 'tests/ai-media.test.js', description: 'Gemini AI classification, heuristic fallbacks, Cloudinary & local storage' },
  { name: 'API Contract & Route Conformance', file: 'tests/api-contract.test.js', description: 'Controller contracts, status codes, route tables, error structures' },
  { name: 'Frontend Build & Client Routing', file: 'tests/frontend-build.test.js', description: 'Vite build artifacts, React Router 5 routes, API client methods' },
  { name: 'Security & Vulnerability Defense', file: 'tests/security.test.js', description: 'JWT auth, bcrypt hashing, SQL injection, rate limits, Zod, Helmet' }
];

console.log('================================================================');
console.log('           CIVICLENS MASTER INTEGRATION TEST RUNNER             ');
console.log('================================================================');
console.log(`Executing ${SUITES.length} automated test suites sequentially...\n`);

const results = [];
const startTime = Date.now();

async function runSuite(suite) {
  const suiteStartTime = Date.now();
  console.log(`>>> Starting: ${suite.name} (${suite.file})`);

  const nodePath = path.resolve('backend/node_modules');
  const env = {
    ...process.env,
    NODE_PATH: nodePath
  };

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [suite.file], {
      env,
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      const duration = Date.now() - suiteStartTime;
      const passed = code === 0;
      results.push({
        ...suite,
        passed,
        exitCode: code,
        duration
      });

      if (passed) {
        console.log(`>>> Completed: ${suite.name} (PASSED in ${duration}ms)\n`);
      } else {
        console.error(`>>> FAILED: ${suite.name} (Exited with code ${code} in ${duration}ms)\n`);
      }
      resolve();
    });

    child.on('error', (err) => {
      const duration = Date.now() - suiteStartTime;
      results.push({
        ...suite,
        passed: false,
        exitCode: -1,
        duration,
        error: err.message
      });
      console.error(`>>> ERROR in ${suite.name}: ${err.message}\n`);
      resolve();
    });
  });
}

for (const suite of SUITES) {
  await runSuite(suite);
}

const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
const allPassed = results.every(r => r.passed);

console.log('================================================================');
console.log('                   FINAL VERIFICATION MATRIX                    ');
console.log('================================================================');
console.log(
  '| Suite Name                                | Result | Duration | Target File              |'
);
console.log(
  '|-------------------------------------------|--------|----------|--------------------------|'
);

for (const r of results) {
  const paddedName = r.name.padEnd(41, ' ');
  const statusStr = r.passed ? ' PASS ' : ' FAIL ';
  const durationStr = `${r.duration}ms`.padStart(8, ' ');
  const fileStr = r.file.padEnd(24, ' ');
  console.log(`| ${paddedName} | ${statusStr} | ${durationStr} | ${fileStr} |`);
}

console.log('================================================================');
if (allPassed) {
  console.log(`\n🎉 ALL ${SUITES.length} TEST SUITES PASSED CLEANLY (Total Time: ${totalDuration}s)`);
  console.log('CivicLens integration verification certified for deployment.');
  process.exit(0);
} else {
  const failedSuites = results.filter(r => !r.passed).map(r => r.name);
  console.error(`\n❌ VERIFICATION FAILED: ${failedSuites.length} test suite(s) had errors.`);
  console.error(`Failed suites: ${failedSuites.join(', ')}`);
  process.exit(1);
}
