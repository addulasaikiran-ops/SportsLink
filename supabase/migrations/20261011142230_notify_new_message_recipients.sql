-- Notify every other member when a persisted message is sent.
-- Notifications are created in the same transaction as the message, so the
-- recipient is notified regardless of whether their messaging page is open.
-- The function is trigger-only and never exposes the message body in a notification.

create or replace function public.notify_new_message_recipient()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.notifications
    (user_id, actor_id, type, entity_type, entity_id, message)
  select
    cm.user_id,
    new.sender_id,
    'message',
    'conversation',
    new.conversation_id,
    'sent you a message'
  from public.conversation_members as cm
  where cm.conversation_id = new.conversation_id
    and cm.user_id <> new.sender_id;

  return new;
end;
$function$;

drop trigger if exists notify_message_created on public.messages;
create trigger notify_message_created
after insert on public.messages
for each row execute function public.notify_new_message_recipient();

-- This function is only for use by the trigger; clients cannot call it directly.
revoke all on function public.notify_new_message_recipient() from public, anon, authenticated;
