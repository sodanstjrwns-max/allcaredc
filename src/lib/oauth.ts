// ============================================================
// 간편 로그인 (2026-11-04 원장 요청) — 구글·카카오·네이버
//  키가 등록된 제공자만 로그인 화면에 버튼이 나온다 (Pages 시크릿).
//   GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
//   KAKAO_REST_KEY / KAKAO_CLIENT_SECRET(선택)
//   NAVER_CLIENT_ID / NAVER_CLIENT_SECRET
//  콜백 주소: https://allcaredc.kr/auth/oauth/<google|kakao|naver>/callback
// ============================================================
import type { Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { Bindings, signToken, verifyToken, secret, setMemberSession } from './auth'
import { listCollection, addToCollection, updateInCollection, uid } from './store'

export type Provider = 'google' | 'kakao' | 'naver'
export const PROVIDER_LABEL: Record<Provider, string> = { google: '구글', kakao: '카카오', naver: '네이버' }

export function enabledProviders(env: Bindings): Provider[] {
  const out: Provider[] = []
  if (env.KAKAO_REST_KEY) out.push('kakao')
  if (env.NAVER_CLIENT_ID && env.NAVER_CLIENT_SECRET) out.push('naver')
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) out.push('google')
  return out
}
const origin = (c: Context) => (c.env.SITE_URL || new URL(c.req.url).origin).replace(/\/$/, '')
const cb = (c: Context, p: Provider) => `${origin(c)}/auth/oauth/${p}/callback`
const safeNext = (n: any) => { const s = String(n || '/'); return s.startsWith('/') && !s.startsWith('//') ? s : '/' }

export async function oauthStart(c: Context, p: Provider) {
  const env = c.env as Bindings
  if (!enabledProviders(env).includes(p)) return c.redirect('/auth/login')
  const state = crypto.randomUUID()
  setCookie(c, 'oauth_state', await signToken({ state, p, next: safeNext(c.req.query('next')), exp: Date.now() + 600000 }, secret(env)),
    { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 600 })
  const q = new URLSearchParams({ response_type: 'code', redirect_uri: cb(c, p), state })
  if (p === 'google') { q.set('client_id', env.GOOGLE_CLIENT_ID!); q.set('scope', 'openid email profile'); q.set('prompt', 'select_account'); return c.redirect('https://accounts.google.com/o/oauth2/v2/auth?' + q) }
  if (p === 'kakao') { q.set('client_id', env.KAKAO_REST_KEY!); return c.redirect('https://kauth.kakao.com/oauth/authorize?' + q) }
  q.set('client_id', env.NAVER_CLIENT_ID!); return c.redirect('https://nid.naver.com/oauth2.0/authorize?' + q)
}

async function form(url: string, body: Record<string, string>) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' }, body: new URLSearchParams(body) })
  return r.json<any>()
}

export async function oauthCallback(c: Context, p: Provider): Promise<Response> {
  const env = c.env as Bindings
  const fail = (m: string) => c.redirect('/auth/login?err=' + encodeURIComponent(m))
  const st = await verifyToken<any>(getCookie(c, 'oauth_state') || '', secret(env))
  deleteCookie(c, 'oauth_state', { path: '/' })
  const code = c.req.query('code')
  if (!st || st.p !== p || st.state !== c.req.query('state') || !code) return fail('로그인 요청이 만료되었습니다. 다시 시도해 주세요.')
  try {
    let pid = '', email = '', name = '', phone = ''
    if (p === 'google') {
      const t = await form('https://oauth2.googleapis.com/token', { code, client_id: env.GOOGLE_CLIENT_ID!, client_secret: env.GOOGLE_CLIENT_SECRET!, redirect_uri: cb(c, p), grant_type: 'authorization_code' })
      const u = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${t.access_token}` } }).then(r => r.json<any>())
      pid = String(u.sub || ''); email = String(u.email || ''); name = String(u.name || '')
    } else if (p === 'kakao') {
      const body: Record<string, string> = { grant_type: 'authorization_code', client_id: env.KAKAO_REST_KEY!, redirect_uri: cb(c, p), code }
      if (env.KAKAO_CLIENT_SECRET) body.client_secret = env.KAKAO_CLIENT_SECRET
      const t = await form('https://kauth.kakao.com/oauth/token', body)
      const u = await fetch('https://kapi.kakao.com/v2/user/me', { headers: { Authorization: `Bearer ${t.access_token}` } }).then(r => r.json<any>())
      pid = String(u.id || ''); email = String(u.kakao_account?.email || ''); name = String(u.kakao_account?.profile?.nickname || u.properties?.nickname || u.kakao_account?.name || '')
      phone = String(u.kakao_account?.phone_number || '').replace(/^\+82\s?/, '0')
    } else {
      const t = await form('https://nid.naver.com/oauth2.0/token', { grant_type: 'authorization_code', client_id: env.NAVER_CLIENT_ID!, client_secret: env.NAVER_CLIENT_SECRET!, code, state: st.state })
      const u = await fetch('https://openapi.naver.com/v1/nid/me', { headers: { Authorization: `Bearer ${t.access_token}` } }).then(r => r.json<any>())
      const r = u.response || {}
      pid = String(r.id || ''); email = String(r.email || ''); name = String(r.name || r.nickname || ''); phone = String(r.mobile || '')
    }
    if (!pid) return fail(`${PROVIDER_LABEL[p]} 로그인에 실패했습니다. 다시 시도해 주세요.`)
    email = email.trim().toLowerCase()
    const users = await listCollection<any>(env, 'users')
    let user = users.find(u => u.provider === p && u.providerId === pid) || (email ? users.find(u => u.email === email) : undefined)
    if (!user) {
      user = { id: uid('u_'), name: name || `${PROVIDER_LABEL[p]} 회원`, email: email || `${p}:${pid}`, phone, provider: p, providerId: pid, marketing: false, createdAt: Date.now(), agreedAt: Date.now() }
      await addToCollection(env, 'users', user)
    } else if (!user.providerId && user.provider !== p) {
      await updateInCollection(env, 'users', user.id, { linked: Array.from(new Set([...(user.linked || []), p])) })
    }
    await setMemberSession(c, { email: user.email, name: user.name })
    return c.redirect(safeNext(st.next))
  } catch {
    return fail(`${PROVIDER_LABEL[p]} 로그인 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.`)
  }
}

export function socialButtons(providers: Provider[], next: string): string {
  if (!providers.length) return ''
  const style: Record<Provider, string> = {
    kakao: 'background:#FEE500;color:#191919;border:1px solid #FEE500',
    naver: 'background:#03C75A;color:#fff;border:1px solid #03C75A',
    google: 'background:#fff;color:#1f1f1f;border:1px solid #dadce0',
  }
  const icon: Record<Provider, string> = { kakao: '<i class="fa-solid fa-comment"></i>', naver: '<b style="font-family:Arial;font-size:15px">N</b>', google: '<i class="fa-brands fa-google"></i>' }
  return `<div style="display:grid;gap:10px;margin-bottom:18px">${providers.map(p =>
    `<a href="/auth/oauth/${p}?next=${encodeURIComponent(next)}" style="${style[p]};display:flex;align-items:center;justify-content:center;gap:10px;min-height:48px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none">${icon[p]} ${PROVIDER_LABEL[p]}로 계속하기</a>`).join('')}
    <p style="font-size:12px;color:var(--gray-600);text-align:center;line-height:1.6">간편 로그인으로 처음 가입하면 <a href="/terms" target="_blank" style="text-decoration:underline">이용약관</a>과 <a href="/privacy" target="_blank" style="text-decoration:underline">개인정보 수집·이용</a>(이름·이메일, 회원관리·진료사례 열람 목적, 탈퇴 시까지 보관)에 동의한 것으로 봅니다.</p>
    <div style="display:flex;align-items:center;gap:10px;color:var(--gray-400);font-size:12px;margin-top:4px"><span style="flex:1;height:1px;background:var(--gray-100)"></span>또는 이메일로<span style="flex:1;height:1px;background:var(--gray-100)"></span></div>
  </div>`
}
