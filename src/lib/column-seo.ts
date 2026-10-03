// ============================================================
// 칼럼·진료사례 SEO/AEO 헬퍼 (PFWE-COLUMN-CASE-SEO.md, 2026-10-03)
// - 핵심 답변: 본문 첫 문단(원장이 쓴 결론 문장) → 없으면 요약(excerpt). 새로 쓰지 않는다.
// - 질문형 H2/H3 → FAQ, 원장 입력 FAQ 와 중복 제거 후 합침 (스키마용 — 둘 다 화면에 있음)
// - 본문 이미지 alt·lazy 보정
// - 진료사례 공개 요약: 구조 필드(진료명·기간·담당 원장)만으로 조립
// ============================================================

const decode = (s: string) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")

export function flatText(h: any): string {
  return decode(String(h || '').replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/[​\r]/g, '').replace(/\s+/g, ' ').trim()
}

export function clipSentences(s: string, max: number, min = 40): string {
  const t = String(s || '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  let end = -1
  const re = /(다\.|요\.|[?!。])(\s|$)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(cut))) end = m.index + m[1].length
  if (end >= min) return cut.slice(0, end)
  return cut.slice(0, max - 1).replace(/\s+\S*$/, '') + '…'
}

/** 핵심 답변 2~3문장: 본문 첫 문단(40자 이상) → 요약 */
export function answerSummary(body: string, excerpt?: string): string {
  const paras = [...String(body || '').matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => flatText(m[1])).filter(p => p.length >= 40 && !/^안녕하세요/.test(p))
  const src = paras[0] || flatText(excerpt)
  return src ? clipSentences(src, 230, 60) : ''
}

const CONNECTOR_Q = /^(그럼|그런데|그래서|그렇다면|그래도|그러면|하지만)[\s,]/

export function faqsFromArticleHtml(html: string): { q: string; a: string }[] {
  const src = String(html || '')
  const heads = [...src.matchAll(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi)]
  const out: { q: string; a: string }[] = []
  heads.forEach((m, i) => {
    const q = flatText(m[2]).replace(/^(Q\d*[.:)]\s*|\d+[.)]\s*)/i, '')
    if (!/[?？]$/.test(q) || CONNECTOR_Q.test(q)) return
    const start = (m.index || 0) + m[0].length
    const end = i + 1 < heads.length ? heads[i + 1].index || src.length : src.length
    const a = clipSentences(flatText(src.slice(start, end).replace(/<figure[\s\S]*?<\/figure>/gi, ' ')), 600, 60)
    if (a.length >= 30 && !out.some(f => f.q === q)) out.push({ q, a })
  })
  return out
}

export function mergeFaqs(a: { q: string; a: string }[], b: { q: string; a: string }[]) {
  const norm = (q: string) => q.replace(/[\s?？.!,]/g, '')
  const out = [...a]
  for (const f of b) if (!out.some(x => norm(x.q) === norm(f.q))) out.push(f)
  return out
}

/** 본문 이미지: alt 없음/의미 없음 → 제목 기반, lazy·async (대표 이미지가 위에 있으므로 본문은 전부 lazy) */
export function enhanceArticleImages(html: string, title: string): string {
  let n = 0
  const safeTitle = String(title).replace(/"/g, '&quot;')
  return String(html || '').replace(/<img\b([^>]*)>/gi, (_m, attrs: string) => {
    n++
    let a = attrs.replace(/\s*contenteditable=("[^"]*"|'[^']*')/gi, '').replace(/\s*\/\s*$/, '')
    const altM = a.match(/\salt=("([^"]*)"|'([^']*)')/i)
    const alt = altM ? (altM[2] ?? altM[3] ?? '').trim() : ''
    if (!alt || /^(이미지|image|img|사진|photo)$/i.test(alt)) {
      const nAlt = `${safeTitle} — 본문 이미지 ${n}`
      a = altM ? a.replace(altM[0], ` alt="${nAlt}"`) : `${a} alt="${nAlt}"`
    }
    if (!/\sloading=/i.test(a)) a += ' loading="lazy"'
    if (!/\sdecoding=/i.test(a)) a += ' decoding="async"'
    return `<img${a}>`
  })
}

/** ms epoch → KST 날짜 / ISO */
const MIN_VALID = Date.UTC(2000, 0, 1)
export function validTs(...c: (number | undefined)[]): number | undefined {
  for (const t of c) if (typeof t === 'number' && !isNaN(t) && t >= MIN_VALID) return t
  return undefined
}
export const isoOf = (t?: number) => (t ? new Date(t).toISOString() : undefined)
export const kstYmd = (t?: number) => (t ? new Date(t + 9 * 3600e3).toISOString().slice(0, 10) : '')

export function caseAutoSummary(c: { period?: string }, txName: string, doctorLabel: string, clinicName: string): string {
  const parts = [`${clinicName} ${txName} 진료사례입니다.`]
  if (c.period) parts.push(`치료 기간은 ${c.period}입니다.`)
  if (doctorLabel) parts.push(`담당 의료진은 ${doctorLabel}입니다.`)
  parts.push('전후 사진은 같은 촬영 조건에서 기록했으며, 치료 결과는 개인의 상태에 따라 차이가 있을 수 있습니다.')
  return parts.join(' ')
}

/** JSON-LD 직렬화 — '</script>' 깨짐 방지 */
export const ldJson = (o: unknown) => JSON.stringify(o).replace(/</g, '\\u003c')
