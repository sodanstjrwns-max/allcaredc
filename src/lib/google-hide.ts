// ============================================================
// 구글 전용 검색 제외 (2026-11-10)
//
// 배경: 구글이 이 사이트를 사이트 단위로 낮게 판정해 홈 한 장만 색인하고 있다
//   (직접 조치·기술 오류 없음. 백과·지역 조합을 대량 공개한 뒤 전체 탈락).
//   방문의 대부분은 네이버에서 오고 그 대부분이 백과 페이지로 들어온다.
//   → 대량 생성 구역을 "구글에만" 검색 제외해, 구글이 보는 사이트를 병원 핵심 페이지로 줄여 재평가를 받는다.
//
// 동작: 요청 User-Agent 가 구글 크롤러(Googlebot · Google-InspectionTool)이고
//   경로가 아래 대상 구역이며 응답이 200 HTML 일 때만
//   응답 헤더 `X-Robots-Tag: googlebot: noindex` 를 붙인다 (src/index.tsx 맨 바깥 미들웨어).
//   - 네이버(Yeti)·Bing·일반 브라우저·AI 봇 응답은 헤더·본문 모두 그대로다.
//   - HTML 메타 태그·robots.txt·sitemap·canonical·본문·스키마는 건드리지 않는다.
//   - 301·404 응답에는 붙이지 않는다.
//   - 칼럼 엣지 캐시(lib/edge-cache.ts)에는 들어가지 않는다(캐시 저장본은 따로 만든 Response, 헤더는 요청마다 바깥에서 붙임).
//
// 대상 구역 (가린다):
//   - /encyclopedia, /encyclopedia/*  : 치과 용어 백과 목록 + 상세 (encyclopedia.json 일괄 생성)
//   - /area/*                         : 지역 × 진료 조합 (SEO_AREAS × TREATMENTS 템플릿). 약수역 조합 포함
//     ※ 이 사이트의 '약수역 치과' 지역 허브는 홈(/)이라 따로 남길 지역 허브 페이지가 없다.
// 남긴다 (손대지 않는다):
//   홈, /treatments·상세, /doctors·상세, /pricing, /mission, /directions, /reservation, /faq,
//   /cases·상세, /casebook/, /column·상세(관리자가 올린 R2 글), /notice, /events, /schedule 등 나머지 전부.
//
// 되돌리는 방법: isGoogleHiddenPath 가 항상 false 를 돌려주게 하면 끝(아래 GOOGLE_HIDE_ENABLED = false).
// ============================================================

/** false 로 바꾸면 구글 전용 검색 제외가 전부 꺼진다 */
const GOOGLE_HIDE_ENABLED = true

/** 구글에만 가리는 경로 접두사 (정확히 일치하거나 그 아래 경로) */
const GOOGLE_HIDDEN_PREFIXES = ['/encyclopedia', '/area']

export const GOOGLE_HIDE_HEADER = 'googlebot: noindex'

/** 구글 검색 크롤러인가 — Googlebot(스마트폰·데스크톱·이미지 등), Google-InspectionTool.
 *  Google-Extended · GoogleOther · AdsBot · Mediapartners 는 대상이 아니다(문자열에 Googlebot 이 없다). */
export function isGoogleCrawler(ua: string | undefined | null): boolean {
  if (!ua) return false
  return /googlebot|google-inspectiontool/i.test(ua)
}

/** 구글에만 검색 제외할 경로인가 (pathname 기준, 쿼리 제외) */
export function isGoogleHiddenPath(pathname: string): boolean {
  if (!GOOGLE_HIDE_ENABLED) return false
  return GOOGLE_HIDDEN_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
}
