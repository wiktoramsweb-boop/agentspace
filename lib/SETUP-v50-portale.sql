-- v50: eksport ofert na portale (najpierw Otodom przez OLX Group API).
--
-- portal_connections: połączenie biura z kontem na portalu. Tokeny OAuth
--   trzymamy zaszyfrowane (lib/szyfr.ts, klucz PORTAL_TOKEN_KEY), więc nawet
--   zrzut bazy nie daje dostępu do kont biur na portalach.
-- portal_listings: która oferta jest na którym portalu, z jakim statusem.
-- portal_events: każde powiadomienie z portalu, do wglądu przy błędach.
--
-- Dostęp tylko z serwera (service_role). Brak polityk RLS = brak dostępu z przeglądarki.

create table if not exists public.portal_connections (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  portal text not null,
  access_token_enc text,
  refresh_token_enc text,
  expires_at timestamptz,
  -- Konto testowe OLX: tytuły dostają prefiks [qatest-mercury] i opis testowy.
  test_mode boolean not null default false,
  connected_by uuid references public.profiles(id) on delete set null,
  connected_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_error text,
  unique (agency_id, portal)
);

create table if not exists public.portal_listings (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  portal text not null,
  advert_uuid text,
  -- Kod statusu z portalu: active, new, outdated, moderated, removed_by_user, unpaid...
  status text,
  -- Ostatnia operacja wysłana z AgentSpace i jej transakcja.
  last_action text,
  last_transaction_id text,
  url text,
  last_error text,
  exact_location boolean not null default false,
  published_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (property_id, portal)
);
create index if not exists portal_listings_advert_idx on public.portal_listings (advert_uuid);
create index if not exists portal_listings_agency_idx on public.portal_listings (agency_id, portal);

create table if not exists public.portal_events (
  id bigserial primary key,
  portal text not null,
  agency_id uuid references public.agencies(id) on delete cascade,
  advert_uuid text,
  transaction_id text,
  flow text,
  event_type text,
  code text,
  message text,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists portal_events_advert_idx on public.portal_events (advert_uuid, created_at desc);

alter table public.portal_connections enable row level security;
alter table public.portal_listings enable row level security;
alter table public.portal_events enable row level security;
