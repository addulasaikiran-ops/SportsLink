CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- These predicates are referenced by existing RLS policies. Moving the
-- function objects preserves those dependencies while removing public RPC exposure.
ALTER FUNCTION public.is_conversation_member(uuid, uuid) SET SCHEMA private;
ALTER FUNCTION public.is_conversation_creator(uuid, uuid) SET SCHEMA private;

-- Keep the privileged implementation private. SPORTSLINK's backend continues
-- to call a public SECURITY INVOKER wrapper with the original RPC signature.
ALTER FUNCTION public.create_conversation_for_user(uuid[], boolean, text) SET SCHEMA private;
ALTER FUNCTION private.create_conversation_for_user(uuid[], boolean, text)
  RENAME TO create_conversation_for_user_impl;

REVOKE ALL ON FUNCTION private.is_conversation_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_conversation_creator(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.create_conversation_for_user_impl(uuid[], boolean, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.is_conversation_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_conversation_creator(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.create_conversation_for_user_impl(uuid[], boolean, text) TO authenticated, service_role;

CREATE FUNCTION public.create_conversation_for_user(
  p_member_ids uuid[],
  p_is_group boolean DEFAULT false,
  p_title text DEFAULT NULL
)
RETURNS uuid
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT private.create_conversation_for_user_impl(p_member_ids, p_is_group, p_title);
$function$;

REVOKE ALL ON FUNCTION public.create_conversation_for_user(uuid[], boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_conversation_for_user(uuid[], boolean, text) TO authenticated, service_role;
