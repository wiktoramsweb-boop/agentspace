-- ============================================================
-- AgentSpace — SETUP v10: poziom trudności sesji AI Coach
-- ============================================================
-- Uruchom w Supabase SQL Editor. Idempotentne.
-- ============================================================

alter table public.training_sessions
  add column if not exists difficulty text default 'sredni';
