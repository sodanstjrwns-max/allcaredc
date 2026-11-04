// ============================================================
// 진료일정 (2026-11-04 원장 요청) — 휴진·야간 날짜를 관리자에서 입력하면
//  ① 달력 이미지(SVG) 자동 생성 ② 홈 팝업·/schedule 페이지에 자동 노출 ③ 예약 폼에서 휴진일 선택 차단
//  기본값: 월·화·목 = 야간진료, 그 외 = 진료. 관리자는 '기본과 다른 날'만 바꾸면 된다.
// ============================================================
import type { Bindings } from './auth'
import { r2Get, r2Put } from './store'

export type DayState = 'open' | 'night' | 'closed'
export type Schedule = {
  days: Record<string, DayState>      // 기본값과 다른 날만 저장 (YYYY-MM-DD)
  popupMonths: string[]               // 홈 팝업으로 띄울 달 (YYYY-MM)
  notes: Record<string, string>       // 달별 안내 문구
  updatedAt?: number
}
const KEY = 'data/schedule.json'

export async function getSchedule(env: Bindings): Promise<Schedule> {
  const s = await r2Get<Schedule>(env, KEY).catch(() => null)
  return { days: s?.days || {}, popupMonths: s?.popupMonths || [], notes: s?.notes || {}, updatedAt: s?.updatedAt }
}
export async function saveSchedule(env: Bindings, s: Schedule) { await r2Put(env, KEY, { ...s, updatedAt: Date.now() }) }

export function defaultState(ymd: string): DayState {
  const wd = new Date(ymd + 'T00:00:00Z').getUTCDay()
  return wd === 1 || wd === 2 || wd === 4 ? 'night' : 'open'
}
export function stateOf(s: Schedule, ymd: string): DayState { return s.days[ymd] || defaultState(ymd) }
export function daysInMonth(ym: string): string[] {
  const [y, m] = ym.split('-').map(Number)
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return Array.from({ length: n }, (_, i) => `${ym}-${String(i + 1).padStart(2, '0')}`)
}
export const kstYm = (offsetMonths = 0) => {
  const d = new Date(Date.now() + 9 * 3600000)
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offsetMonths, 1))
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}`
}
export const validYm = (v: any) => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(v || ''))
export function hasMonth(s: Schedule, ym: string) { return Object.keys(s.days).some(k => k.startsWith(ym)) || !!s.notes[ym] || s.popupMonths.includes(ym) }
export function closedDates(s: Schedule): string[] { return Object.entries(s.days).filter(([, v]) => v === 'closed').map(([k]) => k).sort() }
export function scheduleVersion(s: Schedule, ym: string): string {
  const str = JSON.stringify([ym, daysInMonth(ym).map(d => stateOf(s, d)), s.notes[ym] || ''])
  let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

const x = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// 달력 SVG (병원 톤: 네이비·골드·아이보리)
export function calendarSvg(s: Schedule, ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const days = daysInMonth(ym)
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay()
  const rows = Math.ceil((first + days.length) / 7)
  const W = 760, cw = 100, ch = 74, gx = 30, top = 196
  const H = top + rows * ch + 150
  const F = "font-family=\"'Pretendard','Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif\""
  const head = ['일', '월', '화', '수', '목', '금', '토']
  let cells = ''
  days.forEach((d, i) => {
    const pos = first + i, r = Math.floor(pos / 7), c = pos % 7
    const cx = gx + c * cw + cw / 2, cy = top + r * ch
    const st = stateOf(s, d)
    const num = i + 1
    if (st === 'closed') cells += `<circle cx="${cx}" cy="${cy + 24}" r="17" fill="#8a3b2e"/>`
    else if (st === 'night') cells += `<circle cx="${cx}" cy="${cy + 24}" r="17" fill="#efe6d6"/>`
    const col = st === 'closed' ? '#fff' : c === 0 ? '#a33' : c === 6 ? '#2a4d7a' : '#062741'
    cells += `<text x="${cx}" y="${cy + 30}" text-anchor="middle" font-size="17" font-weight="700" fill="${col}" ${F}>${num}</text>`
    if (st === 'closed') cells += `<text x="${cx}" y="${cy + 60}" text-anchor="middle" font-size="13" font-weight="700" fill="#8a3b2e" ${F}>휴진</text>`
    else if (st === 'night') cells += `<text x="${cx}" y="${cy + 60}" text-anchor="middle" font-size="12" font-weight="600" fill="#8a6a35" ${F}>야간진료</text>`
    cells += `<line x1="${gx}" y1="${cy + ch}" x2="${W - gx}" y2="${cy + ch}" stroke="#e6dcc8" stroke-width="1"/>`
  })
  const note = (s.notes[ym] || `${m}월 진료일정을 참고하여 내원 부탁드립니다.`).slice(0, 60)
  const fy = top + rows * ch + 34
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${m}월 진료일정">
  <rect width="${W}" height="${H}" fill="#fffeee"/>
  <rect x="12" y="12" width="${W - 24}" height="${H - 24}" fill="none" stroke="#b08d57" stroke-width="1.5"/>
  <text x="${W / 2}" y="78" text-anchor="middle" font-size="40" font-weight="800" fill="#062741" ${F}>${m}월 진료일정</text>
  <text x="${W / 2}" y="108" text-anchor="middle" font-size="14" letter-spacing="3" fill="#b08d57" ${F}>ALLCARE DENTAL CLINIC</text>
  <rect x="${gx}" y="132" width="${W - gx * 2}" height="44" fill="#062741"/>
  ${head.map((h, i) => `<text x="${gx + i * cw + cw / 2}" y="161" text-anchor="middle" font-size="17" font-weight="700" fill="${i === 0 ? '#f0b3a8' : '#fffeee'}" ${F}>${h}</text>`).join('')}
  ${cells}
  <text x="${W / 2}" y="${fy}" text-anchor="middle" font-size="18" font-weight="700" fill="#062741" ${F}>${x(note)}</text>
  <rect x="${gx + 40}" y="${fy + 20}" width="${W - (gx + 40) * 2}" height="34" rx="17" fill="#062741"/>
  <text x="${W / 2}" y="${fy + 43}" text-anchor="middle" font-size="15" font-weight="600" fill="#fffeee" ${F}>월·화·목 야간 진료 (오전 09:30 - 오후 08:30)</text>
  <rect x="${gx + 40}" y="${fy + 62}" width="${W - (gx + 40) * 2}" height="34" rx="17" fill="#b08d57"/>
  <text x="${W / 2}" y="${fy + 85}" text-anchor="middle" font-size="15" font-weight="600" fill="#fff" ${F}>토·일·공휴일 (오전 09:30 - 오후 02:00)</text>
</svg>`
}
