-- v41: dziennik błędów aplikacji.
--
-- Do tej pory każdy błąd szedł wyłącznie do console.error, czyli do logów
-- Vercela. Na planie Hobby te logi żyją krótko i nie da się ich przeszukać,
-- więc pierwszą informacją o awarii był telefon od biura.
--
-- Ta tabela jest celowo uboga: miejsce w kodzie, komunikat i kilka linii
-- szczegółów. NIE zapisujemy tu danych klientów biur ani treści, które
-- użytkownik wpisał - dziennik błędów nie może się stać drugą bazą danych
-- osobowych.

create table if not exists public.app_errors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- Miejsce w kodzie, np. 'ai/struktura' albo 'cron/morning-brief'.
  gdzie text not null,
  wiadomosc text not null,
  -- Pierwsze linie stosu albo treści odpowiedzi API. Przycinane w kodzie.
  szczegoly text,
  -- Biuro, którego dotyczy awaria, jeśli da się ustalić.
  agency_id uuid references public.agencies(id) on delete set null
);

create index if not exists app_errors_created_idx on public.app_errors (created_at desc);
create index if not exists app_errors_gdzie_idx on public.app_errors (gdzie, created_at desc);

alter table public.app_errors enable row level security;
-- Brak polityk = tabela niedostępna przez klienta anon. Czyta ją wyłącznie
-- kod serwerowy przez service_role, tak jak reszta danych w tym projekcie.
