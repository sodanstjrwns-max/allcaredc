import { html, raw } from 'hono/html'
import { Page, PageHero } from '../components/page'
import { breadcrumbSchema } from '../components/layout'
import { CLINIC, TREATMENTS } from '../data/clinic'
import encData from '../data/encyclopedia.json'

type Term = { term: string; en: string; desc: string; treatment: string; initial: string }
const TERMS = encData as Term[]
const txName = (slug: string) => TREATMENTS.find(t => t.slug === slug)?.name || slug

const INITIALS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

export function EncyclopediaPage() {
  // 가나다 정렬
  const sorted = [...TERMS].sort((a, b) => a.term.localeCompare(b.term, 'ko'))

  const defSchema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: '치과 백과사전',
    hasDefinedTerm: sorted.slice(0, 60).map(t => ({ '@type': 'DefinedTerm', name: t.term, description: t.desc })),
  }

  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '치과 백과사전', url: '/encyclopedia' }],
    title: '치과 백과사전',
    desc: `임플란트부터 잇몸치료까지, 치과 진료에서 자주 쓰이는 용어 ${TERMS.length}개를 알기 쉽게 정리했습니다.`,
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
        ${raw(sorted.map(t => `
          <div class="enc-item" data-initial="${t.initial}">
            <h4>${t.term} <span class="term-en">${t.en}</span></h4>
            <p>${t.desc}</p>
            <div class="links">
              <a href="/treatments/${t.treatment}"><i class="fa-solid fa-link"></i> ${txName(t.treatment)}</a>
              <a href="/cases?cat=${t.treatment}"><i class="fa-solid fa-images"></i> 관련 사례</a>
            </div>
          </div>`).join(''))}
      </div>
    </div>
  </section>
  <script>document.addEventListener('DOMContentLoaded',function(){if(window.initEncyclopedia)window.initEncyclopedia();});</script>
  `
  return Page({
    title: `치과 백과사전 | 치과 용어 ${TERMS.length}선 | 올케어치과`,
    description: `약수역 올케어치과 치과 백과사전. 임플란트, 교정, 충치, 잇몸치료 등 치과 용어 ${TERMS.length}개를 알기 쉽게 설명합니다.`,
    path: '/encyclopedia',
    schema: [breadcrumbSchema([{ name: '홈', url: '/' }, { name: '치과 백과사전', url: '/encyclopedia' }]), defSchema],
  }, body)
}
