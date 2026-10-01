# AgentSpace - pełny status projektu (handoff)

> Ten dokument to kompletny zapis projektu do przekazania nowej sesji Claude.
> Czytaj razem z `CLAUDE.md` (architektura + zasady).

## 🟢 SESJA LIPIEC 2026 - co dodaliśmy w tym czacie (najświeższe)

Wszystko live na `main`/Vercel. W tej sesji doszło:
- **System ról CEO / Menedżer / Agent** (SQL v13). CEO nadaje role i przypisuje agentów do menedżera (`/app/zespol` → „Zespoły menedżerów" - od strony menedżera wybierasz jego osoby). Menedżer widzi TYLKO swoich agentów: Cele/lejek + wyniki AI, BEZ prowizji, tylko podgląd. Można zaprosić 2. CEO (Krystian Sławęta) z góry nadaną rolą. Helper `requireManagerOrOwner`, etykiety `ROLE_LABELS`. **Fix buga:** klik w sesję agenta (też w toku) nie wyrzuca już na pulpit - CEO/menedżer widzi read-only. Drill-down agenta: Cele/lejek + WSZYSTKIE sesje + kalendarz „dzień po dniu".
- **Tygodniowe limity AI Coach** (SQL v14) - CEO ustawia per osoba; egzekwowane w `startSession`.
- **Alerty proaktywne + trendy** - `getTeamInsights`: „⚠️ Wymaga uwagi" (nie dzwoni 3+ dni / wynik AI spadł / nie trenuje) + strzałki trendu + słupki aktywności zespołu (4 tyg.).
- **Zmiana własnego maila logowania** - `/app/ustawienia` → „Zmień email" (`changeMyEmail`, admin API).
- **Asystent wiadomości** (`/app/maile`) - AI pisze maile i SMS-y w tonie Spectry (patrz niżej). Zawiera typ „Trudny/słaby okres - uczciwie" (zamiast zmyślania danych - user prosił o zmyślanie, ODMÓWIŁEM, dałem uczciwą alternatywę).
- **Karta transakcji** (SQL v15) - `/app/prowizje/[id]`: 5 etapów + checklista dokumentów, autozapis (patrz niżej).
- **Klienci - podział na typy**: sprzedający/kupujący/wynajmujący/najemca (+inny). Formularz najpierw pyta o typ, pola dopasowane (sprzedający ma „oczekiwaną cenę" nie „budżet"). Filtr typu na liście. `CLIENT_TYPE_LABELS` (stary „najem" = legacy). Bez migracji.
- **Nieruchomości WSPÓLNE dla biura** (jak Klienci) - `getAgencyProperties`, browser z filtrem Wszystkie/Moje, edycja agency-scoped. Karty z gradientem/ikoną typu/opiekunem, **mapa ciemna (CARTO) + kolorowe pinezki z ceną**.
- **Umowa rezerwacyjna** - pełny moduł + **PDF przez pdf-lib** (kluczowa lekcja, patrz wpis modułu i [[pdf-generowanie-dokumentow]]).
- **Wizualny lifting** - design kit `components/kit.tsx` (Button/SegmentedToggle z akcentem koloru - moduły MAJĄ się różnić kolorami, user tego chce), gradienty tła, `focus-visible`, `.text-gradient` na nagłówkach.
- **RLS** (SQL v16) - backstop izolacji biur (service_role omija; user może uruchomić).
- **Perf/mobile fixy:** region Vercela → **fra1** (obok Supabase, duży zysk szybkości), globalne 16px na polach (koniec auto-zoom iOS), modal `dvh` + scroll-do-pola (pola nie chowają się za klawiaturą), przyciski „wciskają się" + spinnery (`SubmitButton`), inputMode decimal + przecinek w prowizjach.

**⚠️ USER MUSI URUCHOMIĆ w Supabase (potwierdzić które):** v13 (role), v14 (limity AI), v15 (karta transakcji), v16 (RLS - opcjonalne). Kod odporny na brak kolumn (pokazuje czytelny błąd).

**PLANY DALEJ (omówione, priorytety usera):** (1) **Kalendarz spotkań + realne powiadomienia** (rekomendowane - codzienna lepkość; push wymaga env VAPID). (2) **Matching kupujący↔nieruchomość**. (3) **Analiza PRAWDZIWEJ rozmowy** (nagranie → Whisper transkrypcja → scoring jak AI Coach; wyróżnik, koszt Whisper). (4) **Automatyczna wysyłka maili/SMS** - czeka na weryfikację domeny **spectranieruchomosci.pl** w Resend (user wybrał podmianę agentspace.pl→spectranieruchomosci.pl; z gmaila NIE da się wysyłać). (5) **Płatności (Stripe/Tpay)** do monetyzacji. (6) Design kit rozlać na resztę modułów (~46 przycisków), więcej aria-label. (7) Sekwencje follow-up, podłączenie CRM do asystenta maili.

---

## 🔵 NAJNOWSZY STAN (czytaj to najpierw)

Od czasu opisu poniżej doszło DUŻO modułów. Wszystko live na `main`/Vercel. Skróty:

**Nowe moduły/zakładki:**
- **Nieruchomości** (`/app/nieruchomosci`) - oferty + mapa wszystkich aktywnych (Leaflet CDN), karta oferty z edycją, powiązanie z klientem (właściciel/zainteresowani), karta „Co w okolicy" (Overpass/OSM).
- **Opisy** (`/app/opisy`) - generator opisów ogłoszeń (szablon + „✨ AI" przez `/api/opis/generate`).
- **Asystent wiadomości** (`/app/maile`) - AI pisze **maile i SMS-y** do klientów w tonie Spectry. Przełącznik Mail/SMS. Maile: ~15 typów pogrupowanych kolorami (Właściciel/Kupujący/Negocjacje/Formalności/Relacja/Inne). SMS: 8 typów + podgląd „dymek" + licznik znaków/segmentów (polskie znaki→70/SMS). `/api/maile/generate` (mode mail/sms; tool-use `napisz_mail`{subject,body} / `napisz_sms`{text}). KLUCZOWE: AI używa TYLKO faktów agenta, nie wymyśla liczb/dat/adresów (braki jako `[nawiasy]`), linki/adresy przepisuje 1:1. Ton w SYSTEM prompcie na bazie realnych maili. Nie wymaga CRM. Wynik edytowalny + kopiuj.
- **Ofertówka** (`/app/ofertowka`) - one-pager oferty (zdjęcia + parametry) → druk/PDF, bez AI. `sheet-a4` = 1 strona.
- **Umowa rezerwacyjna** (`/app/rezerwacje`) - generator umowy rezerwacyjnej **sprzedaż/najem** (wybór), typ nieruchomości, powtarzalne strony (właściciele/kupujący). Prawnie kompletna. Wybór **Zadatek (bezzwrotny, art. 394 KC - przepada gdy Kupujący/Najemca rezygnuje; przy rezygnacji właściciela zwrot nominalny, wyłączenie dwukrotności)** lub Opłata rezerwacyjna. Strony: PESEL + **dowód osobisty LUB paszport** (do wyboru) + adres. Akt notarialny (art. 158 KC) dla sprzedaży, najem okazjonalny (art. 19a). Definicje stron w formie standardowej (Sprzedający/Kupujący, Wynajmujący/Najemca) z poprawną deklinacją. **Dodatkowe zapisy przez AI** (`/api/rezerwacja/klauzula` → wstawia jako „§ dodatkowe" przed końcowymi). `lib/reservation.ts` = builder treści (pogrubienia jako `**...**`). **PDF: `lib/reservation-pdf.ts` (pdf-lib, NIE druk przeglądarki!)** - real PDF, równe marginesy na każdej stronie, brak nagłówka przeglądarki, 2 strony, podpisy. Przycisk „Podgląd i PDF" → „Pobierz PDF". [[pdf-generowanie-dokumentow]]. Bez DB, client-side.
- **Kalkulatory** (`/app/kalkulatory`) - rata kredytu (+nadpłata), koszty zakupu (rynek/rabaty/opłaty), ROI najmu → PDF dla klienta (przez druk; podgląd pełnoekranowy „Podgląd i PDF").
- **Faktury** (`/app/faktury`, owner) - 3 sprzedawców, nabywca firma/osoba, kwota słownie, VAT zw, edycja, druk/PDF. `lib/invoice.ts`.
- **Szybki wpis głosem** (`/app/szybki-wpis`) - dyktujesz relację ze spotkania → `/api/quick-entry/parse` (Claude tool-use) → klient + notatka + nieruchomość do CRM.
- **Prowizje** - kalkulator z VAT (brutto→netto, zarobek od netto), prognoza kwartału.
- **Klienci** - WSPÓŁDZIELONY CRM (cała agencja), wyszukiwarka po telefonie, przypomnienia, styl ASARI.

**AI Coach:** poziom trudności (łatwy/średni/trudny, wybierany przy starcie - `session.difficulty` → prompt), scenariusze pogrupowane kolorami; nowe scenariusze (archiwalne telefony, negocjacja oferty, gdybanie, doradca kredytowy). Ranking WYKLUCZA właściciela.

**PWA:** instalowalna apka + powiadomienia push (VAPID, `/api/push/*`, cron `morning-brief`). Wymaga env VAPID w Vercel.

**Wygląd:** ciemny motyw z jaśniejszymi kartami, sidebar w stylu ASARI (kolorowe kafle, sekcje), toasty, animacje wejścia, szkielet ładowania.

**SQL do uruchomienia w Supabase (kolejno, idempotentne):** v1 ✅, v2, v3, v4, v5 (nieruchomości/prowizje), v6 (scenariusze obiekcje), v7 (push), v8 (faktury), v9 (telefony), v10 (trudność sesji), v11 (scenariusze archiwalne), v12 (doradca kredytowy), **v13 (role CEO/Menedżer/Agent - `profiles.manager_id`, `invitations.manager_id/full_name`), v14 (tygodniowe limity AI - `profiles.weekly_ai_limit`), v15 (karta transakcji - `deals.transaction_card jsonb`), v16 (RLS - izolacja biur, backstop; service_role i tak omija).** Pliki `lib/SETUP-v*.sql`. Potwierdź z userem, które odpalone.

**Wizualny lifting (w toku):** `components/kit.tsx` = design kit z akcentem koloru (Button, SegmentedToggle - moduły różnią się kolorami). `globals.css`: poświaty gradientowe tła (`.app-shell`), globalny `focus-visible`, `.text-gradient` (nagłówki), `.card-glow`, ciemne dymki Leafleta. Nieruchomości: mapa na ciemnych kafelkach (CARTO dark) + kolorowe pinezki z ceną (`properties-map.tsx`), karty ofert z gradientem/ikoną typu/opiekunem/hover-glow. **Do zrobienia dalej:** rozlać design kit na pozostałe moduły (46 miejsc z własnym przyciskiem), więcej aria-label.

**Karta transakcji (v15):** wejście w transakcję na `/app/prowizje/[id]` - 5 etapów (weryfikacja prawna/podatkowa, profil kupującego, organizacja: kredyt/gotówka, umowa końcowa/PCC, po akcie) + checklista dokumentów (13 pozycji + własne), notatki, pasek postępu, **autozapis**. Model w `lib/transaction-card.ts` (`mergeCard` odporny na dodane pola), akcja `updateTransactionCard`. Karta wzorowana na realnym PDF Spectry.

**Limity AI (v14):** CEO ustawia w Zespół → „Role i przypisania" tygodniowy limit rozmów AI Coach per osoba (puste=bez limitu, 0=blokada). Egzekwowane w `startSession` (liczba sesji od poniedziałku). **Alerty/trendy:** `getTeamInsights` - karta „⚠️ Wymaga uwagi" (nie dzwoni 3+ dni / wynik AI spadł / nie trenuje), strzałki trendu przy wyniku, słupki aktywności zespołu (4 tyg.) na `/app/zespol`.

**Role (v13):** wartości `profiles.role`: `owner`=CEO (pełny dostęp; wartość nietknięta - cała autoryzacja o nią oparta), `manager`=Menedżer (widzi TYLKO swoich agentów: Cele/lejek + wyniki AI, BEZ prowizji, tylko podgląd), `agent`. CEO nadaje role i przypisuje agentów do menedżera (`/app/zespol` → „Role i przypisania"). Zaproszenia niosą rolę+manager_id → można zaprosić 2. CEO (Krystian) zanim się zarejestruje. Helper `requireManagerOrOwner`, etykiety `ROLE_LABELS` w `lib/types.ts`. Zmiana własnego maila logowania: `/app/ustawienia` → „Zmień email".

**GOTOWE:** „Oferta współpracy" (`/app/oferta-wspolpracy`) - generator nadrukowujący pola na 6-str. PDF z Canvy, generacja client-side (`lib/oferta-pdf.ts`, pdf-lib `subset:false`), formularz z domyślnymi z profilu + opcjonalny mikrofon (`/api/oferta-wspolpracy/parse`), wpis w sidebarze. Zweryfikowane renderem. **Zostało tylko:** automatyczna wysyłka mailem do klienta - czeka na weryfikację domeny Resend (na razie agent pobiera PDF i wysyła sam).

**Konfiguracja usera do zrobienia:** weryfikacja domeny agentspace.pl w Resend (DNS Hostinger) → automatyczne maile; env VAPID w Vercel → push. Do czasu: linki/pliki kopiuje/wysyła się ręcznie.

---


## 1. Kim jest owner i cel

**Wiktor Szostek** - właściciel biura nieruchomości **Spectra** w Krakowie (ul. Zbożowa 2/1, 30-002 Kraków, NIP 6772516327, REGON 529666353). Początkujący w kodowaniu - tłumaczyć prosto po polsku, bez żargonu. Chce **autonomii** ("rób sam bez pytania, commituj po drodze"). GitHub: `wiktoramsweb-boop`. Email do powiadomień: `wiktor.amsweb@gmail.com` (patrz sekcja Resend).

**Produkt AgentSpace** = SaaS dla biur nieruchomości w PL. Flagowe: **AI Coach** (trening rozmów z AI klientem). Plus pełna platforma codziennej pracy agenta + analityka dla właściciela. Cena docelowa 299 zł/mc/biuro do 10 agentów. Spectra = klient zero. Domena **agentspace.pl** (Hostinger DNS → Vercel).

## 2. Historia (jak doszliśmy tu)

1. **Research** (pliki w `~/spectra-research/` 01-07): rynek USA vs PL, TOP pomysły, wybór - platforma dla biur RE z AI Coachem (nie CRM jak Asari, tylko warstwa AI+produktywność).
2. **Landing + marketing** - pełna strona z blogiem, SEO, premium motion. Live.
3. **MVP aplikacji** - auth, AI Coach (5 scenariuszy), scoring, dashboardy. Live, przetestowane.
4. **Platforma codzienna** - Klienci (CRM), Prowizje, Zadania, Pulpit, AI Asystent Dnia, panel właściciela, raport miesięczny.
5. **Rozbudowa AI Coach** - 3 kategorie (Cold Calling/Spotkania/Najem), 13+ scenariuszy, 9 osobowości, jaśniejszy motyw.
6. **Zakładka Cele** - lejek sprzedażowy roczny→dzienny, dzienny tracker z animacją, plan tygodnia, historia.
7. **Głos w AI Coach** - darmowe rozpoznawanie mowy PL (Web Speech API), agent mówi zamiast pisać.
8. **Łatwi klienci** - osobowość "Życzliwy" + 3 easy scenariusze dla początkujących.
9. **Gamifikacja + AI pisze za agenta + Onboarding** (A+B+E) - ostatnia sesja.

## 3. Stack i architektura

- **Next.js 16** (App Router, Turbopack) + **TypeScript** + **Tailwind 4** + **motion** (framer-motion).
- **Supabase** - Postgres + Auth (`@supabase/ssr`). URL: `puowqbebsbmrcvoivkxb.supabase.co`, region Frankfurt.
- **Anthropic Claude API** - AI Coach, scoring, asystent, pisanie. Model konfig. `ANTHROPIC_MODEL` (domyślnie `claude-sonnet-4-5-20250929`). Prompt caching w roleplay, tool use w scoringu/asystencie.
- **Resend** - emaile (waitlist, zaproszenia, raport). Bez zweryfikowanej domeny wysyła TYLKO do `wiktor.amsweb@gmail.com` (konto Resend ownera). Żeby wysyłać do dowolnych - zweryfikować domenę agentspace.pl w Resend + zmienić `RESEND_FROM` na `noreply@agentspace.pl`.
- **Vercel** - hosting, auto-deploy z `main`. Vercel Analytics + Speed Insights. Cron raportu (vercel.json).
- **Wzorzec dostępu do danych:** WSZYSTKO server-side przez service_role (`lib/supabase/admin.ts` → `createSupabaseAdmin`). Autoryzacja w kodzie (`lib/auth.ts`: `requireUser`/`requireOwner`, oba `cache`). RLS włączone jako backstop (bez policies dla anon). Publiczne wartości Supabase mają defaulty w `lib/supabase/config.ts` (URL+anon key są jawne).

## 4. Mapa aplikacji (/app - chronione middleware)

- `/app` - **Pulpit**: onboarding checklist, gamifikacja (poziom/passa/odznaki), statystyki, cel, AI Asystent Dnia, plan dnia (zadania), klienci do kontaktu, wyzwanie tygodnia, ostatnie treningi, snapshot zespołu (owner).
- `/app/cele` - **Cele**: setup celu finansowego, lejek (cold call→spotkanie→umowa→kupujący→sprzedaż) roczny/mc/tydz/dzień/godz, dzienny tracker z animowanym ringiem + świętowanie, plan tygodnia (grid), historia 6 tyg.
- `/app/trening` - **AI Coach**: 3 kategorie, instrukcja 1-2-3, karty scenariuszy. `/app/trening/[slug]` - kroki 1(zadanie)/2(typ klienta)/3(start).
- `/app/sesja/[id]` - chat na żywo (streaming, **mikrofon/głos**) LUB wyniki (scoring 4 kategorie + feedback + przycisk "Oceń tę rozmowę").
- `/app/klienci` - CRM lista + `/app/klienci/[id]` karta (status pipeline, notatki, **AI: follow-up + obiekcje**).
- `/app/prowizje` - deals + cel miesięczny + pipeline.
- `/app/historia` - historia sesji.
- `/app/zespol` (owner) - ranking, prowizje per agent, mocne/słabe obszary, zaproszenia, raport email, `/app/zespol/[agentId]` drill-down.
- `/app/ustawienia` - profil, cel prowizji.
- Auth: `/login`, `/signup` (owner zakłada biuro), `/zaproszenie/[token]` (agent dołącza).

## 5. Kluczowe pliki (gdzie co jest)

- Auth: `app/auth/actions.ts`, `lib/auth.ts`, `lib/supabase/{server,client,admin,middleware,config}.ts`, `middleware.ts`
- AI: `lib/ai/{client,coach,assistant}.ts`, `/api/coach/message`, `/api/assistant/{daily,write}`
- Dane: `lib/data.ts` (sesje/scoring/zespół), `lib/data-platform.ts` (zadania/klienci/deals/cele/onboarding), `lib/funnel.ts` (lejek), `lib/gamification.ts` (XP/poziomy/odznaki/passa/wyzwanie), `lib/format.ts`, `lib/types.ts`
- Głos: `lib/use-speech-recognition.ts`
- Raport: `lib/report.ts`, `/api/cron/monthly-report`

## 6. SQL do uruchomienia w Supabase (WAŻNE)

Pliki w `lib/`, uruchamiać w SQL Editor po kolei. Status na teraz - **user uruchomił v1**, reszta prawdopodobnie do uruchomienia (potwierdzić z userem):
1. `SETUP-uruchom-w-supabase.sql` (v1) - agencies, profiles, invitations, scenarios(5), training_sessions, session_scores. ✅ URUCHOMIONE.
2. `SETUP-v2-platforma.sql` - tasks, clients, client_notes, deals.
3. `SETUP-v3-scenariusze-cele.sql` - +kolumna scenarios.category, goals, daily_logs, rekategoryzacja + 8 scenariuszy.
4. `SETUP-v4-latwe-scenariusze.sql` - 3 łatwe scenariusze.
5. **`SETUP-v5-nieruchomosci-prowizje.sql` - NOWE (do uruchomienia).** Tabele `properties` + `property_interests`; kolumny adres/mapa (`city,address,lat,lng`) i `next_contact_at` na `clients`; kolumny kalkulatora prowizji na `deals` (`property_id, transaction_value_pln, commission_seller/buyer/landlord/tenant_pln, extras_pln, extras_note, agent_split_pct, agent_earnings_pln`); `default_split_pct` na `profiles`; backfill `agent_earnings_pln = commission_pln` dla starych transakcji.

Kod jest ODPORNY na brak tabel (puste dane, nie crashuje) - ale funkcje nie działają bez tabel.

## 7. Zmienne środowiskowe (Vercel + .env.local)

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (sekret) - w Vercel ✅
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` - mają defaulty w config.ts (nie trzeba w Vercel)
- `ANTHROPIC_API_KEY` - w Vercel ✅ (portfel API osobny od claude.ai, owner doładował ~$5)
- `RESEND_API_KEY`, `RESEND_FROM`, `NOTIFICATION_EMAIL=wiktor.amsweb@gmail.com` - w Vercel ✅
- `IP_HASH_SALT` - w Vercel ✅
- Opcjonalnie: `NEXT_PUBLIC_APP_URL`, `ANTHROPIC_MODEL`, `CRON_SECRET`

## 8. WAŻNE rozróżnienie Anthropic (owner się mylił)

**claude.ai** (subskrypcja €22/mc + €85 kredytów) = czat/Claude Code (nasze kodowanie). **console.anthropic.com** = API (portfel osobny, ~$5, zasila AI Coach w aplikacji). Nasze kodowanie NIE zjada portfela API. Realna rozmowa AI w aplikacji ≈ $0.02-0.06.

## 9. Bezpieczeństwo - DO ZROBIENIA

Klucze Supabase (`sb_secret_...`) i Resend były wklejane w czacie. **Po testach zrotować**: Supabase → Settings → API → Reset service_role; podmienić w Vercel + `.env.local`.

## 10. Następne kroki (omówione, NIE zbudowane)

- ~~**Wersja mobilna (PWA)** + **powiadomienia**~~ - zrobione, patrz sekcja 10d.
- **Moduł Nieruchomości** (oferty + zdjęcia via Supabase Storage) + publiczne oferty na stronie. Wykonalne.
- **OtoDom/portale eksport** - NIE problem kodu, tylko dostępu: OtoDom (Grupa OLX) nie ma otwartego API, wymaga konta Pro dla biur + umowy partnerskiej (fosa Asari). Etap 2 gdy będą płacący klienci. Do wyjaśnienia: co to "agencja5000" (owner wspomniał).
- **AI Coach - głos AI** (żeby klient odpowiadał głosem: ElevenLabs + koszty). Na razie tylko wejście głosem agenta.
- **Płatności** (Stripe/Tpay), **Google Calendar**.

## 10b. Strony internetowe dla biur (wrzesień 2026)

Osobny produkt sprzedawany razem z CRM, konkurencja: ASARI (WordPress + wtyczka).

- **Galeria wzorów:** `/wzory` (marketing) + osiem pełnych wzorów pod `/wzory/[wzor]`:
  kamienica, nokturn, siatka, przystan, strategia, beton, ogrod, horyzont.
  Każdy ma: stronę główną, oferty z filtrami i mapą, kartę oferty, sprzedaż, najem,
  o nas, poradnik z wpisami, kalkulator raty, ulubione, zespół, kontakt i dwa formularze.
- **Kod:** `lib/wzory/*` (dane demo, motywy, fonty), `app/wzory/motywy/*.css` (osiem motywów
  sterowanych zmiennymi `--d-*`), `app/components/wzory/*` (wspólne komponenty).
- **Strona klienta:** `/strona/[slug]` renderuje wybrany motyw z danymi z CRM: oferty z
  `properties.export_to_web`, zespół z `profiles` (`show_on_site`, `site_order`),
  wpisy z `site_posts`, teksty z `site_config`.
- **Panel dla klienta:** `/app/ustawienia/strona` (wygląd, marka, adres, kontakt),
  `/tresci`, `/zespol`, `/wpisy`.
- **Formularze** tworzą w CRM kontakt i zadanie dla agenta (`app/strona/actions.ts`),
  surowe zgłoszenie zostaje w `site_leads`.
- **Migracja:** `lib/SETUP-v25-strona-www.sql` (site_config, site_posts, site_leads,
  show_on_site, site_order).
- **Dodatek płatny osobno:** `agencies.site_addon`. Bez niego panel pokazuje ofertę
  (`AddonOffer`) i przycisk zgłoszenia, a `/strona/[slug]` zwraca 404. Ceny w
  `lib/site/addon.ts` (199 zł/mc, 1990 zł/rok, 990 zł wdrożenia) i stamtąd lecą do
  panelu, cennika i na `/wzory`.
- **Własne domeny:** `site_config.domain` + `middleware.ts` (rewrite po domenie,
  cache 5 min w `lib/site/domains.ts`). Z `VERCEL_TOKEN` i `VERCEL_PROJECT_ID`
  domena dopina się do projektu sama, bez nich zostaje instrukcja DNS w panelu.
- **SEO:** `app/strona/[slug]/sitemap.ts`, dane strukturalne biura (layout) i oferty
  (karta oferty).
- **Statystyki:** `site_views` + RPC `bump_site_view`, licznik bez cookies i bez IP,
  widok w `/app/ustawienia/strona/statystyki`. Baner cookies w `site-bits.tsx`.
- **Migracje:** v25 (strona) i v26 (dodatek, statystyki, domeny).
- **Do zrobienia:** obrazy OG per oferta, integracja płatności dodatku.

## 10c. Strona marketingowa (wrzesień 2026)

- **Dwa motywy:** przełącznik w nawigacji (`app/components/mk/theme-switch.tsx`).
  Domyślny motyw bierze się z `prefers-color-scheme` czystym CSS-em, wybór
  zapisuje się w `localStorage` pod `as_mk_theme`. Żadnego skryptu przed
  renderem, więc nie ma ostrzeżeń o hydratacji.
- **Tokeny:** wszystkie powierzchnie i linie marketingu siedzą w zmiennych
  `--mk-*` i `--color-mk-*` w `app/globals.css` (bloki: `:root`,
  `@media (prefers-color-scheme: light)`, `html[data-mk="light"]`,
  `html[data-mk="dark"]`). Nowe komponenty MUSZĄ używać tych zmiennych,
  a nie `text-white` czy `bg-zinc-900`.
- **Ruch:** `app/components/mk/motion-bits.tsx` (liczniki, odsłanianie słów,
  karty z poświatą, przyklejone kroki, smugi, zdjęcia reagujące na kursor)
  i `app/components/mk/showcase.tsx` (okno przeglądarki, kafle, marquee).
- **Makiety produktu:** `app/components/mockups/light-shots.tsx` (jasne,
  zgodne z obecnym wyglądem aplikacji).
- **Uwaga:** `.mk` jest wymagane na kontenerze strony, inaczej nagłówki nie
  dostają skali marketingowej (h1 ma wtedy 16 px).

## 10d. PWA i powiadomienia (wrzesień 2026)

**Działa bez zasięgu.** `public/sw.js`: precache ekranu `/offline` i ikon,
network-first dla wejść na stronę z własnym ekranem zamiast błędu przeglądarki,
cache-first dla plików z hashem (`/_next/static`, zdjęcia, fonty). `/api/*`
i `/auth/*` **nigdy** nie idą do cache'u - to dane zalogowanego człowieka,
a z jednego telefonu korzysta czasem więcej niż jedna osoba. Ekran offline:
`app/offline/page.tsx`, sam wraca do apki po powrocie sieci (zdarzenie `online`).

**Push przy zgłoszeniu ze strony biura.** `app/strona/actions.ts` po utworzeniu
kontaktu i zadania budzi opiekuna, a gdy go nie ma, całe biuro
(`sendPushToAgency` w `lib/push.ts`). Wcześniej powstawało tylko zadanie
z terminem za dwie godziny i nikt się o nim nie dowiadywał. Push jest w try/catch:
klient ma zobaczyć „dziękujemy" nawet gdy powiadomienie padnie.

**Przypomnienia o zadaniach.** `app/api/cron/task-reminders/route.ts`: bierze
zaplanowane działania z terminem w oknie od minus 6 godzin do plus godzina,
grupuje po agencie (trzy zadania = jedno powiadomienie) i oznacza kolumną
`reminded_at`, żeby nie dzwonić w kółko o tym samym. Zmiana terminu kasuje
znacznik (trigger w migracji). **Wymaga `lib/SETUP-v27-przypomnienia.sql`.**

**⚠️ Harmonogram do decyzji właściciela.** Endpointu `task-reminders` celowo
NIE ma w `vercel.json`. Plan Hobby dopuszcza dwa zadania cron uruchamiane raz
dziennie, a te dwa są już zajęte (raport miesięczny, poranna odprawa).
Przypomnienia mają sens tylko co godzinę. Dwie drogi:
- Vercel Pro: dopisać do `vercel.json` wpis
  `{ "path": "/api/cron/task-reminders", "schedule": "0 7-19 * * *" }`.
- Zostając na Hobby: darmowy zewnętrzny scheduler (np. cron-job.org) pukający
  co godzinę pod `https://agentspace.pl/api/cron/task-reminders`
  z nagłówkiem `Authorization: Bearer <CRON_SECRET>`.

**Manifest.** `app/manifest.ts`: kolory poprawione na jasne (`#f1f4f9`), bo
aplikacja ma jasny interfejs, a w manifeście zostało czarne tło z pierwszej
wersji i pasek tytułu na Androidzie był czarny nad jasnym ekranem. Doszły
skróty pod przytrzymanie ikony: Klienci, Zadania, Nieruchomości.

**Env wymagane, żeby push w ogóle wyszedł:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` w Vercel (lokalnie w `.env.local` są).
Bez nich `sendPushToAgent` po cichu zwraca 0 i nic się nie dzieje.


## 10e. Analiza cenowa, czyli wyceniarka (wrzesień 2026)

Odpowiednik „wyceniarki" z Propertly. Ekran: `/app/wycena`.

**Dlaczego porównania, a nie uczenie maszynowe.** Agent musi obronić kwotę
przed klientem, który zapyta „skąd to". Model uczony daje liczbę bez
uzasadnienia. Liczymy więc tak, jak liczy rzeczoznawca: bierzemy podobne
transakcje, korygujemy o różnice i pokazujemy korekty. Model statystyczny
ma sens przy kilku tysiącach własnych transakcji, nie wcześniej.

**Silnik:** `lib/wycena/model.ts`. Pracuje na cenie za metr. Korekty: metraż,
stan wykończenia, rynek pierwotny/wtórny, piętro (parter i ostatnie bez windy),
rok budowy. Wagi: odległość, świeżość transakcji, rodzaj źródła (cena ofertowa
waży połowę tego co transakcyjna). Wynik to **mediana ważona po odcięciu
wartości odstających** (próg 3×MAD, a przy rynku jednorodnym ±8% od mediany).

⚠️ Pierwsza wersja używała średniej ważonej i jedna transakcja za podwójną cenę
przesuwała wynik o 7%. Przy mieszkaniu za 900 tys. to 60 tys. zł błędu. Jeśli
kiedyś będziesz tu majstrować, **nie wracaj do średniej.**

⚠️ **Druga poprawka, ważniejsza.** Pierwsza wersja liczyła wyłącznie z bazy
biura. Przy dziewięciu ofertach rozrzuconych po Krakowie wycena mieszkania na
Starym Mieście wyszła 605 tys., bo oparła się na Nowej Hucie i os. Stalowym
z odległości 7-9 km. To był błąd w założeniu: **pojedyncze biuro nigdy nie ma
takiej gęstości transakcji, żeby pokryć dzielnice miasta.** Dane rynkowe są
podstawą, własna baza jest dodatkiem.

**Trzy metody, w tej kolejności:**
1. `porownania` - transakcje w promieniu do 2,5 km. To jest właściwa metoda.
2. `wskaznik` - średnia cena transakcyjna dla miasta (`market_price_levels`),
   gdy w okolicy nic nie ma. Interfejs mówi wprost, że to rząd wielkości.
3. `brak` - nie ma ani jednego, ani drugiego, więc **odmawiamy podania liczby**
   zamiast podawać złą. Przycisk prowadzi do `/app/wycena/dane`.

Wyszukiwanie porównań idzie stopniami (1 km, 2,5 km, 5 km, 12 km, całe miasto)
i zatrzymuje się na pierwszym, który da minimum trzy porównania. Powyżej 2,5 km
wolimy wskaźnik od porównań z drugiego końca miasta.

**Dane rynkowe:** `/app/wycena/dane` (tylko właściciel). Trzy drogi:
GUS jednym kliknięciem (`lib/wycena/import-gus.ts`, szuka zmiennych po nazwie,
bo identyfikatory w BDL się zmieniają), wgranie CSV z RCN, ręczny wpis
(np. z raportu NBP). Import RCN należy do biura, dane publiczne mają puste
`agency_id` i widzą je wszyscy.

**Skąd dane porównawcze:** `lib/wycena/data.ts`, trzy źródła:
1. własne transakcje biura (`deals` zamknięte + `properties`), najcenniejsze,
2. `market_transactions`, czyli dane z RCN, wspólne dla wszystkich biur,
3. aktualne oferty biura jako ceny ofertowe, z mniejszą wagą.

**Biuro widzi wyłącznie własne transakcje.** Dane jednego biura nigdy nie
trafiają do wyceny drugiego, bo tak stanowi umowa powierzenia. Wspólny jest
tylko RCN, bo to dane publiczne. Przy zmianach w `comparablePool` pilnuj tego.

**Import RCN:** `lib/wycena/import-rcn.ts`. RCN nie ma jednego ogólnopolskiego
API, każde starostwo udostępnia dane inaczej. Importer bierze CSV, rozpoznaje
typowe nazwy kolumn (z polskimi znakami i bez), przelicza formaty dat i liczb,
odrzuca wiersze z ceną za metr poza zakresem 500-80 000 zł (zwykle udział
w nieruchomości albo cena za cały budynek). Powtórny import tego samego pliku
aktualizuje, a nie dubluje (klucz `source` + `source_ref`).

**Wymaga migracji `lib/SETUP-v28-wycena.sql` oraz `lib/SETUP-v29-wycena-dane-rynkowe.sql`.** Bez niej wycena nadal działa,
tylko na samych danych biura.

**Testy:** `npm run test:wycena`. Dziewięć przypadków: rynek jednorodny, korekta
za stan, odporność na wartość odstającą, brak wyniku przy zbyt małej próbce,
ważenie cen ofertowych, odrzucanie transakcji starych i odległych. To jedyny
moduł z testami, bo na jego podstawie agent podaje klientowi kwotę.

**Prawne:** w interfejsie stoi notka, że to analiza porównawcza, a **nie operat
szacunkowy**. Operaty sporządzają wyłącznie rzeczoznawcy majątkowi i tego
nazewnictwa nie wolno zmieniać.

**Adres:** pole z podpowiadaniem (`AddressInput`, ten sam komponent co przy
kliencie i ofercie) ustawia miasto i współrzędne. Gdy agent wpisze adres
z ręki i nie kliknie podpowiedzi, akcja dogeokodowuje go po stronie serwera
przez `lib/geocode.ts` - inaczej zostawalibyśmy bez lokalizacji i bez wyniku.
Ze współrzędnymi porównujemy w promieniu 2,5 km, bez nich w obrębie miasta,
i wynik mówi wprost, który wariant zadziałał.

**Czego jeszcze nie ma:** raportu PDF dla klienta, wskaźnika trendu cen
w czasie.

## 10f. Konto demo (wrzesień 2026)

Pusty system nie sprzedaje się na spotkaniu. Konto demo ma pokazywać
pracujące biuro: zespół, kalendarz, cele, prowizje i analizę cenową, która
faktycznie liczy.

**Ekran:** `/app/ustawienia/demo` (właściciel). Dwa kroki:
1. „Załóż zespół" - tworzy konta pięciu agentów. Konieczne, bo `profiles.id`
   ma klucz obcy do `auth.users`, a bez profili nie ma rankingu ani prowizji
   per osoba. Hasła są losowe i nigdzie nie zapisywane: na pokazie logujesz
   się jako właściciel.
2. „Wypełnij dane" - klienci, oferty ze zdjęciami, transakcje, cele,
   dziennik wyników i kalendarz.

⚠️ **Dwie pułapki, na które już wpadliśmy:**
1. Nazwiska zespołu MUSZĄ być zmyślone. Pierwsza wersja miała tu prawdziwych
   pracowników Spectry, co na pokazie u obcego klienta wygląda fatalnie.
2. Działania dostają WSZYSCY, razem z właścicielem. Kalendarz, cele i pulpit
   pokazują domyślnie dane zalogowanej osoby, a nie całego biura. Gdy
   właściciel nie miał własnych działań, prowadzący pokaz widział pusty
   kalendarz i „brak wykonanych telefonów", mimo pełnej bazy.

**Dane liczone są od dzisiaj**, nie od sztywnej daty: 30 dni wykonanych
telefonów i spotkań wstecz, 21 dni zaplanowanych spotkań w przód, dziennik
wyników z sześciu tygodni. Ziarno losowania pochodzi z dzisiejszej daty, więc
w obrębie jednego dnia odświeżenie nie przetasuje całego biura.

**Odświeżanie jest automatyczne.** `odswiezDemoJesliTrzeba` w layoucie
`/app` przelicza dane przy wejściu, gdy minęło ponad 12 godzin. Dzięki temu
pokaz za dwa miesiące wygląda tak samo jak dziś, bez pamiętania o skrypcie.
Dotyczy wyłącznie biur z `agencies.is_demo`.

**Zabezpieczenia:** każda operacja odmawia działania, gdy biuro nie jest
oznaczone jako demo i ma więcej niż pięć prawdziwych ofert. To skrypt, który
kasuje klientów i transakcje, więc lepiej jedno sprawdzenie za dużo.

**Pliki:** `lib/demo/dane.ts` (generatory, bez zapisu), `lib/demo/zasiew.ts`
(zapis i odświeżanie, używane też przez serwer), `lib/demo/dzielnice.ts`
(dwanaście dzielnic Krakowa z realnymi współrzędnymi i proporcjami cen).
**Wymaga migracji `lib/SETUP-v30-konto-demo.sql`.**

⚠️ Nie próbuj uruchamiać tego jako skryptu Node przez `--experimental-strip-types`.
Turbopack nie przyjmuje jawnych rozszerzeń `.ts` w importach, a Node bez nich
nie rozwiąże modułu. Dlatego całość siedzi w aplikacji, a nie w `package.json`.

## 10g. Kontrast i nagłówki ekranów (wrzesień 2026)

**Czytelność w obu motywach.** Ciemny motyw to warstwa nadpisań nad jasnym
(sekcja „CIEMNY MOTYW APLIKACJI" w `globals.css`). Pierwsza wersja pokrywała
tylko część odcieni: audyt pokazał **249 klas kolorów używanych w aplikacji
bez odpowiednika**. Objaw: tło tinta (np. `.bg-emerald-50`) ciemniało, a tekst
pisany odcieniem 800 czy 900 zostawał ciemny i komunikat znikał.

Dopisane zostały odcienie 300-950 dla piętnastu rodzin kolorów, rodzina
`zinc` (używana zamiennie ze `slate`) oraz jasne tła i obramowania.

**Weryfikacja liczbowa, nie na oko:** skrypt w przeglądarce składa pary
tło + tekst, uwzględnia przezroczystość przez blendowanie na canvasie i liczy
współczynnik WCAG. Wynik: **273 kombinacje, zero poniżej 4,5:1 w obu motywach.**
Przy zmianach kolorów warto ten pomiar powtórzyć, bo oko myli się przy
półprzezroczystych tintach.

Poprawione przy okazji w jasnym motywie: `emerald-600` (3,7:1), `sky-600` (4,0),
`amber-600` (3,1), `cyan-600` (3,3), `rose-600` (4,1), `red-600` (4,4),
`blue-600` na `blue-100` (4,3) oraz szarości `slate-400/500`.

**Nagłówki ekranów.** `PageHeader` pisał tytuł gradientem granat-morze
(`.text-gradient`), przez co litery zmieniały kolor w połowie wyrazu. Teraz
tytuł jest jednolity, pod spodem biegnie kreska z krótkim akcentem, a nowy
opcjonalny `eyebrow` daje miejsce na nazwę sekcji.

Podgląd obu motywów: `/podglad-motywu` (tylko tryb deweloperski).

## 10h. Pola oferty zależne od typu nieruchomości (wrzesień 2026)

**Problem.** Kreator oferty pokazywał praktycznie ten sam zestaw pól dla
mieszkania, domu i działki. W praktyce to zupełnie różne nieruchomości:
działkę opisują warunki zabudowy i media w granicy, dom - dach, materiał ścian
i kondygnacje, halę - wysokość w świetle, nośność posadzki i liczba doków,
a pokój - współlokatorzy i zasady najmu. Bez tego agent i tak dopisywał wszystko
w polu Opis, czyli w miejscu, którego nie da się filtrować ani wyeksportować.

**Rozwiązanie: słownik pól, nie kod formularza.** Całość siedzi w
`lib/property-fields.ts`. Dla każdego z 10 typów jest lista sekcji, a w sekcji
lista pól: klucz, etykieta, rodzaj (liczba, tekst, data, wybór, wielokrotny
wybór, przełącznik), lista opcji, jednostka i podpowiedź. Pole może być
oznaczone `only: "wynajem"` albo `only: "sprzedaz"` - wtedy pokazuje się tylko
przy tym rodzaju transakcji. Sekcje powtarzalne (media, koszty, warunki najmu,
stan prawny, świadectwo energetyczne, otoczenie, bezpieczeństwo, parking) są
funkcjami, więc typ bierze je jedną linią i może dorzucić własne pola.

Skala: **1425 pól** łącznie, od 40 dla pokoju do 93 dla domu.

**Gdzie to trafia w bazie.** Jedna kolumna `details jsonb` (migracja
`lib/SETUP-v31-pola-typow.sql`) plus indeks GIN, żeby dało się po tym filtrować.
Świadomie NIE robimy stu kolumn: dodanie pola albo pozycji w liście wyboru to
dziś jedna linia w słowniku i zero migracji. Pola, które już mają swoje kolumny
z v17 (cena, metraż, pokoje, piętro, rok budowy, czynsz, kaucja, rynek, forma
własności, ogrzewanie, stan), są w słowniku oznaczone `column: true` i lecą tam
gdzie dotąd - dzięki temu wyceniarka i listy nic nie tracą.

**Wartością pola wyboru jest jego etykieta**, nie osobny slug. To celowe: te
dane wyświetlamy dosłownie i nigdy nie porównujemy w kodzie, więc druga warstwa
tłumaczenia tylko by przeszkadzała, a Wiktor może dopisać pozycję do listy sam.
Gdy dojdzie eksport na portale, mapowanie na ich słowniki zrobimy osobnym plikiem.

**Bezpieczeństwo zapisu.** `detailsFromForm` w `app/app/nieruchomosci/actions.ts`
przyjmuje wyłącznie klucze, które słownik przewiduje dla wybranego typu i rodzaju
transakcji - przeglądarka nie dorzuci własnych. Zapis `details` idzie osobnym,
opcjonalnym zapytaniem (tak samo jak świadectwo energetyczne z v23), więc brak
migracji nie blokuje zapisania oferty.

**W interfejsie.** `app/app/nieruchomosci/param-fields.tsx` rysuje krok
„Parametry" ze słownika, sekcja po sekcji, zwijane elementem `<details>`.
Zwijamy, a nie odmontowujemy - zwinięta sekcja zostaje w DOM, więc jej pola
normalnie idą w zapisie. Sekcja pokazuje licznik uzupełnionych pól i otwiera się
sama, gdy coś w niej jest. Na karcie oferty te same sekcje wyświetla
`app/app/nieruchomosci/[id]/details-card.tsx` przez `describeDetails`, więc
kreator i podgląd nie mają jak się rozjechać.

**Kontrola: `npm run test:pola`** (`lib/sprawdz-pola.ts`). Sprawdza powtórzony
klucz w jednym typie (dwa inputy o tej samej nazwie to cicha utrata danych),
pole wyboru bez opcji, powtórzoną opcję, klucz spoza `[a-z0-9_]` i kolizję nazwy
z kolumną bazy. Przy pierwszym uruchomieniu znalazł 10 realnych duplikatów
(`droga_dojazdowa`, `vat`, `media_moc_kw`, `media_sila`) - uruchamiaj po każdej
zmianie w słowniku.

**Nagłówki sekcji: ikona w kafelku, podgląd zawartości.** Każda sekcja ma w
słowniku pole `icon` (24 ikony, `app/app/nieruchomosci/section-icon.tsx`), kolor
kafelka niesie znaczenie: pieniądze zielone, prawo fioletowe, technika
bursztynowa, bezpieczeństwo różowe. Zwinięta sekcja pokazuje pierwsze pięć nazw
pól, otwarta ile pól ma w środku. Świadomie SVG, nie emoji: emoji renderują się
inaczej na każdym systemie.

**Pułapka ciemnego motywu, zapamiętaj to.** Warstwa ciemnego motywu nadpisuje
klasy po nazwie (`.bg-slate-50`, `.hover\:bg-slate-50`). Wariant zapisany
inaczej, np. `group-open:bg-slate-50` albo `open:border-slate-300`, kompiluje
się do **innego selektora i nie łapie się w tej warstwie**. Tak właśnie otwarty
nagłówek sekcji dostał w ciemnym motywie prawie białe tło pod białym tekstem.
Dodając nową klasę koloru z wariantem, którego jeszcze nie ma w `globals.css`,
dopisz jej nadpisanie w sekcji ciemnego motywu.

**I druga pułapka, tym razem w mierzeniu.** Tailwind podaje swoje kolory jako
`lab()` / `oklch()`. Ani zwykły `match(/\d+/g)`, ani `canvas.fillStyle` ich nie
czytają, więc audyt kontrastu potrafi pokazać 1,0:1 tam, gdzie naprawdę jest
17:1. Zanim uwierzysz w zły wynik, wypisz surowe `getComputedStyle(...).color`:
jeśli widzisz `lab(...)`, to błąd pomiaru, nie interfejsu.

**Tytuły ekranów: ikona modułu i jego kolor.** `PageHeader` jest teraz
komponentem klienckim (`app/app/components/page-header.tsx`): czyta adres przez
`usePathname()` i dobiera ikonę, etykietę i kolor z `nav-meta.tsx`. To ta sama
lista, z której rysuje się menu boczne, więc Kalendarz ma w menu i w nagłówku
tę samą ikonę i ten sam błękit, a nowy moduł dostaje jedno i drugie bez
dopisywania czegokolwiek na jego ekranie. Adres dopasowujemy dokładnie albo
jako podstronę (`/app/klienci/123`), nie samym `startsWith`. Ekrany spoza menu
dostają szary kafelek zastępczy.

**Systemowe domknięcie pułapki wariantów: `npm run test:warianty`**
(`lib/sprawdz-warianty.mjs`). Przegląd całego kodu znalazł 84 klasy koloru
z wariantem bez nadpisania w ciemnym motywie. Groźne są z tego jasne,
nieprzezroczyste tła: to one zostają jasne, gdy tekst na nich robi się jasny.
Tak zniknął napis „Tylko ulica" na zaznaczonej opcji w kreatorze oferty
(`has-[:checked]:bg-emerald-50`). Dopisane 10 reguł, skrypt pilnuje reszty
i przy nowym takim przypadku kończy się błędem.

**Uwaga przy sprawdzaniu zmian w CSS.** Karta w przeglądarce potrafi trzymać
stary arkusz mimo przeładowania, bo Turbopack w trybie deweloperskim nadaje
plikom CSS stałe nazwy. Zanim uznasz regułę za niedziałającą, pobierz arkusz
prosto z serwera (`curl` na adres z `<link>`) i sprawdź, czy w ogóle się
skompilowała. Na tym straciłem kilka podejść przy tej poprawce.

**Listy wyboru: własny komponent zamiast natywnego `<select>`.**
Rozwiniętą listę natywnego `<select>` rysuje system operacyjny, nie przeglądarka
- żaden CSS jej nie dosięgnie, więc na Macu wyglądała jak Mac, a na Windowsie
inaczej, zawsze obok reszty aplikacji. `app/app/components/select.tsx` rysuje ją
sam. Trzy rzeczy, które trzeba było w nim rozwiązać:

1. **Formularze.** Wartość oddaje ukryty `<input name=...>`, więc wszystkie
   `formData.get("status")` działają bez zmian.
2. **Przycinanie.** Lista leci przez portal do `<body>` i jest pozycjonowana na
   sztywno pod polem. Gdyby wisiała w drzewie, ucinałby ją każdy przewijany
   kontener, a kreator oferty jest właśnie takim kontenerem.
3. **Telefon.** Poniżej 640 px lista wjeżdża od dołu jak arkusz, bo kciukiem
   łatwiej trafić w szeroki wiersz.

Dochodzi szukanie przy listach od 10 pozycji (słowniki typu „Rodzaj budynku"
mają ich 20), obsługa klawiatury i znacznik przy wybranej pozycji.

**Komponent jest zamiennikiem natywnego `<select>`**, i to była decyzja, która
pozwoliła przerobić 61 list w 29 plikach jednym skryptem zamiast ręcznie:
przyjmuje te same `<option>` jako children, a `onChange` dostaje obiekt
w kształcie zdarzenia, więc `e.target.value` w istniejącym kodzie działa dalej.
Przy pisaniu skryptu trzeba było pamiętać, że koniec tagu to pierwszy `>` poza
nawiasami - inaczej `onChange={(e) => ...}` urywa tag na strzałce.

`tone="onDark"` jest dla pola na ciemnym pasku zaznaczania wielu pozycji.
Strona marketingowa i wzory stron dla biur (`app/components/wzory`) celowo
zostają na natywnym `<select>`: mają własny wygląd i nie są częścią aplikacji.

**Zakładki na karcie nieruchomości.** Wszystko leżało na jednej długiej stronie,
a karta transakcji mieszkała w Prowizjach - żeby do niej dojść, trzeba było wyjść
z oferty, odszukać transakcję na liście i dopiero w nią wejść. Teraz karta oferty
ma pasek zakładek: **Oferta · Poszukiwania · Działania · Dokumenty · Karta
transakcji**, każda z licznikiem pozycji. Zakładkę trzymamy w adresie (`?z=`),
a nie w stanie komponentu: dzięki temu da się wysłać komuś link prosto do
dokumentów, a strzałka wstecz wraca tam, gdzie agent był.

Karta transakcji przy ofercie to ten sam `TransactionCardEditor` co w Prowizjach,
nie kopia. Gdy oferta ma kilka transakcji, wybraną trzymamy w `?t=`. Strona
`/app/prowizje/[id]` zostaje, bo transakcja nie musi być powiązana z ofertą,
i obie strony linkują do siebie nawzajem.

**Kontrast: narzędzie zamiast kolejnej łatki.** `/podglad-motywu` ma przycisk
„Zmierz kontrast". Chodzi po każdym widocznym napisie, w obu motywach, liczy tło
przez złożenie przezroczystości wszystkich rodziców i porównuje z progiem WCAG.
Trzy rzeczy, bez których to nie działało:

1. **Przeliczanie `oklch()` i `lab()` wprost.** Tailwind podaje kolory w tych
   zapisach, a ani regex, ani `canvas.fillStyle` ich nie czytają. Wcześniejsze
   pomiary pokazywały 1,0:1 tam, gdzie naprawdę było 17:1, i goniłem błędy,
   których nie było.
2. **Wyłączenie animacji na czas pomiaru.** Inaczej mierzyliśmy kolory w połowie
   przejścia między motywami i wychodziło „biały tekst na białym".
3. **Pomijanie teł z gradientem.** Nie da się ich sprowadzić do jednego koloru,
   więc zamiast zgadywać, liczymy je osobno.

Komponenty, które złapały błąd, dopisujemy do `/podglad-motywu` - tak trafiły tam
oś czasu wątku rozmów i pasek zakładek.

**Co z tego wyszło i czego świadomie nie zmieniamy.** Po poprawkach zostaje
15 napisów poniżej 4,5:1 na motyw i są to prawie wyłącznie **białe napisy na
zielonych przyciskach marki (2,47:1)**. To jest decyzja do podjęcia, nie błąd do
cichego naprawienia: żeby biel przeszła, zielone tło musiałoby zejść mniej
więcej do `emerald-700`, czyli marka wyraźnie ciemnieje. Do czasu decyzji
zostawiamy jak jest.

**Słowniki zgodne z Otodom (październik 2026).** Pozycje, które ma Otodom, stoją
w naszych listach na początku i mają **dokładnie ich brzmienie** - od tego zależy,
czy przyszły eksport ogłoszenia trafi w ich słownik. Po nich dopisujemy własne,
bo agent często potrzebuje czegoś spoza listy portalu. Dotyczy to: ogrzewania,
stanu wykończenia, piętra, formy własności, rodzaju zabudowy, materiału budynku,
okien, wyposażenia i zabezpieczeń.

**Piętro jest wyjątkiem i warto o tym pamiętać.** Na liście widać „Suterena",
„Parter", „> 10", „Poddasze", ale w bazie trzymamy liczbę, bo po piętrze
filtrujemy listy i liczy je wyceniarka. Tłumaczenie w obie strony robią
`PIETRO_NA_LICZBE` i `pietroEtykieta` w `lib/property-fields.ts`; przy eksporcie
pójdzie z powrotem etykieta.

**Cena to dwa pola, nie jedno.** Przy jednym polu wynajem mieszkania podpowiadał
„650000", bo podpowiedź była pisana pod sprzedaż. Teraz helper `cena()` tworzy
parę pól z `only: "sprzedaz"` i `only: "wynajem"`, z własną etykietą
(„Cena" / „Czynsz najmu") i własną podpowiedzią.

**Nazwa oferty znika z kreatora.** Układamy ją z miasta i ulicy, bo przy ręcznym
nazywaniu lista ofert w biurze robi się nieczytelna. Ulica przychodzi
z podpowiedzi adresu (dodane pole `street` w `lib/geocode.ts`), a gdy agent wpisał
adres z palca, wyciągamy ją z pierwszych członów (`ulicaZAdresu`).

**Opis: 70 znaków na tytuł, 8500 na treść, plus wersja angielska.** Limity są po
stronie portali, więc licznik pokazujemy na bieżąco, a nie dopiero przy zapisie.
Tłumaczenie robi `/api/opis/tlumacz` na żądanie: agent i tak pisze najpierw po
polsku, a tłumaczenie ręczne po prostu nie powstaje. Wersja angielska siedzi
w `details.opis_en`.

**Mieszkanie bez sekcji „Media i przyłącza".** Prąd, gaz, woda i kanalizacja
opisują grunt albo cały budynek, nie lokal w bloku. Dla mieszkania zostaje lista
mediów w standardzie (internet, kablówka, telefon), jak na Otodom. Usunięte też:
„mieszkanie rozkładowe", „mieszkań w budynku", „liczba klatek", „ostatni remont
budynku". Ekspozycja okien jest teraz wyborem wielokrotnym, bo mieszkania mają
okna na kilka stron.

**Moduł „Asystent mailowy" usunięty.** Był zbudowany wokół naszej skrzynki, więc
nie nadawał się do sprzedaży innym biurom.

## Moduł Leady (październik 2026)

Powstał z konkretnego zapytania: właścicielka biura napisała przez formularz, że
pozyskuje leady z kilku źródeł, w dużej mierze z Meta Ads, i chce je
kontrolować. Propertly ma coś takiego przy widżecie wyceny, ale płytko: lista,
status i przypisanie, bez przejścia do CRM.

**Dlaczego osobna tabela, a nie `clients`.** Większość leadów nigdy nie zostanie
klientem, a baza klientów ma zostać czysta. Lead, z którym coś wyszło, przechodzi
do `clients` jednym przyciskiem, a `leads.client_id` pamięta, skąd przyszedł.

**Wczytywanie z pliku to sedno modułu** (`lib/leady-import.ts`). Meta pozwala
pobrać kontakty, ale „CSV" z Business Suite bywa rozdzielony przecinkiem,
średnikiem albo tabulatorem i raz jest w UTF-8, a raz w UTF-16. Nagłówki zależą
od tego, jak biuro nazwało pytania w formularzu, więc po polsku bywa „Imię
i nazwisko", a po angielsku „full_name". Dlatego nie zakładamy jednego formatu:
rozpoznajemy kodowanie, separator i znaczenie kolumn, a wynik pokazujemy do
poprawienia przed zapisem. Dzięki temu ten sam importer przyjmie plik z Otodom,
z nieruchomosci-online albo listę z Excela.

**Duplikaty** odsiewamy na dwa sposoby: po identyfikatorze z pliku (ten sam plik
wgrany drugi raz) i po dziewięciu ostatnich cyfrach telefonu (ta sama osoba
z dwóch kampanii). Drugi przypadek jest częstszy i to on ratuje agenta przed
dzwonieniem dwa razy do tej samej osoby.

**Kontrola:** `npm run test:leady` sprawdza parser na trzech kształtach plików,
w jakich faktycznie przychodzą: eksport Meta po angielsku, polski ze średnikiem
oraz tabulatory w UTF-16. Plus przecinki w cudzysłowach i odsiewanie wierszy bez
telefonu i maila.

**Czego świadomie nie ma:** wczytywania plików .xlsx. Wymagałoby to biblioteki,
a Meta i tak pozwala pobrać CSV. Kreator rozpoznaje plik Excela i mówi wprost,
co zrobić.

**Migracja:** `lib/SETUP-v33-leady.sql`.

**Świadomie NIE zaglądaliśmy do ASARI.** To płatny produkt konkurencji i
systematyczne przeglądanie jego formularzy pod odtworzenie w produkcie, który z
nim konkuruje, łamie regulamin i psuje pozycję AgentSpace przy sprzedaży innym
biurom. Zestawy pól wynikają z tego, czym dana nieruchomość jest, oraz z
wymagań portali i przepisów (EP/EU/ECO2 od 2023) - to wiedza jawna.


## 11. Workflow

Commit → push do `main` → Vercel auto-deploy (~30-60s). Weryfikacja deployu: `curl -sL https://www.agentspace.pl/app | grep Zaloguj`. Build lokalnie: `npm run build`. Dev: `npm run dev`.
