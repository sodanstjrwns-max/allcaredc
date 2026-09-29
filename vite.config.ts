import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'
import { computeContentDates } from './scripts/content-dates.mjs'

export default defineConfig({
  define: {
    // 사이트맵 lastmod·llms 최종 갱신 = 콘텐츠 실제 수정 커밋 날짜 (폴백 src/data/content-dates.fallback.json)
    __CONTENT_DATES__: JSON.stringify(computeContentDates()),
  },
  plugins: [
    build(),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    })
  ]
})
