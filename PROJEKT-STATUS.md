# AgentSpace — pełny status projektu (handoff)

> Ten dokument to kompletny zapis projektu do przekazania nowej sesji Claude.
> Czytaj razem z `CLAUDE.md` (architektura + zasady). Aktualne na koniec sesji budowy gamifikacji/AI-writer/onboarding.

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
