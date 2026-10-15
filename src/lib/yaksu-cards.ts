// ════════════════════════════════════════════════════════════
// 약수역 진료 안내 사진 카드 (2026-10-14)
//  - 홈(= "약수역 치과" 허브)에서 /area/yaksu-{진료} 6개로 링크하는 600×600 사진 카드 + ItemList
//  - 카드 사진 = 각 하위 페이지의 og:image·본문 첫 사진·MedicalWebPage.image·사이트맵 image:image 와 같은 사진
//    (1200×630 jpg: /static/cards/yaksu-{slug}.jpg, 600×600 webp: /static/cards/yaksu-{slug}-600.webp)
//  - 사진: 임플란트·교정·심미·수면·충치신경 = 레포의 실제 원내·진료 사진, 잇몸 = 원내 톤 AI 장면(사람·결과 암시 없음,
//    원본 tools/subpage-cards/gen/allcaredc/gum.png). 전후 사진은 쓰지 않는다.
//  - 약수역 충치·신경치료 / 약수역 잇몸치료 2개는 이번에 정식 하위 페이지로 편입(사이트맵·카드) — 약수역 전용 본문(YAKSU_EXTRA)
// ════════════════════════════════════════════════════════════
import { CLINIC } from '../data/clinic'

const BASE = `https://${CLINIC.domain}`

export type YaksuCard = { tx: string; name: string; tag: string; line: string }

export const YAKSU_CARDS: YaksuCard[] = [
  { tx: 'implant', name: '약수역 임플란트', tag: 'IMPLANT', line: '구강악안면외과 전문의가 진단부터 식립·보철까지 맡습니다' },
  { tx: 'ortho', name: '약수역 치아교정', tag: 'ORTHODONTICS', line: '성장기부터 성인까지, 교합과 기능까지 함께 보는 맞춤 교정' },
  { tx: 'esthetic', name: '약수역 심미보철', tag: 'ESTHETIC', line: '보철과 전문의와 원내 기공실이 함께 맞추는 앞니 심미 보철' },
  { tx: 'sleep', name: '약수역 수면진료', tag: 'SEDATION', line: '의식하진정법으로 치과 치료가 두려운 분도 편안하게' },
  { tx: 'conservative', name: '약수역 충치·신경치료', tag: 'CONSERVATIVE', line: '아프기 전에, 자연치아를 최대한 살리는 보존 진료' },
  { tx: 'gum', name: '약수역 잇몸치료', tag: 'GUM CARE', line: '스케일링부터 치근활택술까지, 단계에 맞춘 잇몸 관리' },
]

/** 카드 대상 하위 페이지 combo(yaksu-*) */
export const YAKSU_COMBOS = YAKSU_CARDS.map(c => `yaksu-${c.tx}`)
export const yaksuOg = (tx: string) => `/static/cards/yaksu-${tx}.jpg`
const thumb = (tx: string) => `/static/cards/yaksu-${tx}-600.webp`
export function yaksuCardFor(combo: string): YaksuCard | undefined {
  return YAKSU_CARDS.find(c => `yaksu-${c.tx}` === combo)
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** 사진 카드 그리드 HTML. exclude: 현재 페이지 tx */
export function yaksuCardGrid(idPrefix: string, exclude = ''): string {
  return `<ul class="yk-cards" role="list">${YAKSU_CARDS.filter(c => c.tx !== exclude).map((c, i) => `<li><a class="yk-card" href="/area/yaksu-${c.tx}" aria-labelledby="${idPrefix}-${c.tx}"><span class="yk-card-img"><img src="${thumb(c.tx)}" width="600" height="600" loading="lazy" decoding="async" alt="${esc(c.name)}"></span><span class="yk-card-body"><span class="yk-card-tag" aria-hidden="true">${String(i + 1).padStart(2, '0')} / ${c.tag}</span><strong class="yk-card-title" id="${idPrefix}-${c.tx}">${esc(c.name)}</strong><span class="yk-card-line">${esc(c.line)}</span></span></a></li>`).join('')}</ul>`
}

export const YAKSU_CARD_CSS = `<style>
.yk-cards{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.yk-card{display:flex;flex-direction:column;height:100%;background:#fff;border:1px solid rgba(6,39,65,.1);border-radius:18px;overflow:hidden;text-decoration:none;color:inherit;transition:transform .3s,box-shadow .3s,border-color .3s}
.yk-card:hover{transform:translateY(-4px);border-color:var(--gold,#b08d57);box-shadow:0 14px 34px rgba(4,26,44,.12)}
.yk-card:focus-visible{outline:3px solid var(--gold,#b08d57);outline-offset:3px}
.yk-card-img{display:block;aspect-ratio:1/1;overflow:hidden;background:var(--ivory-2,#f1e9dc)}
.yk-card-img img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .5s}
.yk-card:hover .yk-card-img img{transform:scale(1.04)}
.yk-card-body{display:flex;flex-direction:column;gap:6px;padding:16px 18px 20px}
.yk-card-tag{font-size:11px;letter-spacing:.04em;font-weight:700;color:var(--gold-600,#97774a)}
.yk-card-title{font-size:17px;font-weight:800;color:var(--navy-800,#062741);line-height:1.35}
.yk-card-line{font-size:13.5px;color:#4b5a68;line-height:1.6;word-break:keep-all}
@media(max-width:900px){.yk-cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}}
@media(max-width:520px){.yk-card-body{padding:11px 12px 14px}.yk-card-title{font-size:15px}.yk-card-line{display:none}}
@media(prefers-reduced-motion:reduce){.yk-card,.yk-card-img img{transition:none}}
.yk-cover{margin:0 0 28px}
.yk-cover img{display:block;width:100%;height:auto;border-radius:16px}
</style>`

/** 화면 카드와 1:1 ItemList */
export function yaksuCardItemList(listUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${listUrl}#yaksu-cards`,
    name: '약수역 진료 안내',
    numberOfItems: YAKSU_CARDS.length,
    itemListElement: YAKSU_CARDS.map((c, i) => ({
      '@type': 'ListItem', position: i + 1, name: c.name, url: `${BASE}/area/yaksu-${c.tx}`, image: `${BASE}${thumb(c.tx)}`,
    })),
  }
}

// 약수역 충치·신경치료 / 잇몸치료 전용 본문 — 지역 템플릿(진료 소개·오시는 길) 위에 약수역 생활권에 맞춘 내용만 더한다.
// 사실 근거: data/clinic.ts(진료시간·야간진료·담당 원장·subProcedures·faqs), 의료광고 금지 표현 없음.
export const YAKSU_EXTRA: Record<string, { sections: { h: string; p: string }[]; faqs: { q: string; a: string }[] }> = {
  conservative: {
    sections: [
      { h: '약수역 직장인이 충치·신경치료 일정을 잡는 방법', p: '충치 치료는 깊이에 따라 한 번에 끝나기도 하지만, 신경치료는 신경관 안을 소독하고 채우는 과정이 단계적으로 진행돼 보통 여러 번 내원하게 됩니다. 365올케어치과는 월·화·목요일 저녁 8시 30분까지 진료하므로, 약수역에서 출퇴근하시는 분은 퇴근길 야간 시간에 회차를 이어가기 좋습니다. 첫 진료에서 몇 번 정도 오셔야 하는지, 각 회차에 무엇을 하는지 먼저 설명드리고 일정을 함께 정합니다.' },
      { h: '살릴 수 있는 치아인지부터 확인합니다', p: '통합치의학과 전문의인 권민수 대표원장이 충치의 깊이와 신경까지의 거리, 치아에 남은 구조를 확인한 뒤 수복으로 충분한지, 신경치료가 필요한지를 나눠 안내합니다. 복잡하거나 재치료가 필요한 신경관은 확대해 보며 처치하고, 신경치료 뒤 약해진 치아는 원내 기공실과 함께 보철로 보호하는 방법까지 한 번에 계획합니다. 지금 꼭 필요한 치료와 지켜봐도 되는 부분을 구분해 말씀드리는 것을 원칙으로 합니다.' },
    ],
    faqs: [
      { q: '약수역 근처에서 퇴근 후 신경치료를 받을 수 있나요?', a: '네. 월·화·목요일은 저녁 8시 30분까지 진료합니다(수·금은 18:30까지). 신경치료는 여러 번 나눠 진행되는 경우가 많아, 첫 진료 때 회차와 일정을 함께 정해 드립니다.' },
      { q: '이가 시린데 충치인지 다른 원인인지 어떻게 아나요?', a: '잠깐 시린 증상은 초기 충치나 잇몸이 내려가 뿌리가 드러난 경우일 수 있고, 씹을 때만 아프면 치아에 금이 간 경우도 있습니다. 원인에 따라 치료가 달라지므로 진찰과 영상으로 원인을 먼저 확인합니다.' },
      { q: '신경치료 후 씌우는 치료도 같은 곳에서 하나요?', a: '네. 원내 기공실이 있어 신경치료 후 보철까지 같은 팀이 이어서 진행합니다. 치아 상태에 따라 씌우지 않고 마무리하는 경우도 있어 진찰 후 안내드립니다.' },
    ],
  },
  gum: {
    sections: [
      { h: '약수역에서 잇몸치료를 시작하는 순서', p: '잇몸치료는 한 번에 끝나는 치료보다 단계에 맞춰 이어가는 관리에 가깝습니다. 먼저 잇몸 출혈과 잇몸 주머니 깊이, 잇몸뼈 상태를 확인하고, 초기라면 스케일링과 칫솔질·치실 사용법 안내로 시작합니다. 잇몸 속 깊은 곳까지 치석이 있으면 부위를 나눠 치근활택술을 진행하며, 치료 뒤에는 재발을 막기 위해 정기 점검 주기를 함께 정합니다. 스케일링은 국민건강보험으로 연 1회 받으실 수 있습니다.' },
      { h: '임플란트·보철 전에 잇몸부터 안정시킵니다', p: '임플란트나 보철을 계획하는 분도 토대가 되는 잇몸에 염증이 남아 있으면 결과가 오래 가기 어렵습니다. 365올케어치과는 구강악안면외과·치과보철과·통합치의학과 전문의가 협진하는 구조라, 큰 치료가 필요한 분은 잇몸을 먼저 안정시킨 뒤 다음 치료로 넘어가도록 순서를 함께 계획합니다. 당뇨 등 전신질환이 있는 분은 잇몸 질환이 더 잘 진행될 수 있어 진료 전 복용 약과 건강 상태를 알려 주세요.' },
    ],
    faqs: [
      { q: '약수역 근처에서 점심시간에 스케일링을 받을 수 있나요?', a: '평일 점심시간(12:30~14:00)은 휴진이라 오전이나 오후, 또는 월·화·목 저녁 8시 30분까지의 야간진료 시간을 이용해 주세요. 토요일은 09:30~14:00 점심시간 없이 진료합니다.' },
      { q: '잇몸치료는 몇 번 정도 다녀야 하나요?', a: '초기에는 스케일링과 관리법 안내로 마무리되는 경우가 많고, 진행된 경우에는 부위를 나눠 치근활택술을 몇 차례 진행합니다. 잇몸 검사 결과를 보고 회차를 미리 안내해 드립니다.' },
      { q: '잇몸에서 피가 나는데 칫솔질을 쉬어야 하나요?', a: '출혈이 무서워 칫솔질을 피하면 염증이 더 진행될 수 있습니다. 부드러운 칫솔로 잇몸 경계를 꼼꼼히 닦되, 출혈이 계속되면 잇몸 상태를 점검받으시는 것이 좋습니다.' },
    ],
  },
}
