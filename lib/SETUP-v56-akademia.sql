-- v56: Akademia (ścieżka nauki dla nowych agentów w Bibliotece technik).
-- Jeden wiersz na osobę i element ścieżki: przerobiona lekcja albo sprawdzian
-- z najlepszym wynikiem, liczbą podejść i odpowiedziami z ostatniego podejścia.
-- Dostęp tylko z serwera (service_role). Brak polityk RLS = brak dostępu z przeglądarki.

create table if not exists public.academy_progress (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  item text not null,
  -- lekcja | sprawdzian
  kind text not null,
  passed boolean not null default false,
  best_score integer,
  last_score integer,
  max_score integer,
  attempts integer not null default 0,
  last_answers jsonb,
  passed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, item)
);
create index if not exists academy_progress_agency_idx on public.academy_progress(agency_id, updated_at desc);
alter table public.academy_progress enable row level security;
