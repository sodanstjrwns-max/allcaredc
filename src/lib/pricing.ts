// ============================================================
// 비급여 수가표 — 원장 편집 가능(R2 저장) + 항목별 공개/비공개
// 저장된 표가 없거나 읽기 실패 시 하드코딩 시드(PRICE_TABLE)로 폴백
// (공개 페이지는 절대 비지 않는다)
// ============================================================
import type { Bindings } from './auth'
import { r2Get, r2Put } from './store'
import { PRICE_TABLE, type PriceGroup } from '../data/clinic'

const KEY = 'data/pricing.json'

// 하드코딩 시드를 published=true 로 정규화해 반환
export function seedTable(): PriceGroup[] {
  return PRICE_TABLE.map((g) => ({
    ...g,
    rows: g.rows.map((r) => ({ ...r, published: r.published !== false })),
  }))
}

// R2에 저장된 편집본을 로드. 없거나 실패하면 시드 반환.
export async function loadPriceTable(env: Bindings): Promise<PriceGroup[]> {
  try {
    const stored = await r2Get<PriceGroup[]>(env, KEY)
    if (Array.isArray(stored) && stored.length) return stored
  } catch {}
  return seedTable()
}

export async function savePriceTable(env: Bindings, table: PriceGroup[]): Promise<void> {
  await r2Put(env, KEY, table)
}

// 공개 페이지용: published !== false 인 행만 남기고, 비어버린 그룹은 제거
export function publicTable(table: PriceGroup[]): PriceGroup[] {
  return table
    .map((g) => ({ ...g, rows: g.rows.filter((r) => r.published !== false) }))
    .filter((g) => g.rows.length > 0)
}
