import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('https://allcaredc.kr?cb=' + Date.now(), { waitUntil: 'networkidle' });
try { await p.click('text=닫기', { timeout: 2500 }); } catch {}
try { await p.click('text=오늘 하루 보지 않기', { timeout: 1500 }); } catch {}
await p.waitForTimeout(600);
const fs = await p.$eval('.hh-title--ko .hh-ko-line', n => getComputedStyle(n).fontSize).catch(()=>'n/a');
await p.screenshot({ path: '/tmp/live_pc.png' });
console.log('live font-size:', fs);
await b.close();
