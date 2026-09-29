(function () {
  const C = window.BLAZE_CONFIG, T = C.tiers.slice().sort((a, b) => a.min - b.min);
  let S = { balance: 0, lifetime: 0, next_prize: null }, sb = null, uid = null, subs = [], n = 0;
  const key = () => 'blaze:' + (uid || 'guest'), fmt = x => Math.round(x).toLocaleString('en-IN');

  // ---------- coin icon ----------
  function coin(sz) {
    const g = 'bc' + (++n); let st = '', lf = '';
    for (let k = 0; k < 16; k++) st += `<path d="M0-3.8L1.1-1.2 3.9-1 1.8.8 2.5 3.5 0 2 -2.5 3.5-1.8.8-3.9-1-1.1-1.2Z" transform="rotate(${k * 22.5}) translate(0 -41)" fill="#7a4a12"/>`;
    for (let a = 25; a <= 145; a += 20) for (const s of [1, -1])
      lf += `<ellipse rx="2.3" ry="5" transform="rotate(${a * s}) translate(0 -30) rotate(${50 * s})" fill="#8a5a14"/>`;
    return `<svg width="${sz}" height="${sz}" viewBox="-50 -50 100 100" aria-hidden="true">
<defs><radialGradient id="${g}a" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff2a8"/><stop offset=".45" stop-color="#e9b12e"/><stop offset="1" stop-color="#8f5b10"/></radialGradient>
<linearGradient id="${g}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7cf62"/><stop offset="1" stop-color="#b57a1c"/></linearGradient></defs>
<circle r="49" fill="#8f5b10"/><circle r="47" fill="url(#${g}a)"/><circle r="36" fill="none" stroke="#8a5a14" stroke-width="1.2"/>${st}
<circle r="34" fill="url(#${g}b)"/>${lf}<circle r="23" fill="#d99a26" stroke="#8a5a14" stroke-width="1.4"/>
<path d="M-25-5L25-5 21 3 25 11-25 11-21 3Z" fill="#a4501c" opacity=".85"/>
<text y="13" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="36" fill="#fff6d0" stroke="#6b3d0c" stroke-width="2.4" paint-order="stroke">B</text>
<path d="M-40-22A45 45 0 0 1 -10-44" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/></svg>`;
  }

  // ---------- tiers ----------
  function info() {
    let i = 0; T.forEach((t, k) => { if (S.lifetime >= t.min) i = k; });
    const cur = T[i], nx = T[i + 1] || null;
    return { cur, nx, pct: nx ? Math.min(100, (S.lifetime - cur.min) / (nx.min - cur.min) * 100) : 100, left: nx ? nx.min - S.lifetime : 0 };
  }

  // ---------- storage (Supabase if logged in, else localStorage) ----------
  async function save() {
    try { localStorage.setItem(key(), JSON.stringify(S)); } catch (e) {}
    if (sb && uid) try { await sb.from(C.table).upsert({ user_id: uid, ...S }); } catch (e) {}
  }
  function notify() { subs.forEach(f => f(S, info())); }
  async function load() {
    try {
      if (window.supabase && window.SUPABASE_URL) {
        sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data } = await sb.auth.getSession(); uid = data.session ? data.session.user.id : null;
      }
    } catch (e) {}
    let loaded = null;
    if (sb && uid) try { const r = await sb.from(C.table).select('*').eq('user_id', uid).maybeSingle(); loaded = r.data; } catch (e) {}
    if (!loaded) try { loaded = JSON.parse(localStorage.getItem(key())); } catch (e) {}
    if (loaded) S = { balance: loaded.balance | 0, lifetime: loaded.lifetime | 0, next_prize: loaded.next_prize };
    if (!S.next_prize) { S.next_prize = new Date(Date.now() + C.prizeIntervalDays * 864e5).toISOString(); save(); }
    notify();
  }

  // ---------- public API ----------
  const API = window.BlazeCoins = {
    icon: coin, info, fmt, cfg: C, get: () => S, signedIn: () => !!uid,
    on(f) { subs.push(f); f(S, info()); },
    earn(spent) { const c = Math.floor(spent / C.perUnit * info().cur.rate); S.balance += c; S.lifetime += c; save(); notify(); return c; },
    add(c) { S.balance += c; S.lifetime += c; save(); notify(); },
    spend(c) { if (S.balance < c) return false; S.balance -= c; save(); notify(); return true; },
    prizeReady: () => Date.now() >= new Date(S.next_prize).getTime(),
    claimPrize() {
      if (!API.prizeReady()) return 0; const b = info().cur.prize; API.add(b);
      S.next_prize = new Date(Date.now() + C.prizeIntervalDays * 864e5).toISOString(); save(); notify(); return b;
    }
  };
  window.addEventListener('storage', e => { if (e.key === key()) { try { S = JSON.parse(e.newValue); notify(); } catch (x) {} } });

  // ---------- UI: nav chip + profile card ----------
  const css = document.createElement('style');
  css.textContent = `.blaze-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 11px 4px 5px;border-radius:999px;background:#171717;border:1px solid #3a2f14;color:#f5d36b;font-weight:600;font-size:13px;text-decoration:none;white-space:nowrap}
.blaze-chip:hover{border-color:#e9b12e}.blaze-chip svg{display:block}
.blaze-card{display:block;text-decoration:none;color:inherit;background:#171717;border:1px solid #262626;border-radius:14px;padding:16px;margin-bottom:24px}
.blaze-card .r{display:flex;align-items:center;gap:12px}.blaze-card b{font-size:17px;display:block}.blaze-card small{color:#a3a3a3}
.blaze-bar{height:8px;border-radius:99px;background:#262626;overflow:hidden;margin:12px 0 6px}.blaze-bar i{display:block;height:100%;background:linear-gradient(90deg,#b57a1c,#f7cf62);border-radius:99px;transition:width .5s}`;
  document.head.appendChild(css);

  function mount() {
    const nav = document.querySelector('nav');
    if (nav) {
      const a = document.createElement('a'); a.className = 'blaze-chip'; a.href = 'coins.html'; a.setAttribute('aria-label', 'Blaze Coins');
      a.innerHTML = coin(24) + '<span></span>';
      const host = nav.querySelector('.nav-right'); host ? host.prepend(a) : nav.appendChild(a);
      API.on(s => a.lastChild.textContent = fmt(s.balance));
    }
    const p = document.getElementById('blazeProfile');
    if (p) API.on((s, t) => {
      p.innerHTML = `<a class="blaze-card" href="coins.html"><div class="r">${coin(44)}<div style="flex:1"><small>Blaze Coins</small><b>${t.cur.name} · ${fmt(s.balance)} coins</b></div><span style="color:#a3a3a3">›</span></div>
<div class="blaze-bar"><i style="width:${t.pct}%"></i></div><small>${t.nx ? fmt(t.left) + ' coins to ' + t.nx.name : 'Top tier reached'}</small></a>`;
    });
  }
  (document.readyState === 'loading' ? document.addEventListener.bind(document, 'DOMContentLoaded') : f => f())(() => { mount(); load(); });
})();
