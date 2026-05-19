-- Enums
create type public.user_role as enum ('owner', 'instructor', 'client');
create type public.booking_status as enum ('confirmed', 'waitlist', 'cancelled');
create type public.payment_method as enum ('cash', 'waived', 'pending', 'paid');

-- role_grants: pre-maps emails to roles so signups get correct role
create table public.role_grants (
  email text primary key,
  role  public.user_role not null
);

-- profiles: extends auth.users, one row per user
create table public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  role               public.user_role not null default 'client',
  display_name       text not null default '',
  preferred_language text not null default 'he' check (preferred_language in ('en', 'he')),
  created_at         timestamptz not null default now()
);

-- classes
create table public.classes (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  instructor_id    uuid not null references public.profiles(id),
  scheduled_at     timestamptz not null,
  duration_minutes int not null default 60,
  max_capacity     int not null default 20,
  location         text,
  created_at       timestamptz not null default now()
);

-- bookings
create table public.bookings (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references public.classes(id) on delete cascade,
  client_id  uuid not null references public.profiles(id) on delete cascade,
  status     public.booking_status not null default 'confirmed',
  attended   boolean not null default false,
  created_at timestamptz not null default now(),
  unique (class_id, client_id)
);

-- payments
create table public.payments (
  id               uuid primary key default gen_random_uuid(),
  booking_id       uuid not null references public.bookings(id) on delete cascade,
  client_id        uuid not null references public.profiles(id),
  method           public.payment_method not null default 'pending',
  green_invoice_id text,
  amount           numeric(10, 2),
  created_at       timestamptz not null default now()
);

-- Trigger: auto-create profile on new auth user, checking role_grants first
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  assigned_role public.user_role;
begin
  select role into assigned_role
  from public.role_grants
  where email = new.email;

  insert into public.profiles (id, role, display_name, preferred_language)
  values (
    new.id,
    coalesce(assigned_role, 'client'),
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    coalesce(new.raw_user_meta_data->>'preferred_language', 'he')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
