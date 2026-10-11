-- Messaging RLS policies call these SECURITY DEFINER predicates.
-- The authenticated role needs EXECUTE for policy evaluation while existing
-- row-level policies continue to control which conversations are visible.
grant execute on function public.is_conversation_member(uuid, uuid) to authenticated;
grant execute on function public.is_conversation_creator(uuid, uuid) to authenticated;
