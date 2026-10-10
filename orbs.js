// Orb: a dotted, animated sphere for loading states, in the style of the Libraries.dev "Orb".
// Written from scratch for this site (plain canvas, no library, no React, nothing downloaded).
//
//   orbHTML(state, size)          -> HTML string with an orb (size 64 = large, 20 = inline-with-text)
//   orbBlock(state, label)        -> a centred large orb with a text label under it
//   Orb.mount(element, state, size, opts)   -> puts an orb into an element
//   states: working | searching | solving | listening | connecting | weaving | composing | breathing | shaping
//   opts:   { speed: 1, dark: true, paused: false }
(function () {
  const STATES = ['working', 'searching', 'solving', 'listening', 'connecting', 'weaving', 'composing', 'breathing', 'shaping'];
  const GA = Math.PI * (3 - Math.sqrt(5));
  const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cloud = {};   // point cloud per dot count, built once

  function points(n) {
    if (cloud[n]) return cloud[n];
    const a = [];
    for (let i = 0; i < n; i++) {
      const y = 1 - 2 * (i + .5) / n, r = Math.sqrt(1 - y * y), th = i * GA;
      a.push({ i, u: i / n, x: r * Math.cos(th), y, z: r * Math.sin(th), ring: Math.round(y * 7) });
    }
    return (cloud[n] = a);
  }

  const live = new Set();
  let raf = 0, t0 = performance.now();

  function draw(o, t) {
    const { ctx, size, dpr } = o, st = o.state, sp = o.speed, ts = t * sp, R = size / 2 * .9, c = size / 2;
    const pts = o.pts, n = pts.length, dark = o.dark, tilt0 = .45;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const dot = size >= 40 ? 1.15 : .85;           // dot size is tuned separately for the small orb
    for (let k = 0; k < n; k++) {
      const p = pts[k];
      let x = p.x, y = p.y, z = p.z, a = 1, s = 1, rot = ts * .7, scale = 1, tilt = tilt0;
      switch (st) {
        case 'working': a = .55 + .45 * Math.sin(ts * 2.2 + k * .7); rot = ts * .6; break;
        case 'searching': { const d = y - (Math.sin(ts * 1.1) * .95); const g = Math.exp(-d * d * 14); a = .3 + .7 * g; s = 1 + .7 * g; rot = ts * 1.25; break; }
        case 'solving': { const ax = Math.sin(ts * .9), ay = Math.cos(ts * 1.3), d = (x * ax + y * ay) - Math.sin(ts * 1.7) * .7; const g = Math.exp(-d * d * 10); a = .3 + .7 * g; s = 1 + .5 * g; scale = 1 + .06 * g; rot = ts * .8; break; }
        case 'listening': { const m = .5 + .5 * Math.sin(ts * 5 + p.ring * 1.3 + Math.sin(ts * 2.1 + p.ring) * 2); scale = .78 + .22 * m; a = .35 + .65 * m; rot = ts * .3; break; }
        case 'connecting': { const side = y >= 0 ? 1 : -1; rot = ts * side; const w = Math.abs(y) - ((ts * .5) % 1); a = .4 + .6 * Math.exp(-w * w * 30); break; }
        case 'weaving': rot = ts * .9 * (p.ring % 2 ? 1 : -1); a = .55 + .45 * Math.sin(ts * 2 + p.ring); break;
        case 'composing': { const head = ((ts * .3) % 1) * n; const dist = head - k; a = dist >= 0 ? .95 - Math.min(.65, dist / n * 1.2) : .22; if (Math.abs(dist) < 3) s = 1.8; rot = ts * .4; break; }
        case 'breathing': { const b = .5 + .5 * Math.sin(ts * 1.6); scale = .72 + .28 * b; a = .4 + .6 * b; rot = ts * .25; break; }
        case 'shaping': { const m = .5 + .5 * Math.sin(ts * .9); y *= .28 + .72 * m; tilt = .55; rot = ts * .9; a = .6 + .4 * Math.sin(ts * 2 + k); break; }
      }
      const cr = Math.cos(rot), sr = Math.sin(rot);
      let rx = x * cr + z * sr, rz = -x * sr + z * cr, ry = y;
      const ct = Math.cos(tilt), stt = Math.sin(tilt);
      const ty = ry * ct - rz * stt, tz = ry * stt + rz * ct;
      const depth = (tz + 1) / 2;                                     // 0 = far side, 1 = near side
      const alpha = Math.max(0, Math.min(1, (.12 + .88 * depth) * a));
      const rad = dot * s * (.45 + .85 * depth);
      ctx.fillStyle = dark ? 'rgba(255,255,255,' + alpha.toFixed(3) + ')' : 'rgba(20,20,20,' + alpha.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(c + rx * R * scale, c + ty * R * scale, rad, 0, 6.2832);
      ctx.fill();
    }
  }

  function loop(now) {
    raf = 0;
    const t = (now - t0) / 1000;
    live.forEach(o => {
      if (!o.el.isConnected) { live.delete(o); return; }
      if (!o.paused) draw(o, t + o.offset);
    });
    if (live.size && !document.hidden && !REDUCED) raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (!raf && live.size && !REDUCED) raf = requestAnimationFrame(loop); };
  document.addEventListener('visibilitychange', kick);

  function setup(el, state, size, opts) {
    opts = opts || {};
    if (!STATES.includes(state)) state = 'working';
    size = size >= 40 ? 64 : 20;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = size * dpr; el.height = size * dpr;
    el.style.width = size + 'px'; el.style.height = size + 'px';
    const o = { el, ctx: el.getContext('2d'), state, size, dpr, pts: points(size === 64 ? 260 : 80), speed: opts.speed || 1, dark: opts.dark !== false, paused: !!opts.paused, offset: Math.random() * 5 };
    live.add(o);
    draw(o, o.offset);                                                // first frame straight away; reduced-motion users keep this still frame
    kick();
    return o;
  }

  function scan(root) {
    (root.querySelectorAll ? root.querySelectorAll('canvas.orbc:not([data-ready])') : []).forEach(el => {
      el.setAttribute('data-ready', '1');
      setup(el, el.getAttribute('data-orb'), +el.getAttribute('data-size'));
    });
  }
  // Orbs written with innerHTML start themselves as soon as they land on the page.
  new MutationObserver(m => m.forEach(r => r.addedNodes.forEach(n => { if (n.nodeType === 1) { if (n.matches && n.matches('canvas.orbc')) scan({ querySelectorAll: () => [n] }); else scan(n); } })))
    .observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => scan(document));

  const safeState = s => STATES.includes(s) ? s : 'working';
  window.Orb = {
    STATES,
    mount(parent, state, size, opts) {
      const c = document.createElement('canvas');
      c.className = 'orbc'; c.setAttribute('data-ready', '1'); c.setAttribute('role', 'img'); c.setAttribute('aria-label', 'Loading');
      parent.appendChild(c);
      return setup(c, safeState(state), size, opts);
    }
  };
  window.orbHTML = (state, size) => `<canvas class="orbc" data-orb="${safeState(state)}" data-size="${size >= 40 ? 64 : 20}" role="img" aria-label="Loading"></canvas>`;

  const st = document.createElement('style');
  st.textContent = `.orbc{display:inline-block;vertical-align:middle}
.orb-wrap{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;gap:14px;padding:44px 0;color:#a3a3a3;font-size:14px}`;
  document.head.appendChild(st);
  window.orbBlock = (state, label) => `<div class="orb-wrap">${orbHTML(state, 64)}${label ? `<span>${String(label).replace(/[&<>"']/g, '')}</span>` : ''}</div>`;
})();
