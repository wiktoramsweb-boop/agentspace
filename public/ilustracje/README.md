# Ilustracje modułów

Generowane w Gemini według jednego, wspólnego opisu stylu (patrz historia
rozmowy). Przy dokładaniu kolejnych: zmieniaj tylko scenę, nigdy bloku STYLE,
inaczej seria przestanie wyglądać jak jedna rodzina.

Obróbka po wygenerowaniu, zanim trafią tutaj:
1. Tło wypełniane od rogów i zamieniane na przezroczyste. Bez tego w ciemnym
   motywie świeci jasnoszary kwadrat.
2. Zmniejszenie do 1200 px i kwantyzacja do 48 kolorów. Płaskie kolory
   kwantyzują się bez widocznej straty, a plik schodzi kilkukrotnie.
3. Nazwa pliku to slug modułu z `lib/marketing/modules.ts`.

Brakuje jeszcze: cele, panel-wlasciciela, strona-www, ai-coach,
role-i-uprawnienia. Dopóki nie ma kompletu szesnastu, siatka na stronie
głównej zostaje na zdjęciach, żeby nie mieszać dwóch języków wizualnych
w jednym widoku.

Dwie rzeczy do sprawdzenia przy każdej nowej ilustracji, bo na oko umykają:
- **Karnacja.** Postacie mają mieć białe twarze. Jedna wersja przyszła
  z beżowymi i odstawała od reszty serii. Sprawdzenie: policzyć piksele
  w zakresie tonu skóry, wzorcowe ilustracje mają ich zero.
- **Kolor włosów.** Czarne. Zielone włosy psują spójność postaci.

## Jasne tło pod ilustracją (klasa `.bg-ilustracja`)

Ilustracje są rysowane prawie czarnym konturem, a strona marketingowa domyślnie
jest ciemna (`--color-mk-bg: #08090b`). Bez własnego jasnego podkładu w ciemnym
motywie zostają z nich same kolorowe plamy: znikają kontury, włosy i twarze.
Dlatego kafelek na stronie głównej i panel na podstronie modułu mają klasę
`.bg-ilustracja` (jasny gradient w OBU motywach) i `object-contain` z paddingiem,
a nie `object-cover`. Nie zastępuj tego kolorem zależnym od motywu.
