# Znak AgentSpace

Znak to **dach i kropka pod nim**. Dach, bo nieruchomości. Kropka, bo tak
AgentSpace podpisuje się od początku, w pasku bocznym i na obrazkach do
mediów społecznościowych: „● AgentSpace".

Napis składa krój **Sora SemiBold** (licencja SIL OFL, Google Fonts).

## Napis jest krzywymi, nie tekstem

W plikach SVG nazwa jest zamieniona na kontury. Bez tego logo wysłane
drukarni albo wklejone do Figmy renderowałoby się domyślną czcionką systemu
i przestawałoby być logo. Kosztem jest to, że nazwy nie da się poprawić
w edytorze tekstu: zmiana wymaga wygenerowania plików od nowa.

## Kolory

| | |
|---|---|
| Gradient kafelka | `#10b981` → `#06b6d4`, 135° |
| Zieleń marki | `#10b981` |
| Tekst na jasnym | `#0b1220` |
| Tekst na ciemnym | `#ffffff` |
| Ciemne tło materiałów | `#07090c` |

## Co wybrać

**Sam znak, bez nazwy.** Awatary, ikony, favikona, media społecznościowe,
wszędzie poniżej 32 px.

- `znak-gradient` – podstawowy, kafelek z gradientem. Domyślny wybór.
- `znak-kafelek-ciemny` – kafelek w kolorze tła ciemnych materiałów.
- `znak-kafelek-bialy` – kafelek biały, glif zielony. Na kolorowe tła.
- `znak-zielony`, `znak-bialy`, `znak-czarny` – sam glif, bez kafelka,
  przezroczyste tło.
- `znak-mono.svg` – jednobarwny, dziedziczy kolor po rodzicu
  (`currentColor`). Pieczątki, faksymile na umowach, druk jednobarwny.

**Logo poziome.** Nagłówki stron, stopki maili, prezentacje, papier firmowy.

- `poziome-gradient-tekst-ciemny` – na jasnych tłach.
- `poziome-gradient-tekst-bialy` – na ciemnych tłach.
- `poziome-bialy`, `poziome-czarny`, `poziome-zielony` – całość jednym
  kolorem, gdy gradient przeszkadza: na zdjęciu, w druku jednobarwnym,
  na materiale partnera.
- `poziome-na-bialym-tle`, `poziome-na-ciemnym-tle` – z wypełnionym tłem,
  gdy przezroczystość sprawia kłopot.

**Logo pionowe.** Kwadratowe miejsca: wizytówka, roll-up, naklejka, slajd
tytułowy.

- `pionowe-gradient-tekst-ciemny`, `pionowe-gradient-tekst-bialy`,
  `pionowe-na-bialym-tle`, `pionowe-na-ciemnym-tle`.

## Formaty

Każdy wariant ma SVG. Znaki mają dodatkowo PNG w rozmiarach 1024, 512, 256,
128 i 64 px. Logo poziome i pionowe mają PNG w rozmiarze podstawowym
i `@2x` na ekrany o dużej gęstości.

Gdy ktoś prosi o „logo w pliku", wyślij `poziome-na-bialym-tle@2x.png`.
Gdy ktoś prosi o logo do druku, wyślij SVG.

## Zasady

- **Nie rozciągaj.** Skaluj proporcjonalnie.
- **Zostaw powietrze** wokół logo: co najmniej tyle, ile wynosi średnica
  kropki pod dachem.
- Na zdjęciach i niejednolitych tłach używaj wersji z kafelkiem albo
  jednobarwnej, nie samego glifu w gradiencie.
- Poniżej 32 px używaj samego znaku. Napis przestaje być czytelny.
- Nie zmieniaj kolorów gradientu ani proporcji między znakiem a napisem.
