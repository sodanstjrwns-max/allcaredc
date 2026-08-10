import { html, raw } from 'hono/html'
import { Page, PageHero } from '../components/page'
import { breadcrumbSchema } from '../components/layout'
import { CLINIC, TREATMENTS, DOCTORS } from '../data/clinic'

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
}

// ============================================================
// 비포애프터 목록 /cases  (?cat= / ?doctor= 필터)
// ============================================================
export function CasesPage(cases: CaseItem[], loggedIn: boolean, filter: { cat?: string; doctor?: string }) {
  // 전체를 렌더하고 클라이언트에서 즉시 필터(필터 UX 일관성). doctor 필터만 서버 적용.
  let filtered = cases
  if (filter.doctor) filtered = filtered.filter(c => c.doctor === filter.doctor)

  const catName = (slug: string) => TREATMENTS.find(t => t.slug === slug)?.name || slug
  const docName = (slug: string) => DOCTORS.find(d => d.slug === slug)?.name || ''

  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '진료사례', url: '/cases' }],
    chapter: 'Stories of Recovery',
    title: '먼저 다녀간 이야기',
    desc: '한 사람의 불편이 회복으로 바뀌는 과정의 기록입니다. 치료 결과는 개인의 상태에 따라 차이가 있을 수 있습니다.',
  })}

  <section class="section">
    <div class="container">
      <!-- 필터 (클라이언트 즉시 필터) -->
      <div class="reveal case-filter" id="caseFilter" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center">
        <button type="button" class="tag-pill case-fbtn${!filter.cat ? ' active' : ''}" data-cat="all">전체</button>
        ${raw(TREATMENTS.filter(t => t.core).map(t => `
          <button type="button" class="tag-pill case-fbtn${filter.cat === t.slug ? ' active' : ''}" data-cat="${t.slug}">${t.name}</button>`).join(''))}
        <span id="caseCount" style="margin-left:auto;font-size:13px;color:var(--gray-600)"></span>
      </div>

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
          ${raw(filtered.map((c, i) => caseCard(c, loggedIn, catName, docName, i)).join(''))}
        </div>
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
        </div>
      </div>
    </div>
  </div>
  ${ctaBand()}
  `
  return Page({
    title: filter.cat ? `${catName(filter.cat)} 비포애프터 | 진료사례 | 올케어치과` : '비포/애프터 진료사례 | 올케어치과',
    description: '약수역 올케어치과의 실제 임플란트·치아교정·심미보철 치료 전후(Before/After) 진료사례 모음. 동의를 받은 케이스만 공개하며, 파노라마·구강 사진으로 치료 과정을 투명하게 안내합니다. 치료 결과는 개인의 구강 상태에 따라 차이가 있을 수 있습니다.',
    path: '/cases',
    schema: [breadcrumbSchema([{ name: '홈', url: '/' }, { name: '진료사례', url: '/cases' }])],
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
    data-title="${esc(storyLine(c))}" data-cat-name="${esc(catName(c.category))}"
    data-desc="${esc(c.description)}" data-tags="${esc(tagsHtml)}"
    data-doctor="${esc(c.doctor || '')}" data-doctor-name="${esc(docName(c.doctor) ? docName(c.doctor) + ' 원장' : '')}">
    
    <div class="ba-slider${loggedIn ? '' : ' locked'}">
      ${beforeSrc ? `<img src="${beforeSrc}" alt="${c.title} 치료 전" loading="lazy">` : `<div style="position:absolute;inset:0;display:grid;place-items:center;color:var(--gray-400);background:var(--gray-100)"><i class="fa-solid fa-image" style="font-size:32px"></i></div>`}
      <span class="ba-label before">Before</span>
      ${loggedIn && afterSrc ? `
        <div class="ba-after-wrap"><img src="${afterSrc}" alt="${c.title} 치료 후" loading="lazy"></div>
        <span class="ba-label after">After</span>
        <div class="ba-handle"></div>
      ` : `
        <div class="gate">
          <div>
            <i class="fa-solid fa-lock"></i>
            <p style="font-weight:700;margin-bottom:4px">After 사진</p>
            <p style="font-size:13px;opacity:.85;margin-bottom:14px">로그인 후 확인하실 수 있습니다</p>
            <a href="/auth/login?next=/cases" class="btn btn-accent" style="padding:8px 18px;font-size:13px">로그인</a>
          </div>
        </div>
      `}
    </div>
    <div class="case-meta">
      <span class="case-story-no">Story ${String(i + 1).padStart(2, '0')} · ${catName(c.category)}</span>
      <h2 class="case-story-line">${storyLine(c)}</h2>
      <p style="font-size:14px;color:var(--gray-600);margin-bottom:8px">${c.description}</p>
      <div class="tags">
        ${c.ageGroup ? `<i class="fa-solid fa-user"></i> ${c.ageGroup} ${c.gender || ''} · ` : ''}
        ${c.period ? `<i class="fa-solid fa-clock"></i> ${c.period} · ` : ''}
        ${c.region ? `<i class="fa-solid fa-location-dot"></i> ${c.region}` : ''}
      </div>
      ${c.doctor ? `<a href="/doctors/${c.doctor}" style="display:inline-block;margin-top:10px;font-size:13px;font-weight:600;color:var(--brand-accent)">담당: ${docName(c.doctor)} 원장 <i class="fa-solid fa-arrow-right" style="font-size:11px"></i></a>` : ''}
      <button type="button" class="case-detail-btn" aria-label="진료사례 자세히 보기"><i class="fa-solid fa-up-right-and-down-left-from-center"></i> 자세히 보기</button>
    </div>
  </article>`
}

// 미니 우화 한 줄: "옥수동 50대 K님의 4개월" 식의 스토리 타이틀 (§B: 사실 정보만 조합)
function storyLine(c: CaseItem): string {
  const who = [c.region, c.ageGroup, c.gender ? c.gender + ' 환자분' : '환자분'].filter(Boolean).join(' ')
  const span = c.period ? `의 ${c.period}` : '의 이야기'
  return who ? `${who}${span}` : c.title
}

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
