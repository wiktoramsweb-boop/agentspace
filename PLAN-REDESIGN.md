# PLAN PRZEBUDOWY LANDINGA AGENTSPACE

> Wzorzec wizualny i mechanika: receptionos.com (Gatsby, ale mechanikę da się w 100% odtworzyć w Next.js 16 + Tailwind 4).
> Utworzono: sierpień 2026

---

## DIAGNOZA — co jest nie tak dziś

### 1. Landing sprzedaje STARY produkt (najpilniejsze)

| Landing mówi | Aplikacja faktycznie ma |
|---|---|
| „Szkolenie agentów z AI Coachem" | AI Coach + CRM + Cele + Prowizje + Nieruchomości + Zadania + Faktury + Rezerwacje + Maile + Oferta współpracy + Panel właściciela + Role CEO/Menedżer/Agent |
| 3 moduły | ~14 modułów |
| „Start Q1 2026" w meta description | Jest sierpień 2026 — **to zabija wiarygodność** |
| „Bądź wśród pierwszych 10 biur" | Produkt działa na produkcji |

**To jest większy problem niż wygląd.** Sprzedajesz narzędzie do treningu, a zbudowałeś system operacyjny dla biura nieruchomości. Cena 299 zł/mc jest zaniżona względem tego, co faktycznie dostarczasz.

### 2. Dlaczego receptionOS wygląda drożej — konkretnie

| Element | receptionOS | AgentSpace dziś |
|---|---|---|
| Efekty wizualne | 1 motyw (ramki SVG z narożnikami) | aurora + spotlight + tilt + magnetic + glow + border-beam + grain + shimmer + scramble |
| Akcent kolorystyczny | 1 kolor (#eb670f) | gradienty, aurora, wiele akcentów |
| Typografia | Inter Tight, ujemny tracking (-0.72px), gradient text | Geist, `text-4xl font-semibold` (default Tailwind) |
| Paleta | ciepła czerń (#0a0a0a) + ciepłe teksty (#ffe8d9 / #a3948b) | neutralna |
| Dowód produktu | wideo demo (Vimeo) + nagrania UI | statyczne mockupy |

**Zasada:** więcej efektów = tańszy wygląd. Ich strona wygląda drożej, bo **mniej się dzieje**, ale każdy detal jest spójny.

---

## FAZA 0 — Pilne (1 dzień)

Zrób to nawet jeśli reszta poczeka.

- [ ] Usuń „Start Q1 2026" z meta description i całej strony
- [ ] Przepisz `<title>`: `AgentSpace — system operacyjny dla biura nieruchomości`
- [ ] Przepisz meta description pod PEŁNY produkt (CRM + cele + prowizje + AI Coach), nie sam trening
- [ ] Zamień „Bądź wśród pierwszych 10 biur" → „Program Pierwszych 10 Biur" (rzadkość zamiast pre-launchu)
- [ ] Podnieś cenę w komunikacji: 299 zł → **499 zł/mc** (patrz Faza 4)

---

## FAZA 1 — Design system (3–4 dni)

### 1.1 Tokeny — wklej do `app/globals.css`

```css
@theme inline {
  /* Paleta — ciepła czerń, jeden akcent */
  --color-bg:        #0a0a0a;
  --color-surface:   #0f0c0a;
  --color-line:      #241f1c;   /* hairline między sekcjami */
  --color-line-lit:  #6b625c;   /* narożniki ramek */
  --color-text:      #fff2ea;   /* nagłówki */
  --color-muted:     #a3948b;   /* body */
  --color-accent:    #2f6df6;   /* AgentSpace = niebieski, NIE kopiuj pomarańczu */
  --font-sans: "Inter Tight Variable", "Inter Tight", system-ui, sans-serif;
}

/* Nagłówki: gradient text — ich sygnaturowy trik */
h1, h2, h3, h4 {
  background: linear-gradient(180deg, #fffaf7 0%, rgba(255,242,234,0.72) 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.02em;
}
h1 { font-size: clamp(36px, 5vw, 64px); line-height: 1.08; font-weight: 400; }
h2 { font-size: clamp(32px, 4vw, 56px); line-height: 1.12; font-weight: 400; }
h3 { font-size: clamp(28px, 3vw, 44px); font-weight: 400; }
```

**Font:** zamień Geist → **Inter Tight Variable** (`npm i @fontsource-variable/inter-tight`). To 60% różnicy wizualnej — Geist jest „techniczny", Inter Tight jest „produktowy".

**Kolor akcentu:** zostań przy niebieskim/granatowym. Kopiowanie ich pomarańczu = wyglądasz jak klon.

### 1.2 Komponent `<Frame>` — najważniejszy element

Ich cała strona trzyma się na jednym komponencie: prostokąt z hairline'ową ramką, jasnymi znacznikami w narożnikach i „wcięciem" w górnej linii. Buduje wrażenie rysunku technicznego i spina wszystkie sekcje.

Utwórz `app/components/ui/frame.tsx`:

```tsx
export function Frame({ children, className = "" }: {
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`relative border border-[var(--color-line)] ${className}`}>
      {/* narożniki */}
      {[
        "top-[-1px] left-[-1px]",
        "top-[-1px] right-[-1px] rotate-90",
        "bottom-[-1px] right-[-1px] rotate-180",
        "bottom-[-1px] left-[-1px] -rotate-90",
      ].map((pos) => (
        <svg key={pos} className={`absolute ${pos} z-10`} width="8" height="8" fill="none">
          <path d="M7 1H1v6" stroke="var(--color-line-lit)" strokeLinecap="round" />
        </svg>
      ))}
      {children}
    </div>
  );
}
```

Użyj go na: kartach funkcji, cenniku, case study, sekcji problemów, stopce. **Jeden motyw, powtórzony wszędzie.**

### 1.3 Usuń efekty (to podnosi jakość, nie obniża)

Skasuj lub przestań używać:

```
app/components/aurora-background.tsx
app/components/effects/spotlight.tsx
app/components/effects/tilt-card.tsx
app/components/effects/magnetic-button.tsx
app/components/effects/glow-card.tsx
app/components/effects/border-beam.tsx
app/components/effects/number-scramble.tsx
```
Plus z `globals.css`: `.grain`, `.shimmer`, `.card-glow`, `.animate-border-beam`.

**Zostaw tylko:** `fade-in.tsx` (delikatne wejście przy scrollu) + `<Frame>`. Tyle wystarczy.

### 1.4 Nawigacja — frosted glass

```css
.nav {
  position: fixed; inset: 0 0 auto 0; height: 68px; z-index: 20;
  background: rgba(10,10,10,0.25);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
```
⚠️ Nie nakładaj `transform` na rodzica sekcji z `backdrop-filter` — psuje efekt (mają na to komentarz w kodzie).

---

## FAZA 2 — Nowa struktura strony (3–4 dni)

Kolejność sekcji przepisana z receptionOS (ta kolejność sprzedaje):

| # | Sekcja | Treść dla AgentSpace |
|---|---|---|
| 1 | **Hero** | H1: „System operacyjny dla biura nieruchomości". Podtytuł jednym zdaniem. CTA: „Zobacz demo na żywo". Tło: subtelne wideo/gradient, bez aurory. |
| 2 | **Partnerzy / zaufanie** | Logo Spectry + systemy, z którymi integrujesz. Jeśli brak — pomiń, nie wypełniaj śmieciem. |
| 3 | **Wartości (3 kafle)** | Więcej transakcji / Mniej chaosu w biurze / Widzisz kto naprawdę pracuje |
| 4 | **Funkcje (6 kafli w `<Frame>`)** | AI Coach · CRM klientów · Cele i lejek · Prowizje · Nieruchomości wspólne · Panel właściciela |
| 5 | **Jak to działa — 3 kroki** | Audyt biura → Wdrożenie w 1 dzień → Pierwsze wnioski w 30 dni. **Dodaj schema `HowTo`.** |
| 6 | **Wyeliminuj problemy** | 3 kafle z bólem: chaos w Excelu / agenci odpadają / decydujesz przeczuciem |
| 7 | **Porównanie (przełącznik)** | „Z AgentSpace" vs „Bez systemu" — dwa stany, ten sam layout |
| 8 | **Opinie** | Karuzela. Start: Ty + zespół Spectry. Nie udawaj, że masz więcej. |
| 9 | **Program Pierwszych 10 Biur** | Ekskluzywność: **jedno biuro na dzielnicę Krakowa / miasto** |
| 10 | **Case study Spectra** | Twarde liczby przed/po. **Najważniejsza sekcja do zbudowania.** |
| 11 | **O nas** | Twoja historia — biuro w Krakowie, budowałem to dla siebie. To działa, zostaw. |
| 12 | **Cennik** | Licznik agentów (jak ich licznik foteli) → cena skaluje się na żywo |
| 13 | **CTA** | „Gotowy dołączyć do pierwszych 10 biur?" |
| 14 | **Stopka** | 4 kolumny linków: Produkt / Moduły / O nas / Zasoby |

### 2.1 Dowód produktu — zamień mockupy na wideo

Ich największa przewaga: **nagrania prawdziwego UI**, nie ilustracje. Nagraj 3 klipy po 15–20 s (QuickTime → screen recording):
1. Sesja AI Coach z głosem
2. Pulpit poranny + cele
3. Panel właściciela z rankingiem

Hostuj lokalnie (`/public/video/*.mp4`), `<video autoplay muted loop playsinline>`. Zero kosztu, ogromna różnica w konwersji.

---

## FAZA 3 — SEO / GEO (2 dni)

Masz już: `Organization`, `SoftwareApplication`, `FAQPage`. ✅

Dołóż:

- [ ] **`public/llms.txt` + `llms-full.txt`** — opis produktu dla crawlerów LLM (ChatGPT/Perplexity coraz częściej są źródłem leadów B2B). Prawie nikt w PL tego nie ma.
- [ ] **Schema `HowTo`** na sekcji „Jak to działa"
- [ ] **`ItemList` / `SiteNavigationElement`** dla nawigacji
- [ ] **pSEO — strony integracji** (największy zysk SEO):
  - `/integracje/asari`
  - `/integracje/galactica`
  - `/integracje/imo`
  - `/integracje/estiman`
  - `/integracje` (hub)

  Każda: „AgentSpace + [System] — jak połączyć". Pośrednicy szukają dokładnie tak. Nawet jeśli integracja jest „w planach" — napisz uczciwie „w przygotowaniu, zgłoś zainteresowanie" i zbieraj leady.
- [ ] **Strony pod moduły** (jak ich `/produkt/*`): `/produkt/ai-coach`, `/produkt/crm`, `/produkt/prowizje`, `/produkt/cele`

---

## FAZA 4 — Warstwa sprzedażowa (2–3 dni)

### 4.1 Personalizowane oferty (ich najlepszy trik)

Mają template `clinic-offer.js` → generuje dedykowaną stronę per klinika. Masz już `/oferta-wspolpracy` i generator PDF — połącz to:

```
app/oferta/[slug]/page.tsx
→ agentspace.pl/oferta/nieruchomosci-kowalski
```

Strona wita po nazwie biura, pokazuje policzone ROI dla ICH liczby agentów, ma jeden przycisk. Wysyłasz link zamiast PDF-a. Konwertuje nieporównywalnie lepiej.

### 4.2 Cennik — licznik agentów

Skopiuj mechanikę ich licznika foteli: `[−] 5 [+]` agentów → cena przelicza się na żywo. Uzasadnia cenę i pokazuje, że skaluje się z wielkością biura.

**Rekomendacja cenowa** przy obecnym zakresie produktu:

| Pakiet | Cena | Zakres |
|---|---|---|
| Start | 499 zł/mc | do 5 agentów, CRM + Cele + Prowizje |
| Pro | 899 zł/mc | do 15 agentów, + AI Coach + Panel właściciela |
| Biuro | od 1490 zł/mc | bez limitu, + role, + wdrożenie 1:1 |

299 zł/mc za 14 modułów to sygnał „to jest tanie narzędzie", nie „to jest system dla mojego biura".

### 4.3 Case study Spectra — zbierz liczby

Potrzebujesz 3–4 twardych metryk przed/po. Nawet skromnych:
- liczba cold calli / tydzień
- % leadów z follow-upem
- czas na raportowanie
- średni score sesji treningowych w czasie

To jest jedyna rzecz z tej listy, której nie da się przyspieszyć kodem.

---

## HARMONOGRAM

| Faza | Czas | Priorytet |
|---|---|---|
| 0 — Naprawa treści | 1 dzień | 🔴 teraz |
| 1 — Design system | 3–4 dni | 🔴 wysoki |
| 2 — Struktura + wideo | 3–4 dni | 🟠 wysoki |
| 3 — SEO/GEO + pSEO | 2 dni | 🟡 średni |
| 4 — Sprzedaż | 2–3 dni | 🟠 wysoki |

**Razem: ~12 dni roboczych.**

---

## KOLEJNOŚĆ WYKONANIA (jeśli robisz sam)

1. Faza 0 — dziś, to czysta korekta tekstu
2. Font + tokeny + `<Frame>` — natychmiastowy skok wizualny
3. Usunięcie efektów — paradoksalnie tu wygląd rośnie najbardziej
4. Nagranie 3 klipów UI
5. Przestawienie sekcji wg tabeli z Fazy 2
6. Cennik z licznikiem + nowe ceny
7. llms.txt + HowTo + strony integracji
8. Personalizowane oferty `/oferta/[slug]`

---

## CZEGO NIE KOPIOWAĆ

- **Pomarańczowego akcentu** — zostań przy swoim kolorze
- **Modelu 3D na sticky scroll** (ich „Apollo") — dużo pracy, mało konwersji
- **Gatsby** — masz Next.js 16, jest lepszy
- **Dwóch pakietów „Wkrótce dostępne"** — u Ciebie produkt działa, nie udawaj kolejki
- **Dublowania treści mobile/desktop** (`.mobile` / `.desktop`) — mają to, ale to antywzorzec: podwaja DOM i szkodzi SEO. Rób responsywnie.
