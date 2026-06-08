-- 0004 revoked EXECUTE from PUBLIC (which includes authenticated) but never re-granted it.
-- RLS policies on bookings/payments/classes call current_user_role(), so authenticated
-- users need EXECUTE or every policy check fails with "permission denied for function".
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
