// Loading orb. Plain CSS only (no third-party code): a glowing sphere with a swirling light inside and a soft pulsing halo.
// It takes the site's accent colour (--accent) so it follows the active theme.
(function () {
  const s = document.createElement('style');
  s.textContent = `
.orb{--o:var(--accent,#ef4444);position:relative;display:inline-block;vertical-align:middle;width:var(--sz,64px);height:var(--sz,64px);border-radius:50%;
  background:radial-gradient(circle at 34% 28%,#fff 0,color-mix(in srgb,var(--o) 55%,#fff) 14%,var(--o) 44%,color-mix(in srgb,var(--o) 35%,#000) 100%);
  box-shadow:0 0 calc(var(--sz,64px)*.35) color-mix(in srgb,var(--o) 70%,transparent),inset 0 -6px 14px rgba(0,0,0,.45);
  animation:orbfloat 2.4s ease-in-out infinite}
.orb::before{content:"";position:absolute;inset:6%;border-radius:50%;
  background:conic-gradient(from 0deg,transparent 0 55%,rgba(255,255,255,.75) 72%,transparent 88%);
  -webkit-mask:radial-gradient(circle,transparent 38%,#000 40%,#000 100%);mask:radial-gradient(circle,transparent 38%,#000 40%,#000 100%);
  animation:orbspin 1.6s linear infinite;mix-blend-mode:screen}
.orb::after{content:"";position:absolute;inset:-22%;border-radius:50%;border:1px solid color-mix(in srgb,var(--o) 60%,transparent);
  animation:orbring 2.4s ease-out infinite}
.orb.fast::before{animation-duration:.9s}.orb.fast{animation-duration:1.4s}
.orb.small{--sz:18px}.orb.small::before{inset:8%}.orb.small::after{display:none}
.orb-wrap{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;gap:22px;padding:48px 0;color:#a3a3a3;font-size:14px}
@keyframes orbspin{to{transform:rotate(360deg)}}
@keyframes orbfloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-4px) scale(1.05)}}
@keyframes orbring{0%{transform:scale(.8);opacity:.9}100%{transform:scale(1.5);opacity:0}}
@media (prefers-reduced-motion:reduce){.orb,.orb::before,.orb::after{animation:none!important}}`;
  document.head.appendChild(s);
  // state: 'searching' (faster swirl) or anything else (calm). size: pixels; 32 or less gives a small inline orb.
  window.orbHTML = (state, size) => `<span class="orb ${state === 'searching' ? 'fast' : ''} ${(size || 64) <= 32 ? 'small' : ''}" role="img" aria-label="Loading"></span>`;
  window.orbBlock = (state, label) => `<div class="orb-wrap">${orbHTML(state, 64)}${label ? `<span>${String(label).replace(/[&<>"']/g, '')}</span>` : ''}</div>`;
})();
