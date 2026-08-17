-- ============================================================
-- AgentSpace - SETUP v14: tygodniowe limity rozmów z AI Coach
-- ============================================================
-- Uruchom w Supabase SQL Editor. Idempotentne.
--
-- weekly_ai_limit na profilu:
--   NULL = bez limitu (domyślnie)
--   liczba (>=0) = maksymalna liczba rozmów AI Coach na tydzień (Pn-Nd)
-- CEO ustawia to każdemu agentowi/menedżerowi w zakładce Zespół.
-- ============================================================

alter table public.profiles
  add column if not exists weekly_ai_limit integer;
