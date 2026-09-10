-- Run in Supabase SQL Editor after creating a bucket named "avatars"
-- (Storage -> New bucket -> "avatars" -> toggle Public -> Create)

-- Anyone logged in can upload/update their own avatar
drop policy if exists "users manage own avatar" on storage.objects;
create policy "users manage own avatar"
on storage.objects for all
to authenticated
using (bucket_id = 'avatars')
with check (bucket_id = 'avatars');

-- Anyone can view avatars (needed to display them)
drop policy if exists "public can view avatars" on storage.objects;
create policy "public can view avatars"
on storage.objects for select
to public
using (bucket_id = 'avatars');
