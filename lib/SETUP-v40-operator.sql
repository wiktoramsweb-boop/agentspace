-- v40: konto operatora.
--
-- Osoba prowadząca AgentSpace musi widzieć wszystkie biura: co mają wykupione,
-- czy coś się wywala i czy zamówienie czeka na fakturę. To NIE jest rola
-- w biurze (owner, manager, agent), tylko osobny przywilej ponad biurami,
-- dlatego osobna kolumna, a nie nowa wartość w `role`.
--
-- Panel jest pod /operator i dla kogoś bez tej flagi zwraca 404, więc sam
-- adres nie zdradza, że coś takiego istnieje.

alter table public.profiles
  add column if not exists is_operator boolean not null default false;

comment on column public.profiles.is_operator is
  'Dostęp do panelu operatora /operator. Nadawać wyłącznie kontom prowadzącym AgentSpace.';

-- Nadanie sobie dostępu (podmień adres na swój):
-- update public.profiles set is_operator = true where email = 'twoj@email.pl';
