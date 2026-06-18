// ============================================================
// 텍스트 줄임(말줄임) 유틸 — 한국어 어절 경계 존중
// ============================================================
// 글자수로 단순 slice 하면 어절 중간이 잘리거나 끝에 공백+… 가
// 어색하게 남는다. 이 헬퍼는:
//   1) 최대 길이 안에서 마지막 어절(띄어쓰기) 경계까지만 자르고
//   2) 끝의 공백·쉼표·가운뎃점 등 군더더기 문장부호를 정리한 뒤
//   3) 실제로 잘렸을 때만 말줄임표(…)를 붙인다.
export function truncate(text: string, max: number): string {
  if (!text) return ''
  const t = text.trim()
  if (t.length <= max) return t

  // max 위치에서 자른 뒤, 마지막 공백까지 되돌려 어절 경계 맞춤
  let cut = t.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  // 공백이 너무 앞쪽(절반 미만)이면 그대로 두어 과도한 손실 방지
  if (lastSpace > max * 0.5) cut = cut.slice(0, lastSpace)

  // 끝에 남은 공백·구두점 정리
  cut = cut.replace(/[\s,，·∙・./·]+$/u, '')

  return cut + '…'
}
