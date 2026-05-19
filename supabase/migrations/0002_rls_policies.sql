-- Enable RLS on all tables
alter table public.profiles   enable row level security;
alter table public.classes    enable row level security;
alter table public.bookings   enable row level security;
alter table public.payments   enable row level security;
alter table public.role_grants enable row level security;

-- Helper: returns the role of the currently authenticated user
create or replace function public.current_user_role()
returns public.user_role language sql security definer stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ── profiles ────────────────────────────────────────────────────────────────
-- All authenticated users can read profiles (needed to show instructor names)
create policy "profiles: authenticated read"
  on public.profiles for select
  using (auth.uid() is not null);

-- Users can update their own profile
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- Owner can update any profile (e.g. promote someone to instructor)
create policy "profiles: owner update any"
  on public.profiles for update
  using (public.current_user_role() = 'owner');

-- ── classes ──────────────────────────────────────────────────────────────────
create policy "classes: authenticated read"
  on public.classes for select
  using (auth.uid() is not null);

create policy "classes: staff insert"
  on public.classes for insert
  with check (public.current_user_role() in ('owner', 'instructor'));

create policy "classes: staff update"
  on public.classes for update
  using (public.current_user_role() in ('owner', 'instructor'));

create policy "classes: staff delete"
  on public.classes for delete
  using (public.current_user_role() in ('owner', 'instructor'));

-- ── bookings ─────────────────────────────────────────────────────────────────
-- Clients see own; staff sees all
create policy "bookings: read"
  on public.bookings for select
  using (
    auth.uid() = client_id
    or public.current_user_role() in ('owner', 'instructor')
  );

-- Clients book themselves
create policy "bookings: client insert"
  on public.bookings for insert
  with check (auth.uid() = client_id);

-- Clients cancel own; staff updates any (attendance, status)
create policy "bookings: update"
  on public.bookings for update
  using (
    auth.uid() = client_id
    or public.current_user_role() in ('owner', 'instructor')
  );

-- ── payments ─────────────────────────────────────────────────────────────────
-- Clients see own payments; owner sees all; instructor sees payments for their classes
create policy "payments: read"
  on public.payments for select
  using (
    auth.uid() = client_id
    or public.current_user_role() in ('owner', 'instructor')
  );

-- Staff creates payment records (cash/waived/pending); Green Invoice is handled server-side
create policy "payments: staff insert"
  on public.payments for insert
  with check (public.current_user_role() in ('owner', 'instructor'));

create policy "payments: staff update"
  on public.payments for update
  using (public.current_user_role() in ('owner', 'instructor'));

-- ── role_grants ───────────────────────────────────────────────────────────────
-- Only owner can read/manage role grants via app; migrations manage inserts
create policy "role_grants: owner read"
  on public.role_grants for select
  using (public.current_user_role() = 'owner');
