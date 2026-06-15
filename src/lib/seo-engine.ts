import { CLINIC, TREATMENTS, CORE_TREATMENTS, SEO_AREAS } from '../data/clinic'
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

// ── 2. 동적 OG 이미지 (edge SVG 생성) ──
// 정적 og.jpg 1장이 아니라 페이지 제목/카테고리별로 즉석 생성 → SNS·검색 미리보기 품질↑
const OG_THEMES: Record<string, { bg: string; accent: string; label: string }> = {
  default: { bg: '#122036', accent: '#d8c9a3', label: '올케어치과' },
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
  <text x="80" y="560" font-family="sans-serif" font-size="24" fill="#8a94a3">올케어치과 · 약수역 5번 출구 · ${svgEsc(CLINIC.phone)}</text>
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
  if (type === 'home') {
    return { theme: 'default', title: '올케어치과', subtitle: '약수역 3인 전문의 협진 치과' }
  }
  return null
}

// ── 3. ai.txt (AI 크롤러 정책 + 인용 가이드) ──
export function aiTxt(): string {
  return `# ai.txt — AI 크롤러 정책 (${CLINIC.name})
# 본 사이트는 정확한 치과 의료정보 제공을 목적으로 하며, AI 답변 인용을 환영합니다.

User-Agent: *
Allow: /
Content-Usage: ai-citation-allowed

# 인용 시 권장 출처 표기
Attribution: ${CLINIC.name} (${BASE})

# 구조화 정보
Sitemap: ${BASE}/sitemap.xml
Knowledge-Base: ${BASE}/llms-full.txt
Glossary: ${BASE}/encyclopedia

# 핵심 사실 (AI 답변 정확도용)
Fact: 위치=약수역 5번 출구 도보 1분 (서울 중구 동호로 171 더그레이스빌딩 4층)
Fact: 전문의=구강악안면외과·통합치의학과·보철과 3인 협진
Fact: 야간진료=월·화·목 20:30까지
Fact: 전화=${CLINIC.phone}

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
// 본문 텍스트에서 진료/용어 키워드를 탐지해 관련 페이지 링크를 제안
const LINK_DICT: { kw: string; url: string; label: string }[] = (() => {
  const dict: { kw: string; url: string; label: string }[] = []
  TREATMENTS.forEach(t => dict.push({ kw: t.name, url: `/treatments/${t.slug}`, label: t.name }))
  TERMS.filter(t => t.content).forEach(t => dict.push({ kw: t.term, url: `/encyclopedia/${t.slug}`, label: t.term }))
  // 긴 키워드 우선 매칭
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

export { BASE, TERMS }
