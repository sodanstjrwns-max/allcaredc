// ============================================================
// R2 기반 데이터 스토어 (JSON) + 메모리 fallback
// 회원/케이스/예약/칼럼/공지 등을 R2에 JSON으로 저장
// ============================================================
import type { Bindings } from './auth'

// 로컬/미바인딩 환경 대비 메모리 저장소
const mem = new Map<string, string>()

export async function r2Get<T = any>(env: Bindings, key: string): Promise<T | null> {
  if (env.R2) {
    const obj = await env.R2.get(key)
    if (!obj) return null
    try { return JSON.parse(await obj.text()) as T } catch { return null }
  }
  const v = mem.get(key)
  return v ? JSON.parse(v) as T : null
}

export async function r2Put(env: Bindings, key: string, value: any): Promise<void> {
  const body = JSON.stringify(value)
  if (env.R2) await env.R2.put(key, body, { httpMetadata: { contentType: 'application/json' } })
  else mem.set(key, body)
}

export async function r2PutBinary(env: Bindings, key: string, data: ArrayBuffer, contentType: string): Promise<void> {
  if (env.R2) await env.R2.put(key, data, { httpMetadata: { contentType } })
  else mem.set(key, '[[binary]]')
}

export async function r2GetBinary(env: Bindings, key: string): Promise<{ body: ReadableStream | ArrayBuffer; contentType: string } | null> {
  if (env.R2) {
    const obj = await env.R2.get(key)
    if (!obj) return null
    return { body: obj.body as any, contentType: obj.httpMetadata?.contentType || 'application/octet-stream' }
  }
  return null
}

export async function r2Delete(env: Bindings, key: string) {
  if (env.R2) await env.R2.delete(key)
  else mem.delete(key)
}

// 컬렉션 헬퍼 (인덱스 기반)
export async function listCollection<T = any>(env: Bindings, name: string): Promise<T[]> {
  const idx = await r2Get<T[]>(env, `data/${name}.json`)
  return idx || []
}
export async function saveCollection<T = any>(env: Bindings, name: string, items: T[]): Promise<void> {
  await r2Put(env, `data/${name}.json`, items)
}
export async function addToCollection<T extends { id: string }>(env: Bindings, name: string, item: T): Promise<void> {
  const items = await listCollection<T>(env, name)
  items.unshift(item)
  await saveCollection(env, name, items)
}
export async function updateInCollection<T extends { id: string }>(env: Bindings, name: string, id: string, patch: Partial<T>): Promise<T | null> {
  const items = await listCollection<T>(env, name)
  const i = items.findIndex(x => x.id === id)
  if (i < 0) return null
  items[i] = { ...items[i], ...patch }
  await saveCollection(env, name, items)
  return items[i]
}
export async function removeFromCollection(env: Bindings, name: string, id: string): Promise<void> {
  const items = await listCollection<any>(env, name)
  await saveCollection(env, name, items.filter(x => x.id !== id))
}

export function uid(prefix = ''): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// 조회수 (D1 또는 R2)
export async function trackView(env: Bindings, type: string, id: string, isBotReq: boolean) {
  const key = `views/${type}/${id}.json`
  const cur = await r2Get<{ total: number; human: number }>(env, key) || { total: 0, human: 0 }
  cur.total++
  if (!isBotReq) cur.human++
  await r2Put(env, key, cur)
  return cur
}
export async function getViews(env: Bindings, type: string, id: string): Promise<number> {
  const v = await r2Get<{ human: number }>(env, `views/${type}/${id}.json`)
  return v?.human || 0
}
