/* 365올케어치과 메인 스크롤 몰입 연출 (GSAP ScrollTrigger + Lenis) — 헤리티지 톤
   - 글자는 모두 HTML 에 그대로 두고 움직임만 더한다(크롤러·AEO 영향 없음, JS 꺼져도 전부 보임)
   - 동작 줄이기 사용자는 아무것도 하지 않는다
   - app.js 의 기존 연출(히어로 페이드·split-rise 제목·media-mask 사진·키네틱 띠·카운트업·드리프트·틸트)은 그대로 두고,
     단순 .reveal 페이드만 쓰던 블록을 넘겨받아 섹션마다 다른 장면으로 바꾼다
   - 리듬: 느리고 단정하게(expo/power3, 1.1~1.4초), 이동 거리는 짧게 */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  function start() {
  var root = document.documentElement;
  root.classList.add('mx');
  var mobile = matchMedia('(max-width: 767px)').matches;
  var fine = matchMedia('(pointer: fine)').matches;
  var EASE = 'expo.out';

  // 1) 묵직한 관성 스크롤 — 마우스·트랙패드만 (터치는 기본 스크롤)
  if (fine && window.Lenis) {
    var lenis = new Lenis({ duration: 1.3, smoothWheel: true, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var target = document.getElementById(id.slice(1));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -90 });
      });
    });
    window.__mxLenis = lenis;
  }

  // 화면에 들어오면 한 번 재생 — 빠르게 지나쳐도 onEnter 가 불려 끝까지 재생, 탭이 숨어도 타임아웃으로 끝 상태 보장
  var TIMING = ['duration', 'ease', 'stagger', 'delay'];
  var claimed = [];
  function claim(list) { gsap.utils.toArray(list).forEach(function (el) { claimed.push(el); }); }
  function isClaimed(el) { return claimed.some(function (c) { return c === el || c.contains(el) || el.contains(c); }); }
  // 기존 .reveal 을 넘겨받는다 (app.js IO 가 나중에 .in 을 붙여도 .reveal 이 없으니 이중 연출 없음)
  function takeover(el) { if (el) el.classList.remove('reveal', 'reveal-d1', 'reveal-d2', 'reveal-d3', 'reveal-d4'); return el; }
  function enter(targets, vars, trigger, start) {
    targets = gsap.utils.toArray(targets);
    if (!targets.length) return null;
    claim(targets);
    var from = {}, to = { opacity: 1, x: 0, y: 0, yPercent: 0, xPercent: 0, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, clipPath: 'inset(0% 0% 0% 0%)', paused: true,
      onStart: function () { gsap.set(targets, { transition: 'none' }); },
      onComplete: function () { gsap.set(targets, { clearProps: 'opacity,transform,transition,clipPath' }); } };
    if (!('clipPath' in vars)) delete to.clipPath;
    Object.keys(vars).forEach(function (k) { (TIMING.indexOf(k) > -1 ? to : from)[k] = vars[k]; });
    gsap.set(targets, { transition: 'none' });
    var tw = gsap.fromTo(targets, from, to);
    ScrollTrigger.create({ trigger: trigger || targets[0], start: start || 'top 88%', once: true, onEnter: function () {
      tw.play();
      setTimeout(function () { if (tw.progress() < 1) tw.progress(1); }, (tw.totalDuration() + 0.6) * 1000);
    } });
    return tw;
  }
  function scrub(target, from, to, st) {
    claim(target);
    return gsap.fromTo(target, from, Object.assign({ ease: 'none', scrollTrigger: Object.assign({ scrub: true }, st) }, to));
  }
  // 낱말 감싸기: em·br 등 하위 요소는 보존하고 텍스트만 낱말 단위로
  function splitWords(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var parts = node.textContent.split(/(\s+)/);
      if (parts.join('').trim() === '') return;
      var frag = document.createDocumentFragment();
      parts.forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
        var w = document.createElement('span'); w.className = 'mx-w';
        var i = document.createElement('span'); i.className = 'mx-wi'; i.textContent = p;
        w.appendChild(i); frag.appendChild(w);
      });
      node.parentNode.replaceChild(frag, node);
    });
    return el.querySelectorAll('.mx-wi');
  }
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return gsap.utils.toArray((ctx || document).querySelectorAll(sel)); };
  var kids = function (el) { return Array.prototype.filter.call(el.children, function (c) { return !/STYLE|SCRIPT/.test(c.tagName); }); };

  // 제목 묶음(키커·제목·리드): 키커가 먼저, 제목은 낱말이 마스크 아래에서, 리드는 뒤따라
  function headBlock(block) {
    if (!block || isClaimed(block)) return;
    takeover(block);
    kids(block).forEach(function (c, i) {
      if (c.tagName === 'H2' && !c.classList.contains('split-rise')) {
        enter(splitWords(c), { yPercent: 110, duration: 1.2, ease: EASE, stagger: 0.05, delay: 0.08 }, block, 'top 86%');
      } else if (!c.classList.contains('split-rise')) {
        enter(c, { y: 18, opacity: 0, duration: 1.1, ease: 'power3.out', delay: i * 0.08 }, block, 'top 86%');
      }
    });
  }

  // ── 강점 3가지: 편지를 펼치듯 위에서 아래로 열림
  var kps = $$('.keypoints-grid > .keypoint');
  if (kps.length) {
    kps.forEach(takeover);
    enter(kps, { clipPath: 'inset(0% 0% 100% 0%)', y: 24, duration: 1.3, ease: EASE, stagger: 0.14 }, kps[0], 'top 86%');
  }

  // ── 핵심 진료: 사진(기존 마스크)과 반대편에서 글이 다가옴, 큰 번호는 천천히 떠오름
  $$('.tx-feature > .tx-article').forEach(function (art, i) {
    takeover(art);
    var body = $('.tx-art-body', art);
    if (!body) return;
    var dir = mobile ? 0 : (i % 2 ? 1 : -1);
    enter(kids(body).filter(function (c) { return !c.classList.contains('tx-no'); }),
      { x: dir * 46, y: mobile ? 26 : 0, opacity: 0, duration: 1.2, ease: EASE, stagger: 0.09 }, body, 'top 84%');
    var no = $('.tx-no', body);
    if (no) scrub(no, { yPercent: 40 }, { yPercent: -40 }, { trigger: art, start: 'top bottom', end: 'bottom top' });
  });

  // ── 약수역 진료 안내 카드: 액자 순서대로 올라오고, 사진은 카드 안에서 천천히 줌아웃
  var yk = $$('#yaksu-guide .yk-cards > li');
  if (yk.length) {
    enter(yk, { y: mobile ? 30 : 60, opacity: 0, duration: 1.2, ease: EASE, stagger: { each: 0.08, grid: 'auto', from: 'start' } }, yk[0], 'top 88%');
    $$('#yaksu-guide .yk-card-img').forEach(function (box) {
      var img = $('img', box); if (!img) return;
      box.classList.add('mx-par');
      gsap.fromTo(img, { scale: 1.16, yPercent: -4 }, { scale: 1.02, yPercent: 4, ease: 'none',
        scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  // ── 의료진: 초상 액자가 아래에서 위로 걷히며 드러남(사진은 살짝 당겨졌다 제자리)
  var docs = $$('#homeDocGrid > .doc-card');
  if (docs.length) {
    docs.forEach(takeover);
    if (mobile) {
      enter(docs, { x: 40, opacity: 0, duration: 1.1, ease: EASE, stagger: 0.08 }, '#homeDocGrid', 'top 88%');
    } else {
      enter(docs, { y: 50, opacity: 0, duration: 1.2, ease: EASE, stagger: 0.12 }, '#homeDocGrid', 'top 86%');
      docs.forEach(function (d, i) {
        var ph = $('.doc-photo', d), img = ph && $('img', ph);
        if (!ph) return;
        enter(ph, { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.4, ease: 'power4.out', delay: 0.1 + i * 0.12 }, '#homeDocGrid', 'top 86%');
        if (img) enter(img, { scale: 1.14, duration: 1.8, ease: 'power3.out', delay: 0.1 + i * 0.12 }, '#homeDocGrid', 'top 86%');
      });
    }
  }

  // ── 전문의 진료의 차이: 제목 묶음 + 여섯 강점이 바둑판 순서로
  var whyHead = $('.why-allcare .why-head > div:first-child');
  headBlock(whyHead);
  var whyGrid = $('.why-allcare .why-grid');
  if (whyGrid) {
    takeover(whyGrid);
    enter($$('.why-card', whyGrid), { y: 40, opacity: 0, scale: 0.97, duration: 1.1, ease: EASE, stagger: { each: 0.07, grid: 'auto', from: 'start' } }, whyGrid, 'top 86%');
  }

  // ── 원내 기공실: 큰 사진은 옆으로 걷히고, 작은 장비 사진은 차례로, 사진마다 시차
  var lab = $('.lab-gallery');
  if (lab) {
    takeover(lab);
    headBlock(lab.firstElementChild);
    var cells = $$('.lab-cell', lab);
    var wide = cells.filter(function (c) { return c.classList.contains('lab-cell--wide'); });
    var rest = cells.filter(function (c) { return !c.classList.contains('lab-cell--wide'); });
    enter(wide, { clipPath: 'inset(0% 100% 0% 0%)', duration: 1.5, ease: 'power4.inOut' }, $('.lab-grid', lab), 'top 82%');
    enter(rest, { y: 40, scale: 0.94, opacity: 0, duration: 1.1, ease: EASE, stagger: 0.09, delay: 0.35 }, $('.lab-grid', lab), 'top 82%');
    cells.forEach(function (c) {
      var img = $('img', c); if (!img) return;
      c.classList.add('mx-par');
      gsap.fromTo(img, { yPercent: -5, scale: 1.12 }, { yPercent: 5, scale: 1.12, ease: 'none',
        scrollTrigger: { trigger: c, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  // ── 진료의 기반(네이비 띠): 액자 창이 열리듯 둥근 창 → 화면 가득 (숫자 카운트·헤어라인은 기존 그대로)
  var facts = $('#facts');
  if (facts) {
    facts.classList.add('mx-clip');
    gsap.fromTo(facts, { clipPath: mobile ? 'inset(0% 3% round 18px)' : 'inset(0% 4% round 28px)' }, { clipPath: 'inset(0% 0% round 0px)', ease: 'none',
      scrollTrigger: { trigger: facts, start: 'top bottom', end: 'top 30%', scrub: true } });
  }

  // ── 진료 과정: 브라스 실선이 스크롤 따라 이어지고, 지나가는 단계마다 둥근 표식이 켜짐
  var jsec = $('#ch-journey');
  if (jsec) {
    headBlock($('.container > div', jsec));
    var steps = $$('.journey-step', jsec);
    steps.forEach(takeover);
    enter($$('.js-body', jsec), { y: 24, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.12 }, $('.journey-track', jsec), 'top 82%');
    enter($$('.js-node', jsec), { scale: 0.5, opacity: 0, duration: 0.9, ease: 'back.out(1.4)', stagger: 0.12 }, $('.journey-track', jsec), 'top 82%');
    var lines = $$('.js-line', jsec);
    if (lines.length) {
      claim(lines);
      gsap.set(lines, { transformOrigin: mobile ? '50% 0%' : '0% 50%' });
      gsap.fromTo(lines, mobile ? { scaleY: 0 } : { scaleX: 0 }, Object.assign(mobile ? { scaleY: 1 } : { scaleX: 1 }, { ease: 'none', stagger: 0.5,
        scrollTrigger: { trigger: $('.journey-track', jsec), start: 'top 75%', end: mobile ? 'bottom 60%' : 'top 30%', scrub: true } }));
    }
  }

  // ── 대표 치료 사례: 책장이 펼쳐지듯 양쪽 카드가 가운데로 열림
  var csec = $('#ch-cases');
  if (csec) {
    headBlock($('.container > div', csec));
    var cards = $$('.cases-grid > .case-card', csec);
    cards.forEach(takeover);
    if (mobile) enter(cards, { y: 50, opacity: 0, duration: 1.1, ease: EASE, stagger: 0.1 }, cards[0], 'top 88%');
    else {
      gsap.set($('.cases-grid', csec), { perspective: 1400 });
      cards.forEach(function (c, i) {
        var left = i % 2 === 0;
        enter(c, { rotateY: left ? 22 : -22, x: left ? -30 : 30, opacity: 0, transformOrigin: left ? '100% 50%' : '0% 50%',
          duration: 1.4, ease: EASE, delay: left ? 0 : 0.1 }, c, 'top 86%');
      });
    }
    var note = $('.reviews-note', csec);
    if (note) { takeover(note); enter(note, { opacity: 0, y: 14, duration: 1, ease: 'power2.out' }, note, 'top 94%'); }
  }

  // ── 증상별 안내: 증상 칩이 하나씩 놓이고, 안내 카드가 뒤따라 올라옴
  var chipsBox = $('#symptoms .sn-chips');
  if (chipsBox) {
    takeover(chipsBox);
    enter($$('.sn-chip', chipsBox), { y: 18, scale: 0.88, opacity: 0, duration: 0.8, ease: 'back.out(1.6)', stagger: 0.05 }, chipsBox, 'top 90%');
  }
  var stage = $('#symptoms .sn-stage');
  if (stage) { takeover(stage); enter(stage, { y: 50, opacity: 0, duration: 1.2, ease: EASE, delay: 0.2 }, stage, 'top 90%'); }

  // ── 구강나이 배너: 다가오며 커지고, 계기판 바늘이 스크롤 따라 돌아감
  var occ = $('.oral-check-band');
  if (occ) {
    takeover(occ);
    scrub(occ, { scale: mobile ? 0.95 : 0.9 }, { scale: 1 }, { trigger: occ, start: 'top bottom', end: 'top 45%' });
    var occLeft = $('.occ-left', occ);
    if (occLeft) enter(kids(occLeft), { y: 22, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08 }, occ, 'top 85%');
    var dial = $('.occ-dial', occ);
    if (dial) scrub(dial, { rotate: -120 }, { rotate: 0 }, { trigger: occ, start: 'top bottom', end: 'bottom 40%' });
  }

  // ── 일상 진료 타일: 가운데부터 바깥으로 차례로 놓임
  var subs = $$('#daily .tx-sub-grid > .tx-sub');
  if (subs.length) {
    subs.forEach(takeover);
    enter(subs, { opacity: 0, scale: 0.94, y: 20, duration: 1, ease: EASE, stagger: { each: 0.06, grid: 'auto', from: 'center' } }, subs[0], 'top 88%');
  }

  // ── 진료시간·오시는 길: 두 칸이 양쪽에서 와서 만나고, 진료시간 줄은 한 줄씩, 지도 핀은 톡 떨어짐
  var visit = $$('#daily .visit-grid > div');
  visit.forEach(function (col, i) {
    takeover(col);
    var h2 = $('h2', col), kick = $('.sec-kicker', col);
    if (kick) enter(kick, { y: 14, opacity: 0, duration: 1, ease: 'power3.out' }, col, 'top 86%');
    if (h2) enter(splitWords(h2), { yPercent: 110, duration: 1.2, ease: EASE, stagger: 0.05 }, col, 'top 86%');
    var rest = kids(col).filter(function (c) { return c !== h2 && c !== kick; });
    enter(rest, { x: mobile ? 0 : (i ? 50 : -50), y: mobile ? 30 : 0, opacity: 0, duration: 1.3, ease: EASE, stagger: 0.08, delay: 0.1 }, col, 'top 86%');
  });
  var pin = $('#daily .home-map-pin');
  if (pin) {
    var pinI = $('i', pin), pinS = $('span', pin);
    if (pinI) enter(pinI, { y: -46, opacity: 0, duration: 1, ease: 'bounce.out', delay: 0.3 }, pin, 'top 85%');
    if (pinS) enter(pinS, { y: 10, opacity: 0, duration: 0.7, ease: 'power2.out', delay: 0.9 }, pin, 'top 85%');
  }

  // ── 상담 예약(에필로그): 네이비 띠가 화면 쪽으로 다가오고, 제목 낱말·버튼이 차례로
  var cta = $('#cta .cta-band');
  if (cta) {
    takeover(cta);
    ScrollTrigger.create({ trigger: cta, start: 'top 85%', once: true, onEnter: function () { cta.classList.add('in'); } });
    var r0 = getComputedStyle(cta).borderRadius || '24px';
    scrub(cta, { scale: mobile ? 0.95 : 0.88, borderRadius: mobile ? '28px' : '56px' }, { scale: 1, borderRadius: r0 }, { trigger: cta, start: 'top bottom', end: 'top 35%' });
    var ch2 = $('h2', cta);
    if (ch2) enter(splitWords(ch2), { yPercent: 110, duration: 1.2, ease: EASE, stagger: 0.04 }, cta, 'top 78%');
    enter(kids(cta).filter(function (c) { return c !== ch2 && !c.matches('svg, .cta-ring'); }), { y: 20, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.1, delay: 0.15 }, cta, 'top 78%');
  }

  // ── 나머지 기존 등장(.reveal·split-rise 제목·media-mask 사진)은 모양은 그대로 두고 신호만 넘겨받는다:
  //    IO 는 빠르게 건너뛴 구간을 놓치지만, ScrollTrigger 는 지나친 구간도 onEnter 를 불러 반드시 .in 이 붙는다
  $$('main .reveal, main .split-rise, main .media-mask, main .stagger').forEach(function (el) {
    if (el.classList.contains('in')) return;
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: function () { el.classList.add('in'); } });
  });

  // 이미지·웹폰트가 늦게 로드되면 위치 다시 계산
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
