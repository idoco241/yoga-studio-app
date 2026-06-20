-- get_managed_classes: returns all upcoming classes for any staff member (owner or instructor)
CREATE OR REPLACE FUNCTION public.get_managed_classes(
  p_start_ts timestamptz,
  p_end_ts   timestamptz
)
RETURNS TABLE (
  id               uuid,
  title            text,
  category         text,
  scheduled_at     timestamptz,
  duration_minutes integer,
  max_capacity     integer,
  location         text,
  instructor_name  text,
  confirmed_count  integer,
  waitlist_count   integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    c.id, c.title, c.category, c.scheduled_at,
    c.duration_minutes, c.max_capacity, c.location,
    p.display_name,
    COUNT(b.id) FILTER (WHERE b.status = 'confirmed')::integer,
    COUNT(b.id) FILTER (WHERE b.status = 'waitlist')::integer
  FROM classes c
  JOIN profiles p ON p.id = c.instructor_id
  LEFT JOIN bookings b ON b.class_id = c.id
  WHERE c.scheduled_at BETWEEN p_start_ts AND p_end_ts
    AND current_user_role() IN ('owner', 'instructor')
  GROUP BY c.id, p.display_name
  ORDER BY c.scheduled_at;
$$;

-- get_class_roster: returns non-cancelled bookings for a class with client names
CREATE OR REPLACE FUNCTION public.get_class_roster(p_class_id uuid)
RETURNS TABLE (
  booking_id  uuid,
  client_name text,
  status      text,
  attended    boolean,
  created_at  timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.id, pr.display_name, b.status::text, b.attended, b.created_at
  FROM bookings b
  JOIN profiles pr ON pr.id = b.client_id
  WHERE b.class_id = p_class_id AND b.status != 'cancelled'
  ORDER BY b.status, b.created_at;
$$;

-- mark_attendance: toggles attended flag — only for the class instructor or owner
CREATE OR REPLACE FUNCTION public.mark_attendance(p_booking_id uuid, p_attended boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE bookings SET attended = p_attended
  WHERE id = p_booking_id
    AND EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_id
        AND (current_user_role() = 'owner' OR c.instructor_id = auth.uid())
    );
  IF NOT FOUND THEN RAISE EXCEPTION 'not_authorized'; END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_managed_classes(timestamptz, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_class_roster(uuid)                         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_attendance(uuid, boolean)                 FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_managed_classes(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_class_roster(uuid)                         TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_attendance(uuid, boolean)                 TO authenticated;
