-- v35: kredyty AI zamiast liczenia wywołań.
--
-- Problem z v34: limit liczył wywołania, a jedno wywołanie AI Coacha kosztuje
-- kilkanaście razy mniej niż inne. Przy takim liczeniu nie dało się przewidzieć
-- rachunku. Teraz każda operacja ma wagę w kredytach proporcjonalną do kosztu
-- (cennik w lib/kredyty.ts), a biuro ma miesięczną pulę.
--
-- Bez tej migracji aplikacja działa jak dotąd, tylko bez limitów kredytowych.

-- Waga zdarzenia. Domyślnie 1, żeby stare wiersze z v34 dalej się liczyły.
alter table rate_events
  add column if not exists credits int not null default 1;

-- Kto zużył kredyt. Potrzebne do ekranu zużycia per agent i do dziennego
-- bezpiecznika, żeby jedna osoba nie przepaliła puli całego biura w dzień.
alter table rate_events
  add column if not exists agency_id uuid,
  add column if not exists user_id uuid;

create index if not exists rate_events_agency_idx
  on rate_events (agency_id, created_at desc);

-- Pula biura. NULL oznacza „policz z pakietu i liczby agentów" (lib/kredyty.ts).
alter table public.agencies
  add column if not exists ai_credits_monthly int;

-- Dokupione pakiety. Obie liczby są narastające i nigdy się nie zerują:
-- dostępne = ai_credits_extra - ai_credits_extra_used. Dzięki temu kredyty
-- kupione pod koniec miesiąca nie przepadają z końcem okresu rozliczeniowego.
alter table public.agencies
  add column if not exists ai_credits_extra int not null default 0,
  add column if not exists ai_credits_extra_used int not null default 0;
