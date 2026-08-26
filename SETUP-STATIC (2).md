# Ebook Store — Static HTML Version (no laptop required)

Everything here runs from web dashboards in your phone's browser. No npm,
no Node, no local install.

## 1. Host the static files

Pick one (all work from a phone browser):
- **Netlify Drop** (netlify.com/drop) — literally drag the folder in, get a live URL instantly
- **GitHub Pages** — upload the files to a GitHub repo, turn on Pages in repo Settings
- **Cloudflare Pages** — connect a GitHub repo, auto-deploys

Files to upload: everything in this folder (`index.html`, `ebooks.html`,
`terms.html`, `privacy.html`, `refund-policy.html`, `ebooks-data.js`,
`legal.css`, and the `admin/` folder).

## 2. Add your ebooks

Edit `ebooks-data.js` — one entry per ebook. You can edit this file directly
in GitHub's web editor (tap the pencil icon on the file) — no app needed.

## 3. Set up payments (Stripe Payment Links — no code)

For each ebook:
1. Stripe Dashboard → Payment Links → Create link
2. Set the price, and under "Add metadata" add `ebook_title` = the exact
   title (this is how the webhook knows which book was bought)
3. Copy the link URL into that ebook's `paymentLink` in `ebooks-data.js`

## 4. Set up Supabase (buyer storage + admin login)

1. Create a free project at supabase.com (works fine on mobile browser)
2. Table Editor → create table `orders` with columns:
   `buyer_email` (text), `ebook_title` (text), `amount_cents` (int8),
   `currency` (text), `stripe_session_id` (text, unique), `status` (text),
   `created_at` (timestamptz, default `now()`)
3. Authentication → Users → Add user → create yourself as the one admin,
   using your Gmail address and a password
4. Authentication → Policies → on the `orders` table, add a policy:
   allow `SELECT` only `WHERE auth.jwt() ->> 'email' = 'you@gmail.com'`
   (replace with your real email) — this is what keeps buyer data private
   to only your login
5. Copy your Project URL and anon key into `admin/config.js`, and set
   `ADMIN_EMAIL` to your Gmail there too

## 5. Set up the Cloudflare Worker (verifies real payments)

This is the one piece of actual server code, and it's what makes the
buyer list trustworthy — without it, anyone could fake a "purchase" from
their browser console.

1. Cloudflare dashboard → Workers & Pages → Create → create a Worker
2. Tap "Quick Edit" — this opens a code editor right in your browser
3. Paste in the contents of `cloudflare-worker-stripe-webhook.js`
4. Settings → Variables → add `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY` (the service role key, not the anon key —
   found in Supabase Project Settings → API; keep this one secret)
5. Deploy — note the Worker's URL
6. Stripe Dashboard → Developers → Webhooks → Add endpoint → paste the
   Worker URL, select event `checkout.session.completed`

## 6. Test it

Buy one of your own ebooks with a Stripe test card (4242 4242 4242 4242),
then check `admin/dashboard.html` — the purchase should appear.

## What's still missing vs. the full version

- Actual ebook file delivery by email after purchase (the Next.js version
  did this with Resend). For the static version, easiest fix: in Stripe
  Payment Link settings, there's a "redirect after payment" option — point
  it at a page (or Stripe's own file attachment feature) that reveals the
  download link. Ask if you want this wired up.
- The 3D animation, legal pages, and admin dashboard are otherwise fully
  equivalent to the Next.js version.

## Legal disclaimer

The Terms, Privacy, and Refund Policy pages are templates, not legal
advice — have them checked against your local consumer protection and
data privacy laws before taking real payments.
