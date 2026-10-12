// ============================================================
// 업로드 이미지 주소 버전 — /uploads/columns/* 는 1년 immutable 캐시라
// 같은 키의 파일을 재압축·교체하면 브라우저·엣지에 옛 파일이 남는다.
// 화면에 내보낼 때 ?v= 를 붙여 새 파일을 받게 한다 (데이터 저장값은 그대로).
// 2026-10-12: 칼럼 썸네일·본문 PNG(1~1.5MB) → JPEG 재압축 교체
// ============================================================
export const UPLOAD_IMG_V = '20261012'

export function uploadImgUrl(url?: string): string {
  const u = String(url || '')
  if (!u.startsWith('/uploads/columns/') || u.includes('?')) return u
  return `${u}?v=${UPLOAD_IMG_V}`
}

/** 본문 HTML 안의 <img src="/uploads/columns/..."> 에 버전 부여 */
export function versionUploadImgs(html: string): string {
  return String(html || '').replace(/(<img\b[^>]*\ssrc=)(["'])(\/uploads\/columns\/[^"'?]+)\2/gi, (_m, pre, q, src) => `${pre}${q}${uploadImgUrl(src)}${q}`)
}
