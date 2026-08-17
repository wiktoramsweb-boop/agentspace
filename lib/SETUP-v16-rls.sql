-- ============================================================
-- AgentSpace - SETUP v16: RLS (Row Level Security) - izolacja biur
-- ============================================================
-- Uruchom w Supabase SQL Editor. Idempotentne.
--
-- WAŻNE / UCZCIWIE: aplikacja czyta dane przez klucz service_role, który
-- OMIJA RLS. Te polityki są DRUGĄ WARSTWĄ (backstop): chronią, gdyby kiedyś
-- jakiś kod użył klucza anon/uwierzytelnionego użytkownika (np. publiczny
-- endpoint) lub gdyby ktoś uderzył w API bezpośrednio. Nie zastępują kontroli
-- agency_id w kodzie stron - one zostają. Włączenie RLS nie psuje działającej
-- apki (service_role i tak je pomija).
-- ============================================================

-- Funkcja pomocnicza: agencja zalogowanego użytkownika.
create or replace function public.current_agency_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select agency_id from public.profiles where id = auth.uid()
$$;

-- Tabele z kolumną agency_id - polityka „tylko moja agencja".
do $$
declare t text;
begin
  foreach t in array array[
    'clients','properties','deals','training_sessions','session_scores',
    'goals','daily_logs','tasks','invitations'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t||'_agency', t);
    execute format(
      'create policy %I on public.%I for all
         using (agency_id = public.current_agency_id())
         with check (agency_id = public.current_agency_id());',
      t||'_agency', t
    );
  end loop;
end $$;

-- profiles: widok profili z własnej agencji (oraz własnego).
alter table public.profiles enable row level security;
drop policy if exists profiles_agency on public.profiles;
create policy profiles_agency on public.profiles for select
  using (agency_id = public.current_agency_id() or id = auth.uid());

-- agencies: tylko własna agencja.
alter table public.agencies enable row level security;
drop policy if exists agencies_own on public.agencies;
create policy agencies_own on public.agencies for select
  using (id = public.current_agency_id());

-- client_notes: przez agencję klienta-rodzica.
alter table public.client_notes enable row level security;
drop policy if exists client_notes_agency on public.client_notes;
create policy client_notes_agency on public.client_notes for all
  using (exists (select 1 from public.clients c where c.id = client_notes.client_id and c.agency_id = public.current_agency_id()))
  with check (exists (select 1 from public.clients c where c.id = client_notes.client_id and c.agency_id = public.current_agency_id()));

-- property_interests: przez agencję oferty-rodzica.
alter table public.property_interests enable row level security;
drop policy if exists property_interests_agency on public.property_interests;
create policy property_interests_agency on public.property_interests for all
  using (exists (select 1 from public.properties p where p.id = property_interests.property_id and p.agency_id = public.current_agency_id()))
  with check (exists (select 1 from public.properties p where p.id = property_interests.property_id and p.agency_id = public.current_agency_id()));
