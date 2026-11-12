// 영어 칼럼 ↔ 한글 원문 짝 (2026-11-12 원장 요청: 영어 칼럼 7편이 한국어 페이지로 표시됨 → 언어 표시 수정 + 한글 원문 연결)
// 영어 칼럼은 관리자에서 분류 'english' 로 올린다. 새 영어 칼럼을 올리면 여기에 원문 slug 를 이어 적는다
// (짝이 없어도 언어 표시는 분류만 보고 영어로 바뀐다).
export const EN_TO_KO: Record<string, string> = {
  'loose-implant-screw-or-inflammation': 'implant-mobility-causes',
  'when-clear-aligners-work': 'clear-aligner-vs-braces',
  'how-to-choose-dental-clinic': 'dental-clinic-selection-criteria',
  'dental-implant-aftercare-habits': 'implant-aftercare',
  'implant-low-jawbone-sinus-lift': 'bone-graft-implant',
  'front-tooth-veneer-zirconia-crown': 'anterior-veneer-vs-crown',
  'adult-braces-start-retainer': 'adult-ortho-timing-retainer',
}
export const KO_TO_EN: Record<string, string> = Object.fromEntries(Object.entries(EN_TO_KO).map(([en, ko]) => [ko, en]))
export const isEnglishColumn = (c: { category?: string }) => c.category === 'english'
