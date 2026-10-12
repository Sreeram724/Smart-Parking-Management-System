const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ASSETS_DIR = path.resolve(__dirname);
const delay = ms => new Promise(r => setTimeout(r, ms));

async function capture() {
  console.log('[*] Launching Edge via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 1.5 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Homepage & Grid Layout
  console.log('[1/8] Capturing Homepage & Grid Layout...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await delay(1200);
  await page.screenshot({ path: path.join(ASSETS_DIR, 'fig_3_1_homepage_grid.png') });

  // 2. Filtered View (Zone & Vehicle Type)
  console.log('[2/8] Capturing Filtered View...');
  const zoneBtns = await page.$$('button');
  for (const b of zoneBtns) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Zone A')) {
      await b.click();
      break;
    }
  }
  await delay(800);
  await page.screenshot({ path: path.join(ASSETS_DIR, 'fig_3_2_filtered_grid.png') });

  // 3. Login as Driver to book spot
  console.log('[3/8] Logging in via Driver Demo...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await delay(800);
  const driverBtns = await page.$$('button');
  for (const b of driverBtns) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Driver Demo')) {
      await b.click();
      break;
    }
  }
  await delay(800);

  // 4. Click Book on available slot to open Booking Modal
  console.log('[4/8] Clicking Book button for Booking Modal...');
  const bookSpans = await page.$$('span');
  for (const s of bookSpans) {
    const t = await page.evaluate(el => el.textContent, s);
    if (t && t.trim() === 'Book') {
      await s.click();
      break;
    }
  }
  await delay(1000);
  // Type vehicle plate
  const inputs = await page.$$('input');
  for (const inp of inputs) {
    const ph = await page.evaluate(el => el.placeholder, inp);
    if (ph && ph.includes('DL-')) {
      await inp.type('DL-08-AB-4321');
      break;
    }
  }
  await delay(500);
  await page.screenshot({ path: path.join(ASSETS_DIR, 'fig_3_3_booking_modal.png') });

  // 5. Submit Booking for Digital Pass with SVG QR
  console.log('[5/8] Submitting reservation for Digital Pass with SVG QR...');
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
  }
  await delay(2000);
  await page.screenshot({ path: path.join(ASSETS_DIR, 'fig_3_4_digital_pass.png') });

  // 6. Clean Navigation for Authentication Modal
  console.log('[6/8] Capturing Authentication Modal...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await delay(1000);
  // Click Sign In
  const signInBtns = await page.$$('button');
  for (const b of signInBtns) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && (text.includes('Sign In') || text.includes('Login'))) {
      await b.click();
      break;
    }
  }
  await delay(1000);
  await page.screenshot({ path: path.join(ASSETS_DIR, 'fig_3_5_auth_modal.png') });

  // 7. Driver Booking History (My Passes)
  console.log('[7/8] Capturing Driver My Bookings...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await delay(800);
  const drvBtns = await page.$$('button');
  for (const b of drvBtns) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Driver Demo')) {
      await b.click();
      break;
    }
  }
  await delay(800);
  const navTabs = await page.$$('button');
  for (const t of navTabs) {
    const text = await page.evaluate(el => el.textContent, t);
    if (text && (text.includes('My Passes') || text.includes('My Bookings'))) {
      await t.click();
      break;
    }
  }
  await delay(1000);
  await page.screenshot({ path: path.join(ASSETS_DIR, 'fig_3_6_my_bookings.png') });

  // 8. Admin Panel Analytics & Pass Scanner
  console.log('[8/8] Capturing Admin Analytics & Scanner...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await delay(800);
  const adminBtns = await page.$$('button');
  for (const b of adminBtns) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Admin Demo')) {
      await b.click();
      break;
    }
  }
  await delay(800);
  const adminTabs = await page.$$('button');
  for (const t of adminTabs) {
    const text = await page.evaluate(el => el.textContent, t);
    if (text && text.includes('Admin Panel')) {
      await t.click();
      break;
    }
  }
  await delay(1200);
  await page.screenshot({ path: path.join(ASSETS_DIR, 'fig_3_7_admin_analytics.png') });

  // Scroll down to verify pass section / scanner
  await page.evaluate(() => window.scrollBy(0, 520));
  await delay(800);
  await page.screenshot({ path: path.join(ASSETS_DIR, 'fig_3_8_admin_scanner.png') });

  await browser.close();
  console.log('✅ ALL SCREENSHOTS FLAWLESSLY CAPTURED!');
}

capture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
