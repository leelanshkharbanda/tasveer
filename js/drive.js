/* ============================================================
   TASVEER × DRIVE — interaction engine
   Inspired by drivecapital.com's editorial system; original code.
   Lessons applied: touch-gated Lenis, goTo (no scrollTo shadow),
   visible-by-default reveals, refresh wrapped in lenis stop/start,
   esc() everywhere, document-level menu Esc, no async while-removal.
   ============================================================ */
"use strict";
const D = window.TASVEER_DATA;
const { CONFIG, GALLERY, CREDITS } = D;
const $ = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => [...c.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let motionOn = localStorage.getItem("tasveer_drive_motion") !== "off";   /* declared early: ScrollTrigger callbacks read it on reload */
const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const rand = (a,b) => a + Math.random()*(b-a);

function toast(msg, ms=2800){
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(t._h); t._h = setTimeout(()=>t.classList.remove("show"), ms);
}

/* ---------- drive-specific content ---------- */
const BEATS = [
  {code:"AUD", name:"AUDITORIUM",     phrase:"every stage, covered"},
  {code:"LWN", name:"LAWNS",          phrase:"the night, in frames"},
  {code:"LIB", name:"LIBRARY",        phrase:"quiet, documented"},
  {code:"CNT", name:"CANTEEN",        phrase:"overheard, archived"},
  {code:"SPC", name:"SPORTS COMPLEX", phrase:"finish lines, frozen"},
  {code:"AMP", name:"AMPHITHEATRE",   phrase:"open mic, open shutter"},
];
const A = "assets/drive/";
const ROLL = [
  {name:"ANNUAL FEST '26", code:"FST", count:24, note:"Three days, four stages, one sleep-deprived crew.",
   frames:[[A+"photo017.webp","headliner night, green light"],[A+"photo007.webp","split light, front rail"],[A+"photo045.webp","the full house, purple wash"],[A+"photo026.webp","battle of bands, red light"]]},
  {name:"MAADHYAM", code:"MDY", count:18, note:"The cultural fest — fire, flips, and the verse that silenced the lawn.",
   frames:[[A+"photo077.webp","the diya, held breath"],[A+"photo075.webp","mid-flip, red backdrop"],[A+"photo079.webp","the duet, purple hour"],[A+"photo019.webp","the verse nobody forgot"]]},
  {name:"CONVOCATION", code:"CNV", count:32, note:"Caps in the air, parents in the frame. We shoot the day everyone forgets to document.",
   frames:[[A+"campus-bldg.webp","the quad, morning of"],[A+"photo083.webp","the address, spotlight"],[A+"students.webp","waiting for names"],[A+"photo081.webp","the send-off, confetti"]]},
  {name:"ESYA TECH FEST", code:"ESY", count:12, note:"The tech fest — talks, builds, and the demo that almost didn't boot.",
   frames:[[A+"photo053.webp","the talk, day one"],[A+"laptops.webp","hour 22, still building"],[A+"students.webp","the whiteboard argument"],[A+"library2.webp","quiet floor, loud minds"]]},
  {name:"SPORTS MEET", code:"SPT", count:26, note:"Finish lines, frozen. The sports complex is our fastest shutter speed.",
   frames:[[A+"photo005.webp","the backflip, peak action"],[A+"photo062.webp","the pool final, dead focus"],[A+"crowd-hands.webp","the stands, last over"],[A+"event-crowd.webp","medal ceremony"]]},
  {name:"CAMPUS QUIET", code:"QUT", count:15, note:"Between events, the campus is still a story. These are the frames nobody asks for.",
   frames:[[A+"library.webp","the reading room"],[A+"camera-girl.webp","a shooter, shooting shooters"],[A+"vintage-cam.webp","the society's first camera"],[A+"film-camera.webp","glass and dials"]]},
];
const HERO_POSTER = A+"poster4.jpg";

/* ---------- smooth scroll: desktop wheel only ---------- */
let lenis = null;
const touchDevice = matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
if (hasGsap && !reduced && !touchDevice && typeof Lenis !== "undefined"){
  lenis = new Lenis({ lerp:.09 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t*1000));
  gsap.ticker.lagSmoothing(0);
}
function goTo(target){
  if (lenis) lenis.scrollTo(target, {duration:1.3});
  else $(target)?.scrollIntoView({behavior: reduced ? "auto" : "smooth"});
}
function safeRefresh(){
  if (!hasGsap) return;
  if (lenis) lenis.stop();
  ScrollTrigger.refresh();
  if (lenis) lenis.start();
}

/* ---------- header hide/show ---------- */
const nav = $("#nav");
let lastY = 0;
function onScroll(){
  const y = window.scrollY;
  nav.classList.toggle("hidden-nav", y > lastY && y > innerHeight*.6 && !menu.classList.contains("open"));
  lastY = y;
  const max = document.documentElement.scrollHeight - innerHeight;
  $("#progressFill").style.transform = `scaleY(${max>0 ? y/max : 0})`;
}
addEventListener("scroll", onScroll, {passive:true});

/* ---------- menu ---------- */
const menu = $("#menu"), burger = $("#burger");
function setMenu(open){
  burger.setAttribute("aria-expanded", String(open));
  menu.classList.toggle("open", open);
  menu.setAttribute("aria-hidden", String(!open));
  document.body.style.overflow = open ? "hidden" : "";
  if (lenis) open ? lenis.stop() : lenis.start();
  if (open){
    const tryFocus=(n)=>{
      const a=$(".menu-links a", menu);
      if (a){ a.focus(); if (document.activeElement===a) return; }
      if (n<20) setTimeout(()=>tryFocus(n+1), 30);
    };
    setTimeout(()=>tryFocus(0), 30);
  }
}
burger.addEventListener("click", ()=>setMenu(!menu.classList.contains("open")));
$("#menuClose").addEventListener("click", ()=>{ setMenu(false); burger.focus(); });
document.addEventListener("keydown", e=>{
  if (e.key === "Escape" && menu.classList.contains("open")){ setMenu(false); burger.focus(); }
});
menu.addEventListener("keydown", e=>{
  if (e.key !== "Tab") return;
  const f = $$("a,button", menu).filter(el=>el.offsetParent !== null);
  const i = f.indexOf(document.activeElement);
  e.preventDefault();
  f[(e.shiftKey ? (i<=0 ? f.length-1 : i-1) : (i+1) % f.length)].focus();
});
$$(".menu-links a").forEach(a=>a.addEventListener("click", e=>{
  e.preventDefault();
  const href=a.getAttribute("href");
  setMenu(false);
  goTo(href);
  const target=$(href);
  if (target){ target.setAttribute("tabindex","-1"); target.focus({preventScroll:true}); }
}));

/* ---------- marquees: duration proportional to content ---------- */
function buildMarquee(el, itemsHTML, {invert=false, secPerItem=6, pauseHover=false}={}){
  const track = document.createElement("div");
  track.className = "marquee-track" + (invert ? " inverted" : "") + (pauseHover ? " pause-hover" : "");
  track.innerHTML = itemsHTML + itemsHTML; /* two copies → seamless -50% loop */
  const nodes=[...track.children], half=nodes.length/2;
  nodes.slice(half).forEach(n=>{
    n.setAttribute("aria-hidden","true");
    if (n.matches("[data-lb],a,button,[tabindex]")) n.setAttribute("tabindex","-1");
    $$("[data-lb],a,button,[tabindex]",n).forEach(x=>x.setAttribute("tabindex","-1"));
  });
  track.style.setProperty("--dur", `${Math.max(20, secPerItem * itemsHTML.split("data-item").length - 1)}s`);
  el.appendChild(track);
  return track;
}
const heroItems = BEATS.map(b=>`<span class="item mono" data-item><span class="code">${esc(b.code)}</span><span>${esc(b.phrase)}</span><span class="sep">—</span></span>`).join("");
buildMarquee($("#heroMarquee"), heroItems, {secPerItem:6});
const beatItems = BEATS.map(b=>`<span class="item" data-item><span class="name">${esc(b.name)}</span><span class="code">${esc(b.code)}</span></span>`).join("");
buildMarquee($("#beatMarquee"), beatItems, {invert:true, secPerItem:9});

/* photo band: a hand-picked strip from the archive */
const bandImgs = [   /* [thumb, caption, full-size for the viewer] — frames pulled from THE ARCHIVE dataset (assets/wheel) */
  ["assets/wheel/w-006.webp","holi, in colour","assets/wheel/wf-006.webp"],
  ["assets/wheel/w-063.webp","the musicians","assets/wheel/wf-063.webp"],
  ["assets/wheel/w-013.webp","night court","assets/wheel/wf-013.webp"],
  ["assets/wheel/w-070.webp","mono portrait","assets/wheel/wf-070.webp"],
  ["assets/wheel/w-034.webp","stage, magenta","assets/wheel/wf-034.webp"],
  ["assets/wheel/w-076.webp","the Taj, mirrored","assets/wheel/wf-076.webp"],
  ["assets/wheel/w-028.webp","lantern glow","assets/wheel/wf-028.webp"],
  ["assets/wheel/w-049.webp","fest stage","assets/wheel/wf-049.webp"],
  ["assets/wheel/w-054.webp","behind the lens","assets/wheel/wf-054.webp"],
  ["assets/wheel/w-097.webp","lantern bazaar","assets/wheel/wf-097.webp"],
  ["assets/wheel/w-035.webp","mid-gesture","assets/wheel/wf-035.webp"],
  ["assets/wheel/w-077.webp","sparkler loops","assets/wheel/wf-077.webp"],
  ["assets/wheel/w-038.webp","the elder","assets/wheel/wf-038.webp"],
  ["assets/wheel/w-082.webp","guitar circle","assets/wheel/wf-082.webp"],
  ["assets/wheel/w-027.webp","holi, up close","assets/wheel/wf-027.webp"],
  ["assets/wheel/w-094.webp","heart, at sunset","assets/wheel/wf-094.webp"],
  ["assets/wheel/w-020.webp","the jump shot","assets/wheel/wf-020.webp"],
  ["assets/wheel/w-062.webp","at the wheel","assets/wheel/wf-062.webp"],
  ["assets/wheel/w-052.webp","the kurta squad","assets/wheel/wf-052.webp"],
  ["assets/wheel/w-029.webp","mosque, blue hour","assets/wheel/wf-029.webp"],
  ["assets/wheel/w-036.webp","two friends","assets/wheel/wf-036.webp"],
  ["assets/wheel/w-080.webp","street dancer","assets/wheel/wf-080.webp"],
  ["assets/wheel/w-066.webp","the lane","assets/wheel/wf-066.webp"],
  ["assets/wheel/w-087.webp","reaching out","assets/wheel/wf-087.webp"],
  ["assets/wheel/w-043.webp","puddle reflection","assets/wheel/wf-043.webp"],
  ["assets/wheel/w-075.webp","white beard","assets/wheel/wf-075.webp"],
  ["assets/wheel/w-031.webp","golden hour","assets/wheel/wf-031.webp"],
  ["assets/wheel/w-100.webp","small and still","assets/wheel/wf-100.webp"],
];
const tileCls = ["t-a","t-b","t-c"];
const bandHTML = bandImgs.map((im,i)=>`<figure class="photo-tile ${tileCls[i%3]}" data-item data-cursor="VIEW"><img src="${esc(im[0])}" alt="" loading="lazy" decoding="async"><figcaption class="mono">${esc(im[1])}</figcaption></figure>`).join("");
buildMarquee($("#photoBand"), bandHTML, {invert:true, secPerItem:4, pauseHover:true});

/* ---------- hero: cinema video + parallax wordmark + stills ---------- */
const heroVideo = $("#heroVideo");
const STILLS = [
  ["assets/drive/still1.jpg","the lawns, fest night — from above"],
  ["assets/drive/still2.jpg","the verse, amber light"],
  ["assets/drive/still3.jpg","a canopy of lights, okhla"],
];
$("#heroStills").innerHTML = STILLS.map(s=>`<figure data-cursor="VIEW"><div class="imgwrap"><img src="${esc(s[0])}" alt="${esc(s[1])}" loading="lazy" decoding="async"></div><figcaption class="mono">${esc(s[1])}</figcaption></figure>`).join("");
/* hero: living footage + scroll choreography (hybrid).
   Shot A (canopy aerial) plays and crossfades to Shot B (stage/crowd)
   mid-hero; the camera zooms out 1.18→1.0 while the wordmark counter-
   zooms from fully-fitted at rest to monumental bleed — so TASVEER is
   always readable as a whole on load, then pushes past the edges. */
const heroVideoB = $("#heroVideoB");
let heroP = 0;
/* projector shutter: randomized vertical bars wipe Shot B in (signature) */
const SHUTTER_BARS = Array.from({length:9}, ()=>({off: Math.random()*0.45}));
const shutterOK = typeof CSS!=="undefined" && CSS.supports && CSS.supports("mask-image","linear-gradient(90deg,black,transparent)");
function shutterMask(local){
  const n=SHUTTER_BARS.length, st=[];
  for (let i=0;i<n;i++){
    const r=Math.min(1,Math.max(0,(local-SHUTTER_BARS[i].off)/0.55));
    const x0=i/n*100, x1=(i+1)/n*100, e=x0+(x1-x0)*r;
    st.push(`black ${x0.toFixed(2)}% ${e.toFixed(2)}%`, `transparent ${e.toFixed(2)}% ${x1.toFixed(2)}%`);
  }
  return `linear-gradient(90deg,${st.join(",")})`;
}
function heroChoreo(p){
  const s = (1.18 - 0.18 * p).toFixed(4);
  const t = `translateY(${(-3 * p).toFixed(2)}vh) scale(${s})`;
  if (heroVideo) heroVideo.style.transform = t;
  if (heroVideoB){
    heroVideoB.style.transform = t;
    if (touchDevice){ heroVideoB.style.opacity = 0; }
    else {
      if (p > 0.25 && heroVideoB.paused && motionOn && !reduced) heroVideoB.play().catch(()=>{});
      const local = Math.min(1, Math.max(0, (p - 0.38) / 0.30));
      if (shutterOK){ /* callers gate motionOn && !reduced; calm/reduced hold static Shot A via heroVideoState */
        heroVideoB.style.opacity = local > 0 ? "1" : "0";
        const m = shutterMask(local);
        heroVideoB.style.maskImage = m; heroVideoB.style.webkitMaskImage = m;
      } else {
        heroVideoB.style.maskImage = ""; heroVideoB.style.webkitMaskImage = "";
        heroVideoB.style.opacity = (local*local*(3-2*local)).toFixed(3);
      }
    }
  }
}
function heroVideoState(){
  const play = motionOn && !reduced;
  if (heroVideo) play ? heroVideo.play().catch(()=>{}) : heroVideo.pause();
  if (heroVideoB) (play && !touchDevice && heroP > 0.25) ? heroVideoB.play().catch(()=>{}) : heroVideoB.pause();   // Shot B (13MB) only starts loading when the blend is near
  if (!play){
    if (heroVideo) heroVideo.style.transform = "scale(1)";
    if (heroVideoB){ heroVideoB.style.transform = "scale(1)"; heroVideoB.style.opacity = 0; heroVideoB.style.maskImage = ""; heroVideoB.style.webkitMaskImage = ""; }
  } else heroChoreo(heroP);
  syncInterlude();
}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(()=>{ if (motionOn && !reduced) heroChoreo(heroP); else heroVideoState(); });
addEventListener("resize", ()=>{ if (motionOn && !reduced) heroChoreo(heroP); else heroVideoState(); }, {passive:true});
/* interlude: living footage, plays on screen, scroll zoom-out */
const interludeVideo = $("#interludeVideo");
let interludeVisible = false, interludeP = 0;
function syncInterlude(){
  if (!interludeVideo) return;
  if (reduced || !motionOn || !interludeVisible) interludeVideo.pause();
  else interludeVideo.play().catch(()=>{});
}
if (interludeVideo && "IntersectionObserver" in window){
  new IntersectionObserver(es=>{
    interludeVisible = es[0].isIntersecting;
    syncInterlude();
  }, {threshold:.15}).observe($(".interlude"));
}
if (hasGsap && !reduced){
  ScrollTrigger.create({
    trigger:".hero", start:()=>`top+=${$("#heroBody") ? $("#heroBody").offsetTop : 0} top`, end:"bottom bottom", scrub:true, invalidateOnRefresh:true,
    onUpdate:self=>{ heroP = self.progress; if (motionOn) heroChoreo(self.progress); }
  });
  ScrollTrigger.create({
    trigger:".interlude", start:"top top", end:"bottom bottom", scrub:true,
    onUpdate:self=>{
      interludeP = self.progress;
      if (motionOn && interludeVideo) interludeVideo.style.transform = `scale(${(1.15 - 0.15 * self.progress).toFixed(4)})`;
    }
  });
  $$(".hero-stills figure").forEach((f,i)=>{
    gsap.fromTo(f, {y:70+i*36}, {y:-36-i*18, ease:"none",
      scrollTrigger:{trigger:".hero-stills", start:"top bottom", end:"bottom top", scrub:true}});
  });
}

/* ---------- reveals: visible by default, animate on enter ---------- */
function revealOnEnter(trigger, targets, fromVars, toVars){
  if (!hasGsap || reduced) return;
  const els = typeof targets === "string" ? $$(targets) : targets;
  if (!els.length) return;
  ScrollTrigger.create({
    trigger, start:"top 82%", once:true,
    onEnter: ()=>gsap.fromTo(els, fromVars, {...toVars, overwrite:"auto", onComplete:()=>gsap.set(els,{clearProps:"transform"})}),
    onRefresh: self=>{ if (self.progress > 0) gsap.set(els, {clearProps:"transform,opacity"}); }
  });
}
/* the headline rises when the hero proper arrives (the emblem comes first now) */
if (hasGsap && !reduced){
  const heroSpans = $$(".hero-title .mask > span");
  gsap.set(heroSpans, {yPercent:105});
  ScrollTrigger.create({ trigger:".hero-head", start:"top 88%", once:true,
    onEnter:()=>gsap.to(heroSpans, {yPercent:0, duration:1.1, stagger:.12, ease:"power4.out"}) });
}
revealOnEnter(".story", ".story-left > *, .story-right > *", {opacity:0, y:50}, {opacity:1, y:0, duration:.9, stagger:.1, ease:"power3.out"});
revealOnEnter(".roll-head", ".roll-head > *", {opacity:0, y:40}, {opacity:1, y:0, duration:.8, stagger:.1, ease:"power3.out"});
revealOnEnter(".open-call", ".open-call > *:not(.iso)", {opacity:0, y:50}, {opacity:1, y:0, duration:.9, stagger:.1, ease:"power3.out"});
revealOnEnter(".footer-panel", ".footer-statement, .footer-grid, .footer-whisper", {opacity:0, y:50}, {opacity:1, y:0, duration:.9, stagger:.12, ease:"power3.out"});
$$(".stretch").forEach(el=>{
  if (!hasGsap || reduced) return;
  gsap.fromTo(el, {scaleX:0}, {scaleX:1, duration:1.2, ease:"power3.inOut",
    scrollTrigger:{trigger:el, start:"top 88%", once:true}});
});

/* ---------- the roll: accordion ---------- */
const rollList = $("#rollList");
ROLL.forEach((beat,i)=>{
  const sec = document.createElement("div");
  sec.className = "beat";
  const panelId = `beat-panel-${i}`;
  sec.innerHTML = `
    <button class="beat-row" aria-expanded="false" aria-controls="${panelId}" data-cursor="OPEN">
      <span class="beat-idx mono">${String(i+1).padStart(2,"0")}</span>
      <span class="beat-name">${esc(beat.name)}</span>
      <span class="beat-code">${esc(beat.code)}</span>
      <span class="beat-count">${beat.count} FRAMES</span>
      <span class="beat-plus" aria-hidden="true">+</span>
    </button>
    <div class="beat-panel" id="${panelId}" role="region" aria-label="${esc(beat.name)} frames" aria-hidden="true">
      <div class="beat-panel-inner">
        <p class="beat-note">${esc(beat.note)}</p>
        <div class="beat-frames">
          ${beat.frames.map(f=>`<figure class="beat-frame" data-cursor="VIEW"><div class="imgwrap"><img src="${esc(f[0])}" alt="" loading="lazy" decoding="async"></div><figcaption class="mono">${esc(f[1])}</figcaption></figure>`).join("")}
        </div>
      </div>
    </div>`;
  const row = $(".beat-row", sec);
  row.addEventListener("click", ()=>{
    const open = sec.classList.toggle("open");
    row.setAttribute("aria-expanded", String(open));
    $(".beat-panel", sec).setAttribute("aria-hidden", String(!open));
    if (open && hasGsap && !reduced){
      gsap.fromTo($$(".beat-frame", sec), {opacity:0, y:24}, {opacity:1, y:0, duration:.6, stagger:.07, ease:"power3.out", delay:.15});
    }
    setTimeout(safeRefresh, 550);
  });
  rollList.appendChild(sec);
});
revealOnEnter(".roll", ".beat", {opacity:0, y:30}, {opacity:1, y:0, duration:.7, stagger:.08, ease:"power3.out"});


/* ---------- the lineup: "the casting" — pinned deck, one take per person ---------- */
(function lineup(){
  const L = D.LINEUP, runway = $("#luRunway"), stage = $("#luStage"), deck = $("#luDeck");
  if (!L || !runway || !deck) return;
  const N = L.cards.length, p2 = n => String(n).padStart(2,"0");
  const clamp = (v,a,b) => Math.min(b, Math.max(a, v));
  const items = L.cards.map(([name,role,accent,file],i)=>({ name, role, accent,
    thumb:L.dir+"pt-"+p2(file||i+1)+".webp", full:L.dir+"p-"+p2(file||i+1)+".webp", alt:`Tasveer poster: ${name}, ${role}` }));
  const hexRgb = h => [1,3,5].map(k=>parseInt(h.slice(k,k+2),16));
  const rgbs = items.map(it=>hexRgb(it.accent));
  runway.style.setProperty("--lu-n", N);
  const $roles = $("#luRoles"), $names = $("#luNames"), $rail = $("#luRail"), $num = $("#luNum"),
        $live = $("#luLive"), $hint = $("#luHint"), $open = $("#luOpen");
  const staticMode = !hasGsap || reduced;
  if (staticMode) document.documentElement.classList.add("lu-static");
  const viewerItems = ()=>items.map(x=>({src:x.full, cap:`${x.name} · ${x.role}`, alt:x.alt}));

  const cards = items.map((it,i)=>{
    const el = document.createElement("div"); el.className = "lu-card"; el.dataset.i = i; el.setAttribute("data-cursor","VIEW");
    el.setAttribute("role","button"); el.tabIndex = -1; el.setAttribute("aria-hidden","true");
    el.setAttribute("aria-label", `${it.name}, ${it.role}. Open poster full size.`);
    const im = new Image(); im.alt = it.alt; im.decoding = "async"; im.draggable = false; el.appendChild(im);
    if (staticMode){ im.src = it.thumb; im.loading = "lazy"; }
    deck.appendChild(el);
    el.addEventListener("click", ()=>{ if (staticMode || el.classList.contains("front")) lbOpen(viewerItems(), i, el); });
    el.addEventListener("keydown", e=>{ if ((e.key==="Enter"||e.key===" ") && (staticMode || el.classList.contains("front"))){ e.preventDefault(); lbOpen(viewerItems(), i, el); } });
    return { el, im, it, loaded:staticMode, on:false };
  });
  if (staticMode){ cards.forEach(c=>{ c.el.classList.add("on"); c.el.removeAttribute("aria-hidden"); c.el.tabIndex = 0; }); return; }

  items.forEach((it,i)=>{
    const r = document.createElement("span"); r.className = "lu-role" + (it.role.length > 16 ? " long" : ""); r.innerHTML = esc(it.role.replace("-"," ")).replace(/ (Lead)$/,"<br>$1"); $roles.appendChild(r);
    const n = document.createElement("span"); n.className = "lu-name"; n.textContent = it.name; $names.appendChild(n);
    const li = document.createElement("li"), b = document.createElement("button");
    b.type = "button"; b.className = "lu-f"; b.setAttribute("aria-label", `${it.name}, ${it.role}`);
    const im = new Image(); im.alt = ""; im.loading = "lazy"; im.decoding = "async"; im.src = it.thumb; b.appendChild(im);
    b.addEventListener("click", ()=>jump(i)); li.appendChild(b); $rail.appendChild(li);
  });
  const roleEls = $$(".lu-role", $roles), nameEls = $$(".lu-name", $names), frames = $$(".lu-f", $rail);
  const HOLD_START = .3, HOLD_END = .6;
  let pos = 0, target = 0, raf = 0, cur = -1, W = 400, H = 500, armed = false;

  function load(i){ const c = cards[(i+N)%N]; if (!c.loaded && armed){ c.loaded = true; c.im.src = c.it.full; } }
  function setCur(i){
    if (i === cur) return;
    const prev = cur; cur = i;
    roleEls.forEach((e,k)=>{ e.classList.toggle("on", k===i); e.classList.toggle("out", k===prev && k!==i && i>prev); if (k!==i && k!==prev) e.classList.remove("out"); });
    nameEls.forEach((e,k)=>e.classList.toggle("on", k===i));
    frames.forEach((e,k)=>e.classList.toggle("cur", k===i));
    $num.textContent = p2(i+1);
    $live.textContent = `${items[i].name}, ${items[i].role}. ${i+1} of ${N}.`;
    $open.setAttribute("aria-label", `Open poster: ${items[i].name}`);
    for (let k=-1;k<=4;k++) if (i+k>=0 && i+k<N) load(i+k);
  }
  function render(){
    const near = clamp(Math.round(pos), 0, N-1);
    for (let i=0;i<N;i++){
      const c = cards[i], d = i - pos, ad = Math.abs(d);
      if (d < -1.25 || d > 4.2){ if (c.on){ c.on = false; c.el.classList.remove("on"); } continue; }
      if (!c.on){ c.on = true; c.el.classList.add("on"); }
      let x=0,y=0,rot=0,sc=1,op=1,g=0,br=1,z;
      if (d >= 0){                                   // waiting in the deck
        const t = Math.min(d,4);
        sc = 1 - t*.045; y = t*H*.03; rot = ((i%3)-1)*2.2*Math.min(d,1);
        g = Math.min(d,1)*.9; br = 1 - Math.min(d,3)*.18; z = 100 - Math.round(d*10);
        if (d > 3.2) op = clamp(4.2-d,0,1);
      } else {                                       // flicked off the top
        const t = -d, dir = (i%2 ? 1 : -1);
        x = dir * Math.pow(t,.9) * (W*1.1 + 30); y = -t*H*.06; rot = dir*t*17; sc = 1 + t*.03;
        op = 1 - clamp((t-.25)/.6,0,1); z = 200;
      }
      c.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      c.el.style.opacity = op.toFixed(2); c.el.style.zIndex = z;
      c.el.style.setProperty("--g", g.toFixed(2)); c.el.style.setProperty("--b", br.toFixed(2));
      const isFront = i === near && Math.abs(d) < .5;
      if (isFront !== c.el.classList.contains("front")){
        c.el.classList.toggle("front", isFront); c.el.tabIndex = isFront ? 0 : -1;
        c.el.setAttribute("aria-hidden", String(!isFront));
      }
    }
    /* accent flood: blend the two nearest takes */
    const f = clamp(pos,0,N-1), i0 = Math.floor(f), i1 = Math.min(N-1,i0+1), t = f - i0;
    const rgb = rgbs[i0].map((v,k)=>Math.round(v + (rgbs[i1][k]-v)*t));
    stage.style.setProperty("--accent", `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`);
    setCur(near);
  }
  function tick(){
    const diff = target - pos;
    if (Math.abs(diff) < .0015){ pos = target; raf = 0; render(); return; }
    pos += diff*.14; render(); raf = requestAnimationFrame(tick);
  }
  function setTarget(v){ target = v; if (!raf) raf = requestAnimationFrame(tick); }
  function measure(){ W = deck.clientWidth || 400; H = deck.clientHeight || 500; render(); }
  function span(){ return runway.offsetHeight - innerHeight; }
  function jump(i){
    const y = runway.getBoundingClientRect().top + scrollY + span()*((i + HOLD_START)/(N-1+HOLD_START+HOLD_END));
    if (typeof lenis !== "undefined" && lenis) lenis.scrollTo(y, {duration:1.3}); else scrollTo({top:y, behavior:"smooth"});
  }
  ScrollTrigger.create({
    trigger:runway, start:"top top", end:"bottom bottom",
    onUpdate:self=>{
      setTarget(clamp(self.progress*(N-1+HOLD_START+HOLD_END) - HOLD_START, 0, N-1));
      if (self.progress > .015) $hint.classList.add("gone");
    },
    onRefresh:self=>{ target = pos = clamp(self.progress*(N-1+HOLD_START+HOLD_END) - HOLD_START, 0, N-1); measure(); }
  });
  $open.addEventListener("click", ()=>lbOpen(viewerItems(), clamp(Math.round(pos),0,N-1), $open));
  if ("IntersectionObserver" in window){
    new IntersectionObserver((es,ob)=>{ if (es.some(e=>e.isIntersecting)){ armed = true; ob.disconnect(); for (let k=0;k<=4;k++) load(k); load(cur); } },
      {rootMargin:"900px 0px"}).observe(runway);
  } else { armed = true; }
  addEventListener("resize", measure, {passive:true});
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  setCur(0); measure();
  revealOnEnter("#lineup", ".lineup-head > *", {opacity:0, y:36}, {opacity:1, y:0, duration:.8, stagger:.1, ease:"power3.out"});
})();

/* ---------- one frame: full-bleed cover, scroll-scrubbed zoom + colour-in ---------- */
(function oneFrame(){
  const sec = $("#one-frame"); if (!sec) return;
  const img = $(".of-bg img", sec), openBtn = $(".of-open", sec), stage = $(".of-stage", sec);
  const open = ()=>lbOpen([{src:"assets/drive/crew-group-2000.webp", cap:"HUMAYUN'S TOMB · BLUE HOUR", alt:img.alt}], 0, openBtn);
  openBtn.addEventListener("click", open);
  stage.addEventListener("click", e=>{ if (!e.target.closest(".of-open")) open(); });
  stage.setAttribute("data-cursor","VIEW");
  if (!hasGsap || reduced){ sec.style.setProperty("--p", reduced ? "1" : ".7"); return; }
  ScrollTrigger.create({
    trigger:sec, start:"top top", end:"bottom bottom", scrub:true,
    onUpdate:self=>sec.style.setProperty("--p", self.progress.toFixed(4)),
    onRefresh:self=>sec.style.setProperty("--p", self.progress.toFixed(4))
  });
  /* the lines slide up out of their masks like the cover page */
  const spans = $$(".of-lines .mask > span", sec);
  gsap.set(spans, {yPercent:105});
  ScrollTrigger.create({trigger:sec, start:"top 55%", once:true,
    onEnter:()=>gsap.to(spans, {yPercent:0, duration:1.1, stagger:.12, ease:"power4.out"}),
    onRefresh:self=>{ if (self.progress>0) gsap.set(spans,{yPercent:0}); }});
  gsap.from([".of-kicker",".of-open",".of-cap"].map(q=>$(q,sec)), {opacity:0, y:24, duration:.9, stagger:.1, ease:"power3.out",
    scrollTrigger:{trigger:sec, start:"top 55%", once:true}});
})();

/* ---------- subscribe: honest mailto compose (no fake backend) ---------- */
$("#subscribeForm").addEventListener("submit", e=>{
  e.preventDefault();
  const email = $("#subscribeEmail").value.trim();
  const subject = encodeURIComponent("Subscribe me to The Roll");
  const body = encodeURIComponent(`Hi Tasveer — add me to The Roll.\n\nMy email: ${email || "(write yours here)"}\n`);
  location.href = `mailto:${CONFIG.email}?subject=${subject}&body=${body}`;
  toast("OPENING YOUR MAIL APP — HIT SEND AND YOU'RE ON THE ROLL.");
});

/* ---------- daylight egg: the blue pill ---------- */
let pillClicks = 0, pillTimer = null;
$("#progressPill").addEventListener("click", ()=>{
  pillClicks++;
  clearTimeout(pillTimer); pillTimer = setTimeout(()=>pillClicks=0, 1400);
  if (pillClicks >= 3){
    pillClicks = 0;
    const day = document.body.classList.toggle("daylight");
    toast(day ? "DAYLIGHT MODE — THE DARKROOM WAS NEVER THE ONLY ROOM." : "LIGHTS DOWN. BACK TO THE GRAIN.");
  } else if (pillClicks === 1){
    toast("THE BLUE PILL KEEPS A SECRET — THREE CLICKS.", 2600);
  }
});

/* ---------- motion toggle ---------- */
function applyMotion(){
  document.body.classList.toggle("calm", !motionOn);
  $$("[data-motion-toggle]").forEach(b=>{
    b.setAttribute("aria-pressed", String(motionOn));
    b.textContent = motionOn ? "MOTION ◉" : "MOTION ○";
  });
  heroVideoState();
}
$$("[data-motion-toggle]").forEach(b=>b.addEventListener("click", ()=>{
  motionOn = !motionOn;
  localStorage.setItem("tasveer_drive_motion", motionOn ? "on" : "off");
  applyMotion();
  toast(motionOn ? "MOTION ON." : "MOTION PAUSED — THE FRAMES STAY.");
}));
applyMotion();

/* ---------- cursor follower (fine pointer only) ---------- */
if (matchMedia("(pointer: fine)").matches && !reduced && hasGsap){
  const cur = $("#cursor"), label = $(".cursor-label", cur);
  $("#progressPill")?.setAttribute("data-easteregg","SECRET");
  let mx=innerWidth/2, my=innerHeight/2, cx=mx, cy=my;
  addEventListener("mousemove", e=>{
    mx=e.clientX; my=e.clientY; cur.classList.add("on");
    label.classList.toggle("flip-x", mx > innerWidth-180);
    label.classList.toggle("flip-y", my > innerHeight-70);
  });
  document.addEventListener("mouseleave", ()=>cur.classList.remove("on"));
  gsap.ticker.add(()=>{
    cx += (mx-cx)*.22; cy += (my-cy)*.22;
    cur.style.transform = `translate3d(${cx}px,${cy}px,0)`;
    cur.style.opacity = cx > innerWidth-90 ? 0 : "";
  });
  document.addEventListener("mouseover", e=>{
    const t = e.target.closest("[data-cursor],a,button");
    if (t){ label.textContent = (t.dataset.easteregg && e.clientX > innerWidth/2) ? t.dataset.easteregg : (t.dataset.cursor || "GO"); label.style.display="block"; }
    else label.style.display="none";
    cur.classList.toggle("view", !!t && t.dataset.cursor==="VIEW");
  });
}

/* ---------- polish: velocity marquees, intro, roll peek, magnetic pills ---------- */
/* marquees speed up with scroll velocity, decay back (Drive signature) */
if (hasGsap && !reduced){
  const tracks = $$(".marquee-track");
  const bandTiles = $$("#photoBand .photo-tile");
  let vel = 0, lastY = window.scrollY;
  gsap.ticker.add(()=>{
    const y = window.scrollY, dv = y - lastY; lastY = y;
    vel += (dv - vel) * 0.12;
    const rate = motionOn ? Math.min(4, 1 + Math.abs(vel) * 0.06) : 1;
    tracks.forEach(tr=>{
      const an = tr.getAnimations ? tr.getAnimations()[0] : null;
      if (an && an.playbackRate !== rate) an.playbackRate = rate;
    });
    /* photo band leans into scroll velocity, settles upright (tactile) */
    const skew = motionOn ? Math.max(-5, Math.min(5, vel * 0.1)) : 0;
    const st = `skewX(${(-skew).toFixed(2)}deg)`;
    bandTiles.forEach(t=>{ if (t.style.transform !== st) t.style.transform = st; });
  });
}
/* intro: film-leader preloader — frame counter, then aperture iris wipe */
const curtain = $("#introCurtain");
if (curtain){
  let killed = false;
  const kill = ()=>{ if (killed) return; killed = true; try{ sessionStorage.setItem("tasveer_leader_shown","1"); }catch(_){} document.body.style.overflow = ""; if (curtain.parentNode) curtain.remove(); window.__tasveerReady = true; document.dispatchEvent(new Event("tasveer:ready")); if (!reduced && motionOn) decodeText($(".hero-kicker")); };
  if (reduced || !motionOn || !hasGsap) kill();
  else {
    document.body.style.overflow = "hidden";
    const num = $("#leaderNum"), fill = $("#leaderFill"), leader = $(".leader", curtain);
    let seen = false; try{ seen = sessionStorage.getItem("tasveer_leader_shown")==="1"; }catch(_){}
    curtain.style.clipPath = "circle(141% at 50% 50%)";
    if (seen){
      leader.style.display = "none";
      gsap.to(curtain, {clipPath:"circle(0% at 50% 50%)", duration:.4, ease:"power3.inOut", onComplete:kill});
    } else {
      const state = {n:0};
      const tl = gsap.timeline({onComplete:kill});
      tl.to(state, {n:100, duration:1.05, ease:"power2.inOut", onUpdate:()=>{
          const v = Math.round(state.n);
          if (num) num.textContent = String(v).padStart(3,"0");
          if (fill) fill.style.transform = `scaleX(${(state.n/100).toFixed(3)})`;
        }})
        .to(leader, {opacity:0, y:-12, duration:.3, ease:"power2.in"}, ">-0.05")
        .to(curtain, {clipPath:"circle(0% at 50% 50%)", duration:.65, ease:"power3.inOut"}, ">-0.12");
    }
    const skip = ()=>kill();
    document.addEventListener("pointerdown", skip, {once:true});
    document.addEventListener("keydown", skip, {once:true});
    setTimeout(kill, 3600);
  }
}
/* roll peek: first frame of each beat floats beside the cursor on hover */
const peek = $("#rollPeek");
if (peek && matchMedia("(pointer: fine)").matches && !reduced){
  const pimg = $("img", peek);
  const ghosts = [["g1",.10],["g2",.07]].map(([cls,f])=>{
    const el = document.createElement("div"); el.className = "roll-peek ghost "+cls; el.setAttribute("aria-hidden","true");
    el.innerHTML = '<img alt="">'; document.body.appendChild(el);
    return {el, img:el.querySelector("img"), x:innerWidth/2, y:innerHeight/2, f};
  });
  ROLL.forEach(b=>{ const im = new Image(); im.src = b.frames[0][0]; });
  let px = innerWidth/2, py = innerHeight/2, tx = px, ty = py;
  $$(".beat-row").forEach((row,i)=>{
    row.addEventListener("mouseenter", ()=>{ const src=ROLL[i].frames[0][0]; pimg.src=src; peek.classList.add("on"); ghosts.forEach(g=>{ g.img.src=src; g.el.classList.add("on"); }); });
    row.addEventListener("mouseleave", ()=>{ peek.classList.remove("on"); ghosts.forEach(g=>g.el.classList.remove("on")); });
  });
  addEventListener("mousemove", e=>{
    tx = Math.min(e.clientX + 150, innerWidth - 170);
    ty = Math.max(120, Math.min(e.clientY - 30, innerHeight - 120));
  }, {passive:true});
  if (hasGsap) gsap.ticker.add(()=>{
    px += (tx - px) * .14; py += (ty - py) * .14;
    peek.style.transform = `translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,0) translate(-50%,-50%)`;
    ghosts.forEach(g=>{
      g.x += (tx - g.x) * g.f; g.y += (ty - g.y) * g.f;
      g.el.style.transform = `translate3d(${g.x.toFixed(1)}px,${g.y.toFixed(1)}px,0) translate(-50%,-50%)`;
    });
  });
}
/* magnetic pills: subtle pull toward the cursor */
if (matchMedia("(pointer: fine)").matches && !reduced){
  $$(".pill").forEach(p=>{
    p.addEventListener("mousemove", e=>{
      const r = p.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width/2)) * 0.18;
      const dy = (e.clientY - (r.top + r.height/2)) * 0.3;
      p.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
    });
    p.addEventListener("mouseleave", ()=>{ p.style.translate = ""; });
  });
}
/* text-roll fill: wrap pill labels so the twin rolls up under a rising fill */
$$(".pill").forEach(p=>{
  if (p.querySelector(".pill-clip")) return;
  p.innerHTML = `<span class="pill-clip"><span class="pill-roll">${p.innerHTML}</span></span>`;
});

/* ---------- the contact sheet: pull-the-film horizontal strip ----------
   Film spacers let every frame sit centered in the gate; mouse drag carries
   momentum and settles with a snap + lock flash; touch rides native scroll. */
const SHEET = [
  ["photo017.webp","headliner, green light"],["photo007.webp","split light, front rail"],
  ["photo077.webp","the diya, held breath"],["photo045.webp","the full house"],
  ["photo075.webp","mid-flip, red backdrop"],["photo053.webp","the talk, esya"],
  ["photo005.webp","peak action"],["photo089.webp","chiaroscuro"],
  ["photo062.webp","the pool final"],["photo081.webp","the send-off"],
  ["photo026.webp","battle of bands"],["photo086.webp","yellow, studio"],
];
const sheetTrack = $("#sheetTrack");
let sheetSuppressUntil = 0;
if (sheetTrack){
  sheetTrack.innerHTML = SHEET.map((f,i)=>`<figure class="sheet-frame" data-cursor="VIEW"><div class="imgwrap"><img src="${esc(A+f[0])}" alt="${esc(f[1])}" loading="lazy" decoding="async" draggable="false"></div><figcaption class="mono"><span>FR ${String(i+1).padStart(2,"0")}</span><span>${esc(f[1])}</span></figcaption></figure>`).join("");
  const vp = $("#sheetViewport"), gc = $("#gateCount"), gate = $(".sheet-gate"), live = $("#sheetLive");
  const frames = $$(".sheet-frame", sheetTrack);
  let lastBest = -1, lastFlashed = -1, flashT = null;
  const nearest = ()=>{
    const center = vp.scrollLeft + vp.clientWidth/2;
    let best=0, bd=Infinity;
    frames.forEach((f,i)=>{ const c=f.offsetLeft+f.offsetWidth/2, d=Math.abs(c-center); if(d<bd){bd=d;best=i;} });
    return best;
  };
  const upd = (flash)=>{
    const best = nearest();
    if (gc) gc.textContent = `FR ${String(best+1).padStart(2,"0")} / ${String(frames.length).padStart(2,"0")}`;
    lastBest = best;
    if (flash && best !== lastFlashed){
      lastFlashed = best;
      if (live) live.textContent = `Frame ${best+1} of ${frames.length}`;
      if (!reduced && gate){
        gate.classList.remove("lock"); void gate.offsetWidth; gate.classList.add("lock");
        if (gc){ gc.classList.remove("tick"); void gc.offsetWidth; gc.classList.add("tick"); }
      }
    }
  };
  const snapNearest = (smooth)=>{
    const f = frames[nearest()];
    vp.scrollTo({left: f.offsetLeft + f.offsetWidth/2 - vp.clientWidth/2, behavior: (smooth && !reduced && motionOn) ? "smooth" : "auto"});
  };
  /* leading/trailing film spacers: any frame can reach the gate */
  const layoutSheet = (keepIdx)=>{
    const fw = frames[0].offsetWidth;
    const marginPx = parseFloat(getComputedStyle($(".sheet-head")).paddingLeft) || 0;
    const pad = Math.max(marginPx, vp.clientWidth/2 - fw/2);
    sheetTrack.style.paddingLeft = pad+"px"; sheetTrack.style.paddingRight = pad+"px";
    if (keepIdx >= 0){ const f = frames[keepIdx]; vp.scrollLeft = f.offsetLeft + f.offsetWidth/2 - vp.clientWidth/2; }
    else vp.scrollLeft = 0;
    upd(false);
  };
  layoutSheet(-1);
  let rzT = null;
  addEventListener("resize", ()=>{ clearTimeout(rzT); rzT = setTimeout(()=>layoutSheet(lastBest), 150); }, {passive:true});
  vp.addEventListener("scroll", ()=>{ upd(false); clearTimeout(flashT); flashT = setTimeout(()=>upd(true), 140); }, {passive:true});
  /* mouse drag with momentum — capture only once a real drag begins,
     so a plain click still targets its figure (lightbox) */
  let down=false, sx=0, sl=0, lastX=0, lastT=0, vx=0, moved=0, momRaf=null, captured=false, pid=null;
  const stopMom = ()=>{ if (momRaf){ cancelAnimationFrame(momRaf); momRaf=null; } };
  const momentum = ()=>{
    let last = performance.now();
    const step = (now)=>{
      const dt = Math.min(48, now-last); last = now;
      vp.scrollLeft -= vx*dt;
      vx *= Math.pow(0.94, dt/16.7);
      if (vp.scrollLeft<=0 || vp.scrollLeft>=vp.scrollWidth-vp.clientWidth) vx=0;
      if (Math.abs(vx)>0.04){ momRaf=requestAnimationFrame(step); }
      else { momRaf=null; vp.classList.remove("dragging"); snapNearest(true); }
    };
    momRaf = requestAnimationFrame(step);
  };
  vp.addEventListener("pointerdown", e=>{
    if (e.pointerType!=="mouse") return;
    stopMom(); down=true; captured=false; pid=e.pointerId;
    sx=lastX=e.clientX; sl=vp.scrollLeft; lastT=performance.now(); vx=0; moved=0;
    vp.classList.add("dragging");
  });
  vp.addEventListener("pointermove", e=>{
    if (!down) return;
    const now = performance.now(), dx = e.clientX-lastX, dt = Math.max(1, now-lastT);
    vp.scrollLeft = sl-(e.clientX-sx);
    moved += Math.abs(dx);
    if (!captured && moved>6){ try{ vp.setPointerCapture(pid); }catch(_){} captured=true; }
    vx = vx*0.7 + (dx/dt)*0.3;
    lastX = e.clientX; lastT = now;
  });
  const endDrag = ()=>{
    if (!down) return;
    down=false;
    if (moved>6) sheetSuppressUntil = performance.now()+400;
    if (moved>6 && Math.abs(vx)>0.08 && !reduced && motionOn){ momentum(); }
    else { vp.classList.remove("dragging"); if (moved>6) snapNearest(true); }
  };
  vp.addEventListener("pointerup", endDrag); vp.addEventListener("pointercancel", endDrag);
  addEventListener("pointerup", ()=>{ if (down && !captured) endDrag(); });
  addEventListener("pointercancel", ()=>{ if (down && !captured) endDrag(); });
  vp.addEventListener("wheel", ()=>{ const wasMom = !!momRaf; stopMom(); if (wasMom && !down){ vp.classList.remove("dragging"); snapNearest(true); } }, {passive:true});
  vp.addEventListener("keydown", e=>{
    const beh = (reduced || !motionOn) ? "auto" : "smooth";
    if (e.key==="ArrowRight"){ vp.scrollBy({left:vp.clientWidth*0.6, behavior:beh}); e.preventDefault(); }
    if (e.key==="ArrowLeft"){ vp.scrollBy({left:-vp.clientWidth*0.6, behavior:beh}); e.preventDefault(); }
    if (e.key==="Home"){ vp.scrollTo({left:0, behavior:beh}); e.preventDefault(); }
    if (e.key==="End"){ vp.scrollTo({left:vp.scrollWidth, behavior:beh}); e.preventDefault(); }
  });
}

/* ---------- lightbox: every VIEW frame opens full-screen ---------- */
const lb = $("#lightbox"), lbImg = $("#lbImg"), lbWrap = $("#lbWrap"),
      lbCount = $("#lbCount"), lbText = $("#lbText"), lbHint = $("#lbHint"),
      lbClose = $("#lbClose"), lbPrev = $("#lbPrev"), lbNext = $("#lbNext");
let lbItems = [], lbCur = 0, lbOpener = null, lbSwT = null, lbFocusT = null;
if (lb) lb.inert = true;
const pad2 = n => String(n).padStart(2,"0");
function lbGroupFor(fig){
  if (fig.closest("#photoBand")){
    const src = $("img",fig).getAttribute("src");
    const items = bandImgs.map(b=>({src:b[2]||b[0], cap:b[1], alt:b[1]}));
    return {items, idx: Math.max(0, bandImgs.findIndex(b=>b[0]===src))};
  }
  if (fig.closest(".sheet-track")){
    const figs = $$(".sheet-frame", sheetTrack);
    return {items: SHEET.map(s=>({src:A+s[0], cap:s[1], alt:s[1]})), idx: figs.indexOf(fig)};
  }
  if (fig.closest(".hero-stills")){
    const figs = $$(".hero-stills figure");
    return {items: STILLS.map(s=>({src:s[0], cap:s[1], alt:s[1]})), idx: figs.indexOf(fig)};
  }
  const cont = fig.closest(".beat-frames, .collage");
  if (cont){
    const figs = $$("figure", cont);
    const items = figs.map(f=>{ const im=$("img",f), c=$("figcaption",f);
      return {src: im.getAttribute("src"), cap: c ? c.textContent.trim() : (im.alt||""), alt: im.alt||""}; });
    return {items, idx: figs.indexOf(fig)};
  }
  return null;
}
function lbPreload(i){
  [ (i+1)%lbItems.length, (i-1+lbItems.length)%lbItems.length ].forEach(j=>{
    const im = new Image(); im.src = lbItems[j].src;
  });
}
function lbShow(i, instant){
  lbCur = i;
  const it = lbItems[i];
  const apply = ()=>{
    lbImg.src = it.src; lbImg.alt = it.alt || it.cap;
    lbText.textContent = it.cap;
    lbCount.textContent = `FR ${pad2(i+1)} / ${pad2(lbItems.length)}`;
    lbPreload(i);
  };
  if (instant || reduced || !motionOn){ clearTimeout(lbSwT); lbWrap.classList.remove("switching"); apply(); return; }
  lbWrap.classList.add("switching");
  clearTimeout(lbSwT);
  lbSwT = setTimeout(()=>{ apply(); lbWrap.classList.remove("switching"); }, 170);
}
function lbOpen(items, idx, opener){
  if (!items.length || idx<0) return;
  lbItems = items; lbOpener = opener;
  lbShow(idx, true);
  lb.inert = false;
  lb.classList.add("open"); lb.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden"; if (lenis) lenis.stop();
  lbHint.textContent = matchMedia("(pointer: coarse)").matches
    ? "SWIPE TO ADVANCE · TAP OUTSIDE TO CLOSE"
    : "← → TO ADVANCE · ESC TO CLOSE";
  clearTimeout(lbFocusT); lbFocusT = setTimeout(()=>lbClose.focus(), 60);
}
function lbCloseFn(){
  lb.classList.remove("open");
  document.body.style.overflow = ""; if (lenis) lenis.start();
  clearTimeout(lbSwT); clearTimeout(lbFocusT); lbWrap.classList.remove("switching");
  if (lbOpener) lbOpener.focus({preventScroll:true});
  if (wheelSync && lbOpener && lbOpener.id === "wheelStage") wheelSync(lbCur);
  lb.setAttribute("aria-hidden","true");
  lb.inert = true;
}
/* press feedback: bright ring + a quick zoom pulse on the frame, then the viewer opens */
function lbSnap(fig){
  if (reduced || !motionOn) return false;
  const im = $("img",fig), ring = document.createElement("i");
  ring.className = "snap-ring"; fig.appendChild(ring);
  if (im){ im.classList.remove("snap-img"); void im.offsetWidth; im.classList.add("snap-img"); }
  setTimeout(()=>{ ring.remove(); if (im) im.classList.remove("snap-img"); }, 560);
  return true;
}
function lbActivate(fig){
  if (performance.now() < sheetSuppressUntil && fig.closest(".sheet-track")) return;
  if (fig.dataset.snapping) return;
  const g = lbGroupFor(fig);
  if (!g) return;
  if (lbSnap(fig)){
    fig.dataset.snapping = "1";
    setTimeout(()=>{ delete fig.dataset.snapping; lbOpen(g.items, g.idx, fig); }, 200);
  } else lbOpen(g.items, g.idx, fig);
}
/* mark every viewable frame as a button */
$$(".hero-stills figure, .collage figure, .beat-frames figure, .sheet-frame, #photoBand .photo-tile").forEach(f=>{
  f.setAttribute("data-lb","");
  if (f.getAttribute("aria-hidden")==="true") return; /* clickable, but no tab stop / role / label */
  f.setAttribute("tabindex","0"); f.setAttribute("role","button");
  const im = $("img",f), c = $("figcaption",f);
  const cap = c ? (c.querySelector("span:last-child")||c).textContent.trim() : (im ? im.alt : "");
  f.setAttribute("aria-label", "View frame: " + cap);
});
document.addEventListener("click", e=>{
  const f = e.target.closest("[data-lb]");
  if (f) lbActivate(f);
});
lbClose.addEventListener("click", lbCloseFn);
lbPrev.addEventListener("click", ()=>lbShow((lbCur-1+lbItems.length)%lbItems.length));
lbNext.addEventListener("click", ()=>lbShow((lbCur+1)%lbItems.length));
lb.addEventListener("click", e=>{ if (e.target===lb) lbCloseFn(); });
document.addEventListener("keydown", e=>{
  if (lb.classList.contains("open")){
    if (e.key==="Escape"){ lbCloseFn(); e.preventDefault(); }
    else if (e.key==="ArrowRight"){ lbShow((lbCur+1)%lbItems.length); e.preventDefault(); }
    else if (e.key==="ArrowLeft"){ lbShow((lbCur-1+lbItems.length)%lbItems.length); e.preventDefault(); }
    else if (e.key==="Tab"){
      const f = [lbClose, lbPrev, lbNext], i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(e.shiftKey ? (i<=0 ? f.length-1 : i-1) : (i+1)%f.length)].focus();
    }
    return;
  }
  const f = e.target.closest && e.target.closest("[data-lb]");
  if (f && (e.key==="Enter" || e.key===" ")){ e.preventDefault(); lbActivate(f); }
});
/* touch swipe inside the viewer */
let lbTx=0, lbTy=0;
lb.addEventListener("pointerdown", e=>{ if (e.pointerType==="touch"){ lbTx=e.clientX; lbTy=e.clientY; } }, {passive:true});
lb.addEventListener("pointerup", e=>{
  if (e.pointerType!=="touch") return;
  const dx=e.clientX-lbTx, dy=e.clientY-lbTy;
  if (Math.abs(dx)>48 && Math.abs(dx)>Math.abs(dy)) lbShow(dx<0 ? (lbCur+1)%lbItems.length : (lbCur-1+lbItems.length)%lbItems.length);
}, {passive:true});

/* ---------- micro-finish: kicker decode, interlude line reveal ---------- */
function decodeText(el, dur=1000){
  if (!el) return;
  const orig = el.textContent, glyphs = "▓▒░·—/\\|0123456789ABCDEF";
  const start = performance.now();
  const tick = (now)=>{
    const p = Math.min(1, (now-start)/dur);
    const lock = Math.floor(p*orig.length);
    el.textContent = orig.slice(0,lock) + [...orig.slice(lock)].map(c=>c===" "?" ":glyphs[(Math.random()*glyphs.length)|0]).join("");
    if (p<1) requestAnimationFrame(tick); else el.textContent = orig;
  };
  requestAnimationFrame(tick);
}
const interludeLine = $(".interlude-line");
if (interludeLine && hasGsap && !reduced){
  const lines = interludeLine.innerHTML.split(/<br\s*\/?>/i);
  interludeLine.innerHTML = lines.map(l=>`<span class="mask"><span>${l}</span></span>`).join("");
  gsap.fromTo($$(".mask > span", interludeLine), {yPercent:105},
    {yPercent:0, duration:1.1, stagger:.14, ease:"power4.out",
     scrollTrigger:{trigger:interludeLine, start:"top 82%", once:true}});
}

/* ---------- section titles: film-gate wipe (composes with parent fade) ---------- */
$$(".section-title").forEach(el=>{
  if (!hasGsap || reduced) return;
  ScrollTrigger.create({trigger:el, start:"top 88%", once:true,
    onEnter:()=>gsap.fromTo(el, {clipPath:"inset(0 100% 0 0)"}, {clipPath:"inset(0 0% 0 0)", duration:1.1, ease:"power4.inOut"}),
    onRefresh:self=>{ if (self.progress>0) gsap.set(el, {clearProps:"clipPath"}); }});
});
/* ---------- footer statement develops like a darkroom print ---------- */
const fstate = $(".footer-statement");
if (fstate && hasGsap && !reduced){
  fstate.classList.add("undeveloped");
  ScrollTrigger.create({trigger:fstate, start:"top 82%", once:true,
    onEnter:()=>fstate.classList.remove("undeveloped"),
    onRefresh:self=>{ if (self.progress>0) fstate.classList.remove("undeveloped"); }});
}

/* ---------- the archive: coverflow wheel (circular, drag / swipe / keys / auto-spin) ---------- */
let wheelSync = null;
(function archiveWheel(){
  const W = D.WHEEL, stage = $("#wheelStage"), track = $("#wheelTrack");
  if (!W || !stage || !track) return;
  const N = W.frames.length, VIS = 7, ROT = matchMedia("(max-width:900px)").matches ? 54 : 60;
  const p3 = n => String(n).padStart(3,"0");
  const mod = (a,n) => ((a % n) + n) % n;
  const clamp = (v,a,b) => Math.min(b, Math.max(a, v));
  const frames = W.frames.map(([n,w,h,color,src])=>{
    const cap = W.sources[src] || "ARCHIVE";
    return { n, ar: clamp(w/h, .68, 1.5), color, cap,
             thumb: W.dir+"w-"+p3(n)+".webp", full: W.dir+"wf-"+p3(n)+".webp",
             alt: `${cap.toLowerCase()} — frame ${n} of ${N}` };
  });
  const probe = document.createElement("div"); probe.className = "wheel-probe"; stage.appendChild(probe);
  const cards = frames.map((f,i)=>{
    const el = document.createElement("figure"); el.className = "w-card";
    el.style.setProperty("--ar", f.ar.toFixed(3)); el.style.setProperty("--bg", f.color);
    el.dataset.i = i; el.dataset.cursor = "SPIN"; el.setAttribute("aria-hidden","true");
    const im = new Image(); im.alt = f.alt; im.decoding = "async"; im.draggable = false;
    el.appendChild(im); track.appendChild(el);
    return { el, im, f, ar:f.ar, on:false, front:false, loaded:false };
  });
  const $count = $("#wheelCount"), $cap = $("#wheelCap"), $fill = $("#wheelFill"), $live = $("#wheelLive");
  const $prev = $("#wheelPrev"), $next = $("#wheelNext"), $play = $("#wheelPlay"), $open = $("#wheelOpen");
  let H = 400, pos = 0, target = 0, raf = 0, armed = false, dragging = false, userDriven = false;
  let userPaused = false, inView = false, hovering = false, suppressUntil = 0;

  function ensure(i){
    const c = cards[mod(i,N)];
    if (!armed || c.loaded) return;
    c.loaded = true; c.im.src = c.f.thumb;
  }
  let lastActive = -1;
  function setActive(a){
    if (a === lastActive) return;
    lastActive = a;
    $count.textContent = `FR ${p3(a+1)} / ${N}`;
    $cap.textContent = frames[a].cap;
    $fill.style.width = ((a+1)/N*100).toFixed(2) + "%";
    if (userDriven) $live.textContent = `Frame ${a+1} of ${N}. ${frames[a].cap}.`;
    for (let k=-VIS-3; k<=VIS+3; k++) ensure(a+k);
  }
  function render(){
    const base = Math.floor(pos);
    const near = mod(Math.round(pos), N);
    const arA = (()=>{ const i0 = mod(base,N), i1 = mod(base+1,N), t = pos-base; return cards[i0].ar*(1-t) + cards[i1].ar*t; })();
    for (let i=0; i<N; i++){
      const c = cards[i];
      let d = mod(i - pos + N/2, N) - N/2;           // shortest signed distance on the ring
      const ad = Math.abs(d);
      if (ad > VIS){ if (c.on){ c.on = false; c.el.classList.remove("on"); } continue; }
      if (!c.on){ c.on = true; c.el.classList.add("on"); }
      const s = Math.sign(d) || 1, t = Math.min(ad,1);
      const ownW = H * c.ar;
      const S1 = H*arA/2 + H*.07 + ownW*.5*.5;        // first neighbour: just past the front card's edge
      const x = ad < 1 ? s*ad*S1 : s*(S1 + (ad-1)*H*.15);
      const z = (1-t)*40 - t*H*.95 - Math.max(ad-1,0)*H*.08;
      const rot = -s*t*ROT;
      c.el.style.transform = `translate3d(${x.toFixed(1)}px,0,${z.toFixed(1)}px) rotateY(${rot.toFixed(2)}deg)`;
      c.el.style.zIndex = String(1000 - Math.round(ad*10));
      c.el.style.opacity = ad > VIS-1 ? String(clamp(VIS-ad,0,1).toFixed(2)) : "1";
      c.el.style.setProperty("--dim", (1 - Math.min(ad,3)*.17).toFixed(2));
      const isFront = i === near;
      if (isFront !== c.front){
        c.front = isFront; c.el.classList.toggle("front", isFront);
        c.el.setAttribute("aria-hidden", String(!isFront)); c.el.dataset.cursor = isFront ? "VIEW" : "SPIN";
      }
    }
    setActive(near);
  }
  function tick(){
    const diff = target - pos;
    if (Math.abs(diff) < .002){ pos = target; raf = 0; render(); return; }
    pos += diff * (reduced ? 1 : .13); render(); raf = requestAnimationFrame(tick);
  }
  function go(t){ target = t; if (!raf) raf = requestAnimationFrame(tick); }
  function measure(){
    H = probe.offsetHeight || 400;
    const maxAr = Math.max(.6, stage.clientWidth*.8/H);   /* on phones the front card never fills the screen */
    cards.forEach(c=>{ c.ar = Math.min(c.f.ar, maxAr); c.el.style.setProperty("--ar", c.ar.toFixed(3)); });
    render();
  }

  /* drag / swipe */
  let sx = 0, spos = 0, lastX = 0, lastT = 0, vel = 0, moved = 0, pid = null;
  stage.addEventListener("pointerdown", e=>{
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragging = true; pid = e.pointerId; sx = lastX = e.clientX; spos = pos; moved = 0; vel = 0; lastT = performance.now();
    if (raf){ cancelAnimationFrame(raf); raf = 0; } target = pos;
  });
  stage.addEventListener("pointermove", e=>{
    if (!dragging || e.pointerId !== pid) return;
    const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
    if (moved > 6 && !stage.classList.contains("dragging")){
      stage.classList.add("dragging"); userDriven = true; try{ stage.setPointerCapture(pid); }catch(_){}
    }
    if (moved <= 6) return;
    pos = spos - dx/(H*.42); target = pos; render();
    const now = performance.now();
    vel = .75*vel + .25*((lastX - e.clientX)/(H*.42))/Math.max(1, now-lastT);
    lastX = e.clientX; lastT = now;
  });
  function endDrag(){
    if (!dragging) return; dragging = false; stage.classList.remove("dragging");
    if (moved > 6){ suppressUntil = performance.now() + 160; go(Math.round(pos + clamp(vel*220,-4,4))); }
  }
  stage.addEventListener("pointerup", endDrag); stage.addEventListener("pointercancel", endDrag);
  stage.addEventListener("lostpointercapture", endDrag);

  /* sideways scroll (trackpad / shift+wheel) — vertical scroll stays with the page */
  let wt = 0;
  stage.addEventListener("wheel", e=>{
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault(); e.stopPropagation(); userDriven = true;
    if (raf){ cancelAnimationFrame(raf); raf = 0; }
    pos += e.deltaX/(H*1.1); target = pos; render();
    clearTimeout(wt); wt = setTimeout(()=>go(Math.round(pos)), 140);
  }, {passive:false});

  /* click: front card opens the viewer, side cards come forward */
  function openViewer(){
    userDriven = true;
    lbOpen(frames.map(f=>({src:f.full, cap:f.cap, alt:f.alt})), mod(Math.round(pos),N), stage);
  }
  stage.addEventListener("click", e=>{
    if (performance.now() < suppressUntil) return;
    const el = e.target.closest(".w-card"); if (!el) return;
    const i = +el.dataset.i; userDriven = true;
    if (i === mod(Math.round(pos),N)) openViewer();
    else go(Math.round(pos + (mod(i - pos + N/2, N) - N/2)));
  });
  stage.addEventListener("keydown", e=>{
    if (e.key === "ArrowRight"){ e.preventDefault(); userDriven = true; go(Math.round(target)+1); }
    else if (e.key === "ArrowLeft"){ e.preventDefault(); userDriven = true; go(Math.round(target)-1); }
    else if (e.key === "Enter" || e.key === " "){ e.preventDefault(); openViewer(); }
  });
  $prev.addEventListener("click", ()=>{ userDriven = true; go(Math.round(target)-1); });
  $next.addEventListener("click", ()=>{ userDriven = true; go(Math.round(target)+1); });
  $open.addEventListener("click", openViewer);

  /* auto-spin: only while in view, motion on, and nobody is touching it */
  function setPlayUI(){
    const on = !userPaused && !reduced;
    $play.setAttribute("aria-pressed", String(on));
    $play.setAttribute("aria-label", on ? "Pause auto-spin" : "Start auto-spin");
    $play.firstElementChild.textContent = on ? "❙❙" : "▶";
  }
  if (reduced){ $play.hidden = true; }
  $play.addEventListener("click", ()=>{ userPaused = !userPaused; setPlayUI(); });
  stage.addEventListener("pointerenter", e=>{ if (e.pointerType === "mouse") hovering = true; });
  stage.addEventListener("pointerleave", ()=>{ hovering = false; });
  stage.addEventListener("focusin", ()=>{ hovering = true; });
  stage.addEventListener("focusout", ()=>{ hovering = false; });
  setInterval(()=>{
    if (reduced || !motionOn || userPaused || !inView || hovering || dragging || document.hidden) return;
    if ($("#lightbox").classList.contains("open")) return;
    userDriven = false; go(Math.round(target)+1);
  }, 3300);

  if ("IntersectionObserver" in window){
    new IntersectionObserver(es=>{
      es.forEach(e=>{ inView = e.isIntersecting; });
    }, {threshold:.35}).observe(stage);
    new IntersectionObserver((es,ob)=>{
      if (es.some(e=>e.isIntersecting)){ armed = true; ob.disconnect(); lastActive = -1; render(); }
    }, {rootMargin:"700px 0px"}).observe(stage);
  } else { armed = true; inView = true; }

  wheelSync = i => { pos = target = Math.round(pos) + (mod(i - pos + N/2, N) - N/2); render(); };
  addEventListener("resize", measure, {passive:true});
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  setPlayUI(); measure();
})();

/* ---------- scene pathfinder: highlight the current section ---------- */
const pf = $("#pathfinder");
if (pf && "IntersectionObserver" in window){
  const links = $$("a", pf);
  const setActive = id=>links.forEach(a=>a.classList.toggle("active", a.dataset.scene===id));
  const secs = ["top","story","roll","archive","crew","one-frame","open-call"].map(id=>document.getElementById(id)).filter(Boolean);
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{ if (e.isIntersecting) setActive(e.target.id === "one-frame" ? "crew" : e.target.id); });
  }, {rootMargin:"-45% 0px -45% 0px", threshold:0});
  secs.forEach(s=>io.observe(s));
  setActive("top");
}

/* ---------- misc wiring ---------- */
$$("[data-goto]").forEach(el=>el.addEventListener("click", e=>{
  e.preventDefault(); goTo(el.dataset.goto);
}));
if (CONFIG.instagram){
  const ig = $("#instaLink"); ig.href = CONFIG.instagram; ig.hidden = false; ig.target="_blank"; ig.rel="noopener";
}
$("#year").textContent = new Date().getFullYear();
/* live on-set clock — Okhla time, the society's heartbeat */
const clocks = [$("#onSetClock"), $("#onSetClock2")].filter(Boolean);
if (clocks.length){
  const fmt = new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"});
  const tickClock = ()=>{ if (document.hidden) return; const s = "ON SET "+fmt.format(new Date())+" IST"; clocks.forEach(c=>c.textContent=s); };
  tickClock(); setInterval(tickClock, 1000);
}
onScroll();

/* a note for the curious who open the console */
console.log("%c◉ TASVEER — shot & developed in the darkroom by the webdev lead.", "color:#8B87FF;font-family:monospace;font-size:12px;padding:4px 0;");
console.log("%cEvery event ends. The frame doesn't. → tasveer@sc.iiitd.ac.in", "color:#9A9A94;font-family:monospace;");