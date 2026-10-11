-- Database-backed events and authenticated post-media uploads for SPORTSLINK.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 160),
  description text not null default '' check (char_length(description) <= 3000),
  event_type text not null default 'meetup'
    check (event_type in ('training', 'competition', 'tryout', 'meetup', 'other')),
  sport text,
  location text not null check (char_length(btrim(location)) between 2 and 240),
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'published' check (status in ('published', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_end_after_start check (ends_at is null or ends_at > starts_at)
);

create index if not exists events_starts_at_idx on public.events (starts_at asc);
create index if not exists events_created_by_idx on public.events (created_by);

alter table public.events enable row level security;

drop policy if exists events_select_published_or_owner on public.events;
create policy events_select_published_or_owner
  on public.events for select to anon, authenticated
  using (status = 'published' or created_by = (select auth.uid()));

drop policy if exists events_insert_self on public.events;
create policy events_insert_self
  on public.events for insert to authenticated
  with check (created_by = (select auth.uid()));

drop policy if exists events_update_self on public.events;
create policy events_update_self
  on public.events for update to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

drop policy if exists events_delete_self on public.events;
create policy events_delete_self
  on public.events for delete to authenticated
  using (created_by = (select auth.uid()));

grant select on public.events to anon, authenticated;
grant insert, update, delete on public.events to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media',
  'post-media',
  true,
  52428800,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists post_media_storage_insert_own_folder on storage.objects;
create policy post_media_storage_insert_own_folder
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists post_media_storage_update_own_folder on storage.objects;
create policy post_media_storage_update_own_folder
  on storage.objects for update to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists post_media_storage_delete_own_folder on storage.objects;
create policy post_media_storage_delete_own_folder
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
