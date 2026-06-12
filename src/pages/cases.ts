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
  let filtered = cases
  if (filter.cat) filtered = filtered.filter(c => c.category === filter.cat)
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
      <!-- 필터 -->
      <div class="reveal" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:36px">
        <a href="/cases" class="tag-pill" style="${!filter.cat ? 'background:var(--brand);color:#fff' : ''}">전체</a>
        ${raw(TREATMENTS.filter(t => t.core).map(t => `
          <a href="/cases?cat=${t.slug}" class="tag-pill" style="${filter.cat === t.slug ? 'background:var(--brand);color:#fff' : ''}">${t.name}</a>`).join(''))}
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
        <div class="case-grid">
          ${raw(filtered.map((c, i) => caseCard(c, loggedIn, catName, docName, i)).join(''))}
        </div>
      `}
    </div>
  </section>
  ${ctaBand()}
  `
  return Page({
    title: filter.cat ? `${catName(filter.cat)} 비포애프터 | 진료사례 | 올케어치과` : '비포/애프터 진료사례 | 올케어치과',
    description: '약수역 올케어치과 임플란트·교정·심미보철 치료 전후 진료사례. 치료 결과는 개인에 따라 차이가 있을 수 있습니다.',
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

  return `
  <article class="case-card reveal reveal-d${(i % 3) + 1}">
    
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
      <h4 class="case-story-line">${storyLine(c)}</h4>
      <p style="font-size:14px;color:var(--gray-600);margin-bottom:8px">${c.description}</p>
      <div class="tags">
        ${c.ageGroup ? `<i class="fa-solid fa-user"></i> ${c.ageGroup} ${c.gender || ''} · ` : ''}
        ${c.period ? `<i class="fa-solid fa-clock"></i> ${c.period} · ` : ''}
        ${c.region ? `<i class="fa-solid fa-location-dot"></i> ${c.region}` : ''}
      </div>
      ${c.doctor ? `<a href="/doctors/${c.doctor}" style="display:inline-block;margin-top:10px;font-size:13px;font-weight:600;color:var(--brand-accent)">담당: ${docName(c.doctor)} 원장 <i class="fa-solid fa-arrow-right" style="font-size:11px"></i></a>` : ''}
    </div>
  </article>`
}

// 미니 우화 한 줄: "옥수동 50대 K님의 4개월" 식의 스토리 타이틀 (§B: 사실 정보만 조합)
function storyLine(c: CaseItem): string {
  const who = [c.region, c.ageGroup, c.gender ? c.gender + '님' : '님'].filter(Boolean).join(' ')
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
