import { chromium } from 'playwright';
const url = 'http://localhost:3000/?cb=' + Date.now();
const b = await chromium.launch();
// PC
let p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
await p.screenshot({ path: '/tmp/hero_pc.png' });
await p.close();
// Mobile
p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
await p.screenshot({ path: '/tmp/hero_mobile.png' });
await p.close();
await b.close();
console.log('done');
