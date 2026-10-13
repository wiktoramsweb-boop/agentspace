# Znak AgentSpace

Jeden znak zamiast dwóch niespójnych: dotychczas ikona aplikacji była domkiem
na gradiencie, a `public/logo.png` zupełnie innym rysunkiem.

Znak to **dach i kropka pod nim**. Dach, bo nieruchomości. Kropka, bo tak
AgentSpace podpisuje się od początku, w pasku bocznym i na obrazkach do
mediów społecznościowych: „● AgentSpace". Zamiast rysować kolejny domek
z zestawu ikon, znak rozwija to, co już było rozpoznawalne.

## Kolory

| | |
|---|---|
| Gradient znaku | `#10b981` → `#06b6d4` (zieleń do morskiego, 135°) |
| Tekst na jasnym | `#0b1220` |
| Tekst na ciemnym | `#ffffff` |
| Tło ciemnych materiałów | `#07090c` |

## Pliki

**Do ekranu i druku, skalowalne bez utraty jakości:**

- `znak.svg` – pełnokolorowy kafelek. Awatar, ikona, media społecznościowe.
- `znak-na-ciemnym.svg` – sam biały glif bez kafelka, na ciemne tła.
- `znak-zielony.svg` – sam glif w zieleni marki, na białe tła.
- `znak-mono.svg` – jednobarwny, dziedziczy kolor po rodzicu (`currentColor`).
  Do pieczątek, faksymile na umowach i druku jednobarwnego.
- `logo-poziome.svg` – znak plus nazwa, ciemny tekst.
- `logo-poziome-jasne.svg` – znak plus nazwa, biały tekst.

**Gotowe PNG, gdy ktoś prosi o „logo w pliku":**

- `znak-1024/512/256/192/128/64/32.png`
- `logo-poziome-1200.png` – na białym
- `logo-poziome-jasne-1200.png` – na ciemnym
- `logo-poziome-przezroczyste-1200.png` – bez tła

## Jak używać

- **Nie rozciągaj** znaku. Skaluj proporcjonalnie.
- **Zostaw powietrze** wokół: co najmniej tyle, ile wynosi promień kropki.
- Na zdjęciach i niejednolitych tłach używaj wersji z kafelkiem (`znak.svg`),
  nie samego glifu.
- Poniżej 32 px używaj samego znaku, bez nazwy. Napis przestaje być czytelny.

## Skąd się biorą pliki

Wszystkie powstają z jednej definicji geometrii, żeby wersja kolorowa
i jednobarwna nie mogły się rozjechać. Przy zmianie znaku trzeba poprawić
tylko stałą `GLIF` w skrypcie generującym i wygenerować komplet od nowa.
