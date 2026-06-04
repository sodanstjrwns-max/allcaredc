import { html, raw } from 'hono/html'
import { Page, PageHero } from '../components/page'
import { breadcrumbSchema, faqSchema } from '../components/layout'
import { CLINIC, TREATMENTS } from '../data/clinic'

// ════════════════ 병원소개 / 미션 ════════════════
export function MissionPage() {
  const body = html`
  <!-- ============ HERO — 매거진 톤 통일 ============ -->
  <section class="hero cinema" style="min-height:78vh">
    <div class="hero-bg"><img src="/static/img/interior.webp" alt="올케어치과 진료 공간" data-drift="20"></div>
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
      <p class="lead reveal reveal-d2" style="max-width:640px">${CLINIC.mission}. 진단부터 회복까지, 흩어지지 않는 진료를 약수동에서 이어갑니다.</p>
    </div>
  </section>

  <!-- ============ 우리의 시작 — 2대(父子) 서사 (인테이크 기반) ============ -->
  <section class="section">
    <div class="container" style="max-width:860px">
      <div class="reveal" style="text-align:center">
        <span class="sec-label" style="justify-content:center"><span class="num">01</span> Our Story</span>
        <h2 class="split-rise" style="font-size:clamp(1.8rem,4vw,2.8rem);margin:18px 0 34px">같은 자리에서, <em>2대(父子)</em>에 걸쳐</h2>
      </div>
      <div class="prose reveal reveal-d1" style="font-size:1.13rem;line-height:1.95">
        <p>올케어치과는 한 지역을 오래 지켜온 치과입니다. 아버지가 진료하던 그 자리에서, 아들이 다시 가운을 입었습니다. 2대(父子)에 걸쳐 같은 동네를 지킨다는 것은, 한 번의 진료로 끝나는 관계가 아니라 시간을 두고 신뢰를 쌓아간다는 약속입니다.</p>
        <p>그래서 화려한 약속보다 환자 한 분 한 분의 불편함을 끝까지 들여다보는 일을 먼저 합니다. 한 번 오신 분이 가족과 이웃을 함께 모시고 오는 치과 — 그것이 지역 안에서 인정받고 오래 머무는 길이라 믿습니다.</p>
      </div>
    </div>
  </section>

  <!-- ============ 네 가지 원칙 ============ -->
  <section class="section" style="background:var(--ivory-2)">
    <div class="container">
      <div class="section-head reveal">
        <span class="sec-label"><span class="num">02</span> Our Principles</span>
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

  <!-- ============ 올케어가 다른 이유 — AEO 질문-직답형 (strengths 재활용) ============ -->
  <section class="section">
    <div class="container">
      <div class="section-head reveal">
        <span class="sec-label"><span class="num">03</span> Why ALLCARE</span>
        <h2>올케어치과가 <em>다른 이유</em></h2>
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
          <span class="sec-label"><span class="num">04</span> Our Vision</span>
          <h2 style="font-size:clamp(1.8rem,4vw,2.8rem);margin:18px 0 22px">지역 안에서 인정받고<br><em>오래 머무는 치과</em></h2>
          <p class="prose" style="font-size:1.05rem">한때의 유행이 아니라, 동네에서 신뢰로 이어지는 치과. 한 번 오신 분이 가족과 이웃을 함께 모시고 오는 치과. 그것이 올케어치과가 그리는 미래입니다.</p>
          <ul class="check prose" style="margin-top:22px">
            <li>친절은 기본, 원칙은 약속입니다.</li>
            <li>과잉 없이, 필요한 진료만 권합니다.</li>
            <li>2대(父子)에 걸친 경험과 섬세함으로 함께합니다.</li>
          </ul>
        </div>
        <div class="reveal reveal-d2">
          <div class="stats-band" style="border-radius:var(--radius-lg);padding:48px">
            <div class="stats-grid" style="grid-template-columns:1fr 1fr;gap:30px">
              <div class="stat"><div class="num"><span data-count="3">3</span></div><div class="lbl">분야별 전문의</div></div>
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
    title: '병원소개 | 올케어치과 — 2대(父子) 3인 전문의 치과',
    description: '약수역 올케어치과는 같은 자리에서 2대(父子)에 걸쳐 이어온 치과입니다. 구강악안면외과·통합치의학과·보철과 3인 전문의 협진, 원내 기공실, 수면진료 세팅으로 불편함을 끝까지 책임집니다.',
    path: '/mission',
    schema: [
      breadcrumbSchema([{ name: '홈', url: '/' }, { name: '병원소개', url: '/mission' }]),
      faqSchema(CLINIC.strengths.map(s => ({ q: s.head, a: s.desc }))),
    ],
  }, body)
}

// ════════════════ 오시는 길 ════════════════
export function DirectionsPage() {
  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '오시는 길', url: '/directions' }],
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
            <h3><i class="fa-solid fa-train-subway text-mint"></i> 지하철</h3>
            <p>${CLINIC.subway}. 5번 출구로 나오시면 스타벅스가 있는 건물 4층입니다.</p>
            <h3><i class="fa-solid fa-bus text-mint"></i> 버스</h3>
            <p>약수역 정류장 하차 후 도보로 이동하실 수 있습니다.</p>
            <h3><i class="fa-solid fa-car text-mint"></i> 자가용</h3>
            <p>건물 주차장 이용이 가능합니다. 자세한 주차 안내는 내원 전 전화로 문의해 주세요.</p>
          </div>
        </div>
        <aside class="reveal reveal-d2">
          <div class="inlink-box" style="background:var(--brand);color:#fff;margin-bottom:20px">
            <h4 style="color:#fff"><i class="fa-solid fa-location-dot text-mint"></i> 주소</h4>
            <p style="margin-bottom:18px">${CLINIC.address}</p>
            <h4 style="color:#fff"><i class="fa-solid fa-phone text-mint"></i> 전화</h4>
            <a href="tel:${CLINIC.phoneRaw}" style="font-size:1.5rem;font-weight:800;color:#fff;display:block">${CLINIC.phone}</a>
            <a href="/reservation" class="btn btn-accent" style="width:100%;justify-content:center;margin-top:24px">예약 문의</a>
          </div>
          <div class="inlink-box">
            <h4><i class="fa-solid fa-clock text-mint"></i> 진료시간</h4>
            ${raw(CLINIC.hours.map(h => `<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;border-bottom:1px dashed var(--gray-200)"><span style="font-weight:${h.night ? '700' : '400'};color:${h.night ? 'var(--brand)' : 'inherit'}">${h.day}</span><span style="color:var(--gray-600)">${h.time}</span></div>`).join(''))}
            <p style="font-size:12.5px;color:var(--gray-400);margin-top:10px">${CLINIC.hoursNote}</p>
          </div>
        </aside>
      </div>
    </div>
  </section>`
  return Page({
    title: '오시는 길 | 약수역 5번 출구 올케어치과',
    description: `올케어치과 오시는 길. ${CLINIC.address}. ${CLINIC.subway}. 전화 ${CLINIC.phone}.`,
    path: '/directions',
    schema: [breadcrumbSchema([{ name: '홈', url: '/' }, { name: '오시는 길', url: '/directions' }])],
  }, body)
}

// ════════════════ 비용 안내 ════════════════
export function PricingPage() {
  const body = html`
  ${PageHero({
    crumb: [{ name: '홈', url: '/' }, { name: '비용 안내', url: '/pricing' }],
    title: '비급여 진료비 안내',
    desc: '주요 비급여 항목을 안내해 드립니다. 정확한 비용은 진단 후 치료 계획과 함께 설명드립니다.',
  })}
  <section class="section">
    <div class="container" style="max-width:820px">
      <div class="reveal" style="background:var(--beige-soft);border-radius:var(--radius);padding:24px;margin-bottom:30px">
        <p style="font-size:14.5px;color:var(--ink-soft)"><i class="fa-solid fa-circle-info text-mint"></i> 비급여 진료비는 환자분의 구강 상태, 사용 재료, 치료 범위에 따라 달라집니다. 아래는 일반적인 안내이며, 정확한 비용은 정밀 진단 후 상담을 통해 안내해 드립니다.</p>
      </div>
      <div class="reveal" style="background:#fff;border-radius:var(--radius);border:1px solid var(--gray-100);overflow:hidden;box-shadow:var(--shadow-sm)">
        ${raw([
          ['임플란트', '사용 재료(픽스처·보철)와 골이식 여부에 따라 상이', '상담 시 안내'],
          ['치아교정', '교정 방식(메탈·세라믹·투명)과 난도에 따라 상이', '상담 시 안내'],
          ['심미보철(올세라믹/지르코니아)', '재료와 부위에 따라 상이', '상담 시 안내'],
          ['라미네이트', '범위와 재료에 따라 상이', '상담 시 안내'],
          ['치아미백', '방식(전문가/자가)에 따라 상이', '상담 시 안내'],
          ['틀니(비급여)', '종류와 재료에 따라 상이', '상담 시 안내'],
        ].map(([n, d, p]) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid var(--gray-100);gap:16px">
            <div><strong style="font-size:1.05rem">${n}</strong><br><span style="font-size:13px;color:var(--gray-600)">${d}</span></div>
            <span style="color:var(--brand-accent);font-weight:700;white-space:nowrap">${p}</span>
          </div>`).join(''))}
      </div>
      <p style="font-size:13px;color:var(--gray-400);margin-top:20px">※ 위 내용은 의료법 및 비급여 진료비 고지 규정에 따른 일반 안내입니다. 건강보험 적용 여부, 정확한 진료비는 내원 후 진단을 통해 안내받으실 수 있습니다.</p>
    </div>
  </section>
  ${ctaBand()}
  `
  return Page({
    title: '비급여 진료비 안내 | 올케어치과',
    description: '약수역 올케어치과 비급여 진료비 안내. 임플란트, 교정, 심미보철 등 주요 비급여 항목 안내. 정확한 비용은 진단 후 상담을 통해 안내드립니다.',
    path: '/pricing',
    schema: [breadcrumbSchema([{ name: '홈', url: '/' }, { name: '비용 안내', url: '/pricing' }])],
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
