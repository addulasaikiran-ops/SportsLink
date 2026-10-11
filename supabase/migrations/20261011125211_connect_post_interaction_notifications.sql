-- Generate account-scoped notifications for the interaction types currently supported by SPORTSLINK.
-- Trigger functions run with a fixed empty search_path and use fully-qualified table names.

create index if not exists notifications_user_created_at_idx
  on public.notifications (user_id, created_at desc);

create or replace function public.notify_post_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  recipient_id uuid;
begin
  select p.author_id
    into recipient_id
    from public.posts as p
   where p.id = new.post_id;

  if recipient_id is not null and recipient_id <> new.author_id then
    insert into public.notifications
      (user_id, actor_id, type, entity_type, entity_id, message)
    values
      (recipient_id, new.author_id, 'comment', 'post', new.post_id, 'commented on your post');
  end if;

  return new;
end;
$function$;

drop trigger if exists notify_post_comment_created on public.comments;
create trigger notify_post_comment_created
after insert on public.comments
for each row execute function public.notify_post_comment();

create or replace function public.notify_post_reaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  recipient_id uuid;
begin
  if tg_op = 'UPDATE' and old.reaction is not distinct from new.reaction then
    return new;
  end if;

  select p.author_id
    into recipient_id
    from public.posts as p
   where p.id = new.post_id;

  if recipient_id is not null and recipient_id <> new.user_id then
    insert into public.notifications
      (user_id, actor_id, type, entity_type, entity_id, message)
    values
      (recipient_id, new.user_id, 'reaction', 'post', new.post_id, 'reacted to your post');
  end if;

  return new;
end;
$function$;

drop trigger if exists notify_post_reaction_created on public.post_reactions;
create trigger notify_post_reaction_created
after insert or update on public.post_reactions
for each row execute function public.notify_post_reaction();

create or replace function public.notify_new_follower()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.follower_id <> new.following_id then
    insert into public.notifications
      (user_id, actor_id, type, entity_type, entity_id, message)
    values
      (new.following_id, new.follower_id, 'follow', 'profile', new.follower_id, 'started following you');
  end if;

  return new;
end;
$function$;

drop trigger if exists notify_new_follower_created on public.follows;
create trigger notify_new_follower_created
after insert on public.follows
for each row execute function public.notify_new_follower();

-- These functions are for trigger invocation, not client-callable RPCs.
revoke all on function public.notify_post_comment() from public, anon, authenticated;
revoke all on function public.notify_post_reaction() from public, anon, authenticated;
revoke all on function public.notify_new_follower() from public, anon, authenticated;
