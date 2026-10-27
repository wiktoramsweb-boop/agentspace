-- v54: większe biura.
--
-- 1. Oddziały: biuro dzieli zespół na oddziały (np. Kraków Centrum, Kraków
--    Ruczaj, Wieliczka). Osoba i lead mogą należeć do oddziału; kierownik
--    oddziału widzi wyniki swojego oddziału, a raporty porównują oddziały.
-- 2. Zasady prowizji biura: progi udziału agenta, nadprowizja menedżera
--    i opłata dla sieci (franczyza).
-- 3. Podział prowizji z transakcji między kilka osób (współagent, polecający).
-- 4. Kolejka zdjęć z importu: adresy zdjęć z poprzedniego systemu, które
--    aplikacja pobiera do swojego magazynu partiami.
-- Dostęp tylko z serwera (service_role). Brak polityk RLS = brak dostępu z przeglądarki.

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  name text not null,
  city text,
  address text,
  phone text,
  -- Kierownik oddziału: dostaje poniedziałkowe podsumowanie swojego oddziału.
  manager_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists branches_agency_idx on public.branches(agency_id);
alter table public.branches enable row level security;

alter table public.profiles add column if not exists branch_id uuid references public.branches(id) on delete set null;
create index if not exists profiles_branch_idx on public.profiles(branch_id);

-- Lead bez opiekuna, ale z oddziałem, czeka w puli tego oddziału.
alter table public.leads add column if not exists branch_id uuid references public.branches(id) on delete set null;
create index if not exists leads_branch_idx on public.leads(agency_id, branch_id);

create table if not exists public.commission_rules (
  agency_id uuid primary key references public.agencies(id) on delete cascade,
  -- [{ "od": 0, "pct": 50 }, { "od": 60000, "pct": 60 }]: udział agenta
  -- rośnie z jego prowizją netto biura od początku roku.
  progi jsonb not null default '[]'::jsonb,
  -- Procent prowizji netto biura z transakcji agentów menedżera.
  manager_override_pct numeric(5,2) not null default 0,
  -- Opłata dla sieci / franczyzodawcy jako procent prowizji netto biura.
  network_fee_pct numeric(5,2) not null default 0,
  network_name text,
  updated_at timestamptz not null default now()
);
alter table public.commission_rules enable row level security;

create table if not exists public.deal_splits (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  -- wspolagent | polecajacy | inny
  rola text not null default 'wspolagent',
  -- Procent prowizji netto biura dla tej osoby.
  pct numeric(5,2) not null,
  kwota_pln integer not null default 0,
  created_at timestamptz not null default now(),
  unique (deal_id, profile_id)
);
create index if not exists deal_splits_agency_idx on public.deal_splits(agency_id);
create index if not exists deal_splits_profile_idx on public.deal_splits(profile_id);
alter table public.deal_splits enable row level security;

-- Adresy zdjęć do pobrania po imporcie ofert. Pusta tablica = nic nie czeka.
alter table public.properties add column if not exists import_photo_urls jsonb not null default '[]'::jsonb;
-- Identyfikator z poprzedniego systemu: chroni przed podwójnym importem.
alter table public.properties add column if not exists external_id text;
alter table public.clients add column if not exists external_id text;

-- Zgłoszenia „przenieście nam bazę”: kto, z jakiego systemu, jakie pliki.
create table if not exists public.migration_requests (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  system text not null,
  offers_count integer,
  clients_count integer,
  note text,
  files jsonb not null default '[]'::jsonb,
  status text not null default 'nowe',
  created_at timestamptz not null default now()
);
alter table public.migration_requests enable row level security;

