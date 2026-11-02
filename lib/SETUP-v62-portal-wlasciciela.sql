-- v62: powiadomienia i akceptacje w portalu właściciela.
-- Dostęp tylko z serwera (service_role). Brak polityk RLS = brak dostępu z przeglądarki.

create table if not exists public.rental_owner_push (
  id uuid primary key default gen_random_uuid(),
  access_id uuid not null references public.rental_owner_access(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- Biuro prosi o akceptację dokumentu (np. aneksu albo rozliczenia rocznego).
alter table public.documents add column if not exists do_akceptacji boolean not null default false;

-- Zapis akceptacji: kto, kiedy, z jakiego urządzenia. To potwierdzenie
-- zapoznania się, nie kwalifikowany podpis elektroniczny.
create table if not exists public.rental_acceptances (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  access_id uuid not null references public.rental_owner_access(id) on delete cascade,
  rodzaj text not null,
  ref_id uuid not null,
  nazwa text not null,
  ip text,
  urzadzenie text,
  accepted_at timestamptz not null default now(),
  unique (access_id, rodzaj, ref_id)
);
create index if not exists rental_acceptances_ref_idx on public.rental_acceptances(ref_id);

alter table public.rental_owner_push enable row level security;
alter table public.rental_acceptances enable row level security;
