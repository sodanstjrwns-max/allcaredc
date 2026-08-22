import { html, raw } from 'hono/html'
import { Page, PageHero } from '../components/page'
import { breadcrumbSchema, faqSchema } from '../components/layout'
import { CLINIC, TREATMENTS, PRICE_TABLE, PRICE_NOTES } from '../data/clinic'
import { speakableSchema } from '../lib/seo-engine'

const BASE = `https://${CLINIC.domain}`
const DAY_CODE: Record<string, string> = { '월': 'Monday', '화': 'Tuesday', '수': 'Wednesday', '목': 'Thursday', '금': 'Friday', '토': 'Saturday', '일': 'Sunday' }

// 협력 및 후원단체 — 상대측 얼굴은 개인정보 보호를 위해 모자이크 처리됨
const PARTNER_ORGS = [
  { name: '약수시장상인회', img: '/static/img/partner-yaksu-market.jpg', caption: '상호협력 발전을 위한 업무협약', alt: '365올케어치과 - 약수시장상인회 업무협약식, 권민수 대표원장이 상인회 측과 상호협력 협약서를 든 모습(상대측 얼굴 모자이크 처리)' },
  { name: '다온봉사단', img: '/static/img/partner-daon.jpg', caption: '의료서비스 지원 협약', alt: '365올케어치과 - 다온봉사단 의료서비스 지원 협약식(상대측 얼굴 모자이크 처리)' },
  { name: '약수동주민센터', img: '/static/img/partner-community-center.jpg', caption: '취약계층 의료서비스 지원 협약', alt: '365올케어치과 - 약수동주민센터 취약계층 의료서비스 지원 협약식(상대측 얼굴 모자이크 처리)' },
  { name: '중구산악회', img: '/static/img/partner-junggu-alpine.jpg', caption: '지역 단체 의료서비스 지원 협약', alt: '365올케어치과 - 중구산악회 의료서비스 지원 협약식(상대측 얼굴 모자이크 처리)' },
]

// 진료시간 → openingHoursSpecification 변환 (요일별 1줄 포맷: '월요일' / '09:30 - 20:30')
function openingHoursSpec() {
  return CLINIC.hours
    .map(h => {
      const dayCode = DAY_CODE[h.day.charAt(0)]            // '월요일' → '월' → 'Monday'
      const m = h.time.match(/(\d{1,2}):(\d{2})\s*[~\-]\s*(\d{1,2}):(\d{2})/)
      if (!dayCode || !m) return null                       // '공휴일'·시간 미파싱 제외
      if (/격주|예약|휴진|휴무/.test(h.time)) return null    // 비정기 진료 제외
      return {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: dayCode,
        opens: `${m[1].padStart(2, '0')}:${m[2]}`,
        closes: `${m[3].padStart(2, '0')}:${m[4]}`,
      }
    })
    .filter(Boolean)
}

// ── 병원소개 진료 분류 (재구성: 핵심진료 전면 / 일반진료 별도 동선) ──
// 핵심진료: 임플란트·교정·심미보철·수면 (+ 협진은 카드에 직접 추가)
const CORE_SLUGS = ['implant', 'ortho', 'esthetic', 'sleep']
// 일반진료(동네 일상 수요): 충치·신경·잇몸·틀니·구강외과·턱관절·미백
const DAILY_SLUGS = ['conservative', 'gum', 'denture', 'surgery', 'tmj', 'whitening']
const CORE_TX = CORE_SLUGS.map(s => TREATMENTS.find(t => t.slug === s)!).filter(Boolean)
const DAILY_TX = DAILY_SLUGS.map(s => TREATMENTS.find(t => t.slug === s)!).filter(Boolean)

// ════════════════ 병원소개 / 미션 ════════════════
export function MissionPage() {
  const body = html`
  <!-- ============ HERO — 매거진 톤 통일 ============ -->
  <section class="hero cinema" style="min-height:78vh">
    <div class="hero-bg"><img src="/static/img/interior.webp" alt="365올케어치과 진료 공간" data-drift="20"></div>
    <div class="hero-top">
      <span>ALLCARE DENTAL — SEOUL</span>
      <span class="hero-coord">37.5547°N · 127.0107°E</span>
      <span>EST. 2023 · 약수역</span>
    </div>
    <div class="hero-inner">
      <span class="hero-badge">병원소개 · About</span>
      <h1 class="hero-mega" style="font-size:clamp(2.6rem,8vw,6rem)">
        <span class="line-mask"><span>인지하고, 공감하고,</span></span>
        <span class="line-mask"><span class="accent disp">해소합니다.</span></span>
      </h1>
      <p class="lead reveal reveal-d2" style="max-width:640px">${CLINIC.mission}. 진단부터 회복까지, 흩어지지 않는 진료를 약수역에서 이어갑니다.</p>
    </div>
  </section>

  <!-- ============ §A 현재 진료 역량 — 전면 (환자가 가장 궁금한 '지금 무엇을 잘하나') ============ -->
  <section class="section">
    <div class="container">
      <div class="section-head reveal">
        <span class="sec-label"><span class="num">01</span> What We Do</span>
        <h2>365올케어치과는 <em>무엇을 잘하는가</em></h2>
        <p>약수역 365올케어치과가 가장 자신 있게 책임지는 핵심 진료입니다. 진단부터 회복까지 한 곳에서 흩어지지 않게 이어갑니다.</p>
      </div>
      <div class="core-tx-grid reveal">
        ${raw(CORE_TX.map((t, i) => `
          <a href="/treatments/${t.slug}" class="core-tx-card reveal reveal-d${(i % 3) + 1}">
            <span class="ctx-ico"><i class="fa-solid fa-${t.icon}"></i></span>
            <h3 class="ctx-name">${t.name}</h3>
            <p class="ctx-short">${t.short}</p>
            <span class="ctx-go">자세히 보기 <i class="fa-solid fa-arrow-right"></i></span>
          </a>`).join(''))}
        <a href="/mission#team" class="core-tx-card ctx-team reveal reveal-d1">
          <span class="ctx-ico"><i class="fa-solid fa-user-doctor"></i></span>
          <h3 class="ctx-name">전문의 협진 시스템</h3>
          <p class="ctx-short">구강악안면외과·보철과·통합치의학 — 수술부터 보철·교정·턱관절까지 한 팀이 이어서 진료합니다.</p>
          <span class="ctx-go">협진 자세히 <i class="fa-solid fa-arrow-right"></i></span>
        </a>
      </div>
    </div>
  </section>

  <!-- ============ §A-2 일반진료 — 동네 일상 진료 동선 (충치·신경·잇몸 등 베이스 수요) ============ -->
  <section class="section" style="background:var(--ivory-2)">
    <div class="container">
      <div class="section-head reveal">
        <span class="sec-label"><span class="num">01-1</span> Everyday Care</span>
        <h2>믿음직한 약수 치과로서,<br class="br-pc"> <em>일반 진료</em>도 든든하게</h2>
        <p>큰 수술뿐 아니라 충치·신경·잇몸 같은 일상적인 진료도 같은 전문성으로 봅니다. 멀리 갈 필요 없이, 동네에서 편하게.</p>
      </div>
      <div class="daily-tx-grid reveal">
        ${raw(DAILY_TX.map((t, i) => `
          <a href="/treatments/${t.slug}" class="daily-tx-chip reveal reveal-d${(i % 3) + 1}">
            <i class="fa-solid fa-${t.icon}"></i>
            <span class="dtx-name">${t.name}</span>
            <span class="dtx-short">${t.short}</span>
          </a>`).join(''))}
      </div>
    </div>
  </section>

  <!-- ============ §B 진료의 연속성 (2대 父子) — 신뢰를 더하는 보조 톤으로 한 단계 강등 ============ -->
  <section class="section about-story-sub">
    <div class="container">
      <div class="grid-2 continuity-grid" style="align-items:center;gap:clamp(36px,5vw,72px)">
        <figure class="reveal about-figure">
          <img src="${CLINIC.familyStory.photo}" alt="약수역 365올케어치과의원 — 두 세대가 이어가는 진료 · 권종진 명예원장 · 권민수 대표원장" width="2400" height="1800" style="width:100%;height:auto;display:block" loading="lazy">
          <figcaption>${CLINIC.familyStory.photoCaption}</figcaption>
        </figure>
        <div class="reveal reveal-d1">
          <span class="sec-label"><span class="num">02</span> Continuity of Care</span>
          <h2 class="split-rise" style="font-size:clamp(1.6rem,3.4vw,2.4rem);margin:18px 0 18px">${raw(CLINIC.familyStory.title)}</h2>
          <div class="prose" style="font-size:1.05rem;line-height:1.9">
            ${raw(CLINIC.familyStory.paras.map(p => `<p>${p}</p>`).join(''))}
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;margin-top:26px">
            ${raw(CLINIC.familyStory.facts.map(p => `
              <span style="display:inline-flex;align-items:center;gap:11px;font-size:.98rem;color:var(--ink-soft)"><i class="fa-solid fa-circle-check" style="color:var(--gold)"></i>${p}</span>`).join(''))}
          </div>
        </div>
      </div>

      <!-- §S6 지속 가능한 운영 콜아웃 — 다크블루 박스 (격주 일요일 휴진 등) -->
      <div class="continuity-block reveal" style="margin-top:clamp(40px,5vw,64px)">
        <p class="sustainability-note reveal">
          <i class="fa-solid fa-leaf" aria-hidden="true"></i>
          ${CLINIC.familyStory.callout}
        </p>
      </div>
    </div>
  </section>

  <!-- ============ 공간 둘러보기 — 시설 사진 갤러리 ============ -->
  <section class="section" style="background:var(--ivory-2)">
    <div class="container">
      <div class="section-head reveal">
        <span class="sec-label"><span class="num">·</span> Our Space</span>
        <h2>공간으로 <em>먼저 인사</em>드립니다</h2>
        <p>진단부터 회복까지, 흩어지지 않도록 한 층에 담은 진료 공간을 미리 둘러보세요.</p>
      </div>
      <div class="space-gallery reveal">
        <figure class="sg-item sg-wide">
          <img src="/static/img/reception-desk.webp" alt="365올케어치과 인포메이션 데스크 — 환자를 가장 먼저 맞이하는 통합진료센터 응대 공간" width="1024" height="683" loading="lazy">
          <figcaption><span class="sg-cap">인포메이션</span><span class="sg-sub">처음 만나는 자리</span></figcaption>
        </figure>
        <figure class="sg-item">
          <img src="/static/img/about-lounge.webp" alt="365올케어치과 쾌적한 대기실 — 넓고 밝은 소파형 대기 공간" width="960" height="720" loading="lazy">
          <figcaption><span class="sg-cap">쾌적한 대기실</span><span class="sg-sub">여유롭게 기다리는 공간</span></figcaption>
        </figure>
        <figure class="sg-item">
          <img src="/static/img/about-sterilization.webp" alt="365올케어치과 철저한 멸균소독실 — 독일 MELAG 장비로 대학병원 수준의 감염관리 시스템" width="960" height="720" loading="lazy">
          <figcaption><span class="sg-cap">철저한 멸균소독</span><span class="sg-sub">대학병원급 감염관리</span></figcaption>
        </figure>
        <figure class="sg-item">
          <img src="/static/img/about-consult.webp" alt="365올케어치과 치료계획 상담실 — 원장이 3D 자료로 임플란트·보철을 직접 설명하는 1:1 상담" width="1024" height="768" loading="lazy">
          <figcaption><span class="sg-cap">치료계획 상담실</span><span class="sg-sub">충분히 설명드립니다</span></figcaption>
        </figure>
        <figure class="sg-item">
          <img src="/static/img/sleep-implant-suite.webp" alt="365올케어치과 수면임플란트 진료실 — 의식하진정요법으로 편안한 수면 진료 공간" width="1024" height="683" loading="lazy">
          <figcaption><span class="sg-cap">수면임플란트 진료실</span><span class="sg-sub">의식하진정 진료</span></figcaption>
        </figure>
        <figure class="sg-item">
          <img src="/static/img/sleep-recovery-room.webp" alt="365올케어치과 수면치료회복실 — 수면 진료 후 안정을 취하는 독립 회복 공간" width="683" height="1024" loading="lazy">
          <figcaption><span class="sg-cap">수면치료회복실</span><span class="sg-sub">충분한 회복까지</span></figcaption>
        </figure>
      </div>
    </div>
  </section>

  <!-- ============ 약수 생활권 커뮤니티 ============ -->
  <section class="section" style="background:var(--navy-800)">
    <div class="container">
      <div class="section-head reveal">
        <span class="sec-label" style="color:var(--gold-300)"><span class="num" style="color:var(--gold-300)">&middot;</span> With Yaksu</span>
        <h2 style="color:#fffeee">약수 생활권과 <em style="color:var(--gold-300)">함께</em></h2>
        <p style="color:rgba(255,254,238,.65)">멀리 어렵게 찾는 치과가 아니라, 우리 동네에서 믿고 편하게 갈 수 있는 치과.</p>
      </div>
      <figure class="reveal yaksu-banner">
        <img src="/static/img/yaksu-mou-sign.webp" alt="365올케어치과 - 약수상인회 업무협약식 — 권민수 대표원장이 상인회 대표와 상호협력 협약서에 서명하는 모습" width="1024" height="683" loading="lazy">
        <figcaption><i class="fa-solid fa-handshake" style="color:var(--gold-300);margin-right:8px"></i>2024.11.13 · 약수상인회 업무협약식 — 동네 상권과 상호협력을 약속했습니다</figcaption>
      </figure>

      <!-- 협력 및 후원단체 갤러리 (4개 단체) — 상대측 얼굴은 개인정보 보호를 위해 모자이크 처리 -->
      <div class="partner-grid reveal reveal-d1">
        ${raw(PARTNER_ORGS.map(p => `
        <figure class="partner-item">
          <div class="partner-photo"><img src="${p.img}" alt="${p.alt}" width="800" height="600" loading="lazy"></div>
          <figcaption>
            <strong>${p.name}</strong>
            <span>${p.caption}</span>
          </figcaption>
        </figure>`).join(''))}
      </div>

      <div class="yaksu-copy reveal reveal-d2">
        <h3 class="yaksu-copy-head">지역과 함께 걸어온 치과</h3>
        <p>365올케어치과는 개원 초부터 약수시장상인회와 협약을 맺고,<br class="br-pc"> 지역 상권과 주민들의 곁을 지켜왔습니다.<br class="br-pc"> 약수동주민센터, 다온봉사단, 중구 산악회 등 여러 지역 단체와도 꾸준히 함께해 왔습니다.</p>
        <p>잠깐 스쳐가는 병원이 아니라, 동네에 뿌리내리고 오래 머무는 치과.<br class="br-pc"> 그 자리를 지키는 것이 저희가 지역에 보답하는 방식이라 믿습니다.</p>
      </div>
    </div>
  </section>

  <!-- ============ 네 가지 원칙 ============ -->
  <section class="section" style="background:var(--ivory-2)">
    <div class="container">
      <div class="section-head reveal">
        <span class="sec-label"><span class="num">03</span> Our Principles</span>
        <h2>네 가지 <em>원칙</em></h2>
      </div>
      <div class="value-grid">
        ${raw(CLINIC.values.map((v, i) => `
          <div class="value-card reveal reveal-d${i + 1}">
            <div class="ico"><i class="fa-solid fa-${v.icon}"></i></div>
            <h3>${v.title}</h3>
            <p>${v.desc}</p>
          </div>`).join(''))}
      </div>
    </div>
  </section>

  <!-- ============ §4 치과 전문의 협진 = 통합진료 (수술→보철→전체구강) ============ -->
  <section class="section collab-sec" id="team">
    <div class="container">
      <div class="section-head reveal">
        <span class="sec-label"><span class="num">04</span> Team Approach</span>
        <h2>여러 원장이 아니라, <em>하나의 진료팀</em></h2>
        <p>${CLINIC.collaboration.lead}</p>
      </div>

      <!-- §S13/S14: 단체사진 삭제 → 협진 흐름 5단계 아이콘 카드 -->
      <ol class="flow5-grid reveal">
        ${raw(CLINIC.collaboration.flow.map((f, i) => `
          <li class="flow5-card reveal reveal-d${(i % 3) + 1}">
            <span class="f5-step">${f.step}</span>
            <span class="f5-ico"><i class="fa-solid fa-${f.icon}"></i></span>
            <strong class="f5-name">${f.part}</strong>
            <p class="f5-desc">${f.desc}</p>
          </li>`).join(''))}
      </ol>

      <!-- §S15: 협진이 특히 필요한 진료 — 태그/칩 형태 -->
      <div class="collab-chips reveal">
        <p class="cc-chips-lead">특히 이런 진료에서 협진이 빛납니다</p>
        <div class="chip-row">
          ${raw(CLINIC.collaboration.chips.map((c, i) => `
            <div class="collab-chip reveal reveal-d${(i % 3) + 1}">
              <strong class="chip-label">${c.label}</strong>
              <span class="chip-flow">${c.flow}</span>
            </div>`).join(''))}
        </div>
      </div>

      <!-- 협진이 빛나는 지점 -->
      <div class="collab-points">
        ${raw(CLINIC.collaboration.points.map((p, i) => `
          <article class="collab-card reveal reveal-d${i + 1}">
            <span class="cc-ico"><i class="fa-solid fa-${p.icon}"></i></span>
            <h3 class="cc-title">${p.title}</h3>
            <p class="cc-desc">${p.desc}</p>
          </article>`).join(''))}
      </div>
    </div>
  </section>

  <!-- ============ 올케어가 다른 이유 — AEO 질문-직답형 (strengths 재활용) ============ -->
  <section class="section">
    <div class="container">
      <div class="section-head reveal">
        <span class="sec-label"><span class="num">05</span> Why ALLCARE</span>
        <h2>365올케어치과가 <em>다른 이유</em></h2>
        <p>규모와 시설을 넘어, 끝까지 잇는 섬세함으로 답합니다.</p>
      </div>
      <dl class="aeo-grid">
        ${raw(CLINIC.strengths.map((s, i) => `
          <div class="aeo-card reveal reveal-d${(i % 2) + 1}">
            <span class="aeo-ico"><i class="fa-solid fa-${s.icon}"></i></span>
            <dt>${s.title}</dt>
            <dd class="aeo-q">${s.head}</dd>
            <dd class="aeo-a">${s.desc}</dd>
          </div>`).join(''))}
      </dl>
    </div>
  </section>

  <!-- ============ 우리가 되고 싶은 모습 + 지표 ============ -->
  <section class="section" style="background:var(--ivory-2)">
    <div class="container">
      <div class="grid-2" style="align-items:center">
        <div class="reveal">
          <span class="sec-label"><span class="num">06</span> Our Vision</span>
          <h2 style="font-size:clamp(1.8rem,4vw,2.8rem);margin:18px 0 18px">지역 안에서 인정받고 <br><em>오래 머무는 치과</em></h2>
          <p class="vision-slogan reveal">${CLINIC.familyStory.slogan}</p>
          <p class="prose" style="font-size:1.05rem">한때의 유행이 아니라, 동네에서 신뢰로 이어지는 치과. 한 번 오신 분이 가족과 이웃을 함께 모시고 오는 치과. 그것이 365올케어치과가 그리는 미래입니다.</p>
          <ul class="check prose" style="margin-top:22px">
            <li>친절은 기본, 원칙은 약속입니다.</li>
            <li>과잉 없이, 필요한 진료만 권합니다.</li>
            <li>전문의 협진으로, 진단부터 회복까지 끝까지 책임집니다.</li>
          </ul>
        </div>
        <div class="reveal reveal-d2">
          <div class="stats-band" style="border-radius:var(--radius-lg);padding:48px">
            <div class="stats-grid" style="grid-template-columns:1fr 1fr;gap:30px">
              <div class="stat"><div class="num num-ko">협진</div><div class="lbl">치과 전문의 협진 시스템</div></div>
              <div class="stat"><div class="num"><span data-count="1">1</span></div><div class="lbl">원내 기공실</div></div>
              <div class="stat"><div class="num"><span data-count="10" data-suffix="+">10+</span></div><div class="lbl">진료 영역</div></div>
              <div class="stat"><div class="num"><span data-count="2023">2023</span></div><div class="lbl">개원</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  ${ctaBand()}
  `
  return Page({
    title: '병원소개 | 365올케어치과 — 약수역 치과 전문의 협진 통합진료',
    description: '약수역 365올케어치과는 구강악안면외과·통합치의학과·보철과 전문의 협진 시스템의 통합진료 치과입니다. 고난도 임플란트 수술 역량, 의식하진정법(수면진료) 병행, 원내 기공실로 불편함을 끝까지 살핍니다.',
    path: '/mission',
    schema: [
      breadcrumbSchema([{ name: '홈', url: '/' }, { name: '병원소개', url: '/mission' }]),
      faqSchema([
        { q: '365올케어치과의 치과 전문의 협진은 무엇이 다른가요?', a: CLINIC.collaboration.lead },
        { q: '고령이거나 전신질환이 있어도 임플란트를 받을 수 있나요?', a: CLINIC.collaboration.points[0].desc },
        ...CLINIC.strengths.map(s => ({ q: s.head, a: s.desc })),
      ]),
    ],
  }, body)
}

// ════════════════ 오시는 길 ════════════════
export function DirectionsPage() {
  const pageUrl = `${BASE}/directions`

  // ── Dentist + Place 부가티급: 좌표·주소·진료시간·교통 + 지역 SEO ──
  const placeSchema: any = {
    '@context': 'https://schema.org',
    '@type': ['Dentist', 'LocalBusiness'],
    '@id': `${BASE}/#clinic`,
    name: CLINIC.name,
    url: `${BASE}/`,
    telephone: CLINIC.phone,
    image: `${BASE}/og/home/home.svg`,
    priceRange: '₩₩',
    currenciesAccepted: 'KRW',
    paymentAccepted: '현금, 카드, 계좌이체',
    address: {
      '@type': 'PostalAddress',
      streetAddress: CLINIC.address,
      addressLocality: CLINIC.region.district,
      addressRegion: CLINIC.region.city,
      addressCountry: 'KR',
    },
    geo: { '@type': 'GeoCoordinates', latitude: CLINIC.geo.lat, longitude: CLINIC.geo.lng },
    hasMap: `https://maps.google.com/maps?q=${encodeURIComponent(CLINIC.address)}`,
    publicAccess: true,
    areaServed: [
      { '@type': 'City', name: '서울특별시 중구' },
      { '@type': 'Place', name: '약수역' }, { '@type': 'Place', name: '신당동' },
      { '@type': 'Place', name: '청구역' }, { '@type': 'Place', name: '동대입구역' },
    ],
    publicTransportClosenessRating: 5,
    openingHoursSpecification: openingHoursSpec(),
    availableService: TREATMENTS.map(t => ({ '@type': 'MedicalProcedure', name: t.name, url: `${BASE}/treatments/${t.slug}` })),
  }

  const directionsFaqs = [
    { q: '365올케어치과는 약수역에서 얼마나 걸리나요?', a: `${CLINIC.subway}입니다. 5번 출구로 나오시면 스타벅스가 있는 건물 4층입니다.` },
    { q: '주차가 가능한가요?', a: '건물 기계식 주차장을 이용하실 수 있습니다. 전기차·대형 SUV는 기계식 주차가 어려워 인근 공영주차장 이용을 권장드리며, 방문 전 전화로 주차 가능 여부를 확인해 주세요.' },
    { q: '야간 진료를 하나요?', a: `${CLINIC.hoursNote}` },
  ]

  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '오시는 길', url: '/directions' }],
    chapter: 'Chapter 05 — Back to Daily Life',
    title: '오시는 길',
    desc: CLINIC.directions,
  })}
  <section class="section">
    <div class="container">
      <div class="grid-detail">
        <div class="reveal">
          <div style="border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow);aspect-ratio:16/10;background:var(--gray-100)">
            <iframe width="100%" height="100%" style="border:0" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
              src="https://maps.google.com/maps?q=${encodeURIComponent('서울 중구 동호로 171')}&t=&z=16&ie=UTF8&iwloc=&output=embed"></iframe>
          </div>
          <div style="margin-top:30px" class="prose">
            <h2>교통 안내</h2>
            <p class="answer-box">365올케어치과는 <strong>${CLINIC.subway}</strong> 거리에 있습니다. 3·6호선 환승역인 약수역과 바로 연결되어, 신당동·청구·동대입구·옥수 생활권 어디에서나 편하게 오실 수 있습니다.</p>
            <h3><i class="fa-solid fa-train-subway text-mint"></i> 지하철</h3>
            <p><strong>3·6호선 약수역 5번 출구 도보 1분.</strong> 5번 출구로 나오시면 스타벅스가 있는 건물(더그레이스빌딩) 4층입니다. 3·6호선 환승역이라 강남·종로·은평 방면에서도 환승 한 번으로 닿습니다.</p>
            <h3><i class="fa-solid fa-person-walking text-mint"></i> 인근 지역에서</h3>
            <p>신당동·청구역·동대입구역·옥수동 생활권에서 가까워, 동네에서 믿고 편하게 다니실 수 있는 거리입니다. 약수역 인근 직장·학교에서도 점심·퇴근 시간을 활용해 방문하기 좋습니다.</p>
            <h3><i class="fa-solid fa-bus text-mint"></i> 버스</h3>
            <p>약수역 정류장 하차 후 도보로 이동하실 수 있습니다. 마을버스·간선버스 모두 약수역 인근에 정차합니다.</p>
            <h3><i class="fa-solid fa-car text-mint"></i> 자가용 · 주차 안내</h3>
            <p>건물은 <strong>기계식 주차장</strong>을 운영합니다. 다만 <strong>전기차와 대형 SUV는 기계식 주차가 어려워</strong>, 해당 차량은 <strong>인근 공영주차장 이용</strong>을 권장드립니다. 주차 공간이 한정되어 있으니, 방문 전 전화(<a href="tel:${CLINIC.phoneRaw}">${CLINIC.phone}</a>)로 주차 가능 여부를 확인해 주시면 정확히 안내해 드립니다.</p>
            <h3><i class="fa-solid fa-clock text-mint"></i> 진료시간 안내</h3>
            <p>월·화·목요일은 09:30~20:30 야간진료, <strong>수·금요일은 09:30~18:30</strong>까지 진료합니다. 토·일·공휴일은 09:30~14:00(일요일 격주)이며, 평일 <strong>점심시간은 ${CLINIC.lunch}</strong>, <strong>저녁시간은 ${CLINIC.dinner}</strong>입니다. <strong>토·일·공휴일은 점심시간 없이 진료</strong>합니다. 진료시간은 변동될 수 있으니, 방문 전 전화로 확인해 주시면 정확히 안내해 드립니다.</p>
          </div>
        </div>
        <aside class="reveal reveal-d2">
          <div class="inlink-box" style="background:var(--brand);color:#fffeee;margin-bottom:20px">
            <h4 style="color:#fffeee"><i class="fa-solid fa-location-dot text-mint"></i> 주소</h4>
            <p style="margin-bottom:18px">${CLINIC.address}</p>
            <h4 style="color:#fffeee"><i class="fa-solid fa-phone text-mint"></i> 전화</h4>
            <a href="tel:${CLINIC.phoneRaw}" style="font-size:1.5rem;font-weight:800;color:#fffeee;display:block">${CLINIC.phone}</a>
            <a href="/reservation" class="btn btn-accent" style="width:100%;justify-content:center;margin-top:24px">예약 문의</a>
          </div>
          <div class="inlink-box">
            <h4><i class="fa-solid fa-clock text-mint"></i> 진료시간</h4>
            ${raw(CLINIC.hours.map(h => `<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;border-bottom:1px dashed var(--gray-200)"><span style="font-weight:${h.night ? '700' : '400'};color:${h.night ? 'var(--brand)' : 'inherit'}">${h.day}</span><span style="color:var(--gray-600)">${h.time}</span></div>`).join(''))}
            <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;border-bottom:1px dashed var(--gray-200)"><span style="color:var(--gold-600)"><i class="fa-solid fa-mug-hot" style="font-size:12px"></i> 점심시간</span><span style="color:var(--gray-600)">${CLINIC.lunch}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;border-bottom:1px dashed var(--gray-200)"><span style="color:var(--gold-600)"><i class="fa-solid fa-mug-hot" style="font-size:12px"></i> 저녁시간</span><span style="color:var(--gray-600)">${CLINIC.dinner}</span></div>
            <p style="font-size:12.5px;color:var(--gray-400);margin-top:10px">토·일·공휴일은 점심시간 없이 진료합니다.<br>${CLINIC.hoursNote}</p>
          </div>
          <div class="inlink-box">
            <h4><i class="fa-solid fa-square-parking text-mint"></i> 주차 안내</h4>
            <ul style="margin:0;padding-left:18px;font-size:13.5px;color:var(--gray-600);line-height:1.7">
              ${raw(CLINIC.parking.notes.map(n => `<li>${n}</li>`).join(''))}
            </ul>
          </div>
        </aside>
      </div>

      <!-- 자주 묻는 질문 (AEO: FAQ 본문-스키마 일치) -->
      <div class="reveal" style="max-width:820px;margin:60px auto 0">
        <h2 style="text-align:center;margin-bottom:24px">자주 묻는 질문</h2>
        <dl class="faq-list">
          ${raw(directionsFaqs.map(f => `
            <div class="faq-item">
              <dt class="answer-box"><i class="fa-solid fa-circle-question text-mint"></i> ${f.q}</dt>
              <dd>${f.a}</dd>
            </div>`).join(''))}
        </dl>
      </div>
    </div>
  </section>`
  return Page({
    title: '오시는 길 | 약수역 5번 출구 도보 1분 365올케어치과',
    description: `365올케어치과 오시는 길. ${CLINIC.address}. ${CLINIC.subway}. 신당동·청구·동대입구 생활권. 주차·야간진료 안내. 전화 ${CLINIC.phone}.`,
    path: '/directions',
    keywords: `약수역 치과,약수역 5번 출구 치과,신당동 치과,중구 치과,약수역 치과 위치,약수역 치과 주차,365올케어치과 오시는길`,
    schema: [
      breadcrumbSchema([{ name: '홈', url: '/' }, { name: '오시는 길', url: '/directions' }]),
      placeSchema,
      faqSchema(directionsFaqs),
      speakableSchema(['.answer-box', 'h1', 'h2']),
    ],
  }, body)
}

// ════════════════ 비용 안내 ════════════════
export function PricingPage() {
  const pageUrl = `${BASE}/pricing`

  const isNumeric = (p: string) => /^[0-9,]+$/.test(p.replace(/\s/g, ''))
  const lowPrice = (p: string) => p.replace(/[^0-9,]/g, '').split('~')[0].replace(/,/g, '')

  // ── 비급여 진료비 고지: OfferCatalog + WebPage (실제 수가 명시 · 비급여 고지 규정 준수) ──
  const offerSchema: any = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    name: '비급여 진료비 안내',
    url: pageUrl,
    inLanguage: 'ko',
    description: '약수역 365올케어치과 비급여 진료 수가표. 레진·보철·임플란트·교정·턱관절·미백 등 주요 비급여 항목 비용 안내.',
    isPartOf: { '@type': 'WebSite', '@id': `${BASE}/#website` },
    about: { '@type': 'Dentist', '@id': `${BASE}/#clinic`, name: CLINIC.name },
    mainEntity: {
      '@type': 'OfferCatalog',
      name: '비급여 진료 수가표',
      provider: { '@type': 'Dentist', '@id': `${BASE}/#clinic`, name: CLINIC.name },
      itemListElement: PRICE_TABLE.flatMap((g) =>
        g.rows.map((r) => {
          const procName = r.type ? `${g.category} · ${r.item} (${r.type})` : `${g.category} · ${r.item}`
          const offer: any = {
            '@type': 'Offer',
            itemOffered: { '@type': 'MedicalProcedure', name: procName },
            priceCurrency: 'KRW',
            availability: 'https://schema.org/InStock',
            areaServed: { '@type': 'City', name: '서울특별시 중구' },
          }
          if (isNumeric(r.price)) {
            offer.price = lowPrice(r.price)
            offer.priceSpecification = { '@type': 'PriceSpecification', priceCurrency: 'KRW', price: lowPrice(r.price), valueAddedTaxIncluded: true }
          } else {
            offer.description = r.price
          }
          return offer
        })
      ),
    },
  }

  const pricingFaqs = [
    { q: '표에 나온 금액이 최종 비용인가요?', a: "위 수가표는 표준 기준 금액입니다. 실제 진료비는 환자분의 구강 상태, 사용 재료, 치료 범위에 따라 달라지며, 정밀 진단 후 치료 계획과 함께 정확히 안내해 드립니다. 또한 '본인부담금'으로 표기된 항목은 건강보험 급여가 적용되어 본인부담률에 따라 산정됩니다." },
    { q: 'VAT(부가가치세)는 포함된 금액인가요?', a: '대부분의 항목은 VAT가 포함된 금액입니다. 다만 라미네이트와 1Day 전문가 미백은 부가세 10%가 별도로 부과됩니다.' },
    { q: '건강보험이 적용되나요?', a: '치료 항목에 따라 건강보험 적용 여부가 다릅니다. 보험 임플란트·보험 틀니·물리치료 등은 급여 적용 항목으로 본인부담금만 부담하시며, 정확한 적용 여부는 내원 후 진단을 통해 안내받으실 수 있습니다.' },
    { q: '치료를 시작한 뒤에 비용이 갑자기 늘어나지는 않나요?', a: '치료 전 정밀 진단 후 총 예상 비용과 계획을 먼저 안내드리고, 동의하신 범위 안에서만 진행합니다. 진행 중 계획이 바뀌어야 할 경우에는 다시 설명드리고 동의를 받은 뒤 진행하므로, 사전 안내 없이 임의로 비용이 추가되지 않습니다.' },
    { q: '한 번에 부담이 큰데, 분할 결제(할부)가 되나요?', a: '카드 할부 결제가 가능하며, 제로페이 간편결제와 소상공인 고유가 피해지원금도 사용하실 수 있습니다. 치료 범위가 큰 경우 진행 단계에 맞춰 비용을 나누어 안내드리니, 부담되는 부분은 상담 때 편하게 말씀해 주세요.' },
  ]

  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '비용 안내', url: '/pricing' }],
    chapter: 'Honest Notes',
    title: '비급여 진료 수가표',
    desc: '주요 비급여 항목의 진료비를 투명하게 안내해 드립니다. 정확한 비용은 정밀 진단 후 치료 계획과 함께 확정됩니다.',
  })}
  <section class="section">
    <div class="container" style="max-width:880px">
      <div class="reveal" style="background:var(--beige-soft);border-radius:var(--radius);padding:22px 24px;margin-bottom:22px">
        <p style="font-size:14.5px;color:var(--ink-soft);margin:0"><i class="fa-solid fa-circle-info text-mint"></i> 단위: 원 / VAT 포함 (별도 표기 항목 제외). 아래는 표준 기준 금액이며, 실제 진료비는 환자분의 구강 상태와 치료 범위에 따라 정밀 진단 후 확정됩니다.</p>
      </div>

      <!-- §E4 비용 투명성: 우리 병원의 비용 원칙 3가지 -->
      <div class="reveal price-promise" style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:34px">
        <div class="pp-card">
          <span class="pp-ic"><i class="fa-solid fa-file-invoice-dollar"></i></span>
          <strong>치료 전 서면 견적</strong>
          <span>진단 후 총 예상 비용과 치료 계획을 먼저 안내드린 뒤, 동의하신 범위 안에서만 진행합니다.</span>
        </div>
        <div class="pp-card">
          <span class="pp-ic"><i class="fa-solid fa-ban"></i></span>
          <strong>임의 추가 청구 없음</strong>
          <span>사전 안내 없이 비용이 추가되지 않습니다. 계획이 바뀌면 다시 설명드리고 동의를 받습니다.</span>
        </div>
        <div class="pp-card">
          <span class="pp-ic"><i class="fa-solid fa-shield-heart"></i></span>
          <strong>보험 적용 우선 확인</strong>
          <span>보험 임플란트·틀니 등 건강보험이 적용되는 항목은 급여 여부를 먼저 확인해 안내드립니다.</span>
        </div>
      </div>

      ${raw(PRICE_TABLE.map((g) => `
        <div class="reveal price-block" style="margin-bottom:34px">
          <h2 class="price-cat"><i class="fa-solid fa-${g.icon}"></i> ${g.category}</h2>
          ${g.note ? `<p class="price-cat-note">${g.note}</p>` : ''}
          <div class="price-table">
            ${g.rows.map((r) => `
              <div class="price-row">
                <div class="price-name">
                  <span class="price-item">${r.item}</span>
                  ${r.type ? `<span class="price-type">${r.type}</span>` : ''}
                </div>
                <div class="price-value${isNumeric(r.price) ? '' : ' is-text'}">${isNumeric(r.price) ? r.price + '<span class="price-won">원</span>' : r.price}</div>
              </div>`).join('')}
          </div>
        </div>`).join(''))}

      <ul class="price-notes reveal">
        ${raw(PRICE_NOTES.map((n) => `<li><i class="fa-solid fa-asterisk"></i> ${n}</li>`).join(''))}
      </ul>
      <p style="font-size:13px;color:var(--gray-400);margin-top:18px">※ 본 수가표는 의료법 및 비급여 진료비용 고지 규정에 따른 안내입니다. 건강보험 적용 여부와 최종 진료비는 내원 후 진단을 통해 확정됩니다.</p>

      <!-- 자주 묻는 질문 -->
      <div class="reveal" style="margin-top:54px">
        <h2 style="text-align:center;margin-bottom:24px">자주 묻는 질문</h2>
        <dl class="faq-list">
          ${raw(pricingFaqs.map(f => `
            <div class="faq-item">
              <dt class="answer-box"><i class="fa-solid fa-circle-question text-mint"></i> ${f.q}</dt>
              <dd>${f.a}</dd>
            </div>`).join(''))}
        </dl>
      </div>
    </div>
  </section>
  ${ctaBand()}
  `
  return Page({
    title: '비급여 진료 수가표 | 약수역 365올케어치과',
    description: '약수역 365올케어치과 비급여 진료 수가표. 레진·지르코니아 크라운·임플란트(오스템·IBS·스트라우만)·투명교정·라미네이트·미백·틀니·턱관절 비용을 투명하게 안내합니다.',
    path: '/pricing',
    keywords: `약수역 치과 비용,365올케어치과 수가표,임플란트 비용,투명교정 비용,라미네이트 비용,지르코니아 크라운 가격,중구 치과 진료비,비급여 진료비 고지`,
    schema: [
      breadcrumbSchema([{ name: '홈', url: '/' }, { name: '비용 안내', url: '/pricing' }]),
      offerSchema,
      faqSchema(pricingFaqs),
      speakableSchema(['.answer-box', 'h1', 'h2']),
    ],
  }, body)
}

function ctaBand() {
  return html`
  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="cta-band reveal">
        <h2>먼저, 편하게 상담받으세요</h2>
        <p>${CLINIC.philosophy}</p>
        <div class="actions">
          <a href="/reservation" class="btn btn-accent"><i class="fa-solid fa-calendar-check"></i> 예약 문의</a>
          <a href="tel:${CLINIC.phoneRaw}" class="btn btn-ghost"><i class="fa-solid fa-phone"></i> ${CLINIC.phone}</a>
        </div>
      </div>
    </div>
  </section>`
}
