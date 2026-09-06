-- Run in Supabase SQL Editor. Lets a signed-in customer see ONLY their own
-- past orders (matched by email) — never anyone else's.
drop policy if exists "users can view their own orders" on orders;
create policy "users can view their own orders"
on orders for select
to authenticated
using (buyer_email = auth.jwt()->>'email');
