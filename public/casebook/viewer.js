(() => {
  const B = window.BOOK;
  const N = B.pageCount;
  const IMG_W = 1800, IMG_H = 2548;
  const $ = (s) => document.querySelector(s);
  const pad = (p) => String(p).padStart(2, "0");
  const ver = B.version ? `?v=${encodeURIComponent(B.version)}` : ""; // 이미지 교체 시 브라우저 캐시 무시
  const full = (p) => `pages/${pad(p)}.webp${ver}`;     // 1800px: 확대 보기, 고해상도 화면
  const mid = (p) => `pages-m/${pad(p)}.webp${ver}`;    // 1200px: 일반 화면
  const srcset = (p) => `${mid(p)} 1200w, ${full(p)} 1800w`; // 화면 크기·해상도에 맞춰 브라우저가 선택
  const thumb = (p) => `thumbs/${pad(p)}.jpg${ver}`;

  // 페이지 → 장/제목
  const info = {};
  B.chapters.forEach((c) => c.pages.forEach((pg) => (info[pg.p] = { chap: c, title: pg.title })));
  const chapName = (p) => { const c = info[p]?.chap; return c ? (c.no ? `${c.no} ${c.name}` : c.name) : ""; };
  const altText = (p) => `${p}쪽 · ${chapName(p)} · ${info[p]?.title || ""}`;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };

  // ── 상태 ──
  let page = 1;                 // 지금 보고 있는 (첫) 페이지
  let mode = "flip";            // flip | scroll
  let layout = "spread";        // spread | single (책으로 보기 안에서)
  let spreadIdx = 0;
  let busy = null;              // 넘김 애니메이션 중이면 끝내는 함수

  // 펼침 구성: [0,1] [2,3] ... [18,19] [20,0]  (0 = 빈 쪽)
  const spreads = [[0, 1]];
  for (let p = 2; p <= N; p += 2) spreads.push([p, p + 1 <= N ? p + 1 : 0]);
  const spreadOf = (p) => (p <= 1 ? 0 : Math.floor(p / 2));

  const book = $("#book"), slotL = $("#slotL"), slotR = $("#slotR"), leaf = $("#leaf");
  const spine = book.querySelector(".spine");
  const front = leaf.querySelector(".front"), back = leaf.querySelector(".back");
  const flipView = $("#flipView"), scrollView = $("#scrollView"), stage = $("#stage");

  // ── 이미지 ──
  const preloaded = new Set();
  function preload(p) {
    if (!p || p < 1 || p > N || preloaded.has(p)) return;
    preloaded.add(p);
    const im = new Image(); im.sizes = pw + "px"; im.srcset = srcset(p);
  }
  // 지금 보이는 페이지를 다 받은 뒤에 다음 페이지를 미리 받음
  let preT;
  function preloadLater(fn) {
    clearTimeout(preT);
    const imgs = [slotL, slotR].map((s) => s.querySelector("img")).filter((i) => i.getAttribute("src"));
    Promise.all(imgs.map((i) => (i.complete ? 0 : new Promise((r) => { i.addEventListener("load", r, { once: true }); i.addEventListener("error", r, { once: true }); }))))
      .then(() => { preT = setTimeout(fn, 300); });
  }
  function paint(el, p) {
    const img = el.querySelector("img");
    el.dataset.page = p || "";
    if (!p) { el.classList.add("empty"); img.removeAttribute("srcset"); img.removeAttribute("src"); return; }
    el.classList.remove("empty");
    el.style.backgroundImage = `url(${thumb(p)})`;
    img.sizes = pw + "px";
    if (img.getAttribute("srcset") !== srcset(p)) { img.srcset = srcset(p); img.src = mid(p); }
    img.alt = altText(p);
  }

  // ── 크기 계산 ──
  let pw = 400;
  function measure() {
    const r = stage.getBoundingClientRect();
    const small = innerWidth <= 760;
    const sideGap = small ? 14 : 92, vGap = small ? 20 : 34;
    const aw = r.width - sideGap * 2, ah = r.height - vGap * 2;
    const phSpread = Math.min(ah, (aw / 2) * B.ratio);
    const phSingle = Math.min(ah, aw * B.ratio);
    const next = aw >= 620 && phSpread >= phSingle * 0.72 ? "spread" : "single";
    const ph = Math.floor(next === "spread" ? phSpread : phSingle);
    pw = Math.floor(ph / B.ratio);
    book.style.setProperty("--pw", pw + "px");
    book.style.setProperty("--ph", Math.round(pw * B.ratio) + "px");
    if (next !== layout) { layout = next; book.classList.toggle("single", layout === "single"); return true; }
    return false;
  }

  function shiftFor([L, R]) { return layout === "spread" ? (!L ? -pw / 2 : !R ? pw / 2 : 0) : 0; }
  function setStatic() {
    if (layout === "spread") {
      spreadIdx = spreadOf(page);
      const s = spreads[spreadIdx];
      paint(slotL, s[0]); paint(slotR, s[1]);
      spine.classList.toggle("off", !s[0] || !s[1]);
      book.style.transform = `translateX(${shiftFor(s)}px)`;
      preloadLater(() => [spreads[spreadIdx + 1], spreads[spreadIdx - 1]].forEach((x) => x && x.forEach(preload)));
    } else {
      paint(slotR, page);
      book.style.transform = "none";
      preloadLater(() => [page + 1, page - 1].forEach(preload));
    }
  }

  // ── 페이지 이동 ──
  function go(target, opts = {}) {
    target = Math.max(1, Math.min(N, target));
    if (mode === "scroll") {
      page = target; update();
      const el = scrollView.querySelector(`[data-page="${target}"]`);
      // 장의 첫 페이지면 장 제목부터 보이게
      const anchor = el?.previousElementSibling?.classList.contains("sheet-chap") ? el.previousElementSibling : el;
      if (el) scrollView.scrollTo({ top: anchor.offsetTop - 20, behavior: opts.instant ? "instant" : "smooth" });
      return;
    }
    if (busy) busy();
    if (layout === "spread") flipSpread(spreadOf(target), target);
    else flipSingle(target);
  }
  const step = (d) => {
    if (mode === "flip" && layout === "spread") {
      const t = spreadIdx + d;
      if (t < 0 || t >= spreads.length) return;
      go(spreads[t][0] || spreads[t][1]);
    } else go(page + d);
  };

  function flipSpread(ti, target) {
    if (ti === spreadIdx) { page = target; update(); return; }
    const cur = spreads[spreadIdx], tgt = spreads[ti];
    const forward = ti > spreadIdx;
    tgt.forEach(preload);
    leaf.className = "leaf on " + (forward ? "to-left" : "to-right");
    if (forward) { paint(slotL, cur[0]); paint(slotR, tgt[1]); paint(front, cur[1]); paint(back, tgt[0]); }
    else { paint(slotL, tgt[0]); paint(slotR, cur[1]); paint(front, cur[0]); paint(back, tgt[1]); }
    spine.classList.add("off");
    leaf.style.transform = "rotateY(0deg)";
    void leaf.offsetWidth;
    leaf.classList.add("anim", "mid");
    leaf.style.transform = `rotateY(${forward ? -180 : 180}deg)`;
    book.style.transform = `translateX(${shiftFor(tgt)}px)`;
    page = target; update();
    const midT = setTimeout(() => leaf.classList.remove("mid"), 380);
    const done = () => {
      clearTimeout(t); clearTimeout(midT);
      leaf.removeEventListener("transitionend", onEnd);
      leaf.className = "leaf"; leaf.style.transform = "";
      busy = null; setStatic();
    };
    const onEnd = (e) => { if (e.target === leaf) done(); };
    const t = setTimeout(done, 900);
    leaf.addEventListener("transitionend", onEnd);
    busy = done;
  }

  function flipSingle(target) {
    if (target === page) return;
    slotR.style.setProperty("--dx", target > page ? "28px" : "-28px");
    page = target; setStatic(); update();
    slotR.classList.remove("swap"); void slotR.offsetWidth; slotR.classList.add("swap");
  }

  // ── 화면 갱신 ──
  const curLabel = $("#curLabel"), chapLabel = $("#chapLabel"), range = $("#range");
  function visiblePages() {
    if (mode === "flip" && layout === "spread") return spreads[spreadOf(page)].filter(Boolean);
    return [page];
  }
  function update() {
    const vis = visiblePages();
    curLabel.textContent = vis.length > 1 ? `${vis[0]}–${vis[1]}` : vis[0];
    chapLabel.textContent = chapName(vis[0]);
    range.value = vis[0];
    document.querySelectorAll(".case").forEach((b) => b.classList.toggle("on", vis.includes(+b.dataset.page)));
    document.querySelectorAll(".thumb").forEach((b) => b.classList.toggle("on", vis.includes(+b.dataset.page)));
    const first = mode === "flip" && layout === "spread" ? spreadOf(page) === 0 : page === 1;
    const last = mode === "flip" && layout === "spread" ? spreadOf(page) === spreads.length - 1 : page === N;
    $("#arrowPrev").disabled = $("#btnPrev").disabled = first;
    $("#arrowNext").disabled = $("#btnNext").disabled = last;
    const h = `#p${vis[0]}`;
    if (location.hash !== h) history.replaceState(null, "", h);
    const active = document.querySelector(".case.on");
    if (active && document.body.classList.contains("toc-ready")) {
      // 목차 안에서만 스크롤 (scrollIntoView는 바깥 화면까지 밀어 올림)
      const top = active.offsetTop - tocList.offsetTop, bottom = top + active.offsetHeight;
      if (top < tocList.scrollTop + 8) tocList.scrollTop = top - 40;
      else if (bottom > tocList.scrollTop + tocList.clientHeight - 8) tocList.scrollTop = bottom - tocList.clientHeight + 40;
    }
  }

  // ── 목차 ──
  const tocList = $("#tocList");
  B.chapters.forEach((c) => {
    const box = document.createElement("div"); box.className = "chap";
    const head = document.createElement("button");
    head.type = "button"; head.className = "chap-btn";
    head.innerHTML = `<span class="no">${c.no}</span><span class="nm">${c.name}</span>`;
    head.onclick = () => { go(c.pages[0].p); closeToc(); };
    box.appendChild(head);
    c.pages.forEach((pg) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "case"; b.dataset.page = pg.p;
      b.innerHTML = `<span class="pn">${pad(pg.p)}</span><span>${pg.title}</span>`;
      b.onclick = () => { go(pg.p); closeToc(); };
      box.appendChild(b);
    });
    tocList.appendChild(box);
  });
  const closeToc = () => document.body.classList.remove("toc-open");
  $("#btnToc").onclick = () => document.body.classList.toggle("toc-open");
  $("#btnTocClose").onclick = closeToc;
  $("#scrim").onclick = closeToc;

  // ── 크게 읽기 ──
  let observer;
  function buildScroll() {
    B.chapters.forEach((c) => {
      const h = document.createElement("div"); h.className = "sheet-chap";
      h.innerHTML = `<span class="no">${c.no}</span><span class="nm">${c.name}</span>`;
      scrollView.appendChild(h);
      c.pages.forEach((pg) => {
        const s = document.createElement("div");
        s.className = "sheet"; s.dataset.page = pg.p;
        s.style.backgroundImage = `url(${thumb(pg.p)})`;
        const img = new Image();
        img.loading = "lazy"; img.decoding = "async"; img.alt = altText(pg.p);
        img.onload = () => img.classList.add("ready");
        img.sizes = "(max-width: 952px) 100vw, 920px";
        img.srcset = srcset(pg.p);
        img.src = mid(pg.p);
        s.appendChild(img);
        s.insertAdjacentHTML("beforeend", `<span class="tag">${pg.p} / ${N}</span>`);
        s.onclick = () => openZoom(pg.p);
        scrollView.appendChild(s);
      });
    });
    const ratios = {};
    observer = new IntersectionObserver((ents) => {
      ents.forEach((e) => (ratios[e.target.dataset.page] = e.intersectionRatio));
      if (mode !== "scroll") return;
      let best = page, bestR = 0;
      for (const k in ratios) if (ratios[k] > bestR) { bestR = ratios[k]; best = +k; }
      if (best !== page) { page = best; update(); }
    }, { root: scrollView, threshold: [0, .15, .3, .5, .7, .9] });
    scrollView.querySelectorAll(".sheet").forEach((s) => observer.observe(s));
  }

  // ── 보기 방식 ──
  function setMode(m, save) {
    mode = m;
    document.body.classList.toggle("mode-scroll", m === "scroll");
    document.querySelectorAll(".seg button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.mode === m));
    if (save) store.set("cb-mode", m);
    if (m === "flip") { measure(); setStatic(); update(); }
    else requestAnimationFrame(() => go(page, { instant: true }));
  }
  document.querySelectorAll(".seg button").forEach((b) => (b.onclick = () => setMode(b.dataset.mode, true)));

  // ── 썸네일 ──
  const tray = $("#tray"), trayInner = $("#trayInner");
  for (let p = 1; p <= N; p++) {
    const t = document.createElement("button");
    t.type = "button"; t.className = "thumb"; t.dataset.page = p;
    t.innerHTML = `<img data-src="${thumb(p)}" alt="${altText(p)}">${p}`; // 패널을 처음 열 때 받음
    t.onclick = () => { go(p); toggleTray(false); };
    trayInner.appendChild(t);
  }
  function toggleTray(open) {
    const o = open ?? !tray.classList.contains("open");
    tray.classList.toggle("open", o); tray.setAttribute("aria-hidden", !o);
    if (o) trayInner.querySelectorAll("img[data-src]").forEach((i) => { i.src = i.dataset.src; i.removeAttribute("data-src"); });
    const on = trayInner.querySelector(".thumb.on");
    if (o && on) trayInner.scrollLeft = on.offsetLeft - trayInner.clientWidth / 2 + on.offsetWidth / 2;
  }
  $("#btnThumbs").onclick = () => toggleTray();

  // ── 버튼 ──
  $("#btnPrev").onclick = $("#arrowPrev").onclick = () => step(-1);
  $("#btnNext").onclick = $("#arrowNext").onclick = () => step(1);
  range.max = N; $("#totalLabel").textContent = N;
  range.oninput = () => go(+range.value);
  $("#btnZoom").onclick = () => openZoom(visiblePages()[0]);
  $("#btnFull").onclick = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  // 책 위 스와이프 / 클릭(확대)
  let sx = 0, sy = 0, sdown = false;
  flipView.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    sdown = true; sx = e.clientX; sy = e.clientY; hideHint();
  });
  flipView.addEventListener("pointerup", (e) => {
    if (!sdown) return; sdown = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { step(dx < 0 ? 1 : -1); return; }
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      const slot = e.target.closest(".slot, .face");
      if (slot && slot.dataset.page) openZoom(+slot.dataset.page);
    }
  });

  const hint = $("#hint");
  const hideHint = () => hint.classList.add("off");
  setTimeout(hideHint, 4500);

  // ── 확대 보기 ──
  const zoom = $("#zoom"), zc = $("#zoomCanvas"), zi = $("#zoomImg");
  let zp = 1, zs = 1, zx = 0, zy = 0, zfit = 1;
  zi.width = IMG_W; zi.height = IMG_H;
  const zv = () => ({ w: zc.clientWidth, h: zc.clientHeight });
  function zApply() {
    const { w, h } = zv(), sw = IMG_W * zs, sh = IMG_H * zs;
    zx = sw <= w ? (w - sw) / 2 : Math.min(0, Math.max(w - sw, zx));
    zy = sh <= h - 40 ? Math.max(70, (h - sh) / 2) : Math.min(70, Math.max(h - sh - 90, zy));
    zi.style.transform = `translate(${zx}px,${zy}px) scale(${zs})`;
    $("#zoomPct").textContent = Math.round((zs / zfit) * 100) + "%";
  }
  function zFit() {
    const { w, h } = zv();
    zfit = Math.min((w - (w > 760 ? 160 : 20)) / IMG_W, (h - 150) / IMG_H);
    zs = zfit; zApply();
  }
  function zWidth() {
    const { w } = zv();
    zs = Math.min((w - (w > 760 ? 160 : 0)) / IMG_W, 1.2); zy = 70; zApply();
  }
  function zAt(ns, cx, cy) {
    ns = Math.max(zfit, Math.min(Math.max(zfit * 6, 1.5), ns));
    zx = cx - (cx - zx) * (ns / zs); zy = cy - (cy - zy) * (ns / zs); zs = ns; zApply();
  }
  function zLoad(p) {
    zp = p; zi.style.background = `var(--cream) url(${thumb(p)}) center/cover`;
    zi.src = full(p); zi.alt = altText(p);
    $("#zoomPage").textContent = `${p} / ${N}`;
    $("#zoomPrev").disabled = p === 1; $("#zoomNext").disabled = p === N;
    zFit();
  }
  function openZoom(p) {
    zoom.classList.add("open"); zoom.setAttribute("aria-hidden", "false");
    zLoad(p); preload(p + 1);
  }
  function closeZoom() {
    zoom.classList.remove("open"); zoom.setAttribute("aria-hidden", "true");
    if (zp !== page) go(zp, { instant: true });
  }
  $("#zoomClose").onclick = closeZoom;
  $("#zoomPrev").onclick = () => zp > 1 && zLoad(zp - 1);
  $("#zoomNext").onclick = () => zp < N && (zLoad(zp + 1), preload(zp + 1));
  const zc2 = () => { const { w, h } = zv(); return [w / 2, h / 2]; };
  $("#zoomIn").onclick = () => zAt(zs * 1.4, ...zc2());
  $("#zoomOut").onclick = () => zAt(zs / 1.4, ...zc2());
  $("#zoomFit").onclick = zFit;
  $("#zoomWidth").onclick = zWidth;
  zc.addEventListener("wheel", (e) => {
    e.preventDefault();
    const mouse = e.deltaMode !== 0 || Math.abs(e.deltaY) >= 50;
    if (e.ctrlKey) zAt(zs * Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY); // 트랙패드 핀치
    else if (mouse) zAt(zs * (e.deltaY < 0 ? 1.18 : 1 / 1.18), e.clientX, e.clientY); // 마우스 휠
    else { zx -= e.deltaX; zy -= e.deltaY; zApply(); } // 트랙패드 스크롤 → 이동
  }, { passive: false });

  const pts = new Map();
  let pinch = null, lastTap = 0, moved = false;
  zc.addEventListener("pointerdown", (e) => {
    zc.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = false;
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: zs };
    }
    zc.classList.add("drag");
  });
  zc.addEventListener("pointermove", (e) => {
    const prev = pts.get(e.pointerId); if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pts.set(e.pointerId, cur);
    if (Math.hypot(cur.x - prev.x, cur.y - prev.y) > 1) moved = true;
    if (pts.size === 2 && pinch) {
      const [a, b] = [...pts.values()];
      zAt(pinch.s * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2);
    } else if (pts.size === 1) { zx += cur.x - prev.x; zy += cur.y - prev.y; zApply(); }
  });
  const zUp = (e) => {
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
    if (!pts.size) zc.classList.remove("drag");
    if (e.type === "pointerup" && !moved) {
      const now = Date.now();
      if (now - lastTap < 320) {
        lastTap = 0;
        if (zs > zfit * 1.2) zFit(); else zAt(zfit * 2.4, e.clientX, e.clientY);
      } else lastTap = now;
    }
  };
  zc.addEventListener("pointerup", zUp);
  zc.addEventListener("pointercancel", zUp);

  // ── 키보드 ──
  addEventListener("keydown", (e) => {
    if (zoom.classList.contains("open")) {
      if (e.key === "Escape") closeZoom();
      else if (e.key === "ArrowLeft") $("#zoomPrev").click();
      else if (e.key === "ArrowRight") $("#zoomNext").click();
      else if (e.key === "+" || e.key === "=") $("#zoomIn").click();
      else if (e.key === "-") $("#zoomOut").click();
      else if (e.key === "0") zFit();
      return;
    }
    if (e.target.closest?.("input")) return;
    if (e.key === "Escape") { closeToc(); toggleTray(false); }
    if (mode !== "flip") return;
    if (e.key === "ArrowLeft" || e.key === "PageUp") step(-1);
    else if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); step(1); }
    else if (e.key === "Home") go(1);
    else if (e.key === "End") go(N);
  });

  // ── 창 크기 / 주소 ──
  let rt;
  addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (mode === "flip") { if (busy) busy(); measure(); setStatic(); update(); }
      if (zoom.classList.contains("open")) zFit();
    }, 80);
  });
  addEventListener("hashchange", () => {
    const m = location.hash.match(/^#p(\d+)$/);
    if (m && +m[1] !== visiblePages()[0]) go(+m[1]);
  });

  // ── 시작 ──
  const m = location.hash.match(/^#p(\d+)$/);
  if (m) page = Math.max(1, Math.min(N, +m[1]));
  buildScroll();
  const saved = store.get("cb-mode");
  const narrow = innerWidth <= 760 || innerHeight > innerWidth * 1.05;
  measure();
  setMode(saved === "flip" || saved === "scroll" ? saved : narrow ? "scroll" : "flip", false);
  if (mode === "scroll") $("#hint").remove();
  requestAnimationFrame(() => { document.body.classList.add("toc-ready"); update(); });
})();
