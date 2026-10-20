// Bottom tab bar shown on the main customer pages (Home · Read · Wishlist · Profile).
// Add to a page with:  <script src="customer-nav.js"></script>   (the current page's tab is highlighted automatically)
// The page's own <body> gets bottom padding so this bar never covers content — no other changes needed.
(function () {
  const TABS = [
    ['index.html', 'Home', 'svg', '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/>'],
    ['read.html', 'Read', 'svg', '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 1 4 18.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v18h5.5a2.5 2.5 0 0 0 2.5-2.5Z"/>'],
    ['wishlist.html', 'Wishlist', 'emoji', '💕'],
    ['my-account.html', 'Profile', 'svg', '<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20v-.5a7.5 7.5 0 0 1 15 0v.5"/>']
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
.cbar a .emoji-ico{font-size:19px;line-height:1;display:flex;align-items:center;justify-content:center;transition:transform .15s ease;}
.cbar a:active .ico svg,.cbar a:active .ico .emoji-ico{transform:scale(.88);}
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
  TABS.forEach(([href, label, kind, content]) => {
    const a = document.createElement('a');
    a.href = href;
    a.setAttribute('aria-label', label);
    if (href === here) a.setAttribute('aria-current', 'page');
    const iconHtml = kind === 'emoji'
      ? `<span class="emoji-ico" aria-hidden="true">${content}</span>`
      : `<svg viewBox="0 0 24 24">${content}</svg>`;
    a.innerHTML = `<span class="ico">${iconHtml}</span><span class="sr-only">${label}</span>`;
    nav.appendChild(a);
  });
  document.body.appendChild(nav);

  // A third-party widget on the page (e.g. a support chat bubble from chatbot.js) can float at a fixed
  // position that now collides with this bar — on index.html it was observed sitting right on top of the
  // Profile tab. We don't control that script's source, so instead of guessing its id/class, find any
  // element that actually overlaps this bar's own box and nudge it up to clear the bar.
  //
  // Many embeddable chat widgets (Tawk.to/Crisp/Intercom/Tidio-style) don't make the round bubble itself
  // the fixed element — they wrap it in a FULL-SCREEN `position:fixed` container (so it can later expand
  // into a full chat window), with `pointer-events:none` on that wrapper and the actual small, clickable
  // button positioned *inside* it. A plain "find a small fixed element" check misses that pattern entirely
  // (the fixed element is huge, not small), so this also looks at small elements nested inside a fixed
  // ancestor, which is what the visible round bubble usually is in that setup.
  function clearOverlappingWidgets() {
    const navRect = nav.getBoundingClientRect();
    if (!navRect.width || !navRect.height) return;
    const MAX_DIM = 170; // a real launcher button/badge is roughly 40-110px; this covers padding/shadow
    // without ever matching a full-page overlay or an ordinary content block.

    function inFixedSubtree(el) {
      let node = el.parentElement;
      while (node && node !== document.body) {
        if (getComputedStyle(node).position === 'fixed') return true;
        node = node.parentElement;
      }
      return false;
    }
    function hasClearedAncestor(el) {
      let node = el.parentElement;
      while (node && node !== document.body) {
        if (node.dataset && node.dataset.cbarCleared === '1') return true;
        node = node.parentElement;
      }
      return false;
    }

    // Walk every element on the page (not just body's direct children) — the real bubble is often nested
    // a few levels inside its own widget's wrapper markup, not a direct child of <body>.
    document.querySelectorAll('body *').forEach(el => {
      if (el === nav || nav.contains(el)) return;
      if (el.closest('#introSplash')) return;
      if (el.dataset.cbarCleared === '1') return;
      if (hasClearedAncestor(el)) { el.dataset.cbarCleared = '1'; return; } // its already-moved ancestor carries it along

      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return;
      if (cs.pointerEvents === 'none') return; // a decorative/pass-through wrapper, not the real tap target

      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (r.width > MAX_DIM || r.height > MAX_DIM) return; // not button-sized — skip (covers both a huge
      // overlay wrapper AND ordinary page content, neither of which should ever get nudged)

      const overlaps = r.right > navRect.left && r.left < navRect.right && r.bottom > navRect.top && r.top < navRect.bottom;
      if (!overlaps) return;

      // Only touch something that's actually floating above the page, not in-flow content that merely
      // happens to be small and near the bottom of the viewport right now (e.g. a card while scrolling).
      const floating = cs.position === 'fixed' || cs.position === 'sticky' || (cs.position === 'absolute' && inFixedSubtree(el));
      if (!floating) return;

      const needed = navRect.height + 14;
      const curBottom = parseFloat(cs.bottom);
      if (!isNaN(curBottom)) {
        el.style.setProperty('bottom', `calc(${curBottom}px + ${needed}px + env(safe-area-inset-bottom))`, 'important');
      } else {
        // Not positioned via "bottom" (e.g. placed with a transform instead) — shift it up visually either way.
        const curT = cs.transform && cs.transform !== 'none' ? cs.transform + ' ' : '';
        el.style.setProperty('transform', `${curT}translateY(-${needed}px)`, 'important');
      }
      el.dataset.cbarCleared = '1';
    });
  }

  clearOverlappingWidgets();
  // Widely spaced retries cover widgets that load their bubble late over the network (slow 3G, a third-party
  // CDN, etc.) — up to 8s after page load.
  [150, 400, 800, 1500, 3000, 5000, 8000].forEach(ms => setTimeout(clearOverlappingWidgets, ms));
  // A widget that already exists but animates/resizes itself into place (rather than inserting a brand-new
  // element) only fires a style/class change, not a childList change — watch both, debounced to one check
  // per animation frame so this stays cheap even on a page with other frequent DOM activity.
  let pendingCheck = false;
  function scheduleCheck() {
    if (pendingCheck) return;
    pendingCheck = true;
    requestAnimationFrame(function () { pendingCheck = false; clearOverlappingWidgets(); });
  }
  new MutationObserver(scheduleCheck).observe(document.body, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class']
  });
})();
