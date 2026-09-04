// ============================================================
// 관리자 통계 페이지 (/admin/stats)
// 중앙 대시보드(PF Web Engine) API 연동 — 서버사이드 fetch 전용.
// 토큰은 서버 코드에만 존재하며 브라우저에 노출되지 않는다.
// ============================================================

const STATS_DOMAIN = 'allcaredc.kr'
const STATS_TOKEN = 'ac5ea5fa7f4a3c94c6cf74029a75969780baba164d859343'
const STATS_MASTER_KEY = 'pfwe-b4f42f06'
const STATS_API = 'https://pf-dashboard-2nt.pages.dev/api/stats/' + STATS_DOMAIN

// ?key= 접근 검사 — 사이트 토큰 또는 마스터 키 일치 시 통과
export const isValidStatsKey = (key?: string): boolean =>
  !!key && (key === STATS_TOKEN || key === STATS_MASTER_KEY)

// ── 60초 메모리 캐시 (isolate 생존 동안) ──
let _statsCache: { at: number; data: any } | null = null

export async function fetchSiteStats(): Promise<any | null> {
  if (_statsCache && Date.now() - _statsCache.at < 60_000) return _statsCache.data
  try {
    const res = await fetch(STATS_API, { headers: { Authorization: 'Bearer ' + STATS_TOKEN } })
    if (!res.ok) return null
    const data = await res.json()
    _statsCache = { at: Date.now(), data }
    return data
  } catch {
    return null
  }
}

// ── 유틸 ──
const num = (v: any): number => (typeof v === 'number' && isFinite(v) ? v : 0)
const fmt = (v: number): string => Math.round(v).toLocaleString('ko-KR')
const esc = (s: any): string =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const pct = (v: any): string => {
  const x = num(v)
  if (x === 0) return '0%'
  return (Math.abs(x) <= 1 ? (x * 100).toFixed(1) : x.toFixed(1)) + '%'
}

function deltaVal(delta: any, key: string): number | null {
  if (delta == null) return null
  if (typeof delta === 'number') return delta
  const v = (delta as any)[key]
  return typeof v === 'number' && isFinite(v) ? v : null
}

// 증감 화살표 (invert=true: 값이 줄어드는 게 좋은 지표, 예: 평균 순위)
function arrowHtml(d: number | null, invert = false, unit = ''): string {
  if (d === null || d === 0) return '<span class="delta flat">— 직전 28일과 유사</span>'
  const good = invert ? d < 0 : d > 0
  const sym = d > 0 ? '▲' : '▼'
  const mag = Math.abs(d) < 1 && unit === '' ? Math.abs(d).toFixed(2) : Math.abs(d) < 100 ? Math.abs(d).toFixed(1).replace(/\.0$/, '') : fmt(Math.abs(d))
  return `<span class="delta ${good ? 'up' : 'down'}">${sym} ${mag}${unit} <small>vs 직전 28일</small></span>`
}

// 일별 배열 정규화 ([3,5,..] 또는 [{date,clicks}...] 모두 허용)
function dailyNums(arr: any, keys: string[]): number[] {
  if (!Array.isArray(arr)) return []
  return arr.map((x: any) => {
    if (typeof x === 'number') return num(x)
    for (const k of keys) if (x && typeof x[k] === 'number') return num(x[k])
    return 0
  })
}

// 인라인 SVG 스파크라인 (외부 라이브러리 없음)
function sparkline(values: number[], color: string): string {
  const vs = values.map(num)
  if (vs.length < 2) return '<div class="empty">일별 데이터가 쌓이는 중입니다</div>'
  const w = 600, h = 88, pad = 4
  const max = Math.max(...vs, 1)
  const step = (w - pad * 2) / (vs.length - 1)
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2)
  const pts = vs.map((v, i) => `${(pad + i * step).toFixed(1)},${y(v).toFixed(1)}`)
  const area = `${pad},${h - pad} ${pts.join(' ')} ${(pad + (vs.length - 1) * step).toFixed(1)},${h - pad}`
  const last = vs[vs.length - 1]
  const lx = (pad + (vs.length - 1) * step).toFixed(1)
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="추이 그래프">
    <polygon points="${area}" fill="${color}" opacity="0.12"/>
    <polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${lx}" cy="${y(last).toFixed(1)}" r="3.5" fill="${color}"/>
  </svg>
  <div class="spark-meta"><span>${vs.length}일 추이</span><span>최근 ${fmt(last)} · 최대 ${fmt(max)}</span></div>`
}

// AI 소스 정규화 → [라벨, 세션수]
function aiSourceRows(bySource: any): Array<[string, number]> {
  const LABELS: Record<string, string> = {
    chatgpt: 'ChatGPT', openai: 'ChatGPT', perplexity: 'Perplexity',
    claude: 'Claude', anthropic: 'Claude', gemini: 'Gemini', google_gemini: 'Gemini', bard: 'Gemini',
  }
  const acc: Record<string, number> = { ChatGPT: 0, Perplexity: 0, Claude: 0, Gemini: 0, '기타': 0 }
  const add = (name: string, v: number) => {
    const label = LABELS[name.toLowerCase().trim()] || '기타'
    acc[label] += v
  }
  if (Array.isArray(bySource)) {
    for (const r of bySource) add(String(r?.source ?? r?.name ?? '기타'), num(r?.sessions ?? r?.count ?? r?.value))
  } else if (bySource && typeof bySource === 'object') {
    for (const [k, v] of Object.entries(bySource)) add(k, num(v))
  }
  return (Object.entries(acc) as Array<[string, number]>)
}

// 상위 검색어/페이지 행 정규화
function rowOf(x: any, nameKeys: string[]): { name: string; clicks: number; impressions: number } {
  if (typeof x === 'string') return { name: x, clicks: 0, impressions: 0 }
  let name = ''
  for (const k of nameKeys) if (x && typeof x[k] === 'string') { name = x[k]; break }
  return { name, clicks: num(x?.clicks), impressions: num(x?.impressions) }
}

// ── 자동 인사이트 (서버 규칙 기반) ──
function buildInsights(d: any): string[] {
  const out: string[] = []
  if (!d || d.configured === false) {
    out.push('구글 서치콘솔·애널리틱스 연동 데이터가 수집되는 대로 이 영역에 자동 분석이 표시됩니다.')
    out.push('사이트맵 제출·IndexNow·구조화데이터 등 검색엔진 가속 세팅은 이미 완료된 상태입니다.')
    out.push('지표가 쌓이는 중입니다. 신규 사이트는 통상 개설 1~3개월 차부터 검색 노출이 잡히기 시작합니다.')
    return out
  }
  const g = d.gsc || {}
  const a = d.ga || {}
  const ai = d.ai || {}
  const dc = deltaVal(g.delta, 'clicks')
  if (dc !== null && dc !== 0) {
    out.push(dc > 0
      ? `최근 28일 검색 클릭이 직전 기간보다 ${fmt(Math.abs(dc))}회 늘었습니다. 상승 흐름입니다.`
      : `최근 28일 검색 클릭이 직전 기간보다 ${fmt(Math.abs(dc))}회 줄었습니다. 콘텐츠 발행 주기를 점검해 보세요.`)
  } else if (num(g.clicks) > 0) {
    out.push(`최근 28일 검색 클릭은 ${fmt(num(g.clicks))}회로 직전 기간과 비슷한 수준입니다.`)
  }
  const tq = Array.isArray(g.topQueries) && g.topQueries.length ? rowOf(g.topQueries[0], ['query', 'name', 'key']) : null
  if (tq && tq.name) out.push(`가장 많이 유입된 검색어는 "${tq.name}"${tq.clicks ? ` (클릭 ${fmt(tq.clicks)}회)` : ''}입니다.`)
  const dp = deltaVal(g.delta, 'position')
  if (dp !== null && Math.abs(dp) >= 0.1) {
    out.push(dp < 0
      ? `평균 검색 순위가 ${Math.abs(dp).toFixed(1)}계단 올랐습니다 (숫자가 낮을수록 상위 노출).`
      : `평균 검색 순위가 ${Math.abs(dp).toFixed(1)}계단 내려갔습니다. 주요 키워드 경쟁 상황을 지켜보는 중입니다.`)
  }
  if (num(ai.sessions) > 0) {
    out.push(`ChatGPT·Perplexity 등 AI 검색에서 ${fmt(num(ai.sessions))}회 방문이 발생했습니다 (전체의 ${pct(ai.share)}). AEO 세팅이 작동하고 있다는 신호입니다.`)
  }
  if (num(a.leads) > 0) out.push(`최근 28일 온라인 상담(리드) 신청은 ${fmt(num(a.leads))}건입니다.`)
  if (out.length === 0) out.push('지표가 쌓이는 중입니다. 데이터가 충분해지면 자동 분석이 표시됩니다.')
  return out.slice(0, 5)
}

// ── 기대관리(성장 단계) 카드 ──
const STAGES: Array<[string, string]> = [
  ['0~1개월', '색인'],
  ['1~3개월', '롱테일 키워드 노출 시작'],
  ['3~6개월', '지역+진료 키워드 진입'],
  ['6개월~', '경쟁 키워드 본순위 시작'],
]

function timelineHtml(): string {
  return `<ol class="timeline">${STAGES.map(([p, t]) =>
    `<li><span class="tl-period">${p}</span><span class="tl-label">${t}</span></li>`).join('')}</ol>`
}

function expectationCard(early: boolean): string {
  if (early) {
    return `<section class="card expect expect-big">
      <h2>검색 순위는 시간이 필요합니다</h2>
      ${timelineHtml()}
      <p class="expect-note">신규 사이트는 색인과 순위 안착까지 시간이 걸립니다. 본격적인 순위 경쟁은 개설 6개월부터 시작됩니다.
      사이트맵·IndexNow·구조화데이터 등 검색 가속 세팅은 모두 완료되어 있습니다.</p>
    </section>`
  }
  return `<details class="card expect expect-small">
    <summary>검색 순위는 시간이 필요합니다 — 성장 단계 안내 보기</summary>
    ${timelineHtml()}
    <p class="expect-note">사이트맵·IndexNow·구조화데이터 등 검색 가속 세팅은 모두 완료되어 있습니다.</p>
  </details>`
}

// ── 페이지 렌더 ──
export function renderStatsPage(d: any): string {
  const configured = !!(d && d.configured !== false)
  const g = (d && d.gsc) || {}
  const a = (d && d.ga) || {}
  const ai = (d && d.ai) || {}
  const early = !configured || num(g.clicks) < 100

  const V = (has: boolean, s: string) => (has ? s : '<span class="nodata">—</span>')
  const hasGsc = configured && d.gsc
  const hasGa = configured && (d.hasGa === undefined ? d.ga : d.hasGa) && d.ga
  const hasAi = configured && d.ai

  const metricCards = `
  <div class="grid metrics">
    <div class="card metric"><span class="m-label">검색 클릭 <small>GSC · 28일</small></span><strong>${V(!!hasGsc, fmt(num(g.clicks)))}</strong>${hasGsc ? arrowHtml(deltaVal(g.delta, 'clicks')) : ''}</div>
    <div class="card metric"><span class="m-label">검색 노출 <small>GSC · 28일</small></span><strong>${V(!!hasGsc, fmt(num(g.impressions)))}</strong>${hasGsc ? arrowHtml(deltaVal(g.delta, 'impressions')) : ''}</div>
    <div class="card metric"><span class="m-label">클릭률(CTR)</span><strong>${V(!!hasGsc, pct(g.ctr))}</strong>${hasGsc ? arrowHtml(deltaVal(g.delta, 'ctr')) : ''}</div>
    <div class="card metric"><span class="m-label">평균 순위 <small>낮을수록 좋음</small></span><strong>${V(!!hasGsc && num(g.position) > 0, num(g.position).toFixed(1))}</strong>${hasGsc ? arrowHtml(deltaVal(g.delta, 'position'), true) : ''}</div>
    <div class="card metric"><span class="m-label">방문자 <small>GA · 28일</small></span><strong>${V(!!hasGa, fmt(num(a.users)))}</strong>${hasGa ? arrowHtml(deltaVal(a.delta, 'users')) : ''}</div>
    <div class="card metric"><span class="m-label">세션</span><strong>${V(!!hasGa, fmt(num(a.sessions)))}</strong>${hasGa ? arrowHtml(deltaVal(a.delta, 'sessions')) : ''}</div>
    <div class="card metric"><span class="m-label">상담 신청 <small>리드</small></span><strong>${V(!!hasGa, fmt(num(a.leads)))}</strong></div>
    <div class="card metric"><span class="m-label">AI 유입 세션 <small>ChatGPT 등</small></span><strong>${V(!!hasAi, fmt(num(ai.sessions)))}</strong>${hasAi && num(ai.sessions) > 0 ? `<span class="delta flat">전체의 ${pct(ai.share)}</span>` : ''}</div>
  </div>`

  const queries = Array.isArray(g.topQueries) ? g.topQueries.slice(0, 10).map((x: any) => rowOf(x, ['query', 'name', 'key'])) : []
  const pages = Array.isArray(g.topPages) ? g.topPages.slice(0, 10).map((x: any) => rowOf(x, ['page', 'url', 'path', 'name', 'key'])) : []
  const aiRows = aiSourceRows(ai.bySource)
  const aiTotal = aiRows.reduce((s, r) => s + r[1], 0)

  const tbl = (rows: string, empty: string, head: string) =>
    rows ? `<table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>` : `<div class="empty">${empty}</div>`

  const queryRows = queries.map((r, i) =>
    `<tr><td class="rank">${i + 1}</td><td class="txt">${esc(r.name)}</td><td class="num">${fmt(r.clicks)}</td><td class="num">${fmt(r.impressions)}</td></tr>`).join('')
  const pageRows = pages.map((r, i) =>
    `<tr><td class="rank">${i + 1}</td><td class="txt">${esc(r.name)}</td><td class="num">${fmt(r.clicks)}</td><td class="num">${fmt(r.impressions)}</td></tr>`).join('')
  const aiTableRows = aiTotal > 0 ? aiRows.map(([label, v]) =>
    `<tr><td class="txt">${label}</td><td class="num">${fmt(v)}</td><td class="num">${aiTotal ? Math.round((v / aiTotal) * 100) : 0}%</td></tr>`).join('') : ''

  const clicksDaily = dailyNums(g.dailyClicks, ['clicks', 'value', 'count'])
  const usersDaily = dailyNums(a.dailyUsers, ['users', 'value', 'count'])

  const insights = buildInsights(d)

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex,nofollow">
<title>사이트 통계 | 365올케어치과 관리자</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>
:root{
  --bg:#f4f6f8; --card:#ffffff; --text:#041a2c; --sub:#5b6b7a;
  --border:#e3e8ee; --accent:#b08d57; --accent-soft:#f1e9dc;
  --good:#16a34a; --bad:#dc2626;
}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Pretendard,-apple-system,sans-serif;background:var(--bg);color:var(--text);line-height:1.55;padding:28px 20px 60px}
.wrap{max-width:1080px;margin:0 auto}
a{color:inherit}
.top{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-bottom:22px}
.top h1{font-size:1.5rem;font-weight:800}
.top .site{color:var(--sub);font-weight:600}
.badge{font-size:.75rem;font-weight:700;padding:4px 12px;border-radius:20px;background:var(--accent-soft);color:var(--accent)}
.badge.wait{background:rgba(120,120,120,.12);color:var(--sub)}
.backlink{margin-left:auto;font-size:.85rem;color:var(--sub);text-decoration:none;border:1px solid var(--border);padding:7px 14px;border-radius:8px;background:var(--card)}
.backlink:hover{color:var(--accent);border-color:var(--accent)}
.card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:22px}
section,details.card{margin-bottom:18px}
h2{font-size:1.12rem;font-weight:800;margin-bottom:14px}
h3{font-size:.95rem;font-weight:700;margin-bottom:10px;color:var(--sub)}
/* 기대관리 카드 */
.expect-big{border:2px solid var(--accent);background:linear-gradient(135deg,var(--accent-soft),var(--card));padding:28px}
.expect-big h2{font-size:1.3rem;color:var(--accent)}
.expect-note{margin-top:14px;font-size:.92rem;color:var(--text);opacity:.9;max-width:720px}
.expect-small summary{cursor:pointer;font-weight:700;font-size:.92rem;color:var(--sub)}
.expect-small[open] summary{margin-bottom:14px;color:var(--accent)}
.timeline{list-style:none;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px;counter-reset:tl}
.timeline li{position:relative;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px 12px 12px;display:flex;flex-direction:column;gap:4px}
.timeline li::before{counter-increment:tl;content:counter(tl);position:absolute;top:-10px;left:12px;width:22px;height:22px;border-radius:50%;background:var(--accent);color:#fff;font-size:.72rem;font-weight:800;display:flex;align-items:center;justify-content:center}
.tl-period{font-size:.78rem;font-weight:800;color:var(--accent)}
.tl-label{font-size:.85rem;font-weight:600}
/* 인사이트 */
.insights ul{list-style:none;display:flex;flex-direction:column;gap:8px}
.insights li{padding-left:22px;position:relative;font-size:.93rem}
.insights li::before{content:"";position:absolute;left:4px;top:9px;width:7px;height:7px;border-radius:50%;background:var(--accent)}
/* 지표 카드 */
.grid.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}
.metric{padding:16px 18px;display:flex;flex-direction:column;gap:5px}
.m-label{font-size:.78rem;font-weight:700;color:var(--sub)}
.m-label small{font-weight:500;opacity:.75}
.metric strong{font-size:1.55rem;font-weight:800;letter-spacing:-.02em}
.nodata{color:var(--sub);opacity:.6}
.delta{font-size:.76rem;font-weight:700}
.delta small{font-weight:500;opacity:.7}
.delta.up{color:var(--good)}.delta.down{color:var(--bad)}.delta.flat{color:var(--sub)}
/* 차트 */
.charts{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.charts svg{width:100%;height:96px;display:block}
.spark-meta{display:flex;justify-content:space-between;font-size:.75rem;color:var(--sub);margin-top:6px}
/* 테이블 */
.tables{display:grid;grid-template-columns:1fr 1fr;gap:12px}
table{width:100%;border-collapse:collapse;font-size:.86rem}
th{font-size:.74rem;text-transform:uppercase;letter-spacing:.03em;color:var(--sub);text-align:left;padding:6px 8px;border-bottom:1px solid var(--border)}
td{padding:7px 8px;border-bottom:1px solid var(--border)}
tr:last-child td{border-bottom:none}
td.rank{width:28px;color:var(--sub);font-weight:700}
td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
td.txt{word-break:break-all}
.empty{padding:26px 10px;text-align:center;color:var(--sub);font-size:.88rem}
@media(max-width:860px){
  .grid.metrics{grid-template-columns:repeat(2,1fr)}
  .charts,.tables{grid-template-columns:1fr}
  .timeline{grid-template-columns:repeat(2,1fr);row-gap:16px}
}
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <h1>사이트 통계</h1>
    <span class="site">365올케어치과 · ${STATS_DOMAIN}</span>
    ${configured ? '<span class="badge">최근 28일</span>' : '<span class="badge wait">데이터 연동 대기 중</span>'}
    <a class="backlink" href="/admin">← 관리자 홈</a>
  </div>

  ${expectationCard(early)}

  <section class="card insights">
    <h2>자동 인사이트</h2>
    <ul>${insights.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
  </section>

  ${metricCards}

  <section class="charts">
    <div class="card"><h3>일별 검색 클릭</h3>${sparkline(clicksDaily, '#b08d57')}</div>
    <div class="card"><h3>일별 방문자</h3>${sparkline(usersDaily, '#0e4f8a')}</div>
  </section>

  <section class="tables">
    <div class="card"><h3>상위 검색어 TOP 10</h3>${tbl(queryRows, '검색어 데이터가 쌓이는 중입니다', '<th></th><th>검색어</th><th class="num">클릭</th><th class="num">노출</th>')}</div>
    <div class="card"><h3>상위 페이지 TOP 10</h3>${tbl(pageRows, '페이지 데이터가 쌓이는 중입니다', '<th></th><th>페이지</th><th class="num">클릭</th><th class="num">노출</th>')}</div>
  </section>

  <section class="card">
    <h3>AI 검색 유입 (ChatGPT · Perplexity · Claude · Gemini)</h3>
    ${tbl(aiTableRows, 'AI 검색 유입이 아직 없습니다. AEO 세팅은 완료되어 있으며, AI 검색엔진이 사이트를 학습하면 여기에 표시됩니다.', '<th>소스</th><th class="num">세션</th><th class="num">비중</th>')}
  </section>
</div>
</body>
</html>`
}
