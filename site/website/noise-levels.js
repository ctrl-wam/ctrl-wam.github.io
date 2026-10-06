/* Noise-level explorer (Method › 01 of the main page, and the whole of CtrlWAM-Noise-Levels.html — both host the same
   markup, div#nl-explorer, and this script). Controls: Domain (driving / manipulation), Example N, action-noise slider over
   the exported t_clean levels, Warp ς ∈ {1,2,3,5}. Panels: recorded video | rendering of the noised command | noised
   rendering (decoded Wan-VAE-latent noise at σ_v = warp(σ_a; ς), from latent.dirs[level][ς] in the window's index.js; the
   pixel cross-fade with noise.png is only a fallback for a window without decoded frames) | top-down action panel.
   Media + catalog: site/media/noise-levels/ (export_noise_levels*.py). Catalog and window index are loaded with <script>
   tags, so file:// works. Range inputs carry no `value` attribute in the markup on purpose: the main page body is rendered
   by React (DC runtime), which would keep restoring a markup value. */
(() => {
  const root = document.getElementById('nl-explorer'); if (!root) return;
  const BASE = (window.CTRLWAM_MEDIA_BASE || 'site/media/') + 'noise-levels/';
  const $ = (s, r = root) => r.querySelector(s), $$ = (s, r = root) => Array.from(r.querySelectorAll(s));
  const tex = (s) => window.katex ? katex.renderToString(s, { throwOnError: false }) : s;
  const f2 = (i) => String(i).padStart(2, '0');
  const lvl = $('#nl-level'), time = $('#nl-time'), play = $('#nl-play');
  const imGT = $('#im-gt'), imRen = $('#im-ren'), imNoi = $('#im-noi'), imEps = $('#im-eps'), cvB = $('#cv-bev');
  const DEFAULT_KEY = { driving: 'e4cc26ed_w2', robot: 'pick_dual_bottles_e0_s0016_beast' };
  const SHIFTS = [1, 2, 3, 5];
  let WIN = [], dom = 'driving', D, L, MEDIA, k = 0, i = 0, shownI = 0, playing = false, timer = null, swapTok = 0, shift = 1;

  const script = (src) => new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = src; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); });
  const loaded = new Map();
  const loadWindow = (key) => loaded.has(key) ? Promise.resolve(loaded.get(key)) : script(BASE + key + '/index.js').then(() => { loaded.set(key, window.CTRLWAM_NOISE_LEVELS); return loaded.get(key); });

  const cache = new Map();
  const img = (src) => { if (!cache.has(src)) { const im = new Image(); im.decoding = 'async'; im.src = src; cache.set(src, im); } return cache.get(src); };
  const preload = (dir) => { for (let j = D.t0 + 1; j < D.frames; j++) img(MEDIA + dir + '/f' + f2(j) + '.jpg'); };
  const ready = (url) => { const im = img(url); return (im.complete && im.naturalWidth) ? Promise.resolve() : (im.decode ? im.decode().catch(() => {}) : new Promise(r => im.addEventListener('load', r, { once: true }))); };
  // all panels of one timestep swap together once every frame is decoded; a superseded step is dropped
  const showAll = (pairs, then) => { const my = ++swapTok; Promise.all(pairs.map(([, u]) => ready(u))).then(() => { if (my !== swapTok) return; pairs.forEach(([el, u]) => { if (!el.src.endsWith(u)) el.src = u; }); shownI = i; then(); }); };
  const crop = (j) => { let s = (j + 1) * 2654435761 >>> 0; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; return [r() * 100, r() * 100, r() < .5 ? -1 : 1, r() < .5 ? -1 : 1]; };
  const warp = (sa, s) => s * sa / (1 + (s - 1) * sa);
  const latDir = (j, s = shift) => { const b = D.latent && D.latent.dirs[String(j)]; return b ? b[String(s)] : null; };
  const noiDir = (j) => latDir(j) ? L[j].dir + '/' + latDir(j) : L[j].dir;
  const prefetchWindow = () => { const dirs = [...L.map(l => l.dir), ...L.map((l, j) => noiDir(j))]; dirs.forEach(d => img(MEDIA + d + '/f' + f2(i) + '.jpg')); setTimeout(() => { preload('gt'); dirs.forEach(preload); }, 0); };

  function drawBEV() {
    const c = cvB, S = 2, side = Math.min(c.parentElement.clientWidth, 600); if (!side) return; c.width = side * S; c.height = side * S;
    const g = c.getContext('2d'); g.setTransform(S, 0, 0, S, 0, 0); g.clearRect(0, 0, side, side);
    const GT = D.gtPaths || [D.gt], hist = D.history || [], lvPaths = (l) => l.paths || [l.future];
    const pts = [...hist, ...GT.flat(), ...L.flatMap(l => lvPaths(l).flat())], xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const lo = [Math.min(...xs), Math.min(...ys)], hi = [Math.max(...xs), Math.max(...ys)];
    const G = D.grid || 10, span = Math.max(hi[0] - lo[0], hi[1] - lo[1]) * 1.15 + 0.4 * G, cx = (lo[0] + hi[0]) / 2, cy = (lo[1] + hi[1]) / 2, sc = side / span;
    // 'ego' (driving): x forward = up, y left = left.  'xy' (robot base, top-down): x right = right, y forward = up
    const P = D.bev === 'xy' ? (p) => [side / 2 + (p[0] - cx) * sc, side / 2 - (p[1] - cy) * sc] : (p) => [side / 2 - (p[1] - cy) * sc, side / 2 - (p[0] - cx) * sc];
    g.strokeStyle = '#E3E5E8'; g.lineWidth = 1;
    for (let m = Math.floor((Math.min(cx, cy) - span) / G) * G; m <= Math.max(cx, cy) + span; m += G) { let [x0, y0] = P([m, cy - span]), [x1, y1] = P([m, cy + span]); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); [x0, y0] = P([cx - span, m]); [x1, y1] = P([cx + span, m]); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
    const line = (arr, col, w, dash) => { if (!arr.length) return; g.strokeStyle = col; g.lineWidth = w; g.setLineDash(dash || []); g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath(); arr.forEach((p, j) => { const [x, y] = P(p); j ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.setLineDash([]); };
    L.forEach((l, j) => { if (j !== k) lvPaths(l).forEach(a => line(a, '#CFD5DE', 1.6)); });
    line(hist, '#1E2126', 3);
    lvPaths(L[k]).forEach(a => line(a, '#8A5CF6', 3.5));
    GT.forEach(a => line(a, '#2E9E62', L[k].t === 1 ? 2 : 3.5, L[k].t === 1 ? [6, 5] : null));
    const idx = D.frameToTraj ? D.frameToTraj[shownI] : Math.round(D.frameT[shownI] * 10) - 1;
    if (idx >= 0) { const dot = (a, col) => { const q = a[Math.min(a.length - 1, idx)]; if (!q) return; const [x, y] = P(q); g.fillStyle = col; g.beginPath(); g.arc(x, y, 5, 0, 2 * Math.PI); g.fill(); }; lvPaths(L[k]).forEach(a => dot(a, '#8A5CF6')); GT.forEach(a => dot(a, '#2E9E62')); }
    if (D.bev !== 'xy') { const [ex, ey] = P([0, 0]); g.fillStyle = '#1E2126'; g.beginPath(); g.arc(ex, ey, 4, 0, 2 * Math.PI); g.fill(); }
    g.fillStyle = '#8B919C'; g.font = '11px ' + getComputedStyle(document.body).getPropertyValue('--mono'); g.fillText(D.bev === 'xy' ? `${G * 100} cm grid · top-down, grippers` : `${G} m grid`, 8, side - 8);
  }

  function update() {
    const l = L[k], t = D.frameT[i], [px, py, fx, fy] = crop(i), name = (dir) => MEDIA + dir + '/f' + f2(i) + '.jpg', tl = 't₀ + ' + t.toFixed(1) + ' s', ld = latDir(k), sv = warp(l.sigma, shift);
    showAll([[imGT, name('gt')], [imRen, name(l.dir)], [imNoi, name(noiDir(k))]], () => {
      imEps.style.opacity = ld ? 0 : sv; imEps.style.backgroundPosition = `${px}% ${py}%`; imEps.style.transform = `scale(${fx}, ${fy})`;
      $$('.f').forEach(e => e.textContent = tl); $('#nl-t').textContent = 't = ' + t.toFixed(1) + ' s'; drawBEV();
    });
    $('#nl-read').innerHTML = tex(`t = ${l.t.toFixed(3)} \\quad \\sigma_a = 1 - t = ${l.sigma.toFixed(3)}`);
    $('#nl-sv').innerHTML = tex(`\\sigma_v = \\mathrm{warp}(\\sigma_a;\\varsigma=${shift}) = ${sv.toFixed(3)}`);
    const robot = D.domain === 'robot';
    $('#nl-note').innerHTML = l.t === 1
      ? `<b>t = 1:</b> the command equals the recorded trajectory (the executed path coincides with it, green dashed), the simulator re-renders the recorded motion, and no Gaussian noise is added to the video (σ<sub>v</sub> = 0). This is the clean anchor.`
      : l.t === 0
      ? `<b>t = 0:</b> the command is pure noise, the executed motion has nothing to do with the recording, and the video input is pure Gaussian noise (σ<sub>v</sub> = 1). The model must infer everything from the conditioning frames.`
      : `<b>t = ${l.t.toFixed(3)}:</b> the simulator executes a command that is ${Math.round(l.t * 100)} % recorded trajectory and ${Math.round(l.sigma * 100)} % Gaussian noise${robot && D.actionSpace === 'beast' ? ' in the BEAST B-spline control-point space (decoded to joint targets, so the excursions are smooth)' : ''}, and renders what the camera sees along that ${robot ? 'motion' : 'path'}. Flow-matching noise at σ<sub>v</sub> = ${sv.toFixed(3)}${shift === 1 ? ' (shared schedule, σ<sub>v</sub> = σ<sub>a</sub>)' : ` (warped, ς = ${shift}: more video noise at the same action level)`} is then added ${ld ? 'to the VAE latent of the rendering, and the noised latent is decoded — this is what the model sees' : 'to the rendering in pixel space (approximation; training noises the VAE latent)'}. Video and action are noised <b>consistently</b>: the visual consequence of the perturbed action is part of the input, not an independent Gaussian blur.`;
  }

  function initWindow(d) {
    D = d; L = D.levels; MEDIA = BASE + D.key + '/'; cache.clear();
    imEps.style.backgroundImage = `url(${MEDIA}noise.png)`;
    $$('.nl-view').forEach(v => v.style.aspectRatio = D.size[0] + '/' + D.size[1]);
    $('.nl-grid').style.gridTemplateColumns = `repeat(3, ${(D.size[0] / D.size[1]).toFixed(4)}fr) 1fr`;
    lvl.max = L.length - 1; lvl.value = L.reduce((b, l, j) => Math.abs(l.t - 0.5) < Math.abs(L[b].t - 0.5) ? j : b, 0);
    time.min = D.t0 + 1; time.max = D.frames - 1; time.value = Math.min(D.frames - 1, D.t0 + 16);   // future frames only; the conditioning history is not shown
    k = +lvl.value; i = +time.value;
    $('#nl-ticks').innerHTML = L.map(l => `<span>${+l.sigma.toFixed(3)}</span>`).join('');
    $$('#nl-win button').forEach(b => b.classList.toggle('on', b.dataset.key === D.key));
    prefetchWindow(); update();
  }
  function setPlaying(on) { playing = on; play.textContent = on ? '❚❚' : '▶'; clearTimeout(timer); if (on) tick(); }
  function tick() { timer = setTimeout(() => { i = i >= D.frames - 1 ? D.t0 + 1 : i + 1; time.value = i; update(); tick(); }, i === D.frames - 1 ? 900 : 1000 / D.hz); }

  const domWins = () => WIN.filter(w => (w.domain || 'driving') === dom).sort((a, b) => (a.key === DEFAULT_KEY[dom] ? -1 : b.key === DEFAULT_KEY[dom] ? 1 : 0));
  const buildWinButtons = () => { $('#nl-win').innerHTML = domWins().map((w, j) => `<button data-key="${w.key}">Example ${j + 1}</button>`).join(''); };

  lvl.addEventListener('input', () => { k = +lvl.value; update(); });
  time.addEventListener('input', () => { i = +time.value; update(); });
  play.addEventListener('click', () => setPlaying(!playing));
  $('#nl-shift').innerHTML = SHIFTS.map(s => `<button data-shift="${s}"${s === 1 ? ' class="on"' : ''}>${s}</button>`).join('');
  $('#nl-shift').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; shift = +b.dataset.shift; $$('#nl-shift button').forEach(x => x.classList.toggle('on', x === b)); prefetchWindow(); update(); });
  $('#nl-win').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) loadWindow(b.dataset.key).then(initWindow); });
  $('#nl-dom').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || b.disabled || b.dataset.dom === dom) return; dom = b.dataset.dom; $$('#nl-dom button').forEach(x => x.classList.toggle('on', x === b)); buildWinButtons(); const w = domWins()[0]; if (w) loadWindow(w.key).then(initWindow); });
  if (window.ResizeObserver) new ResizeObserver(() => { if (D) drawBEV(); }).observe(root);   // the host may be display:none until a tab opens
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  script(BASE + 'index.js').then(() => {
    WIN = window.CTRLWAM_NOISE_WINDOWS || [];
    $$('#nl-dom button').forEach(b => { b.disabled = !WIN.some(w => (w.domain || 'driving') === b.dataset.dom); b.style.opacity = b.disabled ? .45 : 1; });
    if (!domWins().length) dom = (WIN[0] && WIN[0].domain) || 'driving';
    if (!WIN.length) { root.style.display = 'none'; return; }
    buildWinButtons();
    return loadWindow(domWins()[0].key).then(d => { initWindow(d); const io = new IntersectionObserver(es => es.forEach(e => setPlaying(e.isIntersecting && !reduced)), { threshold: 0.4 }); io.observe(root); });
  }).catch(() => { root.style.display = 'none'; });
})();
