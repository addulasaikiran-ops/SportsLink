-- Prevent callers from using SECURITY DEFINER membership helpers to query
-- membership or creator status for another user's identity. Existing policies
-- call these functions with one argument, so target_user defaults to auth.uid().
create or replace function public.is_conversation_member(target_conversation uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select target_user = auth.uid()
    and exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = target_conversation and cm.user_id = target_user
    );
$function$;

create or replace function public.is_conversation_creator(target_conversation uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select target_user = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = target_conversation and c.created_by = target_user
    );
$function$;

grant execute on function public.is_conversation_member(uuid, uuid) to authenticated;
grant execute on function public.is_conversation_creator(uuid, uuid) to authenticated;
