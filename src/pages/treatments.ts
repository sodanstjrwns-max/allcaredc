import { html, raw } from 'hono/html'
import { Page, PageHero } from '../components/page'
import { breadcrumbSchema, faqSchema, schemaTag } from '../components/layout'
import {
  CLINIC, TREATMENTS, CORE_TREATMENTS, SUB_TREATMENTS, TX_IMAGES,
  getTreatment, doctorsForTreatment, Treatment,
} from '../data/clinic'
import { speakableSchema, autoLinkBody } from '../lib/seo-engine'
import { truncate } from '../lib/text'

const SPEC_LABEL: Record<string, string> = {
  implant: '임플란트', surgery: '구강외과', tmj: '턱관절', conservative: '보존치료',
  prosthetics: '보철', gum: '잇몸치료', esthetic: '심미보철', denture: '틀니',
}

// ============================================================
// 진료 목록 페이지 /treatments
// ============================================================
export function TreatmentsIndex() {
  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '진료안내', url: '/treatments' }],
    chapter: 'Chapter 02 — The Meeting',
    title: '진료안내',
    desc: '불편이 해답을 만나는 자리. 구강악안면외과·통합치의학과·보철과 전문의가 함께하는 올케어치과의 진료 영역입니다.',
  })}

  <section class="section">
    <div class="container">
      <div class="section-head reveal">
        <span class="sec-label"><span class="num">01</span> Core Treatments</span>
        <h2 class="split-rise">깊이 있게 책임지는 <em>세 가지</em></h2>
      </div>
      <div class="tx-grid">
        ${raw(CORE_TREATMENTS.map((t, i) => `
          <a href="/treatments/${t.slug}" class="tx-card reveal reveal-d${i + 1}">
            <div class="tx-bg"><img src="${TX_IMAGES[t.slug] || '/static/img/interior.webp'}" alt="${t.name}" loading="lazy" data-drift="14"></div>
            <div class="tx-content">
              <span class="tx-no">0${i + 1} · ${t.name}</span>
              <h3>${t.hero}</h3>
              <p>${t.short}</p>
              <span class="tx-link">자세히 보기 <i class="fa-solid fa-arrow-right"></i></span>
            </div>
          </a>`).join(''))}
      </div>

      <div class="section-head reveal" style="margin-top:80px">
        <span class="sec-label"><span class="num">02</span> General Care</span>
        <h2 class="split-rise">일상의 모든 <em>치과 진료</em></h2>
      </div>
      <div class="tx-sub-grid">
        ${raw(SUB_TREATMENTS.map((t, i) => `
          <a href="/treatments/${t.slug}" class="tx-sub reveal reveal-d${(i % 3) + 1}">
            <span class="ico"><i class="fa-solid fa-${t.icon}"></i></span>
            <span><strong>${t.name}</strong><br><span>${truncate(t.short, 28)}</span></span>
          </a>`).join(''))}
      </div>
    </div>
  </section>
  ${ctaBand()}
  `
  return Page({
    title: '진료안내 | 임플란트·교정·심미보철·수면진료 | 올케어치과',
    description: '약수역 올케어치과 진료안내. 임플란트, 치아교정, 심미보철 등 핵심 진료부터 충치·신경·잇몸·턱관절·사랑니까지 3인 전문의가 진료합니다.',
    path: '/treatments',
    schema: [breadcrumbSchema([{ name: '홈', url: '/' }, { name: '진료안내', url: '/treatments' }])],
  }, body)
}

// ============================================================
// 진료 상세 페이지 /treatments/:slug
// ============================================================
export function TreatmentDetail(slug: string) {
  const t = getTreatment(slug)
  if (!t) return null
  const docs = doctorsForTreatment(slug)
  const related = TREATMENTS.filter(x => x.slug !== slug).slice(0, 5)
  const BASE = `https://${CLINIC.domain}`
  const pageUrl = `${BASE}/treatments/${slug}`

  // ── MedicalProcedure (부가티급: 시술 분류·신체부위·준비·예후·세부시술 연결) ──
  const procTypeMap: Record<string, string> = {
    implant: 'SurgicalProcedure', surgery: 'SurgicalProcedure', gum: 'TherapeuticProcedure',
    conservative: 'TherapeuticProcedure', sleep: 'TherapeuticProcedure', tmj: 'TherapeuticProcedure',
  }
  const procedureSchema: any = {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    '@id': `${pageUrl}#procedure`,
    name: t.name,
    alternateName: (t.keywords || []).slice(0, 3),
    description: t.intro,
    url: pageUrl,
    procedureType: procTypeMap[slug]
      ? { '@type': 'MedicalProcedureType', name: procTypeMap[slug] }
      : { '@type': 'MedicalProcedureType', name: 'NoninvasiveProcedure' },
    howPerformed: (t.steps || []).map(s => `${s.t}: ${s.d}`).join(' / '),
    // 세부 시술을 MedicalProcedure 하위 항목으로 연결 (지식그래프 강화)
    potentialAction: (t.subProcedures || []).map(sp => ({
      '@type': 'MedicalProcedure', name: sp.name, description: sp.desc,
    })),
    bodyLocation: '구강·치아·잇몸',
    preparation: (t.steps && t.steps[0]) ? `${t.steps[0].t} — ${t.steps[0].d}` : '정밀 진단 및 상담',
    followup: '정기 점검 및 유지관리 (개인별 상태에 따라 안내)',
    relevantSpecialty: { '@type': 'MedicalSpecialty', name: SPEC_LABEL[slug] || '치과' },
    provider: {
      '@type': 'Dentist', '@id': `${BASE}/#clinic`, name: CLINIC.name,
      telephone: CLINIC.phone, url: `${BASE}/`,
    },
  }

  // ── HowTo (구글 리치결과 + AI 단계형 답변): 진료 진행 단계 ──
  const howToSchema = (t.steps && t.steps.length) ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `${t.name} 진료는 이렇게 진행됩니다`,
    description: `${CLINIC.name}의 ${t.name} 진료 진행 단계 안내.`,
    totalTime: undefined,
    step: t.steps.map((s, i) => ({
      '@type': 'HowToStep', position: i + 1, name: s.t, text: s.d,
      url: `${pageUrl}#step-${i + 1}`,
    })),
  } : null

  // ── MedicalWebPage (about·mainEntity·관련 링크·신뢰 신호 강화) ──
  const medWebPage: any = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    '@id': `${pageUrl}#webpage`,
    name: `${t.name} - ${CLINIC.name}`,
    url: pageUrl,
    description: t.short,
    inLanguage: 'ko',
    lastReviewed: '2026-05-20',
    reviewedBy: docs.length
      ? { '@type': 'Physician', name: docs[0].name, medicalSpecialty: (docs[0] as any).titleLine || docs[0].role }
      : { '@type': 'Organization', name: CLINIC.name },
    about: { '@id': `${pageUrl}#procedure` },
    mainEntity: { '@id': `${pageUrl}#procedure` },
    isPartOf: { '@type': 'WebSite', '@id': `${BASE}/#website`, name: CLINIC.name },
    significantLink: related.map(r => `${BASE}/treatments/${r.slug}`),
    audience: { '@type': 'MedicalAudience', name: 'Patient', geographicArea: { '@type': 'AdministrativeArea', name: '서울특별시 중구' } },
  }

  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '진료안내', url: '/treatments' }, { name: t.name, url: `/treatments/${slug}` }],
    chapter: `A Story of ${t.name}`,
    title: t.name,
    desc: t.hero,
  })}

  <section class="section">
    <div class="container">
      <div class="grid-detail">
        <!-- 본문 -->
        <article class="prose reveal">
          ${t.core && TX_IMAGES[t.slug] ? html`<img src="${TX_IMAGES[t.slug]}" alt="${t.name}" style="border-radius:var(--radius-lg);margin-bottom:30px;width:100%;aspect-ratio:16/9;object-fit:cover" loading="lazy">` : ''}

          <p class="tx-intro-lead" style="font-size:1.2rem;color:var(--ink);font-weight:500">${t.intro}</p>

          ${(() => {
            const curPath = `/treatments/${slug}`
            const linkedSet = new Set<string>()
            return raw(t.sections.map(s => `
            <h2 class="split-rise">${s.h}</h2>
            <p>${autoLinkBody(s.p, curPath, { maxLinks: 3, linkedSet })}</p>
          `).join(''))
          })()}

          ${t.steps ? html`
            <h2 class="split-rise">진료는 <em>이렇게</em> 진행됩니다</h2>
            <div class="steps">
              ${raw(t.steps.map((s, i) => `
                <div class="step" id="step-${i + 1}">
                  <div class="n">${i + 1}</div>
                  <div class="step-body">
                    <h4>${s.t}</h4>
                    <p>${s.d}</p>
                  </div>
                </div>`).join(''))}
            </div>
          ` : ''}

          ${t.subProcedures ? html`
            <h2 class="split-rise">세부 <em>진료</em></h2>
            <ul class="check">
              ${raw(t.subProcedures.map(sp => `<li><strong>${sp.name}</strong> — ${sp.desc}</li>`).join(''))}
            </ul>
          ` : ''}

          <!-- FAQ -->
          <h2 class="split-rise" style="margin-top:50px">자주 묻는 <em>질문</em></h2>
          <div class="faq" style="margin-top:10px">
            ${raw(t.faqs.map(f => `
              <div class="faq-item">
                <button class="faq-q">${f.q}<span class="pm"><i class="fa-solid fa-plus"></i></span></button>
                <div class="faq-a"><div class="faq-a-inner">${f.a}</div></div>
              </div>`).join(''))}
          </div>
        </article>

        <!-- 사이드바 (인링크) -->
        <aside class="reveal reveal-d2">
          <div class="inlink-box" style="background:var(--brand);color:#fffeee;margin-bottom:20px">
            <h4 style="color:#fffeee">상담이 필요하신가요?</h4>
            <p style="font-size:14px;color:rgba(255,255,255,.8);margin-bottom:18px">${t.name}에 대해 더 궁금한 점은 편하게 문의해 주세요.</p>
            <a href="/reservation" class="btn btn-accent" style="width:100%;justify-content:center;margin-bottom:10px">예약 문의</a>
            <a href="tel:${CLINIC.phoneRaw}" class="btn btn-ghost" style="width:100%;justify-content:center">${CLINIC.phone}</a>
          </div>

          ${docs.length ? html`
            <div class="inlink-box" style="margin-bottom:20px">
              <h4><i class="fa-solid fa-user-doctor text-mint"></i> 담당 의료진</h4>
              ${raw(docs.map(d => `
                <a href="/doctors/${d.slug}">
                  <span>${d.name} ${d.role}</span>
                  <i class="fa-solid fa-arrow-right" style="font-size:12px"></i>
                </a>`).join(''))}
            </div>
          ` : ''}

          <div class="inlink-box" style="margin-bottom:20px">
            <h4><i class="fa-solid fa-images text-mint"></i> 관련 진료사례</h4>
            <a href="/cases?cat=${t.slug}"><span>${t.name} 비포/애프터</span><i class="fa-solid fa-arrow-right" style="font-size:12px"></i></a>
            <a href="/cases"><span>전체 진료사례 보기</span><i class="fa-solid fa-arrow-right" style="font-size:12px"></i></a>
          </div>

          <div class="inlink-box">
            <h4><i class="fa-solid fa-link text-mint"></i> 다른 진료</h4>
            ${raw(related.map(r => `
              <a href="/treatments/${r.slug}"><span>${r.name}</span><i class="fa-solid fa-arrow-right" style="font-size:12px"></i></a>`).join(''))}
          </div>
        </aside>
      </div>
    </div>
  </section>
  ${ctaBand()}
  `

  const docNames = docs.map(d => d.name).join('·')
  const subNames = (t.subProcedures || []).map(sp => sp.name).slice(0, 4).join('·')
  const metaDesc = `약수역 5번 출구 1분, 올케어치과 ${t.name}. ${t.short}${docNames ? ` ${docNames} 전문의가 진단부터 진행합니다.` : ''}${subNames ? ` ${subNames} 등 안내.` : ''}`.slice(0, 158)
  return Page({
    title: `${t.name} | 약수역 ${t.name} 치과 - 올케어치과`,
    description: metaDesc,
    path: `/treatments/${slug}`,
    ogImage: `https://${CLINIC.domain}/og/treatment/${slug}.svg`,
    keywords: `${t.name},약수역 ${t.name},약수역 치과,신당동 ${t.name},중구 치과,올케어치과${docNames ? ',' + docNames : ''}${subNames ? ',' + subNames.replace(/·/g, ',') : ''}`,
    schema: [
      breadcrumbSchema([{ name: '홈', url: '/' }, { name: '진료안내', url: '/treatments' }, { name: t.name, url: `/treatments/${slug}` }]),
      procedureSchema,
      ...(howToSchema ? [howToSchema] : []),
      medWebPage, faqSchema(t.faqs),
      speakableSchema(['.tx-intro-lead', '.answer-box', 'h1', 'h2']),
    ],
  }, body)
}

function ctaBand() {
  return html`
  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="cta-band reveal">
        <h2 class="split-rise">불편한 곳이 <em>있으신가요?</em></h2>
        <p>${CLINIC.philosophy}</p>
        <div class="actions">
          <a href="/reservation" class="btn btn-accent"><i class="fa-solid fa-calendar-check"></i> 예약 문의</a>
          <a href="tel:${CLINIC.phoneRaw}" class="btn btn-ghost"><i class="fa-solid fa-phone"></i> ${CLINIC.phone}</a>
        </div>
      </div>
    </div>
  </section>`
}
