/* the four verbs — pinned scene: SHOOT · FILM · DESIGN · ARCHIVE.
   Words light up one by one while their frame wipes up over the previous one (with a shutter click).
   Stack layout (no pin) on phones, reduced motion, motion off, or no GSAP. Uses drive.js globals. */
(function verbs(){
  const root = $("#verbs"); if (!root) return;
  const live = hasGsap && !reduced && motionOn && innerWidth >= 900;
  const wasNarrow = innerWidth < 900;
  addEventListener("resize", () => { if ((innerWidth < 900) !== wasNarrow) location.reload(); });   // pinned layout only at >= 900px
  if (!live){ root.classList.add("vb-static"); return; }
  document.documentElement.classList.add("vb-live");
  const stage = $("#vbStage"), deck = $("#vbDeck"), flash = $("#vbFlash"), count = $("#vbCount"), prog = $("#vbProg"), tcEl = $("#vbTc");
  const items = $$(".vb-item", root), N = items.length;
  const frames = items.map(it => $(".vb-frame", it));
  frames.forEach(f => deck.appendChild(f));                         // frames stack in the deck; words stay in the list
  const media = frames.map(f => $(".vb-media", f).firstElementChild);   // first child scales for the "develop" feel
  const ROT = [-2.4, 1.8, -1.3, 2.2];
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  let target = 0, P = 0, active = 0, running = false, onScreen = false, tc = 0, last = 0;

  function render(p){
    const seg = p * N;
    let a0 = 0, best = -1;
    items.forEach((it, i) => {
      const a = (i === 0 ? 1 : sstep(i - 0.5, i + 0.1, seg)) * (i === N - 1 ? 1 : 1 - sstep(i + 0.5, i + 1.1, seg));
      it.style.setProperty("--a", a.toFixed(3));
      if (a > best){ best = a; a0 = i; }
    });
    frames.forEach((f, i) => {
      const r = i === 0 ? 1 : sstep(i - 0.5, i + 0.1, seg);                       // this frame's reveal
      const nx = i === N - 1 ? 0 : sstep(i + 0.5, i + 1.1, seg);                  // how far the next one has covered it
      f.style.clipPath = `inset(${((1 - r) * 100).toFixed(2)}% 0 0 0)`;
      f.style.transform = `rotate(${(ROT[i] * (0.35 + 0.65 * (1 - nx * 0.4)) * (i === 0 ? 1 : 0.4 + 0.6 * r)).toFixed(2)}deg) scale(${(1 - 0.045 * nx).toFixed(4)})`;
      f.style.filter = nx > 0 ? `brightness(${(1 - 0.55 * nx).toFixed(3)})` : "";
      f.style.zIndex = String(i + 1);
      media[i].style.transform = `scale(${(1.18 - 0.18 * r + 0.04 * nx).toFixed(4)})`;
    });
    prog.style.transform = `scaleY(${clamp(p).toFixed(4)})`;
    if (a0 !== active){
      active = a0;
      count.textContent = `FRAME 0${active + 1} / 0${N}`;
      flash.classList.remove("on"); void flash.offsetWidth; flash.classList.add("on");   // shutter click
    }
  }
  function tick(now){
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    P += (target - P) * (1 - Math.exp(-dt * 9));
    if (Math.abs(target - P) < 0.0004) P = target;
    render(P);
    if (active === 1){ tc += dt; const f = Math.floor(tc * 24) % 24, s = Math.floor(tc) % 60, m = Math.floor(tc / 60); tcEl.textContent = `00:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`; }
    if (onScreen || P !== target) requestAnimationFrame(tick); else running = false;
  }
  function wake(){ if (!running){ running = true; last = performance.now(); requestAnimationFrame(tick); } }
  render(0);
  ScrollTrigger.create({
    trigger: root, start: "top top", end: "bottom bottom", invalidateOnRefresh: true,
    onUpdate: s => { target = s.progress; wake(); },
    onToggle: s => { onScreen = s.isActive; if (onScreen) wake(); },
    onRefresh: s => { target = s.progress; P = target; render(P); }
  });
})();
