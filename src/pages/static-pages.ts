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

  <!-- ============ 우리의 시작 — 2대(父子) 진료 연속성 서사 (2차 전달문 기반, 서브 컸셉) ============ -->
  <section class="section">
    <div class="container" style="max-width:860px">
      <div class="reveal" style="text-align:center">
        <span class="sec-label" style="justify-content:center"><span class="num">01</span> Our Story</span>
        <h2 class="split-rise" style="font-size:clamp(1.8rem,4vw,2.8rem);margin:18px 0 14px">아버지의 경험에 이어,<br><em>아들의 섬세함</em>을 더하다</h2>
      </div>
      <div class="prose reveal reveal-d1" style="font-size:1.13rem;line-height:1.95">
        <p>아버지는 고려대병원에서 구강외과 교수로 약 30년, 이후 약수역 인근에서 약 13년간 진료를 이어왔습니다. 그리고 2026년 4월, 올케어치과에서 아버지와 아들이 함께 진료를 시작했습니다. 오랜 기간 아버지께 진료받아 온 환자분들은 기존 진료 기록과 치료 이력을 바탕으로, 보다 쿠적한 환경에서 구강건강 관리를 이어가시고 있습니다.</p>
        <p>저희가 가장 중요하게 생각하는 가치는 단순히 “부자가 함께 진료한다”는 사실 자체가 아닙니다. 오랜 기간 한 원장님을 믿고 다녀오신 환자분들이 낯선 병원으로 흩어지지 않고, 아들이 책임감을 가지고 이어서 케어해드릴 수 있다는 점 — 진료의 연속성입니다.</p>
        <p>그래서 화려한 약속보다 환자 한 분 한 분의 불편함을 끝까지 들여다보는 일을 먼저 합니다. 한 번 오신 분이 가족과 이웃을 함께 모시고 오는 치과 — 그것이 지역 안에서 인정받고 오래 머무는 길이라 믿습니다.</p>
      </div>
      <div class="reveal reveal-d2" style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-top:34px">
        ${raw(CLINIC.familyStory.points.map(p => `
          <span style="display:inline-flex;align-items:center;gap:9px;background:var(--ivory-2);border:1px solid var(--line);border-radius:999px;padding:10px 20px;font-size:.92rem;color:var(--ink-soft)"><i class="fa-solid fa-circle-check" style="color:var(--gold)"></i>${p}</span>`).join(''))}
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
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:18px">
        ${raw(CLINIC.community.map((cm, i) => `
          <article class="reveal reveal-d${(i % 3) + 1}" style="background:rgba(255,254,238,.05);border:1px solid rgba(176,141,87,.3);border-radius:var(--radius-lg);padding:28px 24px">
            <div style="width:42px;height:42px;display:grid;place-items:center;background:rgba(176,141,87,.15);color:var(--gold-300);border-radius:50%;margin-bottom:16px"><i class="fa-solid fa-${cm.icon}"></i></div>
            <h3 style="color:#fffeee;font-size:1.05rem;margin-bottom:8px">${cm.name}</h3>
            <p style="color:rgba(255,254,238,.62);font-size:.9rem;line-height:1.7">${cm.desc}</p>
          </article>`).join(''))}
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
            <li>아버지의 경험에 이어, 아들의 섬세함을 더합니다.</li>
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
    title: '병원소개 | 올케어치과 — 약수역 3인 전문의 통합진료 치과',
    description: '약수역 올케어치과는 구강악안면외과·통합치의학과·보철과 3인 전문의 통합진료 치과입니다. 고난도 임플란트 수술 역량, 의식하진정법 병행, 원내 기공실로 불편함을 끝까지 책임집니다.',
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
            <h3><i class="fa-solid fa-train-subway text-mint"></i> 지하철</h3>
            <p>${CLINIC.subway}. 5번 출구로 나오시면 스타벅스가 있는 건물 4층입니다.</p>
            <h3><i class="fa-solid fa-bus text-mint"></i> 버스</h3>
            <p>약수역 정류장 하차 후 도보로 이동하실 수 있습니다.</p>
            <h3><i class="fa-solid fa-car text-mint"></i> 자가용</h3>
            <p>건물 주차장 이용이 가능합니다. 자세한 주차 안내는 내원 전 전화로 문의해 주세요.</p>
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
    chapter: 'Honest Notes',
    title: '비급여 진료비 안내',
    desc: '주요 비급여 항목을 안내해 드립니다. 정확한 비용은 진단 후 치료 계획과 함께 설명드립니다.',
  })}
  <section class="section">
    <div class="container" style="max-width:820px">
      <div class="reveal" style="background:var(--beige-soft);border-radius:var(--radius);padding:24px;margin-bottom:30px">
        <p style="font-size:14.5px;color:var(--ink-soft)"><i class="fa-solid fa-circle-info text-mint"></i> 비급여 진료비는 환자분의 구강 상태, 사용 재료, 치료 범위에 따라 달라집니다. 아래는 일반적인 안내이며, 정확한 비용은 정밀 진단 후 상담을 통해 안내해 드립니다.</p>
      </div>
      <div class="reveal" style="background:#fffeee;border-radius:var(--radius);border:1px solid var(--gray-100);overflow:hidden;box-shadow:var(--shadow-sm)">
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
