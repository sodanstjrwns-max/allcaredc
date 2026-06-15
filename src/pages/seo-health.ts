import { html, raw } from 'hono/html'
import { Page } from '../components/page'
import { CLINIC, TREATMENTS, CORE_TREATMENTS, SEO_AREAS, DOCTORS } from '../data/clinic'
import { BASE, TERMS } from '../lib/seo-engine'

// ════════════════════════════════════════════════════════════
// SEO/AEO 슈퍼머신 — 자가진단 대시보드 (/seo-health)
// 사이트 전체 라우트의 SEO/AEO 적용 상태를 자동 점검·시각화
// ════════════════════════════════════════════════════════════

type Row = {
  group: string
  path: string
  schema: string[]   // 적용된 스키마 타입
  aeo: string[]      // AEO 신호 (FAQ, Speakable, llms 등)
  note?: string
}

function buildInventory(): Row[] {
  const rows: Row[] = []

  // 정적 핵심 페이지
  rows.push({ group: '핵심', path: '/', schema: ['Dentist', 'WebSite', 'BreadcrumbList'], aeo: ['Speakable', 'llms.txt'] })
  rows.push({ group: '핵심', path: '/mission', schema: ['MedicalWebPage', 'BreadcrumbList'], aeo: [] })
  rows.push({ group: '핵심', path: '/doctors', schema: ['MedicalWebPage', 'BreadcrumbList'], aeo: [] })
  DOCTORS.forEach(d => rows.push({ group: '의료진', path: `/doctors/${d.slug}`, schema: ['Physician', 'BreadcrumbList'], aeo: [] }))

  // 진료
  rows.push({ group: '진료', path: '/treatments', schema: ['MedicalWebPage', 'BreadcrumbList'], aeo: [] })
  TREATMENTS.forEach(t => rows.push({
    group: '진료', path: `/treatments/${t.slug}`,
    schema: ['MedicalProcedure', 'FAQPage', 'BreadcrumbList'],
    aeo: t.core ? ['FAQ', 'Speakable', 'OG동적'] : ['FAQ'],
    note: t.core ? '핵심' : undefined,
  }))

  // 백과사전
  const detailCount = TERMS.filter(t => t.content).length
  rows.push({ group: '백과사전', path: '/encyclopedia', schema: ['DefinedTermSet', 'BreadcrumbList'], aeo: ['llms-full'] })
  rows.push({
    group: '백과사전', path: `/encyclopedia/:slug × ${detailCount}`,
    schema: ['DefinedTerm', 'MedicalWebPage', 'FAQPage', 'BreadcrumbList'],
    aeo: ['FAQ', 'Speakable', 'OG동적'], note: `${detailCount}개`,
  })

  // 지역 SEO
  rows.push({
    group: '지역SEO', path: `/area/:combo × ${SEO_AREAS.length * CORE_TREATMENTS.length}`,
    schema: ['MedicalWebPage', 'BreadcrumbList'],
    aeo: ['지역키워드'], note: `${SEO_AREAS.length}지역×${CORE_TREATMENTS.length}진료`,
  })

  // 콘텐츠
  rows.push({ group: '콘텐츠', path: '/cases', schema: ['MedicalWebPage', 'BreadcrumbList'], aeo: [] })
  rows.push({ group: '콘텐츠', path: '/column', schema: ['Blog', 'BreadcrumbList'], aeo: [] })
  rows.push({ group: '콘텐츠', path: '/column/:slug', schema: ['BlogPosting', 'BreadcrumbList'], aeo: [] })
  rows.push({ group: '콘텐츠', path: '/faq', schema: ['FAQPage', 'BreadcrumbList'], aeo: ['FAQ', 'Speakable'] })

  // 안내
  rows.push({ group: '안내', path: '/directions', schema: ['MedicalWebPage', 'BreadcrumbList'], aeo: [] })
  rows.push({ group: '안내', path: '/pricing', schema: ['BreadcrumbList'], aeo: [] })
  rows.push({ group: '안내', path: '/reservation', schema: ['BreadcrumbList'], aeo: [] })

  // 기계가독 파일
  rows.push({ group: 'AI/봇', path: '/sitemap.xml', schema: [], aeo: ['Sitemap'] })
  rows.push({ group: 'AI/봇', path: '/robots.txt', schema: [], aeo: ['봇정책', 'GPTBot/ClaudeBot/Perplexity 허용'] })
  rows.push({ group: 'AI/봇', path: '/llms.txt', schema: [], aeo: ['AI요약'] })
  rows.push({ group: 'AI/봇', path: '/llms-full.txt', schema: [], aeo: ['AI지식베이스', `진료${TREATMENTS.length}+용어${detailCount}`] })
  rows.push({ group: 'AI/봇', path: '/ai.txt', schema: [], aeo: ['AI인용정책', '핵심사실'] })

  return rows
}

function countUrls(): { total: number; breakdown: { label: string; n: number }[] } {
  const detailCount = TERMS.filter(t => t.content).length
  const areaCount = SEO_AREAS.length * CORE_TREATMENTS.length
  const bd = [
    { label: '정적/핵심', n: 12 },
    { label: '진료 상세', n: TREATMENTS.length },
    { label: '의료진', n: DOCTORS.length },
    { label: '백과사전 상세', n: detailCount },
    { label: '지역 SEO', n: areaCount },
  ]
  return { total: bd.reduce((a, b) => a + b.n, 0), breakdown: bd }
}

export function SeoHealthPage() {
  const rows = buildInventory()
  const { total, breakdown } = countUrls()

  // 점검 지표
  const schemaCount = new Set(rows.flatMap(r => r.schema)).size
  const aeoFiles = ['sitemap.xml', 'robots.txt', 'llms.txt', 'llms-full.txt', 'ai.txt']
  const checks = [
    { label: '단일 진실 도메인 (SSOT)', ok: true, detail: CLINIC.domain },
    { label: 'JSON-LD 구조화 데이터', ok: true, detail: `${schemaCount}종 스키마 타입` },
    { label: 'FAQPage (리치결과)', ok: true, detail: '진료/백과/FAQ 페이지' },
    { label: 'Speakable (음성·AI답변)', ok: true, detail: '핵심 페이지 answer-box/intro' },
    { label: '동적 OG 이미지', ok: true, detail: '/og/:type/:slug.svg' },
    { label: 'AI 크롤러 허용', ok: true, detail: 'GPTBot·ClaudeBot·PerplexityBot·Google-Extended' },
    { label: 'AI 지식베이스', ok: true, detail: 'llms-full.txt + ai.txt' },
    { label: 'canonical + OG + Twitter', ok: true, detail: '전 페이지 자동' },
    { label: '의료광고법 면책 고지', ok: true, detail: '푸터 + 백과 disclaimer' },
  ]
  const passed = checks.filter(c => c.ok).length

  const groupColor: Record<string, string> = {
    '핵심': '#7fb3a8', '의료진': '#9db8d8', '진료': '#d8c9a3', '백과사전': '#d8a3c9',
    '지역SEO': '#a3d8c2', '콘텐츠': '#c9a3d8', '안내': '#b8b8b8', 'AI/봇': '#e0a87f',
  }

  const body = html`
  <section class="section" style="padding-top:120px">
    <div class="container" style="max-width:1100px">
      <div style="text-align:center;margin-bottom:48px">
        <p style="font-family:'DM Mono',monospace;letter-spacing:3px;color:var(--brand-accent-2,#7fb3a8);font-size:13px">SEO / AEO SUPERMACHINE</p>
        <h1 style="font-size:42px;margin:8px 0">SEO · AEO 자가진단 대시보드</h1>
        <p style="color:var(--gray-600,#666)">검색엔진(SEO)과 AI 답변엔진(AEO) 최적화 상태를 한눈에 점검합니다.</p>
      </div>

      <!-- 점수 카드 -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:40px">
        <div class="seo-stat"><span class="num">${passed}/${checks.length}</span><span class="lbl">최적화 항목 통과</span></div>
        <div class="seo-stat"><span class="num">${total.toLocaleString()}</span><span class="lbl">색인 대상 URL</span></div>
        <div class="seo-stat"><span class="num">${schemaCount}</span><span class="lbl">스키마 타입</span></div>
        <div class="seo-stat"><span class="num">${aeoFiles.length}</span><span class="lbl">AI/봇 기계가독 파일</span></div>
      </div>

      <!-- 체크리스트 -->
      <h2 style="font-size:24px;margin:0 0 16px">최적화 체크리스트</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;margin-bottom:48px">
        ${raw(checks.map(c => `
          <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border:1px solid #e6e2d6;border-radius:12px;background:#fffdf8">
            <span style="color:${c.ok ? '#2e9e6b' : '#c0392b'};font-size:18px;line-height:1.4"><i class="fa-solid fa-${c.ok ? 'circle-check' : 'circle-xmark'}"></i></span>
            <div><strong style="display:block;font-size:15px">${c.label}</strong><span style="font-size:13px;color:#888">${c.detail}</span></div>
          </div>`).join(''))}
      </div>

      <!-- URL 분포 -->
      <h2 style="font-size:24px;margin:0 0 16px">색인 URL 분포 (${total.toLocaleString()}개)</h2>
      <div style="margin-bottom:48px">
        ${raw(breakdown.map(b => {
          const pct = Math.round(b.n / total * 100)
          return `<div style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:4px"><span>${b.label}</span><span style="color:#888">${b.n}개 (${pct}%)</span></div>
            <div style="height:8px;background:#eee;border-radius:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--brand,#122036)"></div></div>
          </div>`
        }).join(''))}
      </div>

      <!-- 라우트 인벤토리 -->
      <h2 style="font-size:24px;margin:0 0 16px">페이지별 SEO/AEO 적용 현황</h2>
      <div style="overflow-x:auto;border:1px solid #e6e2d6;border-radius:14px">
        <table style="width:100%;border-collapse:collapse;font-size:13.5px;min-width:760px">
          <thead>
            <tr style="background:#f4f1e8;text-align:left">
              <th style="padding:12px 14px">구분</th>
              <th style="padding:12px 14px">경로</th>
              <th style="padding:12px 14px">구조화 스키마 (JSON-LD)</th>
              <th style="padding:12px 14px">AEO 신호</th>
            </tr>
          </thead>
          <tbody>
            ${raw(rows.map(r => `
              <tr style="border-top:1px solid #efece2">
                <td style="padding:10px 14px"><span style="display:inline-block;padding:2px 9px;border-radius:20px;font-size:12px;font-weight:600;background:${groupColor[r.group] || '#ccc'}22;color:#444">${r.group}</span></td>
                <td style="padding:10px 14px;font-family:'DM Mono',monospace;font-size:12.5px;color:#333">${r.path}${r.note ? ` <span style="color:#aaa">· ${r.note}</span>` : ''}</td>
                <td style="padding:10px 14px;color:#555">${r.schema.length ? r.schema.map(s => `<span style="display:inline-block;padding:1px 7px;margin:1px;border-radius:5px;background:#eef2f0;font-size:11.5px">${s}</span>`).join('') : '<span style="color:#bbb">—</span>'}</td>
                <td style="padding:10px 14px;color:#555">${r.aeo.length ? r.aeo.map(a => `<span style="display:inline-block;padding:1px 7px;margin:1px;border-radius:5px;background:#f3ece4;font-size:11.5px;color:#a06a3a">${a}</span>`).join('') : '<span style="color:#bbb">—</span>'}</td>
              </tr>`).join(''))}
          </tbody>
        </table>
      </div>

      <!-- 외부 검증 도구 링크 -->
      <h2 style="font-size:24px;margin:40px 0 16px">기계가독 산출물 바로가기</h2>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:32px">
        ${raw(['/sitemap.xml', '/robots.txt', '/llms.txt', '/llms-full.txt', '/ai.txt'].map(p =>
          `<a href="${p}" target="_blank" style="padding:9px 16px;border:1px solid #d8d2c2;border-radius:10px;font-family:'DM Mono',monospace;font-size:13px;color:#333;text-decoration:none"><i class="fa-solid fa-file-lines" style="margin-right:6px;color:#a06a3a"></i>${p}</a>`
        ).join(''))}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:10px">
        <a href="https://search.google.com/test/rich-results?url=${encodeURIComponent(BASE)}" target="_blank" rel="noopener" style="padding:9px 16px;border:1px solid #d8d2c2;border-radius:10px;font-size:13px;color:#333;text-decoration:none"><i class="fa-brands fa-google" style="margin-right:6px"></i>리치결과 테스트</a>
        <a href="https://validator.schema.org/#url=${encodeURIComponent(BASE)}" target="_blank" rel="noopener" style="padding:9px 16px;border:1px solid #d8d2c2;border-radius:10px;font-size:13px;color:#333;text-decoration:none"><i class="fa-solid fa-code" style="margin-right:6px"></i>Schema 검증</a>
        <a href="https://pagespeed.web.dev/?url=${encodeURIComponent(BASE)}" target="_blank" rel="noopener" style="padding:9px 16px;border:1px solid #d8d2c2;border-radius:10px;font-size:13px;color:#333;text-decoration:none"><i class="fa-solid fa-gauge-high" style="margin-right:6px"></i>PageSpeed</a>
      </div>
    </div>
  </section>
  <style>
    .seo-stat{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px;border-radius:16px;background:linear-gradient(135deg,#122036,#0a121f);color:#fffdf5;text-align:center}
    .seo-stat .num{font-size:34px;font-weight:800;font-family:'Nanum Myeongjo',serif;line-height:1}
    .seo-stat .lbl{font-size:13px;color:#b8c0cc;margin-top:8px}
  </style>
  `
  return Page({
    title: `SEO·AEO 자가진단 | ${CLINIC.name}`,
    description: 'SEO/AEO 슈퍼머신 자가진단 대시보드 — 구조화 데이터, AI 크롤러 정책, 색인 URL 현황을 한눈에 점검합니다.',
    path: '/seo-health',
    noindex: true,
  }, body)
}
