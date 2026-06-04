/* ============================================================
   올케어치과 — 프론트 인터랙션
   스크롤 reveal / 카운트업 / 패럴랙스 / FAQ / 모바일메뉴 / BA슬라이더
   GPU 가속(transform/opacity) 위주, prefers-reduced-motion 존중
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- header scroll state ----------
  var header = document.getElementById('siteHeader');
  var isSolid = header && header.classList.contains('force-solid');
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 40) header.classList.add('scrolled');
    else if (!isSolid) header.classList.remove('scrolled');
  }
  if (header && header.classList.contains('force-solid')) header.classList.add('solid');
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- mobile drawer ----------
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('mDrawer');
  var mClose = document.getElementById('mClose');
  function openDrawer() { if (drawer) { drawer.classList.add('open'); document.body.style.overflow = 'hidden'; } }
  function closeDrawer() { if (drawer) { drawer.classList.remove('open'); document.body.style.overflow = ''; } }
  if (burger) burger.addEventListener('click', openDrawer);
  if (mClose) mClose.addEventListener('click', closeDrawer);
  if (drawer) drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeDrawer); });

  // ---------- scroll reveal (Intersection Observer) ----------
  var reveals = document.querySelectorAll('.reveal');
  if (reduce) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // ---------- count-up ----------
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1600, start = null;
    var isFloat = target % 1 !== 0;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = (isFloat ? val.toFixed(1) : Math.floor(val)) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = (isFloat ? target.toFixed(1) : target) + suffix;
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if (reduce) {
    counters.forEach(function (el) { el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || ''); });
  } else if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  // ============================================================
  //  ★ 2026 PREMIUM INTERACTION ENGINE
  // ============================================================

  // ---------- scroll progress bar ----------
  (function () {
    if (reduce) return;
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    function upd() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop || window.scrollY) / max * 100 : 0) + '%';
    }
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd, { passive: true });
    upd();
  })();

  // ---------- unified rAF scroll loop (parallax + hero scroll-fade) ----------
  if (!reduce) {
    var pxEls = document.querySelectorAll('[data-parallax]');
    var hero = document.querySelector('.hero');
    var heroInner = document.querySelector('.hero-inner');
    var ticking = false;
    function frame() {
      var y = window.scrollY;
      pxEls.forEach(function (el) {
        var sp = parseFloat(el.getAttribute('data-parallax')) || 0.3;
        el.style.transform = 'translate3d(0,' + (y * sp) + 'px,0) scale(1.05)';
      });
      // hero content drifts up + fades as you scroll (scroll-linked)
      if (hero && heroInner) {
        var hh = hero.offsetHeight || 1;
        var p = Math.min(y / hh, 1);
        heroInner.style.transform = 'translateY(' + (y * 0.25) + 'px)';
        heroInner.style.opacity = String(1 - p * 1.15);
      }
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(frame); ticking = true; }
    }, { passive: true });
    frame();
  }

  // ---------- hero line-mask stagger reveal ----------
  (function () {
    var hero = document.querySelector('.hero');
    if (hero) requestAnimationFrame(function () { hero.classList.add('in'); });
  })();

  // ---------- hero mouse-tracked aurora orbs ----------
  if (!reduce) {
    var glows = document.querySelectorAll('.hero-glow');
    var heroEl = document.querySelector('.hero');
    if (glows.length && heroEl) {
      heroEl.addEventListener('mousemove', function (e) {
        var r = heroEl.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - 0.5;
        var dy = (e.clientY - r.top) / r.height - 0.5;
        glows.forEach(function (g, i) {
          var k = (i === 0 ? 1 : -1) * (i === 0 ? 60 : 40);
          g.style.transform = 'translate3d(' + (dx * k) + 'px,' + (dy * k) + 'px,0)';
        });
      });
    }
  }

  // ---------- custom cursor (desktop, fine pointer) ----------
  (function () {
    if (reduce) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.innerWidth < 1025) return;
    var dot = document.createElement('div'); dot.className = 'cursor-dot';
    var ring = document.createElement('div'); ring.className = 'cursor-ring';
    document.body.appendChild(dot); document.body.appendChild(ring);
    document.body.classList.add('cursor-on');
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
    });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a, button, .tx-card, .value-card, .doc-card, [data-cursor]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('hover'); dot.classList.add('hover'); });
      el.addEventListener('mouseleave', function () { ring.classList.remove('hover'); dot.classList.remove('hover'); });
    });

    // 미디어 위 커서 라벨 (VIEW) + 큰 링
    var label = document.createElement('div'); label.className = 'cursor-label';
    document.body.appendChild(label);
    window.addEventListener('mousemove', function (e) {
      label.style.left = e.clientX + 'px'; label.style.top = e.clientY + 'px';
    });
    document.querySelectorAll('[data-cursor-label]').forEach(function (el) {
      var txt = el.getAttribute('data-cursor-label') || 'VIEW';
      el.addEventListener('mouseenter', function () {
        ring.classList.add('media'); dot.style.opacity = '0';
        label.textContent = txt; label.classList.add('show');
      });
      el.addEventListener('mouseleave', function () {
        ring.classList.remove('media'); dot.style.opacity = '1';
        label.classList.remove('show');
      });
    });

    window.addEventListener('mouseout', function (e) { if (!e.relatedTarget) { dot.style.opacity = ring.style.opacity = '0'; } });
    window.addEventListener('mouseover', function () { dot.style.opacity = ring.style.opacity = '1'; });
  })();

  // ---------- magnetic buttons (강화: 강도↑ + 자기장 영역 확장 + 로고) ----------
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.btn, .magnetic, .logo, [data-magnetic]').forEach(function (el) {
      el.classList.add('magnetic');
      // 강도: data-mag 로 개별 조정 가능 (기본 0.4)
      var strength = parseFloat(el.getAttribute('data-mag')) || 0.4;
      var pad = 28; // 자기장 감지 패딩 (버튼 밖에서도 끌림 시작)
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        el.style.transform = 'translate(' + (x * strength) + 'px,' + (y * strength * 1.15) + 'px)';
        // 내부 아이콘 살짝 더 끌림 (입체감)
        var ic = el.querySelector('i');
        if (ic) ic.style.transform = 'translate(' + (x * strength * 0.4) + 'px,' + (y * strength * 0.4) + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
        var ic = el.querySelector('i'); if (ic) ic.style.transform = '';
      });
      void pad;
    });
  }

  // ---------- 3D tilt cards ----------
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.tilt').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(900px) rotateY(' + (px * 7) + 'deg) rotateX(' + (-py * 7) + 'deg) translateY(-10px)';
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  }

  // ---------- generic stagger groups ----------
  if (!reduce && 'IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var kids = e.target.children;
          for (var i = 0; i < kids.length; i++) kids[i].style.transitionDelay = (i * 0.08) + 's';
          e.target.classList.add('in'); sio.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('.stagger').forEach(function (el) { sio.observe(el); });
  } else {
    document.querySelectorAll('.stagger').forEach(function (el) { el.classList.add('in'); });
  }

  // ---------- FAQ accordion ----------
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.faq-item');
      var ans = item.querySelector('.faq-a');
      var open = item.classList.contains('open');
      if (open) { item.classList.remove('open'); ans.style.maxHeight = null; }
      else { item.classList.add('open'); ans.style.maxHeight = ans.scrollHeight + 'px'; }
    });
  });

  // ---------- before/after slider ----------
  document.querySelectorAll('.ba-slider').forEach(function (slider) {
    var afterWrap = slider.querySelector('.ba-after-wrap');
    var handle = slider.querySelector('.ba-handle');
    if (!afterWrap || !handle) return;
    var dragging = false;
    function setPos(clientX) {
      var rect = slider.getBoundingClientRect();
      var x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      var pct = (x / rect.width) * 100;
      afterWrap.style.width = pct + '%';
      handle.style.left = pct + '%';
    }
    slider.addEventListener('mousedown', function (e) { if (slider.classList.contains('locked')) return; dragging = true; setPos(e.clientX); });
    window.addEventListener('mousemove', function (e) { if (dragging) setPos(e.clientX); });
    window.addEventListener('mouseup', function () { dragging = false; });
    slider.addEventListener('touchstart', function (e) { if (slider.classList.contains('locked')) return; dragging = true; setPos(e.touches[0].clientX); }, { passive: true });
    slider.addEventListener('touchmove', function (e) { if (dragging) setPos(e.touches[0].clientX); }, { passive: true });
    slider.addEventListener('touchend', function () { dragging = false; });
  });

  // ============================================================
  //  ★★★ 2026 LAYER
  // ============================================================

  // ---------- cinematic pin-scale hero (scroll-linked clip-path) ----------
  (function () {
    if (reduce) return;
    var hero = document.querySelector('.hero.cinema');
    if (!hero) return;
    function upd() {
      var h = hero.offsetHeight || 1;
      var y = window.scrollY;
      var p = Math.min(Math.max(y / h, 0), 1); // 0 top → 1 scrolled past
      // 시작: 살짝 안쪽으로 클립(라운드 창) → 스크롤하며 풀블리드
      var clip = (1 - p) * 4;          // 4% → 0%
      var radius = (1 - p) * 18;       // 18px → 0
      var scale = 1.08 + p * 0.06;
      hero.style.setProperty('--clip', clip.toFixed(2) + '%');
      hero.style.setProperty('--clipr', radius.toFixed(1) + 'px');
      hero.style.setProperty('--heroScale', scale.toFixed(3));
    }
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd, { passive: true });
    upd();
  })();

  // ---------- kinetic marquee (scroll-velocity drift + letter highlight) ----------
  (function () {
    var tracks = document.querySelectorAll('.kinetic-track');
    if (!tracks.length) return;
    if (reduce) return;
    var lastY = window.scrollY, vel = 0;
    var base = {};
    tracks.forEach(function (t, i) { base[i] = (i % 2 === 0) ? 0 : -200; });
    function loop() {
      var y = window.scrollY;
      var dv = y - lastY; lastY = y;
      vel = vel * 0.9 + dv * 0.6;
      tracks.forEach(function (t, i) {
        var dir = (i % 2 === 0) ? 1 : -1;
        base[i] -= (0.6 + Math.abs(vel) * 0.5) * dir; // constant drift + velocity boost
        // wrap
        var w = t.scrollWidth / 2 || 1;
        if (base[i] <= -w) base[i] += w;
        if (base[i] >= 0 && dir < 0) base[i] -= w;
        t.style.transform = 'translateX(' + base[i] + 'px)';
      });
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();

  // ---------- word-rise reveal (split heading words) ----------
  (function () {
    var heads = document.querySelectorAll('[data-words]');
    heads.forEach(function (h) {
      var raw = h.getAttribute('data-words');
      var parts = (raw || h.textContent).split(' ');
      h.innerHTML = parts.map(function (w) {
        return '<span class="word-rise"><span>' + w + '</span></span>';
      }).join(' ');
    });
    if (reduce) { document.querySelectorAll('.word-rise').forEach(function(w){w.classList.add('in');}); return; }
    if ('IntersectionObserver' in window) {
      var wio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var words = e.target.querySelectorAll('.word-rise');
            words.forEach(function (w, i) { w.querySelector('span').style.transitionDelay = (i * 0.06) + 's'; w.classList.add('in'); });
            wio.unobserve(e.target);
          }
        });
      }, { threshold: 0.4 });
      document.querySelectorAll('[data-words]').forEach(function (h) { wio.observe(h); });
    } else {
      document.querySelectorAll('.word-rise').forEach(function(w){w.classList.add('in');});
    }
  })();

  // ---------- split-rise reveal (마크업 보존: em 등 유지하며 단어 마스크) ----------
  (function () {
    var heads = document.querySelectorAll('.split-rise');
    if (!heads.length) return;

    function wrapTextNode(node) {
      var frag = document.createDocumentFragment();
      var words = node.textContent.split(/(\s+)/); // 공백 보존
      words.forEach(function (w) {
        if (w.trim() === '') { frag.appendChild(document.createTextNode(w)); return; }
        var wr = document.createElement('span'); wr.className = 'wr';
        var inner = document.createElement('span'); inner.textContent = w;
        wr.appendChild(inner); frag.appendChild(wr);
      });
      return frag;
    }
    function processEl(el) {
      var kids = Array.prototype.slice.call(el.childNodes);
      kids.forEach(function (n) {
        if (n.nodeType === 3) { // text node
          el.replaceChild(wrapTextNode(n), n);
        } else if (n.nodeType === 1) { // element (em 등) — 안쪽 텍스트도 동일 처리
          processEl(n);
        }
      });
    }
    heads.forEach(function (h) { processEl(h); });

    if (reduce) { heads.forEach(function (h) { h.classList.add('in'); }); return; }
    if ('IntersectionObserver' in window) {
      var sio2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var ws = e.target.querySelectorAll('.wr');
            ws.forEach(function (w, i) { w.querySelector('span').style.transitionDelay = (i * 0.05) + 's'; });
            e.target.classList.add('in'); sio2.unobserve(e.target);
          }
        });
      }, { threshold: 0.35 });
      heads.forEach(function (h) { sio2.observe(h); });
    } else { heads.forEach(function (h) { h.classList.add('in'); }); }
  })();

  // ---------- media-mask reveal (image clip-in) ----------
  (function () {
    var masks = document.querySelectorAll('.media-mask');
    if (!masks.length) return;
    if (reduce) { masks.forEach(function (m) { m.classList.add('in'); }); return; }
    if ('IntersectionObserver' in window) {
      var mio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); mio.unobserve(e.target); } });
      }, { threshold: 0.25 });
      masks.forEach(function (m) { mio.observe(m); });
    } else { masks.forEach(function (m) { m.classList.add('in'); }); }
  })();

  // ============================================================
  //  ★★★★ 2026 HIGH-END INTERACTIVE LAYER
  // ============================================================

  // ---------- 섹션 인디케이터 (우측 도트 네비) ----------
  (function () {
    var defs = [
      { id: 'hero', label: 'Top' },
      { id: 'philosophy', label: 'Philosophy' },
      { id: 'core-treatments', label: 'Care' },
      { id: 'difference', label: 'Why' },
      { id: 'doctors', label: 'Doctors' },
      { id: 'info', label: 'Visit' }
    ];
    var heroSec = document.querySelector('.hero');
    if (heroSec && !heroSec.id) heroSec.id = 'hero';
    var sections = defs.map(function (d) { return { def: d, el: document.getElementById(d.id) }; })
                       .filter(function (s) { return s.el; });
    if (sections.length < 2) return;

    var nav = document.createElement('nav');
    nav.className = 'section-nav';
    nav.setAttribute('aria-label', '섹션 바로가기');
    sections.forEach(function (s) {
      var a = document.createElement('a');
      a.href = '#' + s.def.id;
      a.setAttribute('data-label', s.def.label);
      a.setAttribute('aria-label', s.def.label);
      a.addEventListener('click', function (e) {
        e.preventDefault();
        s.el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      });
      s.link = a;
      nav.appendChild(a);
    });
    document.body.appendChild(nav);

    function update() {
      var y = window.scrollY + window.innerHeight * 0.38;
      // hero 지나면 nav 표시
      var heroH = (document.getElementById('hero') || {}).offsetHeight || 600;
      if (window.scrollY > heroH * 0.45) nav.classList.add('show');
      else nav.classList.remove('show');
      var current = sections[0];
      sections.forEach(function (s) {
        if (s.el.offsetTop <= y) current = s;
      });
      sections.forEach(function (s) { s.link.classList.toggle('active', s === current); });
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  })();

  // ---------- 관성 lerp 스크롤 느낌 (미세, 헤더 제외 콘텐츠 살짝 follow) ----------
  // ※ 진짜 스크롤 하이재킹은 접근성/모바일 리스크가 커서 지양.
  //    대신 reveal·media 요소에 미세한 lerp drift만 주어 "묵직한 관성감" 연출.
  (function () {
    if (reduce) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var driftEls = document.querySelectorAll('[data-drift]');
    if (!driftEls.length) return;
    var targets = [], current = [];
    driftEls.forEach(function (el, i) { targets[i] = 0; current[i] = 0; });
    function calc() {
      driftEls.forEach(function (el, i) {
        var r = el.getBoundingClientRect();
        var center = r.top + r.height / 2;
        var p = (center - window.innerHeight / 2) / window.innerHeight; // -0.5~0.5
        var amt = parseFloat(el.getAttribute('data-drift')) || 26;
        targets[i] = p * amt;
      });
    }
    window.addEventListener('scroll', calc, { passive: true });
    window.addEventListener('resize', calc, { passive: true });
    calc();
    (function loop() {
      driftEls.forEach(function (el, i) {
        current[i] += (targets[i] - current[i]) * 0.08; // lerp = 관성
        el.style.transform = 'translate3d(0,' + current[i].toFixed(2) + 'px,0)';
      });
      requestAnimationFrame(loop);
    })();
  })();

  // ---------- toast helper (global) ----------
  window.showToast = function (msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 3200);
  };

  // ---------- region autocomplete (cases form) ----------
  window.initRegionAutocomplete = function (inputId, listId) {
    var input = document.getElementById(inputId);
    var list = document.getElementById(listId);
    if (!input || !list) return;
    var DB = [
      '서울특별시 중구 신당동', '서울특별시 중구 약수동', '서울특별시 중구 청구동', '서울특별시 중구 장충동',
      '서울특별시 성동구 옥수동', '서울특별시 성동구 금호동', '서울특별시 성동구 행당동', '서울특별시 성동구 왕십리',
      '서울특별시 용산구 한남동', '서울특별시 용산구 이태원동', '서울특별시 동대문구 신설동',
      '서울특별시 광진구 자양동', '안산시 상록구 초지동', '안산시 단원구'
    ];
    input.addEventListener('input', function () {
      var v = input.value.trim();
      list.innerHTML = '';
      if (!v) { list.style.display = 'none'; return; }
      var matches = DB.filter(function (d) { return d.replace(/\s/g, '').indexOf(v.replace(/\s/g, '')) > -1 || d.indexOf(v) > -1; }).slice(0, 8);
      if (!matches.length) { list.style.display = 'none'; return; }
      matches.forEach(function (m) {
        var div = document.createElement('div');
        div.textContent = m;
        div.addEventListener('click', function () { input.value = m; list.style.display = 'none'; });
        list.appendChild(div);
      });
      list.style.display = 'block';
    });
    document.addEventListener('click', function (e) { if (!input.contains(e.target) && !list.contains(e.target)) list.style.display = 'none'; });
  };

  // ---------- encyclopedia filter ----------
  window.initEncyclopedia = function () {
    var search = document.getElementById('encSearch');
    var items = Array.prototype.slice.call(document.querySelectorAll('.enc-item'));
    var alphaBtns = document.querySelectorAll('.enc-alpha button');
    function filter(term, letter) {
      term = (term || '').toLowerCase();
      items.forEach(function (it) {
        var txt = it.textContent.toLowerCase();
        var first = it.getAttribute('data-initial') || '';
        var okTerm = !term || txt.indexOf(term) > -1;
        var okLetter = !letter || letter === 'ALL' || first === letter;
        it.style.display = (okTerm && okLetter) ? '' : 'none';
      });
    }
    if (search) search.addEventListener('input', function () { filter(search.value, document.querySelector('.enc-alpha button.active') ? document.querySelector('.enc-alpha button.active').getAttribute('data-letter') : 'ALL'); });
    alphaBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        alphaBtns.forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        filter(search ? search.value : '', b.getAttribute('data-letter'));
      });
    });
  };

  // ---------- reservation form submit ----------
  window.submitReservation = function (e) {
    e.preventDefault();
    var form = e.target;
    var btn = form.querySelector('[type=submit]');
    var data = Object.fromEntries(new FormData(form).entries());
    if (!data.agree) { window.showToast('개인정보 수집·이용에 동의해 주세요.'); return false; }
    btn.disabled = true; btn.textContent = '접수 중...';
    fetch('/api/reservation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.ok) { form.reset(); window.showToast('예약 문의가 접수되었습니다. 곧 연락드리겠습니다.'); }
        else window.showToast(res.error || '접수에 실패했습니다. 전화로 문의해 주세요.');
      })
      .catch(function () { window.showToast('일시적 오류입니다. 전화(02-2232-2911)로 문의해 주세요.'); })
      .finally(function () { btn.disabled = false; btn.textContent = '예약 문의 보내기'; });
    return false;
  };
})();
