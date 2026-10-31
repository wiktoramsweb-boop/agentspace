-- v61: zmienne opłaty lokalu i portal właściciela.
-- Dostęp tylko z serwera (service_role). Brak polityk RLS = brak dostępu z przeglądarki.

-- Każdy rachunek osobno: prąd bywa co 2 miesiące, gaz inny niż w zeszłym miesiącu.
create table if not exists public.rental_charges (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.rental_units(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  miesiac text not null,
  okres_mies integer not null default 1,
  rodzaj text not null,
  kwota numeric not null,
  -- Najemca dopłaca to w rozliczeniu z biurem albo właścicielem.
  najemca_placi boolean not null default true,
  -- Biuro zapłaciło rachunek z pieniędzy właściciela, więc odejmujemy go od wypłaty.
  biuro_oplaca boolean not null default false,
  odczyt numeric,
  opis text,
  created_at timestamptz not null default now()
);
create index if not exists rental_charges_unit_idx on public.rental_charges(unit_id, miesiac);
create index if not exists rental_charges_agency_idx on public.rental_charges(agency_id, miesiac);

-- Właściciel widzi miesiąc dopiero po zatwierdzeniu przez biuro.
alter table public.rental_payments add column if not exists opublikowano timestamptz;

alter table public.rental_events add column if not exists zgoda text not null default 'nie_dotyczy';
alter table public.rental_events add column if not exists od_wlasciciela boolean not null default false;
alter table public.rental_events add column if not exists dla_wlasciciela boolean not null default true;

-- Dostęp właściciela: jeden link obejmuje wszystkie jego lokale.
create table if not exists public.rental_owner_access (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  token text not null unique,
  nazwa text not null,
  unit_ids uuid[] not null default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_seen_at timestamptz
);
create index if not exists rental_owner_access_agency_idx on public.rental_owner_access(agency_id);

create table if not exists public.rental_owner_messages (
  id uuid primary key default gen_random_uuid(),
  access_id uuid not null references public.rental_owner_access(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  autor text not null,
  autor_id uuid references public.profiles(id) on delete set null,
  tresc text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists rental_owner_messages_access_idx on public.rental_owner_messages(access_id, created_at);

alter table public.rental_charges enable row level security;
alter table public.rental_owner_access enable row level security;
alter table public.rental_owner_messages enable row level security;
