/* ==========================================================================
   CtrlWAM project page — behaviour
   Reveal-on-scroll, animated counters, Remotion Player embeds (autoplay in view,
   scroll-scrubbed denoising section), the scrollytelling "problem" scene, and three
   interactive explorers (warp schedule, ego counterfactuals, RoboTwin roll-outs).
   Shares media/, vendor/ and deck/charts.js with the slide deck.
   ========================================================================== */
(function () {
  'use strict';
  window.CTRLWAM_MEDIA_BASE = 'site/media/';
  const MEDIA = 'site/media/';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const D = window.CTRLWAM_DATA || {};

  /* ------------------------------------------------ KaTeX */
  function renderTex() {
    if (!window.katex) return;
    $$('.tex').forEach(el => { const src = el.dataset.tex != null ? el.dataset.tex : el.textContent.trim(); try { katex.render(src, el, { throwOnError: false, displayMode: el.classList.contains('display') }); } catch (e) { el.textContent = src; } });
  }

  /* ------------------------------------------------ nav: progress + active link + dark mode over dark sections */
  const nav = $('.nav'), prog = $('.nav .progress');
  function onScroll() {
    const h = document.documentElement, max = h.scrollHeight - innerHeight;
    prog.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    const y = h.scrollTop + 64 + 2;
    let dark = false; $$('.hero, .section.dark').forEach(s => { const r = s.getBoundingClientRect(); if (r.top <= 66 && r.bottom > 66) dark = true; });
    nav.classList.toggle('on-dark', dark);
    let cur = null; $$('section[id]').forEach(s => { if (s.offsetTop <= y) cur = s.id; });
    $$('.nav .links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
  }
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll);

  /* ------------------------------------------------ reveal on scroll */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal, .stagger, .wipe, .rows-reveal').forEach(el => io.observe(el));

  /* ------------------------------------------------ counters */
  const cio = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; cio.unobserve(e.target); animateCounter(e.target); }), { threshold: 0.5 });
  $$('[data-count]').forEach(el => cio.observe(el));
  function animateCounter(el) {
    const to = parseFloat(el.dataset.count), from = parseFloat(el.dataset.from ?? 0), dec = +(el.dataset.decimals ?? 0), dur = reduced ? 0 : 1400, t0 = performance.now();
    const tick = now => { const p = dur ? clamp((now - t0) / dur, 0, 1) : 1, k = 1 - Math.pow(1 - p, 3); el.textContent = (from + (to - from) * k).toFixed(dec); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------ hero title letters */
  $$('.hero h1 [data-letters]').forEach(el => { const txt = el.textContent; el.textContent = ''; [...txt].forEach((ch, i) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; s.style.animationDelay = (0.15 + i * 0.06) + 's'; el.appendChild(s); }); });

  /* ------------------------------------------------ Remotion Player embeds */
  const players = new Map();
  function mountAnim(el) {
    const id = el.dataset.composition, props = (() => { try { return JSON.parse(el.dataset.props || '{}'); } catch (e) { return {}; } })();
    let m = el.querySelector('.anim-mount'); if (!m) { m = document.createElement('div'); m.className = 'anim-mount'; el.prepend(m); }
    if (window.CtrlWAMAnim && window.CtrlWAMAnim.has(id)) {
      try { const c = window.CtrlWAMAnim.mount(m, { composition: id, props, loop: el.dataset.loop !== 'false', autoplay: false }); players.set(el, c); return c; } catch (e) { console.error(e); }
    }
    const v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'metadata'; v.src = `${MEDIA}video/${id}.mp4`;
    v.onerror = () => { m.innerHTML = el.dataset.poster ? `<div class="anim-fallback"><img src="${el.dataset.poster}" alt=""></div>` : `<div class="anim-fallback">Animation “${id}”</div>`; };
    m.appendChild(v); const c = { play: () => v.play().catch(() => {}), pause: () => v.pause(), seek: f => { v.currentTime = f / 30; }, video: true }; players.set(el, c); return c;
  }
  $$('.anim[data-composition]').forEach(el => {
    const c = mountAnim(el);
    if (!el.classList.contains('scrubbed') && !el.classList.contains('no-ctl')) {
      const ctl = document.createElement('div'); ctl.className = 'ctl'; ctl.innerHTML = '<button data-a="restart" title="Restart">↺</button><button data-a="toggle" title="Play / pause">❚❚</button>'; el.appendChild(ctl);
      ctl.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.a === 'restart') { c.seek(0); c.play(); } else { if (c.toggle) c.toggle(); else (c.video ? (el.querySelector('video').paused ? c.play() : c.pause()) : c.toggle()); } });
    }
  });
  const pio = new IntersectionObserver(es => es.forEach(e => { const c = players.get(e.target); if (!c || e.target.classList.contains('scrubbed')) return; if (e.isIntersecting) c.play(); else c.pause(); }), { threshold: 0.3 });
  players.forEach((c, el) => pio.observe(el));

  /* ------------------------------------------------ scroll-scrubbed denoising animation */
  const scrub = $('.scrub');
  if (scrub) {
    const el = $('.anim', scrub), c = players.get(el), dur = 360, fill = $('.readout .bar i', scrub), lab = $('.readout .lab', scrub), bar = $('.readout .bar', scrub);
    // auto-replay; drag the bar to scrub & hold, release resumes; readout mirrors the playhead at ~8 Hz
    let lastW = '', lastL = '', held = false;
    const f2p = f => clamp((f - 20) / (dur - 80), 0, 1), p2f = p => Math.round(20 + p * (dur - 80));
    const paint = q => { const w = (q * 100).toFixed(0) + '%', l = q < 0.02 ? 'pure noise' : q > 0.98 ? 'clean' : `denoising ${(q * 100).toFixed(0)} %`; if (fill && w !== lastW) { fill.style.width = w; lastW = w; } if (lab && l !== lastL) { lab.textContent = l; lastL = l; } };
    const upd = () => { if (held) return; const p = c && c.player && c.player.getCurrentFrame ? c.player.getCurrentFrame() : 0; paint(f2p(p)); };
    if (c) setInterval(upd, 120);
    if (bar && c) {
      bar.style.cursor = 'ew-resize'; bar.style.touchAction = 'none';
      const at = e => { const r = bar.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width, 0, 1); };
      const scrubTo = e => { const q = at(e); c.pause(); c.seek(p2f(q)); paint(q); };
      bar.addEventListener('pointerdown', e => { held = true; el.classList.add('scrubbed'); bar.setPointerCapture(e.pointerId); scrubTo(e); });
      bar.addEventListener('pointermove', e => { if (held) scrubTo(e); });
      const release = () => { if (!held) return; held = false; el.classList.remove('scrubbed'); c.play(); };
      bar.addEventListener('pointerup', release); bar.addEventListener('pointercancel', release);
    }
  }

  /* ------------------------------------------------ scrollytelling: the problem */
  const scrolly = $('.scrolly');
  if (scrolly) {
    const steps = $$('.step', scrolly), scene = $('.scene', scrolly.parentElement);
    let dom = 'drive';
    const allImgs = $$('.frame.seq img', scene), seqDots = $$('.seq-dots i', scene), seqLbl = $('.frame.seq .lbl', scene); let seqK = -1;
    const seqImgsOf = () => allImgs.filter(im => im.dataset.set === dom);
    const setFrame = (k, force) => { if (k === seqK && !force) return; seqK = k; allImgs.forEach(im => im.classList.toggle('on', im.dataset.set === dom && +im.dataset.i === k)); seqDots.forEach((d, i) => d.classList.toggle('on', i === k)); if (seqLbl) seqLbl.textContent = 't' + '₁₂₃₄₅₆₇₈'[k]; };
    const PATHS = { drive: { noised: $('#p-noised', scene), denoised: $('#p-denoised', scene), star: $('#p-star', scene), ghost: $('#p-ghost', scene) }, robot: { noised: $('#r-noised', scene), denoised: $('#r-denoised', scene), star: $('#r-star', scene), ghost: null } };
    let paths = PATHS.drive, len = {};
    Object.values(PATHS).forEach(P => { P.noised.style.strokeDasharray = P.noised.getTotalLength(); P.denoised.style.strokeDasharray = P.denoised.getTotalLength(); });
    const useDom = d => { dom = d; paths = PATHS[d]; len = { noised: paths.noised.getTotalLength(), denoised: paths.denoised.getTotalLength() }; $$('svg.road', scene).forEach(s => s.style.display = (s.classList.contains('robot') === (d === 'robot')) ? 'block' : 'none'); $$('.title-row .tabs button', scene).forEach(b => b.classList.toggle('on', b.dataset.dom === d)); $$('.verdict', scene).forEach(v => { if (v.dataset[d]) v.textContent = v.dataset[d]; }); setFrame(seqK < 0 ? 0 : seqK, true); };
    len = { noised: paths.noised.getTotalLength(), denoised: paths.denoised.getTotalLength() };
    $$('.title-row .tabs button', scene).forEach(b => b.addEventListener('click', () => useDom(b.dataset.dom)));
    function setState(i, p) { // i = step index, p = progress inside the step
      const cls = 'scene' + (i >= 1 ? ' s' + Math.min(i, 2) : ''); if (scene.className !== cls) scene.className = cls;
      const kEl = $('.title-row .k', scene), tEl = $('.title-row .t', scene), kTxt = ['(a) Clean', '(b) Noised', '(c) Denoised'][i], tTxt = ['Recorded pair · safe pass', 'Video noised · action noised', 'Safe video, unsafe action'][i];
      if (kEl.textContent !== kTxt) kEl.textContent = kTxt; if (tEl.textContent !== tTxt) tEl.textContent = tTxt;
      const noise = i === 1 ? 0.85 : i === 2 ? clamp(0.85 - p * 1.1, 0, 0.85) : 0;
      $$('.frame .noise', scene).forEach(n => n.style.opacity = noise);
      $$('.frame.seq img', scene).forEach(im => { im.style.filter = noise > 0.02 ? `blur(${(noise * 5).toFixed(1)}px) saturate(${(1 - noise * .5).toFixed(2)}) contrast(${(1 - noise * .3).toFixed(2)})` : ''; });
      const seqImgs = seqImgsOf(); if (seqImgs.length) setFrame(Math.min(seqImgs.length - 1, Math.floor(p * seqImgs.length)));
      const nd = i === 1 ? clamp(p * 1.3, 0, 1) : i === 2 ? 1 : 0, dd = i === 2 ? clamp(p * 1.3, 0, 1) : 0;
      paths.noised.style.strokeDashoffset = len.noised * (1 - nd); paths.noised.style.opacity = i === 2 ? clamp(1 - p * 2, 0.15, 1) : 1;
      paths.denoised.style.strokeDashoffset = len.denoised * (1 - dd);
      paths.star.style.transform = `scale(${dd > 0.85 ? 1 : 0})`; if (paths.ghost) paths.ghost.style.opacity = dd > 0.7 ? 0.6 : 0;
      $$('.verdict', scene).forEach(v => v.classList.toggle('show', +v.dataset.step <= i && (+v.dataset.step < i || p > 0.35)));
      $('.band', scene).classList.toggle('show', i === 2 && p > 0.35);
      steps.forEach((s, k) => s.classList.toggle('on', k === i));
    }
    const STEP = 3400, HOLD = 900, T = steps.length * STEP; let t0 = performance.now(), running = false, raf = 0;
    let lastI = -1, lastQ = -1;
    const tick = now => { const t = (now - t0) % T, i = Math.floor(t / STEP), p = clamp((t - i * STEP) / (STEP - HOLD), 0, 1), q = Math.round(p * 40); if (i !== lastI || q !== lastQ) { lastI = i; lastQ = q; setState(i, p); } raf = requestAnimationFrame(tick); };
    const start = () => { if (running || reduced) return; running = true; raf = requestAnimationFrame(tick); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    steps.forEach((s, k) => s.addEventListener('click', () => { t0 = performance.now() - k * STEP; if (!running) setState(k, 1); }));
    if (reduced) setState(2, 1); else setState(0, 0);
    const sio = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? start() : stop()), { threshold: 0.3 }); sio.observe(scene);
  }

  /* ------------------------------------------------ method tabs */
  $$('.tabs').forEach(t => t.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('button', t).forEach(x => x.classList.toggle('on', x === b)); const host = t.parentElement; $$(':scope > .panel', host).forEach(p => p.classList.toggle('on', p.id === b.dataset.panel)); renderCharts(); if (window.Site && window.Site.renderWarp) window.Site.renderWarp(); const anim = $('#' + b.dataset.panel + ' .anim'); const c = anim && players.get(anim); if (c) { c.seek(0); c.play(); } }));

  /* ------------------------------------------------ warp explorer */
  const wx = $('#warp-explorer');
  if (wx && window.CtrlWAMCharts) {
    const chart = $('.warp-chart', wx), zIn = $('#w-zeta', wx), sIn = $('#w-sigma', wx), out = { z: $('#w-zeta-v', wx), s: $('#w-sigma-v', wx), v: $('#w-sv', wx), kept: $('#w-kept', wx) };
    const warp = (s, z) => z * s / (1 + (z - 1) * s);
    const render = () => {
      if (!chart.clientWidth && !chart.offsetParent) return;   // hidden tab: re-rendered when shown
      const z = +zIn.value, s = +sIn.value, sv = warp(s, z);
      const zetas = [1, 2, 3, 5]; if (!zetas.includes(z)) zetas.push(z); zetas.sort((a, b) => a - b);
      const colors = zetas.map(x => x === 1 ? '#C0392B' : x === z ? '#0B1A3A' : ({ 2: '#8FC24A', 3: '#3E9457', 5: '#1F6B3F' }[x] || '#8B919C'));
      const cw = chart.clientWidth || 520; chart.style.width = cw + 'px'; chart.style.height = Math.round(cw / 1.15) + 'px';
      chart.dataset.chart = JSON.stringify({ type: 'warp', zetas, colors, probe: s, probeZeta: z, margin: { l: 70, r: 20, t: 20, b: 64 } });
      window.CtrlWAMCharts.render(chart);
      out.z.textContent = z.toFixed(1); out.s.textContent = s.toFixed(2); out.v.textContent = sv.toFixed(2); out.kept.textContent = ((1 - sv) * 100).toFixed(0) + ' %';
      $('#w-bar-a i', wx).style.width = (s * 100) + '%'; $('#w-bar-v i', wx).style.width = (sv * 100) + '%';
      $('#w-bar-a .val', wx).textContent = s.toFixed(2); $('#w-bar-v .val', wx).textContent = sv.toFixed(2);
    };
    [zIn, sIn].forEach(i => i.addEventListener('input', render));
    $$('[data-zeta]', wx).forEach(b => b.addEventListener('click', () => { zIn.value = b.dataset.zeta; render(); }));
    addEventListener('resize', render); setTimeout(render, 50); window.__renderWarp = render;
    // idle animation of the probe until the user touches a control
    let touched = false; [zIn, sIn].forEach(i => i.addEventListener('pointerdown', () => touched = true));
    const t0 = performance.now(); const idle = now => { if (touched || reduced) return; const r = wx.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) { sIn.value = (0.5 + 0.45 * Math.sin((now - t0) / 1800)).toFixed(2); render(); } requestAnimationFrame(idle); }; requestAnimationFrame(idle);
  }

  /* ------------------------------------------------ ego counterfactual explorer */
  const cx = $('#cf-explorer');
  if (cx && D.egocf) {
    const E = D.egocf, view = $('.cf-view', cx), seg = $('.seg', cx), slider = $('#cf-time', cx), tOuts = $$('.cf-t, #cf-t', cx), playBtn = $('.play', cx), bev = $('.bev img', cx);
    let arm = E.arms[0], k = 0, playing = false, timer = null;
    const imgs = new Map();
    function ensure(a) { if (imgs.has(a.key)) return imgs.get(a.key); const list = E.frames.map(f => { const im = new Image(); im.src = `${MEDIA}egocf/${a.key}/raw/f${String(f).padStart(2, '0')}.jpg`; im.alt = ''; view.insertBefore(im, view.firstChild); return im; }); imgs.set(a.key, list); return list; }
    function show() { imgs.forEach((list, key) => list.forEach((im, i) => im.classList.toggle('on', key === arm.key && i === k))); const tl = `t = ${((E.frames[k] - E.t0) / E.hz).toFixed(1)} s`; tOuts.forEach(tOut => { if (tOut.firstChild && tOut.firstChild.nodeType === 3) tOut.firstChild.nodeValue = tl; else tOut.replaceChildren(document.createTextNode(tl)); }); slider.value = k; view.style.borderColor = arm.color; if (bev.dataset.arm !== arm.key) { bev.dataset.arm = arm.key; bev.src = `${MEDIA}egocf/${arm.key}/bev.png`; }
      $('#cf-dev', cx).textContent = arm.cmdDev === 0 ? 'recorded' : arm.cmdDev.toFixed(1) + ' m'; $('#cf-ade', cx).textContent = arm.cmdAde.toFixed(2) + ' m'; $('#cf-psnr', cx).textContent = arm.psnr.toFixed(1) + ' dB';
      $('#cf-desc', cx).textContent = ({ multi_agent_factual: 'The recorded ego trajectory is supplied as the command; the generated video should reproduce the drive.', multi_agent_stop: 'The command decelerates to a halt: forward progression stops and the parked cars stay put.', multi_agent_accel: 'The command speeds up: the ego passes the buildings and parked vehicles faster than recorded.', multi_agent_nudge_left: 'The recorded path is shifted 2 m to the left while keeping its shape.', multi_agent_nudge_right: 'The recorded path is shifted 2 m to the right while keeping its shape.' })[arm.key] || ''; }
    seg.innerHTML = E.arms.map((a, i) => `<button data-i="${i}" class="${i === 0 ? 'on' : ''}"><span class="sw" style="background:${a.color}"></span>${a.label}</button>`).join('');
    seg.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('button', seg).forEach(x => x.classList.toggle('on', x === b)); arm = E.arms[+b.dataset.i]; ensure(arm); show(); });
    slider.max = E.frames.length - 1; slider.addEventListener('input', () => { k = +slider.value; show(); });
    function setPlaying(on) { playing = on; playBtn.textContent = on ? '❚❚' : '▶'; clearInterval(timer); if (on) timer = setInterval(() => { k = (k + 1) % E.frames.length; show(); }, 1000 / E.hz); }
    playBtn.addEventListener('click', () => setPlaying(!playing));
    E.arms.forEach(ensure); show();
    const cio2 = new IntersectionObserver(es => es.forEach(e => setPlaying(e.isIntersecting && !reduced)), { threshold: 0.4 }); cio2.observe(cx);
  }

  /* ------------------------------------------------ RoboTwin explorer */
  const rx = $('#rt-explorer');
  if (rx && D.robotwin) {
    const R = D.robotwin, sel = $('select', rx), grid = $('.rt-grid', rx), slider = $('#rt-frame', rx), playBtn = $('.play', rx), instr = $('.rt-instr', rx);
    const METHODS = [{ key: 'gt', label: 'Ground truth', color: '#2E9E62' }, { key: 'cosmos_sft', label: 'Cosmos-SFT', color: '#6B7280' }, { key: 'gtswap', label: 'GT-Src control', color: '#E8A33D' }, { key: 'ctrlwam', label: 'CtrlWAM (ours)', color: '#3B6EF5' }];
    const eps = Object.keys(R).filter(e => R[e].complete); sel.innerHTML = eps.map(e => `<option value="${e}" ${e === '104' ? 'selected' : ''}>Episode ${e} — ${R[e].instr.slice(0, 60)}${R[e].instr.length > 60 ? '…' : ''}</option>`).join('');
    let ep = eps.includes('104') ? '104' : eps[0], k = 0, playing = false, timer = null;
    function build() {
      const info = R[ep]; grid.innerHTML = METHODS.map(m => { const acc = info.traj[m.key]; const best = acc != null && acc === Math.max(...Object.values(info.traj)); return `<div class="rt-col"><div class="hd"><span><span class="sw" style="background:${m.color}"></span>${m.label}</span>${acc != null ? `<span class="acc ${best ? 'best' : ''}">traj ${acc.toFixed(2)}</span>` : ''}</div><div class="rt-view" style="border-color:${m.color}">${info.frames.map((f, i) => `<img data-i="${i}" src="${MEDIA}robotwin/ep${ep}/${m.key}/f${String(f).padStart(4, '0')}.jpg" alt="">`).join('')}<span class="f"></span></div></div>`; }).join('');
      slider.max = info.frames.length - 1; k = Math.min(k, info.frames.length - 1); show();
      instr.innerHTML = `<b>Task ·</b> ${info.instr} <span style="color:var(--ink-2)">— episode ${ep}, forward dynamics with the recorded actions, matching frame indices. Trajectory accuracy = normalised DTW score for this episode.</span>`;
    }
    function show() { const info = R[ep]; $$('.rt-view', grid).forEach(v => { $$('img', v).forEach(im => im.classList.toggle('on', +im.dataset.i === k)); $('.f', v).textContent = `frame ${info.frames[k]}`; }); slider.value = k; }
    function tick() { const n = R[ep].frames.length; timer = setTimeout(() => { k = (k + 1) % n; show(); tick(); }, k === n - 1 ? 1000 : 165); }   // every 5th frame of a 30 fps video -> real time; hold the end state 1 s
    function setPlaying(on) { playing = on; playBtn.textContent = on ? '❚❚' : '▶'; clearTimeout(timer); if (on) tick(); }
    sel.addEventListener('change', () => { ep = sel.value; k = 0; build(); });
    slider.addEventListener('input', () => { k = +slider.value; show(); });
    playBtn.addEventListener('click', () => setPlaying(!playing));
    build();
    const rio = new IntersectionObserver(es => es.forEach(e => setPlaying(e.isIntersecting && !reduced)), { threshold: 0.4 }); rio.observe(rx);
  }

  /* ------------------------------------------------ static charts */
  function renderCharts() { if (!window.CtrlWAMCharts) return; $$('.chart[data-chart]').forEach(el => { const w = el.clientWidth || 700; const ar = +(el.dataset.aspect || 1.6); el.style.height = Math.round(w / ar) + 'px'; el.style.width = w + 'px'; window.CtrlWAMCharts.render(el); el.style.width = ''; }); }
  addEventListener('resize', () => { clearTimeout(renderCharts.t); renderCharts.t = setTimeout(renderCharts, 150); });

  /* ------------------------------------------------ lightbox */
  const lb = $('.lightbox');
  if (lb) { $$('img.zoomable, .zoomable img').forEach(im => im.addEventListener('click', () => { $('img', lb).src = im.dataset.full || im.src; lb.classList.add('show'); })); lb.addEventListener('click', () => lb.classList.remove('show')); addEventListener('keydown', e => { if (e.key === 'Escape') lb.classList.remove('show'); }); }

  /* ------------------------------------------------ bibtex copy */
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => { const t = $(b.dataset.copy); try { await navigator.clipboard.writeText(t.textContent); b.textContent = 'Copied ✓'; setTimeout(() => b.textContent = 'Copy BibTeX', 1600); } catch (e) { const r = document.createRange(); r.selectNodeContents(t); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Select & copy'; } }));

  /* ------------------------------------------------ boot */
  renderTex(); renderCharts(); onScroll();
  window.Site = { players, renderCharts, renderWarp: () => window.__renderWarp && window.__renderWarp() };
})();
