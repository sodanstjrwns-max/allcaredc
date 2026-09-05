import { Hono } from 'hono'
import { html, raw } from 'hono/html'
import { HomePage } from './pages/home'
import { TreatmentsIndex, TreatmentDetail } from './pages/treatments'
import { FaqPage } from './pages/faq'
import { DoctorsIndex, DoctorDetail } from './pages/doctors'
import { CasesPage, CaseItem } from './pages/cases'
import { LoginPage, RegisterPage, MyPage } from './pages/auth'
import { ReservationPage } from './pages/reservation'
import { EncyclopediaPage, EncyclopediaDetailPage } from './pages/encyclopedia'
import { ColumnIndex, ColumnDetail, Column } from './pages/column'
import { NoticeIndex, NoticeDetail, Notice, activePopupNotice } from './pages/notice'
import { EventIndex, EventDetail, EventItem } from './pages/event'
import { MissionPage, DirectionsPage, PricingPage } from './pages/static-pages'
import { SeoHealthPage } from './pages/seo-health'
import { Page } from './components/page'
import { Bindings, getMember, setMemberSession, clearSession, hashPassword, verifyPassword, isBot } from './lib/auth'
import { listCollection, addToCollection, uid, r2GetBinary, trackView, getViews } from './lib/store'
import { CLINIC } from './data/clinic'
import { admin, ensureSeed } from './routes/admin'
import { isValidStatsKey } from './routes/stats'
import { sitemap, robotsTxt, llmsTxt, rssFeed, AreaPage } from './routes/seo'
import { aiTxt, ogImageSvg, resolveOg } from './lib/seo-engine'
import { INDEXNOW_KEY } from './lib/indexnow'
import { HANDOVER_DOC_B64 } from './lib/handover-doc'

const app = new Hono<{ Bindings: Bindings }>()

// www → non-www 301 통합 (네이버 권장: canonical보다 301을 우선)
// 커스텀 도메인(allcaredc.kr)에서만 동작 — pages.dev/미리보기는 그대로 둠
app.use('*', async (c, next) => {
  const url = new URL(c.req.url)
  if (url.hostname === 'www.allcaredc.kr') {
    url.hostname = 'allcaredc.kr'
    return c.redirect(url.toString(), 301)
  }
  return next()
})

// 시드 초기화 미들웨어 (한 번만)
let seeded = false
app.use('*', async (c, next) => {
  if (!seeded) { try { await ensureSeed(c.env); seeded = true } catch {} }
  return next()
})

// ════════════════ 관리자 라우트 ════════════════
// 주소창에 /admin/ (끝 슬래시)를 입력해도 정상 동작하도록 정규화
app.get('/admin/', (c) => c.redirect('/admin'))
app.route('/admin', admin)

// ════════════════ SEO 파일 ════════════════
const TXT = 'text/plain; charset=utf-8'
const SEO_CACHE = 'public, max-age=3600'
app.get('/sitemap.xml', async (c) => c.body(await sitemap(c.env), 200, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': SEO_CACHE }))
app.get('/robots.txt', (c) => c.body(robotsTxt(), 200, { 'Content-Type': TXT, 'Cache-Control': 'public, max-age=86400' }))
// §S20⑧: RSS 피드 — 칼럼·공지 자동 갱신 (네이버 서치어드바이저 RSS 제출용)
app.get('/rss.xml', async (c) => c.body(await rssFeed(c.env), 200, { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': SEO_CACHE }))
app.get('/feed', (c) => c.redirect('/rss.xml', 301))
// IndexNow 키 검증 파일 (빙/네이버가 소유권 확인용으로 요청)
app.get(`/${INDEXNOW_KEY}.txt`, (c) => c.body(INDEXNOW_KEY, 200, { 'Content-Type': TXT, 'Cache-Control': 'public, max-age=86400' }))
// Claude Code(외부 작업)가 등록한 IndexNow 키 파일도 병행 서빙 — _routes.json이 루트 정적파일을 워커로 보내므로 명시 라우트 필요
app.get('/5ef0a873577149fb9640ac78183136ff.txt', (c) => c.body('5ef0a873577149fb9640ac78183136ff', 200, { 'Content-Type': TXT, 'Cache-Control': 'public, max-age=86400' }))
// 네이버 서치어드바이저 HTML 파일 소유확인 (메타태그 방식과 병행)
app.get('/naver22a12bf996862862e0b64978f42923d9.html', (c) =>
  c.body('naver-site-verification: naver22a12bf996862862e0b64978f42923d9.html', 200, { 'Content-Type': 'text/html; charset=utf-8' }))
app.get('/llms.txt', (c) => c.body(llmsTxt(), 200, { 'Content-Type': TXT, 'Cache-Control': SEO_CACHE }))
app.get('/llms-full.txt', (c) => c.body(llmsTxt(true), 200, { 'Content-Type': TXT, 'Cache-Control': SEO_CACHE }))
app.get('/ai.txt', (c) => c.body(aiTxt(), 200, { 'Content-Type': TXT, 'Cache-Control': 'public, max-age=86400' }))
// 납품 안내서 (비공개 — noindex, sitemap 미포함). 원장님 전달용.
app.get('/handover-allcare-2026.html', (c) => {
  const bin = atob(HANDOVER_DOC_B64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const htmlStr = new TextDecoder('utf-8').decode(bytes)
  return c.body(htmlStr, 200, { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'private, max-age=300' })
})

// 동적 OG 이미지 (edge SVG 생성) — /og/treatment/implant.svg, /og/enc/dental-implant.svg
app.get('/og/:type/:file', (c) => {
  const type = c.req.param('type')
  const slug = c.req.param('file').replace(/\.svg$/, '')
  const data = resolveOg(type, slug)
  if (!data) return c.notFound()
  const svg = ogImageSvg(data.theme, data.title, data.subtitle)
  return c.body(svg, 200, { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=86400' })
})

// SEO/AEO 슈퍼머신 자가진단 대시보드
app.get('/seo-health', (c) => c.html(SeoHealthPage().toString()))

// ════════════════ 공개 페이지 ════════════════
app.get('/', async (c) => {
  const notices = await listCollection<Notice>(c.env, 'notices')
  const pop = activePopupNotice(notices)
  return c.html(HomePage(pop ? { id: pop.id, title: pop.title, body: pop.body, image: pop.image } : null).toString())
})
app.get('/mission', (c) => c.html(MissionPage().toString()))
app.get('/directions', (c) => c.html(DirectionsPage().toString()))
app.get('/pricing', (c) => c.html(PricingPage().toString()))
app.get('/faq', (c) => c.html(FaqPage().toString()))
app.get('/reservation', (c) => c.html(ReservationPage().toString()))
app.get('/encyclopedia', (c) => c.html(EncyclopediaPage().toString()))
app.get('/encyclopedia/:slug', (c) => {
  const page = EncyclopediaDetailPage(c.req.param('slug'))
  return page ? c.html(page.toString()) : c.notFound()
})

// 진료
app.get('/treatments', (c) => c.html(TreatmentsIndex().toString()))
app.get('/treatments/:slug', async (c) => {
  // §S20④: 같은 분야 최신 칼럼 3개를 진료 페이지 하단에 노출
  const cols = await listCollection<Column>(c.env, 'columns')
  const page = TreatmentDetail(c.req.param('slug'), cols)
  return page ? c.html(page.toString()) : c.notFound()
})

// 의료진
const DOCTOR_SLUG_REDIRECTS: Record<string, string> = {
  'doctor-integrated': 'kwon-jongjin', // 통합치의학과 placeholder → 권종진 명예원장
  'doctor-prostho': 'bae-suhyeon',     // 보철과 placeholder → 배수현 보철과 원장
  'kwon-minsu': 'kwon-minsoo',         // 영문 표기 통일(Minsoo Kwon) → 구 URL 검색 색인 보호용 301
}
app.get('/doctors', (c) => c.html(DoctorsIndex().toString()))
app.get('/doctors/:slug', (c) => {
  const slug = c.req.param('slug')
  const moved = DOCTOR_SLUG_REDIRECTS[slug]
  if (moved) return c.redirect(`/doctors/${moved}`, 301)
  const page = DoctorDetail(slug)
  return page ? c.html(page.toString()) : c.notFound()
})

// 지역 SEO
app.get('/area/:combo', (c) => {
  const page = AreaPage(c.req.param('combo'))
  return page ? c.html(page.toString()) : c.notFound()
})

// ── 칼럼 ──
app.get('/column', async (c) => {
  const cols = await listCollection<Column>(c.env, 'columns')
  // §S20⑤: ?cat= 카테고리 필터 — 비포애프터/진료 페이지에서 역링크 진입
  return c.html(ColumnIndex(cols, c.req.query('cat')).toString())
})
app.get('/column/:slug', async (c) => {
  const cols = await listCollection<Column>(c.env, 'columns')
  const col = cols.find(x => x.slug === c.req.param('slug') && x.published)
  if (!col) return c.notFound()
  const bot = isBot(c.req.header('User-Agent'))
  const views = (await trackView(c.env, 'column', col.id, bot)).human
  // §S20②: 전체 칼럼 전달 → '함께 보면 좋은 글' 3카드
  return c.html(ColumnDetail(col, views, cols).toString())
})

// ── 공지 ──
app.get('/notice', async (c) => {
  const notices = await listCollection<Notice>(c.env, 'notices')
  return c.html(NoticeIndex(notices).toString())
})
app.get('/notice/:id', async (c) => {
  const notices = await listCollection<Notice>(c.env, 'notices')
  const n = notices.find(x => x.id === c.req.param('id'))
  if (!n) return c.notFound()
  await trackView(c.env, 'notice', n.id, isBot(c.req.header('User-Agent')))
  return c.html(NoticeDetail(n).toString())
})

// ── 이벤트 ──
app.get('/events', async (c) => {
  const events = await listCollection<EventItem>(c.env, 'events')
  return c.html(EventIndex(events).toString())
})
app.get('/events/:id', async (c) => {
  const events = await listCollection<EventItem>(c.env, 'events')
  const e = events.find(x => x.id === c.req.param('id'))
  if (!e) return c.notFound()
  await trackView(c.env, 'event', e.id, isBot(c.req.header('User-Agent')))
  return c.html(EventDetail(e).toString())
})

// ── 업로드 이미지 서빙 (칼럼 본문 삽입 이미지) ──
app.get('/uploads/columns/:file', async (c) => {
  const obj = await r2GetBinary(c.env, `uploads/columns/${c.req.param('file')}`)
  if (!obj) return c.notFound()
  return new Response(obj.body as any, { headers: { 'Content-Type': obj.contentType, 'Cache-Control': 'public, max-age=31536000, immutable' } })
})

// ── 비포애프터 ──
app.get('/cases', async (c) => {
  const member = await getMember(c)
  const cases = await listCollection<CaseItem>(c.env, 'cases')
  return c.html(CasesPage(cases, !!member, { cat: c.req.query('cat'), doctor: c.req.query('doctor') }).toString())
})
// 케이스 이미지 — After는 로그인 게이팅 (2차 보호)
app.get('/api/case-image/:id/:type', async (c) => {
  const { id, type } = c.req.param()
  const member = await getMember(c)
  if (type === 'after' && !member) return c.json({ error: 'login required' }, 403)
  const cases = await listCollection<CaseItem>(c.env, 'cases')
  const item = cases.find(x => x.id === id)
  if (!item) return c.notFound()
  const key = type === 'after' ? (item.panoAfter || item.intraAfter) : (item.panoBefore || item.intraBefore)
  if (!key) return c.notFound()
  if (type === 'before') await trackView(c.env, 'case', item.id, isBot(c.req.header('User-Agent')))
  const obj = await r2GetBinary(c.env, key)
  if (!obj) return c.notFound()
  return new Response(obj.body as any, { headers: { 'Content-Type': obj.contentType, 'Cache-Control': 'private, max-age=3600' } })
})

// ════════════════ 인증 ════════════════
app.get('/auth/login', (c) => c.html(LoginPage(c.req.query('next') || '/').toString()))
app.get('/auth/register', (c) => c.html(RegisterPage(c.req.query('next') || '/').toString()))
app.get('/auth/mypage', async (c) => {
  const m = await getMember(c)
  return m ? c.html(MyPage(m).toString()) : c.redirect('/auth/login?next=/auth/mypage')
})
app.post('/auth/register', async (c) => {
  const form = await c.req.parseBody()
  const name = String(form.name || '').trim()
  const email = String(form.email || '').trim().toLowerCase()
  const phone = String(form.phone || '').trim()
  const password = String(form.password || '')
  const next = String(form.next || '/')
  if (!form.agree_terms) return c.html(RegisterPage(next, '이용약관에 동의해 주세요.').toString())
  if (!form.agree_privacy) return c.html(RegisterPage(next, '개인정보 수집·이용에 동의해 주세요.').toString())
  if (!name || !email || !phone || password.length < 6) return c.html(RegisterPage(next, '입력 정보를 확인해 주세요.').toString())
  const users = await listCollection<any>(c.env, 'users')
  if (users.find(u => u.email === email)) return c.html(RegisterPage(next, '이미 가입된 이메일입니다.').toString())
  const pwHash = await hashPassword(password)
  await addToCollection(c.env, 'users', { id: uid('u_'), name, email, phone, pwHash, marketing: !!form.agree_marketing, provider: 'email', createdAt: Date.now() })
  await setMemberSession(c, { email, name })
  return c.redirect(next)
})
app.post('/auth/login', async (c) => {
  const form = await c.req.parseBody()
  const email = String(form.email || '').trim().toLowerCase()
  const password = String(form.password || '')
  const next = String(form.next || '/')
  const users = await listCollection<any>(c.env, 'users')
  const user = users.find(u => u.email === email)
  if (!user || !user.pwHash || !(await verifyPassword(password, user.pwHash))) {
    return c.html(LoginPage(next, '이메일 또는 비밀번호가 올바르지 않습니다.').toString())
  }
  await setMemberSession(c, { email: user.email, name: user.name })
  return c.redirect(next)
})
app.post('/auth/logout', (c) => { clearSession(c, 'session'); return c.redirect('/') })

// ════════════════ 예약 API ════════════════
app.post('/api/reservation', async (c) => {
  try {
    const data = await c.req.json<any>()
    // 허니팟(봇 차단): 숨김 필드 'website'가 채워져 있으면 봇 → 성공한 척하고 폐기
    if (data.website) return c.json({ ok: true })

    const name = String(data.name || '').trim()
    const phoneRaw = String(data.phone || '').trim()
    const treatment = String(data.treatment || '').trim()
    const phoneDigits = phoneRaw.replace(/[^0-9]/g, '')

    // ── 서버 측 검증 ──
    if (!name || !phoneRaw || !treatment) return c.json({ ok: false, error: '필수 항목을 입력해 주세요.' })
    if (name.length < 2 || name.length > 30) return c.json({ ok: false, error: '이름을 정확히 입력해 주세요.' })
    if (phoneDigits.length < 9 || phoneDigits.length > 11) return c.json({ ok: false, error: '연락처를 정확히 입력해 주세요. (예: 010-0000-0000)' })
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email))) return c.json({ ok: false, error: '이메일 형식이 올바르지 않습니다.' })
    if (String(data.message || '').length > 1000) return c.json({ ok: false, error: '문의 내용이 너무 깁니다.' })

    // 중복 제출 제한: 같은 연락처로 3분 이내 재접수 차단
    const recent = await listCollection<any>(c.env, 'reservations')
    const dup = recent.find(x => String(x.phone || '').replace(/[^0-9]/g, '') === phoneDigits && (Date.now() - (x.createdAt || 0)) < 3 * 60 * 1000)
    if (dup) return c.json({ ok: false, error: '방금 접수된 문의가 있습니다. 잠시 후 다시 시도해 주세요.' })

    const item = {
      id: uid('r_'),
      name,
      phone: phoneRaw,
      email: String(data.email || '').trim(),
      treatment,
      date: String(data.date || '').trim(),
      timeslot: String(data.timeslot || '').trim(),
      message: String(data.message || '').trim(),
      status: '신규',
      createdAt: Date.now(),
    }
    await addToCollection(c.env, 'reservations', item)
    if (c.env.RESEND_API_KEY && c.env.NOTIFICATION_EMAIL) c.executionCtx?.waitUntil(sendReservationEmail(c.env, item))
    return c.json({ ok: true })
  } catch { return c.json({ ok: false, error: '접수에 실패했습니다.' }) }
})

async function sendReservationEmail(env: Bindings, r: any) {
  try {
    const base = (env.SITE_URL || 'https://allcare-dental.pages.dev').replace(/\/$/, '')
    const adminUrl = `${base}/admin/reservations`
    const when = new Date(r.createdAt).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' })
    const phoneDigits = String(r.phone || '').replace(/[^0-9]/g, '')
    const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: '365올케어치과 <noreply@allcaredc.kr>', to: [env.NOTIFICATION_EMAIL],
        reply_to: r.email || undefined,
        subject: `[예약문의] ${r.name} · ${r.treatment}`,
        html: `
          <div style="font-family:-apple-system,'Malgun Gothic',sans-serif;max-width:560px;margin:0 auto;color:#062741">
            <div style="background:#062741;color:#fffeee;padding:18px 22px;border-radius:8px 8px 0 0">
              <div style="font-size:13px;letter-spacing:.08em;color:#b08d57">ALLCARE DENTAL · 새 예약문의</div>
              <div style="font-size:20px;font-weight:700;margin-top:4px">${esc(r.name)} 님의 예약 문의</div>
            </div>
            <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-top:none">
              <tr><td style="padding:11px 16px;background:#faf9f2;width:110px;color:#b08d57;font-weight:600">접수일시</td><td style="padding:11px 16px">${esc(when)}</td></tr>
              <tr><td style="padding:11px 16px;background:#faf9f2;color:#b08d57;font-weight:600">이름</td><td style="padding:11px 16px"><strong>${esc(r.name)}</strong></td></tr>
              <tr><td style="padding:11px 16px;background:#faf9f2;color:#b08d57;font-weight:600">연락처</td><td style="padding:11px 16px"><a href="tel:${phoneDigits}" style="color:#062741;font-weight:700">${esc(r.phone)}</a></td></tr>
              <tr><td style="padding:11px 16px;background:#faf9f2;color:#b08d57;font-weight:600">이메일</td><td style="padding:11px 16px">${esc(r.email) || '-'}</td></tr>
              <tr><td style="padding:11px 16px;background:#faf9f2;color:#b08d57;font-weight:600">진료</td><td style="padding:11px 16px">${esc(r.treatment)}</td></tr>
              <tr><td style="padding:11px 16px;background:#faf9f2;color:#b08d57;font-weight:600">희망일시</td><td style="padding:11px 16px">${esc(r.date) || '-'} ${esc(r.timeslot) || ''}</td></tr>
              <tr><td style="padding:11px 16px;background:#faf9f2;color:#b08d57;font-weight:600;vertical-align:top">문의내용</td><td style="padding:11px 16px;white-space:pre-wrap">${esc(r.message) || '-'}</td></tr>
            </table>
            <div style="text-align:center;padding:20px 0">
              <a href="${adminUrl}" style="display:inline-block;background:#b08d57;color:#fff;text-decoration:none;padding:13px 30px;border-radius:6px;font-weight:700;font-size:15px">→ 관리자 화면에서 처리하기</a>
            </div>
            <p style="text-align:center;font-size:12px;color:#999;margin:0 0 8px">처리 기록은 관리자 페이지에 남습니다 · <a href="${adminUrl}" style="color:#b08d57">${adminUrl}</a></p>
          </div>`,
      }),
    })
  } catch {}
}

// 약관/개인정보
app.get('/privacy', (c) => c.html(legalPage('개인정보 처리방침', PRIVACY, '/privacy').toString()))
app.get('/terms', (c) => c.html(legalPage('이용약관', TERMS, '/terms').toString()))

// ── 실예약 로컬 통계 (중앙 대시보드 수집용 — 건수만, 개인정보 없음) ──
// ?key=<사이트 토큰|마스터 키> 필수. 불일치 시 404.
app.get('/api/local-stats', async (c) => {
  if (!isValidStatsKey(c.req.query('key'))) return c.notFound()
  const now = Date.now()
  const P = 28 * 86400_000
  let items: any[] = []
  try { items = await listCollection<any>(c.env, 'reservations') } catch {}
  const cur = items.filter((x) => Number(x?.createdAt || 0) >= now - P).length
  const prev = items.filter((x) => {
    const t = Number(x?.createdAt || 0)
    return t >= now - 2 * P && t < now - P
  }).length
  return c.json({ supported: true, tables: [{ name: 'reservations', cur, prev }], total: { cur, prev } })
})

// ════════════════ 404 ════════════════
app.notFound((c) => {
  const links = [
    { url: '/treatments', label: '진료 안내', icon: 'tooth' },
    { url: '/cases', label: '진료사례', icon: 'images' },
    { url: '/reservation', label: '예약 문의', icon: 'calendar-check' },
    { url: '/directions', label: '오시는 길', icon: 'location-dot' },
  ]
  const body = html`
  <section class="err-page">
    <div class="err-inner">
      <div class="err-tooth" aria-hidden="true"><i class="fa-solid fa-tooth"></i></div>
      <div class="err-code">404</div>
      <h1 class="err-title">길을 잃으셨나요?</h1>
      <p class="err-desc">찾으시는 페이지가 이동되었거나 존재하지 않습니다.<br>아래에서 필요한 곳으로 바로 이동하실 수 있습니다.</p>
      <div class="err-actions">
        <a href="/" class="btn btn-primary"><i class="fa-solid fa-house"></i> 홈으로</a>
        <a href="tel:${CLINIC.phoneRaw}" class="btn btn-outline"><i class="fa-solid fa-phone"></i> ${CLINIC.phone}</a>
      </div>
      <div class="err-links">
        ${raw(links.map(l => `<a href="${l.url}"><i class="fa-solid fa-${l.icon}"></i> ${l.label}</a>`).join(''))}
      </div>
    </div>
  </section>`
  return c.html(Page({ title: '페이지를 찾을 수 없습니다 (404) | 365올케어치과', description: '요청하신 페이지를 찾을 수 없습니다. 365올케어치과 주요 메뉴로 이동하세요.', path: '/404' }, body).toString(), 404)
})

function legalPage(title: string, content: string, path: string) {
  const body = html`
  <section class="page-hero"><div class="container"><h1>${title}</h1></div></section>
  <section class="section"><div class="container" style="max-width:820px"><div class="prose" style="white-space:pre-line">${content}</div></div></section>`
  return Page({ title: `${title} | 365올케어치과`, description: title, path }, body)
}

const PRIVACY = `365올케어치과(이하 "병원")는 「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 소중히 보호합니다.

1. 수집하는 개인정보 항목
- 회원가입: 이름, 이메일, 전화번호
- 예약 문의: 이름, 연락처, 이메일(선택)
- 예약 문의 내용에 이용자가 자발적으로 증상·불편사항 등 건강 관련 정보를 기재하는 경우, 해당 정보(민감정보)는 별도의 동의를 받아 수집·이용합니다.

2. 개인정보의 수집·이용 목적
- 회원 관리, 진료사례 열람 권한 부여, 예약 상담 및 진료 안내

3. 민감정보(건강정보)의 처리
- 병원은 예약 상담 목적에 한하여 이용자가 직접 입력한 건강 관련 정보를 처리하며, 목적 달성 후에는 지체 없이 파기합니다.
- 민감정보 수집·이용에는 정보주체의 별도 동의를 받으며, 동의를 거부하실 수 있습니다(단, 상담 진행에 제한이 있을 수 있습니다).

4. 개인정보의 보유 및 이용기간
- 회원정보: 회원 탈퇴 시까지
- 예약 문의: 상담 완료 후 1년(관련 법령에 별도 보존 의무가 있는 경우 해당 기간)
- 보유기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다. 전자적 파일은 복구할 수 없는 방법으로 삭제하고, 종이 문서는 분쇄 또는 소각합니다.

5. 개인정보의 제3자 제공
- 병원은 이용자의 개인정보를 원칙적으로 외부에 제공하지 않으며, 법령에 근거하거나 이용자의 동의가 있는 경우에 한해 제공합니다.

6. 개인정보 처리의 위탁
- 병원은 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를 위탁하고 있습니다.
  · 웹사이트 호스팅·인프라: Cloudflare, Inc.
  · 예약 알림 메일 발송: Resend (Plus Five Five, Inc.)
- 위탁계약 시 개인정보가 안전하게 관리되도록 관련 사항을 규정하고 관리·감독합니다.

7. 이용자 및 법정대리인의 권리
- 이용자는 언제든지 본인의 개인정보 열람·정정·삭제·처리정지를 요청할 수 있으며, 병원은 지체 없이 조치합니다.

8. 개인정보 보호책임자
- 개인정보 보호책임자: 365올케어치과 관리책임자
- 연락처: ${CLINIC.phone} / ${CLINIC.email}
- 개인정보 관련 문의·불만·피해구제는 위 연락처로 접수하실 수 있습니다.

본 방침은 관련 법령 및 병원 내부 방침에 따라 변경될 수 있으며, 변경 시 웹사이트를 통해 공지합니다.

문의: ${CLINIC.phone}`

const TERMS = `제1조(목적)
본 약관은 365올케어치과 웹사이트가 제공하는 서비스의 이용 조건 및 절차에 관한 사항을 규정합니다.

제2조(서비스의 내용)
병원은 진료 안내, 예약 문의, 진료사례 및 칼럼 제공 등의 서비스를 제공합니다.

제3조(회원의 의무)
회원은 정확한 정보를 제공해야 하며, 타인의 정보를 도용해서는 안 됩니다.

제4조(면책)
본 사이트의 의료 정보는 일반적인 정보 제공을 목적으로 하며, 개별 진단·치료를 대신하지 않습니다.

문의: ${CLINIC.phone}`

export default app
