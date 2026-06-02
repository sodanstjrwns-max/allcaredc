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
    window.addEventListener('mouseout', function (e) { if (!e.relatedTarget) { dot.style.opacity = ring.style.opacity = '0'; } });
    window.addEventListener('mouseover', function () { dot.style.opacity = ring.style.opacity = '1'; });
  })();

  // ---------- magnetic buttons ----------
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.btn, .magnetic').forEach(function (el) {
      el.classList.add('magnetic');
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        el.style.transform = 'translate(' + (x * 0.28) + 'px,' + (y * 0.4) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
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
