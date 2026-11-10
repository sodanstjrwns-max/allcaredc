import { html, raw } from 'hono/html'
import { Page, PageHero } from '../components/page'
import { breadcrumbSchema } from '../components/layout'
import { CLINIC, DOCTORS, getDoctor, treatmentsForDoctor } from '../data/clinic'
import { speakableSchema } from '../lib/seo-engine'
import { docTag } from '../lib/doc-tags'

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
                ${d.treatItems.map(docTag).join('')}
              </div>
            </div>
          </a>`).join(''))}
      </div>
    </div>
  </section>
  ${ctaBand()}
  `
  return Page({
    title: '의료진 소개 | 구강악안면외과·통합치의학과·보철과·교정과 전문의 | 365올케어치과',
    description: '약수역 365올케어치과 의료진. 구강악안면외과·통합치의학과 전문의, 보철과 전문의, 교정과 전문의, 치의학박사가 함께하는 치과 전문의 협진 치과입니다.',
    path: '/doctors',
    schema: [breadcrumbSchema([{ name: '홈', url: '/' }, { name: '의료진', url: '/doctors' }]), doctorListSchema()],
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
  // ── Physician (부가티급: 의료 전문 타입 + 전문분야·소속·진료 연결) ──
  // 학력·자격·학회는 화면(경력·수련 / 학력 목록)에 있는 줄만 사용한다.
  const personSchema: any = {
    '@context': 'https://schema.org',
    ...physicianCore(d),
    ...(d.nameEn ? { alternateName: d.nameEn } : {}),
    description: d.intro,
    workLocation: { '@type': 'Dentist', '@id': `${BASE}/#clinic`, name: CLINIC.name },
    ...(alumniOf(d).length ? { alumniOf: alumniOf(d) } : {}),
    ...(credentialsOf(d).length ? { hasCredential: credentialsOf(d) } : {}),
    ...(memberOf(d).length ? { memberOf: memberOf(d) } : {}),
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
              <h2 style="font-size:2rem;margin:6px 0 2px">${d.name}</h2>
              ${d.nameEn ? html`<p style="color:var(--gold-600);font-size:.9rem;letter-spacing:.02em;font-weight:600;margin:0 0 8px">${d.nameEn}</p>` : ''}
              <p style="color:var(--gray-600);font-size:1.05rem;margin-bottom:20px">${d.titleLine}</p>
              <p style="font-size:13px;letter-spacing:.02em;color:var(--gold-600);font-weight:700;margin-bottom:10px">진료과목</p>
              <div class="doc-tags">
                ${raw(d.treatItems.map(docTag).join(''))}
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

// ============================================================
// 의료진 구조화 데이터 공용 헬퍼 (2026-11-10 SEO·AEO 1차 정비)
// 화면에 이미 있는 정보(DOCTORS)만 사용. 병원 엔티티는 기존 @id(/#clinic) 참조.
// ============================================================
const SPEC_NAME: Record<string, string> = {
  implant: 'OralAndMaxillofacialSurgery', surgery: 'OralAndMaxillofacialSurgery',
  tmj: 'Dentistry', conservative: 'Dentistry', prosthetics: 'Prosthodontics',
  gum: 'Periodontics', esthetic: 'Prosthodontics', denture: 'Prosthodontics', ortho: 'Orthodontic',
}
type Doc = (typeof DOCTORS)[number]

// 목록·상세 공통 뼈대: name·jobTitle·medicalSpecialty·worksFor·image·url
function physicianCore(d: Doc) {
  const BASE = `https://${CLINIC.domain}`
  const pageUrl = `${BASE}/doctors/${d.slug}`
  return {
    '@type': ['Physician', 'Person'],
    '@id': `${pageUrl}#physician`,
    name: d.name,
    jobTitle: `${d.role} / ${d.titleLine}`,
    url: pageUrl,
    image: `${BASE}/static/og/doctor/${d.slug}.jpg`,
    worksFor: { '@type': 'Dentist', '@id': `${BASE}/#clinic`, name: CLINIC.name, url: `${BASE}/` },
    medicalSpecialty: [...new Set(d.specialties.map(s => SPEC_NAME[s]).filter(Boolean))],
  }
}
// 학력 줄에서 학교 이름만(연수원·단기 과정 수료 줄은 제외) — 중복 제거
function alumniOf(d: Doc) {
  const schools = d.education
    .filter(e => !/연수원|과정 수료/.test(e))
    .map(e => (/^([가-힣A-Za-z]+대학교(?:\([A-Za-z]+\))?)/.exec(e) || [])[1])
    .filter(Boolean) as string[]
  return [...new Set(schools)].map(name => ({ '@type': 'CollegeOrUniversity', name }))
}
// 학력 목록 전체 + 경력 목록의 인정의·인증의 줄 = 학위·전문의 자격·인증 (화면 문구 그대로)
function credentialsOf(d: Doc) {
  const lines = [...d.education, ...d.career.filter(c => /인정의|인증의/.test(c))]
  return lines.map(name => ({
    '@type': 'EducationalOccupationalCredential', name,
    ...(/전문의/.test(name) ? { credentialCategory: '전문의' } : {}),
  }))
}
// 경력 목록 중 현재 회원 표기(정회원·평생정회원·member)가 있는 학회만
function memberOf(d: Doc) {
  return d.career
    .filter(c => /(평생정회원|정회원|member)\s*$/i.test(c))
    .map(c => ({ '@type': 'Organization', name: c.replace(/\s*(평생정회원|정회원|member)\s*$/i, '').trim() }))
}
// /doctors 목록: 화면 카드와 1:1 (이름·직함·전문과목·진료 태그·사진·상세 주소)
function doctorListSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${CLINIC.name} 의료진`,
    numberOfItems: DOCTORS.length,
    itemListElement: DOCTORS.map((d, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: { ...physicianCore(d), knowsAbout: d.treatItems },
    })),
  }
}
