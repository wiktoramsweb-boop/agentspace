# AgentSpace

**Owner:** Wiktor Szostek (wiktoramsweb-boop on GitHub)
**Domena:** agentspace.pl
**Status:** Faza 2 - pełna platforma zbudowana i działa na produkcji

## ⭐ GDZIE JESTEŚMY / NASTĘPNE KROKI (czytaj najpierw)

**➡️ PEŁNY STATUS PROJEKTU: `PROJEKT-STATUS.md`** (kompletny handoff - historia, mapa, pliki, SQL, env, decyzje, następne kroki). Przeczytaj go na start nowej sesji.

**Działa na produkcji:** landing+blog+SEO; aplikacja `/app` z auth; **AI Coach** (3 kategorie: Cold Calling/Spotkania/Najem, 13+ scenariuszy PL, 9 osobowości, streaming + głos przez Web Speech API, scoring tool-use) - przetestowane; platforma: Klienci (CRM+notatki+pipeline), Prowizje, Zadania, Pulpit, AI Asystent Dnia; **Cele** (lejek roczny→dzienny, dzienny tracker z animacją, plan tygodnia, historia); **gamifikacja** (XP/poziomy/passa/odznaki/wyzwanie tygodnia); **AI pisze za agenta** (follow-up+obiekcje na karcie klienta); **onboarding** (checklist); panel właściciela (mocne/słabe obszary, prowizje per agent, drill-down), raport miesięczny + cron.

**⚠️ DO ZROBIENIA PRZEZ USERA:** uruchomić w Supabase SQL Editor pliki `lib/SETUP-*.sql` po kolei - v1 ✅ uruchomione; **v2 (platforma), v3 (kategorie+cele), v4 (łatwe scenariusze) prawdopodobnie do uruchomienia - POTWIERDZIĆ Z USEREM**. Kod odporny na brak tabel (puste, nie crashuje).

**Migracje:** v36, v37, v38 ✅ uruchomione. v54 (oddziały, prowizje, import) ✅ uruchomiona. v55 (szkice) i v56 (Akademia) ✅ uruchomione. **v57 (`lib/SETUP-v57-portale-zgloszenia.sql`) DO URUCHOMIENIA** - zgłoszenia portali w przygotowaniu. **v58 (`lib/SETUP-v58-wyceny.sql`) DO URUCHOMIENIA** - zapisane wyceny (bez niej wycena działa, ale się nie zapisuje). **v59 (`lib/SETUP-v59-kredyty-cele.sql`) DO URUCHOMIENIA** - wnioski do banków, finanse klienta, cele stanowisk, adres kalendarza. **v60 (`lib/SETUP-v60-najem.sql`) DO URUCHOMIENIA** - zarządzanie najmem i rola zarządcy najmu. **v49 (`lib/SETUP-v49-rozbudowa.sql`) DO URUCHOMIENIA** - czat, automatyzacje, urlopy, RODO, historia cen, koszty, dziennik, zadania AI Coach (szczegóły: PROJEKT-STATUS.md, „Wielka rozbudowa”). **Do uruchomienia: v39** (kolumny `kind` i `credits` w `subscription_orders` - doszły do v37 już po tym, jak została uruchomiona, a `create table if not exists` ich nie dokłada).

**Env:** wszystko w Vercel ✅ (`ANTHROPIC_API_KEY` działa - portfel API osobny od claude.ai). Publiczne Supabase mają defaulty w `lib/supabase/config.ts`. **`CRON_SECRET` jest WYMAGANY** - bez niego crony odmawiają (`lib/cron-auth.ts`). Limity AI: system kredytów (v35, `lib/kredyty-cennik.ts`) - pula miesięczna biura z pakietu, plus dzienny bezpiecznik na osobę `AI_DAILY_CREDITS_USER` (domyślnie 120 kredytów).

**Usunięte:** moduł Analiza cenowa (`/app/wycena`, `lib/wycena`) - model wyceniał zbyt niedokładnie, żeby pokazywać to klientowi. Migracje v28/v29 i tabele `market_*` zostają w bazie, nic nie kasujemy.

**Następne (omówione, NIE zbudowane):** PWA+powiadomienia (rekomendowane następne - pętla nawyku dla terenu), moduł Nieruchomości (oferty+zdjęcia), OtoDom eksport (bariera=dostęp/umowa nie kod), głos AI w Coach (ElevenLabs=koszty), płatności, Google Calendar.

**Współpraca:** user chce autonomii ("rób sam bez pytania"), commituj+pushuj incrementalnie, tłumacz prosto po polsku. Klucze API były w czacie - do rotacji po testach.

## Zarządzanie najmem

`/app/najem`, moduł `najem`, rola `rental_manager`. Słowniki, konfiguracja i obliczenia w `lib/najem-model.ts` (test `npm run test:najem`). `konfiguracja()` daje warunki: Spectra ma domyślnie ofertę z umowy (13%, 800 zł), inne biura ogólne, a zapis w `rental_settings` wygrywa. Prowizja liczy się od czynszu faktycznie wpłaconego. Jeden wiersz `rental_payments` to jeden miesiąc jednego lokalu.

## Stanowiska, kalendarz

Cele: agent i menedżer pracują lejkiem (`lib/funnel`), doradca, CEO, dyrektor i stażysta mają mierniki z `lib/cele-rol.ts` liczone w `lib/data-cele-rol.ts` (test `npm run test:cele`). Zadania w Osiągnięciach filtruje moduł stanowiska. Kalendarz podłącza się przez prywatny adres iCalendar (`/api/kalendarz/[token]`, `lib/ics.ts`): działa w jedną stronę, z AgentSpace do Google, Apple i Outlooka, bez OAuth. Listy wyboru w aplikacji tylko przez `app/app/components/select.tsx`, nigdy natywny `<select>`.

## Czytanie ogłoszeń, wyceny, asystent

Jeden czytnik ogłoszeń: `lib/import-ogloszenia.ts` (pobieranie + AI) i `lib/ogloszenie-czytanie.ts` (bez AI, test `npm run test:ogloszenia`). Wszystko idzie przez typ `DaneOferty`, a `lib/ogloszenie-mapy.ts` tłumaczy go na pola wyceny i kreatora. Element UI: `app/app/components/wklej-link.tsx`. OLX odmawia pobierania z serwera i tego nie obchodzimy: tam wkleja się treść.
Wycena liczy się w jednym miejscu, `policzWycene` w `lib/wyceny.ts` (strona i asystent), i zapisuje z raportem do `valuations`.
Asystent ma narzędzia w `lib/asystent-narzedzia.ts`: działa uprawnieniami osoby, nic nie usuwa, oferty nie zapisuje sam (otwiera wypełniony kreator, bo zapis może wysłać ją na portale). Każdy krok modelu to 1 kredyt.

## Strony www dla biur (nowe)

`/wzory` to galeria ośmiu wzorów stron dla biur nieruchomości (konkurencja dla stron ASARI).
`/strona/[slug]` to działająca strona klienta: oferty, zespół i wpisy bierze z CRM, a wygląd
z wybranego wzoru. Klient edytuje wszystko w `/app/ustawienia/strona`. Wymaga migracji
`lib/SETUP-v25-strona-www.sql`. Szczegóły w `PROJEKT-STATUS.md`, sekcja 10b.

## Struktura projektu

- **Landing / marketing** (`/`, `/blog`, `/cennik`, `/produkt/[slug]` - 16 podstron narzędzi generowanych z `lib/marketing/modules.ts`; siatka na stronie głównej i pasek pod nagłówkiem biorą dane z tego samego katalogu, więc nowe narzędzie dopisuje się w jednym miejscu, `/o-nas`, `/kontakt`, `/demo`, `/dla-agentow`, `/dla-wlascicieli`, `/polityka-prywatnosci`, `/regulamin`) - gotowe, live.
- **Aplikacja** (`/app/*`) - produkt SaaS, chroniony auth. Zbudowane:
  - Auth: `/login`, `/signup` (owner zakłada biuro), `/zaproszenie/[token]` (agent dołącza). Server actions w `app/auth/actions.ts`.
  - `/app` - pulpit (role-aware), `/app/trening` - AI Coach (5 scenariuszy), `/app/sesja/[id]` - sesja + wyniki, `/app/historia`, `/app/zespol` (owner: ranking + zaproszenia), `/app/ustawienia`.
  - AI Coach: `lib/ai/coach.ts` (roleplay + scoring z Claude API, prompt caching), streaming przez `/api/coach/message`.
  - Dane: `lib/data.ts`, typy `lib/types.ts`, auth helper `lib/auth.ts`.
  - Supabase SSR: `lib/supabase/{server,client,admin,middleware}.ts`, root `middleware.ts` chroni `/app`.
- **Platforma codziennej pracy** (v2): `/app/klienci` (CRM: karty, notatki, pipeline), `/app/prowizje` (deals + cel miesięczny), zadania inline na pulpicie, **AI Asystent Dnia** (`/api/assistant/daily` - 3 priorytety z klientów/pipeline/tasków). Data: `lib/data-platform.ts`, `lib/format.ts`, akcje w `app/app/{klienci,prowizje}/actions.ts` + `app/app/tasks-actions.ts`.
- **Panel właściciela rozbudowany:** mocne/słabe obszary per kategoria, prowizje per agent, drill-down `/app/zespol/[agentId]`. **Raport miesięczny email** (`lib/report.ts`) - przycisk manualny + cron `/api/cron/monthly-report` (vercel.json, 1. dnia mc).
- **SETUP wymaga (user):** uruchomić `lib/SETUP-uruchom-w-supabase.sql` ORAZ `lib/SETUP-v2-platforma.sql` w Supabase SQL Editor + dodać env `ANTHROPIC_API_KEY` w Vercel (reszta publicznych ma defaulty w `lib/supabase/config.ts`). `CRON_SECRET` wymagany dla cronów.

**Wzorzec dostępu do danych:** cały dostęp przez server-side kod z service_role (`createSupabaseAdmin`), autoryzacja egzekwowana w kodzie na bazie sesji (`requireUser`/`requireOwner`). RLS włączone jako backstop. Anon key tylko do auth (login/signup/getUser).

**Zasady przy nowym kodzie (po audycie z października 2026):**
- Role i moduły: `lib/role.ts` (bez importów, test `npm run test:role`). Menu i strony czytają to samo pole `modul`, więc ukrycie w menu zawsze idzie w parze z bramką `requireModul`.
- Reguły „kto może co” trzymamy w `lib/uprawnienia.ts` i pilnujemy testem `npm run test:uprawnienia`. Agent usuwa i przepisuje tylko swoje rekordy, menedżer nie widzi kwot cudzych transakcji, ukrywanie kontaktów obowiązuje także na kartach i w listach do wyboru.
- ID klienta/oferty/osoby przychodzące z formularza sprawdzamy przez `lib/agency-ids.ts` (tylko z własnego biura).
- Każdy nowy endpoint AI: `brakKredytow` z `lib/kredyty.ts` z własną wyceną w `lib/kredyty-cennik.ts` + limit długości tekstu. Publiczny formularz: pułapka `website` + `hitLimit` po skrócie IP.
- Tekst od użytkownika w mailu HTML zawsze przez `escapeHtml` (`lib/html.ts`).
- „Dzisiaj” zawsze `todayPL()` / `dateKeyPL()` z `lib/datetime.ts`, nigdy `toISOString().slice(0, 10)`.
- Istnienie tabeli sprawdzamy zapytaniem GET (`select("id").limit(1)`), nigdy HEAD: brakująca tabela przy HEAD zwraca 204 bez błędu.
- Ważne czynności (usunięcia, przepisania, eksporty, role, pieniądze) zapisujemy w `lib/dziennik.ts` (`zapiszZdarzenie`).
- Strona www: bez gradientowego tekstu, poświat, szkła i karuzel; kolory z tokenów `--color-mk-*`; nie obiecujemy funkcji, których nie ma (eksport na portale działa dla Otodom (OLX aktywował aplikację produkcyjnie 29.10.2026), Nieruchomosci-online i TabelaOfert; Gratka/Morizon, Domiporta, Adresowo dopiero w przygotowaniu); opinie tylko prawdziwe (`lib/marketing/opinie.ts`).

## Co to jest

Platforma operacyjna SaaS dla agentów nieruchomości w Polsce. Codzienne miejsce pracy agenta z dashboardem, notatkami, planem dnia, integracją kalendarza Google, rankingiem agentów (KPI/umowy), i flagowym modułem **AI Coach** (trening cold calli z AI klientem, scoring, feedback po polsku).

**Decyzja zakupu:** właściciel biura. **Użytkownicy:** agenci. **Cennik:** `lib/marketing/plans.ts` (Start 299, Pro 599, Biuro od 999 zł/mc). Zakupy biura w aplikacji: Ustawienia → Abonament i płatności (moduł `abonament`). **Klient zero:** biuro nieruchomości Spectra w Krakowie (biuro ownera).

Pełny kontekst i plan w `~/spectra-research/` (pliki 01-07).

## Stack

- **Framework:** Next.js 16 z App Router (Turbopack)
- **Język:** TypeScript
- **Style:** Tailwind CSS 4
- **UI komponenty:** docelowo shadcn/ui (dodamy gdy potrzeba)
- **Ikony:** docelowo Lucide React
- **Hosting:** Vercel (auto-deploy z main branch)
- **DB / Auth / Storage:** Supabase (region Frankfurt), podłączone i działa na produkcji
- **AI (przyszłość):** Anthropic Claude (logika), OpenAI Whisper (STT PL), ElevenLabs (TTS PL), Vapi (real-time voice)
- **Płatności (przyszłość):** Stripe lub Tpay

## Zasady kodowania

- **Teksty UI:** zawsze po polsku (Twój target to polskie biura RE)
- **Komentarze w kodzie:** po polsku, ale tylko gdy WHY jest nieoczywiste
- **Kod (nazwy zmiennych, funkcji):** po angielsku
- **Server Components by default** - Client Components (`"use client"`) tylko gdy faktycznie potrzeba interaktywności
- **Mobile-first** - większość właścicieli biur sprawdza na telefonie
- **Mała, prosta architektura** - unikamy abstrakcji których nie potrzebujemy jeszcze
- **Bez TODO/FIXME** - albo robimy, albo zostawiamy zadanie w Linear/Notion (gdy będzie)

## Czego nie robić bez konsultacji

- Nie instaluj losowych npm packages - pytaj zanim dodasz dependency
- Nie zmieniaj struktury folderów (`src/app/`) bez konsultacji
- Nie commituj kluczy API / secretów do repo (używamy `.env.local` i Vercel Environment Variables)
- Nie pisz testów na każdy plik - testujemy tylko krytyczną logikę (logikę AI, płatności, autoryzację)

## Owner - kontekst

Wiktor jest właścicielem biura nieruchomości Spectra w Krakowie. **Początkujący w kodowaniu** - wyjaśniaj koncepty po polsku, prosto, bez snobizmu technologicznego. Jego siła to: znajomość branży RE, sieć kontaktów, doświadczenie sprzedażowe.

**Język rozmowy:** polski.

## Roadmap funkcji (chronologiczne)

1. **Landing page + waitlist** (TERAZ) - strona z formularzem zapisu, sekcje Problem/Rozwiązanie/Cennik
2. **Auth + multi-tenant** (Faza 3 sprint 1) - logowanie email/hasło, konta agencji, zapraszanie agentów
3. **AI Coach text** (Faza 3 sprint 2) - 5 scenariuszy, chat z AI klientem (tekstowo)
4. **AI Coach voice** (Faza 3 sprint 3) - Whisper + ElevenLabs + Vapi
5. **Scoring + dashboardy** (Faza 3 sprint 4) - feedback per sesja, ranking agentów, statystyki biura
6. **Płatności** (Faza 3 końcówka) - Stripe/Tpay, pakiety z `/cennik`
7. **Notatki i plan dnia** (post-launch) - codzienne use case
8. **Integracja kalendarza Google** (post-launch)
9. **Tracking umów + KPI** (post-launch)

## Workflow

- Każda zmiana w kodzie → commit → push do main → Vercel auto-deploy w ~30 sek
- Branch strategy: na razie tylko `main` (jesteśmy solo)
- Gdy będzie zespół: feature branches + PR review

## Jak ze mną rozmawiać

- Mów po polsku, normalnie
- Daj kontekst: cel, ograniczenia, dla kogo
- Jeśli czegoś nie rozumiesz w moim kodzie - pytaj, wyjaśnię
- Małe zmiany przez Cursor inline (Cmd+K), większe przez sesję Claude Code w terminalu

