import { Hono } from 'hono'
import { html } from 'hono/html'
import { HomePage } from './pages/home'
import { TreatmentsIndex, TreatmentDetail } from './pages/treatments'
import { FaqPage } from './pages/faq'
import { DoctorsIndex, DoctorDetail } from './pages/doctors'
import { CasesPage, CaseItem } from './pages/cases'
import { LoginPage, RegisterPage, MyPage } from './pages/auth'
import { ReservationPage } from './pages/reservation'
import { EncyclopediaPage, EncyclopediaDetailPage } from './pages/encyclopedia'
import { ColumnIndex, ColumnDetail, Column } from './pages/column'
import { NoticeIndex, NoticeDetail, Notice } from './pages/notice'
import { MissionPage, DirectionsPage, PricingPage } from './pages/static-pages'
import { Page } from './components/page'
import { Bindings, getMember, setMemberSession, clearSession, hashPassword, verifyPassword, isBot } from './lib/auth'
import { listCollection, addToCollection, uid, r2GetBinary, trackView, getViews } from './lib/store'
import { CLINIC } from './data/clinic'
import { admin, ensureSeed } from './routes/admin'
import { sitemap, robotsTxt, llmsTxt, AreaPage } from './routes/seo'

const app = new Hono<{ Bindings: Bindings }>()

// 시드 초기화 미들웨어 (한 번만)
let seeded = false
app.use('*', async (c, next) => {
  if (!seeded) { try { await ensureSeed(c.env); seeded = true } catch {} }
  return next()
})

// ════════════════ 관리자 라우트 ════════════════
app.route('/admin', admin)

// ════════════════ SEO 파일 ════════════════
app.get('/sitemap.xml', async (c) => c.body(await sitemap(c.env), 200, { 'Content-Type': 'application/xml' }))
app.get('/robots.txt', (c) => c.body(robotsTxt(), 200, { 'Content-Type': 'text/plain' }))
app.get('/llms.txt', (c) => c.body(llmsTxt(), 200, { 'Content-Type': 'text/plain' }))
app.get('/llms-full.txt', (c) => c.body(llmsTxt(true), 200, { 'Content-Type': 'text/plain' }))

// ════════════════ 공개 페이지 ════════════════
app.get('/', (c) => c.html(HomePage().toString()))
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
app.get('/treatments/:slug', (c) => {
  const page = TreatmentDetail(c.req.param('slug'))
  return page ? c.html(page.toString()) : c.notFound()
})

// 의료진
app.get('/doctors', (c) => c.html(DoctorsIndex().toString()))
app.get('/doctors/:slug', (c) => {
  const page = DoctorDetail(c.req.param('slug'))
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
  return c.html(ColumnIndex(cols).toString())
})
app.get('/column/:slug', async (c) => {
  const cols = await listCollection<Column>(c.env, 'columns')
  const col = cols.find(x => x.slug === c.req.param('slug') && x.published)
  if (!col) return c.notFound()
  const bot = isBot(c.req.header('User-Agent'))
  const views = (await trackView(c.env, 'column', col.id, bot)).human
  return c.html(ColumnDetail(col, views).toString())
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

// Google OAuth
app.get('/auth/google', (c) => {
  const next = c.req.query('next') || '/'
  const cid = c.env.GOOGLE_CLIENT_ID
  if (!cid) return c.html(LoginPage(next, 'Google 로그인은 현재 준비 중입니다. 이메일로 로그인해 주세요.').toString())
  const redirect = `https://${CLINIC.domain}/auth/google/callback`
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', cid)
  url.searchParams.set('redirect_uri', redirect)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email profile')
  url.searchParams.set('state', next)
  return c.redirect(url.toString())
})
app.get('/auth/google/callback', async (c) => {
  const code = c.req.query('code')
  const next = c.req.query('state') || '/'
  const { GOOGLE_CLIENT_ID: cid, GOOGLE_CLIENT_SECRET: csec } = c.env
  if (!code || !cid || !csec) return c.redirect('/auth/login')
  try {
    const redirect = `https://${CLINIC.domain}/auth/google/callback`
    const tokRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: cid, client_secret: csec, redirect_uri: redirect, grant_type: 'authorization_code' }),
    })
    const tok = await tokRes.json<any>()
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${tok.access_token}` } })
    const gu = await userRes.json<any>()
    const email = (gu.email || '').toLowerCase()
    const name = gu.name || email.split('@')[0]
    const users = await listCollection<any>(c.env, 'users')
    if (!users.find(u => u.email === email)) await addToCollection(c.env, 'users', { id: uid('u_'), name, email, provider: 'google', createdAt: Date.now() })
    await setMemberSession(c, { email, name })
    return c.redirect(next)
  } catch { return c.redirect('/auth/login') }
})

// ════════════════ 예약 API ════════════════
app.post('/api/reservation', async (c) => {
  try {
    const data = await c.req.json<any>()
    if (!data.name || !data.phone || !data.treatment) return c.json({ ok: false, error: '필수 항목을 입력해 주세요.' })
    const item = { id: uid('r_'), ...data, status: '신규', createdAt: Date.now() }
    delete (item as any).agree
    await addToCollection(c.env, 'reservations', item)
    if (c.env.RESEND_API_KEY && c.env.NOTIFICATION_EMAIL) c.executionCtx?.waitUntil(sendReservationEmail(c.env, item))
    return c.json({ ok: true })
  } catch { return c.json({ ok: false, error: '접수에 실패했습니다.' }) }
})

async function sendReservationEmail(env: Bindings, r: any) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: '올케어치과 <onboarding@resend.dev>', to: [env.NOTIFICATION_EMAIL],
        subject: `[예약문의] ${r.name} - ${r.treatment}`,
        html: `<h3>새 예약 문의</h3><ul><li>이름: ${r.name}</li><li>연락처: ${r.phone}</li><li>이메일: ${r.email || '-'}</li><li>진료: ${r.treatment}</li><li>희망: ${r.date || '-'} ${r.timeslot || ''}</li><li>내용: ${r.message || '-'}</li></ul>`,
      }),
    })
  } catch {}
}

// 약관/개인정보
app.get('/privacy', (c) => c.html(legalPage('개인정보 처리방침', PRIVACY).toString()))
app.get('/terms', (c) => c.html(legalPage('이용약관', TERMS).toString()))

// ════════════════ 404 ════════════════
app.notFound((c) => {
  const body = html`
  <section style="min-height:80vh;display:grid;place-items:center;text-align:center;padding:120px 24px">
    <div>
      <div style="font-size:6rem;font-weight:800;color:var(--brand-accent)">404</div>
      <h1 style="font-size:1.8rem;margin:10px 0 16px">페이지를 찾을 수 없습니다</h1>
      <p style="color:var(--gray-600);margin-bottom:30px">요청하신 페이지가 이동되었거나 존재하지 않습니다.</p>
      <a href="/" class="btn btn-primary">홈으로 돌아가기 <i class="fa-solid fa-arrow-right"></i></a>
    </div>
  </section>`
  return c.html(Page({ title: '404 | 올케어치과', description: '페이지를 찾을 수 없습니다.', path: '/404' }, body).toString(), 404)
})

function legalPage(title: string, content: string) {
  const body = html`
  <section class="page-hero"><div class="container"><h1>${title}</h1></div></section>
  <section class="section"><div class="container" style="max-width:820px"><div class="prose" style="white-space:pre-line">${content}</div></div></section>`
  return Page({ title: `${title} | 올케어치과`, description: title, path: '/legal' }, body)
}

const PRIVACY = `올케어치과(이하 "병원")는 이용자의 개인정보를 중요시하며, 관련 법령을 준수합니다.

1. 수집하는 개인정보 항목
- 회원가입: 이름, 이메일, 전화번호
- 예약 문의: 이름, 연락처, 이메일(선택)

2. 개인정보의 수집·이용 목적
- 회원 관리, 진료사례 열람 권한 부여, 예약 상담 및 안내

3. 개인정보의 보유 및 이용기간
- 회원 탈퇴 시 또는 수집·이용 목적 달성 시까지

4. 개인정보의 제3자 제공
- 병원은 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.

5. 이용자의 권리
- 이용자는 언제든지 본인의 개인정보 열람·정정·삭제를 요청할 수 있습니다.

문의: ${CLINIC.phone}`

const TERMS = `제1조(목적)
본 약관은 올케어치과 웹사이트가 제공하는 서비스의 이용 조건 및 절차에 관한 사항을 규정합니다.

제2조(서비스의 내용)
병원은 진료 안내, 예약 문의, 진료사례 및 칼럼 제공 등의 서비스를 제공합니다.

제3조(회원의 의무)
회원은 정확한 정보를 제공해야 하며, 타인의 정보를 도용해서는 안 됩니다.

제4조(면책)
본 사이트의 의료 정보는 일반적인 정보 제공을 목적으로 하며, 개별 진단·치료를 대신하지 않습니다.

문의: ${CLINIC.phone}`

export default app
