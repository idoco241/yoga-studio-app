-- Fix 1: lock down search_path on current_user_role (was mutable)
create or replace function public.current_user_role()
returns public.user_role language sql security definer stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Fix 2: revoke EXECUTE from PUBLIC (covers anon + authenticated) on internal functions
-- These are RLS helpers / triggers and must not be callable via the REST API
revoke execute on function public.current_user_role() from public;
revoke execute on function public.handle_new_user() from public;
