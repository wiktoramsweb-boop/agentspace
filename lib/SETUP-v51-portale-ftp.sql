-- v51: eksport ofert na portale przez FTP (model ASARI: nieruchomosci-online i inne).
--
-- Każde biuro dostaje od portalu własne konto FTP. Hasło trzymamy zaszyfrowane
-- (lib/szyfr.ts, klucz PORTAL_TOKEN_KEY), jak tokeny Otodom.
-- Dostęp tylko z serwera (service_role). Brak polityk RLS = brak dostępu z przeglądarki.

create table if not exists public.portal_ftp (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  portal text not null,
  host text not null,
  port integer not null default 21,
  login text not null,
  haslo_enc text not null,
  katalog text not null default '/',
  -- FTPS (szyfrowane połączenie), gdy portal je obsługuje.
  secure boolean not null default false,
  aktywny boolean not null default true,
  ostatni_test_at timestamptz,
  ostatni_test_ok boolean,
  ostatnia_wysylka_at timestamptz,
  ostatnio_ofert integer,
  ostatni_blad text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agency_id, portal)
);

alter table public.portal_ftp enable row level security;
