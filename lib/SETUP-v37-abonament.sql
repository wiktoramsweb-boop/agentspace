-- v37: okres próbny i abonament.
--
-- Do tej pory każdy, kto założył konto, dostawał cały system na zawsze za
-- darmo. Teraz nowe biuro dostaje 7 dni próbnych, a potem traci dostęp,
-- dopóki nie wykupi abonamentu.
--
-- Bez tej migracji aplikacja działa jak dotąd, bez blokady: kod traktuje
-- brak kolumn jak „dostęp otwarty", żeby nieuruchomiona migracja nie
-- zamknęła nikomu systemu.

alter table public.agencies
  -- Koniec okresu próbnego. NULL u biur założonych przed v37 oznacza
  -- „bez limitu": nie odcinamy dostępu komuś, kto już pracuje.
  add column if not exists trial_ends_at timestamptz,

  -- trial | active | expired | cancelled
  add column if not exists subscription_status text not null default 'trial',

  -- start | pro | biuro (puste w okresie próbnym)
  add column if not exists subscription_plan text,

  -- monthly | half_year | yearly
  add column if not exists subscription_period text,

  -- Do kiedy opłacony. Po tej dacie kod sam traktuje biuro jak wygasłe,
  -- bez potrzeby crona.
  add column if not exists subscription_ends_at timestamptz;

create index if not exists agencies_subscription_idx
  on public.agencies (subscription_status, subscription_ends_at);

-- Zamówienia abonamentu. Płatności online jeszcze nie ma, więc zamówienie
-- trafia tutaj i do powiadomienia, a operator potwierdza wpłatę ręcznie.
-- Tabela zostaje przydatna także po podpięciu płatności: to historia
-- rozliczeń biura.
create table if not exists public.subscription_orders (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  plan text not null,
  period text not null,
  agents int not null default 1,
  -- Kwota netto w groszach, żeby nie liczyć na liczbach zmiennoprzecinkowych.
  amount_grosz int not null,
  -- nowe | oplacone | anulowane
  status text not null default 'nowe',
  note text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists subscription_orders_agency_idx
  on public.subscription_orders (agency_id, created_at desc);

alter table public.subscription_orders enable row level security;

-- Biura założone przed tą migracją zostają z otwartym dostępem.
update public.agencies
set subscription_status = 'active'
where subscription_status = 'trial' and trial_ends_at is null;
