// ============================================================
// 관리자 통계 페이지 (/admin/stats)
// 중앙 대시보드(PF Web Engine) API 연동 — 서버사이드 fetch 전용.
// 토큰은 서버 코드에만 존재하며 브라우저에 노출되지 않는다.
// ============================================================

const STATS_DOMAIN = 'allcaredc.kr'
const STATS_TOKEN = 'ac5ea5fa7f4a3c94c6cf74029a75969780baba164d859343'
const STATS_MASTER_KEY = 'pfwe-b4f42f06'
const STATS_API = 'https://pf-dashboard-2nt.pages.dev/api/stats/' + STATS_DOMAIN
const CLARITY_ID = 'yc7sdhjwgd'
const CLARITY_URL = 'https://clarity.microsoft.com/projects/view/' + CLARITY_ID + '/dashboard'
// GA4 generate_lead(예약 접수 성공) 전송을 시작한 날 — 그 전 기간은 0 으로 잡힌다(누락 아님, 미전송)
const LEADS_SINCE = '11/9 업데이트 배포 후'

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
// 중앙 대시보드의 delta는 '직전 28일 대비 변화율(%)'이다. (2026-11-04 수정: 예전엔 단위 없이 표시돼
//   -29%가 '29회 감소'처럼 읽혔음)
function arrowHtml(d: number | null, invert = false, unit = '%'): string {
  if (d === null || Math.abs(d) < 0.05) return '<span class="delta flat">— 직전 28일과 유사</span>'
  const good = invert ? d < 0 : d > 0
  const sym = d > 0 ? '▲' : '▼'
  const mag = Math.abs(d) < 100 ? Math.abs(d).toFixed(1).replace(/\.0$/, '') : fmt(Math.abs(d))
  return `<span class="delta ${good ? 'up' : 'down'}">${sym} ${mag}${unit} <small>vs 직전 28일</small></span>`
}
// 현재값과 변화율(%)로 직전 값 역산
const prevFromPct = (cur: number, pctChange: number): number | null =>
  pctChange <= -100 ? null : cur / (1 + pctChange / 100)

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
  if (dc !== null && Math.abs(dc) >= 0.5) {
    const prev = prevFromPct(num(g.clicks), dc)
    const span = prev !== null ? ` (${fmt(prev)}회 → ${fmt(num(g.clicks))}회)` : ''
    out.push(dc > 0
      ? `최근 28일 검색 클릭이 직전 기간보다 ${Math.abs(dc).toFixed(1).replace(/\.0$/, '')}% 늘었습니다${span}. 상승 흐름입니다.`
      : `최근 28일 검색 클릭이 직전 기간보다 ${Math.abs(dc).toFixed(1).replace(/\.0$/, '')}% 줄었습니다${span}. 콘텐츠 발행 주기를 점검해 보세요.`)
  } else if (num(g.clicks) > 0) {
    out.push(`최근 28일 검색 클릭은 ${fmt(num(g.clicks))}회로 직전 기간과 비슷한 수준입니다.`)
  }
  const tq = Array.isArray(g.topQueries) && g.topQueries.length ? rowOf(g.topQueries[0], ['query', 'name', 'key']) : null
  if (tq && tq.name) out.push(`가장 많이 유입된 검색어는 "${tq.name}"${tq.clicks ? ` (클릭 ${fmt(tq.clicks)}회)` : ''}입니다.`)
  const dp = deltaVal(g.delta, 'position')
  const pos = num(g.position)
  const prevPos = dp !== null && pos > 0 ? prevFromPct(pos, dp) : null
  if (prevPos !== null && Math.abs(pos - prevPos) >= 0.1) {
    out.push(pos < prevPos
      ? `평균 검색 순위가 ${prevPos.toFixed(1)}위에서 ${pos.toFixed(1)}위로 올랐습니다 (숫자가 낮을수록 상위 노출).`
      : `평균 검색 순위가 ${prevPos.toFixed(1)}위에서 ${pos.toFixed(1)}위로 내려갔습니다. 주요 키워드 경쟁 상황을 지켜보는 중입니다.`)
  }
  if (num(ai.sessions) > 0) {
    out.push(`ChatGPT·Perplexity 등 AI 검색에서 ${fmt(num(ai.sessions))}회 방문이 발생했습니다 (전체의 ${pct1(ai.share)}). AEO 세팅이 작동하고 있다는 신호입니다.`)
  }
  if (num(a.leads) > 0) out.push(`최근 28일 GA에 기록된 온라인 예약 완료(리드)는 ${fmt(num(a.leads))}건입니다.`)
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

// ── Clarity 행동 분석 (최근 3일) ──
const secFmt = (v: any): string => {
  const s = Math.round(num(v))
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}초`
}

const pct1 = (v: any): string => num(v).toFixed(1).replace(/\.0$/, '') + '%'

function clarityInsights(c: any): string[] {
  const out: string[] = []
  if (num(c.rageClickPct) >= 1 || num(c.deadClickPct) >= 5)
    out.push('화면 반응이 없어 반복 클릭하는 사용자가 있습니다 (UI 답답 신호)')
  if (num(c.avgScrollDepth) < 40 && num(c.sessions) >= 30)
    out.push('첫 화면에서 이탈이 많습니다')
  if (num(c.scriptErrors) > 0)
    out.push(`스크립트 오류 ${fmt(num(c.scriptErrors))}건 감지 — 점검 필요`)
  if (num(c.quickbackPct) >= 8)
    out.push('들어왔다 바로 나가는 비율이 높습니다 (기대 불일치)')
  if (out.length === 0 && num(c.sessions) > 0) out.push('특이 신호 없음')
  return out.slice(0, 3)
}

function claritySection(c: any): string {
  const head = `<div class="clarity-head">
    <h2>행동 분석 (Clarity · 최근 3일)</h2>
    <a class="clarity-link" href="${CLARITY_URL}" target="_blank" rel="noopener noreferrer">Clarity 대시보드 ↗</a>
  </div>`
  if (!c) {
    return `<section class="clarity">${head}
    <div class="card"><div class="empty">Clarity 행동 데이터 수집 대기 중입니다. 방문 기록이 쌓이면 스크롤·클릭 행동 분석이 자동 표시됩니다.</div></div>
  </section>`
  }
  const warn = (bad: boolean, s: string) => `<span class="delta ${bad ? 'down' : 'flat'}">${s}</span>`
  const cards = `
  <div class="grid metrics">
    <div class="card metric"><span class="m-label">세션 <small>3일</small></span><strong>${fmt(num(c.sessions))}</strong><span class="delta flat">봇 세션 ${fmt(num(c.botSessions))}건</span></div>
    <div class="card metric"><span class="m-label">사용자</span><strong>${fmt(num(c.users))}</strong><span class="delta flat">세션당 ${num(c.pagesPerSession).toFixed(1)}페이지</span></div>
    <div class="card metric"><span class="m-label">평균 스크롤 깊이</span><strong>${pct1(c.avgScrollDepth)}</strong></div>
    <div class="card metric"><span class="m-label">평균 참여시간</span><strong>${secFmt(c.engagementSec)}</strong><span class="delta flat">활성 ${secFmt(c.activeSec)}</span></div>
    <div class="card metric"><span class="m-label">레이지 클릭 <small>반복 클릭</small></span><strong>${fmt(num(c.rageClicks))}건</strong>${warn(num(c.rageClickPct) >= 1, `세션의 ${pct1(c.rageClickPct)}`)}</div>
    <div class="card metric"><span class="m-label">데드 클릭 <small>무반응 클릭</small></span><strong>${fmt(num(c.deadClicks))}건</strong>${warn(num(c.deadClickPct) >= 5, `세션의 ${pct1(c.deadClickPct)}`)}</div>
    <div class="card metric"><span class="m-label">퀵백 <small>즉시 이탈</small></span><strong>${fmt(num(c.quickbacks))}건</strong>${warn(num(c.quickbackPct) >= 8, `세션의 ${pct1(c.quickbackPct)}`)}</div>
    <div class="card metric"><span class="m-label">스크립트 오류</span><strong>${fmt(num(c.scriptErrors))}건</strong>${warn(num(c.scriptErrors) > 0, `세션의 ${pct1(c.scriptErrorPct)}`)}</div>
  </div>`
  const ins = clarityInsights(c)
  const insHtml = ins.length ? `<div class="card insights clarity-note"><ul>${ins.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>` : ''
  return `<section class="clarity">${head}${cards}${insHtml}</section>`
}

// ── 페이지 렌더 ──
export type LocalStats = { reservations: any[]; days: number }

// 경로별 예약 (자체 예약 기록 기준 · 기간 선택)
function localSourceSection(local?: LocalStats): string {
  if (!local) return ''
  const days = local.days
  const since = Date.now() - days * 86400000
  const items = local.reservations.filter((r) => num(r?.createdAt) >= since)
  const by: Record<string, { n: number; visited: number }> = {}
  for (const r of items) {
    const k = String(r?.source || '').trim() || '기록 없음'
    by[k] = by[k] || { n: 0, visited: 0 }
    by[k].n++
    if (r?.status === '내원') by[k].visited++
  }
  const rows = Object.entries(by).sort((a, b) => b[1].n - a[1].n)
  const tabs = [7, 28, 90].map((n) => `<a href="/admin/stats?days=${n}" class="rng${n === days ? ' on' : ''}">${n}일</a>`).join('')
  const body = rows.length
    ? `<table><thead><tr><th>유입 경로</th><th class="num">예약</th><th class="num">비중</th><th class="num">내원</th></tr></thead><tbody>${rows.map(([k, v]) =>
        `<tr><td class="txt">${esc(k)}</td><td class="num">${fmt(v.n)}</td><td class="num">${Math.round((v.n / items.length) * 100)}%</td><td class="num">${fmt(v.visited)}</td></tr>`).join('')}</tbody></table>`
    : `<div class="empty">최근 ${days}일 예약이 없습니다.</div>`
  return `<section class="card">
    <div class="sec-head"><h2>유입 경로별 예약 <small>실제 접수된 예약 · 최근 ${days}일 · ${fmt(items.length)}건</small></h2><div class="rngs">${tabs}</div></div>
    ${body}
    <p class="note"><strong>가장 정확한 예약 수</strong>입니다(예약 관리 목록과 같은 기록). 2026-11-04부터 예약 접수 때 처음 들어온 경로(네이버 검색·플레이스·블로그·인스타그램·광고 등)를 함께 기록합니다. 그 전에 들어온 예약은 '기록 없음'으로 표시됩니다. 내원 수는 예약 관리에서 상태를 '내원'으로 바꾼 건입니다.</p>
  </section>`
}

// GA 채널별 방문 (중앙 대시보드 · 28일)
function channelSection(d: any): string {
  const ch = Array.isArray(d?.channels) ? d.channels : []
  const fp = d?.firstParty || null
  if (!ch.length && !fp) return ''
  const total = ch.reduce((a: number, x: any) => a + num(x?.sessions), 0)
  const rows = ch.map((x: any) => `<tr><td class="txt">${esc(x.channel)}</td><td class="num">${fmt(num(x.sessions))}</td><td class="num">${fmt(num(x.users))}</td><td class="num">${total ? Math.round((num(x.sessions) / total) * 100) : 0}%</td></tr>`).join('')
  const fpHtml = fp ? `<div class="mini-grid">
      <div><b>${fmt(num(fp.booking))}</b><span>예약 버튼 클릭</span></div>
      <div><b>${fmt(num(fp.tel))}</b><span>전화 버튼 클릭</span></div>
      <div><b>${fmt(num(fp.formStart))}</b><span>예약 양식 작성 시작</span></div>
      <div><b>${fmt(num(fp.formSubmit))}</b><span>예약 양식 제출</span></div>
    </div><p class="note">버튼 클릭 수는 자체 수집 기준(${esc(fp.since || '')} ~ ${esc(fp.until || '')})입니다. '예약 양식 제출'은 <strong>보내기 버튼을 누른 횟수</strong>라, 동의 체크 누락·연락처 오류·휴진일 선택·중복 접수로 되돌아간 시도까지 함께 셉니다. 그래서 실제 예약 수(위 '유입 경로별 예약')보다 많게 나옵니다.</p>` : ''
  return `<section class="card">
    <h2>어디서 들어왔나 <small>GA · 최근 28일 · 방문 기준</small></h2>
    ${rows ? `<table><thead><tr><th>채널</th><th class="num">세션</th><th class="num">사용자</th><th class="num">비중</th></tr></thead><tbody>${rows}</tbody></table>` : ''}
    ${fpHtml}
  </section>`
}

// 네이버 (플레이스 순위·검색 트렌드)
function naverSection(d: any): string {
  const nv = d?.naver
  if (!nv) return ''
  const cur = Array.isArray(nv?.place?.current) ? nv.place.current : []
  const trends = Array.isArray(nv?.trends) ? nv.trends : []
  if (!cur.length && !trends.length) return ''
  const place = cur.length ? `<table><thead><tr><th>키워드</th><th class="num">플레이스 순위</th></tr></thead><tbody>${cur.map((x: any) =>
    `<tr><td class="txt">${esc(x.keyword)}</td><td class="num">${x.rank ? fmt(num(x.rank)) + '위' : '순위 밖'}</td></tr>`).join('')}</tbody></table>` : ''
  const tr = trends.length ? `<table><thead><tr><th>검색어</th><th class="num">전월 대비</th></tr></thead><tbody>${trends.map((x: any) =>
    `<tr><td class="txt">${esc(x.keyword)}</td><td class="num">${typeof x.momPct === 'number' ? (x.momPct > 0 ? '▲ ' : x.momPct < 0 ? '▼ ' : '') + Math.abs(x.momPct).toFixed(1).replace(/\.0$/, '') + '%' : '—'}</td></tr>`).join('')}</tbody></table>` : ''
  return `<section class="tables">
    <div class="card"><h3>네이버 플레이스 순위 <small>${esc(nv?.place?.checkedAt || '')}</small></h3>${place || '<div class="empty">데이터 없음</div>'}</div>
    <div class="card"><h3>네이버 검색량 추이 <small>데이터랩</small></h3>${tr || '<div class="empty">데이터 없음</div>'}</div>
  </section>`
}

export function renderStatsPage(d: any, local?: LocalStats): string {
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
    <div class="card metric"><span class="m-label">온라인 예약 완료 <small>GA 리드 · 28일</small></span><strong>${V(!!hasGa, fmt(num(a.leads)))}</strong><span class="delta flat">${LEADS_SINCE}부터 집계</span></div>
    <div class="card metric"><span class="m-label">AI 유입 세션 <small>ChatGPT 등</small></span><strong>${V(!!hasAi, fmt(num(ai.sessions)))}</strong>${hasAi && num(ai.sessions) > 0 ? `<span class="delta flat">전체의 ${pct1(ai.share)}</span>` : ''}</div>
  </div>
  <p class="note" style="margin:-8px 0 18px">예약 숫자가 세 군데 다르게 보이는 이유 — ① <b>온라인 예약 완료(GA 리드)</b>: 예약이 실제로 접수됐을 때 구글 애널리틱스로 보내는 신호(${LEADS_SINCE}부터, 광고 차단·추적 거부 브라우저는 빠짐) ② <b>예약 양식 제출</b>: 보내기 버튼을 누른 횟수(실패한 시도 포함) ③ <b>유입 경로별 예약</b>: 실제 접수된 예약 기록(가장 정확).</p>`

  // 노출순 정렬 (2026-11-04 원장 요청) — 받은 목록 안에서 노출 많은 순, 같으면 클릭순
  const queries = Array.isArray(g.topQueries)
    ? g.topQueries.map((x: any) => rowOf(x, ['query', 'name', 'key'])).sort((a: any, b: any) => b.impressions - a.impressions || b.clicks - a.clicks).slice(0, 10)
    : []
  const pages = Array.isArray(g.topPages) ? g.topPages.slice(0, 10).map((x: any) => rowOf(x, ['page', 'url', 'path', 'name', 'key'])) : []
  const aiRows = aiSourceRows(ai.bySource)
  const aiTotal = aiRows.reduce((s, r) => s + r[1], 0)

  const tbl = (rows: string, empty: string, head: string) =>
    rows ? `<table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>` : `<div class="empty">${empty}</div>`

  const queryRows = queries.map((r, i) =>
    `<tr><td class="rank">${i + 1}</td><td class="txt">${esc(r.name)}</td><td class="num">${fmt(r.clicks)}</td><td class="num">${fmt(r.impressions)}</td></tr>`).join('')
  const pageRows = pages.map((r, i) =>
    `<tr><td class="rank">${i + 1}</td><td class="txt">${esc(String(r.name).replace(/^https?:\/\/[^/]+/, '') || '/')}</td><td class="num">${fmt(r.clicks)}</td><td class="num">${fmt(r.impressions)}</td></tr>`).join('')
  const pageNote = pages.length === 1
    ? `<p class="note">구글 검색에서 클릭·노출이 기록된 페이지가 현재 홈 1개뿐입니다. 집계 오류가 아니라, 구글이 아직 다른 페이지를 검색 결과에 거의 보여 주지 않는다는 뜻입니다(서치콘솔 '페이지' 보고서와 같은 값).</p>`
    : ''
  const aiTableRows = aiTotal > 0 ? aiRows.map(([label, v]) =>
    `<tr><td class="txt">${label}</td><td class="num">${fmt(v)}</td><td class="num">${aiTotal ? Math.round((v / aiTotal) * 100) : 0}%</td></tr>`).join('') : ''

  const clicksDaily = dailyNums(g.dailyClicks, ['clicks', 'value', 'count'])
  const usersDaily = dailyNums(a.dailyUsers, ['users', 'value', 'count'])

  const insights = buildInsights(d)
  const clarity = (d && d.clarity) || null

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
/* Clarity 행동 분석 */
.clarity-head{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-bottom:14px}
.clarity-head h2{margin-bottom:0}
.clarity-link{margin-left:auto;font-size:.8rem;font-weight:700;color:var(--accent);text-decoration:none;border:1px solid var(--border);padding:6px 12px;border-radius:8px;background:var(--card)}
.clarity-link:hover{border-color:var(--accent)}
.clarity .grid.metrics{margin-bottom:12px}
h2 small,h3 small{font-size:.75rem;font-weight:600;color:var(--sub);margin-left:6px}
.note{font-size:.8rem;color:var(--sub);margin-top:10px;line-height:1.6}
.sec-head{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:12px}.sec-head h2{margin-bottom:0}
.rngs{margin-left:auto;display:flex;gap:6px}.rng{font-size:.8rem;font-weight:700;text-decoration:none;border:1px solid var(--border);border-radius:8px;padding:5px 12px;color:var(--sub);background:var(--card)}
.rng.on{background:var(--accent);border-color:var(--accent);color:#fff}
.mini-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px}.mini-grid div{border:1px solid var(--border);border-radius:10px;padding:12px}
.mini-grid b{display:block;font-size:1.25rem}.mini-grid span{font-size:.78rem;color:var(--sub)}
@media(max-width:860px){.mini-grid{grid-template-columns:repeat(2,1fr)}}
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

  ${localSourceSection(local)}

  ${channelSection(d)}

  ${naverSection(d)}

  ${claritySection(clarity)}

  <section class="tables">
    <div class="card"><h3>상위 검색어 <small>노출순</small></h3>${tbl(queryRows, '검색어 데이터가 쌓이는 중입니다', '<th></th><th>검색어</th><th class="num">클릭</th><th class="num">노출</th>')}</div>
    <div class="card"><h3>상위 페이지 TOP 10</h3>${tbl(pageRows, '페이지 데이터가 쌓이는 중입니다', '<th></th><th>페이지</th><th class="num">클릭</th><th class="num">노출</th>')}${pageNote}</div>
  </section>

  <section class="card">
    <h3>AI 검색 유입 (ChatGPT · Perplexity · Claude · Gemini)</h3>
    ${tbl(aiTableRows, 'AI 검색 유입이 아직 없습니다. AEO 세팅은 완료되어 있으며, AI 검색엔진이 사이트를 학습하면 여기에 표시됩니다.', '<th>소스</th><th class="num">세션</th><th class="num">비중</th>')}
  </section>
</div>
</body>
</html>`
}
