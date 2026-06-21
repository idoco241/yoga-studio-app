-- Push token on profiles so Edge Functions can send notifications
ALTER TABLE public.profiles ADD COLUMN push_token text;

-- Track when the post-lesson payment notification was sent for a class
ALTER TABLE public.classes ADD COLUMN payment_notified_at timestamptz;

-- One payment record per booking
ALTER TABLE public.payments ADD CONSTRAINT payments_booking_id_key UNIQUE (booking_id);

-- URL of the Green Invoice hosted payment page (owner-taught lessons only)
ALTER TABLE public.payments ADD COLUMN payment_url text;

-- get_payment_review: roster + existing payment state for the instructor review screen
CREATE OR REPLACE FUNCTION public.get_payment_review(p_class_id uuid)
RETURNS TABLE (
  booking_id     uuid,
  client_id      uuid,
  client_name    text,
  client_token   text,
  attended       boolean,
  payment_id     uuid,
  payment_method text,
  payment_url    text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    b.id,
    b.client_id,
    pr.display_name,
    pr.push_token,
    b.attended,
    pay.id,
    pay.method::text,
    pay.payment_url
  FROM bookings b
  JOIN profiles pr ON pr.id = b.client_id
  LEFT JOIN payments pay ON pay.booking_id = b.id
  WHERE b.class_id = p_class_id AND b.status = 'confirmed'
  ORDER BY pr.display_name;
$$;

-- set_payment_method: upsert a payment record (staff only)
CREATE OR REPLACE FUNCTION public.set_payment_method(
  p_booking_id uuid,
  p_method     public.payment_method
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id        uuid;
  v_client_id uuid;
BEGIN
  IF current_user_role() NOT IN ('owner', 'instructor') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT client_id INTO v_client_id FROM bookings WHERE id = p_booking_id;

  INSERT INTO payments (booking_id, client_id, method)
  VALUES (p_booking_id, v_client_id, p_method)
  ON CONFLICT (booking_id) DO UPDATE SET method = EXCLUDED.method
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_payment_review(uuid)                       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_payment_method(uuid, public.payment_method) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_payment_review(uuid)                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_payment_method(uuid, public.payment_method) TO authenticated;
