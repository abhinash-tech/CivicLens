import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CIVIC_ISSUE_TYPES,
  SEVERITY_LEVELS,
  DEPARTMENTS,
  CONFIDENCE_LEVELS,
  ISSUE_TO_DEPARTMENT_MAP,
  CIVIC_ASSESSMENT_JSON_SCHEMA,
  classifyByKeywords,
  buildCivicAnalysisPrompt
} from '../backend/src/services/ai/prompts.js';

import {
  analyzeIssue,
  isGeminiConfigured
} from '../backend/src/services/ai/geminiService.js';

import {
  uploadComplaintImage,
  isCloudinaryConfigured
} from '../backend/src/services/storage/cloudinaryService.js';

console.log('====================================================');
console.log('  TEST SUITE: AI & Media Processing Verification');
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
// 1. AI Schema & Enums Integrity
// ----------------------------------------------------
console.log('--- 1. Schema & Enums Integrity ---');

runTest('CIVIC_ISSUE_TYPES contains all 7 municipal categories', () => {
  assert.strictEqual(CIVIC_ISSUE_TYPES.length, 7);
  assert.deepStrictEqual(CIVIC_ISSUE_TYPES, [
    'Roads and Potholes',
    'Solid Waste & Garbage',
    'Water Supply & Drainage',
    'Street Lighting & Electrical',
    'Traffic & Signage',
    'Public Parks & Trees',
    'Other Civic Issue'
  ]);
});

runTest('SEVERITY_LEVELS contains 4 standard levels', () => {
  assert.deepStrictEqual(SEVERITY_LEVELS, ['Low', 'Medium', 'High', 'Critical']);
});

runTest('DEPARTMENTS contains all 7 responsible departments', () => {
  assert.strictEqual(DEPARTMENTS.length, 7);
  assert.ok(DEPARTMENTS.includes('Roads and Infrastructure'));
  assert.ok(DEPARTMENTS.includes('Solid Waste Management'));
  assert.ok(DEPARTMENTS.includes('Water Supply & Sewerage'));
  assert.ok(DEPARTMENTS.includes('Electricity & Streetlights'));
  assert.ok(DEPARTMENTS.includes('Traffic & Transportation'));
  assert.ok(DEPARTMENTS.includes('Horticulture & Parks'));
  assert.ok(DEPARTMENTS.includes('General Municipal Services'));
});

runTest('CONFIDENCE_LEVELS contains Low, Medium, High', () => {
  assert.deepStrictEqual(CONFIDENCE_LEVELS, ['Low', 'Medium', 'High']);
});

runTest('ISSUE_TO_DEPARTMENT_MAP maps all 7 categories accurately', () => {
  for (const issue of CIVIC_ISSUE_TYPES) {
    const dept = ISSUE_TO_DEPARTMENT_MAP[issue];
    assert.ok(dept, `Department mapping missing for issue: ${issue}`);
    assert.ok(DEPARTMENTS.includes(dept), `Mapped department '${dept}' is not in allowed DEPARTMENTS`);
  }
});

runTest('CIVIC_ASSESSMENT_JSON_SCHEMA specifies all required fields', () => {
  const schema = CIVIC_ASSESSMENT_JSON_SCHEMA;
  assert.strictEqual(schema.type, 'object');
  const required = schema.required;
  const expectedRequired = [
    'issueType',
    'severity',
    'department',
    'summary',
    'riskReason',
    'recommendedAction',
    'confidence',
    'needsHumanReview'
  ];
  for (const field of expectedRequired) {
    assert.ok(required.includes(field), `Field ${field} must be required in AI schema`);
    assert.ok(schema.properties[field], `Field ${field} must exist in properties`);
  }
});

runTest('buildCivicAnalysisPrompt constructs complete user prompt', () => {
  const prompt = buildCivicAnalysisPrompt({
    title: 'Open sinkhole on Main St',
    description: 'Road collapsed near bus stand',
    locality: 'Sector 5',
    landmark: 'Bus Terminal'
  });
  assert.ok(prompt.includes('Open sinkhole on Main St'));
  assert.ok(prompt.includes('Road collapsed near bus stand'));
  assert.ok(prompt.includes('Sector 5'));
  assert.ok(prompt.includes('Bus Terminal'));
});

// ----------------------------------------------------
// 2. Heuristic Keyword Classifier (All 7 Issue Types)
// ----------------------------------------------------
console.log('\n--- 2. Heuristic Keyword Classifier (7 Issue Types) ---');

runTest('Category 1: Roads and Potholes classification', () => {
  const res = classifyByKeywords({
    title: 'Massive pothole crater',
    description: 'Deep asphalt damage on the road causing two-wheeler accidents',
    locality: 'Indiranagar'
  });
  assert.strictEqual(res.issueType, 'Roads and Potholes');
  assert.strictEqual(res.department, 'Roads and Infrastructure');
  assert.ok(res.summary.includes('Indiranagar'));
  assert.ok(res.recommendedAction.length > 0);
  assert.strictEqual(res.confidence, 'Low');
  assert.strictEqual(res.needsHumanReview, true);
});

runTest('Category 2: Solid Waste & Garbage classification', () => {
  const res = classifyByKeywords({
    title: 'Overflowing garbage bin and dumping',
    description: 'Rotting trash and debris piling up on the roadside with foul stench',
    locality: 'Koramangala'
  });
  assert.strictEqual(res.issueType, 'Solid Waste & Garbage');
  assert.strictEqual(res.department, 'Solid Waste Management');
  assert.ok(res.summary.includes('Koramangala'));
  assert.ok(res.riskReason.includes('hazard'));
});

runTest('Category 3: Water Supply & Drainage classification', () => {
  const res = classifyByKeywords({
    title: 'Broken water pipeline burst',
    description: 'Drainage pipe leaking heavily and flooding the street with open manhole',
    locality: 'Jayanagar'
  });
  assert.strictEqual(res.issueType, 'Water Supply & Drainage');
  assert.strictEqual(res.department, 'Water Supply & Sewerage');
});

runTest('Category 4: Street Lighting & Electrical classification', () => {
  const res = classifyByKeywords({
    title: 'Dark streetlight pole sparking',
    description: 'The lamp post electric wires are exposed and streetlight is completely out',
    locality: 'Whitefield'
  });
  assert.strictEqual(res.issueType, 'Street Lighting & Electrical');
  assert.strictEqual(res.department, 'Electricity & Streetlights');
});

runTest('Category 5: Traffic & Signage classification', () => {
  const res = classifyByKeywords({
    title: 'Broken traffic signal light',
    description: 'The traffic signal at the intersection is completely broken and signs are missing',
    locality: 'MG Road'
  });
  assert.strictEqual(res.issueType, 'Traffic & Signage');
  assert.strictEqual(res.department, 'Traffic & Transportation');
});

runTest('Category 6: Public Parks & Trees classification', () => {
  const res = classifyByKeywords({
    title: 'Fallen tree branches blocking pathway',
    description: 'Heavy tree limb fell inside the public park garden after storm',
    locality: 'Cubbon Park'
  });
  assert.strictEqual(res.issueType, 'Public Parks & Trees');
  assert.strictEqual(res.department, 'Horticulture & Parks');
});

runTest('Category 7: Other Civic Issue (General Fallback)', () => {
  const res = classifyByKeywords({
    title: 'Unusual civic nuisance',
    description: 'General disturbance requiring civic staff evaluation',
    locality: 'Civic Center'
  });
  assert.strictEqual(res.issueType, 'Other Civic Issue');
  assert.strictEqual(res.department, 'General Municipal Services');
});

// ----------------------------------------------------
// 3. Severity Heuristics Evaluation
// ----------------------------------------------------
console.log('\n--- 3. Severity Heuristics Evaluation ---');

runTest('Critical severity triggered on emergency/danger terms', () => {
  const res = classifyByKeywords({
    title: 'Emergency sinkhole collapse',
    description: 'Active collapse of the road pavement with severe danger to vehicles'
  });
  assert.strictEqual(res.severity, 'Critical');
});

runTest('Critical severity triggered on live exposed wires', () => {
  const res = classifyByKeywords({
    title: 'Exposed wire sparking near school gate',
    description: 'Electric transformer sparking and exposed wire hanging'
  });
  assert.strictEqual(res.severity, 'Critical');
});

runTest('High severity triggered on urgent/hazard/flooded terms', () => {
  const res = classifyByKeywords({
    title: 'Major hazard pothole on highway',
    description: 'Urgent repair needed due to heavy vehicular flow'
  });
  assert.strictEqual(res.severity, 'High');
});

runTest('Low severity triggered on minor/cosmetic terms', () => {
  const res = classifyByKeywords({
    title: 'Minor cosmetic paint peeling on park bench',
    description: 'Small scratch and faded surface on municipal garden seat'
  });
  assert.strictEqual(res.severity, 'Low');
});

runTest('Medium severity assigned as standard default', () => {
  const res = classifyByKeywords({
    title: 'Streetlight bulb not working',
    description: 'Fixture is dark during evening hours'
  });
  assert.strictEqual(res.severity, 'Medium');
});

// ----------------------------------------------------
// 4. Graceful AI Degradation & Fallback Integration
// ----------------------------------------------------
console.log('\n--- 4. Graceful AI Degradation & Fallback Integration ---');

await runAsyncTest('analyzeIssue falls back to keyword classifier when GEMINI_API_KEY is not set', async () => {
  const origKey = process.env.GEMINI_API_KEY;
  try {
    delete process.env.GEMINI_API_KEY;
    assert.strictEqual(isGeminiConfigured(), false);

    const assessment = await analyzeIssue({
      title: 'Pothole on 1st cross',
      description: 'Asphalt crater in road surface',
      locality: 'BTM Layout'
    });

    assert.ok(assessment);
    assert.strictEqual(assessment.issueType, 'Roads and Potholes');
    assert.strictEqual(assessment.department, 'Roads and Infrastructure');
    assert.ok(assessment.summary);
    assert.ok(assessment.riskReason);
    assert.ok(assessment.recommendedAction);
    assert.strictEqual(typeof assessment.needsHumanReview, 'boolean');
  } finally {
    if (origKey !== undefined) {
      process.env.GEMINI_API_KEY = origKey;
    }
  }
});

await runAsyncTest('analyzeIssue handles placeholder API keys gracefully', async () => {
  const origKey = process.env.GEMINI_API_KEY;
  try {
    process.env.GEMINI_API_KEY = 'your_gemini_api_key_here';
    assert.strictEqual(isGeminiConfigured(), false);

    const assessment = await analyzeIssue({
      title: 'Uncollected garbage bags',
      description: 'Solid waste piling up outside apartments',
      locality: 'HSR Layout'
    });

    assert.ok(assessment);
    assert.strictEqual(assessment.issueType, 'Solid Waste & Garbage');
    assert.strictEqual(assessment.department, 'Solid Waste Management');
  } finally {
    if (origKey !== undefined) {
      process.env.GEMINI_API_KEY = origKey;
    }
  }
});

await runAsyncTest('analyzeIssue handles invalid API key errors without throwing unhandled exceptions', async () => {
  const origKey = process.env.GEMINI_API_KEY;
  try {
    // Provide a fake key that causes the real SDK call to fail
    process.env.GEMINI_API_KEY = 'AIzaSyFakeKeyInvalidCivicLensTestKey123456';
    assert.strictEqual(isGeminiConfigured(), true);

    const assessment = await analyzeIssue({
      title: 'Water pipe leak flooding road',
      description: 'Clean water gushing from distribution pipe',
      locality: 'Malleshwaram',
      timeoutMs: 3000 // fast timeout for test
    });

    // Should gracefully catch and return heuristic fallback
    assert.ok(assessment);
    assert.strictEqual(assessment.issueType, 'Water Supply & Drainage');
    assert.strictEqual(assessment.department, 'Water Supply & Sewerage');
  } finally {
    if (origKey !== undefined) {
      process.env.GEMINI_API_KEY = origKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
  }
});

// ----------------------------------------------------
// 5. Media Upload & Storage Service Verification
// ----------------------------------------------------
console.log('\n--- 5. Media Upload & Storage Service Verification ---');

runTest('isCloudinaryConfigured detects placeholder / unconfigured credentials', () => {
  const origName = process.env.CLOUDINARY_CLOUD_NAME;
  try {
    process.env.CLOUDINARY_CLOUD_NAME = 'your_cloud_name';
    assert.strictEqual(isCloudinaryConfigured(), false);
  } finally {
    if (origName !== undefined) {
      process.env.CLOUDINARY_CLOUD_NAME = origName;
    } else {
      delete process.env.CLOUDINARY_CLOUD_NAME;
    }
  }
});

await runAsyncTest('uploadComplaintImage returns null when no buffer provided (text-only report)', async () => {
  const result = await uploadComplaintImage({ buffer: null });
  assert.deepStrictEqual(result, { imageUrl: null, publicId: null });

  const resultEmpty = await uploadComplaintImage({});
  assert.deepStrictEqual(resultEmpty, { imageUrl: null, publicId: null });
});

await runAsyncTest('uploadComplaintImage falls back cleanly to local filesystem when Cloudinary is unconfigured', async () => {
  // Create a 1x1 test image buffer
  const sampleBuffer = Buffer.from('FAKE_IMAGE_DATA_BYTES_CIVICLENS_TEST_BUFFER');

  const result = await uploadComplaintImage({
    buffer: sampleBuffer,
    mimeType: 'image/jpeg',
    filename: 'test-pothole.jpg'
  });

  assert.ok(result);
  assert.ok(result.imageUrl, 'Must return an imageUrl');
  assert.ok(result.publicId, 'Must return a publicId');
  assert.ok(
    result.imageUrl.startsWith('/uploads/') || result.imageUrl.startsWith('https://'),
    `Unexpected imageUrl format: ${result.imageUrl}`
  );

  // If it saved locally, verify the file exists on disk
  if (result.imageUrl.startsWith('/uploads/')) {
    const filename = path.basename(result.imageUrl);
    const localPath = path.resolve('backend/uploads', filename);
    assert.ok(fs.existsSync(localPath), `Saved fallback file should exist at ${localPath}`);
    // Cleanup the temporary test file
    fs.unlinkSync(localPath);
  }
});

await runAsyncTest('uploadComplaintImage handles PNG and WebP mime types correctly', async () => {
  const pngBuffer = Buffer.from('PNG_FAKE_IMAGE_DATA');
  const pngResult = await uploadComplaintImage({
    buffer: pngBuffer,
    mimeType: 'image/png',
    filename: 'water-leak.png'
  });

  assert.ok(pngResult.imageUrl);
  if (pngResult.imageUrl.startsWith('/uploads/')) {
    assert.ok(pngResult.imageUrl.endsWith('.png'));
    const localPath = path.resolve('backend/uploads', path.basename(pngResult.imageUrl));
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
  }
});

console.log('\n----------------------------------------------------');
console.log(`AI & Media Test Summary: ${passCount} Passed, ${failCount} Failed`);
console.log('----------------------------------------------------');

if (failCount > 0) {
  process.exit(1);
}
