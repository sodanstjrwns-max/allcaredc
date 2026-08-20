import { chromium } from 'playwright';
const b = await chromium.launch();
// PC
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('https://allcaredc.kr/?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await p.screenshot({ path: '/tmp/hero_pc.png' });
// Mobile
const m = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
await m.goto('https://allcaredc.kr/?cb=' + Date.now(), { waitUntil: 'networkidle' });
await m.waitForTimeout(1500);
await m.screenshot({ path: '/tmp/hero_mobile.png' });
await b.close();
console.log('done');
