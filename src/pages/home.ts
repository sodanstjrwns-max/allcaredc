import { html, raw } from 'hono/html'
import { Page } from '../components/page'
import { organizationSchema, faqSchema } from '../components/layout'
import { CLINIC, CORE_TREATMENTS, SUB_TREATMENTS, DOCTORS, TX_IMAGES } from '../data/clinic'
import { STORY_BRANCHES, HOME_CHAPTERS } from '../data/story'
import { speakableSchema, reviewSchema } from '../lib/seo-engine'
import { truncate } from '../lib/text'

// 핵심 진료별 영문 캐치프레이즈
const TX_ENG: Record<string, string> = {
  implant: 'Expert-Level Implant.',
  ortho: 'A Balanced Bite.',
  esthetic: 'Art, not alteration.',
}

// 챕터 헤드 (책 페이지 메타포) — 페이블 모티프 공통 컴포넌트
function chapterHead(no: string, eng: string, title: string, lead?: string) {
  return `
  <header class="chapter-head reveal">
    <div class="ch-row">
      <span class="ch-no disp">${no}</span>
      <svg class="ch-orna" viewBox="0 0 100 10" preserveAspectRatio="none" fill="none" aria-hidden="true">
        <line class="co-line" pathLength="1" x1="0" y1="5" x2="100" y2="5" vector-effect="non-scaling-stroke"/>
      </svg>
      <i class="hh-diamond co-dia" aria-hidden="true"></i>
      <span class="ch-eng">${eng}</span>
    </div>
    <h2 class="ch-title split-rise">${title}</h2>
    ${lead ? `<p class="ch-lead">${lead}</p>` : ''}
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
  <!-- ============ 챕터 레일 (책갈피 내비) ============ -->
  <nav class="chapter-rail" id="chapterRail" aria-label="페이지 챕터">
    ${raw(HOME_CHAPTERS.map(c => `
      <a href="#${c.id}" data-ch="${c.id}" class="cr-item">
        <span class="cr-no">${c.no}</span>
        <span class="cr-label">${c.label}</span>
        <span class="cr-tick" aria-hidden="true"></span>
      </a>`).join(''))}
  </nav>

  <!-- ============ PROLOGUE — Heritage 에디토리얼 오프닝 (웜베이지+딥네이비) ============ -->
  <section class="hero hero--heritage" id="prologue">
    <div class="hh-panel" aria-hidden="true"></div>
    <svg class="hh-ring" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path class="hr-arc" pathLength="1" d="M 78.8 21.2 A 41 41 0 1 0 91 50" vector-effect="non-scaling-stroke"/>
      <circle class="hr-dot" cx="88" cy="14" r="2.2"/>
    </svg>
    <div class="hero-top hh-top">
      <span>ALLCARE DENTAL — A PATIENT'S STORY</span>
      <span class="hero-coord">37.5547°N · 127.0107°E</span>
      <span>EST. 2023 · 약수역</span>
    </div>
    <div class="hero-inner hh-grid">
      <div class="hh-copy">
        <span class="hh-eyebrow reveal"><i class="hh-diamond" aria-hidden="true"></i> Prologue — 어느 날, 작은 불편이 시작되었다</span>
        <h1 class="hh-title" data-morph>
          <span class="line-mask"><span class="morph-line">Every smile</span></span>
          <span class="line-mask"><span class="hh-italic disp morph-line">has a story.</span></span>
        </h1>
        <p class="hh-lead reveal reveal-d2">시린 이 하나, 미뤄둔 사랑니 하나에서 이야기는 시작됩니다.<br>이 이야기의 주인공은 병원이 아니라, <strong>당신</strong>입니다.</p>
        <div class="hero-actions reveal reveal-d3">
          <a href="#your-story" class="btn btn-primary">나의 이야기 시작하기 <i class="fa-solid fa-arrow-down"></i></a>
          <a href="/reservation" class="btn btn-outline">바로 예약 문의</a>
        </div>
        <div class="hh-meta reveal reveal-d4">
          <div class="item"><span class="num"><span data-count="3">3</span></span><span class="lbl">분야별 전문의</span></div>
          <div class="item"><span class="num"><span data-count="10" data-suffix="+">10+</span></span><span class="lbl">진료 영역</span></div>
          <div class="item"><span class="num"><span data-count="20" data-suffix=":30">20:30</span></span><span class="lbl">야간진료 (월·화·목)</span></div>
        </div>
      </div>
      <figure class="hh-figure reveal reveal-d2">
        <div class="hh-frame">
          <svg class="hh-frame-draw" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" aria-hidden="true">
            <rect class="hfd-rect" pathLength="1" x="0" y="0" width="100" height="100" vector-effect="non-scaling-stroke"/>
          </svg>
          <img src="/static/img/hero.webp" alt="올케어치과 인포메이션 데스크 — 약수역 임플란트·교정·심미보철 전문의 치과" width="1600" height="1067" fetchpriority="high" />
        </div>
        <figcaption class="hh-caption"><span class="hh-cap-eng disp">Inside ALLCARE</span> 약수역 5번 출구, 더그레이스빌딩 4층</figcaption>
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
      <span>구강악안면외과 전문의</span><span>통합치의학과 전문의</span><span>보철과 전문의</span>
      <span>원내 기공실</span><span>수면 진료</span><span>야간 진료</span>
      <span>구강악안면외과 전문의</span><span>통합치의학과 전문의</span><span>보철과 전문의</span>
      <span>원내 기공실</span><span>수면 진료</span><span>야간 진료</span>
    </div>
  </div>

  <!-- ============ CHAPTER 00 — 당신의 이야기 (스토리 네비게이터) ============ -->
  <section class="section story-nav" id="your-story">
    <div class="container">
      ${raw(chapterHead('00', 'Where does your story begin?', '당신의 이야기는 <em>어디쯤</em>인가요?',
    '불편을 골라주세요. 그 자리에서 이야기를 이어가겠습니다.'))}
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
              <span class="sn-tag disp">Chapter for you</span>
              <p class="sn-empathy">"${b.empathy}"</p>
              <p class="sn-guide">${b.guide}</p>
              <div class="sn-faq">
                <span class="q"><i class="fa-solid fa-circle-question"></i> ${b.faq.q}</span>
                <span class="a">${b.faq.a}</span>
              </div>
            </div>
            <div class="sn-links">
              <a href="/treatments/${b.treatment}" class="sn-link main">
                <span class="t">이어지는 진료 이야기</span>
                <strong>${b.treatmentName} <i class="fa-solid fa-arrow-right"></i></strong>
              </a>
              <a href="/doctors/${b.doctor}" class="sn-link">
                <span class="t">함께할 사람</span>
                <strong>${b.doctorName} <i class="fa-solid fa-arrow-right"></i></strong>
              </a>
              <a href="/cases?cat=${b.treatment}" class="sn-link">
                <span class="t">먼저 다녀간 이야기</span>
                <strong>진료사례 보기 <i class="fa-solid fa-arrow-right"></i></strong>
              </a>
              <a href="/reservation" class="btn btn-accent sn-cta">이 이야기로 상담 예약 <i class="fa-solid fa-arrow-right"></i></a>
            </div>
          </article>`).join(''))}
      </div>
    </div>
  </section>

  <!-- ============ CHAPTER 01 — 공감 (철학 핀드 시퀀스) ============ -->
  <section class="philo-pin" id="ch-empathy" data-philo-pin>
    <div class="philo-sticky">
      <div class="container philo-grid">
        <div class="philo-aside">
          <span class="sec-label"><span class="num">Chapter 01</span> Empathy, First</span>
          <h2 class="philo-h2">치료 이전에,<br><em>불편을 먼저</em> 읽습니다</h2>
          <p class="philo-lead">${CLINIC.philosophy}</p>
          <svg class="philo-path" viewBox="0 0 4 200" preserveAspectRatio="none" aria-hidden="true">
            <line x1="2" y1="0" x2="2" y2="200" class="philo-path-bg"/>
            <line x1="2" y1="0" x2="2" y2="200" class="philo-path-fg" id="philoPathFg"/>
          </svg>
          <ol class="philo-index" aria-hidden="true">
            ${raw(CLINIC.values.map((v, i) => `<li data-i="${i}"><span class="pi-no">0${i + 1}</span> ${v.title}</li>`).join(''))}
          </ol>
        </div>
        <div class="philo-stage">
          ${raw(CLINIC.values.map((v, i) => `
            <article class="philo-step${i === 0 ? ' active' : ''}" data-step="${i}">
              <span class="ps-no">0${i + 1}<span class="ps-total">/ 0${CLINIC.values.length}</span></span>
              <span class="ps-ico"><i class="fa-solid fa-${v.icon}"></i></span>
              <h3>${v.title}</h3>
              <p class="ps-lead">${v.lead}</p>
              <p class="ps-body">${v.desc}</p>
            </article>`).join(''))}
        </div>
      </div>
    </div>
    <div class="philo-track" data-steps="${CLINIC.values.length}"></div>
  </section>

  <!-- ============ CHAPTER 02 — 만남 (핵심 진료) ============ -->
  <section class="section" style="background:var(--ivory-2)" id="ch-meeting">
    <div class="container">
      ${raw(chapterHead('02', 'The Meeting', '불편이 <em>해답을 만나는</em> 자리',
    '분야별 전문의가 진단부터 마무리까지 일관되게 맡습니다. 세 가지 깊은 이야기.'))}
      <div class="tx-feature">
        ${raw(CORE_TREATMENTS.map((t, i) => `
          <article class="tx-article reveal">
            <a href="/treatments/${t.slug}" class="tx-art-media tilt media-mask zoom-media" data-cursor-label="READ" aria-label="${t.name} 자세히 보기">
              <span class="tag">Story 0${i + 1} · ${t.name}</span>
              <img src="${TX_IMAGES[t.slug] || '/static/img/interior.webp'}" alt="${t.name} 진료" loading="lazy">
              <span class="zm-label"><span class="zm-t">${TX_ENG[t.slug] || t.name}</span><span class="zm-go"><i class="fa-solid fa-arrow-right"></i></span></span>
            </a>
            <div class="tx-art-body">
              <span class="tx-no">Story 0${i + 1}</span>
              <span class="tx-eng disp">${TX_ENG[t.slug] || ''}</span>
              <h3>${t.hero}</h3>
              <p>${truncate(t.intro, 130)}</p>
              <a href="/treatments/${t.slug}" class="link-arrow">이 이야기 읽기 <i class="fa-solid fa-arrow-right"></i></a>
            </div>
          </article>`).join(''))}
      </div>
    </div>
  </section>

  <!-- ============ 키네틱 디스플레이 띠 ============ -->
  <section class="kinetic" aria-hidden="true">
    <div class="kinetic-track">
      <span class="lit">Every&nbsp;smile&nbsp;has&nbsp;a&nbsp;story.</span><span class="out">Every&nbsp;smile&nbsp;has&nbsp;a&nbsp;story.</span>
      <span class="lit">Every&nbsp;smile&nbsp;has&nbsp;a&nbsp;story.</span><span class="out">Every&nbsp;smile&nbsp;has&nbsp;a&nbsp;story.</span>
    </div>
    <div class="kinetic-track">
      <span class="out">From&nbsp;Diagnosis&nbsp;to&nbsp;Recovery.</span><span class="lit">From&nbsp;Diagnosis&nbsp;to&nbsp;Recovery.</span>
      <span class="out">From&nbsp;Diagnosis&nbsp;to&nbsp;Recovery.</span><span class="lit">From&nbsp;Diagnosis&nbsp;to&nbsp;Recovery.</span>
    </div>
    <p class="kinetic-sub">진단부터 회복까지, 흩어지지 않는 한 곳의 진료</p>
  </section>

  <!-- ============ CHAPTER 03 — 사람들 (의료진) ============ -->
  <section class="section" id="ch-people">
    <div class="container">
      ${raw(chapterHead('03', 'The People', '이야기를 <em>함께 쓰는</em> 사람들',
    '입안 전체를 하나의 그림으로 보는 협진. 환자 한 분을 여러 과로 나누지 않습니다.'))}
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
            <h2 style="font-size:clamp(2rem,4vw,3.2rem);margin:22px 0 22px">규모와 시설, 그리고 <br><em>끝까지 잇는 섬세함</em></h2>
            <p style="color:var(--ink-soft,#5a6b78);line-height:1.8;max-width:460px">
              겉으로 드러나는 규모와 장비를 넘어, 진단부터 회복까지 한 사람의 치아를
              끝까지 책임지는 여섯 가지 약속으로 답합니다.
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

  <!-- ============ CHAPTER 04 — 회복 (사례·숫자) ============ -->
  <section class="section-sm stats-band" id="ch-recovery">
    <div class="container">
      <div class="ch-band-head reveal">
        <span class="ch-no-light disp">Chapter 04</span>
        <svg class="cb-orna" viewBox="0 0 120 12" fill="none" aria-hidden="true">
          <line class="co-line" pathLength="1" x1="0" y1="6" x2="48" y2="6"/>
          <path class="cb-dia" d="M60 1 L65 6 L60 11 L55 6 Z"/>
          <line class="co-line co-line2" pathLength="1" x1="72" y1="6" x2="120" y2="6"/>
        </svg>
        <h2>회복의 기록</h2>
        <p>먼저 다녀간 분들의 이야기가 쌓여갑니다.</p>
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

  <!-- ============ 환자 후기 ============ -->
  <section class="section reviews-sec" id="ch-reviews" style="background:var(--ivory-2)">
    <div class="container">
      <div class="reveal" style="text-align:center;margin-bottom:14px">
        <span class="disp" style="font-size:13px;letter-spacing:.14em;color:var(--brand-accent);text-transform:uppercase">Patient Voices</span>
        <h2 style="font-size:clamp(1.7rem,4vw,2.4rem);margin:14px 0 10px">먼저 다녀간 분들의 <em>진심</em></h2>
        <div class="reviews-rating">
          <span class="rr-stars">${raw('<i class="fa-solid fa-star"></i>'.repeat(5))}</span>
          <strong>5.0</strong>
          <span class="rr-count">· 내원 환자 후기 ${CLINIC.reviews.length}건</span>
        </div>
      </div>
      <div class="reviews-grid">
        ${raw(CLINIC.reviews.map((r, i) => `
          <figure class="review-card reveal reveal-d${(i % 3) + 1}">
            <div class="rc-stars">${'<i class="fa-solid fa-star"></i>'.repeat(r.rating)}</div>
            <blockquote class="rc-text">${r.text}</blockquote>
            <figcaption class="rc-meta">
              <span class="rc-avatar" aria-hidden="true">${r.name.charAt(0)}</span>
              <span class="rc-who"><strong>${r.name}</strong><span>${r.area} · ${r.treatment}</span></span>
            </figcaption>
          </figure>`).join(''))}
      </div>
      <p class="reviews-note reveal">※ 환자 개인의 경험으로 치료 결과는 개인에 따라 차이가 있을 수 있습니다. 동의를 받은 후기만 게재합니다.</p>
    </div>
  </section>

  <!-- ============ CHAPTER 05 — 일상 (진료시간 / 오시는 길 + 일반 진료) ============ -->
  <section class="section" id="ch-daily">
    <div class="container">
      ${raw(chapterHead('05', 'Back to Daily Life', '다시, <em>아무렇지 않은</em> 일상으로',
    '치료의 끝은 병원이 아니라 당신의 식탁과 웃음입니다. 일상의 모든 진료가 곁에 있습니다.'))}

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
            <a href="/directions" class="btn btn-accent" style="width:100%;justify-content:center;margin-top:24px">지도 보기 <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ EPILOGUE — CTA ============ -->
  <section class="section" style="padding-top:0" id="epilogue">
    <div class="container">
      <div class="cta-band reveal epilogue-band">
        <svg class="cta-ring" viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <path class="cr-arc" pathLength="1" d="M 78.8 21.2 A 41 41 0 1 0 91 50" vector-effect="non-scaling-stroke"/>
          <circle class="cr-dot" cx="88" cy="14" r="2.2"/>
        </svg>
        <span class="kicker" style="color:var(--gold-300);display:block;margin-bottom:18px">Epilogue — 그리고, 당신의 차례</span>
        <h2>다음 이야기의 주인공은 당신입니다</h2>
        <p>작은 불편이 더 큰 이야기가 되기 전에. 첫 페이지를 함께 펼쳐보세요.</p>
        <div class="actions">
          <a href="/reservation" class="btn btn-accent"><i class="fa-solid fa-calendar-check"></i> 나의 이야기 시작하기</a>
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
    preloadImage: '/static/img/hero.webp',
    keywords: '약수역 치과,약수역 임플란트,약수역 교정,약수역 심미보철,올케어치과,약수동 치과,중구 치과',
    schema: [
      organizationSchema(),
      faqSchema([
        ...CLINIC.strengths.map(s => ({ q: s.head, a: s.desc })),
        ...STORY_BRANCHES.slice(0, 4).map(b => b.faq),
      ]),
      speakableSchema(['.answer-box', 'h1', 'h2']),
      reviewSchema(),
    ].filter(Boolean),
  }
  return Page(meta, body)
}
