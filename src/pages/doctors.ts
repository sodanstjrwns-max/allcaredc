import { html, raw } from 'hono/html'
import { Page, PageHero } from '../components/page'
import { breadcrumbSchema } from '../components/layout'
import { CLINIC, DOCTORS, getDoctor, treatmentsForDoctor } from '../data/clinic'
import { speakableSchema } from '../lib/seo-engine'

// ============================================================
// 의료진 목록 /doctors
// ============================================================
export function DoctorsIndex() {
  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '의료진', url: '/doctors' }],
    chapter: 'Chapter 03 — The People',
    title: '의료진 소개',
    desc: '입안 전체를 하나의 그림으로 보는 협진. 분야별 전문의가 환자 한 분을 끝까지 함께합니다.',
  })}

  <section class="section">
    <div class="container">
      <div class="doc-grid">
        ${raw(DOCTORS.map((d, i) => `
          <a href="/doctors/${d.slug}" class="doc-card reveal reveal-d${i + 1}">
            <div class="doc-photo"><img src="${d.photo}" alt="${d.name} ${d.role}" loading="lazy" style="width:100%;height:100%;object-fit:cover;${d.imgPos || 'object-position:top center'}"></div>
            <div class="doc-body">
              <span class="role">${d.role}</span>
              <h2>${d.name}</h2>
              <p class="title-line">${d.titleLine}</p>
              <p class="doc-career">${d.cardLine || d.career[0]}</p>
              <div class="doc-tags">
                ${d.treatItems.map(t => `<span>${t}</span>`).join('')}
              </div>
            </div>
          </a>`).join(''))}
      </div>
    </div>
  </section>
  ${ctaBand()}
  `
  return Page({
    title: '의료진 소개 | 구강악안면외과·통합치의학과·보철과 전문의 | 365올케어치과',
    description: '약수역 365올케어치과 의료진. 구강악안면외과·통합치의학과 전문의, 보철과 전문의, 치의학박사가 함께하는 치과 전문의 협진 치과입니다.',
    path: '/doctors',
    schema: [breadcrumbSchema([{ name: '홈', url: '/' }, { name: '의료진', url: '/doctors' }])],
  }, body)
}

// ============================================================
// 의료진 개별 /doctors/:slug
// ============================================================
export function DoctorDetail(slug: string) {
  const d = getDoctor(slug)
  if (!d) return null
  const txs = treatmentsForDoctor(slug)
  const BASE = `https://${CLINIC.domain}`
  const pageUrl = `${BASE}/doctors/${slug}`
  const specName: Record<string, string> = {
    implant: 'OralAndMaxillofacialSurgery', surgery: 'OralAndMaxillofacialSurgery',
    tmj: 'Dentistry', conservative: 'Dentistry', prosthetics: 'Prosthodontics',
    gum: 'Periodontics', esthetic: 'Prosthodontics', denture: 'Prosthodontics', ortho: 'Orthodontic',
  }

  // ── Physician (부가티급: 의료 전문 타입 + 전문분야·소속·진료 연결) ──
  const personSchema: any = {
    '@context': 'https://schema.org',
    '@type': ['Physician', 'Person'],
    '@id': `${pageUrl}#physician`,
    name: d.name,
    jobTitle: `${d.role} / ${d.titleLine}`,
    description: d.intro,
    url: pageUrl,
    image: `${BASE}/og/doctor/${slug}.svg`,
    worksFor: { '@type': 'Dentist', '@id': `${BASE}/#clinic`, name: CLINIC.name, url: `${BASE}/` },
    workLocation: { '@type': 'Dentist', '@id': `${BASE}/#clinic`, name: CLINIC.name },
    alumniOf: d.education.map(e => ({ '@type': 'EducationalOrganization', name: e })),
    medicalSpecialty: [...new Set(d.specialties.map(s => specName[s]).filter(Boolean))],
    knowsAbout: txs.map(t => t.name),
    availableService: txs.map(t => ({
      '@type': 'MedicalProcedure', name: t.name, url: `${BASE}/treatments/${t.slug}`,
    })),
    knowsLanguage: 'ko',
  }

  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '의료진', url: '/doctors' }, { name: d.name + ' ' + d.role, url: `/doctors/${slug}` }],
    chapter: 'The People — Profile',
    title: `${d.name} ${d.role}`,
    desc: d.titleLine,
  })}

  <section class="section">
    <div class="container">
      <div class="grid-detail">
        <article class="reveal">
          <div class="grid-2" style="gap:36px;margin-bottom:40px;align-items:start">
            <div class="doc-photo" style="border-radius:var(--radius-lg);box-shadow:var(--shadow);aspect-ratio:4/4.6;overflow:hidden"><img src="${d.photo}" alt="${d.name} ${d.role}" style="width:100%;height:100%;object-fit:cover;${d.imgPos || 'object-position:top center'}"></div>
            <div>
              <span class="role" style="color:var(--brand-accent);font-weight:700">${d.role}</span>
              <h2 style="font-size:2rem;margin:6px 0 4px">${d.name}</h2>
              <p style="color:var(--gray-600);font-size:1.05rem;margin-bottom:20px">${d.titleLine}</p>
              <p style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold-600);font-weight:700;margin-bottom:10px">진료과목</p>
              <div class="doc-tags">
                ${raw(d.treatItems.map(t => `<span>${t}</span>`).join(''))}
              </div>
            </div>
          </div>

          <div class="prose">
            <div class="answer-box" style="font-size:1.1rem">${d.intro}</div>

            <h3><i class="fa-solid fa-briefcase-medical text-mint"></i> 경력 · 수련</h3>
            <ul class="check">
              ${raw(d.career.map(c => `<li>${c}</li>`).join(''))}
            </ul>

            <h3><i class="fa-solid fa-graduation-cap text-mint"></i> 학력</h3>
            <ul class="check">
              ${raw(d.education.map(e => `<li>${e}</li>`).join(''))}
            </ul>
          </div>
        </article>

        <aside class="reveal reveal-d2">
          <div class="inlink-box" style="background:var(--brand);color:#fffeee;margin-bottom:20px">
            <h3 style="color:#fffeee">${d.name} 원장과 상담</h3>
            <a href="/reservation" class="btn btn-accent" style="width:100%;justify-content:center;margin:14px 0 10px">예약 문의</a>
            <a href="tel:${CLINIC.phoneRaw}" class="btn btn-ghost" style="width:100%;justify-content:center">${CLINIC.phone}</a>
          </div>

          ${txs.length ? html`
          <div class="inlink-box" style="margin-bottom:20px">
            <h3><i class="fa-solid fa-tooth text-mint"></i> 주요 진료 분야</h3>
            ${raw(txs.map(t => `<a href="/treatments/${t.slug}"><span>${t.name}</span><i class="fa-solid fa-arrow-right" style="font-size:12px"></i></a>`).join(''))}
          </div>` : ''}

          <div class="inlink-box">
            <h3><i class="fa-solid fa-images text-mint"></i> 진료사례</h3>
            <a href="/cases?doctor=${d.slug}"><span>${d.name} 원장 진료사례</span><i class="fa-solid fa-arrow-right" style="font-size:12px"></i></a>
            <a href="/doctors"><span>전체 의료진 보기</span><i class="fa-solid fa-arrow-right" style="font-size:12px"></i></a>
          </div>
        </aside>
      </div>
    </div>
  </section>
  ${ctaBand()}
  `
  const txNames = txs.map(t => t.name).slice(0, 4).join('·')
  return Page({
    title: `${d.name} ${d.role} | ${d.titleLine} | 약수역 365올케어치과`,
    description: `약수역 365올케어치과 ${d.name} ${d.role}. ${d.titleLine}.${txNames ? ` ${txNames} 진료.` : ''} ${d.intro.slice(0, 80)}`.slice(0, 158),
    path: `/doctors/${slug}`,
    keywords: `${d.name},365올케어치과 ${d.name},약수역 치과 ${d.role}${txNames ? ',' + txNames.replace(/·/g, ',') : ''}`,
    schema: [
      breadcrumbSchema([{ name: '홈', url: '/' }, { name: '의료진', url: '/doctors' }, { name: d.name, url: `/doctors/${slug}` }]),
      personSchema,
      speakableSchema(['.answer-box', 'h1', 'h2']),
    ],
  }, body)
}

function specLabel(s: string) {
  return ({ implant: '임플란트', surgery: '구강외과·사랑니', tmj: '턱관절', conservative: '충치·신경치료', prosthetics: '보철', gum: '잇몸치료', esthetic: '심미보철', denture: '틀니' } as any)[s] || s
}

function ctaBand() {
  return html`
  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="cta-band reveal">
        <h2>전문의와 직접 상담하세요</h2>
        <p>${CLINIC.philosophy}</p>
        <div class="actions">
          <a href="/reservation" class="btn btn-accent"><i class="fa-solid fa-calendar-check"></i> 예약 문의</a>
          <a href="tel:${CLINIC.phoneRaw}" class="btn btn-ghost"><i class="fa-solid fa-phone"></i> ${CLINIC.phone}</a>
        </div>
      </div>
    </div>
  </section>`
}
