# AgentSpace — pełny status projektu (handoff)

> Ten dokument to kompletny zapis projektu do przekazania nowej sesji Claude.
> Czytaj razem z `CLAUDE.md` (architektura + zasady).

## 🟢 SESJA LIPIEC 2026 — co dodaliśmy w tym czacie (najświeższe)

Wszystko live na `main`/Vercel. W tej sesji doszło:
- **System ról CEO / Menedżer / Agent** (SQL v13). CEO nadaje role i przypisuje agentów do menedżera (`/app/zespol` → „Zespoły menedżerów" — od strony menedżera wybierasz jego osoby). Menedżer widzi TYLKO swoich agentów: Cele/lejek + wyniki AI, BEZ prowizji, tylko podgląd. Można zaprosić 2. CEO (Krystian Sławęta) z góry nadaną rolą. Helper `requireManagerOrOwner`, etykiety `ROLE_LABELS`. **Fix buga:** klik w sesję agenta (też w toku) nie wyrzuca już na pulpit — CEO/menedżer widzi read-only. Drill-down agenta: Cele/lejek + WSZYSTKIE sesje + kalendarz „dzień po dniu".
- **Tygodniowe limity AI Coach** (SQL v14) — CEO ustawia per osoba; egzekwowane w `startSession`.
- **Alerty proaktywne + trendy** — `getTeamInsights`: „⚠️ Wymaga uwagi" (nie dzwoni 3+ dni / wynik AI spadł / nie trenuje) + strzałki trendu + słupki aktywności zespołu (4 tyg.).
- **Zmiana własnego maila logowania** — `/app/ustawienia` → „Zmień email" (`changeMyEmail`, admin API).
- **Asystent wiadomości** (`/app/maile`) — AI pisze maile i SMS-y w tonie Spectry (patrz niżej). Zawiera typ „Trudny/słaby okres — uczciwie" (zamiast zmyślania danych — user prosił o zmyślanie, ODMÓWIŁEM, dałem uczciwą alternatywę).
- **Karta transakcji** (SQL v15) — `/app/prowizje/[id]`: 5 etapów + checklista dokumentów, autozapis (patrz niżej).
- **Klienci — podział na typy**: sprzedający/kupujący/wynajmujący/najemca (+inny). Formularz najpierw pyta o typ, pola dopasowane (sprzedający ma „oczekiwaną cenę" nie „budżet"). Filtr typu na liście. `CLIENT_TYPE_LABELS` (stary „najem" = legacy). Bez migracji.
- **Nieruchomości WSPÓLNE dla biura** (jak Klienci) — `getAgencyProperties`, browser z filtrem Wszystkie/Moje, edycja agency-scoped. Karty z gradientem/ikoną typu/opiekunem, **mapa ciemna (CARTO) + kolorowe pinezki z ceną**.
- **Umowa rezerwacyjna** — pełny moduł + **PDF przez pdf-lib** (kluczowa lekcja, patrz wpis modułu i [[pdf-generowanie-dokumentow]]).
- **Wizualny lifting** — design kit `components/kit.tsx` (Button/SegmentedToggle z akcentem koloru — moduły MAJĄ się różnić kolorami, user tego chce), gradienty tła, `focus-visible`, `.text-gradient` na nagłówkach.
- **RLS** (SQL v16) — backstop izolacji biur (service_role omija; user może uruchomić).
- **Perf/mobile fixy:** region Vercela → **fra1** (obok Supabase, duży zysk szybkości), globalne 16px na polach (koniec auto-zoom iOS), modal `dvh` + scroll-do-pola (pola nie chowają się za klawiaturą), przyciski „wciskają się" + spinnery (`SubmitButton`), inputMode decimal + przecinek w prowizjach.

**⚠️ USER MUSI URUCHOMIĆ w Supabase (potwierdzić które):** v13 (role), v14 (limity AI), v15 (karta transakcji), v16 (RLS — opcjonalne). Kod odporny na brak kolumn (pokazuje czytelny błąd).

**PLANY DALEJ (omówione, priorytety usera):** (1) **Kalendarz spotkań + realne powiadomienia** (rekomendowane — codzienna lepkość; push wymaga env VAPID). (2) **Matching kupujący↔nieruchomość**. (3) **Analiza PRAWDZIWEJ rozmowy** (nagranie → Whisper transkrypcja → scoring jak AI Coach; wyróżnik, koszt Whisper). (4) **Automatyczna wysyłka maili/SMS** — czeka na weryfikację domeny **spectranieruchomosci.pl** w Resend (user wybrał podmianę agentspace.pl→spectranieruchomosci.pl; z gmaila NIE da się wysyłać). (5) **Płatności (Stripe/Tpay)** do monetyzacji. (6) Design kit rozlać na resztę modułów (~46 przycisków), więcej aria-label. (7) Sekwencje follow-up, podłączenie CRM do asystenta maili.

---

## 🔵 NAJNOWSZY STAN (czytaj to najpierw)

Od czasu opisu poniżej doszło DUŻO modułów. Wszystko live na `main`/Vercel. Skróty:

**Nowe moduły/zakładki:**
- **Nieruchomości** (`/app/nieruchomosci`) — oferty + mapa wszystkich aktywnych (Leaflet CDN), karta oferty z edycją, powiązanie z klientem (właściciel/zainteresowani), karta „Co w okolicy" (Overpass/OSM).
- **Opisy** (`/app/opisy`) — generator opisów ogłoszeń (szablon + „✨ AI" przez `/api/opis/generate`).
- **Asystent wiadomości** (`/app/maile`) — AI pisze **maile i SMS-y** do klientów w tonie Spectry. Przełącznik Mail/SMS. Maile: ~15 typów pogrupowanych kolorami (Właściciel/Kupujący/Negocjacje/Formalności/Relacja/Inne). SMS: 8 typów + podgląd „dymek" + licznik znaków/segmentów (polskie znaki→70/SMS). `/api/maile/generate` (mode mail/sms; tool-use `napisz_mail`{subject,body} / `napisz_sms`{text}). KLUCZOWE: AI używa TYLKO faktów agenta, nie wymyśla liczb/dat/adresów (braki jako `[nawiasy]`), linki/adresy przepisuje 1:1. Ton w SYSTEM prompcie na bazie realnych maili. Nie wymaga CRM. Wynik edytowalny + kopiuj.
- **Ofertówka** (`/app/ofertowka`) — one-pager oferty (zdjęcia + parametry) → druk/PDF, bez AI. `sheet-a4` = 1 strona.
- **Umowa rezerwacyjna** (`/app/rezerwacje`) — generator umowy rezerwacyjnej **sprzedaż/najem** (wybór), typ nieruchomości, powtarzalne strony (właściciele/kupujący). Prawnie kompletna. Wybór **Zadatek (bezzwrotny, art. 394 KC — przepada gdy Kupujący/Najemca rezygnuje; przy rezygnacji właściciela zwrot nominalny, wyłączenie dwukrotności)** lub Opłata rezerwacyjna. Strony: PESEL + **dowód osobisty LUB paszport** (do wyboru) + adres. Akt notarialny (art. 158 KC) dla sprzedaży, najem okazjonalny (art. 19a). Definicje stron w formie standardowej (Sprzedający/Kupujący, Wynajmujący/Najemca) z poprawną deklinacją. **Dodatkowe zapisy przez AI** (`/api/rezerwacja/klauzula` → wstawia jako „§ dodatkowe" przed końcowymi). `lib/reservation.ts` = builder treści (pogrubienia jako `**...**`). **PDF: `lib/reservation-pdf.ts` (pdf-lib, NIE druk przeglądarki!)** — real PDF, równe marginesy na każdej stronie, brak nagłówka przeglądarki, 2 strony, podpisy. Przycisk „Podgląd i PDF" → „Pobierz PDF". [[pdf-generowanie-dokumentow]]. Bez DB, client-side.
- **Kalkulatory** (`/app/kalkulatory`) — rata kredytu (+nadpłata), koszty zakupu (rynek/rabaty/opłaty), ROI najmu → PDF dla klienta (przez druk; podgląd pełnoekranowy „Podgląd i PDF").
- **Faktury** (`/app/faktury`, owner) — 3 sprzedawców, nabywca firma/osoba, kwota słownie, VAT zw, edycja, druk/PDF. `lib/invoice.ts`.
- **Szybki wpis głosem** (`/app/szybki-wpis`) — dyktujesz relację ze spotkania → `/api/quick-entry/parse` (Claude tool-use) → klient + notatka + nieruchomość do CRM.
- **Prowizje** — kalkulator z VAT (brutto→netto, zarobek od netto), prognoza kwartału.
- **Klienci** — WSPÓŁDZIELONY CRM (cała agencja), wyszukiwarka po telefonie, przypomnienia, styl ASARI.

**AI Coach:** poziom trudności (łatwy/średni/trudny, wybierany przy starcie — `session.difficulty` → prompt), scenariusze pogrupowane kolorami; nowe scenariusze (archiwalne telefony, negocjacja oferty, gdybanie, doradca kredytowy). Ranking WYKLUCZA właściciela.

**PWA:** instalowalna apka + powiadomienia push (VAPID, `/api/push/*`, cron `morning-brief`). Wymaga env VAPID w Vercel.

**Wygląd:** ciemny motyw z jaśniejszymi kartami, sidebar w stylu ASARI (kolorowe kafle, sekcje), toasty, animacje wejścia, szkielet ładowania.

**SQL do uruchomienia w Supabase (kolejno, idempotentne):** v1 ✅, v2, v3, v4, v5 (nieruchomości/prowizje), v6 (scenariusze obiekcje), v7 (push), v8 (faktury), v9 (telefony), v10 (trudność sesji), v11 (scenariusze archiwalne), v12 (doradca kredytowy), **v13 (role CEO/Menedżer/Agent — `profiles.manager_id`, `invitations.manager_id/full_name`), v14 (tygodniowe limity AI — `profiles.weekly_ai_limit`), v15 (karta transakcji — `deals.transaction_card jsonb`), v16 (RLS — izolacja biur, backstop; service_role i tak omija).** Pliki `lib/SETUP-v*.sql`. Potwierdź z userem, które odpalone.

**Wizualny lifting (w toku):** `components/kit.tsx` = design kit z akcentem koloru (Button, SegmentedToggle — moduły różnią się kolorami). `globals.css`: poświaty gradientowe tła (`.app-shell`), globalny `focus-visible`, `.text-gradient` (nagłówki), `.card-glow`, ciemne dymki Leafleta. Nieruchomości: mapa na ciemnych kafelkach (CARTO dark) + kolorowe pinezki z ceną (`properties-map.tsx`), karty ofert z gradientem/ikoną typu/opiekunem/hover-glow. **Do zrobienia dalej:** rozlać design kit na pozostałe moduły (46 miejsc z własnym przyciskiem), więcej aria-label.

**Karta transakcji (v15):** wejście w transakcję na `/app/prowizje/[id]` — 5 etapów (weryfikacja prawna/podatkowa, profil kupującego, organizacja: kredyt/gotówka, umowa końcowa/PCC, po akcie) + checklista dokumentów (13 pozycji + własne), notatki, pasek postępu, **autozapis**. Model w `lib/transaction-card.ts` (`mergeCard` odporny na dodane pola), akcja `updateTransactionCard`. Karta wzorowana na realnym PDF Spectry.

**Limity AI (v14):** CEO ustawia w Zespół → „Role i przypisania" tygodniowy limit rozmów AI Coach per osoba (puste=bez limitu, 0=blokada). Egzekwowane w `startSession` (liczba sesji od poniedziałku). **Alerty/trendy:** `getTeamInsights` — karta „⚠️ Wymaga uwagi" (nie dzwoni 3+ dni / wynik AI spadł / nie trenuje), strzałki trendu przy wyniku, słupki aktywności zespołu (4 tyg.) na `/app/zespol`.

**Role (v13):** wartości `profiles.role`: `owner`=CEO (pełny dostęp; wartość nietknięta — cała autoryzacja o nią oparta), `manager`=Menedżer (widzi TYLKO swoich agentów: Cele/lejek + wyniki AI, BEZ prowizji, tylko podgląd), `agent`. CEO nadaje role i przypisuje agentów do menedżera (`/app/zespol` → „Role i przypisania"). Zaproszenia niosą rolę+manager_id → można zaprosić 2. CEO (Krystian) zanim się zarejestruje. Helper `requireManagerOrOwner`, etykiety `ROLE_LABELS` w `lib/types.ts`. Zmiana własnego maila logowania: `/app/ustawienia` → „Zmień email".

**GOTOWE:** „Oferta współpracy" (`/app/oferta-wspolpracy`) — generator nadrukowujący pola na 6-str. PDF z Canvy, generacja client-side (`lib/oferta-pdf.ts`, pdf-lib `subset:false`), formularz z domyślnymi z profilu + opcjonalny mikrofon (`/api/oferta-wspolpracy/parse`), wpis w sidebarze. Zweryfikowane renderem. **Zostało tylko:** automatyczna wysyłka mailem do klienta — czeka na weryfikację domeny Resend (na razie agent pobiera PDF i wysyła sam).

**Konfiguracja usera do zrobienia:** weryfikacja domeny agentspace.pl w Resend (DNS Hostinger) → automatyczne maile; env VAPID w Vercel → push. Do czasu: linki/pliki kopiuje/wysyła się ręcznie.

---


## 1. Kim jest owner i cel

**Wiktor Szostek** — właściciel biura nieruchomości **Spectra** w Krakowie (ul. Zbożowa 2/1, 30-002 Kraków, NIP 6772516327, REGON 529666353). Początkujący w kodowaniu — tłumaczyć prosto po polsku, bez żargonu. Chce **autonomii** ("rób sam bez pytania, commituj po drodze"). GitHub: `wiktoramsweb-boop`. Email do powiadomień: `wiktor.amsweb@gmail.com` (patrz sekcja Resend).

**Produkt AgentSpace** = SaaS dla biur nieruchomości w PL. Flagowe: **AI Coach** (trening rozmów z AI klientem). Plus pełna platforma codziennej pracy agenta + analityka dla właściciela. Cena docelowa 299 zł/mc/biuro do 10 agentów. Spectra = klient zero. Domena **agentspace.pl** (Hostinger DNS → Vercel).

## 2. Historia (jak doszliśmy tu)

1. **Research** (pliki w `~/spectra-research/` 01-07): rynek USA vs PL, TOP pomysły, wybór — platforma dla biur RE z AI Coachem (nie CRM jak Asari, tylko warstwa AI+produktywność).
2. **Landing + marketing** — pełna strona z blogiem, SEO, premium motion. Live.
3. **MVP aplikacji** — auth, AI Coach (5 scenariuszy), scoring, dashboardy. Live, przetestowane.
4. **Platforma codzienna** — Klienci (CRM), Prowizje, Zadania, Pulpit, AI Asystent Dnia, panel właściciela, raport miesięczny.
5. **Rozbudowa AI Coach** — 3 kategorie (Cold Calling/Spotkania/Najem), 13+ scenariuszy, 9 osobowości, jaśniejszy motyw.
6. **Zakładka Cele** — lejek sprzedażowy roczny→dzienny, dzienny tracker z animacją, plan tygodnia, historia.
7. **Głos w AI Coach** — darmowe rozpoznawanie mowy PL (Web Speech API), agent mówi zamiast pisać.
8. **Łatwi klienci** — osobowość "Życzliwy" + 3 easy scenariusze dla początkujących.
9. **Gamifikacja + AI pisze za agenta + Onboarding** (A+B+E) — ostatnia sesja.

## 3. Stack i architektura

- **Next.js 16** (App Router, Turbopack) + **TypeScript** + **Tailwind 4** + **motion** (framer-motion).
- **Supabase** — Postgres + Auth (`@supabase/ssr`). URL: `puowqbebsbmrcvoivkxb.supabase.co`, region Frankfurt.
- **Anthropic Claude API** — AI Coach, scoring, asystent, pisanie. Model konfig. `ANTHROPIC_MODEL` (domyślnie `claude-sonnet-4-5-20250929`). Prompt caching w roleplay, tool use w scoringu/asystencie.
- **Resend** — emaile (waitlist, zaproszenia, raport). Bez zweryfikowanej domeny wysyła TYLKO do `wiktor.amsweb@gmail.com` (konto Resend ownera). Żeby wysyłać do dowolnych — zweryfikować domenę agentspace.pl w Resend + zmienić `RESEND_FROM` na `noreply@agentspace.pl`.
- **Vercel** — hosting, auto-deploy z `main`. Vercel Analytics + Speed Insights. Cron raportu (vercel.json).
- **Wzorzec dostępu do danych:** WSZYSTKO server-side przez service_role (`lib/supabase/admin.ts` → `createSupabaseAdmin`). Autoryzacja w kodzie (`lib/auth.ts`: `requireUser`/`requireOwner`, oba `cache`). RLS włączone jako backstop (bez policies dla anon). Publiczne wartości Supabase mają defaulty w `lib/supabase/config.ts` (URL+anon key są jawne).

## 4. Mapa aplikacji (/app — chronione middleware)

- `/app` — **Pulpit**: onboarding checklist, gamifikacja (poziom/passa/odznaki), statystyki, cel, AI Asystent Dnia, plan dnia (zadania), klienci do kontaktu, wyzwanie tygodnia, ostatnie treningi, snapshot zespołu (owner).
- `/app/cele` — **Cele**: setup celu finansowego, lejek (cold call→spotkanie→umowa→kupujący→sprzedaż) roczny/mc/tydz/dzień/godz, dzienny tracker z animowanym ringiem + świętowanie, plan tygodnia (grid), historia 6 tyg.
- `/app/trening` — **AI Coach**: 3 kategorie, instrukcja 1-2-3, karty scenariuszy. `/app/trening/[slug]` — kroki 1(zadanie)/2(typ klienta)/3(start).
- `/app/sesja/[id]` — chat na żywo (streaming, **mikrofon/głos**) LUB wyniki (scoring 4 kategorie + feedback + przycisk "Oceń tę rozmowę").
- `/app/klienci` — CRM lista + `/app/klienci/[id]` karta (status pipeline, notatki, **AI: follow-up + obiekcje**).
- `/app/prowizje` — deals + cel miesięczny + pipeline.
- `/app/historia` — historia sesji.
- `/app/zespol` (owner) — ranking, prowizje per agent, mocne/słabe obszary, zaproszenia, raport email, `/app/zespol/[agentId]` drill-down.
- `/app/ustawienia` — profil, cel prowizji.
- Auth: `/login`, `/signup` (owner zakłada biuro), `/zaproszenie/[token]` (agent dołącza).

## 5. Kluczowe pliki (gdzie co jest)

- Auth: `app/auth/actions.ts`, `lib/auth.ts`, `lib/supabase/{server,client,admin,middleware,config}.ts`, `middleware.ts`
- AI: `lib/ai/{client,coach,assistant}.ts`, `/api/coach/message`, `/api/assistant/{daily,write}`
- Dane: `lib/data.ts` (sesje/scoring/zespół), `lib/data-platform.ts` (zadania/klienci/deals/cele/onboarding), `lib/funnel.ts` (lejek), `lib/gamification.ts` (XP/poziomy/odznaki/passa/wyzwanie), `lib/format.ts`, `lib/types.ts`
- Głos: `lib/use-speech-recognition.ts`
- Raport: `lib/report.ts`, `/api/cron/monthly-report`

## 6. SQL do uruchomienia w Supabase (WAŻNE)

Pliki w `lib/`, uruchamiać w SQL Editor po kolei. Status na teraz — **user uruchomił v1**, reszta prawdopodobnie do uruchomienia (potwierdzić z userem):
1. `SETUP-uruchom-w-supabase.sql` (v1) — agencies, profiles, invitations, scenarios(5), training_sessions, session_scores. ✅ URUCHOMIONE.
2. `SETUP-v2-platforma.sql` — tasks, clients, client_notes, deals.
3. `SETUP-v3-scenariusze-cele.sql` — +kolumna scenarios.category, goals, daily_logs, rekategoryzacja + 8 scenariuszy.
4. `SETUP-v4-latwe-scenariusze.sql` — 3 łatwe scenariusze.
5. **`SETUP-v5-nieruchomosci-prowizje.sql` — NOWE (do uruchomienia).** Tabele `properties` + `property_interests`; kolumny adres/mapa (`city,address,lat,lng`) i `next_contact_at` na `clients`; kolumny kalkulatora prowizji na `deals` (`property_id, transaction_value_pln, commission_seller/buyer/landlord/tenant_pln, extras_pln, extras_note, agent_split_pct, agent_earnings_pln`); `default_split_pct` na `profiles`; backfill `agent_earnings_pln = commission_pln` dla starych transakcji.

Kod jest ODPORNY na brak tabel (puste dane, nie crashuje) — ale funkcje nie działają bez tabel.

## 7. Zmienne środowiskowe (Vercel + .env.local)

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (sekret) — w Vercel ✅
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — mają defaulty w config.ts (nie trzeba w Vercel)
- `ANTHROPIC_API_KEY` — w Vercel ✅ (portfel API osobny od claude.ai, owner doładował ~$5)
- `RESEND_API_KEY`, `RESEND_FROM`, `NOTIFICATION_EMAIL=wiktor.amsweb@gmail.com` — w Vercel ✅
- `IP_HASH_SALT` — w Vercel ✅
- Opcjonalnie: `NEXT_PUBLIC_APP_URL`, `ANTHROPIC_MODEL`, `CRON_SECRET`

## 8. WAŻNE rozróżnienie Anthropic (owner się mylił)

**claude.ai** (subskrypcja €22/mc + €85 kredytów) = czat/Claude Code (nasze kodowanie). **console.anthropic.com** = API (portfel osobny, ~$5, zasila AI Coach w aplikacji). Nasze kodowanie NIE zjada portfela API. Realna rozmowa AI w aplikacji ≈ $0.02-0.06.

## 9. Bezpieczeństwo — DO ZROBIENIA

Klucze Supabase (`sb_secret_...`) i Resend były wklejane w czacie. **Po testach zrotować**: Supabase → Settings → API → Reset service_role; podmienić w Vercel + `.env.local`.

## 10. Następne kroki (omówione, NIE zbudowane)

- **Wersja mobilna (PWA)** + **powiadomienia** (mail/push) — domykają pętlę nawyku dla agentów w terenie. Rekomendowane następne.
- **Moduł Nieruchomości** (oferty + zdjęcia via Supabase Storage) + publiczne oferty na stronie. Wykonalne.
- **OtoDom/portale eksport** — NIE problem kodu, tylko dostępu: OtoDom (Grupa OLX) nie ma otwartego API, wymaga konta Pro dla biur + umowy partnerskiej (fosa Asari). Etap 2 gdy będą płacący klienci. Do wyjaśnienia: co to "agencja5000" (owner wspomniał).
- **AI Coach — głos AI** (żeby klient odpowiadał głosem: ElevenLabs + koszty). Na razie tylko wejście głosem agenta.
- **Płatności** (Stripe/Tpay), **Google Calendar**.

## 11. Workflow

Commit → push do `main` → Vercel auto-deploy (~30-60s). Weryfikacja deployu: `curl -sL https://www.agentspace.pl/app | grep Zaloguj`. Build lokalnie: `npm run build`. Dev: `npm run dev`.
