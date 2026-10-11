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
    { slug: 'terms', file: 'terms-of-service.html', title: 'Terms of Service', sub: 'The rules for using Curse Trading and buying our ebooks.', text: `## About these terms
Curse Trading (cursetrading.dpdns.org) sells digital ebooks. By using this website, creating an account or buying an ebook you agree to these terms. If you do not agree, please do not use the website. The store is run by [[FILL IN: name(s) of the person or people responsible for the store. See the Contact page]].

## Using the website and your account
- You must give correct details when you sign up, and keep your password private.
- You are responsible for what happens on your account.
- [[OWNER DECISION: minimum age to buy, for example 18. Ask a lawyer about buyers under 18]]
- We may suspend or close an account that breaks these terms or is used to cheat, harm or defraud us or others.

## Ebooks and digital delivery
- Every ebook is a digital file. Nothing is shipped.
- After a successful payment you get access as described on the [Digital Products & Delivery](digital-delivery.html) page.
- When you buy, you get a personal licence to read the ebook for yourself. [[OWNER DECISION: write the licence you want, for example no sharing, copying, reselling or posting online]]

## Prices and payment
- Prices are shown in Indian rupees (₹). [[FILL IN: say whether prices include GST, or that you are not registered. Confirm with your accountant]]
- Payments are handled by [[FILL IN: Razorpay / Stripe / other]]. We do not store your card or UPI details.
- Your order is complete only after the payment provider confirms the payment.

## Refunds
Please read our [Refund Policy](refund-policy.html). Because ebooks are digital files, refunds follow the rules on that page.

## Blaze Coins
Blaze Coins are a rewards feature. Their rules are on the [Blaze Coins Terms](coins-terms.html) page.

## Educational content, not advice
- Our ebooks are for learning and general information.
- Nothing on this website is investment, trading, financial, legal or tax advice, and we do not promise any profit or result.
- Any decision you make is your own and at your own risk. [[OWNER DECISION: confirm this matches your ebooks. If any ebook gives specific trading or investment advice, ask a lawyer about the rules for that]]

## Copyright and intellectual property
- © Curse Trading. All rights reserved.
- The ebooks, text, images, logo, design and code on this website belong to us or to the people who gave us permission to use them. [[FILL IN: the name of the owner of the content]]
- You may not copy, resell, share, upload, translate or publish any ebook or part of this website without our written permission.
- If you think something on this website copies your work, write to us using the details on the [Contact](contact.html) page and tell us what it is and where you saw it.

## Acceptable use
- Do not try to break into the website, copy its data by machine, or overload it.
- Do not share your downloaded files or your account with other people.
- Do not use the website for anything illegal.

## Our responsibility
- We try to keep the website working, but we cannot promise it will always be available or free of errors.
- [[OWNER DECISION: limits on what you are responsible for. A lawyer should word this, and it cannot remove rights that Indian consumer law gives buyers]]

## Changes to these terms
We may change these terms. The date at the top of the page shows when they were last updated. If you keep using the website after a change, that means you accept the new terms. [[OWNER DECISION: how you will tell buyers about important changes]]

## Law and complaints
- These terms follow the laws of India. [[FILL IN: the city or state whose courts will handle disputes. Ask a lawyer]]
- To make a complaint, see [Grievance Officer & Complaints](grievance.html).
- For anything else, see [Contact](contact.html).` },
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

  // Each "## heading" starts a box (numbered, like the Refund Policy page). A line starting with ✓ or ✕ becomes a tick or cross item.
  function render(text, box) {
    box.textContent = '';
    box.classList.add('legal-body');
    let sec = null, list = null, para = null;
    const flush = () => { list = null; para = null; };
    const host = () => sec || box;
    String(text || '').replace(/\r\n?/g, '\n').split('\n').forEach(raw => {
      const line = raw.trim();
      if (!line) return flush();
      let m;
      if ((m = /^(#{2,3})\s+(.+)$/.exec(line))) {
        flush();
        if (m[1].length === 2) { sec = document.createElement('section'); sec.className = 'lbox'; box.appendChild(sec); }
        const h = document.createElement(m[1].length === 2 ? 'h2' : 'h3'); inline(h, m[2]); host().appendChild(h);
      } else if ((m = /^(?:([-*])|([✓✕]))\s+(.+)$/.exec(line))) {
        para = null;
        if (!list) { list = document.createElement('ul'); host().appendChild(list); }
        const li = document.createElement('li');
        if (m[2]) li.className = m[2] === '✓' ? 'yes' : 'no';
        inline(li, m[3]); list.appendChild(li);
      } else {
        list = null;
        if (!para) { para = document.createElement('p'); host().appendChild(para); } else para.appendChild(document.createElement('br'));
        inline(para, line);
      }
    });
  }

  // Look shared by the public pages and the admin preview.
  const css = document.createElement('style');
  css.textContent = `.legal-body{counter-reset:lsec}
#legalFoot{gap:10px 10px!important}#legalFoot a{display:inline-block;background:linear-gradient(135deg,#ef4444,#991b1b);color:#fff!important;border-radius:8px;padding:7px 14px;text-decoration:none!important;box-shadow:0 3px 10px rgba(239,68,68,.35);font-size:13px}#legalFoot a:hover{filter:brightness(1.08)}
.legal-body .lbox{background:#141414;border:1px solid #292929;border-radius:14px;padding:2px 18px 14px;margin:14px 0}
.legal-body .lbox h2{counter-increment:lsec;font-size:18px;margin:16px 0 8px;color:#fff}
.legal-body .lbox h2::before{content:counter(lsec) ". ";color:#ef4444}
.legal-body .lbox h3{font-size:16px;margin:14px 0 6px;color:#fff}
.legal-body .lbox p{margin:8px 0}
.legal-body .lbox ul{list-style:none;padding:0;margin:8px 0}
.legal-body .lbox li{position:relative;padding-left:22px;margin:7px 0}
.legal-body .lbox li::before{content:"•";position:absolute;left:6px;color:#ef4444}
.legal-body .lbox li.yes::before{content:"✓";left:3px;color:#34d399;font-weight:700}
.legal-body .lbox li.no::before{content:"✕";left:3px;color:#ef4444;font-weight:700}
.legal-body > p{margin:12px 0}`;
  document.head.appendChild(css);

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
