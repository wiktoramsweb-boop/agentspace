-- ═══════════════════════════════════════════════════════════════════════
-- AgentSpace SETUP v19: dane kontaktowe w działaniach + szukanie po telefonie
--
-- Uruchom w Supabase -> SQL Editor. Idempotentny. Wymaga v18.
--
-- Po co: agent dzwoni pod numer, ktorego nie ma jeszcze w bazie klientow.
-- Musi moc zapisac imie i telefon wprost w dzialaniu. A gdy za 3 miesiace inny
-- agent dzwoni pod ten sam numer - wpisuje go w wyszukiwarke i od razu widzi,
-- ze ktos juz dzwonil i o czym rozmawiano.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Dane kontaktowe wpisywane wprost w działaniu ───────────────────
alter table public.activities add column if not exists contact_name text;
alter table public.activities add column if not exists contact_phone text;
alter table public.activities add column if not exists contact_email text;

comment on column public.activities.contact_phone is
  'Numer, pod ktory dzwoniono. Wypelniany recznie albo kopiowany z powiazanego klienta.';

-- ── 2. Znormalizowany telefon (same cyfry) do szukania ────────────────
-- Kolumna generowana: baza sama liczy wartosc, wiec nie da sie o niej zapomniec.
-- Dzieki temu "+48 600 100 200", "600-100-200" i "600100200" to ten sam numer.
alter table public.activities
  add column if not exists contact_phone_digits text
  generated always as (regexp_replace(coalesce(contact_phone, ''), '[^0-9]', '', 'g')) stored;

alter table public.clients
  add column if not exists phone_digits text
  generated always as (regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g')) stored;

-- ── 3. Indeksy pod szybkie szukanie po numerze ────────────────────────
create index if not exists activities_phone_digits_idx
  on public.activities (contact_phone_digits)
  where contact_phone_digits <> '';

create index if not exists clients_phone_digits_idx
  on public.clients (phone_digits)
  where phone_digits <> '';

-- Szukanie po fragmencie numeru (np. ostatnie 6 cyfr) - indeks tekstowy.
create extension if not exists pg_trgm;

create index if not exists activities_phone_trgm_idx
  on public.activities using gin (contact_phone_digits gin_trgm_ops);

create index if not exists clients_phone_trgm_idx
  on public.clients using gin (phone_digits gin_trgm_ops);

-- ── 4. Domyślny status działania: wykonane ────────────────────────────
-- Agent najczesciej zapisuje to, co WLASNIE zrobil, nie to, co zaplanuje.
alter table public.activities alter column status set default 'wykonane';

-- ═══════════════════════════════════════════════════════════════════════
-- Gotowe. Po uruchomieniu w Dzialaniach mozna wpisac dane kontaktowe wprost,
-- a wyszukiwarka znajduje po numerze telefonu (takze po fragmencie).
-- ═══════════════════════════════════════════════════════════════════════
