-- Marks synthetic demo accounts so they can be identified and excluded from analytics.
-- Apply only to a staging/local project before running scripts/seed.
alter table public.profiles
  add column if not exists is_seed boolean not null default false;

create index if not exists profiles_is_seed_created_at_idx
  on public.profiles (is_seed, created_at desc);