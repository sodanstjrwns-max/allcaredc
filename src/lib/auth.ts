// ============================================================
// Cloudflare 바인딩 타입 + 인증/세션 유틸 (Web Crypto)
// ============================================================
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { Context } from 'hono'

export type Bindings = {
  R2?: R2Bucket
  DB?: D1Database
  ADMIN_PASSWORD?: string
  ADMIN_SESSION_SECRET?: string
  RESEND_API_KEY?: string
  NOTIFICATION_EMAIL?: string
}

const enc = new TextEncoder()

// base64url
function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let str = ''
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i])
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function fromB64url(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

// HMAC 서명 토큰: payload(json) -> base64url(payload).base64url(sig)
export async function signToken(payload: object, secret: string): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(payload)))
  const key = await hmacKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body))
  return `${body}.${b64url(sig)}`
}

export async function verifyToken<T = any>(token: string, secret: string): Promise<T | null> {
  if (!token || token.indexOf('.') < 0) return null
  const [body, sig] = token.split('.')
  try {
    const key = await hmacKey(secret)
    const ok = await crypto.subtle.verify('HMAC', key, fromB64url(sig), enc.encode(body))
    if (!ok) return null
    const data = JSON.parse(new TextDecoder().decode(fromB64url(body)))
    if (data.exp && Date.now() > data.exp) return null
    return data as T
  } catch { return null }
}

// 비밀번호 해시 (PBKDF2)
export async function hashPassword(password: string, salt?: string): Promise<string> {
  const s = salt || b64url(crypto.getRandomValues(new Uint8Array(16)))
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(s), iterations: 100000, hash: 'SHA-256' }, key, 256)
  return `${s}:${b64url(bits)}`
}
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt] = stored.split(':')
  const h = await hashPassword(password, salt)
  return h === stored
}

const SECRET_FALLBACK = 'allcare-dev-secret-change-in-prod-2026'
export function secret(env: Bindings, kind: 'session' | 'admin' = 'session') {
  return env.ADMIN_SESSION_SECRET || SECRET_FALLBACK
}

// ── 세션 쿠키 ──
const MEMBER_DAYS = 30, ADMIN_HOURS = 24

export async function setMemberSession(c: Context, user: { email: string; name: string }) {
  const exp = Date.now() + MEMBER_DAYS * 86400000
  const token = await signToken({ ...user, role: 'member', exp }, secret(c.env))
  setCookie(c, 'session', token, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: MEMBER_DAYS * 86400 })
}
export async function setAdminSession(c: Context) {
  const exp = Date.now() + ADMIN_HOURS * 3600000
  const token = await signToken({ role: 'admin', exp }, secret(c.env))
  setCookie(c, 'admin_session', token, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: ADMIN_HOURS * 3600 })
}
export async function getMember(c: Context): Promise<{ email: string; name: string } | null> {
  const t = getCookie(c, 'session')
  if (!t) return null
  const data = await verifyToken(t, secret(c.env))
  return data && data.role === 'member' ? { email: data.email, name: data.name } : null
}
export async function getAdmin(c: Context): Promise<boolean> {
  const t = getCookie(c, 'admin_session')
  if (!t) return false
  const data = await verifyToken(t, secret(c.env))
  return !!(data && data.role === 'admin')
}
export function clearSession(c: Context, kind: 'session' | 'admin_session') {
  deleteCookie(c, kind, { path: '/' })
}

// ── 봇 판별 (조회수 실측용) ──
export function isBot(ua: string | undefined): boolean {
  if (!ua) return true
  return /bot|crawl|spider|slurp|bingpreview|gptbot|claudebot|perplexity|facebookexternalhit|whatsapp|telegram|headless|lighthouse|pingdom|monitor/i.test(ua)
}
