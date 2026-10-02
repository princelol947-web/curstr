import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info' };
const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const j = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
// keep in sync with blaze-config.js
const PER_UNIT = 5, TIERS = [{ min: 0, rate: 1 }, { min: 500, rate: 1.1 }, { min: 1000, rate: 1.2 }, { min: 4150, rate: 1.5 }];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: { user } } = await sb.auth.getUser(jwt);
    if (!user) return j({ error: 'Please sign in first' }, 401);
    const { order_id, payment_id, signature } = await req.json();
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(Deno.env.get('RZP_KEY_SECRET')!), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(order_id + '|' + payment_id));
    const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
    if (hex !== signature) return j({ error: 'Payment could not be verified' }, 400);

    const { data: o } = await sb.from('ebook_orders').select('*').eq('order_id', order_id).eq('user_id', user.id).single();
    if (!o) return j({ error: 'Order not found' }, 404);
    let earned = o.coins_earned || 0;
    if (o.status !== 'paid') {           // only credit once
      const { data: c } = await sb.from('blaze_coins').select('*').eq('user_id', user.id).maybeSingle();
      const life = c?.lifetime || 0; let rate = 1;
      for (const t of TIERS) if (life >= t.min) rate = t.rate;
      earned = Math.floor(o.amount / PER_UNIT * rate);
      await sb.from('blaze_coins').upsert({ user_id: user.id, balance: (c?.balance || 0) + earned, lifetime: life + earned, next_prize: c?.next_prize ?? new Date(Date.now() + 7 * 864e5).toISOString() });
      await sb.from('ebook_orders').update({ status: 'paid', payment_id, coins_earned: earned }).eq('order_id', order_id);
    }
    const { data } = await sb.from('site_content').select('value').eq('key', 'ebooks').single();
    const book = (data?.value || []).find((b: any) => b.title === o.ebook_title);
    return j({ ok: true, coins: earned, download_url: book?.file_url || book?.file_path || null });
  } catch (e) { return j({ error: String(e) }, 500); }
});
