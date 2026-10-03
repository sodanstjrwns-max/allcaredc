import { html, raw } from 'hono/html'
import { Page, PageHero } from '../components/page'
import { breadcrumbSchema } from '../components/layout'
import { CLINIC, TREATMENTS, DOCTORS, getDoctor, columnCategoriesForTreatment } from '../data/clinic'
import { pagerHtml, collectionGraph } from './column'
import { caseAutoSummary, clipSentences, flatText, validTs, isoOf, kstYmd } from '../lib/column-seo'

const BASE = `https://${CLINIC.domain}`
export const CASE_PER = 12

export type CaseItem = {
  id: string
  title: string
  description: string
  ageGroup: string       // 환자 나이대
  gender: string         // 성별
  category: string       // 진료 카테고리 (treatment slug)
  region: string         // 지역 카테고리
  doctor: string         // 담당 원장 slug
  period: string         // 치료 기간
  // 이미지 키 (R2). 업로드 안 된 것은 표시 안 함
  panoBefore?: string
  panoAfter?: string
  intraBefore?: string
  intraAfter?: string
  createdAt: number
  updatedAt?: number
}

// ============================================================
// 비포애프터 목록 /cases  (?cat= / ?doctor= 필터)
// ============================================================
export function CasesPage(cases: CaseItem[], loggedIn: boolean, filter: { cat?: string; doctor?: string; page?: number }) {
  // 분야(?cat=)·의료진(?doctor=) 필터와 ?page=N 은 서버에서 적용 → 검색엔진이 따라갈 수 있는 a 링크 목록
  const cat = filter.cat && TREATMENTS.some(t => t.slug === filter.cat) ? filter.cat : ''
  let filtered = [...cases].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  if (filter.doctor) filtered = filtered.filter(c => c.doctor === filter.doctor)
  if (cat) filtered = filtered.filter(c => c.category === cat)
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / CASE_PER))
  const page = Math.min(Math.max(1, filter.page || 1), pages)
  const offset = (page - 1) * CASE_PER
  filtered = filtered.slice(offset, offset + CASE_PER)

  const catName = (slug: string) => TREATMENTS.find(t => t.slug === slug)?.name || slug
  const docName = (slug: string) => DOCTORS.find(d => d.slug === slug)?.name || ''
  const usedCats = TREATMENTS.filter(t => t.slug === cat || cases.some(c => c.category === t.slug))
  const qs = [cat ? `cat=${cat}` : '', filter.doctor ? `doctor=${filter.doctor}` : '', page > 1 ? `page=${page}` : ''].filter(Boolean).join('&')
  const path = `/cases${qs ? `?${qs}` : ''}`
  const pageSuffix = page > 1 ? ` (${page}페이지)` : ''

  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '진료사례', url: '/cases' }, ...(cat ? [{ name: catName(cat), url: `/cases?cat=${cat}` }] : [])],
    chapter: 'Stories of Recovery',
    title: '먼저 다녀간 이야기',
    desc: '한 사람의 불편이 회복으로 바뀌는 과정의 기록입니다. 치료 결과는 개인의 상태에 따라 차이가 있을 수 있습니다.',
  })}

  <section class="section">
    <div class="container">
      <!-- 분야 필터 (서버 렌더 링크 ?cat=) — 사례가 있는 분야만 -->
      <nav class="reveal case-filter" id="caseFilter" aria-label="분야별 진료사례" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center">
        <a href="/cases" class="tag-pill${!cat ? ' active' : ''}">전체</a>
        ${raw(usedCats.map(t => `
          <a href="/cases?cat=${t.slug}" class="tag-pill${cat === t.slug ? ' active' : ''}">${t.name}</a>`).join(''))}
        <span id="caseCount" style="margin-left:auto;font-size:13px;color:var(--gray-600)">총 ${total}건</span>
      </nav>
      ${cat ? raw(`<p class="reveal" style="margin:0 0 22px;font-size:14px;color:var(--gray-600)"><a href="/treatments/${cat}" style="font-weight:700;color:var(--brand-accent)">${catName(cat)} 진료 안내</a> · <a href="/column?cat=${cat}" style="font-weight:700;color:var(--brand-accent)">${catName(cat)} 칼럼</a></p>`) : ''}

      ${!loggedIn ? html`
        <div class="reveal" style="background:var(--beige-soft);border-radius:var(--radius);padding:20px 24px;margin-bottom:30px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <i class="fa-solid fa-lock text-mint" style="font-size:20px"></i>
          <span style="flex:1;min-width:200px">치료 후(After) 사진은 의료법에 따라 <strong>로그인한 회원</strong>에게만 공개됩니다.</span>
          <a href="/auth/login?next=/cases" class="btn btn-primary" style="padding:10px 20px;font-size:14px">로그인 / 회원가입</a>
        </div>
      ` : ''}

      ${filtered.length === 0 ? html`
        <div class="reveal" style="text-align:center;padding:80px 0;color:var(--gray-600)">
          <i class="fa-solid fa-images" style="font-size:48px;color:var(--gray-200);margin-bottom:16px"></i>
          <p>등록된 진료사례가 준비 중입니다.</p>
        </div>
      ` : html`
        <div class="case-grid" id="caseGrid">
          ${raw(filtered.map((c, i) => caseCard(c, loggedIn, catName, docName, offset + i)).join(''))}
        </div>
        ${raw(pagerHtml(`/cases?${cat ? `cat=${cat}&` : ''}${filter.doctor ? `doctor=${filter.doctor}&` : ''}`, page, pages))}
        <div id="caseEmpty" hidden style="text-align:center;padding:60px 0;color:var(--gray-600)">
          <i class="fa-solid fa-filter-circle-xmark" style="font-size:40px;color:var(--gray-200);margin-bottom:14px"></i>
          <p>선택하신 진료 분야의 사례가 아직 없습니다.</p>
        </div>
      `}
    </div>
  </section>

  <!-- 라이트박스 -->
  <div class="case-lightbox" id="caseLightbox" hidden>
    <div class="cl-backdrop" data-cl-close></div>
    <div class="cl-card" role="dialog" aria-modal="true" aria-label="진료사례 상세">
      <button type="button" class="cl-close" data-cl-close aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>
      <div class="cl-media">
        <figure><img id="clBefore" alt="치료 전"><figcaption>Before</figcaption></figure>
        <figure id="clAfterFig"><img id="clAfter" alt="치료 후"><figcaption>After</figcaption></figure>
      </div>
      <div class="cl-info">
        <span class="cl-cat" id="clCat"></span>
        <h2 id="clTitle"></h2>
        <p id="clDesc"></p>
        <ul class="cl-tags" id="clTags"></ul>
        <a id="clDoctor" class="cl-doctor" href="#" hidden></a>
        <div class="cl-cta">
          <a href="/reservation" class="btn btn-accent" style="font-size:14px"><i class="fa-solid fa-calendar-check"></i> 비슷한 고민, 상담받기</a>
          <!-- §S20⑤: 사례 → 같은 분야 칼럼 역링크 (JS가 카테고리 주입) -->
          <a id="clColumn" href="/column" class="btn btn-outline" style="font-size:14px" hidden><i class="fa-solid fa-pen-nib"></i> 관련 칼럼 읽기</a>
        </div>
      </div>
    </div>
  </div>
  ${ctaBand()}
  `
  return Page({
    title: (cat ? `${catName(cat)} 비포애프터${pageSuffix} | 진료사례 | 365올케어치과` : `비포/애프터 진료사례${pageSuffix} | 365올케어치과`),
    description: (cat
      ? `약수역 365올케어치과 ${catName(cat)} 실제 진료사례 ${total}건. 진단·치료 과정과 치료 기간을 공개하며, 치료 후 사진은 로그인 회원에게만 보여드립니다. 결과는 개인에 따라 차이가 있을 수 있습니다.`
      : '약수역 365올케어치과의 실제 임플란트·치아교정·심미보철 치료 전후(Before/After) 진료사례 모음. 동의를 받은 케이스만 공개하며, 파노라마·구강 사진으로 치료 과정을 투명하게 안내합니다. 치료 결과는 개인의 구강 상태에 따라 차이가 있을 수 있습니다.') + pageSuffix,
    path,
    schema: [collectionGraph({
      path, name: `${cat ? `${catName(cat)} ` : ''}진료사례 목록${pageSuffix}`, total, offset,
      items: filtered.map(c => ({ name: storyLine(c, catName), path: `/cases/${c.id}` })),
      crumbs: [{ name: '홈', url: '/' }, { name: '진료사례', url: '/cases' }, ...(cat ? [{ name: catName(cat), url: `/cases?cat=${cat}` }] : [])],
    })],
  }, body)
}

function caseCard(c: CaseItem, loggedIn: boolean, catName: (s: string) => string, docName: (s: string) => string, i: number) {
  // 비포/애프터 슬라이더 — 애프터는 로그인 게이팅 (1차: SSR에서 src 차단)
  const hasPanos = c.panoBefore || c.panoAfter
  const before = c.panoBefore || c.intraBefore
  const after = c.panoAfter || c.intraAfter
  const afterSrc = loggedIn && after ? `/api/case-image/${c.id}/after` : ''
  const beforeSrc = before ? `/api/case-image/${c.id}/before` : ''
  const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const tagsHtml = [
    c.ageGroup ? `${c.ageGroup} ${c.gender || ''}` : '',
    c.period ? `치료기간 ${c.period}` : '',
    c.region ? c.region : '',
  ].filter(Boolean).map(t => `<li>${esc(t)}</li>`).join('')

  return `
  <article class="case-card reveal reveal-d${(i % 3) + 1}" data-cat="${esc(c.category)}"
    data-before="${esc(beforeSrc)}" data-after="${esc(afterSrc)}" data-locked="${loggedIn ? '0' : '1'}"
    data-title="${esc(storyLine(c, catName))}" data-cat-name="${esc(catName(c.category))}"
    data-desc="${esc(c.description)}" data-tags="${esc(tagsHtml)}"
    data-doctor="${esc(c.doctor || '')}" data-doctor-name="${esc(docName(c.doctor) ? docName(c.doctor) + ' 원장' : '')}">
    
    <div class="ba-slider${loggedIn ? '' : ' locked'}">
      ${beforeSrc ? `<img src="${beforeSrc}" alt="${esc(catName(c.category))} 치료 전" loading="lazy" decoding="async">` : `<div style="position:absolute;inset:0;display:grid;place-items:center;color:var(--gray-400);background:var(--gray-100)"><i class="fa-solid fa-image" style="font-size:32px"></i></div>`}
      <span class="ba-label before">Before</span>
      ${loggedIn && afterSrc ? `
        <div class="ba-after-wrap"><img src="${afterSrc}" alt="${esc(catName(c.category))} 치료 후" loading="lazy" decoding="async"></div>
        <span class="ba-label after">After</span>
        <div class="ba-handle"></div>
      ` : `
        <div class="gate">
          <div>
            <i class="fa-solid fa-lock"></i>
            <p style="font-weight:700;margin-bottom:4px">After 사진</p>
            <p style="font-size:13px;opacity:.85;margin-bottom:14px">로그인 후 확인하실 수 있습니다</p>
            <a href="/auth/login?next=/cases/${esc(c.id)}" rel="nofollow" class="btn btn-accent" style="padding:8px 18px;font-size:13px">로그인</a>
          </div>
        </div>
      `}
    </div>
    <div class="case-meta">
      <span class="case-story-no">Story ${String(i + 1).padStart(2, '0')} · ${catName(c.category)}</span>
      <h2 class="case-story-line"><a href="/cases/${esc(c.id)}">${esc(storyLine(c, catName))}</a></h2>
      <p style="font-size:14px;color:var(--gray-600);margin-bottom:8px">${esc(c.description)}</p>
      <div class="tags">
        ${c.ageGroup ? `<i class="fa-solid fa-user"></i> ${c.ageGroup} ${c.gender || ''} · ` : ''}
        ${c.period ? `<i class="fa-solid fa-clock"></i> ${c.period} · ` : ''}
        ${c.region ? `<i class="fa-solid fa-location-dot"></i> ${c.region}` : ''}
      </div>
      ${c.doctor ? `<a href="/doctors/${c.doctor}" style="display:inline-block;margin-top:10px;font-size:13px;font-weight:600;color:var(--brand-accent)">담당: ${docName(c.doctor)} 원장 <i class="fa-solid fa-arrow-right" style="font-size:11px"></i></a>` : ''}
      <a href="/column?cat=${esc(c.category)}" style="display:inline-block;margin-top:10px;margin-left:${c.doctor ? '12px' : '0'};font-size:13px;font-weight:600;color:var(--gray-600)"><i class="fa-solid fa-pen-nib" style="font-size:11px"></i> ${catName(c.category)} 칼럼</a>
      <button type="button" class="case-detail-btn" aria-label="진료사례 크게 보기"><i class="fa-solid fa-up-right-and-down-left-from-center"></i> 크게 보기</button>
      <a href="/cases/${esc(c.id)}" style="display:inline-block;margin-top:10px;margin-left:12px;font-size:13px;font-weight:700;color:var(--brand)">사례 전체 보기 <i class="fa-solid fa-arrow-right" style="font-size:11px"></i></a>
    </div>
  </article>`
}

// 사례 제목: 원장이 입력한 제목(치료 내용)을 우선 사용, 없으면 "진료명 치료 사례" (원장 요청 2026-09-16 — 지역·연령·성별·기간은 별도 태그로만 표시)
function storyLine(c: CaseItem, catName?: (slug: string) => string): string {
  const t = (c.title || '').trim()
  const generic = /환자분의|이야기$/.test(t)
  if (t && !generic) return t
  const cat = catName ? catName(c.category) : c.category
  return `${cat} 치료 사례`
}

// ============================================================
// 진료사례 상세 /cases/:id — 개별 URL (텍스트 공개 · After 사진은 로그인 회원만, 의료법 게이트 유지)
// ============================================================
export function CaseDetailPage(c: CaseItem, loggedIn: boolean, siblings: CaseItem[], relCols: { slug: string; title: string }[]) {
  const t = TREATMENTS.find(x => x.slug === c.category)
  const txName = t?.name || '치과'
  const doc = c.doctor ? getDoctor(c.doctor) : undefined
  const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const title = storyLine(c, (s) => TREATMENTS.find(x => x.slug === s)?.name || s)
  const before = c.panoBefore || c.intraBefore
  const after = c.panoAfter || c.intraAfter
  const beforeSrc = before ? `/api/case-image/${c.id}/before` : ''
  const afterSrc = loggedIn && after ? `/api/case-image/${c.id}/after` : ''
  const summary = caseAutoSummary(c, txName, doc ? `${doc.name} ${doc.role}` : '', CLINIC.name)
  const created = validTs(c.createdAt)
  const modified = validTs(c.updatedAt, c.createdAt)
  const pageUrl = `${BASE}/cases/${c.id}`
  const pageTitle = `${t ? `${t.name} 사례 — ` : ''}${title}${c.period ? ` (${c.period})` : ''}`
  const desc = clipSentences(`${title}. ${flatText(c.description) || summary}`, 155, 60)
  const crumbs = [{ name: '홈', url: '/' }, { name: '진료사례', url: '/cases' }, ...(t ? [{ name: t.name, url: `/cases?cat=${t.slug}` }] : []), { name: title, url: `/cases/${c.id}` }]
  const bc: any = breadcrumbSchema(crumbs, `${pageUrl}#breadcrumb`); delete bc['@context']
  const physicianId = doc ? `${BASE}/doctors/${doc.slug}#physician` : undefined
  // Review·AggregateRating 없음(의료법). 공개 사진 = 치료 전 사진만 → 이미지도 전 사진만
  const graph = [
    {
      '@type': 'MedicalWebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: pageTitle,
      description: desc,
      inLanguage: 'ko-KR',
      isPartOf: { '@id': `${BASE}/#website` },
      breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
      about: t ? { '@id': `${BASE}/treatments/${t.slug}#procedure` } : { '@id': `${BASE}/#clinic` },
      ...(physicianId ? { reviewedBy: { '@id': physicianId } } : {}),
      ...(modified ? { lastReviewed: kstYmd(modified), dateModified: isoOf(modified) } : {}),
      ...(created ? { datePublished: isoOf(created) } : {}),
      ...(beforeSrc ? { primaryImageOfPage: { '@type': 'ImageObject', url: `${BASE}${beforeSrc}`, caption: `${txName} 치료 전` } } : {}),
      medicalAudience: { '@type': 'MedicalAudience', audienceType: 'Patient' },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.answer-summary'] },
    },
    bc,
  ]
  const facts: [string, string][] = [
    ['진료', t ? `<a href="/treatments/${t.slug}">${esc(t.name)}</a>` : ''],
    ['치료 기간', esc(c.period || '')],
    ['담당', doc ? `<a href="/doctors/${doc.slug}">${esc(doc.name)} ${esc(doc.role)}</a>` : ''],
  ]
  const body = html`
  ${PageHero({ crumb: crumbs, chapter: 'Case Story', title })}
  <section class="section">
    <div class="container" style="max-width:880px">
      <div class="answer-summary-box reveal">
        <p class="answer-summary-label"><i class="fa-solid fa-clipboard-list"></i> 사례 요약</p>
        <p class="answer-summary">${summary}</p>
        <dl class="case-facts">${raw(facts.filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join(''))}</dl>
      </div>

      <div class="case-detail-media reveal">
        ${beforeSrc ? raw(`<figure><img src="${beforeSrc}" alt="${esc(txName)} 치료 전" decoding="async"><figcaption>Before</figcaption></figure>`) : ''}
        ${after ? (afterSrc
          ? raw(`<figure><img src="${afterSrc}" alt="${esc(txName)} 치료 후" loading="lazy" decoding="async"><figcaption>After</figcaption></figure>`)
          : raw(`<figure class="case-after-locked"><div><i class="fa-solid fa-lock"></i><p><strong>After 사진</strong></p><p>의료법에 따라 로그인한 회원에게만 공개됩니다.</p><a href="/auth/login?next=/cases/${esc(c.id)}" rel="nofollow" class="btn btn-accent" style="padding:8px 18px;font-size:13px">로그인 / 회원가입</a></div><figcaption>After</figcaption></figure>`)) : ''}
      </div>

      ${c.description ? html`
      <h2 style="font-size:1.4rem;margin:40px 0 14px">진단과 치료 과정</h2>
      <div class="prose reveal">${raw(c.description.split(/\r?\n/).filter(x => x.trim()).map(x => `<p>${esc(x)}</p>`).join(''))}</div>` : ''}
      <p style="font-size:12.5px;color:var(--gray-400);margin-top:24px">※ 환자 동의를 받아 게시한 사례이며, 전후 사진은 같은 촬영 조건에서 기록했습니다. 치료 결과는 개인의 구강 상태에 따라 차이가 있을 수 있습니다.</p>

      <div class="col-cta-row" style="margin-top:28px">
        ${t ? raw(`<a href="/treatments/${t.slug}" class="btn btn-primary"><i class="fa-solid fa-tooth"></i> ${esc(t.name)} 진료 소개</a>`) : ''}
        <a href="/reservation" class="btn btn-accent"><i class="fa-solid fa-calendar-check"></i> 비슷한 고민, 상담받기</a>
        <a href="/cases" class="btn btn-outline"><i class="fa-solid fa-list"></i> 사례 목록</a>
      </div>

      ${siblings.length || relCols.length ? html`
      <div class="grid-2" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;margin-top:50px">
        ${siblings.length ? html`<div class="inlink-box"><h3><i class="fa-solid fa-images text-mint"></i> ${txName} 다른 사례</h3>${raw(siblings.map(s => `<a href="/cases/${esc(s.id)}"><span>${esc(storyLine(s, (x) => TREATMENTS.find(y => y.slug === x)?.name || x))}</span><i class="fa-solid fa-arrow-right" style="font-size:12px"></i></a>`).join(''))}</div>` : ''}
        ${relCols.length ? html`<div class="inlink-box"><h3><i class="fa-solid fa-pen-nib text-mint"></i> ${txName} 관련 칼럼</h3>${raw(relCols.map(r => `<a href="/column/${esc(r.slug)}"><span>${esc(r.title)}</span><i class="fa-solid fa-arrow-right" style="font-size:12px"></i></a>`).join(''))}</div>` : ''}
      </div>` : ''}
    </div>
  </section>
  ${ctaBand()}`
  return Page({
    title: `${pageTitle} | 365올케어치과`,
    description: desc,
    path: `/cases/${c.id}`,
    ogType: 'article',
    article: { published: isoOf(created), modified: isoOf(modified), section: t?.name },
    ogImage: undefined, // 사례 사진은 OG 공유 미리보기에 쓰지 않음(사이트 기본 이미지)
    schema: [{ '@context': 'https://schema.org', '@graph': graph }],
  }, body)
}

/** 진료 slug 에 연결되는 칼럼 카테고리 (resin-inlay→conservative 등) */
export const caseColumnCats = (slug: string) => columnCategoriesForTreatment(slug)

function ctaBand() {
  return html`
  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="cta-band reveal epilogue-band">
        <h2>다음 이야기는, 당신의 차례입니다</h2>
        <p>정확한 진단은 직접 상담을 통해 받아보실 수 있습니다.</p>
        <div class="actions">
          <a href="/reservation" class="btn btn-accent"><i class="fa-solid fa-calendar-check"></i> 예약 문의</a>
          <a href="tel:${CLINIC.phoneRaw}" class="btn btn-ghost"><i class="fa-solid fa-phone"></i> ${CLINIC.phone}</a>
        </div>
      </div>
    </div>
  </section>`
}
