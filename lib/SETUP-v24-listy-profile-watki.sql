-- ─────────────────────────────────────────────────────────────
-- AgentSpace v24: wątki działań, profile agentów, indeksy pod duże listy
--
-- Uruchom w Supabase → SQL Editor (po v23). Bezpieczne do ponownego
-- uruchomienia: nic nie usuwa, tylko dokłada.
-- ─────────────────────────────────────────────────────────────

-- 1. Wątek działań: kolejna rozmowa pod tym samym numerem dopisuje się do
--    istniejącego działania zamiast tworzyć drugi taki sam wpis i kontakt.
alter table public.activities
  add column if not exists parent_id uuid references public.activities(id) on delete cascade;

create index if not exists activities_parent_idx on public.activities (parent_id);
create index if not exists activities_thread_idx on public.activities (agency_id, parent_id, due_at desc);

-- 2. Profil agenta: zdjęcie, stanowisko i krótki opis (do ofertówki i zespołu).
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists job_title text;
alter table public.profiles add column if not exists bio text;

-- 3. Indeksy pod listy z filtrami i stronicowaniem po stronie serwera.
--    Bez nich baza z importu ASARI (tysiące kontaktów) zwalniałaby przy
--    każdym filtrowaniu i sortowaniu.
create index if not exists clients_agency_updated_idx on public.clients (agency_id, updated_at desc);
create index if not exists clients_agency_agent_idx on public.clients (agency_id, agent_id);
create index if not exists clients_agency_status_idx on public.clients (agency_id, status);
create index if not exists clients_agency_type_idx on public.clients (agency_id, type);
create index if not exists clients_agency_created_idx on public.clients (agency_id, created_at desc);
create index if not exists clients_agency_contact_idx on public.clients (agency_id, last_contact_at);

create index if not exists properties_agency_updated_idx on public.properties (agency_id, updated_at desc);
create index if not exists properties_agency_agent_idx on public.properties (agency_id, agent_id);
create index if not exists properties_agency_status_idx on public.properties (agency_id, status);
create index if not exists properties_agency_kind_idx on public.properties (agency_id, deal_kind);
create index if not exists properties_agency_price_idx on public.properties (agency_id, price_pln);

create index if not exists activities_agency_due_idx on public.activities (agency_id, due_at desc);
create index if not exists activities_agency_status_idx on public.activities (agency_id, status);

create index if not exists searches_agency_updated_idx on public.searches (agency_id, updated_at desc);

-- 4. Zdjęcia agentów trzymamy w publicznym magazynie plików biura
--    (te same, w których siedzi logo i znak wodny).
insert into storage.buckets (id, name, public)
values ('agency-assets', 'agency-assets', true)
on conflict (id) do nothing;
