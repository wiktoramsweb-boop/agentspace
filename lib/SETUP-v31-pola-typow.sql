-- v31: pola oferty zależne od typu nieruchomości
--
-- Mieszkanie, dom, działka, hala, lokal, pokój, inwestycja i budynek opisuje
-- się innymi parametrami. Zamiast stu kolumn trzymamy je w jednym jsonb:
-- słownik pól jest w kodzie (lib/property-fields.ts), więc dodanie pola albo
-- nowej pozycji w liście wyboru nie wymaga już żadnej migracji.

alter table properties add column if not exists details jsonb not null default '{}'::jsonb;

-- Indeks GIN, żeby dało się szybko filtrować po tych polach,
-- np. działki z prądem w granicy albo hale z dojazdem dla TIR.
create index if not exists properties_details_gin on properties using gin (details);
