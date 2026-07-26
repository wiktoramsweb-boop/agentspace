-- ============================================================
-- AgentSpace — SETUP v8: Faktury (dla właściciela)
-- ============================================================
-- Uruchom w Supabase SQL Editor. Idempotentne.
-- ============================================================

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references public.agencies(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  number text not null,
  seller_key text not null default 'spectra',
  buyer_name text,
  buyer_address text,
  buyer_city text,
  buyer_postcode text,
  buyer_nip text,
  buyer_pesel text,
  place text default 'Kraków',
  issue_date date,
  sale_date date,
  payment_date date,
  payment_method text default 'Przelew',
  items jsonb not null default '[]'::jsonb,
  total_pln numeric not null default 0,
  description text,
  created_at timestamptz default now()
);

-- Dodane w v8.1: kwota zapłacona + osoba wystawiająca
alter table public.invoices add column if not exists paid_pln numeric not null default 0;
alter table public.invoices add column if not exists issuer text;

create index if not exists invoices_agency_idx on public.invoices(agency_id, created_at desc);

alter table public.invoices enable row level security;
