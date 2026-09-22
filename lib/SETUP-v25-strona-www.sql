-- ─────────────────────────────────────────────────────────────
-- AgentSpace v25: strona internetowa biura
--
-- Uruchom w Supabase → SQL Editor (po v24). Bezpieczne do ponownego
-- uruchomienia: nic nie usuwa, tylko dokłada.
-- ─────────────────────────────────────────────────────────────

-- 1. Konfiguracja strony biura. Trzymamy ją w JSON-ach, bo każdy wzór ma
--    trochę inny zestaw sekcji, a nie chcemy migracji przy każdym nowym polu.
create table if not exists public.site_config (
  agency_id uuid primary key references public.agencies(id) on delete cascade,
  slug text unique,
  template text not null default 'kamienica',
  published boolean not null default false,
  domain text,
  brand jsonb not null default '{}'::jsonb,
  content jsonb not null default '{}'::jsonb,
  contact jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2. Wpisy poradnika (blog). Publikujemy tylko te z published = true.
create table if not exists public.site_posts (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  slug text not null,
  title text not null,
  lead text,
  body text,
  cover_path text,
  tag text,
  author text,
  read_min int default 4,
  published boolean not null default false,
  published_at date default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists site_posts_slug_idx on public.site_posts (agency_id, slug);
create index if not exists site_posts_pub_idx on public.site_posts (agency_id, published, published_at desc);

-- 3. Kto z zespołu pokazuje się na stronie i w jakiej kolejności.
alter table public.profiles add column if not exists show_on_site boolean not null default true;
alter table public.profiles add column if not exists site_order int not null default 0;

-- 4. Zgłoszenia ze strony www. Lądują w CRM jako kontakt i zadanie, ale
--    zapisujemy też surowe zgłoszenie, żeby nic nie przepadło przy błędzie.
create table if not exists public.site_leads (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  kind text not null default 'kontakt',
  name text,
  phone text,
  email text,
  message text,
  meta jsonb not null default '{}'::jsonb,
  client_id uuid references public.clients(id) on delete set null,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists site_leads_agency_idx on public.site_leads (agency_id, created_at desc);

-- 5. Indeks pod listę ofert publikowanych na stronie.
create index if not exists properties_web_idx on public.properties (agency_id, export_to_web, status);

alter table public.site_config enable row level security;
alter table public.site_posts enable row level security;
alter table public.site_leads enable row level security;
