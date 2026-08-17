-- ═══════════════════════════════════════════════════════════════════════
-- AgentSpace SETUP v17: rozszerzone pola nieruchomości + gotowość na eksport
-- na stronę www (spectranieruchomosci.pl) i portale.
--
-- Uruchom w Supabase → SQL Editor. Skrypt jest idempotentny (można puścić
-- kilka razy). Wymaga v1-v16 (u Ciebie odpalone).
--
-- Po co: kreator dodawania nieruchomości wzorowany na ASARI zbiera dane, które
-- strona www musi dostać (numer oferty, rynek, stan, piętro, rok budowy,
-- udogodnienia, opis marketingowy). Eksport na razie NIE wysyła nic na zewnątrz,
-- ale dane są zbierane w formie gotowej do podłączenia.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Podstawa oferty ────────────────────────────────────────────────
alter table public.properties add column if not exists offer_no text;
alter table public.properties add column if not exists slug text;
alter table public.properties add column if not exists headline text;
alter table public.properties add column if not exists market text;          -- pierwotny | wtorny
alter table public.properties add column if not exists ownership text;       -- wlasnosc | spoldzielcze | udzial | uzytkowanie
alter table public.properties add column if not exists available_from date;

comment on column public.properties.offer_no is 'Numer oferty pokazywany klientowi i na stronie (np. SP/2026/014).';
comment on column public.properties.slug is 'Człon URL na stronie www (generowany z tytułu, ceny i lokalizacji).';
comment on column public.properties.headline is 'Nagłówek marketingowy na stronę, np. "2 pokoje 47 m2 | Kraków Czyżyny | Od zaraz".';

-- ── 2. Parametry budynku i mieszkania ─────────────────────────────────
alter table public.properties add column if not exists floors_total integer;
alter table public.properties add column if not exists year_built integer;
alter table public.properties add column if not exists building_type text;   -- blok | kamienica | apartamentowiec | wolnostojacy | szeregowy | blizniak
alter table public.properties add column if not exists condition_std text;   -- do_wprowadzenia | do_odswiezenia | do_remontu | deweloperski | w_budowie
alter table public.properties add column if not exists heating text;         -- miejskie | gazowe | elektryczne | pompa | kominek | inne
alter table public.properties add column if not exists plot_area_m2 numeric; -- dla domów i działek
alter table public.properties add column if not exists admin_fee_pln numeric;-- czynsz administracyjny
alter table public.properties add column if not exists deposit_pln numeric;  -- kaucja (najem)

-- ── 3. Udogodnienia i media (elastycznie, bez migracji na każdą nowość) ─
alter table public.properties add column if not exists features jsonb not null default '{}'::jsonb;

comment on column public.properties.features is
  'Udogodnienia jako flagi, np. {"balkon":true,"winda":true,"garaz":true,"klimatyzacja":true,"piwnica":true,"ogrodek":false}.';

-- ── 4. Zdjęcia (adresy plików; wgrywanie dorobimy osobno) ─────────────
alter table public.properties add column if not exists photos jsonb not null default '[]'::jsonb;

comment on column public.properties.photos is
  'Lista zdjęć: [{"url":"...","main":true,"export":true,"caption":"Salon"}]. Kolejność = kolejność na stronie.';

-- ── 5. Eksport (na razie tylko oznaczenia, bez wysyłki) ───────────────
alter table public.properties add column if not exists export_to_web boolean not null default false;
alter table public.properties add column if not exists export_to_portals boolean not null default false;
alter table public.properties add column if not exists web_published_at timestamptz;
alter table public.properties add column if not exists export_address_mode text not null default 'ulica';
  -- pelny | ulica | dzielnica  → ile adresu pokazujemy publicznie

comment on column public.properties.export_to_web is
  'Czy oferta ma trafić na stronę www. Dziś tylko oznaczenie i podglad feedu, wysylki jeszcze nie ma.';
comment on column public.properties.export_address_mode is
  'Ile adresu ujawniamy publicznie: pelny (z numerem), ulica (bez numeru), dzielnica.';

-- ── 6. Indeksy pod listę i feed ───────────────────────────────────────
create index if not exists properties_agency_export_idx
  on public.properties (agency_id, export_to_web)
  where export_to_web = true;

create unique index if not exists properties_agency_offer_no_idx
  on public.properties (agency_id, offer_no)
  where offer_no is not null;

create unique index if not exists properties_agency_slug_idx
  on public.properties (agency_id, slug)
  where slug is not null;

-- ── 7. Licznik numerów ofert per biuro ────────────────────────────────
-- Numer nadajemy w kodzie (SP/2026/001), ale kolejność bierzemy z sekwencji
-- per agencja, żeby dwóch agentów jednocześnie nie dostało tego samego numeru.
create table if not exists public.offer_counters (
  agency_id uuid primary key references public.agencies (id) on delete cascade,
  year integer not null,
  last_no integer not null default 0
);

alter table public.offer_counters enable row level security;

-- Funkcja: zwraca kolejny numer dla biura w danym roku (atomowo).
create or replace function public.next_offer_no(p_agency uuid, p_year integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_no integer;
begin
  insert into public.offer_counters (agency_id, year, last_no)
  values (p_agency, p_year, 1)
  on conflict (agency_id) do update
    set last_no = case
          when public.offer_counters.year = p_year then public.offer_counters.last_no + 1
          else 1
        end,
        year = p_year
  returning last_no into v_no;
  return v_no;
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- Gotowe. Kod aplikacji jest odporny na brak tych kolumn (pokazuje czytelny
-- komunikat), ale po uruchomieniu v17 kreator zapisuje pełne dane oferty.
-- ═══════════════════════════════════════════════════════════════════════
