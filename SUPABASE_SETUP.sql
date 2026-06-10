-- Run this in your Supabase SQL Editor (supabase.com → project → SQL Editor)

-- 1. Create the scores table
create table scores (
  id integer primary key,
  payload jsonb not null default '{}',
  updated_at timestamp with time zone default now()
);

-- 2. Insert the starting row
insert into scores (id, payload) values (1, '{}');

-- 3. Enable real-time on this table
alter publication supabase_realtime add table scores;

-- 4. Allow anonymous reads and writes (public tournament - anyone with the URL can score)
create policy "Allow all" on scores for all using (true) with check (true);
alter table scores enable row level security;
