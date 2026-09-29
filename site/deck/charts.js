/* ==========================================================================
   CtrlWAM charts — small SVG chart renderer shared by the slide deck (deck/deck.js)
   and the project website (website/site.js). Usage: element with data-chart='{json}'
   → CtrlWAMCharts.render(el). Types: line, bar, groupbar, warp.
   ========================================================================== */
(function () {
  'use strict';
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const parseJSON = (s, fb = null) => { if (s == null || s === '') return fb; try { return JSON.parse(s); } catch (e) { console.warn('Bad JSON:', s, e); return fb; } };
  const Charts = (() => {
    const NS = 'http://www.w3.org/2000/svg';
    const mk = (tag, attrs = {}, children = []) => { const e = document.createElementNS(NS, tag); for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]); for (const c of children) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); return e; };
    const text = (x, y, s, o = {}) => mk('text', { x, y, fill: o.fill || '#5A616C', 'font-size': o.fs || 19, 'font-weight': o.fw || 500, 'text-anchor': o.anchor || 'start', 'dominant-baseline': o.base || 'middle', transform: o.transform, 'font-style': o.italic ? 'italic' : null, 'font-family': o.mono ? "'JetBrains Mono', monospace" : null }, [s]);
    const fmt = (v, d) => (d != null ? (+v).toFixed(d) : (Number.isInteger(v) ? String(v) : String(+(+v).toFixed(2))));
    const INK = '#0B1A3A', INK2 = '#5A616C', GRID = '#E9EDF2', AXIS = '#C9D0DA';

    function axes(svg, spec, box) {
      const { x, y } = spec, { l, t, pw, ph } = box;
      const X = v => l + pw * (v - x.min) / (x.max - x.min), Y = v => t + ph * (1 - (v - y.min) / (y.max - y.min));
      (y.ticks || []).forEach(v => { svg.appendChild(mk('line', { x1: l, x2: l + pw, y1: Y(v), y2: Y(v), stroke: GRID, 'stroke-width': 1.5 })); svg.appendChild(text(l - 12, Y(v), fmt(v, y.decimals), { anchor: 'end', fs: spec.tickFs || 18 })); });
      (x.ticks || []).forEach(v => { if (spec.xgrid !== false) svg.appendChild(mk('line', { x1: X(v), x2: X(v), y1: t, y2: t + ph, stroke: GRID, 'stroke-width': 1.5 })); svg.appendChild(text(X(v), t + ph + 22, x.tickLabels ? (x.tickLabels[v] ?? fmt(v)) : fmt(v, x.decimals), { anchor: 'middle', fs: spec.tickFs || 18 })); });
      svg.appendChild(mk('line', { x1: l, x2: l + pw, y1: t + ph, y2: t + ph, stroke: AXIS, 'stroke-width': 2 }));
      svg.appendChild(mk('line', { x1: l, x2: l, y1: t, y2: t + ph, stroke: AXIS, 'stroke-width': 2 }));
      if (x.label) svg.appendChild(text(l + pw / 2, t + ph + (x.labelDy || 58), x.label, { anchor: 'middle', fill: INK, fs: spec.labelFs || 21, fw: 600 }));
      if (y.label) svg.appendChild(text(0, 0, y.label, { anchor: 'middle', fill: INK, fs: spec.labelFs || 21, fw: 600, transform: `translate(${l - (y.labelDx || 62)} ${t + ph / 2}) rotate(-90)` }));
      return { X, Y };
    }
    function legend(svg, items, x, y, o = {}) {
      const g = mk('g'); let yy = y;
      items.forEach(it => {
        if (it.dash) g.appendChild(mk('line', { x1: x, x2: x + 34, y1: yy, y2: yy, stroke: it.color, 'stroke-width': 4, 'stroke-dasharray': '9 7', 'stroke-linecap': 'round' }));
        else if (o.swatch) g.appendChild(mk('rect', { x, y: yy - 9, width: 18, height: 18, rx: 4, fill: it.color }));
        else g.appendChild(mk('line', { x1: x, x2: x + 34, y1: yy, y2: yy, stroke: it.color, 'stroke-width': 4, 'stroke-linecap': 'round' }));
        g.appendChild(text(x + (o.swatch ? 28 : 44), yy, it.name, { fill: INK2, fs: o.fs || 18 }));
        yy += o.gap || 30;
      });
      svg.appendChild(g);
    }
    const pathFrom = (pts) => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');

    const build = {
      line(spec, w, h) {
        const m = Object.assign({ l: 96, r: 40, t: 28, b: 84 }, spec.margin || {});
        const box = { l: m.l, t: m.t, pw: w - m.l - m.r, ph: h - m.t - m.b };
        const svg = mk('svg', { viewBox: `0 0 ${w} ${h}` });
        const { X, Y } = axes(svg, spec, box);
        (spec.annotations || []).forEach(a => svg.appendChild(text(X(a.x), box.t + box.ph - 14, a.text, { anchor: 'middle', italic: true, fs: 17, fill: '#8B919C' })));
        const ends = [];
        spec.series.forEach(s => {
          const pts = s.points.map(p => [X(p[0]), Y(p[1])]);
          svg.appendChild(mk('path', { d: pathFrom(pts), fill: 'none', stroke: s.color, 'stroke-width': s.width || 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': s.dash ? '10 8' : null, opacity: s.opacity ?? 1 }));
          if (s.markers !== false) pts.forEach((p, i) => { const xl = spec.x.short || 'x', yl = spec.y.short || 'y'; const c = mk('circle', { cx: p[0], cy: p[1], r: s.r || 7, fill: s.color, stroke: '#fff', 'stroke-width': 2.5, 'data-tip': `${s.name}\n${xl} = ${fmt(s.points[i][0], spec.x.decimals)}${spec.x.unit ? ' ' + spec.x.unit : ''} · ${yl} = ${fmt(s.points[i][1], spec.y.decimals ?? spec.decimals)}${spec.y.unit ? ' ' + spec.y.unit : ''}`, 'data-color': s.color }); c.style.cursor = 'crosshair'; svg.appendChild(c); });
          ends.push({ name: s.name, color: s.color, x: pts[pts.length - 1][0], y: pts[pts.length - 1][1] });
        });
        if (spec.directLabels) { ends.sort((a, b) => a.y - b.y); let last = -1e9; ends.forEach(e => { let y = Math.max(e.y, last + 24); last = y; svg.appendChild(text(e.x + 14, y, e.name, { fill: e.color, fw: 700, fs: 18 })); }); }
        if (spec.legend) { const pos = spec.legend; const items = spec.series.map(s => ({ name: s.name, color: s.color, dash: !!s.dash })); const lx = pos.x != null ? pos.x : box.l + 18, ly = pos.y != null ? pos.y : box.t + 22; legend(svg, items, lx, ly, { fs: pos.fs || 18, gap: pos.gap || 30 }); }
        return svg;
      },
      bar(spec, w, h) {
        const m = Object.assign({ l: 90, r: 30, t: 40, b: 70 }, spec.margin || {});
        const box = { l: m.l, t: m.t, pw: w - m.l - m.r, ph: h - m.t - m.b };
        const svg = mk('svg', { viewBox: `0 0 ${w} ${h}` });
        const y = Object.assign({ min: 0 }, spec.y || {}); y.max = y.max ?? Math.max(...spec.values) * 1.15;
        const n = spec.values.length, slot = box.pw / n, bw = Math.min(slot * 0.62, spec.maxBar || 160);
        const Y = v => box.t + box.ph * (1 - (v - y.min) / (y.max - y.min));
        (y.ticks || []).forEach(v => { svg.appendChild(mk('line', { x1: box.l, x2: box.l + box.pw, y1: Y(v), y2: Y(v), stroke: GRID, 'stroke-width': 1.5 })); svg.appendChild(text(box.l - 12, Y(v), fmt(v), { anchor: 'end', fs: 18 })); });
        svg.appendChild(mk('line', { x1: box.l, x2: box.l + box.pw, y1: Y(y.min), y2: Y(y.min), stroke: AXIS, 'stroke-width': 2 }));
        spec.values.forEach((v, i) => {
          const cx = box.l + slot * (i + 0.5), x0 = cx - bw / 2, y0 = Y(v), hh = Y(y.min) - y0;
          const col = (spec.colors && spec.colors[i]) || spec.color || '#4A72B5', hl = spec.highlight === i;
          const r = mk('path', { d: `M${x0} ${y0 + hh} V${y0 + 4} Q${x0} ${y0} ${x0 + 4} ${y0} H${x0 + bw - 4} Q${x0 + bw} ${y0} ${x0 + bw} ${y0 + 4} V${y0 + hh} Z`, fill: col, opacity: hl || spec.highlight == null ? 1 : 0.55 });
          r.setAttribute('data-tip', `${spec.categories[i].replace(/\n/g, ' ')}\n${fmt(v, spec.decimals)}`); r.setAttribute('data-color', col); svg.appendChild(r);
          svg.appendChild(text(cx, y0 - 16, (spec.valuePrefix || '') + fmt(v, spec.decimals) + (spec.valueSuffix || ''), { anchor: 'middle', fill: hl ? INK : INK2, fw: hl ? 800 : 600, fs: hl ? 24 : 20 }));
          const lab = spec.categories[i].split('\n'); lab.forEach((ln, k) => svg.appendChild(text(cx, box.t + box.ph + 24 + k * 22, ln, { anchor: 'middle', fill: hl ? INK : INK2, fw: hl ? 700 : 500, fs: 19 })));
        });
        if (y.label) svg.appendChild(text(0, 0, y.label, { anchor: 'middle', fill: INK, fs: 20, fw: 600, transform: `translate(${box.l - 60} ${box.t + box.ph / 2}) rotate(-90)` }));
        return svg;
      },
      groupbar(spec, w, h) {
        const m = Object.assign({ l: 80, r: 30, t: 60, b: 70 }, spec.margin || {});
        const box = { l: m.l, t: m.t, pw: w - m.l - m.r, ph: h - m.t - m.b };
        const svg = mk('svg', { viewBox: `0 0 ${w} ${h}` });
        const y = Object.assign({ min: 0, max: 1 }, spec.y || {});
        const Y = v => box.t + box.ph * (1 - (v - y.min) / (y.max - y.min));
        const nC = spec.categories.length, nS = spec.series.length, slot = box.pw / nC, gw = slot * 0.74, bw = (gw - (nS - 1) * 3) / nS;
        (y.ticks || []).forEach(v => { svg.appendChild(mk('line', { x1: box.l, x2: box.l + box.pw, y1: Y(v), y2: Y(v), stroke: GRID, 'stroke-width': 1.5 })); svg.appendChild(text(box.l - 12, Y(v), fmt(v), { anchor: 'end', fs: 18 })); });
        svg.appendChild(mk('line', { x1: box.l, x2: box.l + box.pw, y1: Y(y.min), y2: Y(y.min), stroke: AXIS, 'stroke-width': 2 }));
        spec.categories.forEach((c, ci) => {
          const gx = box.l + slot * ci + (slot - gw) / 2;
          spec.series.forEach((s, si) => {
            const v = s.values[ci], x0 = gx + si * (bw + 3), y0 = Y(v), hh = Y(y.min) - y0;
            const r = mk('path', { d: `M${x0} ${y0 + hh} V${y0 + 4} Q${x0} ${y0} ${x0 + 4} ${y0} H${x0 + bw - 4} Q${x0 + bw} ${y0} ${x0 + bw} ${y0 + 4} V${y0 + hh} Z`, fill: s.color });
            r.setAttribute('data-tip', `${s.name} · ${String(c).replace(/\n/g, ' ')}\n${fmt(v, spec.decimals)}`); r.setAttribute('data-color', s.color); svg.appendChild(r);
            if (spec.valueLabels && (spec.valueLabels === 'all' || s.label)) { let ly = y0 - 12; if (spec.ref) { const ry = Y(spec.ref.values[ci]); if (ry <= y0 && y0 - ry < 30) ly = ry - 12; } svg.appendChild(text(x0 + bw / 2, ly, fmt(v, spec.decimals), { anchor: 'middle', fs: 15, fw: s.label ? 700 : 500, fill: s.label ? INK : INK2 })); }
          });
          if (spec.ref) { const v = spec.ref.values[ci], yy = Y(v); svg.appendChild(mk('line', { x1: gx - 4, x2: gx + gw + 4, y1: yy, y2: yy, stroke: spec.ref.color || INK, 'stroke-width': 3, 'stroke-dasharray': '6 5' })); }
          const lab = String(c).split('\n'), cfs = Math.min(18, Math.max(12, Math.floor(slot / 5.2))); lab.forEach((ln, k) => svg.appendChild(text(gx + gw / 2, box.t + box.ph + 22 + k * (cfs + 3), ln, { anchor: 'middle', fill: INK2, fw: 600, fs: cfs })));
        });
        const items = spec.series.map(s => ({ name: s.name, color: s.color }));
        if (spec.ref) items.push({ name: spec.ref.name, color: spec.ref.color || INK, dash: true });
        let lx = box.l; items.forEach(it => { if (it.dash) svg.appendChild(mk('line', { x1: lx, x2: lx + 30, y1: 22, y2: 22, stroke: it.color, 'stroke-width': 3, 'stroke-dasharray': '6 5' })); else svg.appendChild(mk('rect', { x: lx, y: 13, width: 18, height: 18, rx: 4, fill: it.color })); svg.appendChild(text(lx + (it.dash ? 38 : 26), 22, it.name, { fs: 18, fill: INK2 })); lx += (it.dash ? 38 : 26) + it.name.length * 10.5 + 30; });
        if (y.label) svg.appendChild(text(0, 0, y.label, { anchor: 'middle', fill: INK, fs: 20, fw: 600, transform: `translate(${box.l - 54} ${box.t + box.ph / 2}) rotate(-90)` }));
        return svg;
      },
      warp(spec, w, h) {
        const m = Object.assign({ l: 96, r: 30, t: 30, b: 84 }, spec.margin || {});
        const box = { l: m.l, t: m.t, pw: w - m.l - m.r, ph: h - m.t - m.b };
        const svg = mk('svg', { viewBox: `0 0 ${w} ${h}` });
        const s2 = { x: { min: 0, max: 1, ticks: [0, 0.5, 1], label: spec.xlabel || 'Action noise level  σₐ' }, y: { min: 0, max: 1, ticks: [0, 0.5, 1], label: spec.ylabel || 'Video noise level  σᵥ' }, tickFs: 18, labelFs: 21 };
        const { X, Y } = axes(svg, s2, box);
        const warp = (s, z) => z * s / (1 + (z - 1) * s);
        const zetas = spec.zetas || [1, 2, 3, 5], colors = spec.colors || ['#C0392B', '#8FB56A', '#5E9470', '#2E5A3C'];
        const items = [];
        zetas.forEach((z, i) => { const pts = []; for (let k = 0; k <= 80; k++) { const s = k / 80; pts.push([X(s), Y(warp(s, z))]); } svg.appendChild(mk('path', { d: pathFrom(pts), fill: 'none', stroke: colors[i], 'stroke-width': z === 1 ? 3.5 : 4, 'stroke-linecap': 'round', 'stroke-dasharray': z === 1 ? '10 8' : null })); items.push({ name: z === 1 ? 'shared schedule  ς = 1' : `warped  ς = ${z}`, color: colors[i], dash: z === 1 }); });
        if (spec.probe != null) { const z = spec.probeZeta || zetas[zetas.length - 1], sa = spec.probe, sv = warp(sa, z); svg.appendChild(mk('line', { x1: X(sa), x2: X(sa), y1: Y(0), y2: Y(sv), stroke: INK, 'stroke-dasharray': '5 5' })); svg.appendChild(mk('line', { x1: X(0), x2: X(sa), y1: Y(sv), y2: Y(sv), stroke: INK, 'stroke-dasharray': '5 5' })); svg.appendChild(mk('circle', { cx: X(sa), cy: Y(sv), r: 8, fill: colors[zetas.indexOf(z)] || INK, stroke: '#fff', 'stroke-width': 2.5 })); svg.appendChild(mk('circle', { cx: X(sa), cy: Y(sa), r: 6, fill: colors[0], stroke: '#fff', 'stroke-width': 2 })); svg.appendChild(text(X(sa) + 14, Y(sv) - 18, `σᵥ = ${sv.toFixed(2)} at σₐ = ${sa.toFixed(2)}`, { fs: box.ph < 260 ? 15 : 18, fw: 700, fill: INK })); }
        const small = box.ph < 260; legend(svg, items, box.l + 16, box.t + (small ? 16 : 24), { fs: small ? 15 : 18, gap: small ? 22 : 30 });
        svg.appendChild(text(X(1) - 8, Y(1) - 16, 'pure noise', { anchor: 'end', italic: true, fs: 16, fill: '#8B919C' }));
        svg.appendChild(text(X(0) + 8, Y(0) - 14, 'clean', { italic: true, fs: 16, fill: '#8B919C' }));
        return svg;
      }
    };
    let tip = null;
    function attachTips(el, svg) {
      if (!tip) { tip = document.createElement('div'); tip.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;padding:8px 12px;border-radius:10px;background:#0B1A3A;color:#fff;font:600 13px/1.35 system-ui,-apple-system,Segoe UI,Helvetica,Arial,sans-serif;box-shadow:0 8px 24px rgba(11,26,58,.25);opacity:0;transition:opacity .12s;white-space:normal;max-width:300px;width:max-content'; document.body.appendChild(tip); }
      const show = (e, t) => { const [h, v] = t.dataset.tip.split('\n'); tip.innerHTML = `<span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${t.dataset.color || '#fff'};margin-right:7px;vertical-align:1px"></span>${h}<br><span style="font-family:'JetBrains Mono',ui-monospace,monospace;font-weight:700;font-size:15px">${v}</span>`; move(e); tip.style.opacity = 1; t.__r0 = t.__r0 || t.getAttribute('r'); if (t.tagName === 'circle') t.setAttribute('r', +t.__r0 * 1.45); else t.style.filter = 'brightness(1.12)'; };
      const move = e => { const r = tip.getBoundingClientRect(), w = r.width || 160, h = r.height || 44; let x = e.clientX - w / 2, y = e.clientY - h - 14; x = Math.max(8, Math.min(innerWidth - w - 8, x)); if (y < 8) y = e.clientY + 18; tip.style.left = x + 'px'; tip.style.top = y + 'px'; };
      const hide = t => { tip.style.opacity = 0; if (t.tagName === 'circle' && t.__r0) t.setAttribute('r', t.__r0); else t.style.filter = ''; };
      svg.querySelectorAll('[data-tip]').forEach(t => { t.style.cursor = 'crosshair'; t.addEventListener('pointerenter', e => show(e, t)); t.addEventListener('pointermove', move); t.addEventListener('pointerleave', () => hide(t)); });
    }
    function render(el) {
      const spec = parseJSON(el.dataset.chart); if (!spec || !build[spec.type]) { el.innerHTML = '<div class="anim-fallback">Chart: invalid JSON in data-chart</div>'; return; }
      const w = parseFloat(el.style.width) || el.offsetWidth || 800, h = parseFloat(el.style.height) || el.offsetHeight || 500;
      el.innerHTML = ''; const svg = build[spec.type](spec, w, h); el.appendChild(svg); attachTips(el, svg);
    }
    return { render, renderAll: (root = document) => $$('[data-chart]', root).forEach(render) };
  })();

  window.CtrlWAMCharts = Charts;
})();
