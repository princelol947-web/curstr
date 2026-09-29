create table if not exists blaze_coins (
  user_id uuid primary key references auth.users on delete cascade,
  balance int not null default 0,
  lifetime int not null default 0,
  next_prize timestamptz
);
alter table blaze_coins enable row level security;
create policy "own row" on blaze_coins for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
