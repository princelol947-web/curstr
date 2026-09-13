-- Run in Supabase SQL Editor. Tracks each buyer's coin balance.
-- Balances are read-only from the browser — only the secure Cloudflare
-- Worker (using the service_role key) can ever change them, so no buyer
-- can fake themselves extra coins from their own browser console.
create table if not exists user_coins (
  email text primary key,
  balance int8 not null default 0,
  updated_at timestamptz not null default now()
);

alter table user_coins enable row level security;

drop policy if exists "users view own coins" on user_coins;
create policy "users view own coins"
on user_coins for select
to authenticated
using (email = auth.jwt()->>'email');

-- Intentionally no insert/update/delete policy for authenticated or anon —
-- balances can only be changed server-side.
