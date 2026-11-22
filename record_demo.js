import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function recordLiveDemo() {
  const videoDir = path.resolve('./videos');
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  const imagePath = path.resolve('test-pothole.jpg');
  console.log(`[Demo] Video output directory: ${videoDir}`);
  console.log(`[Demo] Image evidence path: ${imagePath}`);

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true, // running headless with video recording
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const BASE_URL = 'https://civic-lens-teal.vercel.app';

  console.log('\n=============================================');
  console.log('  STARTING CIVICLENS LIVE PRODUCT DEMO');
  console.log('=============================================\n');

  // STEP 1: Citizen Homepage Tour
  console.log('[Step 1] Visiting Citizen Homepage...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await sleep(2000);

  // Smooth scroll down to showcase the modern UI
  console.log('[Step 1] Showcasing Hero, Metrics & How It Works...');
  await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'smooth' }));
  await sleep(1500);

  await page.evaluate(() => window.scrollBy({ top: 600, behavior: 'smooth' }));
  await sleep(1500);

  await page.evaluate(() => window.scrollBy({ top: 600, behavior: 'smooth' }));
  await sleep(1500);

  // Scroll back to top
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(1200);

  // STEP 2: Navigate to Report Page
  console.log('\n[Step 2] Navigating to "Report an Issue" form...');
  const reportBtn = page.locator('text=Report an Issue').first();
  await reportBtn.click();
  await page.waitForURL('**/report');
  await sleep(1500);

  // Upload image
  console.log('[Step 2] Attaching site evidence photo (Pothole)...');
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator('text=Browse Files').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(imagePath);
  await sleep(2000); // Allow image preview to render

  // Fill in incident details
  console.log('[Step 2] Filling incident title, locality, landmark & description...');
  await page.fill('input#title', 'Multiple Potholes and Severe Road Damage');
  await sleep(400);

  await page.fill('input#locality', 'Road 3, Vivekananda Nagar, Hyderabad, Telangana.');
  await sleep(400);

  await page.fill('input#landmark', 'Near Metro Pillar 42, Opposite Shopping Complex');
  await sleep(400);

  await page.fill(
    'textarea#description',
    'Multiple potholes are visible across the road surface, with several containing stagnant muddy water. The asphalt is severely damaged, with loose gravel and uneven road patches. These potholes may cause accidents, vehicle damage and inconvenience to commuters, especially during nighttime and rainy conditions. Immediate inspection and road repair are recommended.'
  );
  await sleep(800);

  // Optional citizen info
  console.log('[Step 2] Providing citizen contact details...');
  await page.fill('input#citizenName', 'Abhinash');
  await sleep(300);
  await page.fill('input#citizenPhone', '+91 98765 43210');
  await sleep(300);
  await page.fill('input#citizenEmail', 'abhinash@civiclens.test');
  await sleep(800);

  // Scroll to submit button and click
  await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
  await sleep(600);

  console.log('[Step 2] Submitting complaint with Multimodal Gemini AI Triage...');
  const submitBtn = page.locator('button[type="submit"]');
  await submitBtn.click();

  // Wait for submission confirmation screen
  console.log('[Step 2] Awaiting AI analysis and registration response...');
  await page.waitForSelector('text=Complaint Registered Successfully!', { timeout: 45000 });
  await sleep(2500);

  // Extract generated complaint code
  const codeElem = page.locator('span.font-mono.font-bold').first();
  const generatedCode = await codeElem.innerText();
  console.log(`\n>>> Generated Tracking Code: ${generatedCode}`);

  // Showcase AI Assessment results
  console.log('[Step 2] Inspecting Gemini AI Triage Results card...');
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await sleep(3000);

  // STEP 3: Navigate to Tracking Page
  console.log('\n[Step 3] Clicking "Track Resolution Status"...');
  const trackBtn = page.locator('text=Track Resolution Status');
  await trackBtn.click();
  await page.waitForURL(`**/track/**`);
  await sleep(2000);

  // Showcase Milestone Progress Stepper and Action Log
  console.log('[Step 3] Showcasing Milestone Progression Timeline & Details...');
  await page.evaluate(() => window.scrollBy({ top: 450, behavior: 'smooth' }));
  await sleep(2500);

  await page.evaluate(() => window.scrollBy({ top: 450, behavior: 'smooth' }));
  await sleep(2500);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(1000);

  // STEP 4: Public Transparency Dashboard
  console.log('\n[Step 4] Visiting Public Transparency Portal...');
  await page.goto(`${BASE_URL}/transparency`, { waitUntil: 'networkidle' });
  await sleep(2000);

  console.log('[Step 4] Showcasing Municipal KPIs, Department & Severity Analytics...');
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await sleep(2000);

  console.log('[Step 4] Filtering Public Complaints Ledger for Critical Severity...');
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await sleep(1000);

  // Select Critical in severity dropdown
  const severitySelect = page.locator('select').first();
  await severitySelect.selectOption('Critical');
  await sleep(2000);

  // STEP 5: Administrator Command Portal
  console.log('\n[Step 5] Navigating to Municipal Administrator Portal...');
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
  await sleep(1500);

  console.log('[Step 5] Auto-filling official administrator credentials...');
  const autoFillBtn = page.locator('button:has-text("Auto-Fill")');
  if (await autoFillBtn.isVisible()) {
    await autoFillBtn.click();
    await sleep(800);
  } else {
    await page.fill('input[type="email"]', 'admin@civiclens.gov');
    await page.fill('input[type="password"]', 'AdminSecureCivic2025!');
  }

  console.log('[Step 5] Signing into Admin Command Dashboard...');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin');
  await sleep(2500);

  // Showcase admin overview metrics and table
  console.log('[Step 5] Showing Admin Complaint Oversight Table...');
  await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
  await sleep(2000);

  // Click Manage on the top complaint (our newly filed pothole complaint)
  console.log('[Step 5] Opening Complaint Inspection & Action Dialog...');
  const manageBtn = page.locator('button:has-text("Manage")').first();
  await manageBtn.click();
  await sleep(2000);

  // Modal inspection: scroll inside modal
  console.log('[Step 5] Inspecting site photo, AI breakdown, and updating status...');
  const modalBody = page.locator('[role="dialog"]');
  await modalBody.evaluate((el) => el.scrollBy({ top: 400, behavior: 'smooth' }));
  await sleep(2000);

  // Select new status: ACTION_SCHEDULED or IN_PROGRESS
  const statusSelect = page.locator('[role="dialog"] select').first();
  await statusSelect.selectOption('ACTION_SCHEDULED');
  await sleep(600);

  const reasonInput = page.locator('[role="dialog"] input[placeholder*="Dispatched"]');
  await reasonInput.fill('Remediation squad dispatched with asphalt patch equipment to Road 3');
  await sleep(600);

  const notesTextarea = page.locator('[role="dialog"] textarea');
  await notesTextarea.fill('Work Order #WL-HYD-8492. Field crew assigned. Expected patch completion within 24 hours.');
  await sleep(800);

  console.log('[Step 5] Saving status transition & logging municipal audit action...');
  const saveBtn = page.locator('[role="dialog"] button:has-text("Save Status Transition")');
  await saveBtn.click();
  await sleep(2500);

  // Close modal
  console.log('[Step 5] Closing action modal...');
  const closeBtn = page.locator('[role="dialog"] button[aria-label="Close dialog"]');
  await closeBtn.click();
  await sleep(1500);

  // STEP 6: Verify Updated Status on Citizen Tracking Page
  console.log(`\n[Step 6] Navigating back to Citizen Track Page for ${generatedCode}...`);
  await page.goto(`${BASE_URL}/track/${encodeURIComponent(generatedCode)}`, { waitUntil: 'networkidle' });
  await sleep(2500);

  console.log('[Step 6] Verifying updated "Action Scheduled" milestone and audit log!');
  await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
  await sleep(2500);

  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await sleep(3000);

  console.log('\n[Demo] Concluding live video demonstration...');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(1500);

  // Close page and context to flush video to disk
  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  if (video) {
    const rawPath = await video.path();
    const finalVideoPath = path.resolve(videoDir, 'civiclens-live-demo.webm');
    fs.copyFileSync(rawPath, finalVideoPath);
    const stats = fs.statSync(finalVideoPath);
    console.log('\n=============================================');
    console.log('  LIVE DEMO VIDEO RECORDED SUCCESSFULLY! 🎬');
    console.log(`  Path: ${finalVideoPath}`);
    console.log(`  Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log('=============================================\n');
    return { finalVideoPath, generatedCode };
  }
}

recordLiveDemo().catch((err) => {
  console.error('Fatal recording error:', err);
  process.exit(1);
});
