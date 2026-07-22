-- ============================================================
-- AgentSpace — SETUP v2: platforma codziennej pracy
-- ============================================================
-- Uruchom w Supabase SQL Editor PO pierwszym SETUP.
-- Dodaje: zadania, klienci (CRM), notatki, prowizje (deals).
-- Idempotentne — bezpieczne do ponownego uruchomienia.
-- ============================================================

-- ---------- TASKS (plan dnia / lista zadań) ----------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.profiles(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  due_date date default current_date,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- ---------- CLIENTS (CRM-lite) ----------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.profiles(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  type text not null default 'kupujacy',   -- kupujacy | sprzedajacy | najem | inny
  status text not null default 'nowy',      -- nowy | w_kontakcie | oglada | negocjacje | zamkniety | stracony
  budget_pln integer,
  property text,                            -- czego szuka / co sprzedaje
  notes text,                               -- szybka notatka główna
  last_contact_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- CLIENT NOTES (dziennik kontaktu) ----------
create table if not exists public.client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  agent_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- ---------- DEALS (tracking prowizji) ----------
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.profiles(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,                      -- np. "Sprzedaż mieszkania ul. Zbożowa"
  commission_pln integer not null default 0,
  status text not null default 'w_toku',    -- w_toku | zamkniety | przepadl
  expected_close date,
  closed_at timestamptz,
  created_at timestamptz default now()
);

-- ---------- INDEKSY ----------
create index if not exists tasks_agent_idx on public.tasks(agent_id, due_date);
create index if not exists clients_agent_idx on public.clients(agent_id, updated_at desc);
create index if not exists clients_agency_idx on public.clients(agency_id);
create index if not exists client_notes_client_idx on public.client_notes(client_id, created_at desc);
create index if not exists deals_agent_idx on public.deals(agent_id, created_at desc);
create index if not exists deals_agency_idx on public.deals(agency_id, status);

-- ---------- RLS (backstop — dostęp przez service_role) ----------
alter table public.tasks enable row level security;
alter table public.clients enable row level security;
alter table public.client_notes enable row level security;
alter table public.deals enable row level security;
