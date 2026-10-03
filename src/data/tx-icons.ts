// ============================================================
// 진료별 아이콘 — 365올케어치과 자체 제작 인라인 SVG (외부 아이콘 라이브러리 미사용)
// 규칙: viewBox 24 · stroke currentColor · 선 굵기 1.6 · 라운드 캡/조인
//      → 배치된 자리의 기존 색·크기(font-size 기준 em) 토큰을 그대로 따른다.
// 2026-10 원장 요청: Font Awesome 일반 아이콘 대신 진료 특징이 드러나는 치과 전용 그림.
// ============================================================

// 공통 어금니 외곽선 (축소·회전해서 재사용)
const MOLAR =
  'M12 5.2c-1.4-1-3-1.9-4.8-1.6C4.9 4 3.6 6.2 4 8.6c.3 1.8 1.3 3 1.7 4.7.4 1.9.6 4.2 1.3 6 ' +
  '.5 1.3 2 1.4 2.5.1.5-1.4.8-3 1.2-4.3.3-.9 2.3-.9 2.6 0 .4 1.3.7 2.9 1.2 4.3.5 1.3 2 1.2 ' +
  '2.5-.1.7-1.8.9-4.1 1.3-6 .4-1.7 1.4-2.9 1.7-4.7.4-2.4-.9-4.6-3.2-5-1.8-.3-3.4.6-4.8 1.6z'

// 축소된 그룹 안에서도 화면상 선 굵기를 1.6 으로 맞춘다
const scaled = (tx: number, ty: number, s: number, inner: string, rotate = '') =>
  `<g transform="translate(${tx} ${ty})${rotate ? ' ' + rotate : ''} scale(${s})" stroke-width="${(1.6 / s).toFixed(2)}">${inner}</g>`

const SOFT = 'fill="currentColor" fill-opacity=".16"'

export const TX_ICON_SVG: Record<string, string> = {
  // 임플란트 — 크라운 + 지대주 + 나사산 픽스처
  implant:
    `<path d="M5.2 9.2C4.1 8.3 3.7 7.1 4 5.9 4.4 4.3 6 3.3 7.8 3.6c1.2.2 2.3.9 4.2.9s3-.7 4.2-.9c1.8-.3 3.4.7 3.8 2.3.3 1.2-.1 2.4-1.2 3.3z"/>` +
    `<path d="M10.2 9.2v2M13.8 9.2v2"/>` +
    `<path d="M8.6 11.2h6.8l-.9 8.1c-.2 1.1-1.2 1.7-2.5 1.7s-2.3-.6-2.5-1.7z" ${SOFT}/>` +
    `<path d="M8.9 13.6l6.2-.9M9.2 16.1l5.6-.9M9.5 18.6l5-.8"/>`,

  // 치아교정 — 두 앞니 + 브라켓 + 아치와이어
  ortho:
    `<path d="M3.2 6.6C3.2 4.6 4.6 3 6.5 3h.6c1.9 0 3.3 1.6 3.3 3.6V18c0 1.7-1.3 3-3 3H6.2c-1.7 0-3-1.3-3-3z"/>` +
    `<path d="M13.6 6.6c0-2 1.4-3.6 3.3-3.6h.6c1.9 0 3.3 1.6 3.3 3.6V18c0 1.7-1.3 3-3 3h-1.2c-1.7 0-3-1.3-3-3z"/>` +
    `<rect x="4.9" y="10" width="3.8" height="4" rx=".8" fill="currentColor"/>` +
    `<rect x="15.3" y="10" width="3.8" height="4" rx=".8" fill="currentColor"/>` +
    `<path d="M1.2 12h22.6"/>`,

  // 심미보철 — 깎은 치아 위에 씌우는 크라운 (+ 장착 방향)
  esthetic:
    `<path d="M5.4 8.6C4.5 7.7 4.2 6.5 4.6 5.3 5.1 3.9 6.6 3 8.2 3.3c1.3.2 2.2.8 3.8.8s2.5-.6 3.8-.8c1.6-.3 3.1.6 3.6 2 .4 1.2.1 2.4-.8 3.3z" ${SOFT}/>` +
    `<path d="M6.6 14.2l2-2.2h6.8l2 2.2c0 3-.9 6.8-2.4 6.8-1 0-1.4-1.4-1.9-2.8-.4-1.1-1.8-1.1-2.2 0-.5 1.4-.9 2.8-1.9 2.8-1.5 0-2.4-3.8-2.4-6.8z"/>` +
    `<path d="M12 9.8v1"/>`,

  // 수면진료 — 치아 + 초승달
  sleep:
    scaled(-0.2, 6.6, 0.72, `<path d="${MOLAR}"/>`) +
    `<path d="M22 7.6a3.8 3.8 0 0 1-4.9-4.9 3.8 3.8 0 1 0 4.9 4.9z" ${SOFT}/>`,

  // 턱관절 — 하악골 옆모습 + 관절두 + 통증 파동
  tmj:
    `<circle cx="6.6" cy="5" r="1.8"/>` +
    `<path d="M5.4 6.6l-.3 7.4c-.1 2.7 1.6 4.8 4.2 5h8.6c1.7 0 3-1.2 3.2-2.9l.3-2.3c.1-.7-.4-1.3-1.1-1.3h-9.2c-.6 0-1-.4-1-1V8l1.8-2.6"/>` +
    `<path d="M12.2 12.5v-1.7a1.3 1.3 0 0 1 2.6 0v1.7M16.3 12.5v-1.7a1.3 1.3 0 0 1 2.6 0v1.7"/>` +
    `<path d="M3.1 3.2a3.4 3.4 0 0 0 0 3.6M1.4 2a5.4 5.4 0 0 0 0 6"/>`,

  // 충치·신경치료 — 치아 속 치수강·신경관 + 충전된 교합면
  conservative:
    `<path d="${MOLAR}"/>` +
    `<path d="M9.4 11c0-1.5 5.2-1.5 5.2 0M9.4 11c-.2 2.4-.6 4.6-1.3 6.6M14.6 11c.2 2.4.6 4.6 1.3 6.6"/>` +
    `<path d="M9.6 5.6c.8.5 1.5.8 2.4.8s1.6-.3 2.4-.8l-.4 1.8c-.6.4-1.2.6-2 .6s-1.4-.2-2-.6z" fill="currentColor"/>`,

  // 잇몸치료 — 치아 목을 감싼 잇몸선 강조
  gum:
    `<path d="${MOLAR}"/>` +
    `<path d="M1.8 21v-7.4c1.6 0 2.8-.8 3.9-2.1 1.7 1.6 3.8 2.5 6.3 2.5s4.6-.9 6.3-2.5c1.1 1.3 2.3 2.1 3.9 2.1V21z" fill="currentColor" fill-opacity=".22" stroke-width="1.9"/>`,

  // 틀니 — 위·아래 잇몸 바탕(의치상) + 인공치아 열
  denture:
    `<path d="M2.6 7V5.4c0-1.1.9-2 2-2h14.8c1.1 0 2 .9 2 2V7z" ${SOFT}/>` +
    `<path d="M4 7v2.3a2 2 0 0 0 4 0V7M8 7v2.8a2 2 0 0 0 4 0V7M12 7v2.8a2 2 0 0 0 4 0V7M16 7v2.3a2 2 0 0 0 4 0V7"/>` +
    `<path d="M2.6 17v1.6c0 1.1.9 2 2 2h14.8c1.1 0 2-.9 2-2V17z" ${SOFT}/>` +
    `<path d="M4 17v-2.3a2 2 0 0 1 4 0V17M8 17v-2.8a2 2 0 0 1 4 0V17M12 17v-2.8a2 2 0 0 1 4 0V17M16 17v-2.3a2 2 0 0 1 4 0V17"/>`,

  // 미백 — 반짝이는 치아
  whitening:
    scaled(0.4, 5.6, 0.74, `<path d="${MOLAR}"/>`) +
    `<path d="M18.4 1.8l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" fill="currentColor" stroke-width="1"/>` +
    `<path d="M21.2 9.8v2.4M20 11h2.4" stroke-width="1.4"/>`,

  // 구강외과·사랑니 — 잇몸 아래 기울어져 묻힌 어금니(매복 사랑니)
  surgery:
    scaled(0.2, 8.6, 0.56, `<path d="${MOLAR}"/>`) +
    scaled(17, 15.2, 0.6, `<path d="${MOLAR}" transform="translate(-12 -12)"/>`, 'rotate(-48)') +
    `<path d="M12.4 7.4c3-1.2 6.2-1.2 9.6 0"/>`,
}

/** 진료 slug → 인라인 SVG. 정의되지 않은 slug 는 기존 Font Awesome 아이콘으로 폴백. */
export function txIcon(slug: string, faFallback = 'tooth', extraClass = ''): string {
  const inner = TX_ICON_SVG[slug]
  if (!inner) return `<i class="fa-solid fa-${faFallback}${extraClass ? ' ' + extraClass : ''}" aria-hidden="true"></i>`
  return `<svg class="tx-svg${extraClass ? ' ' + extraClass : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`
}
