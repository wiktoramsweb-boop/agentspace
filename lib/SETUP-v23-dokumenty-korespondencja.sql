-- ─────────────────────────────────────────────────────────────
-- AgentSpace v23: dokumenty, świadectwo energetyczne, korespondencja
--
-- Uruchom w Supabase → SQL Editor (po v22). Bezpieczne do ponownego
-- uruchomienia: nic nie usuwa, tylko dokłada.
-- ─────────────────────────────────────────────────────────────

-- 1. Dokumenty przy ofercie i kliencie (umowa, KW, rzut, skan dowodu...).
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  entity_type text not null check (entity_type in ('property', 'client')),
  entity_id uuid not null,
  kind text not null default 'inne',
  name text not null,
  path text not null,
  size_bytes bigint,
  mime text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists documents_entity_idx
  on public.documents (agency_id, entity_type, entity_id, created_at desc);

alter table public.documents enable row level security;

-- 2. Świadectwo charakterystyki energetycznej przy ofercie.
--    Status: posiada / w_przygotowaniu / zwolniona. EP w kWh/(m²·rok).
alter table public.properties add column if not exists energy_cert_status text;
alter table public.properties add column if not exists energy_ep numeric;
alter table public.properties add column if not exists energy_cert_valid_until date;

-- 3. Korespondencja z klientem: wysłane i otrzymane maile, SMS-y.
create table if not exists public.client_messages (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  channel text not null default 'mail' check (channel in ('mail', 'sms', 'inne')),
  direction text not null default 'wyslana' check (direction in ('wyslana', 'otrzymana')),
  subject text,
  body text not null,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists client_messages_client_idx
  on public.client_messages (agency_id, client_id, sent_at desc);

alter table public.client_messages enable row level security;

-- 4. Prywatny magazyn na dokumenty. W odróżnieniu od zdjęć ofert NIE jest
--    publiczny: skany dowodów i umowy pobiera się tylko przez krótkotrwały,
--    podpisany link wydany po sprawdzeniu, że pytający jest z tego biura.
--    Aplikacja zakłada ten bucket sama; linia poniżej to zapas.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;
