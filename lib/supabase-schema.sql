-- ============================================================
-- AgentSpace — schema bazy Supabase
-- ============================================================
-- Wklej w Supabase SQL Editor (lewy pasek → SQL Editor → New query)
-- i kliknij Run.
-- ============================================================

-- Lista oczekujących (waitlist)
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  agency_name text not null,
  team_size text not null check (team_size in ('1-3', '4-10', '11-25', '25+')),
  phone text,
  created_at timestamptz not null default now(),
  user_agent text,
  ip_hash text,
  -- Anti-spam: 1 email = 1 zapis
  unique(email)
);

-- Wiadomości kontaktowe
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  agency text,
  topic text not null,
  message text not null,
  created_at timestamptz not null default now(),
  user_agent text,
  ip_hash text
);

-- Indeksy dla szybkich query w panelu Supabase
create index if not exists waitlist_created_at_idx on public.waitlist(created_at desc);
create index if not exists contact_messages_created_at_idx on public.contact_messages(created_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================
-- Włączamy RLS, ale NIE dodajemy policies dla anonimowych użytkowników.
-- Dane wpływają tylko przez API routes z service_role key (który
-- omija RLS). Anon key (publiczny) nie może czytać ani pisać.
-- ============================================================

alter table public.waitlist enable row level security;
alter table public.contact_messages enable row level security;

-- Brak policies = brak dostępu dla anonim/authenticated.
-- Tylko service_role (z server-side API) ma dostęp.
