// When a phone uses Chrome's "Desktop site" mode, show the normal phone layout instead of a tiny shrunken desktop page.
(function () {
  var touch = (navigator.maxTouchPoints || 0) > 0;
  var phoneScreen = Math.min(screen.width, screen.height) <= 600;
  var desktopUA = !/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  if (!touch || !phoneScreen || !desktopUA) return;       // normal phones and real desktops are left alone

  var W = 390;                                            // the phone layout width we want
  var meta = document.querySelector('meta[name=viewport]');
  if (meta) meta.setAttribute('content', 'width=' + W + ', initial-scale=1');

  // Pretend the screen is W px wide for the page's width-based CSS rules (e.g. max-width: 480px)
  function remap() {
    var re = /^(\(\s*(?:max|min)-width\s*:\s*[\d.]+px\s*\)\s*(?:and\s*)?)+$/i;
    for (var i = 0; i < document.styleSheets.length; i++) {
      var rules; try { rules = document.styleSheets[i].cssRules; } catch (e) { continue; }
      for (var j = 0; j < rules.length; j++) {
        var r = rules[j];
        if (r.type !== 4 || !re.test(r.media.mediaText)) continue;
        var ok = true, m, g = /\(\s*(max|min)-width\s*:\s*([\d.]+)px\s*\)/gi;
        while ((m = g.exec(r.media.mediaText))) {
          var n = parseFloat(m[2]);
          if (m[1].toLowerCase() === 'max' ? W > n : W < n) ok = false;
        }
        r.media.mediaText = ok ? 'all' : 'not all';
      }
    }
  }

  function apply() {
    var vw = window.innerWidth;
    if (vw <= 700) return;                                // the viewport tag worked, nothing more to do
    var root = document.documentElement;
    root.style.zoom = vw / W;                             // scale the page up so it is W px wide on screen
    root.classList.add('pm');
    remap();
    var st = document.createElement('style');
    st.textContent = 'html.pm .nav-search.open .ns-field{width:auto!important;flex:1}html.pm body{min-height:0}';
    document.head.appendChild(st);
  }
  apply();
  document.addEventListener('DOMContentLoaded', function () { if (document.documentElement.classList.contains('pm')) remap(); else apply(); });
})();
