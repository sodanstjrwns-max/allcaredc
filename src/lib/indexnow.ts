// ════════════════════════════════════════════════════════════
//  자동 색인 (IndexNow + Google sitemap ping)
//  컬럼/케이스 발행·수정 시 검색엔진에 "방금 이 URL 생겼어요" 즉시 통보.
//  - IndexNow: Bing / Naver(예정) / Yandex / Seznam 즉시 색인 (무료, 키만 필요)
//  - Google: IndexNow 미지원 → sitemap 재크롤 유도 ping
//  실패해도 본 작업(글 저장)에는 절대 영향 주지 않음 (try/catch + 백그라운드).
// ════════════════════════════════════════════════════════════
import { CLINIC } from '../data/clinic'

const HOST = CLINIC.domain                    // allcaredc.kr
const BASE = `https://${HOST}`
// IndexNow 키 (빙 웹마스터에 등록되는 공개 키 — 노출돼도 안전, 키 파일 검증용)
export const INDEXNOW_KEY = 'ecef3cc8249575257cc2aeb5d280b4ca'
const KEY_LOCATION = `${BASE}/${INDEXNOW_KEY}.txt`

// IndexNow 엔드포인트 (하나만 보내도 참여 엔진끼리 공유되지만, 명시적으로 빙 사용)
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

/**
 * 주어진 URL들을 검색엔진에 즉시 색인 요청.
 * @param paths  '/column/foo' 같은 경로 또는 절대 URL 배열
 */
export async function pingIndexNow(paths: string[]): Promise<void> {
  const urlList = paths.map(p => (p.startsWith('http') ? p : `${BASE}${p}`))
  if (!urlList.length) return
  try {
    await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: KEY_LOCATION,
        urlList,
      }),
    })
  } catch (_) { /* 색인 핑 실패는 무시 — 본 작업 우선 */ }
}

/**
 * 구글에 sitemap 재크롤 요청 (구글은 IndexNow 미지원).
 * 공식 ping 엔드포인트가 2023년 deprecated 됐으나, 재요청 신호로 해는 없음.
 * 핵심은 sitemap의 lastmod가 갱신되어 다음 크롤 때 반영되는 것.
 */
export async function pingGoogleSitemap(): Promise<void> {
  try {
    await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(`${BASE}/sitemap.xml`)}`)
  } catch (_) { /* 무시 */ }
}

/**
 * 새 콘텐츠 발행 시 호출하는 통합 헬퍼.
 * 해당 URL + 목록 페이지 + sitemap을 한 번에 핑.
 * @param contentPath 새/수정된 콘텐츠 경로 (예: '/column/abc')
 * @param listPath    목록 페이지 (예: '/column', '/cases')
 */
export async function notifySearchEngines(contentPath: string, listPath: string): Promise<void> {
  const paths = [contentPath, listPath, '/', '/sitemap.xml'].filter(Boolean)
  await Promise.allSettled([
    pingIndexNow(paths),
    pingGoogleSitemap(),
  ])
}
