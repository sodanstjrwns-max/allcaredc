import { CLINIC, TREATMENTS, CORE_TREATMENTS, SEO_AREAS, DOCTORS } from '../data/clinic'
import encData from '../data/encyclopedia.json'

const BASE = `https://${CLINIC.domain}`

type Term = { term: string; en: string; desc: string; treatment: string; initial: string; slug: string; content?: any }
const TERMS = encData as Term[]

// ════════════════════════════════════════════════════════════
// SEO/AEO 슈퍼머신 — 중앙 SEO 엔진
// 모든 SEO/AEO 산출물(스키마/메타/사이트맵/AI파일/자가진단)의 단일 출처
// ════════════════════════════════════════════════════════════

// ── 1. Speakable 스키마 (AEO: 음성검색 / AI 답변 추출 최적화) ──
// 페이지 본문 중 "답변 가능한" 핵심 영역을 AI/음성비서가 우선 읽도록 지정
export function speakableSchema(cssSelectors: string[] = ['.answer-box', '.enc-intro', 'h1', 'h2']) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: cssSelectors,
    },
  }
}

// ── 환자 후기 → AggregateRating + Review 스키마 (구글 별점 노출용) ──
export function reviewSchema() {
  const reviews = CLINIC.reviews || []
  if (!reviews.length) return null
  const avg = (reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length).toFixed(1)
  return {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    '@id': `${BASE}/#clinic`,
    name: CLINIC.name,
    image: `${BASE}/static/img/hero.webp`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: CLINIC.address,
      addressLocality: CLINIC.region.district,
      addressRegion: CLINIC.region.city,
      addressCountry: 'KR',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: avg,
      reviewCount: reviews.length,
      bestRating: '5',
      worstRating: '1',
    },
    review: reviews.map(r => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: String(r.rating || 5), bestRating: '5' },
      author: { '@type': 'Person', name: r.name },
      datePublished: r.date,
      reviewBody: r.text,
    })),
  }
}

// ── 2. 동적 OG 이미지 (edge SVG 생성) ──
// 정적 og.jpg 1장이 아니라 페이지 제목/카테고리별로 즉석 생성 → SNS·검색 미리보기 품질↑
const OG_THEMES: Record<string, { bg: string; accent: string; label: string }> = {
  default: { bg: '#122036', accent: '#d8c9a3', label: '365올케어치과' },
  implant: { bg: '#122036', accent: '#7fb3a8', label: '임플란트' },
  ortho: { bg: '#1a2a44', accent: '#9db8d8', label: '치아교정' },
  esthetic: { bg: '#2a1f30', accent: '#d8a3c9', label: '심미보철' },
  enc: { bg: '#0f1b2e', accent: '#d8c9a3', label: '치과 백과사전' },
  area: { bg: '#122036', accent: '#7fb3a8', label: '약수역 치과' },
}

function svgEsc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function wrapText(s: string, perLine: number): string[] {
  const lines: string[] = []
  let cur = ''
  for (const ch of s) {
    cur += ch
    if (cur.length >= perLine) { lines.push(cur); cur = '' }
  }
  if (cur) lines.push(cur)
  return lines.slice(0, 3)
}

export function ogImageSvg(theme: string, title: string, subtitle: string): string {
  const t = OG_THEMES[theme] || OG_THEMES.default
  const titleLines = wrapText(title, 16)
  const startY = 300 - (titleLines.length - 1) * 38
  const titleTspans = titleLines
    .map((ln, i) => `<text x="80" y="${startY + i * 76}" font-family="'Nanum Myeongjo',serif" font-size="64" font-weight="800" fill="#fffdf5">${svgEsc(ln)}</text>`)
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.bg}"/>
      <stop offset="1" stop-color="#0a121f"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="14" height="630" fill="${t.accent}"/>
  <text x="80" y="130" font-family="'DM Mono',monospace" font-size="22" letter-spacing="4" fill="${t.accent}">${svgEsc(t.label.toUpperCase())}</text>
  ${titleTspans}
  <text x="80" y="${startY + titleLines.length * 76 + 30}" font-family="sans-serif" font-size="28" fill="#c8d0db">${svgEsc(subtitle)}</text>
  <text x="80" y="560" font-family="sans-serif" font-size="24" fill="#8a94a3">365올케어치과 · 약수역 5번 출구 · ${svgEsc(CLINIC.phone)}</text>
  <circle cx="1080" cy="120" r="44" fill="none" stroke="${t.accent}" stroke-width="3"/>
  <text x="1080" y="134" text-anchor="middle" font-family="'Nanum Myeongjo',serif" font-size="46" font-weight="800" fill="${t.accent}">올</text>
</svg>`
}

// OG 라우트용 데이터 조회 (type/slug → theme/title/subtitle)
export function resolveOg(type: string, slug: string): { theme: string; title: string; subtitle: string } | null {
  if (type === 'treatment') {
    const tx = TREATMENTS.find(t => t.slug === slug)
    if (!tx) return null
    const theme = ['implant', 'ortho', 'esthetic'].includes(slug) ? slug : 'default'
    return { theme, title: tx.name, subtitle: tx.short || tx.hero || '' }
  }
  if (type === 'enc') {
    const term = TERMS.find(t => t.slug === slug)
    if (!term) return null
    return { theme: 'enc', title: term.term, subtitle: term.en || '치과 백과사전' }
  }
  if (type === 'doctor') {
    const d = DOCTORS.find(x => x.slug === slug)
    if (!d) return null
    return { theme: 'default', title: `${d.name} ${d.role}`, subtitle: d.titleLine || '약수역 365올케어치과' }
  }
  if (type === 'area') {
    // slug = "yaksu-implant"
    const parts = slug.split('-')
    const txSlug = parts.pop()!
    const areaSlug = parts.join('-')
    const area = SEO_AREAS.find(a => a.slug === areaSlug)
    const tx = TREATMENTS.find(t => t.slug === txSlug)
    if (!area || !tx) return null
    const theme = ['implant', 'ortho', 'esthetic'].includes(txSlug) ? txSlug : 'area'
    return { theme, title: `${area.name} ${tx.name}`, subtitle: `약수역 365올케어치과 · ${tx.short || ''}`.slice(0, 50) }
  }
  if (type === 'home') {
    return { theme: 'default', title: '365올케어치과', subtitle: '약수역 치과 전문의 협진' }
  }
  return null
}

// ── 3. ai.txt (AI 크롤러 정책 + 인용 가이드) ──
export function aiTxt(): string {
  const updated = new Date().toISOString().slice(0, 10)
  const tier12 = SEO_AREAS.filter(a => a.tier <= 2).map(a => a.name).join(', ')
  return `# ai.txt — AI 크롤러 정책 (${CLINIC.name})
# 본 사이트는 정확한 치과 의료정보 제공을 목적으로 하며, AI 답변 인용을 환영합니다.
# Last-Updated: ${updated}

User-Agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Content-Usage: ai-citation-allowed

# 인용 시 권장 출처 표기
Attribution: ${CLINIC.name} (${BASE})
Contact: ${CLINIC.phone}
Reservation: ${BASE}/reservation

# 구조화 정보
Sitemap: ${BASE}/sitemap.xml
Knowledge-Base: ${BASE}/llms-full.txt
Knowledge-Base-Short: ${BASE}/llms.txt
Glossary: ${BASE}/encyclopedia
FAQ: ${BASE}/faq

# 핵심 사실 (AI 답변 정확도용)
Fact: 병원명=${CLINIC.name} (영문 ${CLINIC.nameEn})
Fact: 위치=약수역 5번 출구 도보 1분 (서울 중구 동호로 171 더그레이스빌딩 4층)
Fact: 가까운역=3·6호선 약수역 5번 출구 도보 1분
Fact: 대표원장=권민수 (구강악안면외과·통합치의학과 전문의, 치의학박사)
Fact: 전문의=구강악안면외과·치과보철과·통합치의학과 전문의 협진 시스템
Fact: 진료=임플란트, 치아교정, 심미보철, 충치, 신경치료, 잇몸치료, 사랑니발치, 턱관절치료, 수면치료
Fact: 야간진료=월·화·목 20:30까지
Fact: 특징=원내 기공실 상주, 의식하진정법(수면치료) 가능
Fact: 전화=${CLINIC.phone}
Fact: 좌표=${CLINIC.geo.lat},${CLINIC.geo.lng}
Fact: 내원가능지역=${tier12}

# 면책: 모든 의료정보는 일반적 이해를 위한 것이며, 진단·치료는 전문의 상담 후 결정해야 합니다.
`
}

// ── 4. SEO 자가진단: 사이트 전체 라우트 인벤토리 (대시보드용) ──
export type SeoRoute = {
  path: string
  title: string
  type: string
  hasSchema: boolean
  schemaTypes: string[]
  hasFaq: boolean
  hasSpeakable: boolean
  inSitemap: boolean
}

// ── 5. 내부링크 자동 추천 엔진 ──
// 본문 텍스트에서 진료/용어 키워드를 탐지해 관련 페이지 링크를 제안.
// kw = 매칭에 사용할 키워드(별칭 포함), label = 화면에 표시할 정식 명칭.
// 진료명에 '·'/공백이 섞여 본문에 그대로 안 나오는 경우를 위해 분해한 별칭을 추가한다.
const LINK_DICT: { kw: string; url: string; label: string }[] = (() => {
  const dict: { kw: string; url: string; label: string }[] = []
  const seenKw = new Set<string>()
  const add = (kw: string, url: string, label: string) => {
    kw = (kw || '').trim()
    if (kw.length < 2) return
    const key = kw + '→' + url
    if (seenKw.has(key)) return
    seenKw.add(key)
    dict.push({ kw, url, label })
  }
  TREATMENTS.forEach(t => {
    const url = `/treatments/${t.slug}`
    add(t.name, url, t.name)
    // '구강외과·사랑니' → '구강외과', '사랑니' / '충치·신경치료' → '충치', '신경치료' 같은 부분명도 매칭
    t.name.split(/[·・/]/).forEach(part => add(part.trim(), url, t.name))
  })
  TERMS.filter(t => t.content).forEach(t => {
    const url = `/encyclopedia/${t.slug}`
    add(t.term, url, t.term)
    // 용어명에 공백/가운뎃점이 있으면 핵심 명사 부분도 별칭으로 (단, 너무 짧은 건 제외)
    t.term.split(/[·・/\s]/).forEach(part => { if (part.trim().length >= 3) add(part.trim(), url, t.term) })
  })
  // 긴 키워드 우선 매칭 (부분 매칭으로 인한 오링크 방지)
  return dict.sort((a, b) => b.kw.length - a.kw.length)
})()

export function suggestInternalLinks(text: string, currentPath: string, max = 5): { url: string; label: string }[] {
  const found: { url: string; label: string }[] = []
  const used = new Set<string>()
  for (const d of LINK_DICT) {
    if (found.length >= max) break
    if (d.url === currentPath) continue
    if (used.has(d.url)) continue
    if (text.includes(d.kw)) {
      found.push({ url: d.url, label: d.label })
      used.add(d.url)
    }
  }
  return found
}

// ── 5b. 본문 인라인 자동 링크 주입 (AEO: 시맨틱 엔티티 연결) ──
// 이미 HTML escape 된 본문에서 다른 용어/진료명을 탐지해 <a> 링크로 치환.
// 같은 키워드는 페이지 전체에서 첫 1회만 링크(스팸 방지), currentPath 자기 자신은 제외.
// HTML escape 된 문자열을 받으므로 키워드도 escape 해서 매칭한다.
function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
export function autoLinkBody(escapedHtml: string, currentPath: string, opts?: { maxLinks?: number; linkedSet?: Set<string> }): string {
  const maxLinks = opts?.maxLinks ?? 8
  const linked = opts?.linkedSet ?? new Set<string>()
  let out = escapedHtml
  let count = 0
  for (const d of LINK_DICT) {
    if (count >= maxLinks) break
    if (d.url === currentPath) continue
    if (linked.has(d.url)) continue
    const kw = escHtml(d.kw)
    if (kw.length < 2) continue
    // 이미 <a> 안에 들어간 텍스트는 건드리지 않도록, 태그 밖 텍스트에서만 첫 1회 치환
    const idx = findOutsideAnchor(out, kw)
    if (idx === -1) continue
    const a = `<a href="${d.url}" class="enc-inline-link">${kw}</a>`
    out = out.slice(0, idx) + a + out.slice(idx + kw.length)
    linked.add(d.url)
    count++
  }
  return out
}

// <a>...</a> 내부가 아닌 곳에서 kw 의 첫 등장 위치를 찾는다. 없으면 -1.
function findOutsideAnchor(haystack: string, kw: string): number {
  let from = 0
  while (true) {
    const i = haystack.indexOf(kw, from)
    if (i === -1) return -1
    // i 이전에서 마지막으로 열린 <a 와 닫힌 </a> 위치 비교
    const lastOpen = haystack.lastIndexOf('<a ', i)
    const lastClose = haystack.lastIndexOf('</a>', i)
    const insideAnchor = lastOpen > lastClose
    // 태그 자체(<...>) 안에 걸치는지도 방지
    const lastLt = haystack.lastIndexOf('<', i)
    const lastGt = haystack.lastIndexOf('>', i)
    const insideTag = lastLt > lastGt
    if (!insideAnchor && !insideTag) return i
    from = i + kw.length
  }
}

// ── 5c. 내부링크 커버리지 분석 (대시보드용) ──
// 사이트의 모든 콘텐츠 페이지(진료+백과 상세)를 노드로 보고,
// 각 페이지 본문에서 다른 페이지로 나가는 자동 내부링크가 몇 개 생성되는지 계산해
// "링크 그물(link web)"에 들어온 페이지 비율을 산출한다.
export type LinkCoverage = {
  totalNodes: number       // 링크 사전(LINK_DICT)에 등록된 전체 노드 수
  treatmentNodes: number   // 진료 노드 수
  termNodes: number        // 백과 노드 수
  pagesAnalyzed: number     // 본문을 분석한 페이지 수
  pagesWithOutlinks: number // 1개 이상 아웃링크가 생기는 페이지 수
  pagesWithInlinks: number  // 1회 이상 다른 페이지에서 링크받는(인링크) 노드 수
  totalLinks: number        // 생성되는 내부링크 총 개수 (본문 + 사이드바)
  bodyLinks: number         // 본문 자동 인라인 링크 수
  sidebarLinks: number      // 사이드바 카테고리 관련어 링크 수
  coveragePct: number       // 링크 그물에 연결된 페이지 비율(%)
  isolatedPages: { url: string; label: string }[] // 인링크가 0인 고립 노드
}

export function linkCoverage(): LinkCoverage {
  // 노드(=링크 대상 페이지) 목록
  const treatmentNodes = TREATMENTS.length
  const termNodes = TERMS.filter(t => t.content).length
  const totalNodes = treatmentNodes + termNodes

  // 분석 대상 페이지: 본문 텍스트를 가진 진료 + 백과 상세
  type Doc = { url: string; label: string; text: string }
  const docs: Doc[] = []
  TREATMENTS.forEach(t => {
    const text = [t.intro || '', ...(t.sections || []).map(s => `${s.h} ${s.p}`)].join(' ')
    docs.push({ url: `/treatments/${t.slug}`, label: t.name, text })
  })
  TERMS.filter(t => t.content).forEach(t => {
    const c = t.content as any
    const text = [c?.intro || '', ...((c?.sections || []).map((s: any) => `${s.h} ${s.p}`))].join(' ')
    docs.push({ url: `/encyclopedia/${t.slug}`, label: t.term, text })
  })

  const inlinkTargets = new Set<string>()
  let pagesWithOutlinks = 0
  let bodyLinks = 0

  // ① 본문 자동 인라인 링크 (autoLinkBody 와 동일한 키워드 매칭)
  for (const doc of docs) {
    const outs = new Set<string>()
    for (const d of LINK_DICT) {
      if (d.url === doc.url) continue
      if (outs.has(d.url)) continue
      if (doc.text.includes(d.kw)) {
        outs.add(d.url)
        inlinkTargets.add(d.url)  // 이 노드는 어딘가로부터 인링크를 받음
      }
    }
    if (outs.size > 0) pagesWithOutlinks++
    bodyLinks += outs.size
  }

  // ② 사이드바 "관련 용어" 링크 (encyclopedia 상세: 같은 진료 카테고리끼리 상호 연결)
  //    같은 treatment 카테고리에 본인 외 다른 글이 1개라도 있으면 그 글의 사이드바에서 인링크를 받는다.
  let sidebarLinks = 0
  const contentTerms = TERMS.filter(t => t.content)
  const catCount: Record<string, number> = {}
  contentTerms.forEach(t => { catCount[t.treatment] = (catCount[t.treatment] || 0) + 1 })
  contentTerms.forEach(t => {
    const url = `/encyclopedia/${t.slug}`
    if ((catCount[t.treatment] || 0) >= 2) {
      inlinkTargets.add(url)            // 같은 카테고리 다른 글의 사이드바에서 링크받음
      sidebarLinks += Math.min(catCount[t.treatment] - 1, 6)  // 사이드바 최대 6개
    }
    // 해당 카테고리의 대표 진료 페이지도 사이드바 상단에서 연결됨
    const tx = TREATMENTS.find(x => x.slug === t.treatment)
    if (tx) inlinkTargets.add(`/treatments/${tx.slug}`)
  })

  // 고립 노드: 본문·사이드바 어디서도 링크받지 못한 노드 (url 기준 중복 제거)
  const seenIso = new Set<string>()
  const isolatedPages = LINK_DICT
    .filter(d => !inlinkTargets.has(d.url))
    .filter(d => { if (seenIso.has(d.url)) return false; seenIso.add(d.url); return true })
    .map(d => ({ url: d.url, label: d.label }))

  const pagesWithInlinks = inlinkTargets.size
  const coveragePct = totalNodes ? Math.round((pagesWithInlinks / totalNodes) * 100) : 0

  return {
    totalNodes, treatmentNodes, termNodes,
    pagesAnalyzed: docs.length,
    pagesWithOutlinks,
    pagesWithInlinks,
    totalLinks: bodyLinks + sidebarLinks,
    bodyLinks,
    sidebarLinks,
    coveragePct,
    isolatedPages,
  }
}

export { BASE, TERMS }
