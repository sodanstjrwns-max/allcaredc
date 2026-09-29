// ============================================================
// 콘텐츠 실제 수정일 (사이트맵 lastmod · llms.txt/ai.txt 최종 갱신)
// 값 = 해당 본문 줄을 마지막으로 바꾼 커밋 날짜(KST). scripts/content-dates.mjs 가 git blame 으로 산출해
// vite.config.ts 가 빌드 시 __CONTENT_DATES__ 로 주입한다. 얕은 클론·git 없음 → content-dates.fallback.json.
// ※ 예전엔 사이트맵이 날짜 없는 URL 에 new Date()(매일 오늘)를 찍었다 (2026-09-29 교정).
//   날짜를 알 수 없으면 lastmod 를 생략한다 — 오늘 날짜로 채우지 않는다.
// ============================================================
import FALLBACK from './content-dates.fallback.json'

export type ContentDates = {
  pages: Record<'home' | 'mission' | 'directions' | 'pricing' | 'faq' | 'reservation' | 'treatments' | 'doctors' | 'areaTemplate', string>
  treatments: Record<string, string>
  doctors: Record<string, string>
  areas: Record<string, string>
  encyclopedia: Record<string, string>
}

declare const __CONTENT_DATES__: ContentDates | null

export const CONTENT_DATES: ContentDates =
  (typeof __CONTENT_DATES__ !== 'undefined' && __CONTENT_DATES__ && __CONTENT_DATES__.pages ? __CONTENT_DATES__ : null) ||
  (FALLBACK as ContentDates)

const YMD = /^\d{4}-\d{2}-\d{2}$/

/** 날짜(문자열·epoch ms·Date) 목록 중 가장 최근 날짜 YYYY-MM-DD (KST). 유효한 값이 없으면 '' */
export function latestDate(...ds: unknown[]): string {
  return ds
    .flat()
    .map(toYmd)
    .filter((d) => YMD.test(d))
    .sort()
    .pop() || ''
}

/** 단일 값 → YYYY-MM-DD (KST). 없음·무효 → '' (오늘로 대체하지 않음) */
export function toYmd(v: unknown): string {
  if (v === undefined || v === null || v === '') return ''
  if (typeof v === 'string' && YMD.test(v)) return v
  const t = v instanceof Date ? v.getTime() : typeof v === 'number' ? v : Date.parse(String(v))
  if (!Number.isFinite(t) || t <= 0) return ''
  return new Date(t + 9 * 3600 * 1000).toISOString().slice(0, 10)
}

/** llms.txt·ai.txt '최종 갱신' = 문서에 담긴 콘텐츠(병원 정보·진료·의료진·소개, full 이면 지역·용어 포함)의 최신 수정일 */
export function contentUpdated(full = false): string {
  const P = CONTENT_DATES.pages
  return latestDate(
    P.directions, P.reservation, P.treatments, P.doctors, P.mission,
    Object.values(CONTENT_DATES.treatments), Object.values(CONTENT_DATES.doctors),
    full ? [Object.values(CONTENT_DATES.areas), P.areaTemplate, Object.values(CONTENT_DATES.encyclopedia)] : [],
  )
}
