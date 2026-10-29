-- v57: zgłoszenia biur, że chcą wystawiać oferty na portalu, którego
-- integracja jest w przygotowaniu (np. Gratka i Morizon, Domiporta, Adresowo).
-- Na tej podstawie wiemy, z którym portalem najpierw załatwić format importu.
-- Dostęp tylko z serwera (service_role). Brak polityk RLS = brak dostępu z przeglądarki.

create table if not exists public.portal_requests (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  portal text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (agency_id, portal)
);
alter table public.portal_requests enable row level security;
