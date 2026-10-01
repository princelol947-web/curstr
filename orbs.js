// Loading orbs (Thinking Orbs, MIT, Jakub Antalik) via the framework-free "thinking-orbs-universal" web component.
// If the orb library can't load, a plain CSS spinner shows instead, so loading screens never break.
(function () {
  const s = document.createElement('style');
  s.textContent = `.orb-fb{display:none;width:var(--fb,20px);height:var(--fb,20px);border:2px solid #333;border-top-color:var(--accent,#ef4444);border-radius:50%;animation:orbspin .8s linear infinite}
thinking-orb:not(:defined) .orb-fb{display:inline-block}
thinking-orb{--orb-color-dark:var(--accent,#ef4444);display:inline-block;vertical-align:middle}
.orb-wrap{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;gap:10px;padding:40px 0;color:#a3a3a3;font-size:14px}
@keyframes orbspin{to{transform:rotate(360deg)}}`;
  document.head.appendChild(s);
  import('https://esm.sh/thinking-orbs-universal/web-component').catch(function () {});
  // states: working | searching | solving | listening | composing | shaping
  window.orbHTML = (state, size) => `<thinking-orb state="${state || 'working'}" size="${size || 64}" theme="dark"><span class="orb-fb" style="--fb:${(size || 64) > 32 ? 32 : 16}px"></span></thinking-orb>`;
  window.orbBlock = (state, label) => `<div class="orb-wrap">${orbHTML(state, 64)}${label ? `<span>${label}</span>` : ''}</div>`;
})();
