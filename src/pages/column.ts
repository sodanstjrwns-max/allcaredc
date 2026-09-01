import { html, raw } from 'hono/html'
import { Page, PageHero } from '../components/page'
import { breadcrumbSchema } from '../components/layout'
import { CLINIC, TREATMENTS, DOCTORS, getDoctor, getTreatment, columnCategoryName, treatmentForColumnCategory, COLUMN_CATEGORIES } from '../data/clinic'

export type ColumnFAQ = { q: string; a: string }

export type Column = {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string          // HTML (H태그 포함)
  author: string        // doctor slug
  category: string      // treatment slug
  thumbnail?: string
  thumbnailAlt?: string // 대표 이미지 대체텍스트 (SEO)
  metaTitle?: string
  metaDesc?: string
  keywords?: string[]   // SEO 키워드
  faqs?: ColumnFAQ[]    // 자주 묻는 질문 → FAQPage 스키마
  relatedSlugs?: string[] // §S20②: '함께 보면 좋은 글' 관리자 수동 지정(칼럼 slug) — 비면 같은 카테고리 최신순 자동
  published: boolean
  createdAt: number
  updatedAt: number
}

const txName = (s: string) => columnCategoryName(s)
const docName = (s: string) => getDoctor(s)?.name || ''

// §S7: 날짜 버그 방어 — createdAt이 없거나 1970-01-01 이전(0·undefined·Invalid)이면
// updatedAt → 그마저 이상하면 오늘 날짜로 폴백해 '1969.12.25' 같은 오표기를 방지
const MIN_VALID = Date.UTC(2000, 0, 1) // 2000-01-01 이전 값은 손상된 것으로 간주
function safeDate(...cands: (number | undefined)[]): number {
  for (const t of cands) {
    if (typeof t === 'number' && !isNaN(t) && t >= MIN_VALID) return t
  }
  return Date.now()
}
const fmtDate = (createdAt?: number, updatedAt?: number) =>
  new Date(safeDate(createdAt, updatedAt)).toLocaleDateString('ko-KR')

// §S20②: '함께 보면 좋은 글' 선정 — 수동 지정(relatedSlugs) 우선, 부족분은
//   같은 카테고리 최신순 → 그래도 부족하면 전체 최신순으로 채움 (항상 최대 3개)
export function pickRelatedColumns(current: Column, all: Column[], max = 3): Column[] {
  const pool = all.filter(c => c.published && c.id !== current.id)
  const picked: Column[] = []
  for (const slug of current.relatedSlugs || []) {
    const f = pool.find(c => c.slug === slug)
    if (f && !picked.includes(f)) picked.push(f)
    if (picked.length >= max) return picked
  }
  const byDate = (a: Column, b: Column) => safeDate(b.createdAt, b.updatedAt) - safeDate(a.createdAt, a.updatedAt)
  for (const c of pool.filter(c => c.category === current.category).sort(byDate)) {
    if (!picked.includes(c)) picked.push(c)
    if (picked.length >= max) return picked
  }
  for (const c of pool.sort(byDate)) {
    if (!picked.includes(c)) picked.push(c)
    if (picked.length >= max) return picked
  }
  return picked
}

// 칼럼 카드 마크업 (목록·함께 보면 좋은 글·진료페이지 하단 공용)
export function columnCardHtml(col: Column, i = 0): string {
  return `
    <a href="/column/${col.slug}" class="doc-card reveal reveal-d${(i % 3) + 1}">
      <div class="doc-photo" style="aspect-ratio:1200/630;background:linear-gradient(135deg,var(--brand),var(--brand-accent))">
        ${col.thumbnail ? `<img src="${col.thumbnail}" alt="${col.title}" loading="lazy">` : `<div class="ph" style="color:rgba(255,255,255,.5)"><i class="fa-solid fa-pen-nib"></i></div>`}
      </div>
      <div class="doc-body">
        <span class="role">${txName(col.category)}</span>
        <h3 style="font-size:1.1rem;line-height:1.4">${col.title}</h3>
        <p class="title-line" style="min-height:auto;margin-top:8px;font-size:14px">${col.excerpt}</p>
        <p style="font-size:13px;color:var(--gray-400);margin-top:12px">${docName(col.author) ? `${docName(col.author)} 원장 · ` : ''}${fmtDate(col.createdAt, col.updatedAt)}</p>
      </div>
    </a>`
}

// ── 칼럼 목록 /column (§S20⑤: ?cat= 카테고리 필터 지원 — 비포애프터에서 역링크로 진입) ──
export function ColumnIndex(columns: Column[], cat?: string) {
  let pub = columns.filter(c => c.published)
  const catName = cat ? txName(cat) : ''
  // 구 별칭 카테고리(periodontal→gum 등)도 같은 표기명이면 함께 노출
  if (cat) pub = pub.filter(c => c.category === cat || txName(c.category) === catName)
  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '원장 칼럼', url: '/column' }],
    chapter: 'Notes from the Clinic',
    title: cat ? `원장 칼럼 — ${catName}` : '원장 칼럼',
    desc: '진료실에서 자주 받는 질문, 알아두면 좋은 치과 이야기를 의료진이 직접 씁니다.',
  })}
  <section class="section">
    <div class="container">
      <!-- §S20⑤: 카테고리 필터 핌 -->
      <div class="reveal" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:26px">
        <a href="/column" class="tag-pill${!cat ? ' active' : ''}">전체</a>
        ${raw(COLUMN_CATEGORIES.filter(cc => columns.some(c => c.published && txName(c.category) === cc.name)).map(cc =>
          `<a href="/column?cat=${cc.slug}" class="tag-pill${cat === cc.slug ? ' active' : ''}">${cc.name}</a>`).join(''))}
      </div>
      ${pub.length === 0 ? html`
        <div class="reveal" style="text-align:center;padding:80px 0;color:var(--gray-600)">
          <i class="fa-solid fa-pen-nib" style="font-size:48px;color:var(--gray-200);margin-bottom:16px"></i>
          <p>곧 첫 칼럼이 발행됩니다. 조금만 기다려 주세요.</p>
        </div>
      ` : html`
        <div class="doc-grid">
          ${raw(pub.map((col, i) => columnCardHtml(col, i)).join(''))}
        </div>
      `}
    </div>
  </section>`
  return Page({
    title: cat ? `${catName} 칼럼 | 원장 칼럼 | 365올케어치과` : '원장 칼럼 | 365올케어치과',
    description: '약수역 365올케어치과 의료진이 직접 쓰는 치과 칼럼. 임플란트, 치아교정, 심미보철, 잇몸·사랑니·턱관절까지 꼭 알아야 할 진료 정보와 치료 전 체크포인트를 구강악안면외과·보철과 전문의가 환자 눈높이로 알기 쉽게 설명합니다.',
    path: '/column',
    schema: [breadcrumbSchema([{ name: '홈', url: '/' }, { name: '원장 칼럼', url: '/column' }])],
  }, body)
}

// ── 칼럼 상세 /column/:slug ──
// §S20: allColumns 전달 → '함께 보면 좋은 글' 3카드 자동 노출
export function ColumnDetail(col: Column, views: number, allColumns: Column[] = []) {
  const author = getDoctor(col.author)
  // §S20③: 카테고리→진료 페이지 자동 매핑 (resin-inlay→conservative 등 별칭 흡수)
  const related = treatmentForColumnCategory(col.category)
  const relatedCols = pickRelatedColumns(col, allColumns)

  const articleSchema: any = {
    '@context': 'https://schema.org',
    '@type': ['Article', 'MedicalWebPage'],
    headline: col.metaTitle || col.title,
    description: col.metaDesc || col.excerpt,
    datePublished: new Date(safeDate(col.createdAt, col.updatedAt)).toISOString(),
    dateModified: new Date(safeDate(col.updatedAt, col.createdAt)).toISOString(),
    author: author ? { '@type': 'Person', name: `${author.name} ${author.role}`, jobTitle: author.titleLine } : undefined,
    reviewedBy: author ? { '@type': 'Person', name: `${author.name} ${author.role}` } : undefined,
    publisher: { '@type': 'Organization', name: CLINIC.name },
    ...(col.thumbnail ? { image: col.thumbnail } : {}),
    ...(col.keywords && col.keywords.length ? { keywords: col.keywords.join(', ') } : {}),
    inLanguage: 'ko-KR',
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://${CLINIC.domain}/column/${col.slug}` },
  }

  // FAQ 스키마 (구글 리치 결과 노출)
  const faqs = (col.faqs || []).filter(f => f.q && f.a)
  const faqSchema = faqs.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } : null

  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '원장 칼럼', url: '/column' }, { name: col.title, url: `/column/${col.slug}` }],
    title: col.title,
  })}
  <section class="section">
    <div class="container">
      <div class="grid-detail">
        <article class="reveal">
          <div style="display:flex;align-items:center;gap:14px;padding-bottom:24px;margin-bottom:30px;border-bottom:1px solid var(--gray-200);flex-wrap:wrap">
            <span class="tag-pill cat-tag">${txName(col.category)}</span>
            ${author ? html`<a href="/doctors/${author.slug}" style="font-weight:700;color:var(--brand)">${author.name} ${author.role}</a>` : ''}
            <span style="color:var(--gray-400);font-size:14px">${fmtDate(col.createdAt, col.updatedAt)}</span>
            <span style="color:var(--gray-400);font-size:14px;margin-left:auto"><i class="fa-solid fa-eye"></i> ${views.toLocaleString()}</span>
          </div>
          ${col.thumbnail ? html`<img src="${col.thumbnail}" alt="${col.thumbnailAlt || col.title}" style="border-radius:var(--radius-lg);margin-bottom:30px" loading="lazy">` : ''}
          <div class="prose">${raw(col.body)}</div>

          ${faqs.length ? html`
            <section class="col-faq" aria-label="자주 묻는 질문">
              <h2 class="col-faq-h"><i class="fa-solid fa-circle-question"></i> 자주 묻는 질문</h2>
              ${raw(faqs.map(f => `
                <details class="col-faq-item">
                  <summary>${f.q.replace(/</g, '&lt;')}</summary>
                  <div class="col-faq-a">${f.a.replace(/</g, '&lt;').replace(/\n/g, '<br>')}</div>
                </details>`).join(''))}
            </section>
          ` : ''}

          ${author ? html`
            <div style="background:var(--beige-soft);border-radius:var(--radius);padding:24px;margin-top:40px;display:flex;gap:16px;align-items:center">
              ${author.photo ? html`<img src="${author.photo}" alt="${author.name} ${author.role}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;object-position:top;flex-shrink:0" loading="lazy">` : html`<div style="width:60px;height:60px;border-radius:50%;background:var(--brand);color:#fffeee;display:grid;place-items:center;font-size:24px;flex-shrink:0"><i class="fa-solid fa-user-doctor"></i></div>`}
              <div>
                <p style="font-size:13px;color:var(--gray-600)">이 글을 작성·감수한 의료진</p>
                <a href="/doctors/${author.slug}" style="font-weight:800;font-size:1.1rem;color:var(--brand)">${author.name} ${author.role}</a>
                <p style="font-size:13px;color:var(--gray-600)">${author.titleLine}</p>
              </div>
              <a href="/doctors/${author.slug}" class="btn btn-outline" style="margin-left:auto;padding:9px 16px;font-size:13px;white-space:nowrap">프로필 보기</a>
            </div>
          ` : ''}

          <!-- §S20③: 본문 하단 CTA — 카테고리별 진료 페이지 자동 연결 (모바일에서는 사이드바가 맨 아래로 밀려나는 문제 보완) -->
          <div class="col-cta-row">
            <a href="${related ? `/treatments/${related.slug}` : '/treatments'}" class="btn btn-primary"><i class="fa-solid fa-tooth"></i> ${related ? `${related.name} 진료 소개` : '진료 소개'}</a>
            <a href="/reservation" class="btn btn-accent"><i class="fa-solid fa-calendar-check"></i> 예약 문의</a>
            <a href="tel:${CLINIC.phoneRaw}" class="btn btn-outline"><i class="fa-solid fa-phone"></i> 전화 상담</a>
          </div>
          <p style="font-size:12.5px;color:var(--gray-400);margin-top:20px">※ 본 칼럼은 일반적인 정보 제공을 위한 것으로 개인의 진단·치료를 대신하지 않습니다. 최종 검토일: ${fmtDate(col.updatedAt, col.createdAt)}</p>
        </article>

        <aside class="reveal reveal-d2">
          ${related ? html`
            <div class="inlink-box" style="margin-bottom:20px">
              <h3><i class="fa-solid fa-tooth text-mint"></i> 관련 진료</h3>
              <a href="/treatments/${related.slug}"><span>${related.name} 자세히 보기</span><i class="fa-solid fa-arrow-right" style="font-size:12px"></i></a>
              <a href="/cases?cat=${related.slug}"><span>${related.name} 진료사례</span><i class="fa-solid fa-arrow-right" style="font-size:12px"></i></a>
            </div>
          ` : ''}
          <div class="inlink-box" style="background:var(--brand);color:#fffeee">
            <h3 style="color:#fffeee">상담이 필요하신가요?</h3>
            <a href="/reservation" class="btn btn-accent" style="width:100%;justify-content:center;margin:14px 0 10px">예약 문의</a>
            <a href="tel:${CLINIC.phoneRaw}" class="btn btn-ghost" style="width:100%;justify-content:center">${CLINIC.phone}</a>
          </div>
        </aside>
      </div>

      ${relatedCols.length ? html`
        <!-- §S20②: 함께 보면 좋은 글 (수동 지정 우선, 자동 보충) -->
        <section aria-label="함께 보면 좋은 글" style="margin-top:70px">
          <div class="section-head reveal" style="margin-bottom:26px">
            <h2 style="font-size:1.5rem"><i class="fa-solid fa-book-open text-mint"></i> 함께 보면 좋은 글</h2>
          </div>
          <div class="doc-grid">
            ${raw(relatedCols.map((r, i) => columnCardHtml(r, i)).join(''))}
          </div>
        </section>
      ` : ''}
    </div>
  </section>`
  // §S20⑨: 대표 이미지 → OG 썸네일 (카톡·인스타 공유 미리보기). 상대경로면 절대 URL로 변환
  const ogImage = col.thumbnail
    ? (col.thumbnail.startsWith('http') ? col.thumbnail : `https://${CLINIC.domain}${col.thumbnail}`)
    : undefined
  return Page({
    title: col.metaTitle || `${col.title} | 원장 칼럼 | 365올케어치과`,
    description: col.metaDesc || col.excerpt,
    path: `/column/${col.slug}`,
    ogImage,
    ogType: 'article',
    schema: [
      breadcrumbSchema([{ name: '홈', url: '/' }, { name: '원장 칼럼', url: '/column' }, { name: col.title, url: `/column/${col.slug}` }]),
      articleSchema,
      ...(faqSchema ? [faqSchema] : []),
    ],
  }, body)
}

// 시드 칼럼 (초기 콘텐츠)
export const SEED_COLUMNS: Column[] = [
  {
    id: 'c_seed1', slug: 'implant-bone-graft', title: '뼈가 부족해도 임플란트가 가능할까요?',
    excerpt: '다른 곳에서 뼈가 부족하다는 말을 들으셨다면, 골이식과 상악동 거상에 대해 알아두시면 도움이 됩니다.',
    category: 'implant', author: 'kwon-minsoo', published: true,
    body: `<p>임플란트 상담을 받다 보면 "뼈가 부족해서 어렵다"는 말을 듣고 돌아서는 분들이 계십니다. 하지만 잇몸뼈가 부족하다고 해서 임플란트를 포기해야 하는 것은 아닙니다.</p>
<h2>왜 뼈가 부족해지나요?</h2>
<p>치아가 빠진 자리는 시간이 지나면서 잇몸뼈가 점점 흡수됩니다. 또한 잇몸 질환(치주염)이 오래 진행되었거나, 윗턱 어금니 부위는 상악동(부비동)이 가까워 식립에 필요한 뼈가 얕은 경우가 많습니다.</p>
<h2>골이식이란?</h2>
<p>골이식은 부족한 잇몸뼈를 보충해 임플란트가 안정적으로 자리 잡을 수 있는 토대를 만드는 술식입니다. 발치와 동시에 뼈를 보존하기도 하고, 식립과 함께 진행하기도 합니다.</p>
<h2>상악동 거상술</h2>
<p>윗턱 어금니 부위 뼈가 얕을 때는 상악동을 조심스럽게 들어 올려 공간을 확보합니다. 이는 외과적 경험이 결과를 좌우하는 술식으로, 구강악안면외과 전문의의 정밀한 진단이 중요합니다.</p>
<div class="answer-box">뼈가 부족하다는 진단을 받으셨더라도, 영상 진단을 통해 골이식·상악동 거상 등의 방법으로 식립 가능 여부를 다시 살펴볼 수 있습니다.</div>
<p>무리하게 한 번에 진행하기보다, 뼈가 자리 잡는 시간을 존중하며 단계적으로 접근하는 것이 오래 쓰는 임플란트의 비결입니다.</p>`,
    createdAt: Date.now() - 86400000 * 7, updatedAt: Date.now() - 86400000 * 7,
  },
  {
    id: 'c_seed2', slug: 'ortho-adult-timing', title: '성인 교정, 지금 시작해도 늦지 않을까요?',
    excerpt: '교정에 나이 제한은 없습니다. 다만 성인 교정에서 꼭 챙겨야 할 것이 있습니다.',
    category: 'ortho', author: 'kwon-minsoo', published: true,
    body: `<p>"이 나이에 교정해도 될까요?" 진료실에서 정말 자주 받는 질문입니다. 결론부터 말씀드리면, 교정에 나이 제한은 없습니다.</p>
<h2>성인 교정의 장점</h2>
<p>성인은 치료의 필요성을 스스로 이해하고 협조도가 높아, 오히려 계획대로 진행되는 경우가 많습니다. 직장 생활 중에도 눈에 덜 띄는 투명교정이나 세라믹 교정을 선택할 수 있습니다.</p>
<h2>성인 교정에서 꼭 챙겨야 할 것</h2>
<p>성인은 잇몸 상태를 함께 관리하며 진행하는 것이 무엇보다 중요합니다. 잇몸뼈가 건강해야 치아가 안전하게 이동하기 때문입니다. 교정 전 잇몸 검진은 필수입니다.</p>
<div class="answer-box">잇몸이 건강하다면 성인도 충분히 교정이 가능합니다. 다만 교정 전·중 잇몸 관리가 동반되어야 안전합니다.</div>
<h2>교정의 완성은 유지장치</h2>
<p>교정의 진짜 완성은 장치를 떼는 날이 아니라 그 이후입니다. 유지장치를 성실히 착용해야 어렵게 만든 결과가 되돌아가지 않습니다.</p>`,
    createdAt: Date.now() - 86400000 * 3, updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'c_seed3', slug: 'inhouse-lab', title: '원내 기공실이 있으면 무엇이 다를까요?',
    excerpt: '보철은 치과의사와 기공사의 협업으로 완성됩니다. 원내 기공실의 차이를 설명드립니다.',
    category: 'esthetic', author: 'doctor-prostho', published: true,
    body: `<p>보철 치료를 받으실 때 "원내 기공실"이라는 말을 들어보셨을 겁니다. 이것이 왜 중요한지 말씀드리겠습니다.</p>
<h2>보철은 협업의 결과입니다</h2>
<p>크라운이나 라미네이트 같은 보철물은 치과의사가 설계하고 기공사가 제작합니다. 두 사람의 소통이 정밀할수록 결과가 자연스러워집니다.</p>
<h2>외부 기공소와의 차이</h2>
<p>외부 기공소를 거치면 보철물을 오가는 데 시간이 걸리고, 미세한 색과 형태의 의도가 전달되기 어렵습니다. 원내 기공실은 보철과 전문의와 상주 기공사가 직접 얼굴을 맞대고 조율합니다.</p>
<div class="answer-box">원내 기공실은 치과의사와 기공사의 직접 소통으로, 색·형태의 미세 조정이 빠르고 정확합니다.</div>
<p>그만큼 수정과 조정이 신속하고, 환자분의 입에 가장 자연스럽게 어울리는 보철을 만들 수 있습니다.</p>`,
    createdAt: Date.now() - 86400000, updatedAt: Date.now() - 86400000,
  },
]
