-- EventHub schema per Supabase (PostgreSQL)
-- Esegui da Dashboard → SQL Editor oppure: supabase db push

-- Profilo applicativo collegato ad auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  first_name text not null default '',
  last_name text not null default '',
  role text not null default 'user' check (role in ('user', 'organizer', 'admin')),
  is_banned boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id bigint generated always as identity primary key,
  title text not null,
  description text not null,
  category text not null,
  city text not null,
  venue text not null,
  start_at timestamptz not null,
  price numeric(10, 2) not null default 0,
  capacity integer not null check (capacity > 0),
  cover_image text,
  featured boolean not null default false,
  organizer_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_events_category on public.events (category);
create index if not exists idx_events_city on public.events (city);
create index if not exists idx_events_start_at on public.events (start_at);

create table if not exists public.registrations (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id bigint not null references public.events (id) on delete cascade,
  ticket_code text not null unique,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  registered_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id bigint not null references public.events (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  is_reported boolean not null default false,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

-- Trigger updated_at su events
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- Auto-crea profilo alla registrazione Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', split_part(coalesce(new.raw_user_meta_data->>'full_name', 'Utente'), ' ', 1)),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_app_meta_data->>'role', 'user')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.reviews enable row level security;

-- Profiles: lettura pubblica nome, modifica solo proprio profilo
create policy "profiles_select_public" on public.profiles
  for select using (true);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Events: lettura pubblica, scrittura organizzatori/admin
create policy "events_select_all" on public.events for select using (true);

create policy "events_insert_organizer" on public.events for insert
  with check (
    auth.uid() = organizer_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('organizer', 'admin') and not p.is_banned
    )
  );

create policy "events_update_own" on public.events for update
  using (
    auth.uid() = organizer_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "events_delete_own" on public.events for delete
  using (
    auth.uid() = organizer_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Registrations
create policy "registrations_select_own" on public.registrations for select
  using (auth.uid() = user_id);

create policy "registrations_insert_own" on public.registrations for insert
  with check (auth.uid() = user_id);

create policy "registrations_update_own" on public.registrations for update
  using (auth.uid() = user_id);

-- Reviews
create policy "reviews_select_visible" on public.reviews for select
  using (not is_hidden);

create policy "reviews_insert_own" on public.reviews for insert
  with check (auth.uid() = user_id);

-- Storage bucket (crea bucket "event-covers" come public in dashboard se non esiste)
-- Policy esempio (da applicare in Storage → Policies):
-- SELECT public, INSERT authenticated su bucket event-covers
