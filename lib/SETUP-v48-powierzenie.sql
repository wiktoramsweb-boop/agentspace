-- v48: ślad akceptacji umowy powierzenia przetwarzania danych.
--
-- Biuro trzyma w AgentSpace dane osobowe SWOICH klientów, więc to ono jest
-- administratorem, a my podmiotem przetwarzającym. Art. 28 RODO wymaga,
-- żeby powierzenie odbyło się na podstawie umowy. Treść mamy opublikowaną,
-- brakowało dowodu, że konkretne biuro ją przyjęło i w której wersji.
--
-- Wersję trzymamy jako tekst, a nie numer: zmiana treści umowy ma unieważnić
-- poprzednią akceptację i poprosić o nową, a porównanie napisów jest tu
-- prostsze i trudniejsze do pomylenia niż numerowanie.

alter table public.agencies
  add column if not exists dpa_accepted_at timestamptz,
  add column if not exists dpa_version text,
  add column if not exists dpa_accepted_by uuid references public.profiles(id) on delete set null;

comment on column public.agencies.dpa_accepted_at is
  'Kiedy biuro zaakceptowało umowę powierzenia przetwarzania danych.';
comment on column public.agencies.dpa_version is
  'Wersja umowy, którą zaakceptowano. Zmiana wersji w kodzie prosi o nową zgodę.';
