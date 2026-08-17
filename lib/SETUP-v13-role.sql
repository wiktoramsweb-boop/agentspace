-- ============================================================
-- AgentSpace - SETUP v13: role CEO / Menedżer / Agent + przypisania
-- ============================================================
-- Uruchom w Supabase SQL Editor. Idempotentne (można puścić wielokrotnie).
--
-- Model ról: kolumna profiles.role (text) przyjmuje:
--   'owner'   = CEO (pełny dostęp) - wartość NIE zmieniana, cała autoryzacja o nią oparta
--   'manager' = Menedżer (widzi tylko swoich przypisanych agentów: Cele + wyniki AI)
--   'agent'   = Agent
-- ============================================================

-- Do którego menedżera przypisany jest agent (null = brak przełożonego).
alter table public.profiles
  add column if not exists manager_id uuid references public.profiles(id) on delete set null;

create index if not exists profiles_manager_idx on public.profiles(manager_id);

-- Zaproszenie może z góry nieść przypisanie do menedżera oraz imię zaproszonego.
-- (kolumna invitations.role już istnieje z SETUP v1)
alter table public.invitations
  add column if not exists manager_id uuid references public.profiles(id) on delete set null;

alter table public.invitations
  add column if not exists full_name text;
