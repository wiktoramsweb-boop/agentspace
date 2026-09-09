-- ═══════════════════════════════════════════════════════════════════════
-- AgentSpace SETUP v21: POSZUKIWANIA + dopasowania + proces nieruchomości
--
-- Uruchom w Supabase -> SQL Editor. Idempotentny. Wymaga v20.
--
-- Po co:
--  * Poszukiwania = czego szuka kupujacy/najemca (zakresy ceny, metrazu, pokoi).
--    To druga strona rynku: bez tego nie da sie kojarzyc klientow z ofertami.
--  * Dopasowania = automatyczne laczenie poszukiwan z ofertami biura.
--  * Proces nieruchomosci = 7 etapow obslugi oferty (jak pasek w ASARI).
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Poszukiwania ───────────────────────────────────────────────────
create table if not exists public.searches (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  agent_id uuid references public.profiles (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,

  search_no text,
  title text,
  deal_kind text not null default 'sprzedaz',      -- sprzedaz (kupno) | wynajem (najem)
  property_types text[] not null default '{}',     -- mieszkanie, dom, dzialka...

  price_min numeric,
  price_max numeric,
  area_min numeric,
  area_max numeric,
  rooms_min integer,
  rooms_max integer,
  floor_min integer,
  floor_max integer,
  year_built_min integer,

  locations text[] not null default '{}',          -- miasta i dzielnice
  must_have jsonb not null default '{}'::jsonb,    -- wymagane udogodnienia
  status text not null default 'aktualne',         -- aktualne | wstrzymane | zamkniete
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.searches is
  'Poszukiwania klientow kupujacych/najemcow. Odpowiednik modulu Poszukiwania z ASARI.';
comment on column public.searches.must_have is
  'Wymagane udogodnienia, np. {"winda":true,"garaz":true}. Oferta bez nich nie zostanie dopasowana.';

create index if not exists searches_agency_status_idx on public.searches (agency_id, status);
create index if not exists searches_client_idx on public.searches (client_id) where client_id is not null;
create index if not exists searches_agent_idx on public.searches (agent_id);

-- ── 2. Dopasowania (co juz pokazalismy klientowi) ─────────────────────
-- Samo dopasowanie liczymy w locie, ale zapamietujemy decyzje agenta, zeby
-- "Nowe dopasowania" oznaczalo naprawde nowe, a nie te same oferty co wczoraj.
create table if not exists public.search_matches (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  search_id uuid not null references public.searches (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  status text not null default 'nowe',             -- nowe | wyslane | odrzucone | zainteresowany
  note text,
  created_at timestamptz not null default now(),
  unique (search_id, property_id)
);

create index if not exists search_matches_search_idx on public.search_matches (search_id);
create index if not exists search_matches_property_idx on public.search_matches (property_id);

-- ── 3. Proces obslugi nieruchomosci (pasek etapow jak w ASARI) ───────
alter table public.properties add column if not exists process_stage text default 'przyjeta';
alter table public.properties add column if not exists process_changed_at timestamptz;

comment on column public.properties.process_stage is
  'Etap obslugi: przyjeta | male_zainteresowanie | liczne_prezentacje | zlozona_oferta | oplata_rezerwacyjna | umowa_przedwstepna | wygrana';

-- ── 4. Rola klienta przy nieruchomosci ───────────────────────────────
-- Ta sama kolumna owner_client_id, ale wiemy czy to wlasciciel czy wynajmujacy.
alter table public.properties add column if not exists owner_role text default 'wlasciciel';

comment on column public.properties.owner_role is
  'Rola powiazanego klienta: wlasciciel (sprzedaz) | wynajmujacy (najem) | wspolwlasciciel | pelnomocnik';

-- ── 5. Liczniki numerow poszukiwan (per biuro i rok) ─────────────────
create table if not exists public.search_counters (
  agency_id uuid primary key references public.agencies (id) on delete cascade,
  year integer not null,
  last_no integer not null default 0
);

alter table public.search_counters enable row level security;

create or replace function public.next_search_no(p_agency uuid, p_year integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_no integer;
begin
  insert into public.search_counters (agency_id, year, last_no)
  values (p_agency, p_year, 1)
  on conflict (agency_id) do update
    set last_no = case
          when public.search_counters.year = p_year then public.search_counters.last_no + 1
          else 1
        end,
        year = p_year
  returning last_no into v_no;
  return v_no;
end;
$$;

-- ── 6. RLS ────────────────────────────────────────────────────────────
alter table public.searches enable row level security;
alter table public.search_matches enable row level security;

drop policy if exists searches_same_agency on public.searches;
create policy searches_same_agency on public.searches
  for all
  using (agency_id in (select agency_id from public.profiles where id = auth.uid()))
  with check (agency_id in (select agency_id from public.profiles where id = auth.uid()));

drop policy if exists search_matches_same_agency on public.search_matches;
create policy search_matches_same_agency on public.search_matches
  for all
  using (agency_id in (select agency_id from public.profiles where id = auth.uid()))
  with check (agency_id in (select agency_id from public.profiles where id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════
-- Gotowe. Pojawia sie modul Poszukiwania, dopasowania oraz pasek procesu
-- na karcie nieruchomosci.
-- ═══════════════════════════════════════════════════════════════════════
