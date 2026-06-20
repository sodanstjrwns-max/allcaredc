import { Hono } from 'hono'
import { Bindings, getAdmin, setAdminSession, clearSession, secret } from '../lib/auth'
import { verifyToken } from '../lib/auth'
import { getCookie } from 'hono/cookie'
import { listCollection, saveCollection, addToCollection, updateInCollection, removeFromCollection, uid, r2PutBinary, getViews } from '../lib/store'
import {
  AdminLogin, AdminDashboard, AdminReservations, AdminMembers, AdminCases, AdminCaseForm,
  AdminColumns, AdminColumnForm, AdminNotices, AdminNoticeForm,
} from '../pages/admin'
import { SEED_COLUMNS, Column } from '../pages/column'
import { SEED_NOTICES, Notice } from '../pages/notice'
import { CaseItem } from '../pages/cases'

// /admin prefix로 마운트되므로 내부 경로는 prefix 제외
export const admin = new Hono<{ Bindings: Bindings }>()

function ADMIN_PW(env: Bindings) { return env.ADMIN_PASSWORD || 'allcare2026' }

// 인증 미들웨어 (로그인 페이지 제외) — admin 라우터 내부에서만 작동
admin.use('*', async (c, next) => {
  const path = c.req.path
  if (path === '/admin/login' || path === '/admin/logout') return next()
  if (!(await getAdmin(c))) return c.redirect('/admin/login')
  return next()
})

// ── 로그인 ──
admin.get('/login', async (c) => {
  if (await getAdmin(c)) return c.redirect('/admin')
  return c.html(AdminLogin().toString())
})
admin.post('/login', async (c) => {
  const form = await c.req.parseBody()
  if (String(form.password) === ADMIN_PW(c.env)) {
    await setAdminSession(c)
    return c.redirect('/admin')
  }
  return c.html(AdminLogin('비밀번호가 올바르지 않습니다.').toString())
})
admin.post('/logout', (c) => { clearSession(c, 'admin_session'); return c.redirect('/admin/login') })

// ── 대시보드 ──
admin.get('/', async (c) => {
  const reservations = await listCollection<any>(c.env, 'reservations')
  const cases = await listCollection<any>(c.env, 'cases')
  const columns = await listCollection<any>(c.env, 'columns')
  const members = await listCollection<any>(c.env, 'users')
  const notices = await listCollection<any>(c.env, 'notices')
  return c.html(AdminDashboard({
    reservations: reservations.length,
    newReservations: reservations.filter(r => r.status === '신규').length,
    cases: cases.length, columns: columns.length, members: members.length, notices: notices.length,
  }).toString())
})

// ── 예약 ──
admin.get('/reservations', async (c) => {
  const items = await listCollection<any>(c.env, 'reservations')
  return c.html(AdminReservations(items).toString())
})
admin.post('/reservations/:id/status', async (c) => {
  const form = await c.req.parseBody()
  await updateInCollection(c.env, 'reservations', c.req.param('id'), { status: String(form.status) })
  return c.redirect('/admin/reservations')
})

// ── 회원 ──
admin.get('/members', async (c) => {
  const users = await listCollection<any>(c.env, 'users')
  return c.html(AdminMembers(users).toString())
})

// 조회수 맵 헬퍼
async function viewsMap(env: Bindings, type: string, items: { id: string }[]): Promise<Record<string, number>> {
  const entries = await Promise.all(items.map(async i => [i.id, await getViews(env, type, i.id)] as const))
  return Object.fromEntries(entries)
}

// ── 에디터 이미지 업로드 (다중 파일 → R2) ──
admin.post('/upload-image', async (c) => {
  const form = await c.req.parseBody({ all: true })
  let files = form['files'] as unknown as File | File[]
  if (!files) return c.json({ error: 'no files' }, 400)
  if (!Array.isArray(files)) files = [files]
  const urls: string[] = []
  for (const file of files) {
    if (!file || typeof file !== 'object' || !(file as any).size) continue
    const ext = (((file as any).name || '').split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const key = `uploads/columns/${uid('img_')}.${ext}`
    await r2PutBinary(c.env, key, await (file as any).arrayBuffer(), (file as any).type || 'image/jpeg')
    urls.push(`/${key}`)
  }
  return c.json({ urls })
})

// ── 비포애프터 ──
admin.get('/cases', async (c) => {
  const items = await listCollection<CaseItem>(c.env, 'cases')
  return c.html(AdminCases(items, await viewsMap(c.env, 'case', items)).toString())
})
admin.get('/cases/new', (c) => c.html(AdminCaseForm().toString()))
admin.post('/cases/new', async (c) => {
  const form = await c.req.parseBody()
  const id = uid('case_')
  const item: any = {
    id, title: String(form.title || ''), description: String(form.description || ''),
    ageGroup: String(form.ageGroup || ''), gender: String(form.gender || ''),
    category: String(form.category || ''), region: String(form.region || ''),
    doctor: String(form.doctor || ''), period: String(form.period || ''),
    createdAt: Date.now(),
  }
  // 이미지 업로드 → R2
  for (const field of ['panoBefore', 'panoAfter', 'intraBefore', 'intraAfter']) {
    const file = form[field] as unknown as File
    if (file && typeof file === 'object' && (file as any).size > 0) {
      const ext = ((file as any).name || '').split('.').pop() || 'jpg'
      const key = `cases/${id}/${field}.${ext}`
      await r2PutBinary(c.env, key, await (file as any).arrayBuffer(), (file as any).type || 'image/jpeg')
      item[field] = key
    }
  }
  await addToCollection(c.env, 'cases', item)
  return c.redirect('/admin/cases')
})
admin.post('/cases/:id/delete', async (c) => {
  await removeFromCollection(c.env, 'cases', c.req.param('id'))
  return c.redirect('/admin/cases')
})

// ── 칼럼 ──
admin.get('/columns', async (c) => {
  const items = await listCollection<Column>(c.env, 'columns')
  return c.html(AdminColumns(items, await viewsMap(c.env, 'column', items)).toString())
})
admin.get('/columns/new', (c) => c.html(AdminColumnForm().toString()))
admin.post('/columns/new', async (c) => {
  const form = await c.req.parseBody()
  const title = String(form.title || '')
  const slug = String(form.slug || '').trim() || slugify(title)
  const now = Date.now()
  await addToCollection<Column>(c.env, 'columns', {
    id: uid('col_'), slug, title,
    excerpt: String(form.excerpt || ''), body: String(form.body || ''),
    author: String(form.author || ''), category: String(form.category || ''),
    thumbnail: String(form.thumbnail || '') || undefined,
    published: !!form.published, createdAt: now, updatedAt: now,
  })
  return c.redirect('/admin/columns')
})
admin.get('/columns/:id/edit', async (c) => {
  const items = await listCollection<Column>(c.env, 'columns')
  const col = items.find(x => x.id === c.req.param('id'))
  if (!col) return c.notFound()
  return c.html(AdminColumnForm(col).toString())
})
admin.post('/columns/:id/edit', async (c) => {
  const form = await c.req.parseBody()
  const title = String(form.title || '')
  await updateInCollection<Column>(c.env, 'columns', c.req.param('id'), {
    title, slug: String(form.slug || '').trim() || slugify(title),
    excerpt: String(form.excerpt || ''), body: String(form.body || ''),
    author: String(form.author || ''), category: String(form.category || ''),
    thumbnail: String(form.thumbnail || '') || undefined,
    published: !!form.published, updatedAt: Date.now(),
  })
  return c.redirect('/admin/columns')
})
admin.post('/columns/:id/delete', async (c) => {
  await removeFromCollection(c.env, 'columns', c.req.param('id'))
  return c.redirect('/admin/columns')
})

// ── 공지 ──
admin.get('/notices', async (c) => {
  const items = await listCollection<Notice>(c.env, 'notices')
  return c.html(AdminNotices(items, await viewsMap(c.env, 'notice', items)).toString())
})
admin.get('/notices/new', (c) => c.html(AdminNoticeForm().toString()))
admin.post('/notices/new', async (c) => {
  const form = await c.req.parseBody()
  let image = String(form.image || '') || undefined
  // 파일 업로드 우선 — R2에 저장
  const file = form['imageFile'] as unknown as File
  if (file && typeof file === 'object' && (file as any).size > 0) {
    const ext = (((file as any).name || '').split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const key = `uploads/columns/${uid('not_')}.${ext}`
    await r2PutBinary(c.env, key, await (file as any).arrayBuffer(), (file as any).type || 'image/jpeg')
    image = `/${key}`
  }
  await addToCollection<Notice>(c.env, 'notices', {
    id: uid('not_'), title: String(form.title || ''), body: String(form.body || ''),
    image, pinned: !!form.pinned, createdAt: Date.now(),
    popup: !!form.popup, popupUntil: String(form.popupUntil || '').trim() || undefined,
  })
  return c.redirect('/admin/notices')
})
admin.get('/notices/:id/edit', async (c) => {
  const items = await listCollection<Notice>(c.env, 'notices')
  const n = items.find(x => x.id === c.req.param('id'))
  if (!n) return c.notFound()
  return c.html(AdminNoticeForm(n).toString())
})
admin.post('/notices/:id/edit', async (c) => {
  const form = await c.req.parseBody()
  const patch: Partial<Notice> = {
    title: String(form.title || ''), body: String(form.body || ''),
    pinned: !!form.pinned,
    popup: !!form.popup, popupUntil: String(form.popupUntil || '').trim() || undefined,
  }
  // 새 파일 업로드 시에만 이미지 교체, 없으면 URL 입력값 반영
  const file = form['imageFile'] as unknown as File
  if (file && typeof file === 'object' && (file as any).size > 0) {
    const ext = (((file as any).name || '').split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const key = `uploads/columns/${uid('not_')}.${ext}`
    await r2PutBinary(c.env, key, await (file as any).arrayBuffer(), (file as any).type || 'image/jpeg')
    patch.image = `/${key}`
  } else if (form.image !== undefined) {
    patch.image = String(form.image || '') || undefined
  }
  await updateInCollection<Notice>(c.env, 'notices', c.req.param('id'), patch)
  return c.redirect('/admin/notices')
})
admin.post('/notices/:id/delete', async (c) => {
  await removeFromCollection(c.env, 'notices', c.req.param('id'))
  return c.redirect('/admin/notices')
})

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^\w가-힣]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'post-' + Date.now().toString(36)
}

// ── 시드 데이터 초기화 (최초 1회) ──
export async function ensureSeed(env: Bindings) {
  const cols = await listCollection<Column>(env, 'columns')
  if (cols.length === 0) await saveCollection(env, 'columns', SEED_COLUMNS)
  const nots = await listCollection<Notice>(env, 'notices')
  if (nots.length === 0) await saveCollection(env, 'notices', SEED_NOTICES)
}
