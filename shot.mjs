import { chromium } from 'playwright';
const cb = Date.now();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });

// 1) mission continuity section
await page.goto(`https://allcaredc.kr/mission?cb=${cb}`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1500);
const fig = await page.$('.about-story-sub');
if (fig) { await fig.scrollIntoViewIfNeeded(); await page.waitForTimeout(1500);
  await fig.screenshot({ path: '/tmp/shot_mission_continuity.png' }); console.log('mission continuity shot OK'); }
else console.log('!! .about-story-sub not found');

// 2) find a doctors listing page — try /doctors then homepage doc-grid
let docShot = false;
for (const url of ['/doctors','/about','/']) {
  try {
    await page.goto(`https://allcaredc.kr${url}?cb=${cb}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1200);
    const grid = await page.$('.doc-grid');
    if (grid) { await grid.scrollIntoViewIfNeeded(); await page.waitForTimeout(1500);
      await grid.screenshot({ path: '/tmp/shot_doc_grid.png' });
      console.log('doc-grid shot OK from', url); docShot = true; break; }
  } catch(e) { console.log('skip', url, e.message); }
}
if (!docShot) console.log('!! doc-grid not found on any page');
await browser.close();
