// 메인 스크롤 몰입 연출 자산의 캐시 버스팅 값(내용 해시)을 src/lib/immersive-assets.ts 에 기록한다.
// public/static/immersive.{js,css} 를 고친 뒤 실행: node scripts/immersive-version.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const h = (f) => createHash('sha256').update(readFileSync(f)).digest('hex').slice(0, 10)
const js = h('public/static/immersive.js'), css = h('public/static/immersive.css')
writeFileSync('src/lib/immersive-assets.ts', `// 자동 생성: node scripts/immersive-version.mjs (직접 고치지 말 것)
export const IMMERSIVE_HEAD = '<link rel="stylesheet" href="/static/immersive.css?v=${css}" />'
export const IMMERSIVE_BODY = '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" defer></script>'
  + '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" defer></script>'
  + '<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js" defer></script>'
  + '<script src="/static/immersive.js?v=${js}" defer></script>'
`)
console.log('immersive.js', js, 'immersive.css', css)
