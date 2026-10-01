// In-site UPI checkout (Razorpay). Needs the two Supabase functions deployed and BLAZE_CONFIG.checkout = true.
(function () {
  let sb;
  const $ = (h) => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;padding:20px';
    d.innerHTML = `<div style="background:#171717;border:1px solid #262626;border-radius:14px;padding:24px;max-width:360px;width:100%;text-align:center;color:#f5f5f5;font-family:system-ui,sans-serif">${h}<button style="margin-top:16px;background:#ef4444;color:#fff;border:0;border-radius:8px;padding:10px 22px;font-weight:600;cursor:pointer">OK</button></div>`;
    d.querySelector('button').onclick = () => d.remove(); document.body.appendChild(d); };
  const loadRzp = () => window.Razorpay ? 0 : new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });

  async function buy(title, btn) {
    const label = btn.innerHTML, reset = () => { btn.innerHTML = label; btn.style.pointerEvents = ''; };
    btn.innerHTML = (window.orbHTML ? orbHTML('connecting', 20) + ' ' : '') + 'Please wait…'; btn.style.pointerEvents = 'none';
    try {
      sb = sb || supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { location.href = 'login.html'; return; }
      const { data: o, error } = await sb.functions.invoke('create-order', { body: { title } });
      if (error || !o || o.error) throw new Error((o && o.error) || 'Could not start payment');
      await loadRzp();
      new Razorpay({
        key: o.key, order_id: o.order_id, amount: o.amount, currency: 'INR', name: 'Curse Trading', description: title,
        prefill: { email: o.email }, theme: { color: '#ef4444' },
        handler: async (r) => {
          const wait = document.createElement('div'); wait.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;color:#f5f5f5;font-family:system-ui,sans-serif';
          wait.innerHTML = window.orbBlock ? orbBlock('composing', 'Confirming your payment…') : 'Confirming your payment…'; document.body.appendChild(wait);
          const { data: v, error: e2 } = await sb.functions.invoke('verify-payment', { body: { order_id: r.razorpay_order_id, payment_id: r.razorpay_payment_id, signature: r.razorpay_signature } });
          wait.remove(); reset();
          if (e2 || !v || v.error) return $('<h3>Payment received</h3><p>We are confirming it. If your ebook does not arrive, contact support with payment ID ' + r.razorpay_payment_id + '.</p>');
          $('<h3>Thank you! 🎉</h3><p>You earned <b style="color:#f5d36b">' + v.coins + ' Blaze Coins</b>.</p>' +
            (v.download_url ? '<p><a style="color:#ef4444" href="' + v.download_url + '" target="_blank" rel="noopener">Download your ebook</a></p>' : '<p>Your ebook will be sent to your email.</p>'));
          if (window.BlazeCoins) location.reload();
        },
        modal: { ondismiss: reset },
      }).open();
    } catch (e) { reset(); $('<h3>Something went wrong</h3><p>' + (e.message || e) + '</p>'); }
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-buy]');
    if (!a || !(window.BLAZE_CONFIG && BLAZE_CONFIG.checkout)) return;   // otherwise the old payment link works as before
    e.preventDefault(); buy(a.dataset.buy, a);
  });
})();
