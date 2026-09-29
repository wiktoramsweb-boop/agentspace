-- v30: konto demo odświeżające się samo.
--
-- Dane demo są liczone względem „dzisiaj": kalendarz wypełniony trzy tygodnie
-- w przód, dziennik wyników sześć tygodni wstecz. Bez znacznika odświeżenia
-- pokaz za dwa miesiące zastałby pusty kalendarz i martwe statystyki.
--
-- is_demo oznacza biuro przeznaczone do pokazów. Aplikacja odświeża jego dane
-- przy wejściu, gdy minęło więcej niż 12 godzin od ostatniego razu.

alter table public.agencies
  add column if not exists is_demo boolean not null default false;

alter table public.agencies
  add column if not exists demo_refreshed_at timestamptz;

-- Kalendarz i pulpit pytają o działania biura w oknie czasu.
create index if not exists activities_agency_due_idx
  on public.activities (agency_id, due_at desc);
