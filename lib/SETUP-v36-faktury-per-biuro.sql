-- v36: sprzedawcy na fakturach należą do biura, nie do kodu.
--
-- Do tej pory lista sprzedawców (nazwa, adres, NIP, bank, numer konta) była
-- wpisana w pliku `lib/invoice.ts`. Oznaczało to, że każde biuro, które by
-- kupiło system, wystawiałoby faktury z cudzym numerem konta. Teraz lista
-- siedzi w ustawieniach biura i każde biuro wpisuje własnych sprzedawców.
--
-- Bez tej migracji moduł faktur dalej działa: gdy kolumny nie ma albo lista
-- jest pusta, aplikacja składa jednego sprzedawcę z danych firmy
-- (agency_settings.company), więc nowe biuro od razu ma czym wystawić fakturę.

alter table public.agency_settings
  add column if not exists sellers jsonb not null default '[]'::jsonb;

comment on column public.agency_settings.sellers is
  'Lista sprzedawców na fakturach: [{key,name,address,city,postcode,nip,bank,account,brand}]';
