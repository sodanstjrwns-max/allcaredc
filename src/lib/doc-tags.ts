// 의료진 진료 분야 태그 — 분야별 색 고정 (2026-10-15 원장 요청: 같은 '심미보철'이 카드마다 다른 색으로 보이던 문제)
// 이전에는 태그 순서(nth-child)로 색이 정해져 같은 분야도 위치에 따라 색이 달랐다.
const GROUP: [RegExp, string][] = [
  [/임플란트|골이식|뼈이식|사랑니|구강외과/, 'surg'],
  [/교정/, 'ortho'],
  [/심미|보철|틀니|미백|라미네이트/, 'prosth'],
]
export function docTag(name: string): string {
  const g = GROUP.find(([re]) => re.test(name))?.[1] || 'care'
  return `<span class="dt dt-${g}">${name}</span>`
}
