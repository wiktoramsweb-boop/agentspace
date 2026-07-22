# AgentSpace

**Owner:** Wiktor Szostek (wiktoramsweb-boop on GitHub)
**Domena:** agentspace.pl
**Status:** Faza 2 — pełna platforma zbudowana i działa na produkcji

## ⭐ GDZIE JESTEŚMY / NASTĘPNE KROKI (czytaj najpierw)

**➡️ PEŁNY STATUS PROJEKTU: `PROJEKT-STATUS.md`** (kompletny handoff — historia, mapa, pliki, SQL, env, decyzje, następne kroki). Przeczytaj go na start nowej sesji.

**Działa na produkcji:** landing+blog+SEO; aplikacja `/app` z auth; **AI Coach** (3 kategorie: Cold Calling/Spotkania/Najem, 13+ scenariuszy PL, 9 osobowości, streaming + głos przez Web Speech API, scoring tool-use) — przetestowane; platforma: Klienci (CRM+notatki+pipeline), Prowizje, Zadania, Pulpit, AI Asystent Dnia; **Cele** (lejek roczny→dzienny, dzienny tracker z animacją, plan tygodnia, historia); **gamifikacja** (XP/poziomy/passa/odznaki/wyzwanie tygodnia); **AI pisze za agenta** (follow-up+obiekcje na karcie klienta); **onboarding** (checklist); panel właściciela (mocne/słabe obszary, prowizje per agent, drill-down), raport miesięczny + cron.

**⚠️ DO ZROBIENIA PRZEZ USERA:** uruchomić w Supabase SQL Editor pliki `lib/SETUP-*.sql` po kolei — v1 ✅ uruchomione; **v2 (platforma), v3 (kategorie+cele), v4 (łatwe scenariusze) prawdopodobnie do uruchomienia — POTWIERDZIĆ Z USEREM**. Kod odporny na brak tabel (puste, nie crashuje).

**Env:** wszystko w Vercel ✅ (`ANTHROPIC_API_KEY` działa — portfel API osobny od claude.ai). Publiczne Supabase mają defaulty w `lib/supabase/config.ts`.

**Następne (omówione, NIE zbudowane):** PWA+powiadomienia (rekomendowane następne — pętla nawyku dla terenu), moduł Nieruchomości (oferty+zdjęcia), OtoDom eksport (bariera=dostęp/umowa nie kod), głos AI w Coach (ElevenLabs=koszty), płatności, Google Calendar.

**Współpraca:** user chce autonomii ("rób sam bez pytania"), commituj+pushuj incrementalnie, tłumacz prosto po polsku. Klucze API były w czacie — do rotacji po testach.

## Struktura projektu

- **Landing / marketing** (`/`, `/blog`, `/cennik`, `/o-nas`, `/kontakt`, `/demo`, `/dla-agentow`, `/dla-wlascicieli`, `/polityka-prywatnosci`, `/regulamin`) — gotowe, live.
- **Aplikacja** (`/app/*`) — produkt SaaS, chroniony auth. Zbudowane:
  - Auth: `/login`, `/signup` (owner zakłada biuro), `/zaproszenie/[token]` (agent dołącza). Server actions w `app/auth/actions.ts`.
  - `/app` — pulpit (role-aware), `/app/trening` — AI Coach (5 scenariuszy), `/app/sesja/[id]` — sesja + wyniki, `/app/historia`, `/app/zespol` (owner: ranking + zaproszenia), `/app/ustawienia`.
  - AI Coach: `lib/ai/coach.ts` (roleplay + scoring z Claude API, prompt caching), streaming przez `/api/coach/message`.
  - Dane: `lib/data.ts`, typy `lib/types.ts`, auth helper `lib/auth.ts`.
  - Supabase SSR: `lib/supabase/{server,client,admin,middleware}.ts`, root `middleware.ts` chroni `/app`.
- **Platforma codziennej pracy** (v2): `/app/klienci` (CRM: karty, notatki, pipeline), `/app/prowizje` (deals + cel miesięczny), zadania inline na pulpicie, **AI Asystent Dnia** (`/api/assistant/daily` — 3 priorytety z klientów/pipeline/tasków). Data: `lib/data-platform.ts`, `lib/format.ts`, akcje w `app/app/{klienci,prowizje}/actions.ts` + `app/app/tasks-actions.ts`.
- **Panel właściciela rozbudowany:** mocne/słabe obszary per kategoria, prowizje per agent, drill-down `/app/zespol/[agentId]`. **Raport miesięczny email** (`lib/report.ts`) — przycisk manualny + cron `/api/cron/monthly-report` (vercel.json, 1. dnia mc).
- **SETUP wymaga (user):** uruchomić `lib/SETUP-uruchom-w-supabase.sql` ORAZ `lib/SETUP-v2-platforma.sql` w Supabase SQL Editor + dodać env `ANTHROPIC_API_KEY` w Vercel (reszta publicznych ma defaulty w `lib/supabase/config.ts`). Opcjonalnie `CRON_SECRET` dla crona raportu.

**Wzorzec dostępu do danych:** cały dostęp przez server-side kod z service_role (`createSupabaseAdmin`), autoryzacja egzekwowana w kodzie na bazie sesji (`requireUser`/`requireOwner`). RLS włączone jako backstop. Anon key tylko do auth (login/signup/getUser).

## Co to jest

Platforma operacyjna SaaS dla agentów nieruchomości w Polsce. Codzienne miejsce pracy agenta z dashboardem, notatkami, planem dnia, integracją kalendarza Google, rankingiem agentów (KPI/umowy), i flagowym modułem **AI Coach** (trening cold calli z AI klientem, scoring, feedback po polsku).

**Decyzja zakupu:** właściciel biura. **Użytkownicy:** agenci. **Cena startowa:** 299 zł/mc/biuro do 10 agentów. **Klient zero:** biuro nieruchomości Spectra w Krakowie (biuro ownera).

Pełny kontekst i plan w `~/spectra-research/` (pliki 01-07).

## Stack

- **Framework:** Next.js 16 z App Router (Turbopack)
- **Język:** TypeScript
- **Style:** Tailwind CSS 4
- **UI komponenty:** docelowo shadcn/ui (dodamy gdy potrzeba)
- **Ikony:** docelowo Lucide React
- **Hosting:** Vercel (auto-deploy z main branch)
- **DB / Auth / Storage:** Supabase (jeszcze nie podłączone, będzie w Fazie 2)
- **AI (przyszłość):** Anthropic Claude (logika), OpenAI Whisper (STT PL), ElevenLabs (TTS PL), Vapi (real-time voice)
- **Płatności (przyszłość):** Stripe lub Tpay

## Zasady kodowania

- **Teksty UI:** zawsze po polsku (Twój target to polskie biura RE)
- **Komentarze w kodzie:** po polsku, ale tylko gdy WHY jest nieoczywiste
- **Kod (nazwy zmiennych, funkcji):** po angielsku
- **Server Components by default** — Client Components (`"use client"`) tylko gdy faktycznie potrzeba interaktywności
- **Mobile-first** — większość właścicieli biur sprawdza na telefonie
- **Mała, prosta architektura** — unikamy abstrakcji których nie potrzebujemy jeszcze
- **Bez TODO/FIXME** — albo robimy, albo zostawiamy zadanie w Linear/Notion (gdy będzie)

## Czego nie robić bez konsultacji

- Nie instaluj losowych npm packages — pytaj zanim dodasz dependency
- Nie zmieniaj struktury folderów (`src/app/`) bez konsultacji
- Nie commituj kluczy API / secretów do repo (używamy `.env.local` i Vercel Environment Variables)
- Nie pisz testów na każdy plik — testujemy tylko krytyczną logikę (logikę AI, płatności, autoryzację)

## Owner — kontekst

Wiktor jest właścicielem biura nieruchomości Spectra w Krakowie. **Początkujący w kodowaniu** — wyjaśniaj koncepty po polsku, prosto, bez snobizmu technologicznego. Jego siła to: znajomość branży RE, sieć kontaktów, doświadczenie sprzedażowe.

**Język rozmowy:** polski.

## Roadmap funkcji (chronologiczne)

1. **Landing page + waitlist** (TERAZ) — strona z formularzem zapisu, sekcje Problem/Rozwiązanie/Cennik
2. **Auth + multi-tenant** (Faza 3 sprint 1) — logowanie email/hasło, konta agencji, zapraszanie agentów
3. **AI Coach text** (Faza 3 sprint 2) — 5 scenariuszy, chat z AI klientem (tekstowo)
4. **AI Coach voice** (Faza 3 sprint 3) — Whisper + ElevenLabs + Vapi
5. **Scoring + dashboardy** (Faza 3 sprint 4) — feedback per sesja, ranking agentów, statystyki biura
6. **Płatności** (Faza 3 końcówka) — Stripe/Tpay, plan 299 zł/mc
7. **Notatki i plan dnia** (post-launch) — codzienne use case
8. **Integracja kalendarza Google** (post-launch)
9. **Tracking umów + KPI** (post-launch)

## Workflow

- Każda zmiana w kodzie → commit → push do main → Vercel auto-deploy w ~30 sek
- Branch strategy: na razie tylko `main` (jesteśmy solo)
- Gdy będzie zespół: feature branches + PR review

## Jak ze mną rozmawiać

- Mów po polsku, normalnie
- Daj kontekst: cel, ograniczenia, dla kogo
- Jeśli czegoś nie rozumiesz w moim kodzie — pytaj, wyjaśnię
- Małe zmiany przez Cursor inline (Cmd+K), większe przez sesję Claude Code w terminalu

