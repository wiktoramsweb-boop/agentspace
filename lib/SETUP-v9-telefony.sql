-- ============================================================
-- AgentSpace - SETUP v9: telefony w profilach
-- ============================================================
-- Uruchom w Supabase SQL Editor. Idempotentne.
-- ============================================================

alter table public.profiles add column if not exists phone text;
