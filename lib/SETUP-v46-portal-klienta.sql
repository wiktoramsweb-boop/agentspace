-- v46: portal klienta (sprzedający i kupujący).
--
-- Klient dostaje kod QR przy podpisaniu umowy i wchodzi do własnego widoku
-- bez zakładania konta. Token jest przypisany do KONKRETNEJ umowy i daje
-- dostęp wyłącznie do nieruchomości tego klienta.
--
-- Najważniejsza zasada całego modułu: widok klienta składa się wyłącznie
-- z pól strukturalnych z białej listy. Treści wpisywanej przez agenta
-- (np. "Prezka mazowiecka, Bogdan 792 847 892") nie wolno pokazać nigdy,
-- bo to numer telefonu obcej osoby. Stąd osobne pole `client_note`, które
-- agent wypełnia świadomie, i flaga `client_visible`, którą musi zatwierdzić.

create table if not exists public.client_portal_access (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  -- Losowy ciąg z adresu /klient/<token>.
  token text not null unique,
  -- sprzedajacy = widzi proces swojej nieruchomości
  -- kupujacy    = widzi oferty dobrane pod jego kryteria
  rodzaj text not null default 'sprzedajacy',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at date,
  revoked_at timestamptz,
  last_seen_at timestamptz
);

create index if not exists cpa_agency_idx on public.client_portal_access(agency_id, created_at desc);
create index if not exists cpa_client_idx on public.client_portal_access(client_id);

-- Które nieruchomości widzi dany dostęp. Osobna tabela, bo klient bywa
-- właścicielem kilku (pakiet), a agent ma nad tym panować jawnie.
create table if not exists public.client_portal_properties (
  access_id uuid not null references public.client_portal_access(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  primary key (access_id, property_id)
);

-- Reakcje kupującego na podesłane oferty.
create table if not exists public.client_offer_feedback (
  id uuid primary key default gen_random_uuid(),
  access_id uuid not null references public.client_portal_access(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  -- lubi | nie_lubi
  reakcja text not null,
  notatka text,
  created_at timestamptz not null default now(),
  unique (access_id, property_id)
);

-- Kiedy kupujący może oglądać.
create table if not exists public.client_availability (
  id uuid primary key default gen_random_uuid(),
  access_id uuid not null references public.client_portal_access(id) on delete cascade,
  dzien date not null,
  od time not null default '09:00',
  do_godz time not null default '18:00',
  created_at timestamptz not null default now(),
  unique (access_id, dzien, od, do_godz)
);

-- Powiadomienia push dla klientów. Osobna tabela od agenckiej, bo klucz
-- to dostęp do portalu, a nie konto w aplikacji.
create table if not exists public.client_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  access_id uuid not null references public.client_portal_access(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- Co z działań agenta trafia do klienta.
alter table public.activities
  add column if not exists client_visible boolean not null default false,
  add column if not exists client_note text;

comment on column public.activities.client_visible is
  'Czy to zdarzenie widzi klient w portalu. Zatwierdza agent.';
comment on column public.activities.client_note is
  'Opis dla klienta. Pole `subject` NIE jest mu pokazywane - bywa w nim telefon osoby trzeciej.';

alter table public.client_portal_access enable row level security;
alter table public.client_portal_properties enable row level security;
alter table public.client_offer_feedback enable row level security;
alter table public.client_availability enable row level security;
alter table public.client_push_subscriptions enable row level security;
-- Brak polityk: wszystko czyta kod serwerowy przez service_role, tak jak
-- reszta projektu. Autoryzacja idzie przez token w adresie.
