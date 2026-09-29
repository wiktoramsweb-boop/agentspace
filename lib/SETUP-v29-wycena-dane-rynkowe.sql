-- v29: dane rynkowe jako podstawa wyceny.
--
-- Dwie zmiany wynikające z tego samego wniosku: wycena liczona z własnych
-- kilkunastu ofert biura nie jest wyceną. Potrzebne są dane rynkowe.
--
-- 1) market_price_levels - średnie ceny transakcyjne za metr z publicznych
--    źródeł (GUS, NBP). Nie zastąpią RCN z adresami, ale dają uczciwy rząd
--    wielkości dla każdego miasta, zamiast liczby wziętej z sufitu.
--
-- 2) market_transactions dostaje agency_id. W v28 tabela była wspólna dla
--    wszystkich biur, co jest dobre dla danych publicznych, ale złe dla
--    importu pojedynczego biura: jeden zepsuty plik psułby wyceny wszystkim.

create table if not exists public.market_price_levels (
  id uuid primary key default gen_random_uuid(),

  -- gus | nbp | reczne
  source text not null default 'gus',
  source_ref text,

  city text not null,
  -- Kod jednostki terytorialnej, żeby dopasowanie nie opierało się na nazwie.
  teryt text,
  voivodeship text,

  property_type text not null default 'mieszkanie',
  -- wtorny | pierwotny | null gdy źródło nie rozróżnia
  market text,

  -- Okres, którego dotyczy wartość: '2025' albo '2025-Q2'.
  period text not null,
  period_end date not null,

  price_per_m2 numeric not null check (price_per_m2 > 0),
  -- Liczba transakcji w próbce, o ile źródło ją podaje.
  sample_size integer,

  raw jsonb,
  created_at timestamptz not null default now()
);

-- Ponowny import tego samego okresu aktualizuje wartość, a nie dokłada wiersza.
create unique index if not exists market_price_levels_uidx
  on public.market_price_levels (source, city, property_type, coalesce(market, ''), period);

-- Wycena pyta o najświeższy poziom dla miasta i typu nieruchomości.
create index if not exists market_price_levels_lookup_idx
  on public.market_price_levels (city, property_type, period_end desc);

alter table public.market_price_levels enable row level security;

-- ── zakres danych transakcyjnych ────────────────────────────────────────────

alter table public.market_transactions
  add column if not exists agency_id uuid references public.agencies (id) on delete cascade;

create index if not exists market_transactions_scope_idx
  on public.market_transactions (agency_id, property_type, city, transacted_at desc);

-- Klucz przeciw dublowaniu musi uwzględniać biuro: dwa biura mogą
-- zaimportować ten sam wypis ze starostwa i oba mają go widzieć u siebie.
drop index if exists market_transactions_source_uidx;
create unique index if not exists market_transactions_source_uidx
  on public.market_transactions (
    coalesce(agency_id, '00000000-0000-0000-0000-000000000000'::uuid),
    source,
    source_ref
  )
  where source_ref is not null;
