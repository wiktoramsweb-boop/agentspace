# AgentSpace: co już jest, czego brakuje

Analiza pod cel: **wygrać z konkurencją tym, że to jest narzędzie do codziennej
pracy, a nie baza ofert z doklejonym CRM-em.** Stan na 1 października 2026,
spisany z kodu, nie z pamięci.

---

## 1. Co już jest (21 modułów + osobny produkt „strony www")

**Pętla dnia agenta**
- Pulpit (role-aware), AI Asystent Dnia (3 priorytety)
- Działania: telefony, spotkania, zadania, wątki rozmów pod jednym numerem
- Kalendarz: oś czasu, widok miesiąca, przeciąganie wpisów
- Szybki wpis: notatka głosem, model rozbija ją na działanie i kontakt
- Cele: lejek roczny → dzienny, plan tygodnia, gamifikacja (XP, passa, odznaki)
- AI Coach: 13 scenariuszy, 9 osobowości, scoring

**Sprzedaż**
- Klienci: karty, notatki, pipeline, korespondencja, AI pisze follow-upy
- Nieruchomości: kreator z polami osobnymi dla 10 typów (1401 pól), zdjęcia ze
  znakiem wodnym, dokumenty, zakładki, karta transakcji przy ofercie
- Poszukiwania: wymagania kupującego i automatyczne dopasowanie do ofert
- Analiza cenowa: wycena z porównań i wskaźników rynkowych (GUS, RCN)
- Opisy: generator opisu ogłoszenia + tłumaczenie na angielski
- Ofertówka, Oferta współpracy, Umowa rezerwacyjna: gotowe PDF-y
- Prowizje: transakcje, podział prowizji, karta transakcji z etapami
- Kalkulatory: rata, zdolność, koszty zakupu

**Finanse i biuro**
- Faktury (wystawianie, edycja, PDF), Kalkulator podatkowy
- Zespół: role, ranking, zapraszanie, usuwanie z przepisaniem dorobku do puli biura
- Ustawienia: firma, znak wodny, strona www, konto demo

**Poza aplikacją**
- Strony internetowe dla biur: 8 wzorów, własne domeny, dodatek płatny osobno
- PWA, powiadomienia push, raport miesięczny i poranna odprawa (cron)

**Wniosek:** jak na produkt przed sprzedażą, zakres jest duży. Problem nie leży
już w liczbie modułów.

---

## 2. Czego brakuje, uporządkowane według tego, co faktycznie blokuje

### Poziom 0: bez tego nie sprzedasz ani jednej licencji

| Czego brak | Dlaczego to blokuje |
|---|---|
| **Płatności i subskrypcja** | Nie ma jak pobrać 299 zł/mc. Dziś sprzedaż kończy się przelewem na podstawie faktury wystawionej ręcznie. |
| **Import danych z ASARI i Excela** | Biuro ma 300 ofert i 2000 kontaktów. Bez importu nikt się nie przeniesie, choćby produkt był lepszy. To jest **największa pojedyncza bariera wejścia** i jednocześnie najtańsza do zbicia. |
| **Eksport na portale** | Agent doda ofertę u nas, a potem i tak przepisze ją ręcznie na Otodom. Dopóki tak jest, AgentSpace jest *dodatkową* pracą, nie zastępuje niczego. |

O eksporcie osobno, bo to nie jest jedna sprawa:
- **Otodom i OLX** wymagają konta Pro i umowy partnerskiej. To fosa ASARI i nie
  przeskoczymy jej kodem.
- **Nieruchomości-online, Gratka, Morizon** przyjmują plik XML spod adresu URL.
  To da się zrobić teraz, bez niczyjej zgody. Słowniki mamy już zgodne z Otodom,
  więc mapowanie to głównie robota tłumaczeniowa.
- **Wniosek:** zacząć od feedu XML dla portali, które go przyjmują. Da to realną
  oszczędność czasu i argument sprzedażowy, zanim ruszy rozmowa z Otodom.

### Poziom 1: bez tego agent i tak wychodzi do innego narzędzia

| Czego brak | Co się dzieje bez tego |
|---|---|
| **Synchronizacja kalendarza (Google, Outlook)** | Agent ma spotkania w kalendarzu telefonu. Nasz kalendarz staje się drugim kalendarzem, czyli martwym. To podważa cały pomysł „tu pracujesz". |
| **Poczta i skrzynka na zapytania** | Usunęliśmy Asystenta mailowego i słusznie, bo był zrobiony pod Twoją skrzynkę. Ale potrzeba została: agent wysyła oferty mailem i dostaje odpowiedzi, a CRM o tym nie wie. Sprzedawalna wersja to podpięcie **własnej skrzynki biura** (IMAP/SMTP), nie naszej. |
| **Zapytania z portali w jednym miejscu** | Leady z Otodom przychodzą mailem. Dziś nikt ich nie wciąga do CRM. ASARI ma to pod nazwą „Zapytania ofertowe" i to jest codziennie używany ekran. |
| **Podpis elektroniczny** | Generujemy PDF umowy, a potem drukarka, skan, odesłanie. Autenti albo DocuSign skraca to do jednego linku. |
| **Rejestr połączeń** | Agent dzwoni z komórki, a działanie wpisuje ręcznie. Szybki wpis to łagodzi, ale nie rozwiązuje. |

### Poziom 2: tym realnie wygrywasz z konkurencją

| Pomysł | Dlaczego to przewaga |
|---|---|
| **Moduł pozyskiwania** | Codzienna praca agenta to szukanie ogłoszeń od właścicieli i dzwonienie. Mamy AI Coach do treningu cold callingu, ale **nie mamy listy, do kogo dzwonić**. Monitoring ogłoszeń prywatnych, kolejka do obdzwonienia, status pozysku, przypomnienie „wróć za miesiąc". Nikt w Polsce nie robi tego dobrze, a to jest dokładnie ten rodzaj narzędzia, od którego agent zaczyna dzień. |
| **MLS i wymiana ofert między biurami** | Większość biur należy do jakiegoś MLS. Jeśli AgentSpace będzie to obsługiwał, przestaje być wyborem jednego agenta, a staje się wyborem środowiska. |
| **Raporty dla właściciela** | Jest panel i raport miesięczny, ale brakuje tego, co właściciel naprawdę chce wiedzieć: lejek konwersji pozysk → umowa → transakcja, źródła leadów, zwrot z wydatków na portale, prognoza przychodu na kwartał. **Decyzję o zakupie podejmuje właściciel, więc to jest ekran sprzedażowy.** |

### Poziom 3: dopieszczenie, gdy pierwsze biura będą płacić

- Obsługa najmu: czynsze, terminy, przedłużenia, rozliczenia mediów
- Podgląd księgi wieczystej po numerze i planu miejscowego
- Baza wiedzy: wzory umów, checklisty transakcji, pytania do klienta
- Delegowanie zadań z terminami i eskalacją
- Głos AI w Coachu (dziś mówi agent, klient odpowiada tekstem)

---

## 3. Jedno ostrzeżenie do strategii „wszystko tu będzie"

Zakres sam w sobie nie wygrywa. Każdy dołożony moduł to moduł, który trzeba
utrzymywać i który musi być **lepszy od narzędzia dedykowanego**, bo inaczej
agent i tak go ominie. Przy 21 modułach to już realne ryzyko.

Linia podziału, która się broni:

- **Budujemy sami** wszystko, co dotyka pętli: lead → kontakt → oferta →
  prezentacja → transakcja → prowizja. Tu musimy być najlepsi, bo to jest
  produkt.
- **Integrujemy, nie przepisujemy**: poczta, kalendarz, podpis, księgowość,
  telefonia. Tu wystarczy, że dane przepływają w obie strony. Próba napisania
  własnego klienta poczty czy własnej księgowości skończy się czymś gorszym od
  Gmaila i wFirmy, za to będzie zabierać miesiące.

Zdanie, którym to sprzedajesz, nie brzmi „mamy wszystko". Brzmi:
**„agent nie wychodzi stąd przez cały dzień, a właściciel pierwszy raz widzi,
co się naprawdę dzieje w biurze".**

---

## 4. Proponowana kolejność

1. **Import danych** (ASARI, Excel, CSV) - zbija barierę wejścia, tanie
2. **Płatności** - bez tego nie ma przychodu
3. **Feed XML na portale, które go przyjmują** - pierwszy realny „oszczędzam czas"
4. **Synchronizacja kalendarza** - domyka „tu pracuję"
5. **Skrzynka zapytań + podpięcie własnej poczty biura**
6. **Raporty dla właściciela** - ekran, który sprzedaje
7. **Moduł pozyskiwania** - przewaga, której nie ma konkurencja
8. Reszta według tego, czego zażądają pierwsze płacące biura

Punkty 1-3 są warte zrobienia zanim pójdziesz na pierwszą rozmowę handlową.
Punkty 4-6 zanim podpiszesz trzecie biuro. Punkt 7 wtedy, gdy produkt już się
utrzymuje, bo to najdroższa pozycja na liście.
