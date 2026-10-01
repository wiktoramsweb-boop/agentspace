-- v38: więcej ról i indywidualne uprawnienia.
--
-- v13 dała trzy role: CEO, menedżer, agent. Biura większe niż nasze mają
-- bardziej rozbudowaną strukturę: dyrektora, asystentkę, księgową,
-- koordynatora ofert, stażystów. Dotąd każda taka osoba musiała dostać rolę
-- menedżera albo agenta, czyli zwykle za dużo albo za mało dostępu.
--
-- Teraz rola daje zestaw domyślny (lib/role.ts), a CEO może przy konkretnej
-- osobie dołożyć albo odebrać pojedynczy moduł.
--
-- Bez tej migracji aplikacja działa jak dotąd na trzech rolach: brak kolumny
-- `permissions` oznacza „żadnych odstępstw, bierz wszystko z roli".

alter table public.profiles
  add column if not exists permissions jsonb;

comment on column public.profiles.permissions is
  'Odstępstwa od roli: {"moduly":{"faktury":true},"zakres":"zespol"}. NULL = zestaw z roli.';

-- Rola jest tekstem, więc nowe wartości nie wymagają zmiany typu. Gdyby
-- jednak istniało ograniczenie z v13, rozszerzamy je o nowe stanowiska.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_check' and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles drop constraint profiles_role_check;
  end if;

  alter table public.profiles
    add constraint profiles_role_check check (
      role in ('owner', 'director', 'manager', 'agent', 'assistant', 'accountant', 'coordinator', 'trainee')
    );
end $$;

-- Zaproszenia też niosą rolę, więc muszą przyjmować nowe wartości.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'invitations_role_check' and conrelid = 'public.invitations'::regclass
  ) then
    alter table public.invitations drop constraint invitations_role_check;
  end if;

  alter table public.invitations
    add constraint invitations_role_check check (
      role in ('owner', 'director', 'manager', 'agent', 'assistant', 'accountant', 'coordinator', 'trainee')
    );
exception
  when undefined_table then null;
end $$;
