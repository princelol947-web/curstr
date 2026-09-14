-- Run in Supabase SQL Editor. Tracks each buyer's Blaze Coins balance and
-- full transaction history (earned + used). Both are read-only from the
-- browser — only the secure Cloudflare Worker (service_role key) can ever
-- write to them, so no buyer can fake themselves extra coins.

create table if not exists user_coins (
  email text primary key,
  balance int8 not null default 0,
  updated_at timestamptz not null default now()
);
alter table user_coins enable row level security;
drop policy if exists "users view own coins" on user_coins;
create policy "users view own coins"
on user_coins for select to authenticated
using (email = auth.jwt()->>'email');

create table if not exists coin_transactions (
  id bigint generated always as identity primary key,
  email text not null,
  type text not null, -- 'earn' or 'spend'
  amount int8 not null,
  ebook_title text,
  created_at timestamptz not null default now()
);
alter table coin_transactions enable row level security;
drop policy if exists "users view own coin history" on coin_transactions;
create policy "users view own coin history"
on coin_transactions for select to authenticated
using (email = auth.jwt()->>'email');

-- Intentionally no insert/update/delete policy for authenticated or anon on
-- either table — all changes happen server-side only.
