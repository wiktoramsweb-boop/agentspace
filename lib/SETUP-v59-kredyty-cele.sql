-- v59: pełny pulpit sprawy kredytowej i cele dopasowane do stanowiska.
-- Dostęp tylko z serwera (service_role). Brak polityk RLS = brak dostępu z przeglądarki.

-- Wnioski do banków: jedna sprawa może iść równolegle do kilku banków.
create table if not exists public.credit_applications (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.credit_cases(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  bank text not null,
  -- przygotowanie | zlozony | analiza | dosylka | pozytywna | negatywna | wycofany
  status text not null default 'przygotowanie',
  amount_pln numeric,
  margin_pct numeric,
  rate_pct numeric,
  installment_pln numeric,
  commission_pln numeric,
  note text,
  submitted_at timestamptz,
  decided_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, bank)
);
create index if not exists credit_applications_case_idx on public.credit_applications(case_id);
create index if not exists credit_applications_agency_idx on public.credit_applications(agency_id, status);
alter table public.credit_applications enable row level security;

-- Sytuacja klienta i następny krok doradcy.
alter table public.credit_cases add column if not exists finanse jsonb not null default '{}'::jsonb;
alter table public.credit_cases add column if not exists next_step text;
alter table public.credit_cases add column if not exists next_step_at date;

-- Miesięczne cele stanowisk innych niż agent (doradca, CEO, stażysta).
create table if not exists public.role_targets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  klucz text not null,
  cel numeric not null,
  updated_at timestamptz not null default now(),
  unique (profile_id, klucz)
);
alter table public.role_targets enable row level security;
