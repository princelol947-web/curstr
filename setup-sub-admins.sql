-- Run this once in Supabase's SQL Editor (SQL Editor -> New query -> paste all -> Run)

-- 1. Table that tracks every admin (main + sub) and what they're allowed to do
create table if not exists admin_permissions (
  email text primary key,
  role text not null default 'sub',
  can_manage_content boolean not null default false,
  can_view_buyers boolean not null default false,
  created_at timestamptz not null default now()
);

alter table admin_permissions enable row level security;

-- 2. Seed yourself as the main admin with full permissions
insert into admin_permissions (email, role, can_manage_content, can_view_buyers)
values ('p.parthasarathi7580@gmail.com', 'main', true, true)
on conflict (email) do update set role = 'main', can_manage_content = true, can_view_buyers = true;

-- 3. Any logged-in admin can check their own row (needed so pages can check "what am I allowed to do")
drop policy if exists "admins can view permissions" on admin_permissions;
create policy "admins can view permissions"
on admin_permissions for select
to authenticated
using (true);

-- 4. Only the main admin can add/edit/remove other admins
drop policy if exists "main admin can manage permissions" on admin_permissions;
create policy "main admin can manage permissions"
on admin_permissions for all
to authenticated
using (exists (select 1 from admin_permissions p where p.email = auth.jwt()->>'email' and p.role = 'main'))
with check (exists (select 1 from admin_permissions p where p.email = auth.jwt()->>'email' and p.role = 'main'));

-- 5. Buyers list now requires the "can_view_buyers" permission (not just one fixed email)
drop policy if exists "Admin can view orders" on orders;
drop policy if exists "permitted admins can view orders" on orders;
create policy "permitted admins can view orders"
on orders for select
to authenticated
using (exists (select 1 from admin_permissions p where p.email = auth.jwt()->>'email' and p.can_view_buyers = true));

-- 6. Anyone (even logged-out visitors) can read banners/ebooks so the public site works
drop policy if exists "public can read site content" on site_content;
create policy "public can read site content"
on site_content for select
to public
using (true);

-- 7. Editing banners/ebooks now requires the "can_manage_content" permission
drop policy if exists "Admin can update site content" on site_content;
drop policy if exists "permitted admins can update site content" on site_content;
create policy "permitted admins can update site content"
on site_content for update
to authenticated
using (exists (select 1 from admin_permissions p where p.email = auth.jwt()->>'email' and p.can_manage_content = true))
with check (exists (select 1 from admin_permissions p where p.email = auth.jwt()->>'email' and p.can_manage_content = true));
