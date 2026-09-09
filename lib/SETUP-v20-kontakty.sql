-- ═══════════════════════════════════════════════════════════════════════
-- AgentSpace SETUP v20: rozbudowane kontakty (kartoteka jak w ASARI)
--
-- Uruchom w Supabase -> SQL Editor. Idempotentny. Wymaga v19.
--
-- Po co: w ASARI kontakt ma komplet danych - kilka telefonow i maili, dane
-- identyfikacyjne (PESEL, NIP, dokument), firme i stanowisko, zrodlo
-- pozyskania, pelny adres i zgody marketingowe. Bez tego nie da sie przejsc
-- z ASARI, bo czesc danych nie mialaby gdzie wejsc.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Imię i nazwisko osobno (ASARI trzyma je rozdzielnie) ───────────
-- Kolumna `name` zostaje jako nazwa wyswietlana i zrodlo prawdy dla list;
-- uzupelniamy ja w kodzie przy zapisie.
alter table public.clients add column if not exists first_name text;
alter table public.clients add column if not exists last_name text;

-- ── 2. Wiele telefonów i maili ────────────────────────────────────────
-- Format: [{"value":"600100200","label":"komórka"}]. Kolumny `phone` i `email`
-- zostaja jako glowny kontakt (uzywa ich wyszukiwarka i phone_digits).
alter table public.clients add column if not exists phones jsonb not null default '[]'::jsonb;
alter table public.clients add column if not exists emails jsonb not null default '[]'::jsonb;

comment on column public.clients.phones is
  'Dodatkowe telefony: [{"value":"...","label":"komórka|domowy|służbowy"}]. Główny numer siedzi w kolumnie phone.';

-- ── 3. Dane identyfikacyjne i firmowe ─────────────────────────────────
alter table public.clients add column if not exists pesel text;
alter table public.clients add column if not exists nip text;
alter table public.clients add column if not exists id_document text;   -- nr dowodu/paszportu
alter table public.clients add column if not exists company text;
alter table public.clients add column if not exists position text;      -- stanowisko
alter table public.clients add column if not exists source text;        -- skąd klient (polecenie, portal, strona...)

-- ── 4. Pełny adres ────────────────────────────────────────────────────
alter table public.clients add column if not exists country text default 'Polska';
alter table public.clients add column if not exists postal_code text;
alter table public.clients add column if not exists voivodeship text;

-- ── 5. Zgody marketingowe (RODO) ──────────────────────────────────────
alter table public.clients add column if not exists marketing_consent boolean not null default false;
alter table public.clients add column if not exists marketing_consent_at timestamptz;

comment on column public.clients.marketing_consent is
  'Zgoda na przesyłanie informacji handlowych. Data zgody w marketing_consent_at (dowód przy kontroli).';

-- ── 6. Szukanie po nazwisku i firmie ──────────────────────────────────
create index if not exists clients_name_trgm_idx
  on public.clients using gin (name gin_trgm_ops);

create index if not exists clients_company_trgm_idx
  on public.clients using gin (company gin_trgm_ops)
  where company is not null;

-- ═══════════════════════════════════════════════════════════════════════
-- Gotowe. Kod jest odporny na brak tych kolumn (zapisze to, co sie da),
-- ale po uruchomieniu kartoteka klienta ma komplet pol jak w ASARI.
-- ═══════════════════════════════════════════════════════════════════════
