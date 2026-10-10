// Loading indicator. No third-party code: a plain CSS spinner (the earlier "orb" library was removed for supply-chain safety).
(function () {
  const s = document.createElement('style');
  s.textContent = `.orb-fb{display:inline-block;vertical-align:middle;width:var(--fb,20px);height:var(--fb,20px);border:2px solid #333;border-top-color:var(--accent,#ef4444);border-radius:50%;animation:orbspin .8s linear infinite}
.orb-wrap{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;gap:10px;padding:40px 0;color:#a3a3a3;font-size:14px}
@keyframes orbspin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){.orb-fb{animation:none}}`;
  document.head.appendChild(s);
  window.orbHTML = (state, size) => `<span class="orb-fb" style="--fb:${(size || 64) > 32 ? 32 : 16}px"></span>`;
  window.orbBlock = (state, label) => `<div class="orb-wrap">${orbHTML(state, 64)}${label ? `<span>${String(label).replace(/[&<>"']/g, '')}</span>` : ''}</div>`;
})();
