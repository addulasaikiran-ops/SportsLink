-- SPORTSLINK: create connection requests and enforce participant-only access.
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

create index if not exists connection_requests_recipient_status_idx
  on public.connection_requests(recipient_id, status, created_at desc);
create index if not exists connection_requests_requester_status_idx
  on public.connection_requests(requester_id, status, created_at desc);

alter table public.connection_requests enable row level security;

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
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists guard_connection_request_identity_trigger on public.connection_requests;
create trigger guard_connection_request_identity_trigger
before update on public.connection_requests
for each row execute function public.guard_connection_request_identity();

grant select, insert, update on public.connection_requests to authenticated;
