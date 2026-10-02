-- Buckets used by admin-content.html
insert into storage.buckets (id, name, public) values
  ('ebook-covers', 'ebook-covers', true),
  ('ebook-files',  'ebook-files',  true)
on conflict (id) do nothing;

create policy "public read covers+files" on storage.objects for select
  using (bucket_id in ('ebook-covers', 'ebook-files'));

create policy "admin upload covers+files" on storage.objects for insert to authenticated
  with check (bucket_id in ('ebook-covers', 'ebook-files') and (auth.jwt() ->> 'email') = 'p.parthasarathi7580@gmail.com');

create policy "admin update covers+files" on storage.objects for update to authenticated
  using (bucket_id in ('ebook-covers', 'ebook-files') and (auth.jwt() ->> 'email') = 'p.parthasarathi7580@gmail.com');
