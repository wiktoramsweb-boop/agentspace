-- ============================================================
-- AgentSpace - SETUP v15: karta transakcji (pilnowanie etapów + dokumentów)
-- ============================================================
-- Uruchom w Supabase SQL Editor. Idempotentne.
-- Cała karta (etapy 1-5 + checklista dokumentów + notatki) trzymana jako JSON.
-- ============================================================

alter table public.deals
  add column if not exists transaction_card jsonb;
