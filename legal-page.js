// Shows one legal page. The page is chosen by <body data-legal="contact"> or by legal.html?p=contact.
(function () {
  const $ = id => document.getElementById(id);
  const FOOT = [['terms.html', 'Terms'], ['privacy.html', 'Privacy'], ['refund-policy.html', 'Refund Policy'], ['contact.html', 'Contact'], ['grievance.html', 'Grievance'], ['cookie-policy.html', 'Cookies'], ['digital-delivery.html', 'Digital delivery'], ['coins-terms.html', 'Blaze Coins']];

  async function boot() {
    const slug = document.body.dataset.legal || new URLSearchParams(location.search).get('p') || '';
    const page = LEGAL.find(/^[a-z-]+$/.test(slug) ? slug : '');
    const body = $('legalBody');
    const foot = $('legalFoot');
    FOOT.forEach(([href, label]) => { const a = document.createElement('a'); a.href = href; a.textContent = label; foot.appendChild(a); });
    if (!page) { $('legalTitle').textContent = 'Page not found'; return; }

    document.title = page.title + ' | Curse Trading';
    $('legalTitle').textContent = page.title;
    $('legalSub').textContent = page.sub || '';

    const r = await LEGAL.load(page.slug);
    const text = (r && r.text || '').trim();

    // Never show unfinished text: an empty page, or one that still has a [[ blank ]], is not published.
    if (!text || LEGAL.hasBlanks(text)) {
      const p = document.createElement('p'); p.className = 'muted';
      p.textContent = 'This page is being updated. Please check back soon.';
      body.textContent = ''; body.appendChild(p); return;
    }
    LEGAL.render(text, body);
    if (r.updated && !isNaN(Date.parse(r.updated))) {
      $('legalDate').textContent = 'Last updated: ' + new Date(r.updated).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }
  document.addEventListener('DOMContentLoaded', boot);
  document.addEventListener('DOMContentLoaded', () => { const i = document.querySelector('header img'); if (i) i.addEventListener('error', () => { i.style.display = 'none'; }); });
})();
