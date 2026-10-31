-- v60: zarządzanie najmem długoterminowym i rola zarządcy najmu.
-- Dostęp tylko z serwera (service_role). Brak polityk RLS = brak dostępu z przeglądarki.

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'profiles_role_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles drop constraint profiles_role_check;
  end if;
  alter table public.profiles add constraint profiles_role_check check (
    role in ('owner', 'director', 'manager', 'agent', 'assistant', 'accountant', 'coordinator', 'trainee', 'credit_advisor', 'rental_manager')
  );
end $$;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'invitations_role_check' and conrelid = 'public.invitations'::regclass) then
    alter table public.invitations drop constraint invitations_role_check;
  end if;
  alter table public.invitations add constraint invitations_role_check check (
    role in ('owner', 'director', 'manager', 'agent', 'assistant', 'accountant', 'coordinator', 'trainee', 'credit_advisor', 'rental_manager')
  );
exception when undefined_table then null;
end $$;

-- Dokumenty: skany umów przy lokalu.
alter table public.documents drop constraint if exists documents_entity_type_check;
alter table public.documents add constraint documents_entity_type_check check (entity_type in ('property', 'client', 'najem'));

create table if not exists public.rental_settings (
  agency_id uuid primary key references public.agencies(id) on delete cascade,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.rental_units (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  opiekun_id uuid references public.profiles(id) on delete set null,
  adres text not null,
  miasto text,
  lat double precision,
  lng double precision,
  pow numeric,
  pokoje integer,
  kw text,
  etap text not null default 'pozyskanie',
  typ_najmu text not null default 'caly_lokal',
  model text not null default 'B',
  prowizja_pct numeric,
  parking_w_podstawie boolean not null default false,
  oplata_startowa numeric,
  czynsz_oczekiwany numeric,
  czynsz_min numeric,
  limit_napraw numeric,
  oplaty_admin numeric,
  umowa_od date,
  ankieta jsonb not null default '{}'::jsonb,
  liczniki jsonb not null default '{}'::jsonb,
  kroki jsonb not null default '{}'::jsonb,
  notatka text,
  kanban_pos double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists rental_units_agency_idx on public.rental_units(agency_id, etap);

create table if not exists public.rental_parties (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.rental_units(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  rola text not null,
  nazwa text not null,
  telefon text,
  email text,
  uwagi text,
  created_at timestamptz not null default now()
);
create index if not exists rental_parties_unit_idx on public.rental_parties(unit_id);

create table if not exists public.rental_tenancies (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.rental_units(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  forma text not null default 'zwykly',
  od date not null,
  do_dnia date,
  czynsz numeric not null,
  parking numeric not null default 0,
  oplaty numeric not null default 0,
  kaucja numeric not null default 0,
  kaucja_stan text not null default 'pobrana',
  dzien_platnosci integer not null default 10,
  us_zgloszono date,
  aktywny boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists rental_tenancies_unit_idx on public.rental_tenancies(unit_id, aktywny);

-- Jeden wiersz to jeden miesiąc rozliczenia lokalu.
create table if not exists public.rental_payments (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.rental_units(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  miesiac text not null,
  czynsz numeric not null default 0,
  oplaty numeric not null default 0,
  koszty numeric not null default 0,
  koszty_opis text,
  przekazano date,
  updated_at timestamptz not null default now(),
  unique (unit_id, miesiac)
);
create index if not exists rental_payments_agency_idx on public.rental_payments(agency_id, miesiac);

-- Usterki, przeglądy i zdarzenia w lokalu.
create table if not exists public.rental_events (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.rental_units(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  rodzaj text not null default 'usterka',
  tytul text not null,
  stan text not null default 'otwarte',
  koszt numeric,
  termin date,
  autor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists rental_events_unit_idx on public.rental_events(unit_id, created_at desc);

alter table public.rental_settings enable row level security;
alter table public.rental_units enable row level security;
alter table public.rental_parties enable row level security;
alter table public.rental_tenancies enable row level security;
alter table public.rental_payments enable row level security;
alter table public.rental_events enable row level security;
