-- ============================================================
-- AgentSpace — SETUP v5: Nieruchomości (hub) + kalkulator prowizji
--                        + adres/mapa i przypomnienia u klientów
-- ============================================================
-- Uruchom w Supabase SQL Editor PO SETUP v2 (i v3/v4).
-- Idempotentne — bezpieczne do ponownego uruchomienia.
-- ============================================================

-- ---------- PROPERTIES (nieruchomości / oferty) ----------
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.profiles(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete cascade,
  title text not null,                       -- np. "2-pok Krowodrza, 48 m²"
  deal_kind text not null default 'sprzedaz',    -- sprzedaz | wynajem
  property_type text not null default 'mieszkanie', -- mieszkanie | dom | dzialka | lokal | inne
  status text not null default 'aktywna',    -- aktywna | zarezerwowana | sfinalizowana | archiwum
  -- adres (z darmowego geokodera OSM/Nominatim)
  city text,
  address text,                              -- pełny adres tekstowo
  lat double precision,
  lng double precision,
  -- parametry oferty
  price_pln bigint,
  area_m2 numeric,
  rooms integer,
  floor integer,
  description text,
  -- właściciel oferty (klient sprzedający/wynajmujący)
  owner_client_id uuid references public.clients(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- PROPERTY INTERESTS (zainteresowani klienci: kupujący/najemcy) ----------
create table if not exists public.property_interests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  created_at timestamptz default now(),
  unique (property_id, client_id)
);

-- ---------- CLIENTS: adres + mapa + przypomnienie o kontakcie ----------
alter table public.clients add column if not exists city text;
alter table public.clients add column if not exists address text;
alter table public.clients add column if not exists lat double precision;
alter table public.clients add column if not exists lng double precision;
alter table public.clients add column if not exists next_contact_at date;

-- ---------- DEALS: kalkulator prowizji + powiązanie z ofertą ----------
alter table public.deals add column if not exists property_id uuid references public.properties(id) on delete set null;
alter table public.deals add column if not exists transaction_value_pln bigint;          -- cena transakcji (baza do %)
-- prowizje od poszczególnych stron (kwoty PLN po przeliczeniu)
alter table public.deals add column if not exists commission_seller_pln integer default 0;   -- od sprzedającego
alter table public.deals add column if not exists commission_buyer_pln integer default 0;    -- od kupującego
alter table public.deals add column if not exists commission_landlord_pln integer default 0; -- od wynajmującego
alter table public.deals add column if not exists commission_tenant_pln integer default 0;   -- od najemcy
alter table public.deals add column if not exists extras_pln integer default 0;              -- dodatki (np. doradca kredytowy)
alter table public.deals add column if not exists extras_note text;                          -- opis dodatków
alter table public.deals add column if not exists agent_split_pct integer default 50;        -- % agenta z prowizji
alter table public.deals add column if not exists agent_earnings_pln integer default 0;      -- wyliczony zarobek agenta

-- Backfill: stare transakcje traktujemy tak, że commission_pln = zarobek agenta
-- (bo tak było liczone przed v5). Uruchamiane raz; nie nadpisuje już policzonych.
update public.deals
   set agent_earnings_pln = commission_pln
 where coalesce(agent_earnings_pln, 0) = 0
   and coalesce(commission_pln, 0) <> 0;

-- ---------- DOMYŚLNY SPLIT AGENTA (na profilu) ----------
alter table public.profiles add column if not exists default_split_pct integer default 50;

-- ---------- INDEKSY ----------
create index if not exists properties_agent_idx on public.properties(agent_id, updated_at desc);
create index if not exists properties_agency_idx on public.properties(agency_id);
create index if not exists properties_owner_idx on public.properties(owner_client_id);
create index if not exists property_interests_prop_idx on public.property_interests(property_id);
create index if not exists property_interests_client_idx on public.property_interests(client_id);
create index if not exists clients_next_contact_idx on public.clients(agent_id, next_contact_at);
create index if not exists deals_property_idx on public.deals(property_id);

-- ---------- RLS (backstop — dostęp przez service_role) ----------
alter table public.properties enable row level security;
alter table public.property_interests enable row level security;
