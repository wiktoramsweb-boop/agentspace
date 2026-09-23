-- ─────────────────────────────────────────────────────────────
-- AgentSpace v26: strona www jako płatny dodatek, statystyki i domeny
--
-- Uruchom w Supabase → SQL Editor (po v25). Bezpieczne do ponownego
-- uruchomienia: nic nie usuwa, tylko dokłada.
-- ─────────────────────────────────────────────────────────────

-- 1. Strona internetowa to osobna usługa, nie część abonamentu CRM.
--    Bez tej flagi biuro widzi w ustawieniach tylko opis dodatku.
alter table public.agencies add column if not exists site_addon boolean not null default false;
alter table public.agencies add column if not exists site_addon_since date;
alter table public.agencies add column if not exists site_addon_requested_at timestamptz;

-- 2. Odsłony strony biura. Liczymy bez ciasteczek i bez adresów IP:
--    interesuje nas tylko, ile razy dana podstrona została otwarta.
create table if not exists public.site_views (
  agency_id uuid not null references public.agencies(id) on delete cascade,
  day date not null default current_date,
  path text not null,
  kind text not null default 'strona',
  ref text,
  views int not null default 0,
  primary key (agency_id, day, path)
);

create index if not exists site_views_agency_day_idx on public.site_views (agency_id, day desc);

-- 3. Zliczanie odsłony jednym zapytaniem, bez wyścigu przy dwóch gościach naraz.
create or replace function public.bump_site_view(
  p_agency uuid,
  p_path text,
  p_kind text default 'strona',
  p_ref text default null
) returns void
language sql
security definer
set search_path = public
as $$
  insert into public.site_views (agency_id, day, path, kind, ref, views)
  values (p_agency, current_date, left(p_path, 200), p_kind, left(p_ref, 200), 1)
  on conflict (agency_id, day, path)
  do update set views = public.site_views.views + 1;
$$;

-- 4. Własna domena biura: status podpięcia trzymamy przy konfiguracji strony.
alter table public.site_config add column if not exists domain_status text not null default 'brak';
alter table public.site_config add column if not exists domain_checked_at timestamptz;

create index if not exists site_config_domain_idx on public.site_config (domain);

alter table public.site_views enable row level security;
