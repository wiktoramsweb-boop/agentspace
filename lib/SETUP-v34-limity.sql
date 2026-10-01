-- v34: limity wywołań (AI, rejestracja, formularze publiczne)
--
-- Jedna prosta tabela zdarzeń. Każde wywołanie AI, rejestracja albo zgłoszenie
-- z formularza zostawia tu wiersz z kluczem (np. "ai:user:<id>"), a kod liczy,
-- ile takich wierszy było w ostatniej dobie. Adresów IP nie trzymamy wprost,
-- tylko ich skrót (hash), więc tabela nie zawiera danych osobowych.
--
-- Bez tej migracji aplikacja działa jak dotąd, tylko bez limitów.

create table if not exists rate_events (
  id bigserial primary key,
  key text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_events_key_created_idx on rate_events (key, created_at desc);
create index if not exists rate_events_created_idx on rate_events (created_at);

-- Dostęp tylko z serwera (service_role). Brak polityk = brak dostępu z przeglądarki.
alter table rate_events enable row level security;
