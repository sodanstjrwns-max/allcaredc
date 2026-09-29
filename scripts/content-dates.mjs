// ============================================================
// 콘텐츠 실제 수정일 산출 (사이트맵 lastmod · llms.txt 최종 갱신용)
// - git blame 으로 "지금 화면에 나오는 본문 줄"이 마지막으로 바뀐 커밋 날짜(KST)를 구한다.
// - .git-blame-ignore-revs 에 적힌 커밋(스키마·og 이미지·링크 정리 등 본문 변화 없는 커밋)은 건너뛴다.
// - vite.config.ts 가 빌드 시 __CONTENT_DATES__ 로 주입한다.
// - 얕은 클론·git 없음 → null → src/data/content-dates.fallback.json 사용.
//   폴백 갱신: node scripts/content-dates.mjs > src/data/content-dates.fallback.json
// ※ new Date() 로 오늘 날짜를 찍지 않는다 (2026-09-29 SEO/AEO 감사).
// ============================================================
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const run = (cmd) => execSync(cmd, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }).toString()

function ignoreRevs() {
  const p = resolve(ROOT, '.git-blame-ignore-revs')
  if (!existsSync(p)) return []
  return readFileSync(p, 'utf8').split('\n').map((l) => l.replace(/#.*/, '').trim()).filter((l) => /^[0-9a-f]{7,40}$/.test(l))
}

const kstDate = (sec) => new Date((sec + 9 * 3600) * 1000).toISOString().slice(0, 10)

/** 파일의 줄별 { text, date } (date = 그 줄을 마지막으로 바꾼 커밋의 KST 날짜, 미커밋·무시 커밋 줄은 '') */
function blame(file) {
  const revs = ignoreRevs()
  const out = run(`git blame --line-porcelain ${revs.map((r) => `--ignore-rev ${r}`).join(' ')} -- ${file}`)
  const rows = []
  let sha = ''
  let time = 0
  for (const line of out.split('\n')) {
    const h = /^([0-9a-f]{40}) \d+ \d+/.exec(line)
    if (h) { sha = h[1]; continue }
    if (line.startsWith('committer-time ')) { time = Number(line.slice(15)); continue }
    if (line.startsWith('\t')) {
      const skip = /^0+$/.test(sha) || revs.some((r) => sha.startsWith(r))
      rows.push({ text: line.slice(1), date: skip ? '' : kstDate(time) })
    }
  }
  return rows
}

const maxDate = (...ds) => ds.flat().filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '')).sort().pop() || ''
const datesOf = (rows) => rows.map((r) => r.date)

/** startRe 줄부터 endRe 줄 직전까지 (endRe 없거나 못 찾으면 파일 끝까지) */
function span(rows, startRe, endRe) {
  const s = rows.findIndex((r) => startRe.test(r.text))
  if (s < 0) return []
  let e = rows.length
  if (endRe) { const k = rows.findIndex((r, i) => i > s && endRe.test(r.text)); if (k > 0) e = k }
  return rows.slice(s, e)
}

/** 배열 안 객체 항목별 날짜: keyRe 로 slug 를 잡고, 들여쓰기 open/close 줄로 항목 경계를 찾는다 */
function entries(rows, keyRe, openRe, closeRe) {
  const map = {}
  rows.forEach((r, i) => {
    const m = keyRe.exec(r.text)
    if (!m) return
    let s = i
    while (s > 0 && !openRe.test(rows[s].text)) s--
    let e = i
    while (e < rows.length - 1 && !closeRe.test(rows[e].text)) e++
    map[m[1]] = maxDate(map[m[1]], datesOf(rows.slice(s, e + 1)))
  })
  return map
}

export function computeContentDates() {
  try {
    if (run('git rev-parse --is-shallow-repository').trim() === 'true') return null
    const clinic = blame('src/data/clinic.ts')
    const statics = blame('src/pages/static-pages.ts')
    const txPage = blame('src/pages/treatments.ts')
    const docPage = blame('src/pages/doctors.ts')
    const seo = blame('src/routes/seo.ts')

    const clinicInfo = maxDate(datesOf(span(clinic, /^export const CLINIC\b/, /^\}/)))
    const doctorsData = span(clinic, /^export const DOCTORS\b/, /^\]/)
    const txData = span(clinic, /^export const TREATMENTS\b/, /^\]/)
    const priceData = maxDate(datesOf(span(clinic, /^export const PRICE_TABLE\b/, /^\]/)), datesOf(span(clinic, /^export const PRICE_NOTES\b/, /^\]/)))
    const areaData = span(clinic, /^export const SEO_AREAS\b/, /^\]/)

    // 진료별: clinic.ts TREATMENTS 항목 + faqs-extra.ts 추가 FAQ
    const treatments = entries(txData, /^ {4}slug: '([^']+)'/, /^ {2}\{\s*$/, /^ {2}\},?\s*$/)
    const extra = entries(blame('src/data/faqs-extra.ts'), /^ {2}([a-z-]+): \[/, /^ {2}[a-z-]+: \[/, /^ {2}\],?\s*$/)
    for (const k of Object.keys(treatments)) treatments[k] = maxDate(treatments[k], extra[k])

    const doctors = entries(doctorsData, /^ {4}slug: '([^']+)'/, /^ {2}\{\s*$/, /^ {2}\},?\s*$/)
    const areas = {}
    for (const r of areaData) { const m = /slug: '([^']+)'/.exec(r.text); if (m) areas[m[1]] = r.date }

    const encyclopedia = entries(blame('src/data/encyclopedia.json'), /^ {4}"slug": "([^"]+)"/, /^ {2}\{\s*$/, /^ {2}\},?\s*$/)

    const allTx = Object.values(treatments)
    return {
      pages: {
        home: maxDate(datesOf(blame('src/pages/home.ts')), datesOf(blame('src/data/story.ts')), clinicInfo, allTx, Object.values(doctors)),
        mission: maxDate(datesOf(span(statics, /^export function MissionPage/, /^export function DirectionsPage/))),
        directions: maxDate(datesOf(span(statics, /^export function DirectionsPage/, /^export function PricingPage/)), clinicInfo),
        pricing: maxDate(datesOf(span(statics, /^export function PricingPage/, /^function ctaBand/)), priceData),
        faq: maxDate(datesOf(blame('src/pages/faq.ts')), allTx),
        reservation: maxDate(datesOf(blame('src/pages/reservation.ts')), clinicInfo),
        treatments: maxDate(datesOf(span(txPage, /^export function TreatmentsIndex/, /^const TX_LAST_REVIEWED/)), allTx),
        doctors: maxDate(datesOf(span(docPage, /^export function DoctorsIndex/, /^export function DoctorDetail/)), Object.values(doctors)),
        areaTemplate: maxDate(datesOf(span(seo, /^export function AreaPage/))),
      },
      treatments,
      doctors,
      areas,
      encyclopedia,
    }
  } catch {
    return null
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(JSON.stringify(computeContentDates(), null, 2) + '\n')
}
