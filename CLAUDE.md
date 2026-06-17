# AgentSpace

**Owner:** Wiktor Szostek (wiktoramsweb-boop on GitHub)
**Domena:** agentspace.pl
**Status:** Faza 1 — landing page i waitlist (przed MVP)

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

