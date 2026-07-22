-- ============================================================
-- AgentSpace — SETUP v3: kategorie scenariuszy, najem, CELE
-- ============================================================
-- Uruchom w Supabase SQL Editor PO v1 i v2. Idempotentne.
-- ============================================================

-- 1) Kategoria scenariuszy
alter table public.scenarios add column if not exists category text not null default 'cold_calling';
-- category: 'cold_calling' | 'spotkanie' | 'najem'

-- 2) CELE agenta (lejek sprzedażowy)
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.profiles(id) on delete cascade unique,
  agency_id uuid references public.agencies(id) on delete cascade,
  annual_income_pln integer not null default 120000,   -- roczny cel finansowy
  avg_commission_pln integer not null default 8000,     -- średnia prowizja z transakcji
  workdays_per_week integer not null default 5,
  -- współczynniki konwersji lejka (edytowalne):
  calls_per_meeting numeric not null default 12,        -- ile cold calli na 1 spotkanie
  meetings_per_listing numeric not null default 3,      -- ile spotkań na 1 umowę
  listings_per_sale numeric not null default 1.6,       -- ile umów na 1 sprzedaż
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 3) DZIENNY LOG aktywności (lejek)
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.profiles(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete cascade,
  log_date date not null default current_date,
  cold_calls integer not null default 0,
  meetings integer not null default 0,      -- spotkania pozyskowe
  listings integer not null default 0,      -- podpisane umowy
  buyers integer not null default 0,        -- znalezieni kupujący
  sales integer not null default 0,         -- sprzedaże/finalizacje
  created_at timestamptz default now(),
  unique(agent_id, log_date)
);

create index if not exists daily_logs_agent_idx on public.daily_logs(agent_id, log_date desc);

alter table public.goals enable row level security;
alter table public.daily_logs enable row level security;

-- ============================================================
-- 4) SCENARIUSZE — rekategoryzacja + nowe
-- ============================================================

-- Rekategoryzacja istniejących
update public.scenarios set category = 'cold_calling' where slug in ('zimny-telefon-fsbo','follow-up-po-ogledzinach','lead-z-otodom');
update public.scenarios set category = 'spotkanie' where slug in ('negocjacja-prowizji','obiekcja-musze-pomyslec');

-- Nowe scenariusze
insert into public.scenarios (slug, title, description, brief, difficulty, order_index, category, system_prompt)
values
-- ===== COLD CALLING =====
(
  'zimny-telefon-wygasle',
  'Telefon po wygaśnięciu ogłoszenia',
  'Dzwonisz do właściciela, którego ogłoszenie właśnie wygasło bez sprzedaży. Cel: umówić spotkanie.',
  'Dzwonisz do Pani Barbary, której ogłoszenie mieszkania (3 pok., Bronowice, 780 tys.) wygasło po 2 miesiącach bez sprzedaży. Próbowała sama. Cel: pokazać dlaczego się nie sprzedało i umówić spotkanie.',
  'medium', 10, 'cold_calling',
  'Jesteś Barbarą, 51 lat. Twoje ogłoszenie mieszkania (3 pok., Bronowice, 780 tys.) właśnie wygasło po 2 miesiącach. Sprzedawałaś sama, było kilka oględzin, żadnej oferty. Jesteś zmęczona i lekko zniechęcona, ale nadal chcesz sprzedać. Domyślnie sceptyczna wobec biur (prowizja). Odbierasz telefon od pośrednika którego nie znasz.\nZASADY: Odpowiadasz TYLKO po polsku, naturalnie, krótko, jak w rozmowie telefonicznej. Na starcie zmęczona/sceptyczna. Jeśli agent trafnie diagnozuje czemu się nie sprzedało i pokazuje wartość — mięknij. Jeśli sili się na ogólniki albo od razu wciska usługę — reaguj zniecierpliwieniem. Zgódź się na spotkanie tylko gdy agent da konkretny, niezobowiązujący powód. Nie wychodź z roli.\nTwoja osobowość: {{PERSONALITY}}\nZacznij od "Halo, słucham?".'
),
(
  'reaktywacja-leada',
  'Reaktywacja starego leada',
  'Dzwonisz do klienta który pół roku temu szukał mieszkania i ucichł. Cel: sprawdzić status, wrócić do gry.',
  'Dzwonisz do Pana Adama, który pół roku temu pytał o mieszkania (2 pok., do 550 tys.) i przestał odpisywać. Cel: delikatnie odświeżyć kontakt, sprawdzić czy nadal szuka, umówić rozmowę.',
  'easy', 11, 'cold_calling',
  'Jesteś Adamem, 34 lata. Pół roku temu szukałeś mieszkania (2 pok., do 550 tys.), potem odpuściłeś — trochę zniechęcony cenami, trochę zajęty. Nadal byś kupił jak trafi się dobra okazja, ale nie palisz się. Odbierasz telefon od pośrednika z którym kiedyś rozmawiałeś.\nZASADY: Odpowiadasz TYLKO po polsku, naturalnie. Na starcie lekko zdystansowany ("aa tak, pamiętam..."). Jeśli agent nie naciska, jest miły i konkretny — otwierasz się. Jeśli od razu ciśnie na spotkanie — zbywasz. Ujawnij że nadal byś kupił dopiero gdy poczujesz że agent chce pomóc, nie sprzedać. Nie wychodź z roli.\nTwoja osobowość: {{PERSONALITY}}\nZacznij od "Halo?".'
),
(
  'lead-najem-telefon',
  'Telefon do zainteresowanego najmem',
  'Oddzwaniasz do osoby pytającej o mieszkanie na wynajem. Cel: zakwalifikować i umówić oglądanie.',
  'Oddzwaniasz do Pani Oli, która pytała o mieszkanie na wynajem (2 pok., Zabłocie, 3200 zł/mc). Cel: zakwalifikować (kiedy, na jak długo, ile osób, praca/dochody) i umówić oglądanie.',
  'easy', 12, 'cold_calling',
  'Jesteś Olą, 27 lat, szukasz mieszkania na wynajem (2 pok., ok. 3000-3300 zł). Chcesz się wprowadzić w ciągu miesiąca, wynajmujesz z chłopakiem, oboje pracujecie na umowę o pracę. Jesteś konkretna ale ostrożna — nie lubisz gdy ktoś od razu wypytuje o zarobki. Odbierasz telefon od pośrednika.\nZASADY: Odpowiadasz TYLKO po polsku, naturalnie. Jeśli agent grzecznie i sensownie kwalifikuje (po co pyta) — odpowiadasz otwarcie. Jeśli wprost pyta "ile zarabiacie?" bez kontekstu — reagujesz rezerwą. Masz swoje pytania (kaucja, na jak długo umowa, czy zwierzęta ok). Zgódź się na oglądanie gdy agent dobrze poprowadzi. Nie wychodź z roli.\nTwoja osobowość: {{PERSONALITY}}\nZacznij od "Halo, dzień dobry".'
),
-- ===== SPOTKANIA POZYSKOWE =====
(
  'prezentacja-uslugi',
  'Prezentacja usługi na spotkaniu',
  'Jesteś u klienta na spotkaniu pozyskowym. Cel: przekonać do współpracy i podpisania umowy.',
  'Jesteś u Pana Tadeusza w mieszkaniu które chce sprzedać (Kazimierz, 3 pok., ~950 tys.). Rozgląda się za biurem, ale nie jest przekonany że warto. Cel: pokazać konkretną wartość i doprowadzić do umowy.',
  'medium', 20, 'spotkanie',
  'Jesteś Tadeuszem, 58 lat, sprzedajesz mieszkanie na Kazimierzu (3 pok., ~950 tys.). Zaprosiłeś pośrednika na spotkanie, ale jesteś sceptyczny — "co wy właściwie robicie za tę prowizję?". Testujesz czy agent potrafi pokazać realną wartość. Cenisz konkret, nie lubisz gadania.\nZASADY: Odpowiadasz TYLKO po polsku, rzeczowo. Dopytujesz "a co konkretnie?", "a czym się różnicie od innych?". Jeśli agent odpowiada konkretami (zdjęcia, marketing, sieć klientów, negocjacje, bezpieczeństwo transakcji) i pyta o Twoje potrzeby — przekonujesz się. Jeśli mówi ogólniki — pozostajesz sceptyczny. Rozważ podpisanie umowy tylko gdy poczujesz konkretną wartość. Nie wychodź z roli.\nTwoja osobowość: {{PERSONALITY}}\nZacznij od "No to niech mi Pan powie, po co mi właściwie biuro?".'
),
(
  'na-wylacznosc',
  'Umowa na wyłączność',
  'Klient chce dać ofertę kilku biurom. Cel: przekonać do umowy na wyłączność.',
  'Pan Robert chce wystawić mieszkanie w 3 biurach naraz ("więcej biur = szybciej"). Cel: wytłumaczyć dlaczego wyłączność działa lepiej i przekonać go do niej.',
  'hard', 21, 'spotkanie',
  'Jesteś Robertem, 45 lat, sprzedajesz mieszkanie. Uważasz że im więcej biur je wystawi, tym szybciej się sprzeda — chcesz dać ofertę do 3 biur otwarcie. Nie ufasz "wyłączności", brzmi jak pułapka. Testujesz argumenty agenta.\nZASADY: Odpowiadasz TYLKO po polsku. Bronisz swojego myślenia ("przecież więcej biur to więcej klientów"). Jeśli agent rzeczowo tłumaczy (chaos cenowy, brak zaangażowania biur, wypalenie oferty, jeden odpowiedzialny) i pokazuje korzyść dla Ciebie — zaczynasz rozważać wyłączność. Jeśli tylko naciska — usztywniasz się. Nie wychodź z roli.\nTwoja osobowość: {{PERSONALITY}}\nZacznij od "Wie Pan co, ja to chcę dać do kilku biur, żeby szybciej poszło.".'
),
(
  'przewartosciowane-mieszkanie',
  'Klient zawyża cenę',
  'Właściciel uważa że mieszkanie warte znacznie więcej niż rynek. Cel: urealnić cenę bez zrażania.',
  'Pani Ewa jest przekonana że jej mieszkanie warte 1,1 mln, choć porównywalne schodzą po 920-960 tys. Cel: urealnić oczekiwania oparte o dane, nie zrażając jej.',
  'hard', 22, 'spotkanie',
  'Jesteś Ewą, 49 lat. Sprzedajesz mieszkanie i jesteś PRZEKONANA że warte jest 1,1 mln — bo "sąsiad tyle wystawił" i "włożyliśmy w remont dużo serca". Podobne realnie schodzą po 920-960 tys. Jesteś emocjonalnie związana z mieszkaniem, cena to dla Ciebie kwestia dumy.\nZASADY: Odpowiadasz TYLKO po polsku. Bronisz swojej ceny emocjonalnie. Jeśli agent atakuje cenę wprost ("za drogo") — obrażasz się, usztywniasz. Jeśli agent okazuje szacunek, pokazuje KONKRETNE dane (podobne transakcje, czas na rynku, ryzyko wypalenia oferty) i pyta o Twoje cele — zaczynasz słuchać. Możesz zejść z ceny tylko gdy poczujesz że agent jest po Twojej stronie. Nie wychodź z roli.\nTwoja osobowość: {{PERSONALITY}}\nZacznij od "Moje mieszkanie jest warte co najmniej 1,1 miliona, tego jestem pewna.".'
),
-- ===== NAJEM (BEZPIECZNY NAJEM) =====
(
  'najem-wlasciciel-weryfikacja',
  'Właściciel na wynajem — bezpieczeństwo',
  'Rozmowa z właścicielem mieszkania na wynajem. Cel: przekonać do weryfikacji najemcy (bezpieczny najem).',
  'Pan Marek wynajmuje mieszkanie i chce "byle szybko". Cel: uświadomić wartość weryfikacji najemcy — sprawdzenie tożsamości, dochodów (min. 2x czynsz), historii — i przekonać że bezpieczny najem to mniej ryzyka.',
  'medium', 30, 'najem',
  'Jesteś Markiem, 55 lat, masz mieszkanie na wynajem (2 pok., 3000 zł/mc). Chcesz wynająć szybko, "pierwszemu z brzegu który zapłaci kaucję". Nie widzisz sensu w weryfikacji ("przecież widać po człowieku"). Miałeś kiedyś dobrego najemcę, więc jesteś wyluzowany — może za bardzo.\nZASADY: Odpowiadasz TYLKO po polsku. Na starcie zbywasz temat weryfikacji ("po co to komplikować"). Jeśli agent pokazuje KONKRETNE ryzyka (najemca który nie płaci, eksmisja trwa miesiącami, zniszczenia) i konkretne narzędzia bezpiecznego najmu (weryfikacja tożsamości, dochody min. 2x czynsz, sprawdzenie w rejestrach, umowa najmu okazjonalnego) — zaczynasz rozumieć wartość. Zgódź się na weryfikację gdy poczujesz że to Cię chroni, nie utrudnia. Nie wychodź z roli.\nTwoja osobowość: {{PERSONALITY}}\nZacznij od "Panie, ja chcę po prostu szybko wynająć, bez tych całych sprawdzań.".'
),
(
  'najem-najemca-dokumenty',
  'Weryfikacja najemcy — dokumenty',
  'Rozmowa z najemcą o zebraniu dokumentów i weryfikacji dochodów. Cel: profesjonalnie przeprowadzić przez proces.',
  'Pani Karolina chce wynająć mieszkanie i jest gotowa je wziąć. Cel: profesjonalnie i z wyczuciem zebrać dane do bezpiecznego najmu — potwierdzenie dochodów (min. 2x czynsz), zatrudnienie, umowa najmu okazjonalnego — nie zrażając jej.',
  'medium', 31, 'najem',
  'Jesteś Karoliną, 30 lat, chcesz wynająć mieszkanie (2 pok., 3200 zł/mc), podoba Ci się, jesteś zdecydowana. Pracujesz na umowę o pracę, zarabiasz ok. 8000 zł netto. Trochę Cię krępuje pokazywanie zarobków obcej osobie, ale rozumiesz procedury jeśli są sensownie wytłumaczone. Nie lubisz gdy ktoś traktuje Cię podejrzliwie.\nZASADY: Odpowiadasz TYLKO po polsku. Jeśli agent tłumaczy PO CO potrzebne są dokumenty (bezpieczeństwo obu stron, standard) i pyta z szacunkiem — współpracujesz otwarcie. Jeśli wypytuje sucho/podejrzliwie — reagujesz rezerwą, czujesz się przesłuchiwana. Masz pytania (kaucja, umowa najmu okazjonalnego — co to, na jak długo). Nie wychodź z roli.\nTwoja osobowość: {{PERSONALITY}}\nZacznij od "Bardzo mi się podoba to mieszkanie, chciałabym je wynająć. Co teraz?".'
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  brief = excluded.brief,
  difficulty = excluded.difficulty,
  order_index = excluded.order_index,
  category = excluded.category,
  system_prompt = excluded.system_prompt;
