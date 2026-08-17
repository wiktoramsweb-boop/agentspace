-- ============================================================
-- AgentSpace - SETUP v7: powiadomienia push (Web Push)
-- ============================================================
-- Uruchom w Supabase SQL Editor. Idempotentne.
-- Przechowuje subskrypcje push agentów (jedno urządzenie = jeden wpis).
-- ============================================================

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.profiles(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete cascade,
  endpoint text not null unique,   -- unikalny adres push przeglądarki/urządzenia
  p256dh text not null,            -- klucz szyfrujący subskrypcji
  auth text not null,              -- sekret autoryzacji subskrypcji
  created_at timestamptz default now()
);

create index if not exists push_sub_agent_idx on public.push_subscriptions(agent_id);
create index if not exists push_sub_agency_idx on public.push_subscriptions(agency_id);

alter table public.push_subscriptions enable row level security;
