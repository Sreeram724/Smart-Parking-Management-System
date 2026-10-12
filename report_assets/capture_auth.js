const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ASSETS_DIR = path.resolve(__dirname);
const delay = ms => new Promise(r => setTimeout(r, ms));

async function captureAuth() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 1.5 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await delay(1000);

  // Click Sign In
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Sign In')) {
      await b.click();
      break;
    }
  }
  await delay(1200);
  await page.screenshot({ path: path.join(ASSETS_DIR, 'fig_3_5_auth_modal.png') });
  await browser.close();
  console.log('[SUCCESS] fig_3_5_auth_modal.png captured cleanly!');
}

captureAuth().catch(console.error);
