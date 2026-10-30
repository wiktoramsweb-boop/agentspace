-- v58: zapisane wyceny z RCN. Każda policzona wycena trafia tu razem z raportem,
-- więc można do niej wrócić bez ponownego pytania rejestru i powiązać ją z ofertą.
-- Dostęp tylko z serwera (service_role). Brak polityk RLS = brak dostępu z przeglądarki.

create table if not exists public.valuations (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  agent_id uuid references public.profiles(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  adres text not null,
  dla text,
  pow numeric,
  szacunek numeric not null,
  cena_m2 numeric,
  cena_ofertowa numeric,
  pewnosc text,
  zrodlo text,
  cena_ogloszenia numeric,
  parametry jsonb not null default '{}'::jsonb,
  raport jsonb not null,
  slad text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agent_id, slad)
);
create index if not exists valuations_agency_idx on public.valuations(agency_id, updated_at desc);
create index if not exists valuations_property_idx on public.valuations(property_id, updated_at desc);
alter table public.valuations enable row level security;
