import { html, raw } from 'hono/html'
import { Page } from '../components/page'
import { organizationSchema, faqSchema } from '../components/layout'
import { CLINIC, CORE_TREATMENTS, SUB_TREATMENTS, DOCTORS, TX_IMAGES } from '../data/clinic'
import { STORY_BRANCHES } from '../data/story'
import { speakableSchema } from '../lib/seo-engine'
import { truncate } from '../lib/text'

// 핵심 진료별 영문 캐치프레이즈
const TX_ENG: Record<string, string> = {
  implant: 'Expert-Level Implant.',
  ortho: 'A Balanced Bite.',
  esthetic: 'Art, not alteration.',
}

// 섹션 헤드 — 직설적 진료 중심 (책 메타포 제거: 라벨 + 제목 + 리드)
function sectionHead(label: string, title: string, lead?: string, center = true) {
  return `
  <header class="sec-head reveal${center ? ' sec-head--center' : ''}">
    <span class="sec-kicker"><i class="hh-diamond" aria-hidden="true"></i> ${label}</span>
    <h2 class="sec-title split-rise">${title}</h2>
    ${lead ? `<p class="sec-lead">${lead}</p>` : ''}
  </header>`
}

export function HomePage(popup?: { id: string; title: string; body: string; image?: string } | null) {
  const popupHtml = popup ? `
  <!-- ============ 공지 팝업 (관리자 설정) ============ -->
  <div class="notice-pop" id="noticePop" data-pop-id="${popup.id}" role="dialog" aria-modal="true" aria-label="공지사항" hidden>
    <div class="np-backdrop" data-np-close></div>
    <div class="np-card" role="document">
      <button type="button" class="np-x" data-np-close aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>
      ${popup.image ? `<a href="/notice/${popup.id}" class="np-img"><img src="${popup.image}" alt="${popup.title.replace(/"/g, '&quot;')}" loading="lazy"></a>` : ''}
      <div class="np-body">
        <span class="np-label"><i class="fa-solid fa-bullhorn"></i> 공지사항</span>
        <h3 class="np-title">${popup.title}</h3>
        <p class="np-text">${popup.body.replace(/</g, '&lt;').slice(0, 140)}${popup.body.length > 140 ? '…' : ''}</p>
        <a href="/notice/${popup.id}" class="btn btn-primary np-more">자세히 보기 <i class="fa-solid fa-arrow-right"></i></a>
      </div>
      <div class="np-foot">
        <label class="np-dismiss"><input type="checkbox" id="npDismiss"> <span>오늘 하루 보지 않기</span></label>
        <button type="button" class="np-close-text" data-np-close>닫기</button>
      </div>
    </div>
  </div>
  <script>
    (function(){
      var pop = document.getElementById('noticePop');
      if (!pop) return;
      var id = pop.getAttribute('data-pop-id');
      var key = 'np_dismiss_' + id;
      try {
        var until = localStorage.getItem(key);
        if (until && Date.now() < parseInt(until, 10)) return; // 아직 숨김 기간
      } catch(e){}
      pop.hidden = false;
      document.body.style.overflow = 'hidden';
      function close(){
        pop.hidden = true;
        document.body.style.overflow = '';
        var cb = document.getElementById('npDismiss');
        if (cb && cb.checked) {
          try { localStorage.setItem(key, String(Date.now() + 86400000)); } catch(e){}
        }
      }
      pop.querySelectorAll('[data-np-close]').forEach(function(el){ el.addEventListener('click', close); });
      document.addEventListener('keydown', function(e){ if(e.key==='Escape' && !pop.hidden) close(); });
    })();
  </script>` : ''

  const body = html`
  ${raw(popupHtml)}
  <!-- ============ HERO — 전문의 수술 역량 (웜베이지+딥네이비) ============ -->
  <section class="hero hero--heritage" id="prologue">
    <div class="hh-panel" aria-hidden="true"></div>
    <svg class="hh-ring" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path class="hr-arc" pathLength="1" d="M 78.8 21.2 A 41 41 0 1 0 91 50" vector-effect="non-scaling-stroke"/>
      <circle class="hr-dot" cx="88" cy="14" r="2.2"/>
    </svg>
    <div class="hero-top hh-top">
      <span>ALLCARE DENTAL — ORAL & MAXILLOFACIAL SURGERY</span>
      <span class="hero-coord">37.5547°N · 127.0107°E</span>
      <span>EST. 2023 · 약수역</span>
    </div>
    <div class="hero-inner hh-grid">
      <div class="hh-copy">
        <span class="hh-eyebrow reveal"><i class="hh-diamond" aria-hidden="true"></i> 구강악안면외과 <strong>＋</strong> 통합치의학과 <em>더블보드 전문의</em> · 의식하진정법(수면치료) 병행</span>
        <h1 class="hh-title hh-title--ko">
          <span class="line-mask"><span class="hh-ko-line">고난도 임플란트,</span></span>
          <span class="line-mask"><span class="hh-italic disp hh-ko-line">책임집니다</span></span>
        </h1>
        <p class="hh-lead reveal reveal-d2">심한 뼈 소실, 실패한 임플란트, 부러진 픽스처, 상악동 거상술이 필요한 복합 케이스까지.<br>단순 식립을 넘어, <strong>정확한 진단과 수술 계획으로 끝까지 책임지는</strong> 구강악안면외과 전문의 진료.</p>
        <div class="hero-actions reveal reveal-d3">
          <a href="/treatments/implant" class="btn btn-primary">고난도 임플란트 진료 보기 <i class="fa-solid fa-arrow-right"></i></a>
          <a href="/reservation" class="btn btn-outline">상담·진단 예약</a>
        </div>
        <div class="hh-meta reveal reveal-d4">
          <div class="item"><span class="num"><span data-count="3">3</span></span><span class="lbl">분야별 전문의 협진</span></div>
          <div class="item"><span class="num">수면</span><span class="lbl">의식하진정법 병행</span></div>
          <div class="item"><span class="num"><span data-count="20" data-suffix=":30">20:30</span></span><span class="lbl">야간진료 (월·화·목)</span></div>
        </div>
      </div>
      <figure class="hh-figure reveal reveal-d2">
        <div class="hh-frame">
          <svg class="hh-frame-draw" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" aria-hidden="true">
            <rect class="hfd-rect" pathLength="1" x="0" y="0" width="100" height="100" vector-effect="non-scaling-stroke"/>
          </svg>
          <img class="hh-portrait" src="/static/img/hero-doctor.webp" alt="올케어치과 권민수 대표원장 — 약수역 임플란트·교정·심미보철 더블보드 전문의" width="819" height="1024" fetchpriority="high" />
        </div>
        <figcaption class="hh-caption"><span class="hh-cap-eng disp">${CLINIC.doctorLead?.name || '권민수'} 대표원장</span> 구강악안면외과·통합치의학과 더블보드 전문의</figcaption>
      </figure>
    </div>
    <div class="hero-foot hh-foot">
      <span class="hero-live" id="heroLive"><span class="dot"></span><span class="txt">상태 확인 중</span></span>
      <span class="hh-rule" aria-hidden="true"><i class="hh-diamond"></i></span>
      <span class="hero-now" id="heroClock">--:--:-- KST</span>
    </div>
  </section>

  <!-- ============ 신뢰 마퀴 띠 ============ -->
  <div class="marquee" aria-hidden="true">
    <div class="marquee-track">
      <span>구강악안면외과＋통합치의학과 더블보드 전문의</span><span>보철과 전문의</span>
      <span>원내 기공실</span><span>수면 진료</span><span>야간 진료</span>
      <span>구강악안면외과＋통합치의학과 더블보드 전문의</span><span>보철과 전문의</span>
      <span>원내 기공실</span><span>수면 진료</span><span>야간 진료</span>
    </div>
  </div>

  <!-- ============ 강점 3대 포인트 (직설적 진료 중심 — 책 메타포 제거) ============ -->
  <section class="section keypoints-sec" id="why">
    <div class="container">
      ${raw(sectionHead('왜 올케어치과인가', '<em>어려운 케이스</em>일수록, 전문의 진료가 다릅니다',
    '단순 식립을 넘어 진단·수술·보철의 전 과정을 전문의가 일관되게 책임집니다. 그 핵심을 세 가지로 정리했습니다.'))}
      <div class="keypoints-grid">
        ${raw(CLINIC.strengths.slice(0, 3).map((s, i) => `
          <article class="keypoint reveal reveal-d${i + 1}">
            <span class="kp-no">0${i + 1}</span>
            <span class="kp-ico"><i class="fa-solid fa-${s.icon}"></i></span>
            <h3 class="kp-title">${s.title}</h3>
            <p class="kp-desc">${s.desc}</p>
          </article>`).join(''))}
      </div>
    </div>
  </section>

  <!-- ============ 핵심 진료 ============ -->
  <section class="section" style="background:var(--ivory-2)" id="core-tx">
    <div class="container">
      ${raw(sectionHead('핵심 진료', '전문의가 <em>직접 맡는</em> 진료',
    '구강악안면외과·보철과·통합치의학과 전문의가 진단부터 수술·보철·사후관리까지 한 팀으로 책임집니다.'))}
      <div class="tx-feature">
        ${raw(CORE_TREATMENTS.map((t, i) => `
          <article class="tx-article reveal">
            <a href="/treatments/${t.slug}" class="tx-art-media tilt media-mask zoom-media" data-cursor-label="VIEW" aria-label="${t.name} 자세히 보기">
              <span class="tag">0${i + 1} · ${t.name}</span>
              <img src="${TX_IMAGES[t.slug] || '/static/img/interior.webp'}" alt="${t.name} 진료" loading="lazy">
              <span class="zm-label"><span class="zm-t">${TX_ENG[t.slug] || t.name}</span><span class="zm-go"><i class="fa-solid fa-arrow-right"></i></span></span>
            </a>
            <div class="tx-art-body">
              <span class="tx-no">0${i + 1}</span>
              <span class="tx-eng disp">${TX_ENG[t.slug] || ''}</span>
              <h3>${t.hero}</h3>
              <p>${t.intro}</p>
              <a href="/treatments/${t.slug}" class="link-arrow">자세히 보기 <i class="fa-solid fa-arrow-right"></i></a>
            </div>
          </article>`).join(''))}
      </div>
    </div>
  </section>

  <!-- ============ 키네틱 디스플레이 띠 ============ -->
  <section class="kinetic" aria-hidden="true">
    <div class="kinetic-track">
      <span class="lit">Solving&nbsp;the&nbsp;Difficult&nbsp;Cases.</span><span class="out">Solving&nbsp;the&nbsp;Difficult&nbsp;Cases.</span>
      <span class="lit">Solving&nbsp;the&nbsp;Difficult&nbsp;Cases.</span><span class="out">Solving&nbsp;the&nbsp;Difficult&nbsp;Cases.</span>
    </div>
    <div class="kinetic-track">
      <span class="out">From&nbsp;Diagnosis&nbsp;to&nbsp;Recovery.</span><span class="lit">From&nbsp;Diagnosis&nbsp;to&nbsp;Recovery.</span>
      <span class="out">From&nbsp;Diagnosis&nbsp;to&nbsp;Recovery.</span><span class="lit">From&nbsp;Diagnosis&nbsp;to&nbsp;Recovery.</span>
    </div>
    <p class="kinetic-sub">진단부터 회복까지 — 어려운 케이스를 끝까지 해결하는 한 곳의 진료</p>
  </section>

  <!-- ============ 의료진 ============ -->
  <section class="section" id="doctors">
    <div class="container">
      ${raw(sectionHead('의료진', '<em>3인 전문의</em> 통합진료팀',
    '수술·보철·교정·턱관절까지 한 공간에서. 복잡한 케이스일수록 여러 전문 영역의 관점을 함께 반영합니다.'))}
      <div class="doc-grid">
        ${raw(DOCTORS.map((d, i) => `
          <a href="/doctors/${d.slug}" class="doc-card reveal reveal-d${i + 1}">
            <div class="doc-photo"><img src="${d.photo}" alt="${d.name} ${d.role}" loading="lazy" style="width:100%;height:100%;object-fit:cover;object-position:top center"></div>
            <div class="doc-body">
              <span class="role">${d.role}</span>
              <h3>${d.name}</h3>
              <p class="title-line">${d.titleLine}</p>
              <p class="doc-career">${d.career[0]}</p>
              <div class="doc-tags">
                ${d.specialties.slice(0, 3).map(s => `<span>${({ implant: '임플란트', surgery: '구강외과', tmj: '턱관절', conservative: '보존치료', prosthetics: '보철', gum: '잇몸', esthetic: '심미보철', denture: '틀니' } as any)[s] || s}</span>`).join('')}
              </div>
            </div>
          </a>`).join(''))}
      </div>

      <!-- 차별점 (옵션 B: 헤더 좌우 분할 + 강점 3×2 카드 그리드) -->
      <div class="why-allcare" style="margin-top:90px">
        <div class="why-head grid-2">
          <div class="reveal">
            <span class="sec-label"><span class="num">03-1</span> Why ALLCARE</span>
            <h2 style="font-size:clamp(2rem,4vw,3.2rem);margin:22px 0 22px">왜 <em>전문의 진료</em>가<br>다른가</h2>
            <p style="color:var(--ink-soft,#5a6b78);line-height:1.8;max-width:460px">
              임플란트의 성패는 식립 그 자체보다 식립 이전의 진단에서 갈립니다.
              구강악안면외과 전문의가 진단·수술·보철의 전 과정을 일관되게 책임지는
              여섯 가지 강점으로 답합니다.
            </p>
            <a href="/mission" class="btn btn-outline" style="margin-top:28px">병원 이야기 더 보기 <i class="fa-solid fa-arrow-right"></i></a>
          </div>
          <div class="media-mask zoom-media reveal reveal-d2" data-drift="34" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-lg)">
            <img src="/static/img/interior.webp" alt="올케어치과 대기 라운지 — 약수역 더그레이스빌딩 4층" style="aspect-ratio:3/2;object-fit:cover;width:100%" loading="lazy">
            <span class="zm-label"><span class="zm-t">대기 라운지</span></span>
          </div>
        </div>
        <dl class="why-grid reveal reveal-d1">
          ${raw(CLINIC.strengths.map((s, i) => `
            <div class="why-card">
              <span class="why-no">0${i + 1}</span>
              <span class="why-ico"><i class="fa-solid fa-${s.icon}"></i></span>
              <dt>${s.title}</dt>
              <dd>${s.desc}</dd>
            </div>`).join(''))}
        </dl>
      </div>

      <!-- 원내 디지털 기공실 — '상주 기공사' 주장을 실제 장비로 증명 (§L: 자료1.docx 원내 기공실 강점) -->
      <div class="lab-gallery reveal" style="margin-top:90px">
        <div style="text-align:center;margin-bottom:38px">
          <span class="sec-label" style="justify-content:center"><span class="num">03-2</span> In-House Digital Lab</span>
          <h2 style="font-size:clamp(1.8rem,3.4vw,2.7rem);margin:18px 0 14px">원내 디지털 기공실</h2>
          <p style="max-width:620px;margin:0 auto;color:var(--ink-soft,#5a6b78);line-height:1.75">
            보철물을 외부에 맡기지 않습니다. 상주 기공사가 CAD 설계부터 밀링·소성·3D 프린팅까지
            원내에서 직접 제작해, 환자의 입에 맞을 때까지 빠르게 다듬습니다.
          </p>
        </div>
        <div class="lab-grid">
          <figure class="lab-cell lab-cell--wide">
            <img src="/static/img/lab-cad.webp" alt="원내 기공실 CAD 보철 설계 모니터 — 3Shape 디지털 디자인" loading="lazy">
            <figcaption>CAD 보철 설계 — 디지털 디자인</figcaption>
          </figure>
          <figure class="lab-cell">
            <img src="/static/img/lab-mill.webp" alt="원내 기공실 지르코니아 밀링 머신" loading="lazy">
            <figcaption>지르코니아 밀링</figcaption>
          </figure>
          <figure class="lab-cell">
            <img src="/static/img/lab-furnace.webp" alt="원내 기공실 포세린 소성 가마" loading="lazy">
            <figcaption>포세린 소성 가마</figcaption>
          </figure>
          <figure class="lab-cell">
            <img src="/static/img/lab-printer.webp" alt="원내 기공실 치과용 3D 프린터" loading="lazy">
            <figcaption>3D 프린팅</figcaption>
          </figure>
          <figure class="lab-cell">
            <img src="/static/img/lab-scan.webp" alt="원내 기공실 디지털 스캐너" loading="lazy">
            <figcaption>디지털 스캔</figcaption>
          </figure>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ 진료 기반 숫자 ============ -->
  <section class="section-sm stats-band" id="facts">
    <div class="container">
      <div class="ch-band-head reveal">
        <span class="ch-no-light disp">By the Numbers</span>
        <svg class="cb-orna" viewBox="0 0 120 12" fill="none" aria-hidden="true">
          <line class="co-line" pathLength="1" x1="0" y1="6" x2="48" y2="6"/>
          <path class="cb-dia" d="M60 1 L65 6 L60 11 L55 6 Z"/>
          <line class="co-line co-line2" pathLength="1" x1="72" y1="6" x2="120" y2="6"/>
        </svg>
        <h2>진료의 기반</h2>
        <p>고난도 케이스를 끝까지 책임지는 진료 환경입니다.</p>
      </div>
      <div class="stats-grid">
        <div class="stat reveal"><div class="num"><span data-count="3">3</span></div><div class="lbl">분야별 전문의</div></div>
        <div class="stat reveal reveal-d1"><div class="num"><span data-count="1">1</span></div><div class="lbl">원내 기공실 (상주 기공사)</div></div>
        <div class="stat reveal reveal-d2"><div class="num"><span data-count="20" data-suffix=":30">20:30</span></div><div class="lbl">야간진료 마감 (월·화·목)</div></div>
        <div class="stat reveal reveal-d3"><div class="num"><span data-count="2023">2023</span></div><div class="lbl">개원 연도</div></div>
      </div>
      <div class="reveal reveal-d3" style="text-align:center;margin-top:42px">
        <a href="/cases" class="btn btn-ghost">비포 / 애프터 이야기 보기 <i class="fa-solid fa-arrow-right"></i></a>
      </div>
    </div>
  </section>

  <!-- ============ 진료 여정 (페이션트 퍼널 프로세스) ============ -->
  <section class="section journey-sec" id="ch-journey">
    <div class="container">
      <div class="reveal" style="text-align:center;margin-bottom:54px">
        <span class="disp" style="font-size:13px;letter-spacing:.14em;color:var(--brand-accent);text-transform:uppercase">Your Care Journey</span>
        <h2 style="font-size:clamp(1.7rem,4vw,2.4rem);margin:14px 0 12px">처음 오신 순간부터, <em>오래도록 곁에</em></h2>
        <p style="color:var(--gray-600);max-width:600px;margin:0 auto">올케어치과는 한 번의 치료로 끝나지 않습니다. 인지부터 사후관리까지, 흩어지지 않는 다섯 단계로 함께합니다.</p>
      </div>
      <ol class="journey-track">
        ${raw(CLINIC.journey.map((j, i) => `
          <li class="journey-step reveal reveal-d${(i % 4) + 1}">
            <div class="js-line" aria-hidden="true"></div>
            <div class="js-node"><i class="fa-solid fa-${j.icon}"></i></div>
            <div class="js-body">
              <span class="js-no">STEP ${j.step}</span>
              <h3 class="js-title">${j.title}</h3>
              <p class="js-desc">${j.desc}</p>
            </div>
          </li>`).join(''))}
      </ol>
    </div>
  </section>

  <!-- ============ 대표 치료 사례 (실제 진료 경험 기반 — 의료광고법 준수) ============ -->
  <section class="section cases-sec" id="ch-cases" style="background:var(--ivory-2)">
    <div class="container">
      <div class="reveal" style="text-align:center;margin-bottom:28px">
        <span class="disp" style="font-size:13px;letter-spacing:.14em;color:var(--brand-accent);text-transform:uppercase">대표 치료 사례</span>
        <h2 style="font-size:clamp(1.7rem,4vw,2.4rem);margin:14px 0 10px">끝까지 <em>해결 방법</em>을 찾은 진료</h2>
        <p class="answer-box" style="max-width:680px;margin:0 auto">단순히 많은 케이스를 진행하는 병원이 아니라, 어려운 케이스일수록 정확한 진단과 수술 계획으로 끝까지 해결 방법을 찾고, 환자의 불안과 부담까지 함께 고려하는 진료를 지향합니다.</p>
      </div>
      <div class="cases-grid">
        ${raw(CLINIC.cases.map((cs, i) => `
          <article class="case-card reveal reveal-d${(i % 2) + 1}">
            <header class="case-head">
              <span class="case-tag"><i class="fa-solid fa-${cs.icon}"></i> ${cs.tag}</span>
              <h3 class="case-title">${cs.title}</h3>
              <p class="case-sub">${cs.sub}</p>
            </header>
            <div class="case-body">
              <div class="case-step"><span class="case-step-label">상황</span><p>${cs.before}</p></div>
              <div class="case-step"><span class="case-step-label">진료</span><p>${cs.process}</p></div>
              <div class="case-step"><span class="case-step-label">결과</span><p>${cs.result}</p></div>
            </div>
            ${cs.voice ? `<blockquote class="case-voice">"${cs.voice}"</blockquote>` : ''}
          </article>`).join(''))}
      </div>
      <p class="reviews-note reveal">※ 위 사례는 실제 진료 경험을 바탕으로 환자 동의를 받아 재구성한 것으로, 치료 결과는 환자 개인의 상태에 따라 차이가 있을 수 있습니다.</p>
    </div>
  </section>

  <!-- ============ 증상별 안내 (스토리 네비게이터 — 하단 보조 도구로 이동) ============ -->
  <section class="section story-nav" id="symptoms">
    <div class="container">
      ${raw(sectionHead('증상별 안내', '지금 가장 불편한 곳은 <em>어디</em>인가요?',
    '증상을 골라주세요. 전문의가 어떤 진단과 치료로 접근하는지 바로 안내해 드립니다.'))}
      <div class="sn-chips reveal reveal-d2" role="tablist" aria-label="불편 증상 선택">
        ${raw(STORY_BRANCHES.map((b, i) => `
          <button class="sn-chip${i === 0 ? ' on' : ''}" data-branch="${b.id}" role="tab" aria-selected="${i === 0}">
            <i class="fa-solid fa-${b.icon}"></i> ${b.chip}
          </button>`).join(''))}
      </div>
      <div class="sn-stage reveal reveal-d3">
        ${raw(STORY_BRANCHES.map((b, i) => `
          <article class="sn-card${i === 0 ? ' active' : ''}" data-branch-card="${b.id}" role="tabpanel">
            <div class="sn-body">
              <span class="sn-tag disp">${b.chip}</span>
              <p class="sn-empathy">"${b.empathy}"</p>
              <p class="sn-guide">${b.guide}</p>
              <div class="sn-faq">
                <span class="q"><i class="fa-solid fa-circle-question"></i> ${b.faq.q}</span>
                <span class="a">${b.faq.a}</span>
              </div>
            </div>
            <div class="sn-links">
              <a href="/treatments/${b.treatment}" class="sn-link main">
                <span class="t">관련 진료</span>
                <strong>${b.treatmentName} <i class="fa-solid fa-arrow-right"></i></strong>
              </a>
              <a href="/doctors/${b.doctor}" class="sn-link">
                <span class="t">담당 전문의</span>
                <strong>${b.doctorName} <i class="fa-solid fa-arrow-right"></i></strong>
              </a>
              <a href="/cases?cat=${b.treatment}" class="sn-link">
                <span class="t">진료 사례</span>
                <strong>사례 보기 <i class="fa-solid fa-arrow-right"></i></strong>
              </a>
              <a href="/reservation" class="btn btn-accent sn-cta">이 증상으로 상담 예약 <i class="fa-solid fa-arrow-right"></i></a>
            </div>
          </article>`).join(''))}
      </div>
    </div>
  </section>

  <!-- ============ 일상 관리 (진료시간 / 오시는 길 + 일반 진료) ============ -->
  <section class="section" style="background:var(--ivory-2)" id="daily">
    <div class="container">
      ${raw(sectionHead('일상 관리', '큰 치료부터 <em>일상 관리</em>까지',
    '고난도 수술만이 아니라, 충치·잇몸·검진 같은 일상 진료까지 한 곳에서 이어서 관리합니다.'))}

      <div class="tx-sub-grid">
        ${raw(SUB_TREATMENTS.map((t, i) => `
          <a href="/treatments/${t.slug}" class="tx-sub reveal reveal-d${(i % 3) + 1}">
            <span class="ico"><i class="fa-solid fa-${t.icon}"></i></span>
            <span><strong>${t.name}</strong><br><span>${truncate(t.short, 26)}</span></span>
          </a>`).join(''))}
      </div>

      <div class="grid-2" style="align-items:start;margin-top:80px">
        <div class="reveal">
          <span class="sec-label"><span class="num">05-1</span> Visit Us</span>
          <h2 style="font-size:clamp(1.7rem,3.5vw,2.4rem);margin:18px 0 24px">언제 오시면 되나요?</h2>
          <div style="background:#fffeee;border-radius:var(--radius-lg);border:1px solid var(--line);overflow:hidden;box-shadow:var(--shadow-sm)">
            ${raw(CLINIC.hours.map(h => `
              <div style="display:flex;justify-content:space-between;padding:15px 22px;border-bottom:1px solid var(--line-soft)">
                <span style="font-weight:600;color:${h.night ? 'var(--mint)' : 'var(--ink-soft)'}">${h.day}${h.night ? ' <span style="font-size:11px;background:var(--mint);color:#fffeee;padding:2px 8px;border-radius:999px;margin-left:6px">야간</span>' : ''}</span>
                <span style="color:var(--gray-600);font-family:var(--font-disp)">${h.time}</span>
              </div>`).join(''))}
          </div>
          <p style="margin-top:14px;font-size:14px;color:var(--gray-600)"><i class="fa-solid fa-circle-info text-mint"></i> ${CLINIC.hoursNote} · 점심시간은 전화로 문의해 주세요.</p>
        </div>
        <div class="reveal reveal-d2">
          <span class="sec-label"><span class="num">05-2</span> Directions</span>
          <h2 style="font-size:clamp(1.7rem,3.5vw,2.4rem);margin:18px 0 24px">${CLINIC.directions}</h2>
          <div class="inlink-box" style="background:var(--navy-900);color:#fffeee">
            <div style="display:flex;gap:14px;margin-bottom:18px"><i class="fa-solid fa-location-dot" style="color:var(--gold-300);font-size:20px;margin-top:3px"></i><div><strong style="display:block;font-size:17px;margin-bottom:4px">${CLINIC.name}</strong>${CLINIC.address}</div></div>
            <div style="display:flex;gap:14px;margin-bottom:18px"><i class="fa-solid fa-train-subway" style="color:var(--gold-300);font-size:20px;margin-top:3px"></i><div>${CLINIC.subway}</div></div>
            <div style="display:flex;gap:14px"><i class="fa-solid fa-phone" style="color:var(--gold-300);font-size:20px;margin-top:3px"></i><a href="tel:${CLINIC.phoneRaw}" style="font-weight:700;font-size:18px;font-family:var(--font-disp)">${CLINIC.phone}</a></div>
            <div class="pay-chips" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:18px">
              ${raw(CLINIC.payments.map(p => `<span class="pay-chip" title="${p.desc}"><i class="fa-solid fa-${p.icon}"></i> ${p.name}</span>`).join(''))}
            </div>
            ${CLINIC.sns.kakao ? raw(`<a href="${CLINIC.sns.kakao}" class="btn btn-kakao" target="_blank" rel="noopener" style="width:100%;justify-content:center;margin-top:14px"><i class="fa-solid fa-comment"></i> 카카오톡으로 빠른 상담</a>`) : ''}
            <a href="/directions" class="btn btn-accent" style="width:100%;justify-content:center;margin-top:14px">지도 보기 <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ CTA — 상담·예약 (직설적) ============ -->
  <section class="section" style="padding-top:0" id="cta">
    <div class="container">
      <div class="cta-band reveal epilogue-band">
        <svg class="cta-ring" viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <path class="cr-arc" pathLength="1" d="M 78.8 21.2 A 41 41 0 1 0 91 50" vector-effect="non-scaling-stroke"/>
          <circle class="cr-dot" cx="88" cy="14" r="2.2"/>
        </svg>
        <span class="kicker" style="color:var(--gold-300);display:block;margin-bottom:18px">상담·진단 예약</span>
        <h2>어렵다고 들으셨던 케이스,<br>먼저 정확하게 진단받아 보세요</h2>
        <p>구강악안면외과 전문의가 직접 상태를 확인하고, 가능한 치료 방법을 솔직하게 안내해 드립니다.</p>
        <div class="actions">
          <a href="/reservation" class="btn btn-accent"><i class="fa-solid fa-calendar-check"></i> 상담·진단 예약하기</a>
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
    ogImage: `https://${CLINIC.domain}/og/home/main.svg`,
    preloadImage: '/static/img/hero-doctor.webp',
    keywords: '약수역 치과,약수역 임플란트,약수역 교정,약수역 심미보철,올케어치과,약수동 치과,중구 치과',
    schema: [
      organizationSchema(),
      faqSchema([
        ...CLINIC.strengths.map(s => ({ q: s.head, a: s.desc })),
        ...STORY_BRANCHES.slice(0, 4).map(b => b.faq),
      ]),
      speakableSchema(['.answer-box', 'h1', 'h2']),
    ].filter(Boolean),
  }
  return Page(meta, body)
}
