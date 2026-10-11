-- Optional education detail and the completion flag used to route first-time members.
alter table public.profiles
  add column if not exists studied_at text,
  add column if not exists onboarding_completed_at timestamptz;
