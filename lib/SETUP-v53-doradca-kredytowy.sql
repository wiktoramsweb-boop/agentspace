-- v53: doradca kredytowy w biurze.
--
-- 1. Nowa rola 'credit_advisor' (doradca kredytowy). Biuro zaprasza swojego
--    doradcę jak każdą inną osobę; doradca widzi tylko sprawy kredytowe, które
--    dostał, bez całej bazy klientów i ofert biura.
-- 2. Sprawy kredytowe: klient przekazany przez agenta doradcy, etap kredytu,
--    bank, kwota, lista dokumentów i rozliczenie polecenia.
-- Dostęp tylko z serwera (service_role). Brak polityk RLS = brak dostępu z przeglądarki.

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'profiles_role_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles drop constraint profiles_role_check;
  end if;
  alter table public.profiles
    add constraint profiles_role_check check (
      role in ('owner', 'director', 'manager', 'agent', 'assistant', 'accountant', 'coordinator', 'trainee', 'credit_advisor')
    );
end $$;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'invitations_role_check' and conrelid = 'public.invitations'::regclass) then
    alter table public.invitations drop constraint invitations_role_check;
  end if;
  alter table public.invitations
    add constraint invitations_role_check check (
      role in ('owner', 'director', 'manager', 'agent', 'assistant', 'accountant', 'coordinator', 'trainee', 'credit_advisor')
    );
exception
  when undefined_table then null;
end $$;

create table if not exists public.credit_cases (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  -- Kto przekazał klienta (agent) i kto prowadzi kredyt (doradca).
  referred_by uuid references public.profiles(id) on delete set null,
  advisor_id uuid references public.profiles(id) on delete set null,
  -- nowe | analiza | dokumenty | wniosek | decyzja | umowa | odrzucone
  stage text not null default 'nowe',
  rodzaj text not null default 'hipoteczny',
  amount_pln numeric,
  bank text,
  note text,
  -- Lista dokumentów: [{ "nazwa": "...", "jest": true }]
  documents jsonb not null default '[]'::jsonb,
  bank_commission_pln numeric,
  referral_fee_pln numeric,
  decision_at timestamptz,
  signed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists credit_cases_agency_idx on public.credit_cases(agency_id, stage);
create index if not exists credit_cases_advisor_idx on public.credit_cases(advisor_id);
create index if not exists credit_cases_client_idx on public.credit_cases(client_id);

-- Historia sprawy: zmiany etapu i notatki, żeby agent i doradca widzieli to samo.
create table if not exists public.credit_case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.credit_cases(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  -- etap | notatka
  kind text not null default 'notatka',
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists credit_case_events_case_idx on public.credit_case_events(case_id, created_at desc);

alter table public.credit_cases enable row level security;
alter table public.credit_case_events enable row level security;
