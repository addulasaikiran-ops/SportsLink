-- SPORTSLINK: organizations, connection requests, and reviewed FK indexes.
-- Apply to a staging Supabase project first; do not apply directly to production
-- until the staging UI and RLS behavior have been verified.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 3 and 160),
  description text not null default '' check (char_length(description) <= 3000),
  sport text,
  location text,
  website_url text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  status text not null default 'pending' check (status in ('pending', 'active', 'declined')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint connection_requests_not_self check (requester_id <> recipient_id),
  constraint connection_requests_unique_pair unique (requester_id, recipient_id)
);

create index if not exists organizations_status_created_idx on public.organizations(status, created_at desc);
create index if not exists organizations_owner_idx on public.organizations(owner_id);
create index if not exists organization_members_user_status_idx on public.organization_members(user_id, status);
create index if not exists connection_requests_recipient_status_idx on public.connection_requests(recipient_id, status, created_at desc);
create index if not exists connection_requests_requester_status_idx on public.connection_requests(requester_id, status, created_at desc);

-- Add indexes only for the foreign keys reported unindexed by the Supabase advisor.
create index if not exists comments_author_id_idx on public.comments(author_id);
create index if not exists conversations_created_by_idx on public.conversations(created_by);
create index if not exists messages_sender_id_idx on public.messages(sender_id);
create index if not exists notifications_actor_id_idx on public.notifications(actor_id);
create index if not exists opportunities_created_by_idx on public.opportunities(created_by);
create index if not exists post_media_post_id_idx on public.post_media(post_id);
create index if not exists post_reposts_user_id_idx on public.post_reposts(user_id);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.connection_requests enable row level security;

drop policy if exists organizations_select_active_or_owner on public.organizations;
create policy organizations_select_active_or_owner on public.organizations
  for select to authenticated
  using (status = 'active' or owner_id = (select auth.uid()));

drop policy if exists organizations_insert_owner on public.organizations;
create policy organizations_insert_owner on public.organizations
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists organizations_update_owner on public.organizations;
create policy organizations_update_owner on public.organizations
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists organizations_delete_owner on public.organizations;
create policy organizations_delete_owner on public.organizations
  for delete to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists organization_members_select_self_or_owner on public.organization_members;
create policy organization_members_select_self_or_owner on public.organization_members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.organizations o where o.id = organization_id and o.owner_id = (select auth.uid()))
  );

drop policy if exists organization_members_insert_self on public.organization_members;
create policy organization_members_insert_self on public.organization_members
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and role = 'member'
    and status = 'pending'
    and exists (select 1 from public.organizations o where o.id = organization_id and o.status = 'active' and o.owner_id <> (select auth.uid()))
  );

drop policy if exists organization_members_insert_owner_self on public.organization_members;
create policy organization_members_insert_owner_self on public.organization_members
  for insert to authenticated
  with check (
    user_id = (select auth.uid()) and role = 'owner' and status = 'active'
    and exists (select 1 from public.organizations o where o.id = organization_id and o.owner_id = (select auth.uid()))
  );

drop policy if exists organization_members_update_owner on public.organization_members;
create policy organization_members_update_owner on public.organization_members
  for update to authenticated
  using (exists (select 1 from public.organizations o where o.id = organization_id and o.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.organizations o where o.id = organization_id and o.owner_id = (select auth.uid())));

drop policy if exists organization_members_delete_self_or_owner on public.organization_members;
create policy organization_members_delete_self_or_owner on public.organization_members
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.organizations o where o.id = organization_id and o.owner_id = (select auth.uid()))
  );

drop policy if exists connection_requests_select_participant on public.connection_requests;
create policy connection_requests_select_participant on public.connection_requests
  for select to authenticated
  using (requester_id = (select auth.uid()) or recipient_id = (select auth.uid()));

drop policy if exists connection_requests_insert_requester on public.connection_requests;
create policy connection_requests_insert_requester on public.connection_requests
  for insert to authenticated
  with check (
    requester_id = (select auth.uid())
    and status = 'pending'
    and recipient_id <> (select auth.uid())
  );

drop policy if exists connection_requests_update_recipient on public.connection_requests;
create policy connection_requests_update_recipient on public.connection_requests
  for update to authenticated
  using (recipient_id = (select auth.uid()) and status = 'pending')
  with check (recipient_id = (select auth.uid()) and status in ('accepted', 'declined'));

-- Prevent either participant from rewriting the identities attached to a request.
create or replace function public.guard_connection_request_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.requester_id is distinct from old.requester_id
     or new.recipient_id is distinct from old.recipient_id then
    raise exception 'Connection request participants cannot be changed';
  end if;
  if old.status <> 'pending' then
    raise exception 'Only pending connection requests can be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_connection_request_identity_trigger on public.connection_requests;
create trigger guard_connection_request_identity_trigger
before update on public.connection_requests
for each row execute function public.guard_connection_request_identity();

-- The application can use accepted requests as connection edges; duplicate reverse
-- pending requests are prevented by the UI, while this unique pair protects repeats.
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update on public.connection_requests to authenticated;
