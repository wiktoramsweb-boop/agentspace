# Analiza całej aplikacji AgentSpace (1 października 2026)

## ✅ Status poprawek (stan na koniec 1 października 2026)

**Naprawione w kodzie:** punkty 1, 2, 3, 4, 5, 6, 7, 8, 9 (bez licznika odsłon), 10, 11, 12, 13, 15, 16 (limity i błędy), 18, 22, 23 i 26 (dokumentacja). Przy okazji znalazłem i naprawiłem jeszcze jeden wyciek: listy klientów do wyboru w formularzach wysyłały do przeglądarki telefony wszystkich klientów biura, nawet przy włączonym ukrywaniu kontaktów. Doszedł też test uprawnień (`npm run test:uprawnienia`).

**Wymaga Twojego działania:**
- Uruchomić w Supabase `lib/SETUP-v34-limity.sql`. Bez tego limity nie działają, ale nic się nie psuje.
- Sprawdzić w Vercel, czy jest `CRON_SECRET`. Bez niego raport miesięczny i poranna odprawa będą teraz odmawiać.
- Zrotować klucze API (pkt 25) i potwierdzić, które migracje są uruchomione.

**Do Twojej decyzji (świadomie nie ruszałem):**
- Pkt 14: harmonogram przypomnień (Vercel Pro albo cron-job.org).
- Pkt 17: zmiana modelu AI. Wymaga przeróbki pięciu wywołań i testu z prawdziwym kluczem.
- Pkt 24: adres e-mail w domenie zamiast gmaila.
- Pkt 21 (waga stron) i brakujące funkcje (płatności, dziennik zmian, eksport danych) to osobne większe zadania.
- Polityka prywatności jest zaktualizowana, ale warto, żeby przejrzał ją prawnik.

---

## Jak sprawdzałem

- **Kod:** cały projekt (527 plików): 20 endpointów API, 26 plików akcji serwera, 33 migracje SQL, strony aplikacji i marketingu.
- **Automatyczne sprawdzenia:** build produkcyjny, TypeScript, ESLint, 4 zestawy testów projektu, `npm audit`.
- **Przeglądarka (Chromium):** zbudowana aplikacja uruchomiona lokalnie, automatyczne przejście przez 326 publicznych stron na szerokości telefonu (390 px). Sprawdzane: błędy, linki, zdjęcia, nagłówki, SEO, przewijanie w bok, waga stron.

**Czego nie dało się sprawdzić:** to środowisko blokuje połączenia z `agentspace.pl` i z Supabase. Dlatego produkcji nie oglądałem na żywo, a części po zalogowaniu (`/app`) nie przeklikałem. Ją sprawdziłem wyłącznie w kodzie. Żeby to dokończyć, trzeba dodać `agentspace.pl` i `*.supabase.co` do dozwolonych domen w ustawieniach środowiska i dać mi konto testowe (najlepiej demo).

## Wynik w skrócie

Podstawy są w dobrym stanie. Build przechodzi, TypeScript nie ma błędów, wszystkie testy przechodzą. Na 323 publicznych stronach nie ma zepsutego linku ani zdjęcia, a każda tabela w bazie ma włączone RLS. Wymaga natomiast uwagi:

- **3 sprawy pilne** (bezpieczeństwo i pieniądze),
- **8 problemów z uprawnieniami i bezpieczeństwem**, które warto domknąć przed sprzedażą obcym biurom,
- **kilka błędów działania** (strefa czasowa, karta transakcji, strona błędu, przełącznik języka).

---

## 🔴 PILNE (zrobić jak najszybciej)

### 1. Next.js ma krytyczne luki bezpieczeństwa
Wersja `next 16.2.9` ma opublikowane krytyczne luki, w tym **zdalne wykonanie kodu** w optymalizacji obrazów (`next/image`) i w generatorze obrazków `next/og`. Projekt używa obu: `app/opengraph-image.tsx`, `lib/og-image.tsx` i 28 plików z `next/image`. Do tego dochodzi obejście middleware (to on chroni `/app`) i kilka luk typu DoS/SSRF.
**Poprawka:** aktualizacja do `next@16.3.8` razem z `eslint-config-next@16.3.8`, potem build i testy. Ta sama aktualizacja usuwa luki w `postcss` i `sharp`.

### 2. Zadania cron może uruchomić każdy, jeśli brak `CRON_SECRET`
`/api/cron/monthly-report`, `/api/cron/morning-brief` i `/api/cron/task-reminders` sprawdzają hasło tylko wtedy, gdy `CRON_SECRET` jest ustawiony (w dokumentacji opisany jako „opcjonalny”). Bez niego każdy w internecie może je wywoływać w kółko: wysyłać raporty mailem do wszystkich właścicieli i powiadomienia push do wszystkich agentów.
**Poprawka:** ustawić `CRON_SECRET` w Vercel (Vercel sam go dołącza do swoich cronów) i zmienić kod tak, żeby **bez sekretu odmawiał** zamiast przepuszczać.

### 3. Otwarta rejestracja + AI bez limitów = rachunek na Twoim koncie
- `/signup` zakłada konto od razu, bez potwierdzenia maila, captchy i limitu (`app/auth/actions.ts`).
- Każde nowe biuro dostaje wszystkie funkcje AI na **Twoim** kluczu Anthropic.
- Endpointy AI (`/api/opis/generate`, `/api/opis/tlumacz` do 6000 tokenów, `/api/assistant/*`, `/api/quick-entry/parse`, AI Coach) nie mają limitów dziennych ani długości wiadomości. Tygodniowy limit działa tylko w AI Coach i domyślnie jest wyłączony.
- Gdy skończą się środki, AI przestaje działać także w Spectrze. AI Coach pokaże wtedy zwykły błąd serwera, bo `anthropic.messages.create` w `app/api/coach/message/route.ts:82` nie jest w `try`.

**Poprawka:** dzienny limit wywołań AI na osobę i na biuro, limit długości tekstu. Rejestracja na zaproszenie albo z potwierdzeniem maila i captchą. Limit wydatków w console.anthropic.com. Czytelny komunikat „AI chwilowo niedostępne”.

---

## 🟠 WAŻNE: uprawnienia i bezpieczeństwo

### 4. „Ukryj kontakty agentom” działa tylko na listach
Opcja maskuje numery na listach (klienci, działania, kalendarz, wyszukiwarka). Wystarczy jednak kliknąć w klienta: karta `/app/klienci/[id]` pokazuje pełny telefon i e-mail (`page.tsx:169-184`). Tak samo jest z numerem właściciela na karcie oferty (`nieruchomosci/[id]/page.tsx:226`). Ustawienie obiecuje ochronę, której faktycznie nie ma.

### 5. Każdy agent może usunąć cudzego klienta lub ofertę
Usuwanie wielu pozycji naraz jest tylko dla CEO i menedżera (`app/app/bulk-actions.ts:147`). Pojedyncze `deleteClient` (`klienci/actions.ts:174`) i `deleteProperty` (`nieruchomosci/actions.ts:375`) pozwalają jednak każdemu agentowi skasować **dowolnego** klienta lub ofertę biura. Do tego `bulkAssignAgent` (`bulk-actions.ts:92`) pozwala agentowi przepisać cudzych klientów na siebie. Nie ma też śladu, kto co usunął.
**Do decyzji:** kto może usuwać i przepisywać. Moja propozycja: agent tylko swoje, CEO i menedżer wszystko, plus dziennik zmian.

### 6. Karta transakcji przy ofercie: cudze prowizje i zapis, który nic nie zapisuje
Zakładka „Karta transakcji” na ofercie (`nieruchomosci/[id]/transaction-tab.tsx`) pokazuje **wszystkie** transakcje tej oferty każdemu w biurze, razem z prowizją i podpisem „Twój zarobek”, nawet przy cudzej transakcji.
Gorzej, gdy ktoś inny niż opiekun (także CEO) edytuje taką kartę. Pokazuje się „Zapisano ✓”, ale nic się nie zapisuje, bo `updateTransactionCard` (`prowizje/actions.ts:96`) filtruje po `agent_id` i nie sprawdza, czy zmienił się choć jeden wiersz. **Zmiany giną po cichu.**

### 7. Menedżer widzi w Raportach pieniądze całego biura
Zasada brzmi: „menedżer widzi tylko swoich agentów, bez prowizji”. Zespół robi to dobrze. Raporty (`app/app/raporty/page.tsx:25`) blokują tylko agenta, więc menedżer widzi przychody i prowizje całego biura oraz wszystkich agentów.

### 8. Zapis przyjmuje identyfikatory z innego biura
Kilka formularzy nie sprawdza, czy podany klient, oferta lub agent należy do biura zapisującego:
- `createActivity` (`dzialania/actions.ts:42-52`) pobiera klienta po samym ID i **kopiuje jego imię i telefon**. Do tego przyjmuje `property_id` i `assignee_ids` bez sprawdzenia, przez co może podbić liczniki celów osobie z innego biura.
- `createDeal` (`prowizje/actions.ts:42-43`): `property_id`, `client_id`.
- Oferta: `owner_client_id` (`nieruchomosci/actions.ts:52`).

Ryzyko jest małe, bo trzeba znać długie losowe ID, ale poprawka to po jednym dodatkowym warunku `agency_id`.

### 9. Publiczne formularze i endpointy bez ochrony przed spamem
- Formularze na stronach biur (`app/strona/actions.ts`) nie mają pułapki na boty ani limitu. Każde zgłoszenie tworzy klienta, zadanie i **push do całego biura**, więc bot może zasypać CRM.
- `/api/geocode` i `/api/nearby` działają bez logowania i bez limitu. Każdy może przez nie odpytywać OpenStreetMap z adresu Twojego serwera. Nominatim pozwala na 1 zapytanie na sekundę i za nadużycia blokuje adres, a wtedy podpowiadanie adresów przestaje działać wszystkim.
- `trackView` pozwala nabić statystyki odsłon dowolnemu biuru.

### 10. Wstrzykiwanie HTML w maile powiadomień
Formularz kontaktowy (`app/api/contact/route.ts:79-83`) wkleja do maila imię, biuro, temat i źródło bez zabezpieczenia znaków HTML. Ktoś może podrzucić w Twojej skrzynce fałszywy link lub przycisk. To samo dotyczy imienia i nazwy biura w mailu z zaproszeniem.

### 11. Brak nagłówków bezpieczeństwa
`next.config.ts` jest pusty. Aplikację da się osadzić w ramce na obcej stronie, co otwiera drogę do podstępnych kliknięć. Warto dodać `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (mikrofon tylko dla własnej domeny).

---

## 🟡 BŁĘDY DZIAŁANIA

### 12. Brak polskiej strony błędu
W projekcie nie ma żadnego `error.tsx`. Gdy coś padnie (np. Supabase chwilowo nie odpowiada), użytkownik widzi angielskie „This page couldn't load / Reload”. Sprawdziłem to w przeglądarce na `/zaproszenie/...`. Trzeba dodać `app/app/error.tsx` i `app/global-error.tsx` po polsku, z przyciskiem „Spróbuj ponownie”.

### 13. Daty liczone w czasie UTC, nie polskim
Serwer działa w UTC, a w wielu miejscach „dziś” liczy się przez `toISOString().slice(0, 10)`. Komentarz w `lib/goal-calendar.ts:2` sam przyznaje, że dzienne wyniki w Celach są zapisywane po dacie UTC. Skutek: **między północą a 1:00/2:00 w nocy** „dziś” to jeszcze wczoraj, więc:
- telefon po północy wpada do poprzedniego dnia w Celach i może zepsuć passę,
- umowa rezerwacyjna (`reservation-creator.tsx:22`), aneks, protokół i zadanie dostają wczorajszą datę,
- „klienci do kontaktu dziś” są liczeni o przesuniętej godzinie.

`lib/datetime.ts` ma już gotowe funkcje dla Europe/Warsaw, wystarczy ich używać wszędzie (około 30 miejsc).

### 14. Przypomnienia o zadaniach nie chodzą same
`/api/cron/task-reminders` jest gotowy, ale nie ma go w `vercel.json`. Wciąż czeka decyzja: Vercel Pro albo darmowy cron-job.org co godzinę.

### 15. Przełącznik PL/EN i SEO
- W kodzie HTML przycisk **EN prowadzi na `/pl/cennik`** (polska wersja), a PL też na `/pl/...` (`lib/i18n/config.ts:103`, `switchLocaleHref` nie zdejmuje przedrostka `/pl`). Po załadowaniu JS kliknięcie zwykle działa, ale Google, „otwórz w nowej karcie” i ktoś z wolnym internetem trafiają źle. Google przez to widzi i indeksuje zdublowane adresy `/pl/*` (canonical ratuje sytuację tylko częściowo).
- `/login`, `/signup` i `/reset-hasla` mają `index, follow` i canonical wskazujący na stronę główną. Powinny mieć `noindex`.

### 16. AI Coach: drobne usterki
- Brak limitu długości wiadomości i liczby tur rozmowy.
- Dwie szybkie wiadomości naraz mogą zgubić jedną z nich w zapisie rozmowy (odczyt i zapis transkryptu bez blokady).
- Cache promptu obejmuje tylko krótką instrukcję systemową, a ta jest prawdopodobnie poniżej minimalnego rozmiaru cache'u, więc taniej nie wychodzi.

### 17. Model AI jest dwie generacje do tyłu
`lib/ai/client.ts` używa `claude-sonnet-4-5-20250929`. Model działa i nie jest wycofywany, ale obecny Sonnet 5.5 jest i lepszy, i tańszy ($2/$10 zamiast $3/$15 za milion tokenów).
⚠️ **Nie zmieniaj samego `ANTHROPIC_MODEL` w Vercel.** Pięć miejsc wymusza konkretne narzędzie (`tool_choice: {type: "tool"}`): `lib/ai/coach.ts:187` (ocena rozmowy), `lib/ai/assistant.ts:82`, `rezerwacja/klauzula`, `quick-entry/parse`, `oferta-wspolpracy/parse`. Nowe modele odrzucają to błędem, więc ocena w AI Coach przestałaby działać. Zmiana modelu wymaga drobnej przeróbki kodu. Dodatkowo rozmowa i ocena biorą model z tej samej zmiennej, więc nie da się ich ustawić osobno.

---

## 🔵 JAKOŚĆ KODU I WYDAJNOŚĆ

18. **ESLint: 61 błędów i 30 ostrzeżeń.** Głównie reguły Reacta (23× `set-state-in-effect`, 16× niedeterministyczny render, 18× niezabezpieczone cudzysłowy w tekście). Build ich nie sprawdza, więc nikt ich nie widzi, a przy czerwonym lincie łatwo przeoczyć nowy, prawdziwy błąd.
19. **Przestarzałe zależności:** `@anthropic-ai/sdk` 0.112 (jest 0.131), `@supabase/*`, `resend` 6.14 (jest 6.31), `marked`.
20. **Brak testów uprawnień.** Testy obejmują wycenę, słownik pól, kolory i import leadów. CLAUDE.md mówi, że autoryzacja to logika krytyczna do testowania, a punkty 4-8 pokazują, że jej brakuje.
21. **Waga stron:** około 870 KB JavaScriptu (przed kompresją) i 227 KB CSS na **każdej** stronie, także na `/login`. Wzory stron ładują około 620 KB czcionek. Jeden globalny arkusz łączy marketing, aplikację i ciemny motyw. Na telefonie w terenie (słaby zasięg) to odczuwalne.
22. **Leaflet z `unpkg.com`:** mapy zależą od zewnętrznego serwera, bez sprawdzania integralności pliku. Gdy unpkg ma awarię, znikają mapy w aplikacji i na stronach biur.

---

## ⚖️ PRAWNE I DOKUMENTACJA

23. **Polityka prywatności (aktualizacja 15 maja 2026) opisuje tylko listę oczekujących.** Brakuje w niej: kont w aplikacji, formularza kontaktowego, przetwarzania przez AI (Anthropic, USA, czyli przekazanie poza EOG), map (OpenStreetMap/CARTO/unpkg), powiadomień push i formularzy na stronach biur. Umowa powierzenia wymienia podwykonawców poprawnie. Politykę warto zaktualizować z prawnikiem przed sprzedażą obcym biurom.
24. **Kontakt na gmailu** (`nieruchomoscispectra@gmail.com`) w stopce i regulaminie produktu B2B. Lepiej adres w domenie.
25. **Klucze API do rotacji:** `PROJEKT-STATUS.md` (sekcja 9) wciąż ma to jako „do zrobienia” (Supabase service_role, Resend, Anthropic).
26. **Nieaktualne dokumenty:** CLAUDE.md pisze „Supabase jeszcze nie podłączone”, cenę 299 zł (cennik ma 499/899 zł) i stary roadmap. Nie wiadomo też, które migracje v2-v33 są uruchomione w Supabase. Trzeba to potwierdzić, bo kod po cichu pokazuje puste dane, gdy brakuje tabeli.

---

## 🧩 CZEGO BRAKUJE (produktowo)

- **Płatności i pakiety.** Cennik obiecuje różne pakiety (Start bez AI Coach, Pro z AI), a kod daje wszystko każdemu za darmo. To powiązane z punktem 3.
- **Automatyczne przypomnienia** (punkt 14) i **automatyczna wysyłka maili do klientów** (czeka na weryfikację domeny w Resend).
- **Dziennik zmian** (kto usunął lub przepisał klienta). Przy wspólnej bazie biura to podstawa zaufania.
- **Eksport danych biura** (CSV/kopia zapasowa). Wymóg RODO (przenoszenie danych) i argument przy sprzedaży: „nie jesteś uwiązany”.
- Już znane z planu: eksport na portale (Otodom), synchronizacja z Google Calendar, raport PDF z wyceny dla klienta.

---

## ✅ CO DZIAŁA DOBRZE

- Build produkcyjny OK, TypeScript 0 błędów, wszystkie 4 zestawy testów przechodzą.
- 323 publiczne strony bez błędów: 0 zepsutych linków i zdjęć, każda strona ma jeden nagłówek H1 i opis meta, zdjęcia mają opisy alt, a wzory stron mają poprawne `noindex`. Strona nie przewija się w bok na telefonie.
- RLS włączone na wszystkich 31 tabelach. Prywatny magazyn dokumentów z linkami ważnymi 2 minuty.
- Większość akcji poprawnie sprawdza biuro (faktury, klienci, oferty, dokumenty, zespół, sesje AI). Nie da się zdegradować ostatniego CEO, a zaproszenia i przypisania menedżerów są walidowane.
- Silnik wyceny jest przemyślany i odporny na wartości odstające.

---

## Proponowana kolejność

1. Aktualizacja Next.js (pkt 1) i `CRON_SECRET` (pkt 2): około godziny, największy zysk.
2. Limity AI i zabezpieczenie rejestracji (pkt 3).
3. Uprawnienia: punkty 4-8, plus testy, które ich pilnują.
4. Polska strona błędu, strefa czasowa, karta transakcji (pkt 6, 12, 13).
5. Spam i nagłówki (pkt 9-11), SEO i język (pkt 15).
6. Polityka prywatności, rotacja kluczy, porządek w dokumentacji.
7. Zmiana modelu AI (pkt 17), lint i zależności.
