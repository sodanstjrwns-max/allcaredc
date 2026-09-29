import encData from './encyclopedia.json'

// 같은 개념을 다른 표기로 중복 작성한 용어 상세 → 대표 용어로 통합 (301 + 사이트맵·내부링크 제외)
// 2026-09-29 크롤 감사: 반대교합/크로스바이트, 치아균열/크랙 투스, 지각과민/시린이
export const ENCYCLOPEDIA_MERGED: Record<string, string> = {
  'crossbite-2': 'crossbite',
  'cracked-tooth-2': 'cracked-tooth',
  'tooth-sensitivity': 'dentin-hypersensitivity',
}

type RawTerm = { term: string; en: string; desc: string; treatment: string; initial: string; slug: string; content?: any }

// 통합된 용어는 상세 본문(content)을 떼어 목록에서만 보이게 한다 (상세 페이지·사이트맵·자동링크 대상에서 제외)
export const ENC_TERMS: RawTerm[] = (encData as RawTerm[]).map(t =>
  ENCYCLOPEDIA_MERGED[t.slug] ? { ...t, content: undefined } : t
)
