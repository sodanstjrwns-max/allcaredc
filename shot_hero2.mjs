import { chromium } from 'playwright';
const url = 'http://localhost:3000/?cb=' + Date.now();
const b = await chromium.launch();
let p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
// close notice popup if present
for (const sel of ['text=닫기', '.notice-close', '[aria-label="close"]', 'text=오늘 하루 보지 않기']) {
  try { const el = await p.$(sel); if (el) { await el.click(); await p.waitForTimeout(300); break; } } catch(e){}
}
await p.waitForTimeout(600);
await p.screenshot({ path: '/tmp/hero_pc2.png' });
await p.close();
await b.close();
console.log('done');
