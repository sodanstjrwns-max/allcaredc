// 모바일(390x844) 전 페이지 이미지 크롭 감사
import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const PAGES = [
  '/', '/mission', '/directions', '/pricing', '/faq', '/reservation',
  '/treatments', '/treatments/implant', '/treatments/ortho', '/treatments/esthetic',
  '/doctors', '/doctors/kwon-jongjin', '/doctors/kwon-minsoo', '/doctors/bae-suhyeon',
  '/column', '/notice', '/events', '/cases', '/encyclopedia',
  '/area/yaksu-implant',
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true, deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});
const page = await ctx.newPage();

const results = [];
for (const path of PAGES) {
  try {
    const resp = await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 20000 });
    if (!resp || resp.status() >= 400) { results.push({ path, error: 'HTTP ' + (resp ? resp.status() : '?') }); continue; }
    // 팝업 닫기
    await page.evaluate(() => { const p = document.querySelector('#noticePop'); if (p) p.hidden = true; });
    // 전체 스크롤(레이지로드 트리거)
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(500);
    const imgs = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('img').forEach(img => {
        const r = img.getBoundingClientRect();
        if (r.width < 30 || r.height < 30) return; // 아이콘 제외
        if (!img.naturalWidth || !img.naturalHeight) return;
        const cs = getComputedStyle(img);
        const fit = cs.objectFit;
        const frameRatio = r.width / r.height;
        const srcRatio = img.naturalWidth / img.naturalHeight;
        let cropPct = 0, cropAxis = '-';
        if (fit === 'cover') {
          if (srcRatio > frameRatio) { cropPct = (1 - frameRatio / srcRatio) * 100; cropAxis = '좌우'; }
          else if (srcRatio < frameRatio) { cropPct = (1 - srcRatio / frameRatio) * 100; cropAxis = '상하'; }
        }
        out.push({
          src: (img.currentSrc || img.src).split('/').slice(-2).join('/').split('?')[0],
          cls: img.className || img.parentElement.className || '',
          w: Math.round(r.width), h: Math.round(r.height),
          nw: img.naturalWidth, nh: img.naturalHeight,
          fit, pos: cs.objectPosition,
          cropPct: Math.round(cropPct * 10) / 10, cropAxis,
        });
      });
      return out;
    });
    for (const im of imgs) results.push({ path, ...im });
  } catch (e) {
    results.push({ path, error: e.message.slice(0, 80) });
  }
}

// 보고서
const cropped = results.filter(r => r.cropPct >= 3);
console.log('=== 크롭 3% 이상 이미지 (모바일 390px) ===');
for (const r of cropped) {
  console.log(`${r.path.padEnd(28)} ${String(r.cropPct).padStart(5)}% ${r.cropAxis} | 틀 ${r.w}x${r.h} vs 원본 ${r.nw}x${r.nh} | pos:${r.pos} | ${r.src} | .${String(r.cls).slice(0,40)}`);
}
console.log(`\n총 이미지 검사: ${results.filter(r=>!r.error).length}개 / 크롭발생: ${cropped.length}개`);
const errs = results.filter(r => r.error);
if (errs.length) { console.log('\n=== 오류 페이지 ==='); errs.forEach(e => console.log(e.path, e.error)); }

await browser.close();
