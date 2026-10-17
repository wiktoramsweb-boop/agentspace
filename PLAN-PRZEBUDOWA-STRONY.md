# Plan przebudowy strony agentspace.pl (2026-10)

Cel: strona, która robi takie samo wrażenie jak estify.ai (ruch, przejścia, opowiadanie przewijaniem),
ale mówi o NASZYCH mocnych stronach i nie wygląda jak ich kopia.

## 0. Zasady, których się trzymamy

- **Inspiracja techniką, nie kopiowanie.** Bierzemy sposoby animacji (przypięte sekcje, odsłanianie słów,
  rozszerzające się zdjęcie, karty nakładające się przy przewijaniu). Nie bierzemy ich tekstów, układu
  sekcja w sekcję, kolorów ani nazw. Kod piszemy sami.
- **Inna kolorystyka niż Estify.** Oni mają ciemną leśną zieleń (#003D1F) z miętą. My zostajemy przy naszej
  zieleni z logo, ale tło ciemnych sekcji robimy grafitowo-granatowe (np. #0B1220), żeby nikt nie pomylił marek.
- **Tylko prawdziwe liczby i opinie** (UOKiK/Omnibus). Liczby sprawdzone w kodzie: 11 wzorów umów i pism, 8 ról,
  7 dni za darmo. Liczbę scenariuszy AI Coacha policzę w bazie przed publikacją. Opinie tylko z `lib/marketing/opinie.ts`.
- **Bez nowych paczek npm.** Mamy już `motion` i `lenis`. Resztę piszemy jak Estify: jeden pętla
  `requestAnimationFrame` i zwykły CSS.
- **Ograniczony ruch.** Każda animacja ma wersję statyczną dla `prefers-reduced-motion` i dla telefonu
  (na telefonie nic się nie przypina, obrazy stoją przy swoich akapitach).
- **Szybkość.** LCP poniżej 2,5 s, CLS 0, obrazy przez `next/image` (AVIF/WebP), loader najwyżej 1,2 s
  i tylko przy pierwszej wizycie.

## 1. Gdzie jesteśmy lepsi (o tym ma krzyczeć strona)

| Temat | AgentSpace | Estify (stan z ich strony i dema) |
|---|---|---|
| Trening rozmów głosem z AI | działa: rozmowa głosowa, ocena, kluczowe momenty, trening na własnej ofercie | „Tryb głosowy: wkrótce”, tylko czat |
| Umowy i pisma | 11 wzorów, najem okazjonalny, PDF z danych klienta | brak |
| Prowizje i wypłaty agentów | transakcje, podział, wypłaty, mapa | brak (tylko „prowizja naliczona” w powiadomieniu) |
| Koszty i wynik biura | koszty, stałe opłaty, wynik po wypłatach, paczka dla księgowej | brak |
| Role, uprawnienia, dziennik zdarzeń | 8 stanowisk, ukryte kontakty, dziennik bez kasowania | brak w opisie |
| Cennik | jawne ceny | „Indywidualnie” |
| Skąd się wzięło | rozwijane w działającym biurze Spectra | szukają dopiero pierwszych 20 biur |

Ich przewagi (ważne dla produktu, nie dla tej przebudowy): sekretarka głosowa odbierająca telefony,
wycena na cenach z aktów notarialnych, eksport na portale, link off-market. Osobna decyzja na później.

## 2. Nowy układ strony głównej

Każda sekcja: co pokazuje + jaka animacja.

1. **Loader** (tylko pierwsza wizyta): znak AgentSpace wjeżdża od dołu, cienki pasek postępu u góry,
   ekran odjeżdża w górę. Pomijany przy powrocie (sessionStorage) i przy ograniczonym ruchu.
2. **Nawigacja**: przezroczysta, po przewinięciu rozmyte tło. Pasek postępu czytania u góry.
   Na telefonie menu pełnoekranowe odsłaniane od góry.
3. **Hero**: duży nagłówek wjeżdżający linijka po linijce. Pod nim prawdziwy zrzut aplikacji w ramce
   przeglądarki, na starcie pochylony w 3D, prostuje się przy przewijaniu. Dwie pływające karty z paralaksą:
   „Klient AI: rozmowa trwa” z falą dźwięku oraz karta nowego leada. Przyciski: „Wypróbuj 7 dni” i „Zobacz demo”.
4. **Manifest**: jedno mocne zdanie o problemie biura, słowa zapalają się kolejno przy przewijaniu.
5. **AI Coach** (nasz najmocniejszy temat, pierwszy po hero): sekcja przypięta, po lewej 3 kroki
   (dzwoni klient AI, ocena w 4 obszarach, Twoje zdania i lepsza wersja), po prawej obraz zmienia się
   razem z krokiem. Liczniki ocen animowane od zera. Na telefonie obraz nad każdym akapitem.
6. **Dzień agenta**: te same 4 pory dnia co dziś (8:30, 12:10, 15:40, 18:00), ale jako przypięta oś czasu
   ze zdjęciami z Nano Banana, zegar przewija się z sekcją.
7. **Rozszerzające się zdjęcie**: kadr zespołu przy stole, zaczyna jako zaokrąglone okno i rośnie do całego
   ekranu, na nim hasło dla właściciela.
8. **Dla właściciela**: karty z prawdziwymi ekranami (koszty i wynik, prowizje z mapą, dziennik, uprawnienia,
   urlopy). Każda karta odsłania się przycięciem z dołu.
9. **Moduły**: przypięta sekcja z zakładkami, przewijanie przełącza moduł (CRM, oferty, tablica transakcji,
   umowy, prowizje, kalendarz, czat, automatyzacje), pod zakładką pasek postępu. Klik w zakładkę przewija.
10. **Liczby**: przypięta sekcja z wielkimi liczbami, każda wjeżdża z dołu: 11 wzorów umów, 8 ról,
    liczba scenariuszy rozmów (z bazy), 0 zł za eksport bazy. Tylko liczby, które da się sprawdzić w kodzie.
11. **Porównanie**: tabela „Typowy CRM / Osobne narzędzia / AgentSpace”. Kategorie, nie nazwy firm,
    i tylko funkcje, które mamy naprawdę. Wiersze wjeżdżają kolejno.
12. **Jak zacząć**: 3 karty nakładające się przy przewijaniu (każda poprzednia lekko maleje i ciemnieje):
    załóż konto, przenieś bazę z Excela, zaproś zespół.
13. **Cennik**: jawne ceny (to nas wyróżnia), karta polecana wyróżniona kolorem, lekkie uniesienie na hover.
14. **FAQ**: rozwijanie płynne (grid-template-rows), ikona plus obraca się w krzyżyk.
15. **Wezwanie do działania**: ciemny blok z formularzem e-mail, lekko rośnie przy wjeździe.
16. **Stopka**: na dole ogromny napis „agentspace” wysuwający się przy dojściu do końca, przycisk „do góry”.

Dodatki na komputerze: własny kursor (kropka rośnie nad linkami) i przyciski „magnetyczne”.
Na urządzeniach dotykowych wyłączone.

## 3. Materiały do przygotowania

**Prawdziwe zrzuty aplikacji (robię ja):** z konta demo, w przeglądarce 2x, jasny motyw:
pulpit, AI Coach w trakcie rozmowy, ocena po rozmowie, karta klienta, tablica transakcji, prowizje z mapą,
generator umowy, koszty i wynik, dziennik zdarzeń, kalendarz. Wcześniej uzupełnię dane demo, żeby ekrany
wyglądały pełno (bez „brak danych”).

**Zdjęcia z Nano Banana (robisz Ty), proponowane kadry:**
1. Agentka w samochodzie nagrywa głosówkę po prezentacji (pora 12:10), 4:5.
2. Zespół przy stole, laptop z aplikacją, szeroki kadr 16:9 (do rozszerzającego się zdjęcia).
3. Agent z telefonem przy oknie, trening rozmowy, 4:5.
4. Właściciel biura przy biurku z wykresem na monitorze, 4:5.
5. Podpisywanie umowy przy stole, dłonie i dokument, 16:9.
Masz już 7 zdjęć w `public/zdjecia/nowe`, część z nich wykorzystamy ponownie.

## 4. Jak to zbudujemy technicznie

- Treści zostają w `lib/marketing/strona-glowna.ts` (PL i EN), sekcje jako Server Components.
- Ruch w małych komponentach klienckich w `app/components/ruch/`:
  `Loader`, `LinijkiNaglowka`, `SlowaManifestu`, `HistoriaPrzypieta`, `RozszerzaneZdjecie`,
  `ZakladkiPrzypiete`, `LiczbyPrzypiete`, `KartyStos`, `KursorMagnetyczny`, `NapisStopki`.
- Jeden wspólny kontroler przewijania (jedna pętla rAF, odczyt pozycji raz na klatkę), zamiast
  osobnych nasłuchów w każdym komponencie. Lenis do płynnego przewijania tylko na komputerze.
- Wszystko animowane przez `transform` i `opacity` (bez zmian layoutu), `will-change` tylko w trakcie.
- Testy: zrzuty w przeglądarce na 1440, 1024, 390 i 360 px, oba motywy, ograniczony ruch,
  Lighthouse wydajność min. 90 na telefonie.

## 5. Kolejność prac (każdy etap kończy się wdrożeniem)

1. **Fundament ruchu**: kontroler przewijania, loader, nawigacja, kursor, przyciski, pasek postępu.
2. **Hero + manifest** z prawdziwym zrzutem i pływającymi kartami.
3. **AI Coach + Dzień agenta** (sekcje przypięte, wersje na telefon).
4. **Zrzuty aplikacji**: dane demo + zestaw zrzutów, podmiana makiet.
5. **Rozszerzające się zdjęcie, właściciel, moduły, liczby.**
6. **Porównanie, jak zacząć, cennik, FAQ, stopka.**
7. **Szlif**: wersja EN, wydajność, dostępność, SEO, zrzuty kontrolne, wdrożenie.

Podstrony (`/produkt`, `/dla-agentow`, `/dla-wlascicieli`, `/cennik`) dostaną te same klocki w drugiej kolejności.

## 6. Część druga: przebudowa samej aplikacji (na wzór panelu Estify)

Co u nich działa lepiej i co przenosimy (po naszemu, w naszych kolorach):

1. **Pulpit jako „Priorytety na dziś”**: pas 3-4 najważniejszych spraw z oceną klienta (pierścień 0-100,
   gorący / ciepły / zimny), a pod nim panel wybranej sprawy: etapy lejka, zadania z podpowiedzią,
   karta klienta i akcje (zadzwoń, WhatsApp, e-mail, notatka). Dziś nasz pulpit to kafelki z liczbami.
2. **Zadania etapowe**: każdy etap transakcji ma swoją listę (wymagane / opcjonalne, „odblokuje się po”),
   a domknięcie etapu proponuje przejście dalej albo przypomnienie za 3/7/14 dni.
3. **Okno zadania zamiast przechodzenia między ekranami**: klik w zadanie otwiera okno z tym, co potrzebne
   (umowa, termin w kalendarzu, oferty do wysłania), bez wychodzenia z pulpitu.
4. **Asystent w każdym widoku**: pływający przycisk AI z kontekstem ekranu (klient, oferta), historia rozmów.
5. **Pasek startu (onboarding)**: kroki konfiguracji z postępem i podpowiedziami, zwijany.
6. **Porządek w menu**: grupy (Codziennie, AI, Sprzedaż, Oferty, Biuro, Szkolenia), mniej pozycji na wierzchu,
   dolny pasek na telefonie z pięcioma pozycjami.
7. **Spójny wygląd**: jeden zestaw kart, przycisków, odstępów i kolorów stanu na wszystkich ekranach.
8. **Osiągnięcia**: mapa funkcji programu z punktami, żeby agent odkrywał moduły sam.

Funkcje, których nie mamy, do decyzji osobno (każda to większy projekt):
- sekretarka głosowa odbierająca nieodebrane telefony (ElevenLabs + numer telefonu),
- link off-market do oferty ze śledzeniem wejść (mamy strony ofert, brakuje śledzenia i wyłączania),
- eksport na portale (Otodom, OLX),
- wycena na danych z Rejestru Cen Nieruchomości.

Kolejność: najpierw 1-3 (pulpit, zadania etapowe, okna zadań), potem 6-7 (menu i wygląd), potem reszta.

**Stan (16.10.2026):** zrobione 1 (Priorytety na dziś, `lib/priorytety.ts` + test `npm run test:priorytety`),
2 (kroki etapu liczone z danych CRM, bez nowej tabeli), 3 (notatka, przypomnienie i spotkanie w oknach na pulpicie),
4 (asystent AI na każdym ekranie, `/api/assistant/chat`, kredyt `asystent_czat`), 5 (był: baner „Pierwsze kroki”),
6 (menu w grupach Dziś / Sprzedaż / Dokumenty i oferty / Rozwój / Biuro + dolny pasek na telefonie).
7 częściowo (sortowanie obok filtrów na wszystkich listach, krótsze wiersze działań, miejsce pod przycisk asystenta).
Zrzuty aplikacji na stronie zrobione od nowa 17.10 (demo ma już transakcje z bieżącego miesiąca i w toku).
8 zrobione: /app/osiagniecia (mapa programu z punktami, lib/osiagniecia.ts).
Z listy „Funkcje, których nie mamy”:
- wycena z RCN: zrobiona, /app/wycena-rcn (usługa WFS GUGiK, lib/rcn.ts + lib/rcn-wycena.ts, test npm run test:rcn),
- sekretarka głosowa: zrobiona jako „Dyżur AI”, /app/ustawienia/dyzur + webhook /api/dyzur/glos (Twilio, TwiML bez SDK,
  test npm run test:dyzur). Do uruchomienia u biura: numer w Twilio, TWILIO_AUTH_TOKEN w Vercel, przekierowanie z komórki.
Strona (17.10): własny układ zamiast kopii Estify (rozdziały 01-05), podstrony w tym samym stylu przez wspólne
SiteNav/SiteFooter/PageHero (app/components/ld/rama.tsx, podstrony.css).
Po przebudowie robię zrzuty aplikacji od nowa i podmieniam je na stronie.
