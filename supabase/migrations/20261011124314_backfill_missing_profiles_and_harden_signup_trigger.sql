-- Backfill profiles for Auth users created before the profile-creation trigger was installed.
-- Safe to re-run: existing profile IDs are left unchanged.

insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
    ''
  ),
  case
    when u.raw_user_meta_data ->> 'role' = any (array[
      'athlete','coach','scout','agent','club','sports_organization','medical','media','trainer','other'
    ]) then u.raw_user_meta_data ->> 'role'
    else 'athlete'
  end
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- Keep a robust profile-creation trigger for future accounts.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (id, full_name, username, role)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
             nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
             ''),
    nullif(btrim(new.raw_user_meta_data ->> 'username'), ''),
    case
      when new.raw_user_meta_data ->> 'role' = any (array[
        'athlete','coach','scout','agent','club','sports_organization','medical','media','trainer','other'
      ]) then new.raw_user_meta_data ->> 'role'
      else 'athlete'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user();
