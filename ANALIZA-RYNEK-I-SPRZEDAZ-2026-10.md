# AgentSpace: analiza konkurencji, rynku i sprzedaży

Stan na 14 października 2026. Wszystkie liczby o konkurencji pochodzą z ich
własnych cenników i stron, sprawdzonych tego dnia. Wszystkie liczby o nas
pochodzą z kodu, nie z pamięci.

---

## 1. Co mamy naprawdę

Przeliczone z repozytorium: **49 ekranów aplikacji, 10 modułów**.

**CRM i praca codzienna:** klienci z podziałem na typy, leady, poszukiwania,
wspólna baza nieruchomości z mapą i kartą „co w okolicy", kalendarz, działania
z raportem, zadania, pulpit dnia.

**Pieniądze:** prowizje z kalkulatorem VAT, karta transakcji (5 etapów plus
checklista 13 dokumentów), faktury, kalkulator podatkowy, kalkulatory kredytu,
kosztów zakupu i ROI najmu.

**Dokumenty:** umowa rezerwacyjna z prawdziwym PDF, protokół, aneks, ofertówka,
oferta współpracy, znak wodny na zdjęciach.

**AI:** Coach z 13+ scenariuszami i 9 osobowościami klienta, **rozmowa głosowa
przez telefon z oceną po zakończeniu**, asystent dnia, pisanie follow-upów
i obiekcji, asystent maili i SMS-ów, generator opisów ogłoszeń, szybki wpis
głosem.

**Zespół:** 8 ról z uprawnieniami nadawanymi per osoba, wielooddziałowość, cele
roczne schodzące do dziennych, gamifikacja, ranking, panel właściciela
z alertami „wymaga uwagi".

**Reszta:** portal klienta brandowany nazwą biura, strona www biura z 8 wzorami,
PWA z powiadomieniami push, import CSV, eksport całości do ZIP.

---

## 2. Konkurencja: ceny

Ceny netto miesięcznie, sprawdzone 14.10.2026.

| Dostawca | Model | 1 agent | 5 agentów | 10 agentów | 20 agentów |
|---|---|---|---|---|---|
| **ASARI** Business | za użytkownika, od 77 zł | 77 | 385 | 770 | 1 540 |
| **ASARI** Corporate | za użytkownika, od 131 zł, min. 6 | – | – | 1 310 | 2 620 |
| **Estatly** | za pakiet | 99 | 249 | 599 | 599 |
| **EstiCRM** | za biuro plus konta | 149 | 149 + dopłaty | 149 + dopłaty | 149 + dopłaty |
| **Galactica Virgo** | brak publicznego cennika | ~199? | ? | ? | ? |
| **AgentSpace** | za pakiet | 299 | 299 | 599 | 1 244 |

ASARI dolicza hosting powyżej 5 GB: 34 zł za każde kolejne 5 GB. Estatly daje
20% zniżki przy płatności rocznej, ASARI do 30% przy umowie.

**Wniosek cenowy, nieprzyjemny ale prawdziwy:**

1. Wobec ASARI jesteśmy **tańsi dla zespołów**. Przy 15 osobach ASARI Business
   kosztuje 1 155 zł, my 999 zł. Przy 20 osobach 1 540 zł wobec naszych 1 244 zł.
2. Wobec Estatly jesteśmy **drożsi wszędzie**, a przy dużym biurze ponad
   dwukrotnie. Ich Enterprise za 599 zł obejmuje nieograniczoną liczbę agentów.
3. Nasz pakiet Start za 299 zł nie ma sensu rynkowego. Estatly bierze za solo
   agenta 99 zł, EstiCRM 149 zł za biuro, ASARI 77 zł za użytkownika. Jesteśmy
   trzy razy drożsi od najtańszego i nie mamy czym tego uzasadnić przy jednym
   użytkowniku.

---

## 3. Konkurencja: funkcje

Legenda: ✅ ma, ❌ nie ma, ⚠️ ma częściowo.

| Funkcja | ASARI | EstiCRM | Virgo | Estatly | **AgentSpace** |
|---|---|---|---|---|---|
| **Eksport ofert na Otodom/OLX/Morizon/Gratka** | ✅ | ✅ | ✅ | ✅ | **❌** |
| MLS, wymiana ofert między biurami | ✅ ASGAL | ❌ | ❌ | ❌ | ❌ |
| CRM klientów, historia kontaktu | ✅ | ✅ | ✅ | ✅ | ✅ |
| Baza ofert z mapą | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kalendarz zespołu | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pipeline kanban z przeciąganiem | ❌ | ❌ | ⚠️ | ✅ 8 etapów | ⚠️ lejek bez kanbanu |
| Prowizje i rozliczenia | ✅ | ⚠️ | ✅ | ✅ | ✅ |
| Strona www biura | ✅ | ❌ | ❌ | ✅ 3 szablony | ✅ 8 wzorów |
| Portal klienta | ❌ | ❌ | ❌ | ✅ pod ich domeną | ✅ **pod nazwą biura** |
| Aplikacja mobilna PWA z push | ⚠️ | ⚠️ | ❌ | ✅ | ✅ |
| Czat zespołu | ❌ | ❌ | ❌ | ✅ | ❌ |
| Automatyzacje trigger → zadanie | ❌ | ❌ | ❌ | ✅ | ❌ |
| Zastępstwa i urlopy agentów | ❌ | ❌ | ❌ | ✅ | ❌ |
| Historia zmian ceny oferty | ❌ | ❌ | ❌ | ✅ | ❌ |
| Zgody RODO przy kliencie | ❌ | ❌ | ❌ | ✅ | ❌ |
| Kalkulator remontu | ❌ | ❌ | ❌ | ✅ | ❌ |
| Kalkulator kredytu z PDF | ❌ | ❌ | ❌ | ✅ | ✅ |
| Wysyłka maili z karty klienta | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ generator bez wysyłki |
| AI: opisy ogłoszeń | ❌ | ❌ | ❌ | ✅ | ✅ |
| AI: wycena nieruchomości | ❌ | ❌ | ❌ | ✅ z RCN | ❌ usunięte |
| AI: dopasowanie klient ↔ oferta | ❌ | ❌ | ❌ | ✅ | ❌ |
| **AI Coach: trening rozmów** | ❌ | ❌ | ❌ | ❌ | **✅** |
| **AI Coach: prawdziwa rozmowa głosowa z oceną** | ❌ | ❌ | ❌ | ❌ | **✅** |
| Cele, gamifikacja, ranking z treningiem | ❌ | ❌ | ❌ | ⚠️ sam ranking | **✅** |
| Faktury i kalkulator podatkowy | ❌ | ❌ | ❌ | ❌ | **✅** |
| Generator umów rezerwacyjnych | ❌ | ❌ | ❌ | ⚠️ 7 wzorów | **✅ z klauzulami AI** |
| Szybki wpis głosem ze spotkania | ❌ | ❌ | ❌ | ❌ | **✅** |
| Role i uprawnienia per osoba | ⚠️ | ⚠️ | ✅ | ⚠️ | **✅ 8 stanowisk** |
| Płatności online za abonament | ✅ | ✅ | ✅ | ✅ | **❌** |
| Darmowy eksport własnych danych | ❌ płatny | ❌ płatny | ? | ? | **✅** |

### 3.1 Jedna dziura, która przesądza o wszystkim

**Nie mamy eksportu ofert na portale ogłoszeniowe.** Sprawdziłem kod: nigdzie
nie ma generowania feedu XML dla Otodom, OLX, Morizon czy Gratki. Jedyne ślady
tych nazw to import leadów z plików CSV i nazewnictwo pól zgodne z Otodomem.

To nie jest brakująca funkcja na liście życzeń. To jest czynność, którą biuro
wykonuje codziennie i od której zależy jego przychód. Każdy konkurent to ma.
Dopóki tego nie mamy, biuro nie może nas użyć zamiast ASARI, może nas użyć
najwyżej obok ASARI. A to znaczy, że płaci za dwa systemy, czyli zrezygnuje.

Bariera przy tym jest umowna, nie techniczna. Feed XML to jest tydzień pracy.
Umowa z Otodomem na przyjmowanie feedu to jest proces biznesowy, który trzeba
zacząć teraz.

---

## 4. Dlaczego biuro miałoby do nas przejść

Uczciwie: samo „mamy więcej funkcji" nie wystarczy. Biuro, które pracuje na
ASARI od pięciu lat, ma tam bazę, nawyki i wyszkolony zespół. Przejście boli.
Potrzebny jest powód, który tę bolesność przewyższa.

**Powód pierwszy, jedyny naprawdę mocny: AI Coach z rozmową głosową.**
Żaden z czterech konkurentów nie ma niczego podobnego i nie jest to kwestia
tygodnia pracy. To jest produkt dla właściciela, nie dla agenta: wreszcie widzi,
czy jego ludzie umieją dzwonić, zamiast zgadywać. Nowy agent może przeprowadzić
czterdzieści rozmów z trudnym klientem, zanim zadzwoni do pierwszego
prawdziwego. Tego nie kupi nigdzie indziej.

**Powód drugi: portal klienta pod nazwą biura.** Estatly ma portal klienta, ale
pod adresem estatly.pl. Nasz jest brandowany nazwą biura, z własną ikoną na
telefonie klienta. Dla biura, które sprzedaje swoją markę, to jest różnica
między narzędziem a wizytówką.

**Powód trzeci: całość pracy właściciela w jednym miejscu.** Faktury, podatki,
prowizje, karta transakcji, umowy rezerwacyjne, oferta współpracy. Konkurencja
kończy się na CRM, właściciel i tak dopisuje do tego Excel i program do faktur.

**Powód czwarty, sprzedażowy: nie trzymamy danych jako zakładnika.** ASARI bierze
za wyjście z danymi i blokuje eksport po 5 dniach zwłoki w płatności. EstiCRM też
bierze za wygenerowanie bazy po zakończeniu umowy. My dajemy eksport całości
w abonamencie, zawsze. To jest zdanie, które otwiera rozmowę z każdym biurem,
które właśnie dostało od ASARI wycenę na 1 000 zł za własne dane.

**Czego nie mówić:** że jesteśmy tańsi. Wobec Estatly nie jesteśmy.

---

## 5. Rynek: ile jest biur do zdobycia

| Warstwa | Liczba | Źródło i zastrzeżenie |
|---|---|---|
| Wszystkie podmioty z PKD 68.31 i 68.32 | ~69 000 | CEIDG, 13.10.2026, prawie wyłącznie jednoosobowe |
| Podmioty w rejestrze REGON 68.31.Z | 15 647 | GUS, ale dane z 2014, mocno nieaktualne |
| Pośrednicy i zarządcy w rejestrze PFRN | ponad 8 000 | PFRN, tylko zrzeszeni |
| **Biura z zespołem 2+ agentów, czyli nasz rynek** | **~5 000** | **mój szacunek, przedział 4 000 – 7 000** |

Skąd 5 000: w 2014 roku ponad 75% z 15 647 podmiotów to były jednoosobowe
działalności, czyli około 3 900 spółek. Rynek od tego czasu urósł, dochodzą
jednoosobowe działalności zatrudniające ludzi. Traktuj tę liczbę jako rząd
wielkości, nie jako pomiar.

Z tych 5 000 biur w danym roku realnie rozważa zmianę systemu może 15%, czyli
**około 750 biur rocznie jest „w ruchu"**. To jest nasz realny rynek na dany rok,
nie 69 tysięcy.

---

## 6. Sprzedaż: ile klientów faktycznie zdobędziemy

### 6.1 Założenia (podane wprost, żeby dało się je podważyć)

| Parametr | Wartość | Przedział | Skąd |
|---|---|---|---|
| CPC Google Ads, frazy B2B SaaS w Polsce | 8 zł | 4 – 20 zł | benchmarki agencyjne, do sprawdzenia w Keyword Plannerze |
| CPC Meta, Polska, B2B | 2 zł | 0,5 – 3 zł | benchmarki agencyjne |
| Konwersja lądowanie → trial (Google, intencja wysoka) | 3% | 2 – 5% | benchmark SaaS |
| Konwersja lądowanie → trial (Meta, ruch zimny) | 1% | 0,5 – 2% | benchmark SaaS |
| Konwersja trial → płatny **z eksportem na portale** | 15% | 10 – 25% | benchmark SaaS po migracji danych |
| Konwersja trial → płatny **bez eksportu na portale** | 4% | 2 – 6% | mój szacunek, biuro nie może porzucić ASARI |
| Średni przychód na klienta (ARPU) | 524 zł | – | mix 50% Start, 35% Pro, 15% Biuro |
| Marża brutto po kosztach AI | 85% | – | AI około 80 zł na biuro miesięcznie |

Wyliczenie ARPU: 0,50 × 299 + 0,35 × 599 + 0,15 × 1 100 = 149,50 + 209,65 + 165,00 = **524 zł**.

### 6.2 Lejek przy budżecie 10 000 zł miesięcznie

Podział: 6 000 zł Google Ads, 4 000 zł Meta.

**Google, 6 000 zł:**
6 000 ÷ 8 zł = 750 kliknięć → × 3% = 22,5 trialu → × 15% = **3,4 klienta**

**Meta, 4 000 zł:**
4 000 ÷ 2 zł = 2 000 kliknięć → × 1% = 20 trialu → × 10% = **2,0 klienta**

**Rolki organiczne:** 0 zł mediów, ale realnie 0 – 1 klient miesięcznie przez
pierwsze pół roku, potem rośnie.

**Razem: około 5 – 6 klientów miesięcznie.**

⚠️ **Jedno poważne zastrzeżenie do Google Ads.** Założyłem, że da się kupić 750
kliknięć miesięcznie. W tej niszy prawdopodobnie się nie da. Fraz w stylu „crm
dla biura nieruchomości" czy „program dla pośredników" szuka w Polsce rząd
wielkości tysiąca osób miesięcznie łącznie, licząc wszystkie warianty. Realny
sufit to raczej **300 – 500 kliknięć miesięcznie**, czyli 1,5 – 2,5 klienta,
a nie 3,4. Trzeba to zweryfikować w Keyword Plannerze przed ustaleniem budżetu,
bo od tego zależy, czy Google jest kanałem głównym czy pobocznym.

### 6.3 Trzy scenariusze na 12 i 24 miesiące

Model: stały napływ nowych klientów miesięcznie, stały procent rezygnacji.
Liczba klientów po t miesiącach = nowi × (1 − (1−churn)^t) ÷ churn.

**Scenariusz A: zostajemy bez eksportu na portale**

Konwersja trial → płatny spada do 4%, rezygnacje rosną do 7% miesięcznie,
bo biuro płaci za dwa systemy naraz.

- Nowych: 1,5 miesięcznie
- Po 12 miesiącach: **12,5 klienta**, MRR 6 550 zł
- Koszt pozyskania klienta: 10 000 ÷ 1,5 = **6 667 zł**
- Wartość klienta w całym okresie: 524 × (1 ÷ 0,07) × 0,85 = **6 370 zł**
- **Stosunek wartości do kosztu pozyskania: 0,96. Dokładamy do każdego klienta.**

**Scenariusz B: realistyczny, z eksportem na portale**

- Nowych: 5 miesięcznie, rezygnacje 3% miesięcznie
- Po 12 miesiącach: 5 × (1 − 0,97¹²) ÷ 0,03 = 5 × 10,21 = **51 klientów**, MRR **26 700 zł**
- Po 24 miesiącach: 5 × 17,29 = **86 klientów**, MRR **45 100 zł**
- Koszt pozyskania: 10 000 ÷ 5 = **2 000 zł**
- Wartość klienta: 524 × 33,3 × 0,85 = **14 833 zł**
- **Stosunek: 7,4. Zwrot z reklamy po 3,8 miesiąca.**

**Scenariusz C: optymistyczny**

Eksport działa, rolki zaczynają nieść, polecenia od zadowolonych biur.

- Nowych: 8 miesięcznie, rezygnacje 2% miesięcznie
- Po 12 miesiącach: 8 × 10,77 = **86 klientów**, MRR **45 100 zł**
- Po 24 miesiącach: 8 × 19,21 = **154 klientów**, MRR **80 700 zł**

### 6.4 Zysk, nie przychód

Scenariusz B po 12 miesiącach, miesięcznie:

| Pozycja | Kwota |
|---|---|
| Przychód (51 klientów × 524 zł) | +26 700 zł |
| Koszty AI (51 × 80 zł) | −4 080 zł |
| Infrastruktura (Vercel Pro, Supabase Pro, Resend, domeny) | −600 zł |
| Reklama | −10 000 zł |
| **Zysk przed Twoją pracą i podatkiem** | **+12 020 zł** |

Scenariusz B po 24 miesiącach: 45 100 − 6 880 − 1 000 − 10 000 = **+27 220 zł miesięcznie**.

### 6.5 Sufit, czyli realny potencjał AgentSpace

Rynek to około 5 000 biur z zespołem. Realny udział po pięciu latach dla
produktu bez zaplecza handlowego i bez inwestora: **3 – 5%, czyli 150 – 250 biur**.

- 150 biur × 524 zł = 78 600 zł miesięcznie, **943 tys. zł rocznie**
- 250 biur × 524 zł = 131 000 zł miesięcznie, **1,57 mln zł rocznie**

Przy marży 85% i kosztach stałych to daje **600 tys. do 1,1 mln zł zysku rocznie**
w horyzoncie pięcioletnim. To jest realistyczny sufit, nie prognoza.

---

## 7. Jak to sprzedawać

### 7.1 Google Ads

Kanał o najwyższej intencji, ale wąski. Nie licz, że uniesie całość.

**Kampania 1, frazy konkurencji (najtańszy klient).** „asari crm cennik",
„esticrm opinie", „galactica virgo alternatywa", „program dla biura
nieruchomości opinie". Ludzie szukający opinii o konkurencie są w trakcie
decyzji. Reklama ma mówić wprost o migracji i o tym, że eksport danych u nas
jest darmowy.

**Kampania 2, frazy problemowe.** „jak sprawdzić pracę agentów nieruchomości",
„szkolenie cold calling nieruchomości", „jak przenieść bazę z asari". Tu
prowadzimy na AI Coach, nie na CRM.

**Czego nie robić:** nie licytuj „crm nieruchomości" szeroko. Przegrasz z ASARI
i Estatly, które mają większe budżety i dłuższą historię konta.

**Budżet startowy: 3 000 zł miesięcznie przez 2 miesiące na zebranie danych,**
potem decyzja o skalowaniu na podstawie faktycznego kosztu trialu.

### 7.2 Meta Ads i rolki

Tu jest nasza przewaga, bo mamy coś, co **wygląda** na wideo. Nikt nie zrobi
viralowej rolki z tabelki prowizji. Z rozmowy głosowej z AI klientem, na ekranie
telefonu, z oceną na końcu, owszem.

**Format, który ma działać:** nagranie ekranu z rozmowy w AI Coachu. Agent
dzwoni, AI odbiera i gra trudnego klienta, rozmowa idzie źle, na końcu wchodzi
ocena z punktacją. Dokładnie ten mechanizm, który Cię zainspirował w rolce
z Jordanem Belfortem. To jest treść, którą ogląda się do końca.

**Seria, nie pojedyncze rolki:** „AI klient wyrzuca agenta po 8 sekundach",
„Trzy obiekcje, których nikt nie umie zbić", „Ile kosztuje Cię agent, który nie
umie dzwonić". Pod każdą wezwanie do obejrzenia demo, nie do zakupu.

**Targetowanie:** stanowiska właściciel i manager, zainteresowania
nieruchomościami, plus listy remarketingowe z ruchu ze strony. Nie celuj
w agentów, bo agent nie podejmuje decyzji zakupowej.

**Budżet: 2 000 zł miesięcznie na start,** skalować tylko te kreacje, które mają
realne obejrzenia organiczne. Rolka, która nie działa organicznie, nie zacznie
działać za pieniądze.

### 7.3 Kanał, którego nie bierzesz pod uwagę, a jest najtańszy

**Sprzedaż bezpośrednia do biur, które znasz.** Jesteś właścicielem biura
w Krakowie od lat, masz sieć kontaktów w branży i wiarygodność, której żaden
konkurent nie kupi za reklamę. Pierwszych 10 – 20 klientów zdobędziesz
telefonem i kawą, a nie Google Ads, i to po koszcie bliskim zera.

To jest też jedyny sposób, żeby wyjść z pułapki „nikt nie kupi produktu bez
referencji". Dopiero gdy masz 10 biur, które mówią, że to działa, reklama ma
czym pracować.

**Realny plan na pierwsze 6 miesięcy: 10 – 15 klientów ze sprzedaży
bezpośredniej, 0 zł budżetu reklamowego,** i dopiero wtedy włączamy kampanie.

---

## 8. Co trzeba zrobić, w kolejności

### Zanim weźmiesz pierwszą złotówkę

1. **Płatności online.** Nie mamy. Dziś zamówienie to wiersz w bazie i mail do
   Ciebie. Przelewy24 albo Stripe.
2. **Vercel Pro i Supabase Pro.** Plan Hobby jest wg regulaminu do zastosowań
   niekomercyjnych, a Supabase bez Pro nie ma codziennych kopii zapasowych.
   Nie bierzemy cudzej bazy klientów bez backupu.
3. **PKD 58.29.Z** w CEIDG, żeby legalnie sprzedawać oprogramowanie.

### Zanim włączysz reklamy

4. **Eksport ofert na portale.** Bez tego scenariusz A, czyli dokładanie do
   każdego klienta. Zacznij od rozmowy z Otodomem o przyjmowanie feedu, bo
   bariera jest umowna i trwa dłużej niż kod.
5. **Przemyśl pakiet Start.** 299 zł przy Estatly za 99 zł nie obroni się
   w żadnej rozmowie. Albo zejść do 149 – 199 zł, albo skasować Start i zacząć
   od Pro, pozycjonując się wyżej.
6. **Wysyłka maili z karty klienta.** Generator mamy, brakuje samej wysyłki.

### Żeby domknąć lukę funkcjonalną wobec Estatly

7. Automatyzacje typu „etap zmieniony, utwórz zadanie za 2 dni". Tanie, a widać.
8. Historia zmian ceny oferty. Jeden dzień pracy, a jest w każdym porównaniu.
9. Zgody RODO przy kliencie z datami. Dwa dni, a zdejmuje realny strach.
10. Czat zespołu i zastępstwa. To są funkcje dla większych biur, mogą poczekać.

---

## 9. Jedno zdanie podsumowania

Produkt jest szerszy od konkurencji wszędzie tam, gdzie konkurencja nie patrzy,
i brakuje mu jednej funkcji, na którą konkurencja patrzy codziennie. Dopóki nie
ma eksportu na portale, każda złotówka wydana na reklamę jest stratą. Gdy będzie,
model się domyka przy koszcie pozyskania klienta rzędu 2 000 zł i zwrocie po
niecałych czterech miesiącach.

---

## Źródła

- Cennik ASARI: asaricrm.com/program-dla-biur-nieruchomosci/cennik/
- Cennik i funkcje Estatly: estatly.pl
- Regulamin i cennik EstiCRM: esticrm.pl, przetestuj.esticrm.pl/docs/Regulamin-EstiCRM.pdf
- Galactica Virgo: virgo.galactica.pl (brak publicznego cennika)
- Liczba podmiotów PKD 68.31.Z: CEIDG przez outreachpilot.pl, REGON przez rynkometr.pl, rejestr PFRN
- Benchmarki reklamowe: zestawienia agencyjne, wymagają weryfikacji na własnym koncie
