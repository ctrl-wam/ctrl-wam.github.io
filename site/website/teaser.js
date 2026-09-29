/* ==========================================================================
   Animated teaser figure for the CtrlWAM project page.
   Renders the figure-editor items (website/teaser-data.js) as live DOM/SVG — panels, labels,
   frame slots, trajectories, dashed links with ✕/✓ marks — and plays a timeline:
   recorded reference → standard noising (trajectory drifts, frames get noisy, links disagree)
   → aligned noising (trajectory drifts, renders follow, noise is added, links agree).
   API: window.Teaser = { play, pause, seek(t), duration, el }
   ========================================================================== */
(function () {
  'use strict';
  const D = window.CTRLWAM_TEASER; const host = document.getElementById('teaser'); if (!D || !host) return;
  const MEDIA = host.dataset.media || '../media/';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const div = (style, parent, cls) => { const e = document.createElement('div'); if (cls) e.className = cls; e.style.cssText = style; (parent || canvas).appendChild(e); return e; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const pop = t => { t = clamp(t, 0, 1); return t < 1 ? 1.15 - 0.15 * Math.cos(t * Math.PI) - (1 - t) * 1.15 * (1 - t) : 1; };

  /* ---------------- frame images per slot (real frames from the media set) ---------------- */
  // rows: index 0 = t3 (top) … 2 = t1 (bottom). Recorded / noised recording use the recording;
  // rendered / noised renders use frames from a different command (the perturbed action's consequences).
  const DRIVE_REC = ['egocf/real/raw/f32.jpg', 'egocf/real/raw/f22.jpg', 'egocf/real/raw/f12.jpg'];
  const DRIVE_REN = ['egocf/multi_agent_stop/raw/f32.jpg', 'egocf/multi_agent_stop/raw/f22.jpg', 'egocf/multi_agent_stop/raw/f12.jpg'];
  const ROBOT_REC = ['robotwin/ep104/gt/f0225.jpg', 'robotwin/ep104/gt/f0135.jpg', 'robotwin/ep104/gt/f0045.jpg'];
  const ROBOT_REN = ['robotwin/ep104/gtswap/f0270.jpg', 'robotwin/ep104/gtswap/f0180.jpg', 'robotwin/ep104/gtswap/f0090.jpg'];
  function frameSrc(id) {
    const m = /^(std|rec|ren|noi)(\d)-(r|d)$/.exec(id); if (!m) return null;
    const row = +m[2], robot = m[3] === 'r', rendered = m[1] === 'ren' || m[1] === 'noi';
    return MEDIA + (robot ? (rendered ? ROBOT_REN : ROBOT_REC) : (rendered ? DRIVE_REN : DRIVE_REC))[row];
  }
  const NOISY = id => /^(std|noi)\d/.test(id);

  /* ---------------- geometry (mirrors the figure editor: Catmull-Rom through pts) ---------------- */
  function curvePoints(pts) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      for (let k = (i ? 1 : 0); k <= 24; k++) { const t = k / 24, u = 1 - t; out.push([u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0], u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1]]); }
    }
    return out;
  }
  const cum = pts => { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return c; };

  /* ---------------- build ---------------- */
  host.innerHTML = '';
  const outer = div(`position:relative;width:100%;`, host); outer.className = 'teaser-outer';
  const canvas = div(`position:absolute;left:0;top:0;width:${D.w}px;height:${D.h}px;transform-origin:0 0;background:#fff;border-radius:16px;overflow:hidden;font-family:var(--font)`, outer, 'teaser-canvas');
  const perspWrap = div('position:absolute;left:8px;top:8px;width:1430px;height:394px;pointer-events:none'); perspWrap.innerHTML = D.persp; const perspSvg = perspWrap.firstElementChild; if (perspSvg) { perspSvg.style.cssText = 'position:absolute;left:0;top:0;overflow:hidden;border-radius:16px'; }
  const byId = {}; D.items.forEach(it => byId[it.id] = it);
  const anims = [];   // {el|fn, start, dur, kind}
  const panelOf = x => x < 491 ? 'std' : x < 844 ? 'rec' : 'ali';

  // timeline (seconds)
  const T = { panels: 0.0, recFrames: 0.6, recCurve: 0.9, recCap: 1.9, stdFrames: 2.5, stdCurve: 3.1, stdNoise: 3.6, stdLinks: 4.4, stdCap: 5.8, aliCurve: 6.6, renFrames: 7.3, aliLinks: 7.9, addNoise: 9.0, noiFrames: 9.6, aliCap: 10.8, end: 13.6 };
  const DUR = T.end;

  // panels first (z-order), then persp, then everything else in item order
  D.items.filter(i => i.type === 'panel').forEach(it => {
    const isCap = it.h < 60;
    const e = div(`position:absolute;left:${it.x}px;top:${it.y}px;width:${it.w}px;height:${it.h}px;background:${it.fill};border:2px solid ${it.stroke};border-radius:${typeof it.radius === 'number' ? it.radius + 'px' : it.radius};box-sizing:border-box`);
    const p = panelOf(it.x);
    anims.push({ el: e, start: isCap ? T[p + 'Cap'] : T.panels + (p === 'std' ? 0.1 : p === 'rec' ? 0 : 0.2), dur: 0.5, kind: 'fade' });
  });
  canvas.appendChild(perspWrap);
  D.items.forEach(it => {
    if (it.type === 'text') {
      const e = div(`position:absolute;left:${it.x}px;top:${it.y}px;width:${it.w}px;text-align:${it.align};font-size:${it.fs}px;font-weight:${it.fw};font-style:${it.fst};color:${it.color};line-height:1.2;white-space:nowrap;z-index:2`);
      const m = /^\$(.*)\$$/.exec(it.text);
      if (m && window.katex) katex.render(m[1], e, { throwOnError: false }); else e.textContent = it.text;
      const p = panelOf(it.x); const isCap = it.y > 350, isAdd = /Add noise/.test(it.text);
      anims.push({ el: e, start: isAdd ? T.addNoise + [0, 1, 2][Math.round((it.y - 104) / 90)] * 0.35 : isCap ? T[p + 'Cap'] : T.panels + 0.15 + (p === 'std' ? 0.1 : p === 'rec' ? 0 : 0.2), dur: 0.5, kind: 'fade' });
    }
    if (it.type === 'img') {
      const e = div(`position:absolute;left:${it.x}px;top:${it.y}px;width:${it.w}px;height:${it.h}px;z-index:1`);
      const inner = div(`position:absolute;inset:0;border:2px solid ${it.color};border-radius:8px;background:#fff;overflow:hidden;box-sizing:border-box`, e);
      const src = frameSrc(it.id); if (src) { const im = document.createElement('img'); im.src = src; im.alt = it.label; im.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block'; inner.appendChild(im); }
      const grp = it.id.slice(0, 3), row = +it.id[3];
      const start = grp === 'rec' ? T.recFrames : grp === 'std' ? T.stdFrames : grp === 'ren' ? T.renFrames : T.noiFrames;
      anims.push({ el: e, start: start + (2 - row) * 0.15, dur: 0.45, kind: 'fade' });
      if (NOISY(it.id)) { const nz = div(`position:absolute;inset:0;background:url(${MEDIA}schematic/noise.png) 0 0/96px 96px;opacity:0;pointer-events:none`, inner); anims.push({ el: nz, start: (grp === 'std' ? T.stdNoise : T.noiFrames + 0.25) + (2 - row) * 0.15, dur: 0.9, kind: 'noise' }); }
    }
    if (it.type === 'curve') {
      const pts = curvePoints(it.pts), L = cum(pts), total = L[L.length - 1];
      const head = it.sw * 2.8; let cut = pts.length - 1; while (cut > 0 && total - L[cut] < head) cut--;
      const body = pts.slice(0, cut + 1); const dEnd = pts[pts.length - 1], dPrev = pts[Math.max(0, pts.length - 4)];
      const svg = mk('svg', { width: it.w, height: it.h, viewBox: `0 0 ${it.w} ${it.h}` }); svg.style.cssText = `position:absolute;left:${it.x}px;top:${it.y}px;overflow:visible;z-index:1`; canvas.appendChild(svg);
      const path = mk('path', { d: body.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' '), fill: 'none', stroke: it.stroke, 'stroke-width': it.sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
      const len = path.getTotalLength ? path.getTotalLength() : total; path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
      const ang = Math.atan2(dEnd[1] - dPrev[1], dEnd[0] - dPrev[0]) * 180 / Math.PI;
      const headEl = mk('path', { d: `M0 0 L${-head} ${-head * 0.55} L${-head} ${head * 0.55} Z`, fill: it.stroke, transform: `translate(${dEnd[0]} ${dEnd[1]}) rotate(${ang})` }, svg);
      const dots = (it.dotYs || []).map(y => { let best = 0; for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i][1] - y) < Math.abs(pts[best][1] - y)) best = i; const p = pts[best]; const c = mk('circle', { cx: p[0], cy: p[1], r: it.dotR, fill: it.stroke, stroke: '#fff', 'stroke-width': 1.5 }, svg); c.style.transformOrigin = `${p[0]}px ${p[1]}px`; return { el: c, frac: L[best] / total, abs: [it.x + p[0], it.y + p[1]] }; });
      it._dots = dots.map(d => d.abs); // absolute dot positions for links (dot 0 = first dotY = lowest on screen = t1)
      const p = it.id === 'trajStd' ? 'std' : it.id === 'trajAli' ? 'ali' : 'rec';
      anims.push({ start: T[p + 'Curve'], dur: 1.1, kind: 'draw', fn: f => { path.style.strokeDashoffset = len * (1 - f); headEl.style.opacity = f >= 0.98 ? 1 : 0; dots.forEach(d => { const s = pop((f - d.frac) / 0.15); d.el.style.transform = `scale(${f > d.frac ? s : 0})`; }); } });
    }
    if (it.type === 'svg' && it.kind === 'arrow') {
      const svg = mk('svg', { width: it.w, height: it.h, viewBox: `0 0 ${it.w} ${it.h}` }); svg.style.cssText = `position:absolute;left:${it.x}px;top:${it.y}px;overflow:visible;z-index:1`; canvas.appendChild(svg);
      const line = mk('path', { d: it.paths[0].d, stroke: it.paths[0].stroke, 'stroke-width': it.paths[0].sw, fill: 'none', 'stroke-linecap': 'round' }, svg); const hd = mk('path', { d: it.paths[1].d, fill: it.paths[1].fill }, svg);
      const len = 52; line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
      const row = Math.round((it.y - 131) / 90);
      anims.push({ start: T.addNoise + row * 0.35, dur: 0.45, kind: 'draw', fn: f => { line.style.strokeDashoffset = len * (1 - f); hd.style.opacity = f > 0.9 ? 1 : 0; } });
    }
  });
  // links (after curves so dot positions exist)
  const linkLayer = mk('svg', { width: D.w, height: D.h, viewBox: `0 0 ${D.w} ${D.h}` }); linkLayer.style.cssText = 'position:absolute;left:0;top:0;overflow:visible;z-index:3;pointer-events:none'; canvas.appendChild(linkLayer);
  D.items.filter(i => i.type === 'link').forEach(it => {
    const cv = byId[it.from.id], img = byId[it.to.id]; if (!cv || !img || !cv._dots) return;
    const a0 = cv._dots[it.from.dot]; const mate = byId[it.to.id.replace(/-[rd]$/, m => m === '-r' ? '-d' : '-r')]; const top = Math.min(img.y, mate ? mate.y : img.y), bot = Math.max(img.y + img.h, mate ? mate.y + mate.h : img.y + img.h); const cy = (top + bot) / 2; const a = [a0[0], cy]; const toRight = img.x + img.w / 2 > a[0]; const left = Math.min(img.x, mate ? mate.x : img.x), right = Math.max(img.x + img.w, mate ? mate.x + mate.w : img.x + img.w); const b = [toRight ? left : right, cy];
    const line = mk('path', { d: `M${a[0]} ${a[1]} L${b[0]} ${b[1]}`, stroke: it.stroke, 'stroke-width': it.sw, 'stroke-dasharray': '6 5', fill: 'none' }, linkLayer);
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]); line.style.strokeDasharray = '6 5'; const clip = mk('clipPath', { id: 'lk-' + it.id }, linkLayer); const cr = mk('rect', { x: Math.min(a[0], b[0]) - 4, y: cy - 20, width: 0, height: 40 }, clip); line.setAttribute('clip-path', `url(#lk-${it.id})`);
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const g = mk('g', { transform: `translate(${mx} ${my}) scale(0)` }, linkLayer);
    mk('circle', { cx: 0, cy: 0, r: 13, fill: '#fff', stroke: it.stroke, 'stroke-width': 1.5 }, g);
    if (it.mark === 'x') mk('path', { d: 'M-6 -6 L6 6 M6 -6 L-6 6', stroke: it.stroke, 'stroke-width': 3.2, 'stroke-linecap': 'round', fill: 'none' }, g);
    else mk('path', { d: 'M-7 0.5 L-2.5 5 L7 -5', stroke: it.stroke, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, g);
    const row = 2 - it.from.dot; const start = (it.mark === 'x' ? T.stdLinks : T.aliLinks) + row * 0.35;
    const x0 = Math.min(a[0], b[0]) - 4, span = Math.abs(b[0] - a[0]) + 8, fromRight = a[0] > b[0];
    anims.push({ start, dur: 0.6, kind: 'draw', fn: f => { const w = span * clamp(f / 0.7, 0, 1); cr.setAttribute('width', w); cr.setAttribute('x', fromRight ? x0 + span - w : x0); g.setAttribute('transform', `translate(${mx} ${my}) scale(${f > 0.7 ? pop((f - 0.7) / 0.3) : 0})`); } });
  });

  /* ---------------- timeline ---------------- */
  function apply(t) {
    anims.forEach(a => {
      const f = clamp((t - a.start) / a.dur, 0, 1);
      if (a.kind === 'fade') { a.el.style.opacity = ease(f); a.el.style.transform = `translateY(${(1 - ease(f)) * 10}px)`; }
      else if (a.kind === 'noise') a.el.style.opacity = 0.55 * ease(f);
      else a.fn(ease(f));
    });
    if (bar) bar.style.width = (t / DUR * 100) + '%';
  }
  let t = 0, playing = false, last = 0, raf = 0, done = false;
  function tick(now) { if (!playing) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; if (t >= DUR) { t = DUR; apply(DUR); done = true; api.pause(); return; } apply(t); raf = requestAnimationFrame(tick); }
  const api = { duration: DUR, el: host, play() { if (playing || reduced || done) return; playing = true; last = performance.now(); raf = requestAnimationFrame(tick); btnPlay.textContent = '❚❚'; }, pause() { playing = false; cancelAnimationFrame(raf); btnPlay.textContent = '▶'; }, seek(s) { t = clamp(s, 0, DUR); apply(t); }, restart() { done = false; t = 0; apply(0); api.play(); } };
  // controls
  const ctl = div('position:absolute;right:12px;bottom:12px;display:flex;gap:6px;z-index:5', outer, 'teaser-ctl');
  const btnRe = document.createElement('button'); btnRe.textContent = '↺'; btnRe.title = 'Replay'; const btnPlay = document.createElement('button'); btnPlay.textContent = '❚❚'; btnPlay.title = 'Play / pause'; ctl.append(btnRe, btnPlay);
  btnRe.onclick = () => api.restart(); btnPlay.onclick = () => playing ? api.pause() : done ? api.restart() : api.play();
  const barWrap = div('position:absolute;left:0;right:0;bottom:0;height:4px;background:rgba(11,26,58,.08);z-index:4', outer); const bar = div('height:100%;width:0;background:var(--green)', barWrap);
  // scale to container
  function fit() { const w = outer.clientWidth || D.w; const s = w / D.w; canvas.style.transform = `scale(${s})`; outer.style.height = Math.round(D.h * s) + 'px'; }
  addEventListener('resize', fit); fit();
  apply(reduced ? DUR : 0);
  if (!reduced) { const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? api.play() : api.pause()), { threshold: 0.35 }); io.observe(host); }
  window.Teaser = api;
})();
