-- v27: przypomnienia push o zadaniach z terminem w ciągu dnia.
--
-- Jedna kolumna: znacznik, że o danym zadaniu już przypomnieliśmy.
-- Bez niego cron chodzący co godzinę dzwoniłby o tym samym w kółko.

alter table public.activities
  add column if not exists reminded_at timestamptz;

-- Cron pyta o zaplanowane zadania z terminem w wąskim oknie czasu,
-- którym jeszcze nie wysłano przypomnienia.
create index if not exists activities_reminder_idx
  on public.activities (due_at)
  where status = 'zaplanowane' and reminded_at is null;

-- Zmiana terminu ma na nowo uzbroić przypomnienie, inaczej przesunięte
-- zadanie już nigdy by się nie odezwało.
create or replace function public.reset_reminded_at()
returns trigger
language plpgsql
as $$
begin
  if new.due_at is distinct from old.due_at then
    new.reminded_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists activities_reset_reminder on public.activities;
create trigger activities_reset_reminder
  before update on public.activities
  for each row
  execute function public.reset_reminded_at();
