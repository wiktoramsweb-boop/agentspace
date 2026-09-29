-- v28: dane rynkowe do analizy porównawczej cen (wyceniarka).
--
-- Tabela trzyma transakcje z zewnątrz, przede wszystkim z Rejestru Cen
-- Nieruchomości prowadzonego przez starostwa. Dane są publiczne, więc
-- korzystają z nich wszystkie biura - w odróżnieniu od własnych transakcji
-- biura, które NIGDY nie trafiają do wyceny innego biura.
--
-- Import: lib/wycena/import-rcn.ts (CSV -> ta tabela).

create table if not exists public.market_transactions (
  id uuid primary key default gen_random_uuid(),

  -- Skąd pochodzi rekord: rcn | portal | reczne
  source text not null default 'rcn',
  -- Klucz z systemu źródłowego, żeby ponowny import nie dublował rekordów.
  source_ref text,

  city text,
  district text,
  address text,
  lat double precision,
  lng double precision,

  property_type text not null default 'mieszkanie',
  area_m2 numeric not null check (area_m2 > 0),
  rooms integer,
  floor integer,
  floors_total integer,
  year_built integer,
  condition_std text,
  market text,

  price_pln numeric not null check (price_pln > 0),
  transacted_at timestamptz not null,

  -- Surowy wiersz ze źródła, gdyby trzeba było coś odtworzyć.
  raw jsonb,
  created_at timestamptz not null default now()
);

-- Ponowny import tego samego pliku ma aktualizować, a nie mnożyć wiersze.
create unique index if not exists market_transactions_source_uidx
  on public.market_transactions (source, source_ref)
  where source_ref is not null;

-- Zapytanie wyceny: typ + miasto + okno czasu.
create index if not exists market_transactions_lookup_idx
  on public.market_transactions (property_type, city, transacted_at desc);

-- Wyszukiwanie po okolicy.
create index if not exists market_transactions_geo_idx
  on public.market_transactions (lat, lng)
  where lat is not null and lng is not null;

-- Dane publiczne, ale dostęp i tak idzie przez kod serwera z service_role.
alter table public.market_transactions enable row level security;
