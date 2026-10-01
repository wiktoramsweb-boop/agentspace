-- v33: moduł Leady
--
-- Leady to kontakty, zanim staną się klientem: zgłoszenia z Meta Ads, z widżetu
-- wyceny, ze strony biura albo dopisane ręcznie po rozmowie. Trzymamy je osobno
-- od tabeli `clients`, bo większość z nich nigdy klientem nie zostanie, a baza
-- klientów ma zostać czysta. Lead, z którym coś wyszło, przechodzi do `clients`
-- i od tego momentu żyje tam (`leads.client_id` pamięta, skąd przyszedł).

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  -- Agent odpowiedzialny. Null = lead leży w puli biura i czeka na przypisanie.
  agent_id uuid references profiles(id) on delete set null,

  name text,
  phone text,
  -- Dziewięć ostatnich cyfr: po tym poznajemy, że ten sam numer wpadł drugi raz.
  phone_digits text,
  email text,
  city text,
  address text,
  message text,

  source text not null default 'reczny',
  campaign text,
  ad_name text,
  form_name text,
  platform text,
  -- Identyfikator z pliku źródłowego. Chroni przed wgraniem tego samego pliku dwa razy.
  external_id text,
  submitted_at timestamptz,

  status text not null default 'nowy',
  next_action_at timestamptz,
  notes text,
  -- Cały wiersz z pliku, na wypadek gdyby formularz miał pytania, których
  -- nie przewidzieliśmy w kolumnach.
  raw jsonb,

  client_id uuid references clients(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_agency_idx on leads (agency_id, created_at desc);
create index if not exists leads_status_idx on leads (agency_id, status);
create index if not exists leads_agent_idx on leads (agency_id, agent_id);
create index if not exists leads_phone_idx on leads (agency_id, phone_digits);

-- Ten sam lead z Meta nie wejdzie dwa razy, nawet przy ponownym wgraniu pliku.
create unique index if not exists leads_external_unique
  on leads (agency_id, external_id)
  where external_id is not null;

alter table leads enable row level security;
