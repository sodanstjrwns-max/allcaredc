// ============================================================
// 진료일정 (2026-11-04 원장 요청) — 휴진·야간 날짜를 관리자에서 입력하면
//  ① 달력 이미지(SVG) 자동 생성 ② 홈 팝업·/schedule 페이지에 자동 노출 ③ 예약 폼에서 휴진일 선택 차단
//  기본값: 월·화·목 = 야간진료, 공휴일 = 공휴일 진료(~14:00), 그 외 = 진료. 관리자는 '기본과 다른 날'만 바꾸면 된다.
// 2026-11-09 2차 요청: 세로형(1050×1485) 달력 · 달마다 배경 이미지(파일 안에 포함) · PNG 동시 생성 · 공휴일 진료시간
// ============================================================
import type { Bindings } from './auth'
import { r2Get, r2Put } from './store'
import { LOGO_SYMBOL_PNG_B64 } from '../data/logo-b64'

// 2026-11-13 권민수 원장 Figma 4번: 'custom'(직접 입력) — 관리자가 문구(단축진료·오후 휴진 등)와 시간을 직접 적는다.
//  시간을 비우면 종일 휴진으로 처리(예약 폼에서도 막힘). 달력 이미지·진료일정 페이지·상단 진료 상태에 그대로 반영.
export type DayState = 'open' | 'night' | 'holiday' | 'closed' | 'custom'
export const DAY_STATES: DayState[] = ['open', 'night', 'holiday', 'closed', 'custom']
export type CustomDay = { label: string; from?: string; to?: string }
export type Schedule = {
  days: Record<string, DayState>      // 기본값과 다른 날만 저장 (YYYY-MM-DD)
  customs: Record<string, CustomDay>  // days[d] === 'custom' 인 날의 문구·시간
  popupMonths: string[]               // 홈 팝업으로 띄울 달 (YYYY-MM)
  notes: Record<string, string>       // 달별 안내 문구
  bgs: Record<string, string>         // 달별 배경 이미지 R2 키 (YYYY-MM → schedule/bg/…jpg)
  pngs: Record<string, string>        // 달별 PNG 가 만들어진 달력 버전 (YYYY-MM → scheduleVersion)
  updatedAt?: number
}
const KEY = 'data/schedule.json'

export async function getSchedule(env: Bindings): Promise<Schedule> {
  const s = await r2Get<Schedule>(env, KEY).catch(() => null)
  return { days: s?.days || {}, customs: s?.customs || {}, popupMonths: s?.popupMonths || [], notes: s?.notes || {}, bgs: s?.bgs || {}, pngs: s?.pngs || {}, updatedAt: s?.updatedAt }
}
export async function saveSchedule(env: Bindings, s: Schedule) { await r2Put(env, KEY, { ...s, updatedAt: Date.now() }) }

// 법정 공휴일(대체공휴일 포함) — 기본값을 '공휴일 진료(09:30~14:00)'로 둔다. 관리자가 날짜별로 바꿀 수 있다.
// ※ 2027년 음력 명절(설·부처님오신날·추석)은 정부 확정 발표 후 한 번 더 확인할 것
const KR_HOLIDAYS = new Set([
  // 2026
  '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', '2026-03-01', '2026-03-02', '2026-05-05', '2026-05-24', '2026-05-25',
  '2026-06-03', '2026-06-06', '2026-08-15', '2026-08-17', '2026-09-24', '2026-09-25', '2026-09-26', '2026-10-03', '2026-10-05',
  '2026-10-09', '2026-12-25',
  // 2027
  '2027-01-01', '2027-02-05', '2027-02-06', '2027-02-07', '2027-02-08', '2027-03-01', '2027-05-05', '2027-05-13', '2027-06-06',
  '2027-08-15', '2027-08-16', '2027-09-14', '2027-09-15', '2027-09-16', '2027-10-03', '2027-10-04', '2027-10-09', '2027-10-11',
  '2027-12-25', '2027-12-27',
])
export const isHoliday = (ymd: string) => KR_HOLIDAYS.has(ymd)

export function defaultState(ymd: string): DayState {
  if (KR_HOLIDAYS.has(ymd)) return 'holiday'
  const wd = new Date(ymd + 'T00:00:00Z').getUTCDay()
  return wd === 1 || wd === 2 || wd === 4 ? 'night' : 'open'
}
export function stateOf(s: Schedule, ymd: string): DayState {
  const st = s.days[ymd] || defaultState(ymd)
  return st === 'custom' && !s.customs?.[ymd]?.label ? defaultState(ymd) : st
}
// ── 직접 입력 상태 ──
export const CUSTOM_LABEL_MAX = 8
const HM = /^([01]\d|2[0-3]):([0-5]\d)$/
export const hmToMin = (v?: string) => { const m = HM.exec(String(v || '')); return m ? Number(m[1]) * 60 + Number(m[2]) : null }
/** 직접 입력한 날의 진료 시간(분). 시간이 없거나 잘못되면 null = 종일 휴진 */
export function customHours(cu?: CustomDay): { o: number; c: number } | null {
  const o = hmToMin(cu?.from), c = hmToMin(cu?.to)
  return o != null && c != null && c > o ? { o, c } : null
}
export const isClosedDay = (s: Schedule, ymd: string) => {
  const st = stateOf(s, ymd)
  return st === 'closed' || (st === 'custom' && !customHours(s.customs[ymd]))
}
/** 문구 정리: 앞뒤 공백·꺾쇠 제거, 최대 8자 */
export function cleanCustom(label: any, from: any, to: any): CustomDay | null {
  const l = String(label || '').replace(/[<>&"]/g, '').replace(/\s+/g, ' ').trim().slice(0, CUSTOM_LABEL_MAX)
  if (!l) return null
  const f = String(from || '').trim(), t = String(to || '').trim()
  const out: CustomDay = { label: l }
  if (hmToMin(f) != null && hmToMin(t) != null && (hmToMin(t) as number) > (hmToMin(f) as number)) { out.from = f; out.to = t }
  return out
}
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
export const kstYmd = (offsetDays = 0) => new Date(Date.now() + 9 * 3600000 + offsetDays * 86400000).toISOString().slice(0, 10)
export const validYm = (v: any) => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(v || ''))
export function hasMonth(s: Schedule, ym: string) { return Object.keys(s.days).some(k => k.startsWith(ym)) || !!s.notes[ym] || s.popupMonths.includes(ym) || !!s.bgs[ym] }
/** 예약 폼에서 막을 날: 휴진 + 시간 없이 직접 입력한 날(종일 휴진) */
export function closedDates(s: Schedule): string[] { return Object.keys(s.days).filter(k => isClosedDay(s, k)).sort() }
export function scheduleVersion(s: Schedule, ym: string): string {
  // 'v2' = 세로형 디자인. 디자인을 바꾸면 이 값을 올려 캐시·PNG를 새로 만들게 한다.
  const str = JSON.stringify(['v2', ym, daysInMonth(ym).map(d => { const st = stateOf(s, d); return st === 'custom' ? [st, s.customs[d]] : st }), s.notes[ym] || '', s.bgs[ym] || ''])
  let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}
/** 오늘부터 n일간 날짜별 진료 상태 (홈 '진료중' 표시·예약 폼용) */
export function upcomingStates(s: Schedule, n = 21): Record<string, DayState> {
  const out: Record<string, DayState> = {}
  for (let i = 0; i < n; i++) { const d = kstYmd(i); out[d] = stateOf(s, d) }
  return out
}
/** 오늘부터 n일간 직접 입력한 날 — 상단 진료 상태용. wk: 평일(공휴일 아님)이면 점심·저녁시간을 적용 */
export function upcomingCustoms(s: Schedule, n = 21): Record<string, CustomDay & { wk: boolean }> {
  const out: Record<string, CustomDay & { wk: boolean }> = {}
  for (let i = 0; i < n; i++) {
    const d = kstYmd(i)
    if (stateOf(s, d) !== 'custom') continue
    const wd = new Date(d + 'T00:00:00Z').getUTCDay()
    out[d] = { ...s.customs[d], wk: wd >= 1 && wd <= 5 && !isHoliday(d) }
  }
  return out
}

/** 달 배경 이미지를 data URI 로 (SVG 안에 포함). 없거나 읽기 실패 → undefined(단색 배경) */
export async function scheduleBgDataUri(env: Bindings, s: Schedule, ym: string): Promise<string | undefined> {
  const key = s.bgs[ym]
  if (!key || !env.R2) return undefined
  try {
    const obj = await env.R2.get(key)
    if (!obj) return undefined
    const bytes = new Uint8Array(await obj.arrayBuffer())
    let bin = ''
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    return `data:${obj.httpMetadata?.contentType || 'image/jpeg'};base64,${btoa(bin)}`
  } catch { return undefined }
}

const x = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// 세로형 달력 SVG 1050×1485 (A4 비율) — 위 큰 제목 / 가운데 흰 카드 달력 / 아래 진료시간 2줄 / 맨 아래 로고
// bg: 'data:image/jpeg;base64,…' — 배경 이미지를 파일 안에 포함(블로그·카카오에 올려도 빠지지 않게). 없으면 단색.
export const CAL_W = 1050, CAL_H = 1485
export function calendarSvg(s: Schedule, ym: string, bg?: string): string {
  const [y, m] = ym.split('-').map(Number)
  const days = daysInMonth(ym)
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay()
  const rows = Math.ceil((first + days.length) / 7)
  const W = CAL_W, H = CAL_H
  const cardX = 70, cardY = 318, cardW = W - 140, cardH = 806
  const gx = cardX + 30, cw = (cardW - 60) / 7
  const headY = cardY + 34, headH = 64
  const gridTop = headY + headH + 8, gridH = 590
  const ch = gridH / rows
  const F = "font-family=\"'Pretendard','Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif\""
  const head = ['일', '월', '화', '수', '목', '금', '토']
  let cells = ''
  days.forEach((d, i) => {
    const pos = first + i, r = Math.floor(pos / 7), c = pos % 7
    const cx = gx + c * cw + cw / 2, cy = gridTop + r * ch
    const st = stateOf(s, d)
    const hol = isHoliday(d)
    if (st === 'custom') {
      // 직접 입력: 숫자 위로 조금 올리고 문구 + (시간) 두 줄. 시간 없으면 종일 휴진 색
      const cu = s.customs[d], hrs = customHours(cu), off = !hrs
      const ny = cy + ch / 2 - 10
      cells += off
        ? `<circle cx="${cx.toFixed(1)}" cy="${ny - 11}" r="24" fill="#8a3b2e"/>`
        : `<circle cx="${cx.toFixed(1)}" cy="${ny - 11}" r="24" fill="#fff" stroke="#8a6a35" stroke-width="2.5"/>`
      const col = off ? '#fff' : (c === 0 || hol) ? '#b03a2e' : c === 6 ? '#2a4d7a' : '#062741'
      cells += `<text x="${cx.toFixed(1)}" y="${ny}" text-anchor="middle" font-size="28" font-weight="700" fill="${col}" ${F}>${i + 1}</text>`
      const fs = cu.label.length > 5 ? 15 : 18
      cells += `<text x="${cx.toFixed(1)}" y="${ny + 30}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="${off ? '#8a3b2e' : '#8a6a35'}" ${F}>${x(cu.label)}</text>`
      if (hrs) cells += `<text x="${cx.toFixed(1)}" y="${ny + 48}" text-anchor="middle" font-size="14" font-weight="600" fill="#5c4a2a" ${F}>${cu.from}~${cu.to}</text>`
      return
    }
    const numY = cy + ch / 2 - 4
    if (st === 'closed') cells += `<circle cx="${cx.toFixed(1)}" cy="${numY - 11}" r="27" fill="#8a3b2e"/>`
    else if (st === 'night') cells += `<circle cx="${cx.toFixed(1)}" cy="${numY - 11}" r="27" fill="#efe6d6"/>`
    const col = st === 'closed' ? '#fff' : (c === 0 || hol) ? '#b03a2e' : c === 6 ? '#2a4d7a' : '#062741'
    cells += `<text x="${cx.toFixed(1)}" y="${numY}" text-anchor="middle" font-size="30" font-weight="700" fill="${col}" ${F}>${i + 1}</text>`
    const lab = st === 'closed' ? ['휴진', '#8a3b2e', 700] : st === 'night' ? ['야간진료', '#8a6a35', 600] : st === 'holiday' ? ['공휴일', '#b03a2e', 600] : null
    if (lab) cells += `<text x="${cx.toFixed(1)}" y="${numY + 38}" text-anchor="middle" font-size="19" font-weight="${lab[2]}" fill="${lab[1]}" ${F}>${lab[0]}</text>`
  })
  for (let r = 1; r < rows; r++) cells += `<line x1="${gx}" y1="${(gridTop + r * ch).toFixed(1)}" x2="${gx + cw * 7}" y2="${(gridTop + r * ch).toFixed(1)}" stroke="#e6dcc8" stroke-width="1.5"/>`
  const note = (s.notes[ym] || `${m}월 진료일정을 참고하여 내원 부탁드립니다.`).slice(0, 60)
  const noteY = cardY + cardH - 44
  const hasBg = !!bg
  // 배경이 화려해도 제목이 읽히도록: 배경이 있을 때만 흰 띠(반투명) + 옅은 그림자
  const titleBand = hasBg ? `<rect x="${cardX}" y="70" width="${cardW}" height="212" rx="28" fill="#ffffff" fill-opacity=".86" filter="url(#sh)"/>` : ''
  const backdrop = hasBg
    ? `<image href="${bg}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect width="${W}" height="${H}" fill="#fffeee"/><rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="none" stroke="#b08d57" stroke-width="2"/>`
  const pill = (yy: number, txt: string) => `<rect x="${cardX + 40}" y="${yy}" width="${cardW - 80}" height="70" rx="35" fill="#ffffff" fill-opacity="${hasBg ? '.95' : '1'}" stroke="#e2d8c4" stroke-width="1.5"${hasBg ? ' filter="url(#sh)"' : ''}/>
  <text x="${W / 2}" y="${yy + 46}" text-anchor="middle" font-size="29" font-weight="700" fill="#062741" ${F}>${txt}</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${m}월 진료일정">
  <defs><filter id="sh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#062741" flood-opacity=".18"/></filter></defs>
  ${backdrop}
  ${titleBand}
  <text x="${W / 2}" y="196" text-anchor="middle" font-size="96" font-weight="800" letter-spacing="-2" fill="#062741" ${F}>${m}월 진료일정</text>
  <text x="${W / 2}" y="250" text-anchor="middle" font-size="30" font-weight="600" letter-spacing="5" fill="#8a6a35" ${F}>Allcare Dental Clinic</text>
  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="32" fill="#ffffff" fill-opacity="${hasBg ? '.93' : '1'}" stroke="#e2d8c4" stroke-width="1.5"${hasBg ? ' filter="url(#sh)"' : ''}/>
  <rect x="${gx}" y="${headY}" width="${cw * 7}" height="${headH}" rx="14" fill="#062741"/>
  ${head.map((h, i) => `<text x="${(gx + i * cw + cw / 2).toFixed(1)}" y="${headY + 43}" text-anchor="middle" font-size="27" font-weight="700" fill="${i === 0 ? '#f0b3a8' : i === 6 ? '#bcd2ee' : '#fffeee'}" ${F}>${h}</text>`).join('')}
  ${cells}
  <line x1="${gx}" y1="${noteY - 50}" x2="${gx + cw * 7}" y2="${noteY - 50}" stroke="#b08d57" stroke-width="1.5" stroke-dasharray="4 6"/>
  <text x="${W / 2}" y="${noteY}" text-anchor="middle" font-size="28" font-weight="700" fill="#062741" ${F}>${x(note)}</text>
  ${pill(cardY + cardH + 34, '월·화·목 야간 진료 (오전 09:30 - 오후 08:30)')}
  ${pill(cardY + cardH + 122, '토·일·공휴일 (오전 09:30 - 오후 02:00)')}
  <g${hasBg ? ' filter="url(#sh)"' : ''}>
    ${hasBg ? `<rect x="${W / 2 - 205}" y="1336" width="410" height="96" rx="48" fill="#ffffff" fill-opacity=".95"/>` : ''}
    <image href="data:image/png;base64,${LOGO_SYMBOL_PNG_B64}" x="${W / 2 - 180}" y="1350" width="68" height="68"/>
    <text x="${W / 2 - 98}" y="1398" font-size="38" font-weight="800" letter-spacing="-1" fill="#062741" ${F}>365올케어치과</text>
  </g>
</svg>`
}
