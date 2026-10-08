// =====================================================================
// "약수역 치과" 대표 키워드 → 홈(/)으로 모으는 내부 링크 (2026-10-08)
// - 올케어는 별도 지역 허브 없이 홈이 '약수역 치과' 대표 페이지(네이버 1위). 앵커는 항상 정확히 "약수역 치과", nofollow 없음
// - 한 페이지에 '약수역 치과' 앵커 홈 링크 최대 2개(푸터 1 + 본문 1). 홈 자신에는 넣지 않는다.
// - 칼럼 상세 끝 안내 문장은 4가지 문형 중 slug 해시로 고정 선택(글마다 같은 문장 반복 방지)
// - 사실 정보는 clinic.ts 값만: 3·6호선 약수역 5번 출구 도보 1분, 월·화·목 20:30 야간진료, 건물 뒤편 무료 주차장
// =====================================================================

export const HUB_PATH = '/'
export const HUB_ANCHOR = '약수역 치과'

/** 푸터에 '약수역 치과' 홈 링크를 넣을지 — 홈 자신은 제외 */
export function footerHubLink(path: string): boolean {
  return path !== HUB_PATH && path !== ''
}

function hashSeed(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h
}

/** 칼럼 상세 본문 끝(작성자 박스 위) 지역 안내 한 문장(HTML 문자열). seed = 글 slug */
export function columnHubNote(seed: string, topic?: string): string {
  const a = `<a href="${HUB_PATH}" style="color:var(--brand);font-weight:700;text-decoration:underline;text-underline-offset:3px">${HUB_ANCHOR}</a>`
  const what = topic ? `${topic} 상담` : '진료 상담'
  const forms = [
    `365올케어치과는 ${a}를 찾는 약수동·신당동 주민분들께 ${what} 일정과 진료시간을 안내합니다.`,
    `${a}를 찾으신다면 3·6호선 약수역 5번 출구에서 걸어서 1분 거리인 365올케어치과의 위치를 먼저 확인해 보세요.`,
    `퇴근 뒤에 ${a}를 알아보시는 분들을 위해 365올케어치과는 월·화·목요일 저녁 8시 30분까지 진료합니다.`,
    `중구 약수·신당동 일대에서 ${a}를 찾는 분들께 365올케어치과의 의료진과 진료 과목, 주차 안내를 한곳에 정리해 두었습니다.`,
  ]
  return `<p class="col-hub-note" style="margin-top:36px;padding:16px 20px;border-left:4px solid var(--brand-accent);background:var(--beige-soft);border-radius:0 var(--radius) var(--radius) 0;font-size:15px;line-height:1.8;color:var(--gray-600)">${forms[hashSeed(seed) % forms.length]}</p>`
}
