// Bottom tab bar shown on the main customer pages (Home · Read · Wishlist · Profile).
// Add to a page with:  <script src="customer-nav.js"></script>   (the current page's tab is highlighted automatically)
// The page's own <body> gets bottom padding so this bar never covers content — no other changes needed.
(function () {
  const TABS = [
    ['index.html', 'Home', '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/>'],
    ['read.html', 'Read', '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 1 4 18.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v18h5.5a2.5 2.5 0 0 0 2.5-2.5Z"/>'],
    ['wishlist.html', 'Wishlist', '<path d="M12 20.5s-7.5-4.6-10-9.3C.4 7.8 2 4.5 5.3 4A5 5 0 0 1 12 7a5 5 0 0 1 6.7-3c3.3.5 4.9 3.8 3.3 7.2-2.5 4.7-10 9.3-10 9.3Z"/>'],
    ['my-account.html', 'Profile', '<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20v-.5a7.5 7.5 0 0 1 15 0v.5"/>']
  ];
  const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  const st = document.createElement('style');
  st.textContent = `
body{padding-bottom:calc(64px + env(safe-area-inset-bottom)) !important;}
/* A page's own stylesheet may style the "nav" tag itself (for its top navbar) — top:0, sticky, padding, etc.
   Everything this bar cares about is set explicitly below, including properties that rule wouldn't otherwise
   touch (top, height, margin, border-bottom, align-items...), so none of that leaks onto this one.
   Style: icon-only bar with a rounded "pill" highlight behind the active icon (YouTube-style), not a literal
   copy — our own icon set and brand-red accent, with an always-present accessible label for each tab. */
.cbar{all:unset;box-sizing:border-box;position:fixed;top:auto;left:0;right:0;bottom:0;height:auto;
  margin:0;z-index:50;display:flex;align-items:stretch;justify-content:stretch;
  background:rgba(12,12,13,.97);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
  border:0;padding:6px 6px calc(6px + env(safe-area-inset-bottom));
  box-shadow:0 -6px 20px rgba(0,0,0,.4);}
.cbar a{all:unset;box-sizing:border-box;flex:1 1 0;display:flex;align-items:center;justify-content:center;
  padding:5px 2px;color:#9c9ca3;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.cbar a .ico{display:flex;align-items:center;justify-content:center;width:50px;height:38px;border-radius:19px;
  transition:background-color .18s ease,color .18s ease;}
.cbar a svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:transform .15s ease;}
.cbar a:active .ico svg{transform:scale(.88);}
.cbar a:focus-visible .ico{outline:2px solid #ef4444;outline-offset:-2px;}
.cbar a[aria-current="page"]{color:#fff;}
.cbar a[aria-current="page"] .ico{background:#ef4444;}
.cbar a .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
  clip:rect(0,0,0,0);white-space:nowrap;border:0;}`;
  document.head.appendChild(st);

  // A <div role="navigation"> rather than a real <nav> tag: it's the same accessibility landmark, but it
  // avoids colliding with a page's own "document.querySelector('nav')" or tag-selector CSS aimed at its
  // top navbar — on a page with no <nav> of its own (my-account.html, coins.html), blaze-coins.js looks for
  // the first "nav" element to mount its coin-balance chip into, and a real <nav> here would wrongly catch that.
  const nav = document.createElement('div');
  nav.className = 'cbar';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Main sections');
  TABS.forEach(([href, label, svg]) => {
    const a = document.createElement('a');
    a.href = href;
    a.setAttribute('aria-label', label);
    if (href === here) a.setAttribute('aria-current', 'page');
    a.innerHTML = `<span class="ico"><svg viewBox="0 0 24 24">${svg}</svg></span><span class="sr-only">${label}</span>`;
    nav.appendChild(a);
  });
  document.body.appendChild(nav);
})();
