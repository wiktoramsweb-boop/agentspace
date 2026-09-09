-- ═══════════════════════════════════════════════════════════════════════
-- AgentSpace SETUP v18: DZIAŁANIA (odpowiednik modułu "Działania" z ASARI)
--
-- Uruchom w Supabase -> SQL Editor. Idempotentny. Wymaga v1-v17.
--
-- Po co: rdzeń CRM. Każdy telefon, zadanie, wydarzenie i spotkanie ma tu swój
-- wpis: kto, do kogo, w jakim celu, kiedy, z jakim skutkiem. Na tym opiera się
-- historia kontaktu z klientem i raport aktywności agenta.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,

  -- Rodzaj: polaczenie | zadanie | wydarzenie | spotkanie
  kind text not null default 'polaczenie',
  -- Cel (po co dzwonimy/spotykamy sie): pozyskowa, aktualizacyjna, prezentacja...
  purpose text,
  subject text not null,
  description text,

  status text not null default 'zaplanowane',  -- zaplanowane | wykonane | anulowane
  priority text not null default 'normalny',   -- niski | normalny | wysoki

  -- Rozmowa telefoniczna
  call_direction text,                          -- wychodzaca | przychodzaca
  duration_s integer,                           -- czas trwania rozmowy

  -- Harmonogram
  due_at timestamptz,                           -- termin (planowany)
  started_at timestamptz,
  ended_at timestamptz,
  completed_at timestamptz,

  -- Powiazania (dzialanie moze dotyczyc klienta i/lub nieruchomosci)
  client_id uuid references public.clients (id) on delete set null,
  property_id uuid references public.properties (id) on delete set null,

  -- Przypisani agenci (moze byc kilku, jak w ASARI "Przypisane do")
  assignee_ids uuid[] not null default '{}',

  include_in_report boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.activities is
  'Dzialania CRM: polaczenia, zadania, wydarzenia, spotkania. Odpowiednik modulu Dzialania z ASARI.';
comment on column public.activities.assignee_ids is
  'Agenci przypisani do dzialania. Tablica, bo jedno spotkanie moze prowadzic dwoch agentow.';

-- ── Indeksy pod listę, filtry i panele na kartach ─────────────────────
create index if not exists activities_agency_due_idx on public.activities (agency_id, due_at desc);
create index if not exists activities_agency_status_idx on public.activities (agency_id, status);
create index if not exists activities_client_idx on public.activities (client_id) where client_id is not null;
create index if not exists activities_property_idx on public.activities (property_id) where property_id is not null;
create index if not exists activities_assignees_idx on public.activities using gin (assignee_ids);

-- ── Automatyczne updated_at ───────────────────────────────────────────
create or replace function public.touch_activities_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists activities_touch_updated_at on public.activities;
create trigger activities_touch_updated_at
  before update on public.activities
  for each row execute function public.touch_activities_updated_at();

-- ── RLS (backstop; aplikacja i tak filtruje po agency_id) ─────────────
alter table public.activities enable row level security;

drop policy if exists activities_same_agency on public.activities;
create policy activities_same_agency on public.activities
  for all
  using (
    agency_id in (select agency_id from public.profiles where id = auth.uid())
  )
  with check (
    agency_id in (select agency_id from public.profiles where id = auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════════════
-- Gotowe. Po uruchomieniu w aplikacji pojawia sie modul "Dzialania"
-- oraz panele dzialan na karcie klienta i nieruchomosci.
-- ═══════════════════════════════════════════════════════════════════════
