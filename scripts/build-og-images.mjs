// 공유 미리보기(og:image) 정적 JPG 생성 — 수동 실행: node scripts/build-og-images.mjs
// 기존 동적 SVG(/og/:type/:file, src/lib/seo-engine.ts ogImageSvg)를 그대로 1200×630 JPG로 래스터화해
// public/static/og/{type}/{slug}.jpg 에 저장합니다. 카카오톡·페이스북 등은 SVG og:image를 표시하지 않기 때문입니다.
// 한글 글꼴이 있는 macOS에서 실행해 결과 JPG를 커밋합니다(빌드 서버 글꼴에 의존하지 않도록 빌드 단계에 넣지 않음).
// 백과사전 용어(500여 개)는 개별 이미지 대신 공통 1장(enc/_default.jpg)을 씁니다.
import { build } from 'esbuild'
import sharp from 'sharp'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const entry = `export { ogImageSvg, resolveOg } from './src/lib/seo-engine'
export { TREATMENTS, CORE_TREATMENTS, SEO_AREAS, DOCTORS } from './src/data/clinic'`
const tmp = join(tmpdir(), `allcare-og-${process.pid}.mjs`)
await build({ stdin: { contents: entry, resolveDir: root, loader: 'ts' }, bundle: true, format: 'esm', platform: 'node', outfile: tmp, logLevel: 'error' })
const m = await import(pathToFileURL(tmp).href)

const jobs = []
for (const t of m.TREATMENTS) jobs.push(['treatment', t.slug, m.resolveOg('treatment', t.slug)])
for (const d of m.DOCTORS) jobs.push(['doctor', d.slug, m.resolveOg('doctor', d.slug)])
for (const a of m.SEO_AREAS) for (const t of m.CORE_TREATMENTS) jobs.push(['area', `${a.slug}-${t.slug}`, m.resolveOg('area', `${a.slug}-${t.slug}`)])
jobs.push(['home', 'main', m.resolveOg('home', 'main')])
jobs.push(['enc', '_default', { theme: 'enc', title: '치과 백과사전', subtitle: '치과 용어를 쉽게 풀어 쓴 설명' }])

let n = 0
for (const [type, slug, data] of jobs) {
  if (!data) { console.warn('skip', type, slug); continue }
  const dir = join(root, 'public/static/og', type)
  await mkdir(dir, { recursive: true })
  const svg = m.ogImageSvg(data.theme, data.title, data.subtitle)
  await sharp(Buffer.from(svg), { density: 72 }).resize(1200, 630).jpeg({ quality: 85, mozjpeg: true }).toFile(join(dir, `${slug}.jpg`))
  n++
}
await rm(tmp, { force: true })
console.log(`og images: ${n}개 → public/static/og/`)
