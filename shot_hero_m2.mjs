import { chromium } from 'playwright';
const url = 'http://localhost:3000/?cb=' + Date.now();
const b = await chromium.launch();
let p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
for (const sel of ['text=닫기', 'text=오늘 하루 보지 않기']) {
  try { const el = await p.$(sel); if (el) { await el.click(); await p.waitForTimeout(300); break; } } catch(e){}
}
await p.waitForTimeout(500);
const box = await p.evaluate(() => {
  const img = document.querySelector('.hh-portrait');
  if (!img) return null;
  const r = img.getBoundingClientRect();
  window.scrollBy(0, r.top - 80);
  return { w: r.width, h: r.height };
});
console.log('img box', JSON.stringify(box));
await p.waitForTimeout(500);
await p.screenshot({ path: '/tmp/hero_mobile3.png' });
await p.close();
await b.close();
console.log('done');
