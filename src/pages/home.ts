import { html, raw } from 'hono/html'
import { Page } from '../components/page'
import { organizationSchema, schemaTag } from '../components/layout'
import { CLINIC, CORE_TREATMENTS, SUB_TREATMENTS, DOCTORS, TX_IMAGES } from '../data/clinic'

export function HomePage() {
  const body = html`
  <!-- ============ HERO ============ -->
  <section class="hero">
    <div class="hero-bg">
      <img src="/static/img/hero.webp" alt="올케어치과 진료 공간" data-parallax="0.16" fetchpriority="high" />
    </div>
    <div class="hero-rule"></div>
    <div class="hero-top">
      <span>ALLCARE DENTAL — SEOUL</span>
      <span>EST. 2023 · 약수역</span>
    </div>
    <div class="hero-inner">
      <span class="eyebrow reveal">약수역 5번 출구 · 3인 전문의 진료</span>
      <h1>
        <span class="line-mask"><span>불편함을 끝까지</span></span>
        <span class="line-mask"><span class="accent">책임지는</span></span>
        <span class="line-mask"><span>한 곳.</span></span>
      </h1>
      <div class="hero-row">
        <div>
          <p class="lead reveal reveal-d2">${CLINIC.heroSub}</p>
          <div class="hero-actions reveal reveal-d3">
            <a href="/reservation" class="btn btn-accent">예약 문의 <i class="fa-solid fa-arrow-right"></i></a>
            <a href="/treatments" class="btn btn-ghost">진료 안내 보기</a>
          </div>
        </div>
        <div class="hero-meta reveal reveal-d4">
          <div class="item"><span class="num"><span data-count="3">3</span></span><span class="lbl">분야별 전문의</span></div>
          <div class="item"><span class="num"><span data-count="10" data-suffix="+">10+</span></span><span class="lbl">진료 영역</span></div>
          <div class="item"><span class="num"><span data-count="20" data-suffix=":30">20:30</span></span><span class="lbl">야간진료 (월·화·목)</span></div>
        </div>
      </div>
    </div>
    <div class="scroll-ind"><span>SCROLL</span><span class="line"></span></div>
  </section>

  <!-- ============ 신뢰 마퀴 띠 ============ -->
  <div class="marquee" aria-hidden="true">
    <div class="marquee-track">
      <span>구강악안면외과 전문의</span><span>통합치의학과 전문의</span><span>보철과 전문의</span>
      <span>원내 기공실</span><span>수면 진료</span><span>야간 진료</span>
      <span>구강악안면외과 전문의</span><span>통합치의학과 전문의</span><span>보철과 전문의</span>
      <span>원내 기공실</span><span>수면 진료</span><span>야간 진료</span>
    </div>
  </div>

  <!-- ============ 철학 (인지·공감·해소) ============ -->
  <section class="section" id="philosophy">
    <div class="container">
      <div class="section-head reveal">
        <span class="sec-label"><span class="num">01</span> 진료 철학</span>
        <h2>치료 이전에, <em>불편을 먼저</em> 읽습니다</h2>
        <p>${CLINIC.philosophy} 올케어치과가 환자를 대하는 변하지 않는 네 가지 원칙입니다.</p>
      </div>
      <div class="value-grid stagger">
        ${raw(CLINIC.values.map((v, i) => `
          <div class="value-card">
            <span class="v-no">0${i + 1}</span>
            <span class="ico"><i class="fa-solid fa-${v.icon}"></i></span>
            <h3>${v.title}</h3>
            <p>${v.desc}</p>
          </div>`).join(''))}
      </div>
    </div>
  </section>

  <!-- ============ 핵심 진료 TOP3 ============ -->
  <section class="section" style="background:var(--paper)" id="core-treatments">
    <div class="container">
      <div class="section-head reveal">
        <span class="sec-label"><span class="num">02</span> 핵심 진료</span>
        <h2>깊이 있게, 끝까지 책임지는<br><em>세 가지 진료</em></h2>
        <p>분야별 전문의가 진단부터 마무리까지 일관되게 맡습니다.</p>
      </div>
      <div class="tx-grid">
        ${raw(CORE_TREATMENTS.map((t, i) => `
          <a href="/treatments/${t.slug}" class="tx-card tilt reveal reveal-d${i + 1}">
            <div class="tx-bg"><img src="${TX_IMAGES[t.slug] || '/static/img/interior.webp'}" alt="${t.name} 진료" loading="lazy"></div>
            <div class="tx-content">
              <span class="tx-no">0${i + 1} — ${t.name}</span>
              <h3>${t.hero}</h3>
              <p>${t.short}</p>
              <span class="tx-link">자세히 보기 <i class="fa-solid fa-arrow-right"></i></span>
            </div>
          </a>`).join(''))}
      </div>
    </div>
  </section>

  <!-- ============ 차별점 (sticky split) ============ -->
  <section class="section" id="difference">
    <div class="container">
      <div class="grid-2">
        <div class="reveal">
          <span class="sec-label"><span class="num">03</span> 올케어의 차이</span>
          <h2 style="font-size:clamp(2rem,4vw,3.2rem);margin:22px 0 26px;font-weight:300">규모와 시설, 그리고<br><em>2대를 잇는 섬세함</em></h2>
          <ul class="check prose" style="font-size:1.05rem">
            <li><strong>3인 전문의 협진</strong> — 구강악안면외과·통합치의학과·보철과 전문의가 한 곳에서.</li>
            <li><strong>원내 기공실 운영</strong> — 상주 기공사와 직접 호흡을 맞춰 보철을 정밀하게.</li>
            <li><strong>수면진료 세팅</strong> — 두려움이 큰 분, 장시간 진료가 필요한 분을 위한 환경.</li>
            <li><strong>에어플로우 등 위생 관리</strong> — 깨끗하고 안심되는 진료 환경.</li>
            <li><strong>2대에 걸친 진료 철학</strong> — 필요한 진료만, 끝까지 책임지는 경험과 신뢰.</li>
          </ul>
          <a href="/mission" class="btn btn-outline" style="margin-top:24px">병원 이야기 더 보기 <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="reveal reveal-d2">
          <img src="/static/img/interior.webp" alt="올케어치과 진료 공간" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-lg)" loading="lazy">
        </div>
      </div>
    </div>
  </section>

  <!-- ============ STATS 카운트업 ============ -->
  <section class="section-sm stats-band">
    <div class="container">
      <div class="stats-grid">
        <div class="stat reveal"><div class="num"><span data-count="3">3</span></div><div class="lbl">분야별 전문의</div></div>
        <div class="stat reveal reveal-d1"><div class="num"><span data-count="1">1</span></div><div class="lbl">원내 기공실 (상주 기공사)</div></div>
        <div class="stat reveal reveal-d2"><div class="num"><span data-count="6">6</span></div><div class="lbl">야간진료 마감 20:30시</div></div>
        <div class="stat reveal reveal-d3"><div class="num"><span data-count="2023">2023</span></div><div class="lbl">개원 연도</div></div>
      </div>
    </div>
  </section>

  <!-- ============ 의료진 ============ -->
  <section class="section" id="doctors">
    <div class="container">
      <div class="section-head reveal">
        <span class="sec-label"><span class="num">04</span> 의료진</span>
        <h2>각 분야의 <em>전문의</em>가 함께합니다</h2>
        <p>입안 전체를 하나의 그림으로 보는 협진. 환자 한 분을 여러 과로 나누지 않습니다.</p>
      </div>
      <div class="doc-grid">
        ${raw(DOCTORS.map((d, i) => `
          <a href="/doctors/${d.slug}" class="doc-card reveal reveal-d${i + 1}">
            <div class="doc-photo">
              <div class="ph"><i class="fa-solid fa-user-doctor"></i></div>
            </div>
            <div class="doc-body">
              <span class="role">${d.role}</span>
              <h3>${d.name}</h3>
              <p class="title-line">${d.titleLine}</p>
              <div class="doc-tags">
                ${d.specialties.slice(0, 3).map(s => `<span>${({ implant: '임플란트', surgery: '구강외과', tmj: '턱관절', conservative: '보존치료', prosthetics: '보철', gum: '잇몸', esthetic: '심미보철', denture: '틀니' } as any)[s] || s}</span>`).join('')}
              </div>
            </div>
          </a>`).join(''))}
      </div>
    </div>
  </section>

  <!-- ============ 일반 진료 (sub) ============ -->
  <section class="section-sm" style="background:var(--beige-soft)">
    <div class="container">
      <div class="section-head reveal">
        <span class="sec-label"><span class="num">05</span> 전체 진료</span>
        <h2>일상의 <em>모든 치과 진료</em></h2>
      </div>
      <div class="tx-sub-grid">
        ${raw(SUB_TREATMENTS.map((t, i) => `
          <a href="/treatments/${t.slug}" class="tx-sub reveal reveal-d${(i % 3) + 1}">
            <span class="ico"><i class="fa-solid fa-${t.icon}"></i></span>
            <span><strong>${t.name}</strong><br><span>${t.short.slice(0, 26)}…</span></span>
          </a>`).join(''))}
      </div>
    </div>
  </section>

  <!-- ============ 진료시간 / 오시는길 요약 ============ -->
  <section class="section" id="info">
    <div class="container">
      <div class="grid-2">
        <div class="reveal">
          <span class="eyebrow">진료 안내</span>
          <h2 style="font-size:clamp(1.7rem,3.5vw,2.4rem);margin:16px 0 24px">언제 오시면 되나요?</h2>
          <div style="background:#fff;border-radius:var(--radius);border:1px solid var(--gray-100);overflow:hidden;box-shadow:var(--shadow-sm)">
            ${raw(CLINIC.hours.map(h => `
              <div style="display:flex;justify-content:space-between;padding:14px 22px;border-bottom:1px solid var(--gray-100)">
                <span style="font-weight:600;color:${h.night ? 'var(--brand)' : 'var(--ink-soft)'}">${h.day}${h.night ? ' <span style="font-size:11px;background:var(--brand-accent);color:#062b27;padding:2px 8px;border-radius:6px;margin-left:6px">야간</span>' : ''}</span>
                <span style="color:var(--gray-600)">${h.time}</span>
              </div>`).join(''))}
          </div>
          <p style="margin-top:14px;font-size:14px;color:var(--gray-600)"><i class="fa-solid fa-circle-info text-mint"></i> ${CLINIC.hoursNote} · 점심시간은 전화로 문의해 주세요.</p>
        </div>
        <div class="reveal reveal-d2">
          <span class="eyebrow">오시는 길</span>
          <h2 style="font-size:clamp(1.7rem,3.5vw,2.4rem);margin:16px 0 24px">${CLINIC.directions}</h2>
          <div class="inlink-box" style="background:var(--brand);color:#fff">
            <div style="display:flex;gap:14px;margin-bottom:18px"><i class="fa-solid fa-location-dot" style="color:var(--brand-accent-2);font-size:20px;margin-top:3px"></i><div><strong style="display:block;font-size:17px;margin-bottom:4px">${CLINIC.name}</strong>${CLINIC.address}</div></div>
            <div style="display:flex;gap:14px;margin-bottom:18px"><i class="fa-solid fa-train-subway" style="color:var(--brand-accent-2);font-size:20px;margin-top:3px"></i><div>${CLINIC.subway}</div></div>
            <div style="display:flex;gap:14px"><i class="fa-solid fa-phone" style="color:var(--brand-accent-2);font-size:20px;margin-top:3px"></i><a href="tel:${CLINIC.phoneRaw}" style="font-weight:700;font-size:18px">${CLINIC.phone}</a></div>
            <a href="/directions" class="btn btn-accent" style="width:100%;justify-content:center;margin-top:24px">지도 보기 <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ CTA ============ -->
  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="cta-band reveal">
        <h2>불편한 곳이 있으신가요?</h2>
        <p>지금 상담을 예약하시면, 진료시간에 맞춰 친절히 안내해 드리겠습니다.</p>
        <div class="actions">
          <a href="/reservation" class="btn btn-accent"><i class="fa-solid fa-calendar-check"></i> 온라인 예약 문의</a>
          <a href="tel:${CLINIC.phoneRaw}" class="btn btn-ghost"><i class="fa-solid fa-phone"></i> ${CLINIC.phone}</a>
        </div>
      </div>
    </div>
  </section>
  `

  const meta = {
    title: '올케어치과 | 약수역 임플란트·교정·심미보철 3인 전문의 치과',
    description: '약수역 5번 출구 올케어치과. 구강악안면외과·통합치의학과·보철과 3인 전문의가 임플란트, 치아교정, 심미보철을 진단부터 책임집니다. 수면진료·원내 기공실·야간진료(월·화·목 20:30).',
    path: '/',
    schema: [organizationSchema()],
  }
  return Page(meta, body)
}
