-- Creates the "avatars" storage bucket that my-account.html uploads profile pictures to.
-- Run this once in the Supabase SQL Editor. Safe to re-run — every step is idempotent.

-- 1) The bucket itself. Public = true because the app displays the photo via a public URL
--    (getPublicUrl) in a plain <img> tag, which can't send login credentials — so the file has
--    to be fetchable without being signed in. This only exposes the picture itself at its own
--    random-looking URL, nothing else about the account.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- 2) RLS is ALREADY on by default for storage.objects on every Supabase project (and can't be
--    turned off here even if we wanted to — the SQL Editor's role isn't the table's owner, which
--    is exactly why "alter table storage.objects enable row level security" fails with
--    "must be owner of table objects"). These policies just say who may upload/replace files;
--    creating a policy doesn't require table ownership, only the ALTER TABLE line did.
drop policy if exists "avatars: owner can upload" on storage.objects;
create policy "avatars: owner can upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and name like auth.uid()::text || '-%'
);

drop policy if exists "avatars: owner can replace" on storage.objects;
create policy "avatars: owner can replace"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and name like auth.uid()::text || '-%'
);

-- 3) Explicit public read policy (belt-and-suspenders alongside the bucket's own public flag) so
--    the uploaded photo actually loads for anyone viewing the page.
drop policy if exists "avatars: anyone can view" on storage.objects;
create policy "avatars: anyone can view"
on storage.objects for select
to public
using (bucket_id = 'avatars');
