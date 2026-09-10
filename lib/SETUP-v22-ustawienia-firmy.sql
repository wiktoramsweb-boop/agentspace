-- ─────────────────────────────────────────────────────────────
-- AgentSpace v22: ustawienia firmy (dane, logo, znak wodny, stempel, opcje)
--
-- Uruchom w Supabase → SQL Editor (po v21). Bezpieczne do ponownego
-- uruchomienia: nic nie usuwa, tylko dokłada.
--
-- Jedna tabela na biuro. Ustawienia trzymamy w polach jsonb, żeby kolejne
-- opcje (numeracja, szablony, eksport) nie wymagały za każdym razem nowej
-- migracji - to ważne, gdy aplikację kupią inne biura.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.agency_settings (
  agency_id uuid primary key references public.agencies(id) on delete cascade,

  -- Dane firmy: nazwa, adres, NIP, telefon, e-mail, www, adres korespondencyjny.
  company jsonb not null default '{}'::jsonb,

  -- Ścieżka logo firmy w magazynie plików (bucket agency-assets).
  logo_path text,

  -- Znak wodny: { path, opacity, scale, position, enabled }
  watermark jsonb not null default '{}'::jsonb,

  -- Stempel promocyjny, np. „prowizja 0%": { path, scale, position }
  stamp jsonb not null default '{}'::jsonb,

  -- Pozostałe: rozmiar zdjęć, ukrywanie kontaktów, prefiks numeru oferty,
  -- domyślne zakresy dopasowań poszukiwań itd.
  options jsonb not null default '{}'::jsonb,

  updated_at timestamptz not null default now()
);

-- RLS włączone jako zabezpieczenie. Aplikacja czyta i zapisuje przez klucz
-- service_role i sama sprawdza, czy użytkownik jest CEO tego biura.
alter table public.agency_settings enable row level security;

-- Magazyn plików. Aplikacja zakłada te buckety sama przy pierwszym wgraniu,
-- ale gdyby to się nie udało, poniższe linie robią to samo.
-- Oba są publiczne do odczytu: zdjęcia ofert i logo i tak trafiają na stronę
-- i portale. Wgrywanie idzie wyłącznie przez podpisane linki z serwera.
insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('agency-assets', 'agency-assets', true)
on conflict (id) do nothing;
