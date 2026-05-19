-- Pre-seed role assignments so owner + instructor get the correct role when they sign up.
-- The trigger in 0001 reads this table and assigns role automatically.
insert into public.role_grants (email, role) values
  ('idocohen241@gmail.com', 'owner'),
  ('shai12697@gmail.com', 'instructor')
on conflict (email) do update set role = excluded.role;
