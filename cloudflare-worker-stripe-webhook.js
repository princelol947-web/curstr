// CLOUDFLARE WORKER — paste this into a new Worker via the Cloudflare
// dashboard's "Quick Edit" browser code editor. No CLI, no laptop needed.
//
// Set these as Worker "Variables and Secrets" in the dashboard:
//   STRIPE_WEBHOOK_SECRET   (from Stripe → Developers → Webhooks)
//   SUPABASE_URL            (your project URL)
//   SUPABASE_SERVICE_ROLE_KEY  (Supabase → Project Settings → API — keep secret!)
//
// Then in Stripe, add a webhook endpoint pointing at this Worker's URL,
// listening for "checkout.session.completed".
//
// Why this exists: a static HTML site can't be trusted to record its own
// "payment succeeded" — anyone could fake that from the browser. Stripe's
// webhook is signed, so only Stripe can trigger this, which is what makes
// the buyer list in the admin dashboard trustworthy.

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Not found", { status: 404 });
    }

    const signature = request.headers.get("stripe-signature");
    const body = await request.text();

    let event;
    try {
      event = await verifyStripeSignature(body, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return new Response("Invalid signature", { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      await fetch(`${env.SUPABASE_URL}/rest/v1/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          buyer_email: session.customer_details?.email || session.customer_email,
          ebook_title: session.metadata?.ebook_title || "Unknown",
          amount_cents: session.amount_total,
          currency: session.currency,
          stripe_session_id: session.id,
          status: "paid",
        }),
      });
    }

    return new Response("ok", { status: 200 });
  },
};

// Minimal Stripe webhook signature verification (avoids needing the Node SDK)
async function verifyStripeSignature(payload, sigHeader, secret) {
  const parts = Object.fromEntries(
    sigHeader.split(",").map((p) => p.split("="))
  );
  const signedPayload = `${parts.t}.${payload}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const expectedSig = [...new Uint8Array(sigBuffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

  if (expectedSig !== parts.v1) throw new Error("Signature mismatch");
  return JSON.parse(payload);
}
