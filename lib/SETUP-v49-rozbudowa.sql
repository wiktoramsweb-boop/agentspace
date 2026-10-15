-- ============================================================
-- AgentSpace - SETUP v49: wielka rozbudowa
-- ============================================================
-- Uruchom w Supabase SQL Editor. Idempotentne, można odpalić drugi raz.
--
-- Co dochodzi:
--   1. historia zmian ceny ofert (zapisywana przez bazę, nie przez kod),
--   2. kolejność kart na tablicach kanban,
--   3. urlopy i zastępstwa,
--   4. czat zespołu (z podglądem na żywo),
--   5. automatyzacje,
--   6. zgody RODO z historią,
--   7. szablony wiadomości i status wysyłki maili,
--   8. koszty biura i koszty cykliczne,
--   9. dziennik zdarzeń (audyt),
--  10. powiadomienia w aplikacji,
--  11. kosztorysy remontu,
--  12. dokumenty z kreatora zapisane przy kliencie i ofercie,
--  13. wypłaty prowizji agentom,
--  14. AI Coach: trening na własnej ofercie, zadania treningowe, kluczowe momenty.
--
-- ZASADA, której pilnujemy po awarii z v48: żadna nowa kolumna nie dokłada
-- drugiego klucza obcego między parą tabel, które już są ze sobą powiązane.
-- Inaczej PostgREST nie wie, którą relacją dołączać, i zapytania, które dziś
-- działają, przestają. Dlatego np. properties.edited_by NIE ma klucza obcego
-- do profiles: properties ma już agent_id -> profiles.
-- Nowe tabele mają własny klucz `id`, więc nie są traktowane jak tabele łączące.
-- ============================================================


-- ── 1. Historia zmian ceny ─────────────────────────────────
-- Zapisuje baza, a nie kod aplikacji. Cena zmienia się w kilku miejscach
-- (edycja, kreator, akceptacja propozycji z portalu klienta, import), a każde
-- z nich musiałoby pamiętać o historii. Wyzwalacz łapie wszystkie naraz.

alter table public.properties
  add column if not exists edited_by uuid,
  add column if not exists kanban_pos double precision;

comment on column public.properties.edited_by is
  'Kto zmienia rekord w tej chwili. Ustawiane przez kod przy zapisie, czytane przez wyzwalacz historii ceny i od razu czyszczone. Celowo bez klucza obcego (patrz nagłówek v49).';

create table if not exists public.property_price_history (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  old_price_pln numeric(14,2),
  new_price_pln numeric(14,2),
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now()
);
create index if not exists property_price_history_prop_idx
  on public.property_price_history (property_id, changed_at desc);

create or replace function public.zapisz_historie_ceny()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.price_pln is not null then
      insert into public.property_price_history (agency_id, property_id, old_price_pln, new_price_pln, changed_by, changed_at)
      values (new.agency_id, new.id, null, new.price_pln, coalesce(new.edited_by, new.agent_id), coalesce(new.created_at, now()));
    end if;
    return null;
  end if;

  if new.price_pln is distinct from old.price_pln then
    insert into public.property_price_history (agency_id, property_id, old_price_pln, new_price_pln, changed_by)
    values (new.agency_id, new.id, old.price_pln, new.price_pln, new.edited_by);
  end if;
  -- Czyścimy zawsze, żeby autor jednej zmiany nie przykleił się do następnej,
  -- zrobionej przez kod, który edited_by nie ustawia.
  new.edited_by := null;
  return new;
end $$;

drop trigger if exists properties_historia_ceny_upd on public.properties;
create trigger properties_historia_ceny_upd
  before update on public.properties
  for each row execute function public.zapisz_historie_ceny();

drop trigger if exists properties_historia_ceny_ins on public.properties;
create trigger properties_historia_ceny_ins
  after insert on public.properties
  for each row execute function public.zapisz_historie_ceny();

-- Cena wyjściowa dla ofert, które już są w bazie: bez tego historia każdej
-- dzisiejszej oferty zaczynałaby się od pierwszej obniżki, bez punktu startu.
insert into public.property_price_history (agency_id, property_id, old_price_pln, new_price_pln, changed_by, changed_at)
select p.agency_id, p.id, null, p.price_pln, p.agent_id, p.created_at
from public.properties p
where p.price_pln is not null
  and not exists (select 1 from public.property_price_history h where h.property_id = p.id);


-- ── 2. Kanban ──────────────────────────────────────────────
alter table public.clients
  add column if not exists kanban_pos double precision;


-- ── 3. Urlopy i zastępstwa ─────────────────────────────────
create table if not exists public.agent_absences (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  agent_id uuid not null references public.profiles(id) on delete cascade,
  substitute_id uuid references public.profiles(id) on delete set null,
  kind text not null default 'urlop',
  starts_on date not null,
  ends_on date not null,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);
create index if not exists agent_absences_agency_idx
  on public.agent_absences (agency_id, starts_on, ends_on);


-- ── 4. Czat zespołu ────────────────────────────────────────
create table if not exists public.chat_channels (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  kind text not null default 'grupa',          -- 'grupa' | 'prywatny' | 'ogolny'
  name text,
  topic text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  archived_at timestamptz
);
create index if not exists chat_channels_agency_idx on public.chat_channels (agency_id, last_message_at desc);

create table if not exists public.chat_members (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.chat_channels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  last_read_at timestamptz,
  muted boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (channel_id, user_id)
);
create index if not exists chat_members_user_idx on public.chat_members (user_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.chat_channels(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null default '',
  -- Odnośniki do rekordów CRM wysłane w wiadomości: [{type, id, label}].
  refs jsonb not null default '[]'::jsonb,
  -- Załączniki: [{path, name, mime, size}].
  attachments jsonb not null default '[]'::jsonb,
  reply_to uuid references public.chat_messages(id) on delete set null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
create index if not exists chat_messages_channel_idx on public.chat_messages (channel_id, created_at desc);


-- ── 5. Automatyzacje ───────────────────────────────────────
create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  name text not null,
  enabled boolean not null default true,
  trigger text not null,
  trigger_config jsonb not null default '{}'::jsonb,
  -- Reguła może mieć kilka akcji naraz, np. zadanie plus powiadomienie.
  actions jsonb not null default '[]'::jsonb,
  runs_count integer not null default 0,
  last_run_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists automation_rules_agency_idx on public.automation_rules (agency_id, trigger) where enabled;

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  rule_id uuid not null references public.automation_rules(id) on delete cascade,
  -- Klucz, który nie pozwala jednej regule zadziałać dwa razy na to samo
  -- zdarzenie, np. dwa razy utworzyć to samo zadanie po odświeżeniu strony.
  dedupe_key text not null,
  entity_type text,
  entity_id uuid,
  status text not null default 'ok',
  detail text,
  created_at timestamptz not null default now(),
  unique (rule_id, dedupe_key)
);
create index if not exists automation_runs_agency_idx on public.automation_runs (agency_id, created_at desc);


-- ── 6. Zgody RODO ──────────────────────────────────────────
-- Tylko dopisywanie. Wycofanie zgody to nowy wiersz, a nie kasowanie starego:
-- przy kontroli trzeba pokazać, że zgoda była i od kiedy jej nie ma.
create table if not exists public.client_consents (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  kind text not null,               -- przetwarzanie | marketing_mail | marketing_tel | marketing_sms | profilowanie | udostepnienie
  granted boolean not null,
  source text not null default 'ustnie',
  note text,
  recorded_by uuid references public.profiles(id) on delete set null,
  recorded_at timestamptz not null default now()
);
create index if not exists client_consents_client_idx on public.client_consents (client_id, kind, recorded_at desc);


-- ── 7. Szablony wiadomości i wysyłka maili ─────────────────
create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  channel text not null default 'mail',   -- mail | sms
  name text not null,
  subject text,
  body text not null,
  category text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists message_templates_agency_idx on public.message_templates (agency_id, channel);

alter table public.client_messages
  add column if not exists status text,
  add column if not exists provider_id text,
  add column if not exists error text,
  add column if not exists to_address text;


-- ── 8. Koszty biura ────────────────────────────────────────
create table if not exists public.agency_cost_schedules (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  category text not null default 'inne',
  name text not null,
  vendor text,
  net_pln numeric(12,2) not null default 0,
  vat_rate numeric(5,2),
  gross_pln numeric(12,2) not null default 0,
  day_of_month integer not null default 1 check (day_of_month between 1 and 28),
  active boolean not null default true,
  last_generated_month text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.agency_costs (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  category text not null default 'inne',
  name text not null,
  vendor text,
  invoice_no text,
  cost_date date not null default current_date,
  net_pln numeric(12,2) not null default 0,
  vat_rate numeric(5,2),
  gross_pln numeric(12,2) not null default 0,
  paid boolean not null default false,
  paid_at date,
  schedule_id uuid references public.agency_cost_schedules(id) on delete set null,
  attachment_path text,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists agency_costs_agency_idx on public.agency_costs (agency_id, cost_date desc);


-- ── 9. Dziennik zdarzeń ────────────────────────────────────
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  summary text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_agency_idx on public.audit_log (agency_id, created_at desc);
create index if not exists audit_log_entity_idx on public.audit_log (entity_type, entity_id);


-- ── 10. Powiadomienia w aplikacji ──────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'info',
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);


-- ── 11. Kosztorysy remontu ─────────────────────────────────
create table if not exists public.renovation_estimates (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  title text not null,
  data jsonb not null default '{}'::jsonb,
  total_gross_pln numeric(14,2),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists renovation_estimates_agency_idx on public.renovation_estimates (agency_id, updated_at desc);


-- ── 12. Dokumenty z kreatora ───────────────────────────────
alter table public.documents
  add column if not exists template text,
  add column if not exists form_data jsonb;


-- ── 13. Wypłaty prowizji ───────────────────────────────────
alter table public.deals
  add column if not exists agent_paid_at timestamptz,
  add column if not exists agent_paid_pln numeric(12,2);


-- ── 14. AI Coach ───────────────────────────────────────────
-- Trening na własnej ofercie: training_sessions nie ma dziś żadnego
-- powiązania z properties, więc to jest pierwsza relacja tej pary.
alter table public.training_sessions
  add column if not exists property_id uuid references public.properties(id) on delete set null,
  add column if not exists context jsonb,
  add column if not exists assignment_id uuid;

alter table public.session_scores
  add column if not exists moments jsonb;

create table if not exists public.training_assignments (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  agent_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  scenario_id uuid references public.scenarios(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  difficulty text not null default 'sredni',
  personality text,
  min_score numeric(4,1),
  due_on date,
  note text,
  status text not null default 'do_zrobienia',   -- do_zrobienia | zaliczone | niezaliczone
  best_score numeric(4,1),
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists training_assignments_agent_idx on public.training_assignments (agent_id, status);


-- ── RLS: druga warstwa ochrony ─────────────────────────────
-- Aplikacja czyta przez service_role, który omija RLS. Polityki są backstopem
-- i warunkiem działania podglądu na żywo (czat, powiadomienia), który łączy
-- się z bazą w imieniu zalogowanej osoby.

do $$
declare t text;
begin
  foreach t in array array[
    'property_price_history','agent_absences','chat_channels','automation_rules',
    'automation_runs','client_consents','message_templates','agency_cost_schedules',
    'agency_costs','audit_log','renovation_estimates','training_assignments'
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

-- Wiadomości czatu widzi tylko członek kanału. Celowo BEZ polityki „całe
-- biuro": polityki się sumują, więc taka polityka pokazałaby każdemu
-- prywatne rozmowy kolegów.
alter table public.chat_members enable row level security;
drop policy if exists chat_members_own on public.chat_members;
create policy chat_members_own on public.chat_members for select
  using (user_id = auth.uid());

alter table public.chat_messages enable row level security;
drop policy if exists chat_messages_member on public.chat_messages;
create policy chat_messages_member on public.chat_messages for select
  using (exists (
    select 1 from public.chat_members m
    where m.channel_id = chat_messages.channel_id and m.user_id = auth.uid()
  ));

alter table public.notifications enable row level security;
drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications for select
  using (user_id = auth.uid());

-- Podgląd na żywo: Supabase Realtime wysyła zmiany tylko z tabel dodanych
-- do tej publikacji. Dodajemy ostrożnie, bo drugi raz rzuciłby błąd.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
exception when undefined_object then
  -- Projekt bez publikacji Realtime: czat i tak działa, odświeża się co kilka sekund.
  null;
end $$;

-- PostgREST ma odświeżyć listę tabel i kolumn od razu, bez czekania.
notify pgrst, 'reload schema';
