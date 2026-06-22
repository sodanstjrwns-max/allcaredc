import { html, raw } from 'hono/html'
import { Page, PageHero } from '../components/page'
import { breadcrumbSchema, faqSchema, schemaTag } from '../components/layout'
import { CLINIC, TREATMENTS } from '../data/clinic'
import encData from '../data/encyclopedia.json'
import { speakableSchema, autoLinkBody, suggestInternalLinks } from '../lib/seo-engine'

type Section = { h: string; p: string }
type Faq = { q: string; a: string }
type Content = { intro: string; sections: Section[]; faq: Faq[] }
type Term = { term: string; en: string; desc: string; treatment: string; initial: string; slug: string; content?: Content }
const TERMS = encData as Term[]
const txName = (slug: string) => TREATMENTS.find(t => t.slug === slug)?.name || slug
const BY_SLUG = new Map(TERMS.map(t => [t.slug, t]))
const DETAIL_COUNT = TERMS.filter(t => t.content).length

const INITIALS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// 상세 페이지가 있는 용어 slug 목록 (sitemap에서 사용)
export const ENCYCLOPEDIA_DETAIL_SLUGS = TERMS.filter(t => t.content).map(t => t.slug)

// ════════════════════════════════════════════════════════════
// 백과사전 목록 페이지
// ════════════════════════════════════════════════════════════
export function EncyclopediaPage() {
  const sorted = [...TERMS].sort((a, b) => a.term.localeCompare(b.term, 'ko'))

  const defSchema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: '치과 백과사전',
    url: `https://${CLINIC.domain}/encyclopedia`,
    hasDefinedTerm: sorted.filter(t => t.content).slice(0, 80).map(t => ({
      '@type': 'DefinedTerm',
      name: t.term,
      description: t.desc,
      url: `https://${CLINIC.domain}/encyclopedia/${t.slug}`,
    })),
  }

  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '치과 백과사전', url: '/encyclopedia' }],
    chapter: 'Glossary of Stories',
    title: '치과 백과사전',
    desc: `임플란트부터 잇몸치료까지, 치과 진료에서 자주 쓰이는 용어 ${TERMS.length}개를 알기 쉽게 정리했습니다. 핵심 용어 ${DETAIL_COUNT}개는 상세 설명을 제공합니다.`,
  })}

  <section class="section">
    <div class="container">
      <div class="enc-search reveal">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input id="encSearch" type="search" placeholder="용어를 검색해 보세요 (예: 임플란트, 충치, 교정)" autocomplete="off">
      </div>
      <div class="enc-alpha reveal">
        <button class="active" data-letter="ALL">전체</button>
        ${raw(INITIALS.map(l => `<button data-letter="${l}">${l}</button>`).join(''))}
      </div>
      <div class="enc-grid reveal">
        ${raw(sorted.map(t => {
          const hasDetail = !!t.content
          const titleHtml = hasDetail
            ? `<a href="/encyclopedia/${t.slug}" class="enc-term-link">${esc(t.term)} <span class="term-en">${esc(t.en)}</span></a>`
            : `${esc(t.term)} <span class="term-en">${esc(t.en)}</span>`
          const detailLink = hasDetail
            ? `<a href="/encyclopedia/${t.slug}"><i class="fa-solid fa-book-open"></i> 자세히 보기</a>`
            : ''
          return `
          <div class="enc-item${hasDetail ? ' has-detail' : ''}" data-initial="${t.initial}">
            <h2 class="enc-term-h">${titleHtml}</h2>
            <p>${esc(t.desc)}</p>
            <div class="links">
              ${detailLink}
              <a href="/treatments/${t.treatment}"><i class="fa-solid fa-link"></i> ${esc(txName(t.treatment))}</a>
            </div>
          </div>`
        }).join(''))}
      </div>
    </div>
  </section>
  <script>document.addEventListener('DOMContentLoaded',function(){if(window.initEncyclopedia)window.initEncyclopedia();});</script>
  `
  return Page({
    title: `치과 백과사전 | 치과 용어 ${TERMS.length}선 | 올케어치과`,
    description: `약수역 올케어치과 치과 백과사전. 임플란트, 교정, 충치, 잇몸치료 등 치과 용어 ${TERMS.length}개를 알기 쉽게 설명합니다. 핵심 용어는 정의·과정·주의사항·FAQ를 상세히 제공합니다.`,
    path: '/encyclopedia',
    schema: [breadcrumbSchema([{ name: '홈', url: '/' }, { name: '치과 백과사전', url: '/encyclopedia' }]), defSchema],
  }, body)
}

// ════════════════════════════════════════════════════════════
// 백과사전 용어 상세 페이지  /encyclopedia/:slug
// ════════════════════════════════════════════════════════════
export function EncyclopediaDetailPage(slug: string) {
  const term = BY_SLUG.get(slug)
  if (!term || !term.content) return null
  const c = term.content

  const curPath = `/encyclopedia/${term.slug}`

  // 본문 인라인 자동 링크용: 페이지 전체에서 키워드 중복 링크 방지 공유 Set
  const linkedSet = new Set<string>()

  // 본문 전체 텍스트(맥락) — 내부링크 추천에 사용
  const bodyText = c.intro + ' ' + c.sections.map((s: Section) => s.h + ' ' + s.p).join(' ') + ' ' + c.faq.map((f: Faq) => f.q + ' ' + f.a).join(' ')
  // 1순위: 본문에서 실제 언급된 관련 페이지(맥락 링크) — AEO 시맨틱 연결
  const contextual = suggestInternalLinks(bodyText, curPath, 6)
    .filter(l => l.url.startsWith('/encyclopedia/'))
  // 2순위: 같은 진료과목 내 관련 용어로 6개까지 보충
  const sameCat = TERMS
    .filter(t => t.treatment === term.treatment && t.slug !== term.slug && t.content)
    .sort((a, b) => a.term.localeCompare(b.term, 'ko'))
    .map(t => ({ url: `/encyclopedia/${t.slug}`, label: t.term }))
  const seen = new Set<string>(contextual.map(l => l.url))
  const related: { url: string; label: string }[] = [...contextual]
  for (const r of sameCat) {
    if (related.length >= 6) break
    if (seen.has(r.url)) continue
    related.push(r); seen.add(r.url)
  }

  const crumb = [
    { name: '홈', url: '/' },
    { name: '치과 백과사전', url: '/encyclopedia' },
    { name: term.term, url: `/encyclopedia/${term.slug}` },
  ]

  // 스키마: MedicalWebPage + DefinedTerm + FAQPage + Breadcrumb
  const definedTermSchema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    '@id': `https://${CLINIC.domain}/encyclopedia/${term.slug}#term`,
    name: term.term,
    alternateName: term.en || undefined,
    description: c.intro,
    inDefinedTermSet: `https://${CLINIC.domain}/encyclopedia`,
  }
  const medicalPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: `${term.term} | 치과 백과사전`,
    url: `https://${CLINIC.domain}/encyclopedia/${term.slug}`,
    description: c.intro,
    inLanguage: 'ko',
    about: { '@type': 'MedicalEntity', name: term.term },
    lastReviewed: '2026-06-15',
    publisher: { '@type': 'Dentist', name: CLINIC.name, url: `https://${CLINIC.domain}/` },
  }

  const body = html`
  ${PageHero({
    crumb,
    chapter: term.en || 'Dental Term',
    title: term.term,
    desc: txName(term.treatment) + ' 관련 용어',
  })}

  <section class="section enc-detail">
    <div class="container enc-detail-grid">
      <article class="enc-article">
        <p class="enc-intro">${c.intro}</p>

        ${raw(c.sections.map(s => `
          <div class="enc-section">
            <h2>${esc(s.h)}</h2>
            <p>${autoLinkBody(esc(s.p), curPath, { maxLinks: 3, linkedSet })}</p>
          </div>`).join(''))}

        <div class="enc-faq">
          <h2>자주 묻는 질문</h2>
          ${raw(c.faq.map(f => `
            <details class="enc-faq-item">
              <summary>${esc(f.q)}</summary>
              <p>${esc(f.a)}</p>
            </details>`).join(''))}
        </div>

        <div class="enc-disclaimer">
          <i class="fa-solid fa-circle-info"></i>
          위 내용은 일반적인 이해를 돕기 위한 정보로, 개인의 상태에 따라 진단과 치료 결과가 다를 수 있습니다. 정확한 진단과 치료는 ${CLINIC.name} 의료진과의 상담을 통해 결정하시기 바랍니다.
        </div>

        <div class="enc-cta-row">
          <a href="/treatments/${term.treatment}" class="btn btn-navy"><i class="fa-solid fa-tooth"></i> ${esc(txName(term.treatment))} 진료 안내</a>
          <a href="/reservation" class="btn btn-accent"><i class="fa-solid fa-calendar-check"></i> 상담 예약하기</a>
        </div>
      </article>

      <aside class="enc-aside">
        <div class="enc-aside-card">
          <h3>관련 용어</h3>
          ${related.length
            ? raw('<ul class="enc-related">' + related.map(r =>
                `<li><a href="${r.url}">${esc(r.label)}</a></li>`).join('') + '</ul>')
            : html`<p style="color:var(--gray-600);font-size:14px">관련 용어를 준비 중입니다.</p>`}
          <a href="/encyclopedia" class="enc-back"><i class="fa-solid fa-arrow-left"></i> 백과사전 전체보기</a>
        </div>
        <div class="enc-aside-card enc-aside-contact">
          <h3>${esc(txName(term.treatment))} 상담</h3>
          <p>궁금한 점이 있으시면 편하게 문의해 주세요.</p>
          <a href="tel:${CLINIC.phoneRaw}" class="btn btn-navy" style="width:100%;justify-content:center"><i class="fa-solid fa-phone"></i> ${CLINIC.phone}</a>
        </div>
      </aside>
    </div>
  </section>
  `
  return Page({
    title: `${term.term}${term.en ? ' (' + term.en + ')' : ''} | 치과 백과사전 | 올케어치과`,
    description: c.intro.slice(0, 155),
    path: `/encyclopedia/${term.slug}`,
    ogImage: `https://${CLINIC.domain}/og/enc/${term.slug}.svg`,
    keywords: `${term.term},${term.en},치과 용어,${txName(term.treatment)},올케어치과`,
    schema: [
      breadcrumbSchema(crumb),
      definedTermSchema,
      medicalPageSchema,
      faqSchema(c.faq),
      speakableSchema(['.enc-intro', '.answer-box', 'h1', 'h2']),
    ],
  }, body)
}
