-- Run in Supabase SQL Editor. Creates a public, privacy-safe view that only
-- shows purchase COUNTS per ebook title — never any buyer email or personal
-- info — so the storefront can show a "Top seller" badge to everyone.
create or replace view public_ebook_sales as
select ebook_title, count(*) as sales_count
from orders
where status = 'paid'
group by ebook_title;

grant select on public_ebook_sales to anon, authenticated;
