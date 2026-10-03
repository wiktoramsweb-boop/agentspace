-- v40: kolumna po pierwszym podejściu do panelu operatora. NIEPOTRZEBNA.
--
-- Pierwotnie dostęp do /operator miała dawać flaga na profilu. W praktyce
-- okazało się to niewygodne: operator bywa zalogowany w przeglądarce na różne
-- konta i wiązanie panelu z sesją aplikacji oznaczało ciągłe przelogowywanie.
--
-- Panel ma teraz własny login i hasło w zmiennych OPERATOR_LOGIN
-- i OPERATOR_PASSWORD, a kod tej kolumny nie czyta.
--
-- Jeżeli uruchomiłeś już ten plik, nic nie trzeba cofać: kolumna jest pusta
-- i nieużywana. Jeżeli jeszcze nie, możesz go w całości pominąć.

alter table public.profiles
  add column if not exists is_operator boolean not null default false;
