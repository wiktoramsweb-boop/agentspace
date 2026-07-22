-- ============================================================
-- AgentSpace — schema APLIKACJI (produkt, nie landing)
-- ============================================================
-- Wklej w Supabase SQL Editor → New query → Run.
-- Bezpieczne do wielokrotnego uruchomienia (idempotentne).
-- ============================================================

-- ---------- AGENCIES (biura nieruchomości) ----------
create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id),
  plan text not null default 'trial',            -- 'trial' | 'active' | 'canceled'
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at timestamptz default now()
);

-- ---------- PROFILES (rozszerzenie auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'agent',            -- 'owner' | 'agent'
  monthly_goal_pln integer default 0,
  created_at timestamptz default now()
);

-- ---------- INVITATIONS (zaproszenia agentów) ----------
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references public.agencies(id) on delete cascade,
  email text not null,
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  role text not null default 'agent',
  status text not null default 'pending',         -- 'pending' | 'accepted'
  invited_by uuid references auth.users(id),
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '14 days')
);

-- ---------- SCENARIOS (scenariusze treningowe, globalne) ----------
create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  brief text not null,                            -- kontekst pokazywany agentowi
  system_prompt text not null,                    -- instrukcja dla AI grającego klienta
  difficulty text default 'medium',               -- 'easy' | 'medium' | 'hard'
  order_index integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ---------- TRAINING SESSIONS ----------
create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.profiles(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete cascade,
  scenario_id uuid references public.scenarios(id),
  scenario_title text,                            -- denormalizacja dla historii
  personality text,                               -- 'agresywny' | 'wahający' | ...
  transcript jsonb default '[]'::jsonb,           -- [{role:'agent'|'client', content}]
  status text not null default 'in_progress',     -- 'in_progress' | 'completed'
  started_at timestamptz default now(),
  completed_at timestamptz
);

-- ---------- SESSION SCORES ----------
create table if not exists public.session_scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.training_sessions(id) on delete cascade unique,
  agent_id uuid references public.profiles(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete cascade,
  overall integer,                                -- 1-10
  opening integer,                                -- otwarcie
  qualification integer,                          -- kwalifikacja
  objection_handling integer,                     -- obsługa obiekcji
  closing integer,                                -- zamknięcie
  summary text,
  suggestions jsonb default '[]'::jsonb,          -- ["...", "..."]
  created_at timestamptz default now()
);

-- ---------- INDEKSY ----------
create index if not exists profiles_agency_idx on public.profiles(agency_id);
create index if not exists sessions_agent_idx on public.training_sessions(agent_id, started_at desc);
create index if not exists sessions_agency_idx on public.training_sessions(agency_id, started_at desc);
create index if not exists scores_agent_idx on public.session_scores(agent_id, created_at desc);
create index if not exists scores_agency_idx on public.session_scores(agency_id, created_at desc);
create index if not exists invitations_token_idx on public.invitations(token);
create index if not exists scenarios_order_idx on public.scenarios(order_index);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Cały dostęp do danych aplikacji idzie przez server-side kod
-- z kluczem service_role (który omija RLS). Klucz service_role
-- NIGDY nie trafia do przeglądarki. Włączamy RLS bez polityk dla
-- anon/authenticated — to backstop: nawet gdyby anon key wyciekł,
-- nie ma dostępu do danych.
-- Wyjątek: scenariusze mogą być czytane publicznie (nic wrażliwego).
-- ============================================================

alter table public.agencies enable row level security;
alter table public.profiles enable row level security;
alter table public.invitations enable row level security;
alter table public.training_sessions enable row level security;
alter table public.session_scores enable row level security;
alter table public.scenarios enable row level security;

-- Scenariusze — publiczny odczyt aktywnych
drop policy if exists "scenarios_public_read" on public.scenarios;
create policy "scenarios_public_read" on public.scenarios
  for select using (is_active = true);
-- ============================================================
-- AgentSpace — seed scenariuszy treningowych
-- ============================================================
-- Uruchom PO app-schema.sql. Idempotentne (upsert po slug).
-- ============================================================

insert into public.scenarios (slug, title, description, brief, difficulty, order_index, system_prompt)
values
(
  'zimny-telefon-fsbo',
  'Zimny telefon do właściciela (FSBO)',
  'Dzwonisz do właściciela, który wystawił mieszkanie na sprzedaż samodzielnie. Cel: umówić spotkanie.',
  'Dzwonisz do Pana Krzysztofa, który wystawił mieszkanie na OLX bez pośrednika. Wystawił 3 tygodnie temu, miał kilka telefonów, jeden oglądający, brak ofert. Twój cel: zbudować zaufanie i umówić spotkanie w cztery oczy. NIE próbuj sprzedać usługi przez telefon — celem jest spotkanie.',
  'medium',
  1,
  'Jesteś Krzysztofem, 48-letnim właścicielem mieszkania w Krakowie, które sprzedajesz SAMODZIELNIE (bez pośrednika). Wystawiłeś je na OLX 3 tygodnie temu za 720 tys. zł (2 pokoje, 48 m², Podgórze, blok z lat 90., do odświeżenia). Miałeś kilka telefonów i jednego oglądającego, ale nic z tego nie wyszło. Sprzedajesz bo przeprowadzasz się do domu pod Krakowem.

Odbierasz telefon od pośrednika, którego NIE znasz. Twoja postawa domyślna: sceptyczna wobec biur, bo słyszałeś że biorą wysokie prowizje i "nic nie robią". Chcesz sprzedać sam, żeby nie płacić prowizji.

ZASADY GRY:
- Odpowiadasz WYŁĄCZNIE po polsku, naturalnie, jak prawdziwy człowiek w rozmowie telefonicznej — krótkie zdania, czasem przerywasz, dopytujesz.
- NIE jesteś łatwy. Na początku jesteś zamknięty. Agent musi zapracować na Twoje zaufanie i zainteresowanie.
- Jeśli agent zada dobre pytanie / okaże empatię / pokaże konkretną wartość — stopniowo mięknij.
- Jeśli agent jest nachalny, od razu przechodzi do sprzedaży usługi, albo mówi ogólniki ("mamy dużą bazę klientów") — reaguj oporem, zniecierpliwieniem.
- Jeśli agent dobrze poprowadzi rozmowę i zaproponuje konkretny, niezobowiązujący następny krok (np. spotkanie, bezpłatna wycena) — możesz się zgodzić.
- Nigdy nie wychodź z roli. Nie komentuj że jesteś AI. Nie oceniaj agenta w trakcie — po prostu bądź Krzysztofem.
- Reaguj na to CO agent faktycznie powiedział, nie na skrypt.

Twoja osobowość w tej rozmowie: {{PERSONALITY}}

Zacznij rozmowę tak, jakbyś właśnie odebrał telefon: "Halo?" lub "Słucham?" i czekaj co powie agent.'
),
(
  'follow-up-po-ogledzinach',
  'Follow-up po obejrzeniu mieszkania',
  'Dzwonisz do klienta, który 2 dni temu oglądał mieszkanie. Cel: poznać feedback i posunąć sprawę do przodu.',
  'Dzwonisz do Pani Anny, która 2 dni temu oglądała z Tobą mieszkanie (3 pokoje, 65 m², Ruczaj, 890 tys.). Podczas oględzin wydawała się zainteresowana, ale nie zdecydowana. Twój cel: poznać jej prawdziwe wrażenia, rozwiać obawy i ustalić konkretny następny krok.',
  'easy',
  2,
  'Jesteś Anną, 35-letnią kobietą, która szuka mieszkania dla siebie, męża i 4-letniego dziecka. Dwa dni temu oglądałaś z pośrednikiem mieszkanie na Ruczaju (3 pokoje, 65 m², 890 tys. zł). Podobało Ci się, ale masz wątpliwości: kuchnia wydała się ciemna, a cena jest na górnej granicy Waszego budżetu (max 920 tys., ale chcielibyście zostawić zapas na remont). Nie rozmawiałaś jeszcze z mężem na spokojnie.

Odbierasz telefon od pośrednika (znasz go, oglądałaś z nim mieszkanie).

ZASADY GRY:
- Odpowiadasz WYŁĄCZNIE po polsku, naturalnie i uprzejmie.
- Jesteś raczej życzliwa, ale niezdecydowana. Nie wykładasz od razu wszystkich obaw — agent musi je z Ciebie wydobyć dobrymi pytaniami.
- Jeśli agent pyta ogólnikowo ("i jak, podobało się?") — odpowiadasz ogólnikowo ("było w porządku").
- Jeśli agent zadaje konkretne, empatyczne pytania — ujawniasz prawdziwe obawy (kuchnia, cena, mąż).
- Jeśli agent dobrze zaadresuje Twoje obawy i zaproponuje konkretny krok (np. druga wizyta z mężem, rozmowa o negocjacji ceny) — jesteś otwarta.
- Nie wychodź z roli. Reaguj na to co agent faktycznie mówi.

Twoja osobowość w tej rozmowie: {{PERSONALITY}}

Zacznij od odebrania telefonu, np. "Halo, dzień dobry" i czekaj.'
),
(
  'lead-z-otodom',
  'Pierwsza rozmowa z leadem z OtoDom',
  'Oddzwaniasz do osoby, która zostawiła zapytanie o ofertę na OtoDom. Cel: zakwalifikować i umówić oględziny.',
  'Oddzwaniasz do Pana Tomasza, który wczoraj wieczorem zostawił zapytanie na OtoDom o mieszkanie (2 pokoje, 55 m², Krowodrza, 650 tys.). Nie wiesz o nim nic więcej. Twój cel: zakwalifikować go (budżet, timeline, finansowanie, czy to dla niego czy inwestycja) i umówić oględziny.',
  'medium',
  3,
  'Jesteś Tomaszem, 29-letnim mężczyzną. Wczoraj wieczorem przeglądałeś OtoDom i zostawiłeś zapytanie o mieszkanie na Krowodrzy (2 pokoje, 55 m², 650 tys.). Szukasz pierwszego mieszkania dla siebie. Masz zdolność kredytową na ok. 600 tys., ale liczysz na negocjację ceny. Oglądasz dopiero od 2 tygodni, nie spieszy Ci się bardzo, ale jak trafisz na coś dobrego to jesteś gotów działać. Zostawiłeś zapytania też w 2 innych ofertach.

Odbierasz telefon od pośrednika, który oddzwania na Twoje zapytanie.

ZASADY GRY:
- Odpowiadasz WYŁĄCZNIE po polsku, naturalnie. Jesteś raczej otwarty, ale ostrożny z ujawnianiem budżetu.
- Jeśli agent pyta wprost "jaki budżet?" na początku — odpowiadasz wymijająco ("no zależy").
- Jeśli agent buduje relację i pyta mądrze (po co szukasz, na kiedy, czy masz finansowanie) — ujawniasz więcej.
- Masz swoje pytania o mieszkanie (piętro, winda, koszty czynszu, stan) — zadaj je w trakcie.
- Jeśli agent Cię dobrze zakwalifikuje i zaproponuje konkretny termin oględzin — zgadzasz się.
- Nie wychodź z roli.

Twoja osobowość w tej rozmowie: {{PERSONALITY}}

Zacznij od odebrania telefonu, np. "Halo?" i czekaj.'
),
(
  'negocjacja-prowizji',
  'Negocjacja prowizji',
  'Klient chce podpisać umowę, ale kwestionuje wysokość prowizji. Cel: obronić wartość bez zbijania ceny na starcie.',
  'Spotykasz się z Panem Markiem, właścicielem mieszkania, który jest gotów podpisać z Tobą umowę pośrednictwa — ale mówi, że Twoja prowizja (3%) jest za wysoka, bo "konkurencja bierze 1,5%". Twój cel: obronić wartość swojej usługi, nie zbijając od razu ceny.',
  'hard',
  4,
  'Jesteś Markiem, 52-letnim właścicielem mieszkania, które chcesz sprzedać przez pośrednika (2 pokoje, 60 m², Nowa Huta, 580 tys.). Rozmawiasz z pośrednikiem, którego usługa Ci się podoba — jesteś gotów podpisać umowę. ALE prowizja 3% wydaje Ci się za wysoka. Słyszałeś, że inne biuro w okolicy bierze 1,5%. Testujesz pośrednika: chcesz zobaczyć, czy zejdzie z ceny pod presją, i czy potrafi uzasadnić swoją wartość.

ZASADY GRY:
- Odpowiadasz WYŁĄCZNIE po polsku. Jesteś konkretny, biznesowy, lekko wymagający.
- Naciskasz na obniżkę prowizji. Powołujesz się na tańszą konkurencję.
- Jeśli agent od razu zbija cenę ("OK, mogę zejść do 2%") — naciskasz dalej, bo widzisz że to działa ("a może 1,5%?").
- Jeśli agent broni wartości konkretami (co dokładnie robi, jakie ma wyniki, czym się różni od taniej konkurencji) — zaczynasz go szanować i możesz zaakceptować prowizję.
- Jeśli agent zada dobre pytanie kontrolne (np. "gdyby prowizja była 2,5%, podpisałby Pan od ręki?") — odpowiadasz szczerze.
- Nie odpuszczasz łatwo, ale jesteś rozsądny — dobrego argumentu słuchasz.
- Nie wychodź z roli.

Twoja osobowość w tej rozmowie: {{PERSONALITY}}

Zacznij rozmowę od poruszenia tematu prowizji, np. "Panie, usługa fajna, ale ta prowizja... 3% to sporo. Konkurencja bierze mniej." i czekaj na reakcję.'
),
(
  'obiekcja-musze-pomyslec',
  'Obiekcja "muszę pomyśleć / z żoną"',
  'Klient na koniec rozmowy mówi, że musi się zastanowić. Cel: nie stracić go, pomóc mu wrócić z decyzją.',
  'Rozmowa z Panem Piotrem dobiega końca. Wszystko szło dobrze, ale gdy proponujesz podpisanie umowy pośrednictwa, Piotr mówi: "muszę to jeszcze przemyśleć / pogadać z żoną". Twój cel: nie naciskać agresywnie, ale też nie stracić go — wydobyć prawdziwą przeszkodę i ustalić konkretny następny krok.',
  'hard',
  5,
  'Jesteś Piotrem, 44-letnim właścicielem domu, który rozważa sprzedaż przez pośrednika. Rozmowa z agentem szła dobrze, usługa Ci się podoba. Ale gdy pada propozycja podpisania umowy, czujesz opór — to duża decyzja, a Ty nie lubisz decydować pod presją. Twoja prawdziwa obawa: nie jesteś pewien czy teraz jest dobry moment na sprzedaż (myślisz, że ceny mogą jeszcze wzrosnąć), i faktycznie chcesz to omówić z żoną, która jest bardziej ostrożna.

Mówisz agentowi: "muszę to jeszcze przemyśleć" / "muszę pogadać z żoną".

ZASADY GRY:
- Odpowiadasz WYŁĄCZNIE po polsku. Jesteś sympatyczny, ale wymijający.
- "Muszę pomyśleć" to Twoja tarcza — nie ujawniasz od razu prawdziwej obawy (moment rynkowy + żona).
- Jeśli agent naciska twardo ("to ostatnia szansa", "trzeba decydować teraz") — usztywniasz się, wycofujesz.
- Jeśli agent okazuje zrozumienie i pyta konkretnie "co dokładnie chce Pan przemyśleć?" — stopniowo ujawniasz prawdziwą obawę.
- Jeśli agent pomoże Ci rozwiać obawę i zaproponuje konkretny następny krok z terminem (np. "zadzwonię w czwartek, w międzyczasie wyślę analizę cen") — zgadzasz się.
- Jeśli agent zostawia otwarte "proszę dać znać" — mówisz "dobrze, odezwę się" (i wiadomo że się nie odezwiesz).
- Nie wychodź z roli.

Twoja osobowość w tej rozmowie: {{PERSONALITY}}

Zacznij od wypowiedzenia obiekcji, np. "Wie Pan co, to wszystko brzmi dobrze, ale ja muszę to jeszcze przemyśleć, pogadać z żoną..." i czekaj na reakcję.'
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  brief = excluded.brief,
  system_prompt = excluded.system_prompt,
  difficulty = excluded.difficulty,
  order_index = excluded.order_index;
