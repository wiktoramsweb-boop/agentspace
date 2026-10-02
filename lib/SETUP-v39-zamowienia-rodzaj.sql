-- v39: rodzaj zamówienia i liczba kredytów.
--
-- Te dwie kolumny dołożyłem do v37 już po tym, jak część biur uruchomiła
-- tamtą migrację. `create table if not exists` nie dokłada kolumn do
-- istniejącej tabeli, więc ponowne uruchomienie v37 nic nie zmieni i trzeba
-- osobnej migracji.
--
-- Bez niej działa tylko zamawianie abonamentu, a strona internetowa
-- i pakiety kredytów zwracają błąd zapisu.

alter table public.subscription_orders
  -- abonament | strona | kredyty. Jedna tabela na wszystkie zakupy biura,
  -- bo i tak rozliczamy je razem i pokazujemy na jednej liście.
  add column if not exists kind text not null default 'abonament',
  -- Ile kredytów dodaje zamówienie (tylko kind = 'kredyty').
  add column if not exists credits int not null default 0;
