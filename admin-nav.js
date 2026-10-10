// Tab bar shared by every admin page (Dashboard · Manage Content · Legal pages · Theme).
// Add to a page with:  <script src="admin-nav.js"></script>   (the current page's tab is highlighted automatically)
(function () {
  const TABS = [
    ['admin-dashboard.html', 'Dashboard'],
    ['admin-content.html', 'Manage Content'],
    ['admin-legal.html', 'Legal pages'],
    ['admin-theme.html', 'Theme']
  ];
  const here = (location.pathname.split('/').pop() || '').toLowerCase();

  const st = document.createElement('style');
  st.textContent = `
.atabs{display:flex;gap:0;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;border-bottom:1px solid #262626;background:#0a0a0a;margin:0 auto;max-width:100%;padding:0}
.atabs::-webkit-scrollbar{display:none}
.atabs a{position:relative;flex:1 1 auto;text-align:center;white-space:nowrap;padding:15px 8px 13px;color:#a3a3a3;text-decoration:none;font:500 14px/1.2 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;letter-spacing:.1px;-webkit-tap-highlight-color:transparent}
.atabs a:active{background:rgba(255,255,255,.04)}
.atabs a[aria-current="page"]{color:#ef4444;font-weight:700}
.atabs a[aria-current="page"]::after{content:"";position:absolute;left:18%;right:18%;bottom:0;height:3px;border-radius:3px 3px 0 0;background:#ef4444}`;
  document.head.appendChild(st);

  const nav = document.createElement('nav');
  nav.className = 'atabs';
  nav.setAttribute('aria-label', 'Admin sections');
  TABS.forEach(([href, label]) => {
    const a = document.createElement('a');
    a.href = href; a.textContent = label;
    if (href === here) a.setAttribute('aria-current', 'page');
    nav.appendChild(a);
  });

  // On pages whose <body> has side padding, stretch the bar edge to edge.
  const cs = getComputedStyle(document.body), pl = parseFloat(cs.paddingLeft) || 0, pt = parseFloat(cs.paddingTop) || 0;
  if (!document.querySelector('body > header') && (pl || pt)) { nav.style.margin = `-${pt}px -${pl}px 14px`; nav.style.maxWidth = 'none'; }

  const header = document.querySelector('body > header');
  if (header) header.insertAdjacentElement('afterend', nav);
  else document.body.insertBefore(nav, document.body.firstChild);
})();
