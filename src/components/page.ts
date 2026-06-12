import { html, raw } from 'hono/html'
import { Header, Footer, headTags, Meta } from './layout'

// 전체 페이지 셸 — SSR HTML 문자열 반환
export function Page(meta: Meta, body: any) {
  return html`<!DOCTYPE html>
<html lang="ko">
<head>
  ${headTags(meta)}
</head>
<body>
  ${Header()}
  <main id="main">
    ${body}
  </main>
  ${Footer()}
</body>
</html>`
}

// 페이지 히어로 (서브페이지 공통) — chapter: 페이블 챕터 라벨 (영문 모티프)
export function PageHero(opts: { crumb: { name: string; url: string }[]; title: string; desc?: string; chapter?: string }) {
  return html`
  <section class="page-hero">
    <div class="container">
      <nav class="breadcrumb" aria-label="현재 위치">
        ${raw(opts.crumb.map((c, i) =>
          i < opts.crumb.length - 1
            ? `<a href="${c.url}">${c.name}</a><i class="fa-solid fa-angle-right" style="font-size:10px"></i>`
            : `<span>${c.name}</span>`
        ).join(''))}
      </nav>
      ${opts.chapter ? html`<span class="ph-chapter">${opts.chapter}</span>` : ''}
      <h1>${opts.title}</h1>
      ${opts.desc ? html`<p>${opts.desc}</p>` : ''}
    </div>
  </section>`
}
