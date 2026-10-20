// --- Curse Trading FAQ Chatbot (floating launcher) ---
// This button just links to chat.html, a full-page chat experience (rule-based, client-side only,
// zero access to buyer/order/admin data — see chat.html for the actual Q&A logic).
(function () {
  function injectStyles() {
    const css = `
      #ct-chat-btn { position:fixed; bottom:20px; right:20px; width:56px; height:56px; border-radius:50%;
        background:linear-gradient(135deg,#ef4444,#991b1b); border:none; color:#fff; font-size:24px; cursor:pointer;
        box-shadow:0 4px 16px rgba(239,68,68,0.5); z-index:1000; transition:transform 0.15s ease;
        display:flex; align-items:center; justify-content:center; text-decoration:none; }
      #ct-chat-btn:active { transform:scale(0.92); }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function init() {
    injectStyles();
    const btn = document.createElement('a');
    btn.id = 'ct-chat-btn';
    btn.href = 'chat.html';
    btn.setAttribute('aria-label', 'Chat with us');
    btn.textContent = '💬';
    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
