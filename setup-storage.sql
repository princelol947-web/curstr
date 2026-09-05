-- Run in Supabase SQL Editor after creating the 2 buckets in the dashboard
-- (Storage -> New bucket -> name it exactly "ebook-files", repeat for "ebook-covers")
-- Make BOTH buckets "Public" when creating them (toggle shown in the create-bucket dialog).

-- Allow any logged-in admin/sub-admin with content permission to upload/manage files
drop policy if exists "content admins manage ebook files" on storage.objects;
create policy "content admins manage ebook files"
on storage.objects for all
to authenticated
using (
  bucket_id in ('ebook-files', 'ebook-covers')
  and exists (select 1 from admin_permissions p where p.email = auth.jwt()->>'email' and p.can_manage_content = true)
)
with check (
  bucket_id in ('ebook-files', 'ebook-covers')
  and exists (select 1 from admin_permissions p where p.email = auth.jwt()->>'email' and p.can_manage_content = true)
);

-- Allow everyone to view cover images (needed for the public catalog pages)
drop policy if exists "public can view covers" on storage.objects;
create policy "public can view covers"
on storage.objects for select
to public
using (bucket_id = 'ebook-covers');
