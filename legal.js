// Editable legal pages. The text lives in Supabase (site_content, key "legal_<page>") and is edited in admin-legal.html.
// The text is PLAIN TEXT: it is never inserted as HTML, so nothing typed into the editor can run code on the site.
//
// Writing format (shown to the admin in admin-legal.html):
//   ## Heading          a section heading
//   - item              a bullet point
//   **bold**            bold text
//   [text](https://…)   a link  (also mailto:, tel:, or a page on this site such as contact.html)
//   blank line          starts a new paragraph
(function () {
  const BLANK = /\[\[/;

  const PAGES = [
    { slug: 'contact', file: 'contact.html', title: 'Contact & Seller Details', sub: 'Who runs this website and how to reach us.', text: `## Seller details
- **Seller:** [[FILL IN: name(s) of the person or people responsible for the store]]
- **Type of business:** [[OWNER DECISION: you said there is no registered business and you run it with friends. Ask a lawyer or CA how to describe the seller before publishing this line]]
- **Address:** [[FILL IN: full postal address]]
- **Website:** https://cursetrading.dpdns.org
- **GSTIN:** [[FILL IN: GSTIN, or "not registered" (confirm with your accountant)]]

## Customer care
- **Email:** [[FILL IN: customer-care email]]
- **Phone / mobile:** [[FILL IN: phone number]]
- **Support hours:** [[FILL IN: days and hours]]
- **Typical reply time:** [[FILL IN: your real target, only what you can keep]]

## Other ways to get help
- Signed-in customers can use **Report a bug / Get help** in [My Account](my-account.html).
- To make a complaint, see [Grievance Officer & Complaints](grievance.html).` },

    { slug: 'grievance', file: 'grievance.html', title: 'Grievance Officer & Complaints', sub: 'How to raise a complaint about a purchase, your account or your personal data.', text: `## Grievance Officer
- **Name:** [[FILL IN: officer name]]
- **Designation:** [[FILL IN: e.g. Owner / Grievance Officer]]
- **Email:** [[FILL IN: grievance email]]
- **Phone / mobile:** [[FILL IN: phone number]]
- **Address:** [[FILL IN: postal address]]

## How to complain
- Email the Grievance Officer from the email address on your account.
- Include your order email, the ebook title, the date of purchase, and what went wrong.
- Attach a payment screenshot or reference if you have one.

## What to expect
We will acknowledge your complaint within 48 hours of receiving it and will work to resolve it within one month of receipt. [[OWNER DECISION: keep these times only if you can really meet them. The Consumer Protection (E-Commerce) Rules, 2020 set these periods for grievance officers. Then delete this note]]

## Privacy and data requests
To ask about your personal data (access, correction, deletion), write to [[FILL IN: privacy contact email]].

## Other options
You may also contact the National Consumer Helpline run by the Department of Consumer Affairs. [[FILL IN: add the official helpline number or website after checking it on a .gov.in site]]` },

    { slug: 'cookie-policy', file: 'cookie-policy.html', title: 'Cookies & Browser Storage', sub: 'What this website stores in your browser and which other services may be involved.', text: `## What we store
- **Login session:** when you sign in, our sign-in provider (Supabase) keeps your session in your browser's local storage so you stay signed in. It is removed when you sign out.
- **Site look:** the site may keep the chosen visual theme in local storage so pages load faster.
- **Cookie notice:** your choice on the cookie notice is kept only while the page is open.

[[FILL IN: confirm that the site sets no cookies of its own, including anything added by chatbot.js, then delete this note]]

## Analytics and tracking
We do not use third-party analytics, advertising pixels or session recording. We only keep our own counts needed to run the store, such as the number of buyers in the last 30 days and the number of sign-ins. [[FILL IN: confirm these counts are kept only in your own database and that chatbot.js sends nothing to outside analytics. Also change the cookie banner, which says "basic analytics", so it matches this text]]

## Other services that may set their own cookies
- Google, if you choose "Continue with Google".
- Your payment provider's checkout page ([[FILL IN: Razorpay / Stripe / other]]).
- Content delivery servers (jsDelivr) used to load site code.

## Your choices
You can clear local storage or block cookies in your browser settings. Signing in may stop working if you do.` },

    { slug: 'digital-delivery', file: 'digital-delivery.html', title: 'Digital Products & Delivery', sub: 'What you receive when you buy an ebook, and how access works.', text: `## What you receive
- **Product type:** digital ebook file. Nothing is shipped physically.
- **File format:** [[FILL IN: PDF? other?]]
- **When you get access:** [[FILL IN: e.g. immediately after payment is confirmed. State what really happens]]
- **How to download:** sign in, open My Account, find your order and tap Download. [[FILL IN: confirm that the download link is temporary and can be requested again, if that is how it works]]

## Licence and use
[[OWNER DECISION: personal-use licence? Sharing, copying or reselling not allowed? Write the rules you want. A lawyer should word this]]

## Problems with a download
If a file will not download or opens incorrectly, contact customer care (see [Contact](contact.html)). [[OWNER DECISION: re-download or replacement rule, and for how long]]

## Refunds
See the Refund Policy. [[OWNER DECISION: make sure the Refund Policy and this page agree]]` },

    { slug: 'coins-terms', file: 'coins-terms.html', title: 'Blaze Coins Terms', sub: 'How the Blaze Coins rewards programme works.', text: `## Earning
For every ₹100 you spend on an eligible ebook you earn 10 Blaze Coins. [[FILL IN: which purchases earn coins, and when the coins are added]]

[[OWNER DECISION: your site also shows Bronze, Silver, Gold and Platinum tiers with rates of 1 to 1.5 coins per ₹5. That does not match "10 coins per ₹100". Do the tiers really exist? If yes, what are the real rates?]]

## Using coins
100 Blaze Coins = ₹10 discount, offered as an option when you buy. [[FILL IN: any minimum purchase, any maximum discount per order, and whether it can be combined with a sale price]]

## Other terms
- **Cash value:** [[OWNER DECISION: e.g. whether coins can be exchanged for money or transferred]]
- **Expiry:** [[OWNER DECISION: do coins expire? When?]]
- **Misuse and fraud:** [[OWNER DECISION: what happens if coins are earned unfairly]]
- **Refunded orders:** [[OWNER DECISION: are coins removed when an order is refunded?]]
- **Changes to the programme:** [[OWNER DECISION: how and when you may change or end it, and how you will tell users]]
- **Account closure:** [[OWNER DECISION: what happens to coins when an account is deleted]]` },

    // Optional: only used if you link to legal.html?p=terms (your existing terms.html is not touched).
    { slug: 'terms', file: 'legal.html?p=terms', title: 'Terms & Conditions', sub: '', text: '' },
    { slug: 'privacy', file: 'legal.html?p=privacy', title: 'Privacy Policy', sub: '', text: '' },
    { slug: 'refund', file: 'legal.html?p=refund', title: 'Refund Policy', sub: '', text: '' }
  ];

  const find = slug => PAGES.find(p => p.slug === slug) || null;
  const key = slug => 'legal_' + slug;

  // Only these link targets are allowed: https, mailto, tel, or a page on this site.
  function safeHref(u) {
    if (/^https:\/\/[^\s"'<>]+$/i.test(u)) return u;
    if (/^mailto:[^\s"'<>]+$/i.test(u) || /^tel:[+0-9\-\s]+$/i.test(u)) return u;
    if (/^[a-z0-9][a-z0-9._\-\/]*(\?[a-z0-9=&._\-]*)?(#[a-z0-9_\-]*)?$/i.test(u) && !/^(javascript|data|vbscript):/i.test(u)) return u;
    return null;
  }

  // Adds **bold** and [links](url) to an element, using text nodes only.
  function inline(parent, s) {
    const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
    let last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) parent.appendChild(document.createTextNode(s.slice(last, m.index)));
      if (m[1] !== undefined) {
        const b = document.createElement('strong'); b.textContent = m[1]; parent.appendChild(b);
      } else {
        const href = safeHref(m[3]), a = document.createElement(href ? 'a' : 'span');
        a.textContent = m[2];
        if (href) {
          a.setAttribute('href', href);
          if (/^https:/i.test(href)) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener noreferrer'); }
        }
        parent.appendChild(a);
      }
      last = re.lastIndex;
    }
    if (last < s.length) parent.appendChild(document.createTextNode(s.slice(last)));
  }

  function render(text, box) {
    box.textContent = '';
    let list = null, para = null;
    const flush = () => { list = null; para = null; };
    String(text || '').replace(/\r\n?/g, '\n').split('\n').forEach(raw => {
      const line = raw.trim();
      if (!line) return flush();
      let m;
      if ((m = /^(#{2,3})\s+(.+)$/.exec(line))) {
        flush(); const h = document.createElement(m[1].length === 2 ? 'h2' : 'h3'); inline(h, m[2]); box.appendChild(h);
      } else if ((m = /^[-*]\s+(.+)$/.exec(line))) {
        para = null;
        if (!list) { list = document.createElement('ul'); box.appendChild(list); }
        const li = document.createElement('li'); inline(li, m[1]); list.appendChild(li);
      } else {
        list = null;
        if (!para) { para = document.createElement('p'); box.appendChild(para); } else para.appendChild(document.createElement('br'));
        inline(para, line);
      }
    });
  }

  // The newest saved text, or the starter text. { text, updated, saved }
  async function load(slug) {
    const p = find(slug);
    if (!p) return null;
    const fallback = { text: p.text, updated: null, saved: false };
    try {
      if (typeof supabase === 'undefined' || typeof SUPABASE_URL === 'undefined') return fallback;
      const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data, error } = await sb.from('site_content').select('value').eq('key', key(slug)).maybeSingle();
      if (error || !data || !data.value || typeof data.value.text !== 'string') return fallback;
      return { text: data.value.text, updated: data.value.updated || null, saved: true };
    } catch (e) { return fallback; }
  }

  window.LEGAL = { PAGES, find, key, render, load, hasBlanks: t => BLANK.test(t || ''), countBlanks: t => (String(t || '').match(/\[\[/g) || []).length };
})();
