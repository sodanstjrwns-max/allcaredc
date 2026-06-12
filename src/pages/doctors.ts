import { html, raw } from 'hono/html'
import { Page, PageHero } from '../components/page'
import { breadcrumbSchema } from '../components/layout'
import { CLINIC, DOCTORS, getDoctor, treatmentsForDoctor } from '../data/clinic'

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
            <div class="doc-photo"><div class="ph"><i class="fa-solid fa-user-doctor"></i></div></div>
            <div class="doc-body">
              <span class="role">${d.role}</span>
              <h3>${d.name}</h3>
              <p class="title-line">${d.titleLine}</p>
              <p class="doc-career">${d.career[0]}</p>
              <div class="doc-tags">
                ${d.specialties.slice(0, 3).map(s => `<span>${specLabel(s)}</span>`).join('')}
              </div>
            </div>
          </a>`).join(''))}
      </div>
    </div>
  </section>
  ${ctaBand()}
  `
  return Page({
    title: '의료진 소개 | 구강악안면외과·통합치의학과·보철과 전문의 | 올케어치과',
    description: '약수역 올케어치과 의료진. 구강악안면외과·통합치의학과 전문의, 보철과 전문의, 치의학박사가 함께하는 3인 전문의 협진 치과입니다.',
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

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: d.name,
    jobTitle: d.role + ' / ' + d.titleLine,
    worksFor: { '@type': 'Dentist', name: CLINIC.name },
    alumniOf: d.education.map(e => ({ '@type': 'EducationalOrganization', name: e })),
    description: d.intro,
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
            <div class="doc-photo" style="border-radius:var(--radius-lg);box-shadow:var(--shadow);aspect-ratio:4/4.6"><div class="ph"><i class="fa-solid fa-user-doctor"></i></div></div>
            <div>
              <span class="role" style="color:var(--brand-accent);font-weight:700">${d.role}</span>
              <h2 style="font-size:2rem;margin:6px 0 4px">${d.name}</h2>
              <p style="color:var(--gray-600);font-size:1.05rem;margin-bottom:20px">${d.titleLine}</p>
              <div class="doc-tags">
                ${raw(d.specialties.map(s => `<span>${specLabel(s)}</span>`).join(''))}
              </div>
            </div>
          </div>

          <div class="prose">
            <div class="answer-box" style="font-size:1.1rem">${d.intro}</div>

            <h3><i class="fa-solid fa-graduation-cap text-mint"></i> 학력</h3>
            <ul class="check">
              ${raw(d.education.map(e => `<li>${e}</li>`).join(''))}
            </ul>

            <h3><i class="fa-solid fa-briefcase-medical text-mint"></i> 경력 · 수련</h3>
            <ul class="check">
              ${raw(d.career.map(c => `<li>${c}</li>`).join(''))}
            </ul>
          </div>
        </article>

        <aside class="reveal reveal-d2">
          <div class="inlink-box" style="background:var(--brand);color:#fffeee;margin-bottom:20px">
            <h4 style="color:#fffeee">${d.name} 원장과 상담</h4>
            <a href="/reservation" class="btn btn-accent" style="width:100%;justify-content:center;margin:14px 0 10px">예약 문의</a>
            <a href="tel:${CLINIC.phoneRaw}" class="btn btn-ghost" style="width:100%;justify-content:center">${CLINIC.phone}</a>
          </div>

          ${txs.length ? html`
          <div class="inlink-box" style="margin-bottom:20px">
            <h4><i class="fa-solid fa-tooth text-mint"></i> 주요 진료 분야</h4>
            ${raw(txs.map(t => `<a href="/treatments/${t.slug}"><span>${t.name}</span><i class="fa-solid fa-arrow-right" style="font-size:12px"></i></a>`).join(''))}
          </div>` : ''}

          <div class="inlink-box">
            <h4><i class="fa-solid fa-images text-mint"></i> 진료사례</h4>
            <a href="/cases?doctor=${d.slug}"><span>${d.name} 원장 진료사례</span><i class="fa-solid fa-arrow-right" style="font-size:12px"></i></a>
            <a href="/doctors"><span>전체 의료진 보기</span><i class="fa-solid fa-arrow-right" style="font-size:12px"></i></a>
          </div>
        </aside>
      </div>
    </div>
  </section>
  ${ctaBand()}
  `
  return Page({
    title: `${d.name} ${d.role} | ${d.titleLine} | 올케어치과`,
    description: `올케어치과 ${d.name} ${d.role}. ${d.titleLine}. ${d.intro.slice(0, 90)}`,
    path: `/doctors/${slug}`,
    schema: [
      breadcrumbSchema([{ name: '홈', url: '/' }, { name: '의료진', url: '/doctors' }, { name: d.name, url: `/doctors/${slug}` }]),
      personSchema,
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
