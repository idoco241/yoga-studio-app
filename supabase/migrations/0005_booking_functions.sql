-- Helper: returns classes for a date range with confirmed count + current user's booking status.
-- SECURITY DEFINER so confirmed_count bypasses RLS on bookings (clients can't see others' bookings).
CREATE OR REPLACE FUNCTION public.get_classes_for_date(
  start_ts timestamptz,
  end_ts   timestamptz
)
RETURNS TABLE (
  id                 uuid,
  title              text,
  description        text,
  category           text,
  scheduled_at       timestamptz,
  duration_minutes   integer,
  max_capacity       integer,
  location           text,
  instructor_name    text,
  confirmed_count    integer,
  my_booking_id      uuid,
  my_booking_status  text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    c.id, c.title, c.description, c.category, c.scheduled_at,
    c.duration_minutes, c.max_capacity, c.location,
    p.display_name AS instructor_name,
    COUNT(b.id) FILTER (WHERE b.status = 'confirmed')::integer AS confirmed_count,
    mb.id   AS my_booking_id,
    mb.status::text AS my_booking_status
  FROM   classes  c
  JOIN   profiles p  ON p.id = c.instructor_id
  LEFT JOIN bookings b  ON b.class_id = c.id
  LEFT JOIN bookings mb ON mb.class_id = c.id AND mb.client_id = auth.uid()
  WHERE  c.scheduled_at >= start_ts AND c.scheduled_at <= end_ts
  GROUP BY c.id, p.display_name, mb.id, mb.status
  ORDER BY c.scheduled_at;
$$;

-- Same shape but for a single class (used by the detail screen).
CREATE OR REPLACE FUNCTION public.get_class_by_id(p_class_id uuid)
RETURNS TABLE (
  id                 uuid,
  title              text,
  description        text,
  category           text,
  scheduled_at       timestamptz,
  duration_minutes   integer,
  max_capacity       integer,
  location           text,
  instructor_name    text,
  confirmed_count    integer,
  my_booking_id      uuid,
  my_booking_status  text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    c.id, c.title, c.description, c.category, c.scheduled_at,
    c.duration_minutes, c.max_capacity, c.location,
    p.display_name AS instructor_name,
    COUNT(b.id) FILTER (WHERE b.status = 'confirmed')::integer AS confirmed_count,
    mb.id   AS my_booking_id,
    mb.status::text AS my_booking_status
  FROM   classes  c
  JOIN   profiles p  ON p.id = c.instructor_id
  LEFT JOIN bookings b  ON b.class_id = c.id
  LEFT JOIN bookings mb ON mb.class_id = c.id AND mb.client_id = auth.uid()
  WHERE  c.id = p_class_id
  GROUP BY c.id, p.display_name, mb.id, mb.status;
$$;

-- Atomic book: confirms if capacity available, otherwise waitlists.
CREATE OR REPLACE FUNCTION public.book_class(p_class_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_capacity  integer;
  v_confirmed integer;
  v_status    public.booking_status;
BEGIN
  SELECT max_capacity INTO v_capacity FROM classes WHERE id = p_class_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'class_not_found'; END IF;

  SELECT COUNT(*) INTO v_confirmed
  FROM bookings WHERE class_id = p_class_id AND status = 'confirmed';

  v_status := CASE WHEN v_confirmed < v_capacity THEN 'confirmed' ELSE 'waitlist' END;

  INSERT INTO bookings (class_id, client_id, status)
  VALUES (p_class_id, auth.uid(), v_status)
  ON CONFLICT (class_id, client_id) DO UPDATE SET status = v_status;

  RETURN v_status::text;
END;
$$;

-- Cancel booking + promote the earliest waitlist entry for the same class.
CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_class_id      uuid;
  v_next_waitlist uuid;
BEGIN
  SELECT class_id INTO v_class_id
  FROM bookings
  WHERE id = p_booking_id AND client_id = auth.uid() AND status != 'cancelled';
  IF NOT FOUND THEN RAISE EXCEPTION 'booking_not_found'; END IF;

  UPDATE bookings SET status = 'cancelled' WHERE id = p_booking_id;

  SELECT id INTO v_next_waitlist
  FROM bookings
  WHERE class_id = v_class_id AND status = 'waitlist'
  ORDER BY created_at
  LIMIT 1;

  IF v_next_waitlist IS NOT NULL THEN
    UPDATE bookings SET status = 'confirmed' WHERE id = v_next_waitlist;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_classes_for_date(timestamptz, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_class_by_id(uuid)                          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.book_class(uuid)                               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cancel_booking(uuid)                           FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_classes_for_date(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_class_by_id(uuid)                          TO authenticated;
GRANT EXECUTE ON FUNCTION public.book_class(uuid)                               TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid)                           TO authenticated;
