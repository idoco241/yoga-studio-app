-- Add category column to classes
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'yoga'
    CHECK (category IN ('yoga', 'meditation', 'specialty'));

-- Seed ~11 sample dev classes spread over the next 7 days.
-- Looks up the owner by email so no UUIDs are hardcoded.
-- No-op if the owner profile doesn't exist yet.
DO $$
DECLARE
  owner_id uuid;
BEGIN
  SELECT p.id INTO owner_id
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = 'idocohen241@gmail.com';

  IF owner_id IS NULL THEN
    RAISE NOTICE 'Owner profile not found — skipping class seed';
    RETURN;
  END IF;

  INSERT INTO public.classes
    (title, description, category, instructor_id, scheduled_at, duration_minutes, max_capacity, location)
  VALUES
    ('Vinyasa Flow',
     'Dynamic flow linking breath to movement',
     'yoga', owner_id,
     (CURRENT_DATE::timestamp + INTERVAL '6 hours')::timestamptz, 60, 20, 'Studio A'),

    ('Yin Yoga',
     'Deep stretching and connective tissue release',
     'yoga', owner_id,
     (CURRENT_DATE::timestamp + INTERVAL '16 hours')::timestamptz, 75, 16, 'Studio B'),

    ('Morning Meditation',
     'Guided mindfulness and breath work',
     'meditation', owner_id,
     (CURRENT_DATE::timestamp + INTERVAL '1 day' + INTERVAL '5 hours 30 minutes')::timestamptz, 45, 12, 'Studio B'),

    ('Power Flow',
     'Challenging vinyasa for experienced practitioners',
     'yoga', owner_id,
     (CURRENT_DATE::timestamp + INTERVAL '1 day' + INTERVAL '9 hours')::timestamptz, 60, 20, 'Studio A'),

    ('Restorative Yoga',
     'Gentle supported poses for deep relaxation',
     'yoga', owner_id,
     (CURRENT_DATE::timestamp + INTERVAL '2 days' + INTERVAL '8 hours')::timestamptz, 75, 14, 'Studio B'),

    ('Aerial Yoga',
     'Yoga using a suspended silk hammock',
     'specialty', owner_id,
     (CURRENT_DATE::timestamp + INTERVAL '3 days' + INTERVAL '7 hours')::timestamptz, 60, 10, 'Studio A'),

    ('Evening Flow',
     'Unwind with a calming evening practice',
     'yoga', owner_id,
     (CURRENT_DATE::timestamp + INTERVAL '3 days' + INTERVAL '17 hours')::timestamptz, 60, 20, 'Studio B'),

    ('Hatha Yoga',
     'Classic postures with alignment focus',
     'yoga', owner_id,
     (CURRENT_DATE::timestamp + INTERVAL '4 days' + INTERVAL '6 hours')::timestamptz, 60, 18, 'Studio A'),

    ('Sound Bath',
     'Immersive meditation with singing bowls',
     'specialty', owner_id,
     (CURRENT_DATE::timestamp + INTERVAL '4 days' + INTERVAL '17 hours 30 minutes')::timestamptz, 60, 15, 'Studio B'),

    ('Gentle Flow',
     'Accessible yoga for all levels',
     'yoga', owner_id,
     (CURRENT_DATE::timestamp + INTERVAL '5 days' + INTERVAL '7 hours')::timestamptz, 60, 20, 'Studio A'),

    ('Breathwork',
     'Pranayama and breath awareness',
     'meditation', owner_id,
     (CURRENT_DATE::timestamp + INTERVAL '6 days' + INTERVAL '8 hours 30 minutes')::timestamptz, 60, 12, 'Studio B');

END;
$$;
