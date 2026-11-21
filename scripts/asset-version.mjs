// style.css·app.js 캐시 버스팅 값(내용 해시)을 src/lib/asset-version.ts 에 기록한다.
// npm run build 가 매번 먼저 실행한다(파일을 고치면 주소의 ?v= 가 자동으로 바뀜).
// 2026-11-17: 정적 CSS·JS 를 1년 캐시(public/_headers)로 바꾸면서 손으로 올리던 날짜 버전을 내용 해시로 교체.
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const h = (f) => createHash('sha256').update(readFileSync(f)).digest('hex').slice(0, 10)
const style = h('public/static/style.css'), app = h('public/static/app.js')
const out = `// 자동 생성: node scripts/asset-version.mjs (직접 고치지 말 것)
export const STYLE_V = '${style}'
export const APP_V = '${app}'
`
let prev = ''
try { prev = readFileSync('src/lib/asset-version.ts', 'utf8') } catch {}
if (prev !== out) writeFileSync('src/lib/asset-version.ts', out)
console.log('style.css', style, 'app.js', app)
