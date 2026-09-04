// --- Curse Trading FAQ Chatbot ---
// Rule-based, client-side only. Has ZERO access to buyer data, orders, or
// admin info — it only knows the fixed Q&A list below. Safe by design:
// there's nothing private for it to leak, because it was never given
// anything private in the first place.
(function () {
  const FAQ = [
    { keys: ['buy', 'purchase', 'how do i get', 'how to order'],
      a: 'Browse the <a href="ebooks.html">Ebooks page</a>, tap "Buy now" on any title, and complete payment securely. Your download link is emailed to you right after.' },
    { keys: ['refund', 'money back', 'cancel'],
      a: 'Refunds are available for corrupted files, wrong titles, or double charges — usually within 7 days of purchase. Full details on our <a href="refund-policy.html">Refund Policy</a> page.' },
    { keys: ['deliver', 'download', 'where is my book', "didn't receive", 'havent received'],
      a: 'Your ebook is emailed as a download link right after payment confirms. Check spam if it hasn\'t arrived — if it\'s still missing, contact us and we\'ll resend it.' },
    { keys: ['privacy', 'my data', 'my email', 'safe'],
      a: 'We only use your email to deliver your purchase — we never sell or share it. Full details on our <a href="privacy.html">Privacy Policy</a> page.' },
    { keys: ['terms', 'condition', 'license', 'resell'],
      a: 'Buying an ebook gives you a personal license to read it — reselling or redistributing isn\'t allowed. See our <a href="terms.html">Terms & Conditions</a>.' },
    { keys: ['who runs', 'who owns', 'seller', 'company', 'about'],
      a: 'This store is run by a single independent seller — every ebook is sold directly, no distributor or reseller involved.' },
    { keys: ['contact', 'reach', 'support', 'help', 'grievance', 'complaint'],
      a: 'You can reach us directly at the contact listed on our <a href="privacy.html">Privacy Policy</a> page.' },
    { keys: ['payment', 'pay', 'card', 'upi'],
      a: 'Checkout is handled through a secure payment page — you\'ll see the accepted payment options at checkout.' },
    { keys: ['lost', 'again', 'redownload', 're-download'],
      a: 'If you lose your download link, just contact us with your order details and we\'ll help you get it again.' },
    { keys: ['hi', 'hello', 'hey'],
      a: 'Hey! I can help with questions about buying, refunds, delivery, or our policies. What do you need?' },
  ];

  const FALLBACK = 'I\'m not sure about that one — I can only help with questions about buying, refunds, delivery, and our policies. For anything else, please reach out directly via our <a href="privacy.html">contact info</a>.';
  const PRIVACY_DEFLECT = 'I don\'t have access to any buyer, order, or admin information — I can only answer general questions about how the store works.';
  const PRIVATE_TOPIC_WORDS = ['buyer', 'customer list', 'order id', 'admin', 'password', 'who bought', 'someone else', 'their email', 'his email', 'her email'];

  function findAnswer(text) {
    const t = text.toLowerCase();
    if (PRIVATE_TOPIC_WORDS.some(w => t.includes(w))) return PRIVACY_DEFLECT;
    for (const entry of FAQ) {
      if (entry.keys.some(k => t.includes(k))) return entry.a;
    }
    return FALLBACK;
  }

  function injectStyles() {
    const css = `
      #ct-chat-btn { position:fixed; bottom:20px; right:20px; width:56px; height:56px; border-radius:50%;
        background:linear-gradient(135deg,#ef4444,#991b1b); border:none; color:#fff; font-size:24px; cursor:pointer;
        box-shadow:0 4px 16px rgba(239,68,68,0.5); z-index:1000; transition:transform 0.15s ease; }
      #ct-chat-btn:active { transform:scale(0.92); }
      #ct-chat-panel { position:fixed; bottom:88px; right:20px; width:min(320px,88vw); max-height:70vh;
        background:#0f0f0f; border:1px solid #262626; border-radius:14px; display:none; flex-direction:column;
        overflow:hidden; z-index:1000; box-shadow:0 10px 40px rgba(0,0,0,0.6); }
      #ct-chat-panel.open { display:flex; }
      #ct-chat-header { padding:14px 16px; background:linear-gradient(135deg,#ef4444,#991b1b); color:#fff;
        font-weight:600; font-size:14px; display:flex; justify-content:space-between; align-items:center; }
      #ct-chat-header button { background:none; border:none; color:#fff; font-size:18px; cursor:pointer; }
      #ct-chat-messages { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px; }
      .ct-msg { max-width:85%; padding:8px 12px; border-radius:10px; font-size:13px; line-height:1.5; }
      .ct-msg a { color:#fca5a5; }
      .ct-msg.bot { background:#1a1a1a; color:#f5f5f5; align-self:flex-start; }
      .ct-msg.user { background:#ef4444; color:#fff; align-self:flex-end; }
      #ct-chat-input-row { display:flex; border-top:1px solid #262626; }
      #ct-chat-input { flex:1; background:#0f0f0f; border:none; padding:12px; color:#fff; font-size:13px; }
      #ct-chat-input:focus { outline:none; }
      #ct-chat-send { background:none; border:none; color:#ef4444; font-weight:600; padding:0 16px; cursor:pointer; }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function addMessage(container, text, who) {
    const div = document.createElement('div');
    div.className = 'ct-msg ' + who;
    div.innerHTML = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function init() {
    injectStyles();

    const btn = document.createElement('button');
    btn.id = 'ct-chat-btn';
    btn.setAttribute('aria-label', 'Chat with us');
    btn.textContent = '💬';

    const panel = document.createElement('div');
    panel.id = 'ct-chat-panel';
    panel.innerHTML = `
      <div id="ct-chat-header"><span>Ask us anything</span><button id="ct-chat-close" aria-label="Close">✕</button></div>
      <div id="ct-chat-messages"></div>
      <div id="ct-chat-input-row">
        <input id="ct-chat-input" type="text" placeholder="Type a question…" />
        <button id="ct-chat-send">Send</button>
      </div>
    `;

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    const messages = panel.querySelector('#ct-chat-messages');
    const input = panel.querySelector('#ct-chat-input');
    let greeted = false;

    btn.addEventListener('click', () => {
      panel.classList.toggle('open');
      if (panel.classList.contains('open') && !greeted) {
        addMessage(messages, 'Hi! Ask me about buying, delivery, refunds, or our policies — I\'m here 24/7.', 'bot');
        greeted = true;
      }
    });
    panel.querySelector('#ct-chat-close').addEventListener('click', () => panel.classList.remove('open'));

    function send() {
      const text = input.value.trim();
      if (!text) return;
      addMessage(messages, text.replace(/</g, '&lt;'), 'user');
      input.value = '';
      setTimeout(() => addMessage(messages, findAnswer(text), 'bot'), 300);
    }
    panel.querySelector('#ct-chat-send').addEventListener('click', send);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
