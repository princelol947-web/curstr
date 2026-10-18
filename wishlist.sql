-- WISHLIST: lets a signed-in user save an ebook to a personal wishlist and see it later in My Account / wishlist.html.
-- Run this in the Supabase SQL Editor, all at once. Safe to run again later: everything below is created with
-- "if not exists" / "drop ... if exists" first, so re-running this file does not duplicate anything or wipe data.
-- This does NOT touch any other table, and does NOT disable RLS anywhere.

-- ===== 1) wishlist: one row per (user, ebook) they've saved =====
create table if not exists public.wishlist (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  ebook_title text not null,
  created_at timestamptz not null default now(),
  unique (user_id, ebook_title)   -- saving the same ebook twice just keeps the one row
);
create index if not exists wishlist_user_id_idx on public.wishlist (user_id);

-- RLS is turned on AND given matching policies in the same breath on purpose — a table with RLS on but no
-- policy silently returns zero rows for everyone (that's what briefly broke ebooks/banners earlier), so the
-- policies below go in immediately rather than as a later step.
alter table public.wishlist enable row level security;
drop policy if exists "wishlist_select_own" on public.wishlist;
drop policy if exists "wishlist_insert_own" on public.wishlist;
drop policy if exists "wishlist_delete_own" on public.wishlist;
create policy "wishlist_select_own" on public.wishlist
  for select to authenticated using (user_id = auth.uid());
create policy "wishlist_insert_own" on public.wishlist
  for insert to authenticated with check (user_id = auth.uid());
create policy "wishlist_delete_own" on public.wishlist
  for delete to authenticated using (user_id = auth.uid());
-- No update policy and no policy at all for "anon" — a visitor must be signed in, and can only ever
-- see, add or remove their own rows. Nobody (not even an admin) can read anyone else's wishlist from the browser.

-- ===== What this gives you =====
-- public.wishlist -> user_id, email, ebook_title, created_at — one row per ebook a signed-in user has saved.
-- ebooks.html lets a signed-in visitor tap a heart on any ebook to add/remove it here.
-- wishlist.html (and the bottom "Wishlist" tab) shows the signed-in visitor their own saved list.
