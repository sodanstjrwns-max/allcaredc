// ============================================================
// 공개 칼럼 페이지 엣지 캐시 (Cache API, 데이터센터 단위)
//   - /column 목록·/column/:slug 상세 HTML 을 5분간 엣지에 보관 → R2 읽기·렌더 생략
//   - 관리자 칼럼/카테고리 저장 시 해당 데이터센터 캐시 삭제(purgeColumnPages)
//   - 다른 데이터센터는 최대 5분 뒤 자연 갱신
//   - 쿠키·로그인과 무관한 페이지에만 사용
// 2026-10-12 권민수 원장 '칼럼 속도' 요청
// ============================================================
import type { Context } from 'hono'

export const EDGE_HTML_TTL = 300
const KEY_PREFIX = '/__edge/v1'

function cacheOf(): Cache | undefined {
  try { return (globalThis as any).caches?.default } catch { return undefined }
}

function later(c: Context, p: Promise<unknown>) {
  const safe = p.catch(() => {})
  try { c.executionCtx.waitUntil(safe) } catch {}
}

/** 호스트 + 경로 + 쿼리(정렬) 기준 캐시 키 */
export function edgeKey(origin: string, pathWithQuery: string): Request {
  const u = new URL(pathWithQuery, origin)
  u.searchParams.sort()
  return new Request(`${u.origin}${KEY_PREFIX}${u.pathname}${u.search}`, { method: 'GET' })
}

export type EdgeRendered = string | { html: string; tag?: string } | null

/** HTML 엣지 캐시. render() 가 null 이면 캐시하지 않고 404.
 *  tag: 캐시본에 함께 보관할 짧은 값(예: 칼럼 id) → 캐시 적중 때 onHit(tag) 로 전달(조회수 기록 등) */
export async function edgeHtml(c: Context, render: () => Promise<EdgeRendered>, onHit?: (tag: string) => Promise<unknown>): Promise<Response> {
  const cache = cacheOf()
  const url = new URL(c.req.url)
  const key = edgeKey(url.origin, url.pathname + url.search)
  if (cache) {
    const hit = await cache.match(key).catch(() => undefined)
    if (hit) {
      const tag = hit.headers.get('X-Edge-Tag') || ''
      if (onHit && tag) later(c, onHit(tag))
      const r = new Response(hit.body, hit)
      r.headers.delete('Cache-Control')
      r.headers.delete('X-Edge-Tag')
      r.headers.set('X-Edge-Cache', 'HIT')
      return r
    }
  }
  const out = await render()
  if (out === null) return c.notFound()
  const body = typeof out === 'string' ? out : out.html
  const tag = typeof out === 'string' ? '' : (out.tag || '')
  if (cache) {
    later(c, cache.put(key, new Response(body, { status: 200, headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': `public, max-age=${EDGE_HTML_TTL}`,
      ...(tag ? { 'X-Edge-Tag': tag } : {}),
    } })))
  }
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8', 'X-Edge-Cache': 'MISS' } })
}

/** 관리자 저장 후: 칼럼 목록(페이지·카테고리)·상세 캐시 삭제 (현재 데이터센터) */
export async function purgeColumnPages(slugs: string[], cats: string[], pages: number, origin: string): Promise<void> {
  const cache = cacheOf()
  if (!cache) return
  const paths = new Set<string>(['/column'])
  for (let p = 2; p <= Math.max(2, pages + 1); p++) paths.add(`/column?page=${p}`)
  for (const cat of cats) {
    paths.add(`/column?cat=${encodeURIComponent(cat)}`)
    for (let p = 2; p <= 3; p++) paths.add(`/column?cat=${encodeURIComponent(cat)}&page=${p}`)
  }
  for (const s of slugs) if (s) paths.add(`/column/${encodeURIComponent(s)}`)
  const origins = new Set([origin, 'https://allcaredc.kr'])
  await Promise.all([...origins].flatMap(o => [...paths].map(p => cache.delete(edgeKey(o, p)).catch(() => false))))
}
