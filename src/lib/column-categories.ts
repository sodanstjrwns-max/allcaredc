// ============================================================
// 원장칼럼 카테고리 — 원장 편집 가능(R2 저장) + 하드코딩 기본값 폴백
//   저장본이 없거나 읽기 실패 시 COLUMN_CATEGORIES(기본값) 반환.
//   최초 저장 시 기본값을 시드로 삼아 통째로 저장한다.
//   (2026-09-23 권민수 원장 요청: English 카테고리 신설 + 관리자 직접 관리)
// ============================================================
import type { Bindings } from './auth'
import { r2Get, r2Put } from './store'
import { COLUMN_CATEGORIES, type ColumnCategory } from '../data/clinic'

const KEY = 'data/column-categories.json'

export const CATEGORY_SLUG_RE = /^[a-z0-9-]{2,30}$/

export function defaultCategories(): ColumnCategory[] {
  return COLUMN_CATEGORIES.map((c, i) => ({ slug: c.slug, name: c.name, sort: i }))
}

function normalize(list: ColumnCategory[]): ColumnCategory[] {
  return list
    .filter(c => c && typeof c.slug === 'string' && typeof c.name === 'string' && c.slug && c.name)
    .map((c, i) => ({ slug: c.slug, name: c.name, sort: typeof c.sort === 'number' ? c.sort : i }))
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((c, i) => ({ ...c, sort: i }))
}

// 저장된 목록을 로드. 없거나 실패하면 기본값.
export async function getColumnCategories(env: Bindings): Promise<ColumnCategory[]> {
  try {
    const stored = await r2Get<ColumnCategory[]>(env, KEY)
    if (Array.isArray(stored) && stored.length) return normalize(stored)
  } catch {}
  return defaultCategories()
}

export async function saveColumnCategories(env: Bindings, list: ColumnCategory[]): Promise<ColumnCategory[]> {
  const clean = normalize(list)
  await r2Put(env, KEY, clean)
  return clean
}

// ── 이름 → slug 자동 생성 (ASCII 우선, 한글은 국어의 로마자 표기법 근사) ──
const CHO = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h']
const JUNG = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i']
const JONG = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'l', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't']

export function romanize(s: string): string {
  let out = ''
  for (const ch of s) {
    const code = ch.charCodeAt(0)
    if (code >= 0xac00 && code <= 0xd7a3) {
      const n = code - 0xac00
      const cho = Math.floor(n / 588), jung = Math.floor((n % 588) / 28), jong = n % 28
      out += CHO[cho] + JUNG[jung] + JONG[jong]
    } else out += ch
  }
  return out
}

export function slugifyCategory(name: string): string {
  const base = romanize(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30)
  const s = base.replace(/-+$/g, '')
  return s.length >= 2 ? s : ''
}
