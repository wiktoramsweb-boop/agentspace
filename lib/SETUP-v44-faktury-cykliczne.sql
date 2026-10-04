-- v44: faktury cykliczne.
--
-- Biura wystawiają co miesiąc te same dokumenty: zarządzanie najmem, stała
-- obsługa, abonament. Przepisywanie ich ręcznie dwunastego każdego miesiąca
-- jest i stratą czasu, i źródłem pomyłek w numeracji oraz datach.
--
-- Wzorzec trzymamy jako JSON, a nie jako odwołanie do konkretnej faktury:
-- faktura może zostać poprawiona albo usunięta, a harmonogram ma dalej
-- działać na tym, co ustalono przy jego tworzeniu.

create table if not exists public.invoice_schedules (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  -- Nazwa własna, żeby dało się rozpoznać harmonogram na liście.
  nazwa text not null default '',
  -- Co ile miesięcy wystawiać. 1 = co miesiąc, 3 = kwartalnie, 12 = rocznie.
  co_miesiecy int not null default 1,
  -- Dzień miesiąca wystawienia. Przy krótszych miesiącach kod cofa do ostatniego.
  dzien_miesiaca int not null default 1,
  -- Ile dni na płatność od daty wystawienia.
  dni_platnosci int not null default 7,
  -- Data kolejnego wystawienia (RRRR-MM-DD).
  nastepne date not null,
  aktywny boolean not null default true,
  -- Dane faktury: sprzedawca, nabywca, pozycje, tryb cen.
  wzorzec jsonb not null,
  ostatnia_faktura_id uuid references public.invoices(id) on delete set null,
  ostatnie_wystawienie date
);

create index if not exists invoice_schedules_agency_idx
  on public.invoice_schedules(agency_id, aktywny, nastepne);

alter table public.invoice_schedules enable row level security;
-- Brak polityk: tabela czytana wyłącznie przez kod serwerowy (service_role),
-- tak jak reszta danych w tym projekcie.
