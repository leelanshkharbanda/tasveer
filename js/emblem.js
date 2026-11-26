/* ============================================================
   TASVEER — EMBLEM
   The logo is the first scene. It draws itself in, rests, then opens
   like a shutter as you scroll: the blades iris outward, the V swings
   apart and flies past the camera, the lettering scatters, and the
   photograph behind the aperture grows to fill the screen — landing
   exactly on the hero's first frame.
   Needs globals from drive.js: $, $$, hasGsap, reduced, motionOn.
   ============================================================ */
(() => {
  const sec = document.getElementById("emblem");
  if (!sec) return;
  const svg = document.getElementById("emSvg");
  const stage = document.getElementById("emStage");
  const runway = document.getElementById("emRunway");
  const cover = document.getElementById("emCover");     // solid black behind the collage
  const collage = document.getElementById("emCollage"); // photo wall, shown through the aperture
  const wall = document.getElementById("emWall");
  let cols = [];
  const DRIFT = () => (innerWidth < 760 ? 300 : 520);
  const veil = document.getElementById("emVeil");       // holds the hole shut until the blades land
  const vids = ["heroVideo", "heroVideoB"].map(id => document.getElementById(id)).filter(Boolean);   // the hero's own footage
  const hint = document.getElementById("emHint");
  const root = document.documentElement;
  const live = !reduced && motionOn && hasGsap;
  if (!live) { root.classList.add("em-static"); if (hint) hint.innerHTML = "SCROLL <span class=\"arrow\">↓</span>"; return; }   // static logo, no pinned scene

  root.classList.add("em-live", "em-armed");

  /* ---- logo geometry (viewBox units) ---- */
  /* ---- the photo wall: built to fit the screen, never repeating a frame nearby ---- */
  const PHOTOS = [["concert-purple",620,465],["concert-sil",620,413],["crowd-hands",620,413],["event-crowd",620,413],["photo005",480,720],["photo007",480,720],["photo012",620,413],["photo014",620,413],["photo015",620,413],["photo017",620,413],["photo019",620,349],["photo020",480,853],["photo026",620,467],["photo028",480,720],["photo034",620,413],["photo038",620,413],["photo041",620,413],["photo044",480,720],["photo045",620,413],["photo051",620,412],["photo052",620,412],["photo053",480,720],["photo057",480,720],["photo062",620,413],["photo074",480,584],["photo075",620,519],["photo077",480,720],["photo078",620,496],["photo079",620,496],["photo081",620,413],["photo083",480,719],["photo086",480,836],["photo088",620,499],["photo089",480,600],["sparklers",620,414],["stage-lights",620,413]];    // [file, width, height]
  const rng32 = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let wallKey = "";
  function buildWall() {
    const mobile = innerWidth < 760, n = mobile ? 4 : innerWidth < 1100 ? 6 : 8;
    const wallW = innerWidth * (mobile ? 1.3 : 1.5), gap = mobile ? 7 : 10;
    const key = `${n}|${Math.round(innerWidth / 40)}|${Math.round(innerHeight / 40)}`;
    if (key === wallKey) return false;
    wallKey = key;
    const colW = (wallW - gap * (n - 1)) / n;
    const need = mobile ? innerHeight * 1.2 + DRIFT() * 1.1 + 240 : innerHeight * 1.55 + 2 * DRIFT() * 0.8 + 280;          // column height that never runs out on screen
    const rnd = rng32(20161125), placed = [];                           // placed: {name, x, y}
    const minDist = innerHeight * (mobile ? 1.9 : 1.4);
    const shuffle = arr => arr.map(p => p).sort(() => rnd() - 0.5);
    let pool = shuffle(PHOTOS), recent = [];                            // recent: the last placements, kept apart from the next deck
    wall.textContent = "";
    cols = [];
    for (let c = 0; c < n; c++) {
      const colEl = document.createElement("div"); colEl.className = "em-col";
      cols.push({ el: colEl, dir: c % 2 ? 1 : -1, base: [0, -140, 80, -60, 120, -100, 40, -20][c % 8], tiles: [], y: 0 });
      wall.appendChild(colEl);
    }
    /* masonry fill: always extend the shortest column, dealing from one long shuffled deck,
       so a photo comes back only after ~36 placements (i.e. far away in every direction) */
    for (;;) {
      const col = cols.reduce((m, c) => (c.y < m.y ? c : m), cols[0]);
      if (col.y >= need) break;
      if (!pool.length) pool = shuffle(PHOTOS).sort((x, y) => (recent.includes(x[0]) ? 1 : 0) - (recent.includes(y[0]) ? 1 : 0));
      const c = cols.indexOf(col), cx = c * (colW + gap);
      let pick = -1;
      for (let i = 0; i < pool.length && pick < 0; i++) {
        const p = pool[i], h = colW * p[2] / p[1], cy = col.y + h / 2;
        if (!placed.some(q => q.name === p[0] && Math.hypot(q.x - cx, q.y - cy) < minDist)) pick = i;
      }
      if (pick < 0) pick = 0;
      const p = pool.splice(pick, 1)[0], h = colW * p[2] / p[1];
      placed.push({ name: p[0], x: cx, y: col.y + h / 2 });
      recent.push(p[0]); if (recent.length > 22) recent.shift();
      const fig = document.createElement("figure"); fig.className = "em-tile";
      const img = new Image(); img.src = `assets/collage/${p[0]}.webp`; img.width = p[1]; img.height = p[2]; img.alt = ""; img.decoding = "async";
      fig.appendChild(img); col.el.appendChild(fig);
      col.tiles.push({ el: fig, dx: 0, dy: 0, rot: 0, delay: 0 });
      col.y += h + gap;
    }
    return true;
  }
  const LOGO_END = 0.68;     // the logo finishes opening here; the rest of the scroll is the collage hold + burst
  const AP = { cx: 1293, cy: 961, v: [[1171, 837], [1462, 909], [1247, 1137]] };   // the aperture triangle
  const APEX = [1279, 1533];                                                       // bottom point of the V
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;

  const crops = $$(".lg-crop", svg).map(g => ({ g, sc: g.firstElementChild, px: +g.dataset.px, py: +g.dataset.py, left: g.classList.contains("lg-crop-l"), dx: 0, dy: 0 }));
  const core = $(".lg-core", svg);
  const vL = $(".lg-v-l", svg), vR = $(".lg-v-r", svg), vG = $(".lg-v", svg);
  const blades = $$(".lg-blade", svg).map(g => {
    const cx = +g.dataset.cx, cy = +g.dataset.cy;
    let ux = cx - AP.cx, uy = cy - AP.cy; const l = Math.hypot(ux, uy) || 1;
    return { g, sc: g.firstElementChild, ux: ux / l, uy: uy / l };
  });
  const wordCh = $$(".lg-word .lg-ch", svg).map(g => ({ g, sc: g.firstElementChild, cx: +g.dataset.cx }));
  const subCh = $$(".lg-sub .lg-ch", svg).map(g => ({ g, sc: g.firstElementChild, cx: +g.dataset.cx }));
  const wordG = $(".lg-word", svg), subG = $(".lg-sub", svg);

  /* where each photo sits, so the burst can throw it away from the centre */
  const WALL_ROT = -9 * Math.PI / 180, WALL_SCALE = () => (innerWidth < 760 ? 1.0 : 1.12);
  function measureTiles() {
    cols.forEach(c => { c.el.style.transform = "none"; c.tiles.forEach(t => { t.el.style.transform = "none"; }); });
    const cx = stageR.left + stageR.width / 2, cy = stageR.top + stageR.height / 2;
    const all = [];
    cols.forEach(c => c.tiles.forEach(t => {
      const r = t.el.getBoundingClientRect();
      const vx = r.left + r.width / 2 - cx, vy = r.top + r.height / 2 - cy, d = Math.hypot(vx, vy) || 1;
      /* screen-space throw → wall-local space (undo the wall's rotation/scale) */
      const wx = vx / d * 420 + vx * 0.9, wy = vy / d * 420 + vy * 0.9;
      const k = 1 / WALL_SCALE(), ca = Math.cos(WALL_ROT), sa = Math.sin(WALL_ROT);
      t.dx = (wx * ca + wy * sa) * k; t.dy = (-wx * sa + wy * ca) * k;
      t.rot = (vx > 0 ? 1 : -1) * (6 + (d % 9));
      t.d = d; all.push(t);
    }));
    const max = Math.max(...all.map(t => t.d)) || 1;
    all.forEach(t => { t.delay = (t.d / max) * 0.3; });   // centre photos leave first
  }

  /* ---- screen mapping, recomputed on resize ---- */
  let stageR = null, ctm = null, tri = null, sEnd = 80, diag = 1400;
  function measure() {
    buildWall();
    stageR = stage.getBoundingClientRect();
    ctm = svg.getScreenCTM();
    if (!ctm || !stageR.width) return;
    const toS = (x, y) => [ctm.a * x + ctm.e - stageR.left, ctm.d * y + ctm.f - stageR.top];
    const c = toS(AP.cx, AP.cy);
    tri = { c, v: AP.v.map(([x, y]) => { const p = toS(x, y); return [p[0] - c[0], p[1] - c[1]]; }) };
    /* smallest distance from the centroid to a triangle edge → how far to grow to cover the viewport */
    let dMin = 1e9;
    for (let i = 0; i < 3; i++) {
      const a = tri.v[i], b = tri.v[(i + 1) % 3];
      const ex = b[0] - a[0], ey = b[1] - a[1];
      const dist = Math.abs(ex * (0 - a[1]) - ey * (0 - a[0])) / Math.hypot(ex, ey);
      dMin = Math.min(dMin, dist);
    }
    diag = Math.hypot(stageR.width, stageR.height);
    sEnd = (diag * 0.62 + Math.hypot(...tri.c.map((v, i) => v - [stageR.width, stageR.height][i] / 2))) / Math.max(4, dMin) * 1.15;
    measureTiles();
    const m = Math.max(10, stageR.width * 0.0222), top = Math.max(60, stageR.height * 0.089) + m * 0.6;
    crops.forEach(o => {
      const s = toS(o.px, o.py);
      const tx = o.left ? m + 6 : stageR.width - m - 6, ty = top;
      o.dx = (tx - s[0]) / ctm.a; o.dy = (ty - s[1]) / ctm.d;
    });
  }

  let drawn = false, tl = null;

  /* ---- one frame of the scene for progress p (0..1) ---- */
  const t0 = performance.now();
  let lastNav = -1;
  function render(P) {
    if (!ctm) measure();
    if (!ctm) return;
    const p = clamp(P / LOGO_END);                      // logo-opening progress; P is the whole scene
    const idle = (1 - sstep(0, 0.07, p)) * Math.sin((performance.now() - t0) / 1700) * 1.1;

    /* lettering scatters first */
    const wk = sstep(0.0, 0.3, p), sk = sstep(0.0, 0.2, p);
    wordCh.forEach((o, i) => { o.sc.setAttribute("transform", `translate(${((o.cx - 1279) * 1.5 * wk).toFixed(1)} ${((i % 2 ? 1 : -1) * 70 * wk).toFixed(1)})`); });
    subCh.forEach((o, i) => { o.sc.setAttribute("transform", `translate(${((o.cx - 1279) * 1.1 * sk).toFixed(1)} ${(90 * sk).toFixed(1)})`); });
    wordG.setAttribute("opacity", (1 - sstep(0.03, 0.27, p)).toFixed(3));
    subG.setAttribute("opacity", (1 - sstep(0.0, 0.17, p)).toFixed(3));

    /* crop marks glide to the corners and stay as a viewfinder frame */
    const ck = sstep(0.04, 0.6, p);
    crops.forEach(o => { o.sc.setAttribute("transform", `translate(${(o.dx * ck).toFixed(1)} ${(o.dy * ck).toFixed(1)})`); });
    const cropOp = (1 - sstep(0.8, 0.93, P)).toFixed(3);   // the viewfinder frame lets go before the headline arrives
    crops.forEach(o => o.sc.setAttribute("opacity", cropOp));

    /* blades: iris rotate + slide outward from the aperture */
    const bk = sstep(0.1, 0.72, p), rot = bk * 58 + idle;
    blades.forEach(o => {
      o.sc.setAttribute("transform", `translate(${(o.ux * bk * 620).toFixed(1)} ${(o.uy * bk * 620).toFixed(1)}) rotate(${rot.toFixed(2)} ${AP.cx} ${AP.cy})`);
      o.sc.setAttribute("opacity", (1 - sstep(0.55, 0.9, p)).toFixed(3));
    });

    /* the V swings open about its point */
    const vk = sstep(0.12, 0.78, p);
    vL.setAttribute("transform", `translate(${(-vk * 220).toFixed(1)} 0) rotate(${(-vk * 66).toFixed(2)} ${APEX[0]} ${APEX[1]})`);
    vR.setAttribute("transform", `translate(${(vk * 220).toFixed(1)} 0) rotate(${(vk * 66).toFixed(2)} ${APEX[0]} ${APEX[1]})`);
    const vo = (1 - sstep(0.62, 0.95, p)).toFixed(3);
    vL.setAttribute("opacity", vo); vR.setAttribute("opacity", vo);

    /* fly through the aperture */
    const fk = Math.pow(sstep(0.28, 1, p), 2.2), fs = 1 + fk * 9;
    core.setAttribute("transform", `translate(${AP.cx} ${AP.cy}) scale(${fs.toFixed(3)}) translate(${-AP.cx} ${-AP.cy})`);

    /* the photo wall is revealed through the aperture */
    const q = sstep(0.12, 0.8, p);
    if (tri) {
      if (q >= 0.999) {
        collage.style.clipPath = "none";
      } else {
        const s = Math.exp(lerp(0, Math.log(sEnd), q));
        const a = rot * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
        const pts = tri.v.map(([x, y]) => {
          const X = (x * ca - y * sa) * s + tri.c[0], Y = (x * sa + y * ca) * s + tri.c[1];
          return `${X.toFixed(1)}px ${Y.toFixed(1)}px`;
        });
        collage.style.clipPath = `polygon(${pts.join(",")})`;
      }
    }
    /* columns drift in opposite directions the whole way */
    cols.forEach(c => { c.el.style.transform = `translate3d(0,${(c.base + c.dir * P * DRIFT()).toFixed(1)}px,0)`; });

    /* the burst: photos are thrown outward, centre first, and the drone footage underneath takes over */
    const k = sstep(0.7, 0.95, P);
    cols.forEach(c => c.tiles.forEach(t => {
      const kk = sstep(t.delay, t.delay + 0.55, k);
      if (kk === 0 && !t.on) return;
      t.on = kk > 0;
      t.el.style.transform = kk === 0 ? "" : `translate3d(${(t.dx * kk).toFixed(1)}px,${(t.dy * kk).toFixed(1)}px,0) rotate(${(t.rot * kk).toFixed(2)}deg) scale(${(1 + 0.4 * kk).toFixed(3)})`;
      t.el.style.opacity = kk === 0 ? "" : (1 - sstep(0.62, 1, kk)).toFixed(3);
    }));
    const gone = k >= 0.999;
    cover.style.opacity = k === 0 ? "" : (1 - sstep(0, 0.3, k)).toFixed(3);
    collage.style.visibility = cover.style.visibility = gone ? "hidden" : "";
    vids.forEach(v => { v.style.scale = gone ? "" : (1 + 0.07 * (1 - k)).toFixed(4); });

    if (hint && drawn) hint.style.opacity = String(1 - sstep(0, 0.07, p));
    /* the small mark in the nav fills in as the big one leaves */
    const nv = +sstep(0.86, 0.99, P).toFixed(2);
    if (nv !== lastNav) { lastNav = nv; root.style.setProperty("--navmark", nv); }
  }

  /* ---- scroll → progress, eased with a lerp ---- */
  let target = 0, pos = 0, raf = 0;
  const loop = () => {
    raf = 0;
    pos += (target - pos) * 0.16;
    if (Math.abs(target - pos) < 0.0006) pos = target;
    render(pos);
    if (pos !== target || pos < 0.07) raf = requestAnimationFrame(loop);   // keep ticking while idling at rest
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

  ScrollTrigger.create({
    trigger: runway, start: "top top", end: "bottom bottom",
    onUpdate: self => { target = self.progress; kick(); },
    onRefresh: self => { measure(); target = pos = self.progress; render(pos); }
  });
  addEventListener("resize", () => { measure(); render(pos); }, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); render(pos); });
  measure(); render(0); kick();

  /* ---- draw-in on load ---- */
  function reveal() {
    root.classList.remove("em-armed");
  }
  function finishDraw() {
    if (drawn) return; drawn = true;
    if (tl) tl.progress(1);
    vG.removeAttribute("clip-path");
    reveal();
  }
  function draw() {
    if (drawn || tl) return;
    const rect = document.getElementById("lgVClipRect");
    const ins = sel => $$(sel, svg);
    gsap.set(ins(".lg-in"), { opacity: 0 });
    reveal();                                                    // inline opacity:0 now holds the hidden state
    gsap.set(hint, { opacity: 0 });
    gsap.set(veil, { opacity: 1 });
    tl = gsap.timeline({ onComplete: () => { drawn = true; vG.removeAttribute("clip-path"); render(pos); } });
    ins(".lg-crop").forEach((el, i) => {
      tl.fromTo(el, { opacity: 1, scale: 0.0001, svgOrigin: `${el.dataset.px} ${el.dataset.py}` },
                    { opacity: 1, scale: 1, duration: 0.9, ease: "expo.out" }, i * 0.08);
    });
    tl.set(vG, { opacity: 1 }, 0)
      .fromTo(rect, { attr: { height: 0 } }, { attr: { height: 900 }, duration: 1.15, ease: "power3.inOut" }, 0.12)
      .fromTo(ins(".lg-blade"), { opacity: 0, rotation: -40, scale: 0.55, svgOrigin: `${AP.cx} ${AP.cy}` },
              { opacity: 1, rotation: 0, scale: 1, duration: 0.7, ease: "back.out(1.5)", stagger: 0.11 }, 0.7)
      .fromTo(ins(".lg-word .lg-in"), { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.05 }, 1.0)
      .fromTo(ins(".lg-sub .lg-in"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.022 }, 1.35)
      .to(veil, { opacity: 0, duration: 0.7, ease: "power2.out" }, 1.0)
      .to(hint, { opacity: 1, duration: 0.6 }, 1.9);
  }
  /* a scroll before the draw-in finishes jumps straight to the finished logo */
  const guard = () => { if (tl && !drawn) finishDraw(); };
  ScrollTrigger.addEventListener("scrollStart", guard);
  addEventListener("wheel", guard, { passive: true });
  addEventListener("touchmove", guard, { passive: true });

  const go = () => requestAnimationFrame(draw);
  if (window.__tasveerReady || !document.getElementById("introCurtain")) go();
  else document.addEventListener("tasveer:ready", go, { once: true });
  setTimeout(() => { if (!tl) go(); }, 5200);                    // safety net
})();
