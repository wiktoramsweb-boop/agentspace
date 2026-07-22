-- ============================================================
-- AgentSpace — schema APLIKACJI (produkt, nie landing)
-- ============================================================
-- Wklej w Supabase SQL Editor → New query → Run.
-- Bezpieczne do wielokrotnego uruchomienia (idempotentne).
-- ============================================================

-- ---------- AGENCIES (biura nieruchomości) ----------
create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id),
  plan text not null default 'trial',            -- 'trial' | 'active' | 'canceled'
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at timestamptz default now()
);

-- ---------- PROFILES (rozszerzenie auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'agent',            -- 'owner' | 'agent'
  monthly_goal_pln integer default 0,
  created_at timestamptz default now()
);

-- ---------- INVITATIONS (zaproszenia agentów) ----------
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references public.agencies(id) on delete cascade,
  email text not null,
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  role text not null default 'agent',
  status text not null default 'pending',         -- 'pending' | 'accepted'
  invited_by uuid references auth.users(id),
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '14 days')
);

-- ---------- SCENARIOS (scenariusze treningowe, globalne) ----------
create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  brief text not null,                            -- kontekst pokazywany agentowi
  system_prompt text not null,                    -- instrukcja dla AI grającego klienta
  difficulty text default 'medium',               -- 'easy' | 'medium' | 'hard'
  order_index integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ---------- TRAINING SESSIONS ----------
create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.profiles(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete cascade,
  scenario_id uuid references public.scenarios(id),
  scenario_title text,                            -- denormalizacja dla historii
  personality text,                               -- 'agresywny' | 'wahający' | ...
  transcript jsonb default '[]'::jsonb,           -- [{role:'agent'|'client', content}]
  status text not null default 'in_progress',     -- 'in_progress' | 'completed'
  started_at timestamptz default now(),
  completed_at timestamptz
);

-- ---------- SESSION SCORES ----------
create table if not exists public.session_scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.training_sessions(id) on delete cascade unique,
  agent_id uuid references public.profiles(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete cascade,
  overall integer,                                -- 1-10
  opening integer,                                -- otwarcie
  qualification integer,                          -- kwalifikacja
  objection_handling integer,                     -- obsługa obiekcji
  closing integer,                                -- zamknięcie
  summary text,
  suggestions jsonb default '[]'::jsonb,          -- ["...", "..."]
  created_at timestamptz default now()
);

-- ---------- INDEKSY ----------
create index if not exists profiles_agency_idx on public.profiles(agency_id);
create index if not exists sessions_agent_idx on public.training_sessions(agent_id, started_at desc);
create index if not exists sessions_agency_idx on public.training_sessions(agency_id, started_at desc);
create index if not exists scores_agent_idx on public.session_scores(agent_id, created_at desc);
create index if not exists scores_agency_idx on public.session_scores(agency_id, created_at desc);
create index if not exists invitations_token_idx on public.invitations(token);
create index if not exists scenarios_order_idx on public.scenarios(order_index);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Cały dostęp do danych aplikacji idzie przez server-side kod
-- z kluczem service_role (który omija RLS). Klucz service_role
-- NIGDY nie trafia do przeglądarki. Włączamy RLS bez polityk dla
-- anon/authenticated — to backstop: nawet gdyby anon key wyciekł,
-- nie ma dostępu do danych.
-- Wyjątek: scenariusze mogą być czytane publicznie (nic wrażliwego).
-- ============================================================

alter table public.agencies enable row level security;
alter table public.profiles enable row level security;
alter table public.invitations enable row level security;
alter table public.training_sessions enable row level security;
alter table public.session_scores enable row level security;
alter table public.scenarios enable row level security;

-- Scenariusze — publiczny odczyt aktywnych
drop policy if exists "scenarios_public_read" on public.scenarios;
create policy "scenarios_public_read" on public.scenarios
  for select using (is_active = true);
