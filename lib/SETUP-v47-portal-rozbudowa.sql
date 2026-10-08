-- v47: rozbudowa portalu klienta.
--
-- Trzy rzeczy:
-- 1. Wiadomości między klientem a agentem (w obie strony, w kontekście sprawy).
-- 2. Propozycje zmiany ceny, które sprzedający musi zaakceptować.
--    Obniżka ceny ofertowej jest decyzją właściciela, nie biura - więc agent
--    może ją tylko zaproponować, a zapis w bazie jest dowodem zgody.
-- 3. Zaległe prezentacje stają się widoczne w portalu.
--
-- WYMAGA wcześniejszego uruchomienia v46.

create table if not exists public.client_portal_messages (
  id uuid primary key default gen_random_uuid(),
  access_id uuid not null references public.client_portal_access(id) on delete cascade,
  -- Wiadomość może dotyczyć konkretnej nieruchomości albo całej sprawy.
  property_id uuid references public.properties(id) on delete set null,
  -- klient | agent
  autor text not null,
  tresc text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists cpm_access_idx on public.client_portal_messages(access_id, created_at desc);

create table if not exists public.client_price_proposals (
  id uuid primary key default gen_random_uuid(),
  access_id uuid not null references public.client_portal_access(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  cena_obecna numeric,
  cena_proponowana numeric not null,
  uzasadnienie text,
  -- oczekuje | zaakceptowana | odrzucona
  status text not null default 'oczekuje',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists cpp_access_idx on public.client_price_proposals(access_id, created_at desc);
create index if not exists cpp_property_idx on public.client_price_proposals(property_id);

alter table public.client_portal_messages enable row level security;
alter table public.client_price_proposals enable row level security;
-- Brak polityk: czyta i pisze kod serwerowy przez service_role, tak jak reszta
-- projektu. Zakres wynika z tokenu w adresie.

-- Prezentacje wpisane przed tą migracją nie pokazywały się klientowi, bo flagę
-- trzeba było zaznaczyć ręcznie przy każdej. Sam fakt prezentacji nie zdradza
-- niczyich danych (klient widzi rodzaj i godzinę, nigdy tematu ani notatki),
-- więc włączamy je hurtem. Pomijamy te, przy których agent napisał już własny
-- opis dla klienta - tam decyzja była świadoma i jej nie ruszamy.
update public.activities
   set client_visible = true
 where kind = 'spotkanie'
   and property_id is not null
   and client_visible = false
   and client_note is null;
