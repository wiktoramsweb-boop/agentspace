-- v55: szkice dokumentów (Dokumenty, rezerwacja, aneks, protokół).
-- Dostęp tylko z serwera (service_role). Brak polityk RLS = brak dostępu z przeglądarki.

-- Szkice dokumentów: agent zapisuje niedokończoną umowę i wraca do niej
-- z innego urządzenia albo poprawia ją, gdy klient coś zmieni.
create table if not exists public.document_drafts (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  template text not null,
  title text not null,
  data jsonb not null default '{}'::jsonb,
  client_id uuid references public.clients(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists document_drafts_owner_idx on public.document_drafts(agency_id, owner_id, updated_at desc);
alter table public.document_drafts enable row level security;
