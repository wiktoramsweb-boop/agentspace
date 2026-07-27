# Handoff: „Oferta współpracy" (Droga A — nadruk na wzór z Canvy)

Stan na moment przerwania. Feature 1 (Szybki wpis głosem) JEST GOTOWE i wdrożone.
Ten dokument dotyczy Feature 2 — generatora oferty współpracy z PDF-a z Canvy.

## Co już zrobione (gotowe assety w repo)
- **Czysta baza:** `public/oferta/wzor.pdf` — wygenerowana z `~/Downloads/wzor-oferta.pdf`
  przez PyMuPDF: usunięte znaczniki (tekst + wektorowy `MIESIAC_X`), zdjęcia/design NIETKNIĘTE
  (redakcja z `images=PDF_REDACT_IMAGE_NONE`, bez fill → bez łaty na zdjęciu). `MIESIAC_X`
  usunięty z OKŁADKI (str.0) I OSTATNIEJ STRONY (str.5) — obie mają nagłówek "OFERTA WSPÓŁPRACY / MIESIĄC".
- **Czcionki (statyczne, z variable przez fonttools instancer wght=400/700):**
  `public/oferta/fonts/` → `CormorantGaramond-Regular.ttf`, `CormorantGaramond-Bold.ttf`,
  `Arimo-Regular.ttf`, `Arimo-Bold.ttf`.
- **Zależności zainstalowane:** `pdf-lib`, `@pdf-lib/fontkit`.

## KRYTYCZNE
- `embedFont(bytes, { subset: false })` — z `subset: true` GUBI GLIFY (adres wychodził „ul ądn a").
  Musi być `subset: false`.
- Kolory RGB 0-1 z hexów poniżej. Współrzędne w układzie pdf-lib (origin dół-lewo), już przeliczone.
- Wysokość strony: 2384.25 pt.

## Zweryfikowane pola (przetestowane, render wyglądał idealnie)
Wartości wejściowe: `adres`, `miesiac`, `agent`, `telefon`, `czas`, `prowizja`.

| pole | strona | x | y | size | font | color | uwagi |
|---|---|---|---|---|---|---|---|
| adres | 0 | 132.3 | 1190.7 | 150 | CormorantGaramond-Regular | #f8f5ef | tekst = "ul. " + adres |
| miesiac | 0 | 841.9 | 2101.2 | 30 | Arimo-Regular | #e8e3de | WYŚRODKOWANY (x = 841.9 - szer/2) |
| miesiac | 5 | 841.9 | 2101.2 | 30 | Arimo-Regular | #e8e3de | WYŚRODKOWANY — TE SAME współrzędne co str.0 |
| agent | 0 | 130.3 | 118.8 | 38 | Arimo-Bold | #f8f5ef | |
| agent | 5 | 109.2 | 157.9 | 38 | Arimo-Bold | #f8f5ef | |
| telefon | 5 | 1356.5 | 119.7 | 30 | Arimo-Regular | #dcd6d1 | |
| czas | 4 | 132.3 | 1760.7 | 55.1 | CormorantGaramond-Bold | #150e0a | np. "3 miesiące" |
| prowizja | 4 | 975.1 | 1760.7 | 55.1 | CormorantGaramond-Bold | #150e0a | np. "2% brutto" |

E-mail `biuro@spectranieruchomosci.pl` jest NA STAŁE w PDF (brak tokenu) — nie ruszać.

## Sprawdzona logika generowania (Node/przeglądarka pdf-lib)
```js
const pdf = await PDFDocument.load(baseBytes);
pdf.registerFontkit(fontkit);
const emb = (bytes) => pdf.embedFont(bytes, { subset: false });
// fonts: cgReg, cgBold, arReg, arBold
const C = (h) => { const n=parseInt(h,16); return rgb(((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255); };
for (const f of FIELDS) {
  const font = fonts[f.font];
  const text = (f.prefix||"") + values[f.k];
  let x = f.x;
  if (f.align==="center") x = f.x - font.widthOfTextAtSize(text, f.size)/2;
  pages[f.page].drawText(text, { x, y: f.y, size: f.size, font, color: C(f.color) });
}
```
(FIELDS = wiersze z tabeli powyżej; `f.k` dla obu `miesiac` = "miesiac", oba `agent` = "agent".)

## DO ZROBIENIA (nowy chat)
1. `/app/oferta-wspolpracy` (strona + client component). Pola formularza:
   adres, miesiac (domyślnie bieżący miesiąc WIELKIMI + rok, np. "LIPIEC 2026"),
   agent (domyślnie `user.full_name`), telefon (domyślnie `user.phone`),
   czas (domyślnie "3 miesiące"), prowizja (domyślnie "2% brutto").
2. Opcjonalnie mikrofon + AI-parse (jak w `/app/szybki-wpis` + `/api/quick-entry/parse`)
   → wypełnia pola głosem („czas 3 miesiące, prowizja 2%, adres Prądnicka 48…").
3. Generowanie **po stronie klienta** (pdf-lib): `fetch('/oferta/wzor.pdf')` + 4 czcionki z
   `/oferta/fonts/…`, rysowanie pól, `download` jako `Oferta wspolpracy - {adres}.pdf`.
4. Wpis w sidebarze (sekcja Sprzedaż lub Finanse), rola: wszyscy albo owner — do ustalenia.
5. Wysyłka mailem do klienta = wymaga zweryfikowanej domeny Resend (wciąż niezrobione).
   Na teraz: pobranie pliku, agent wysyła sam.

## Uwaga techniczna
Generowanie client-side (public/ assety) jest najpewniejsze na Vercel (public/ zawsze serwowane).
Renderowanie/weryfikację robiłem PyMuPDF (fitz) offline — nie jest dostępne w runtime Vercela.
