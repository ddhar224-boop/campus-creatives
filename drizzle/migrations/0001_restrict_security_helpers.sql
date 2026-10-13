REVOKE EXECUTE ON FUNCTION public.on_teammaker_signup() FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated,service_role;
REVOKE EXECUTE ON FUNCTION public.can_read_session(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_read_session(uuid) TO authenticated,service_role;