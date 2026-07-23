import { getCurrentUser } from "@/lib/auth";
import { createAnthropic, COACH_MODEL } from "@/lib/ai/client";
import { standardClosing, type OpisInput } from "@/lib/opis";

export const maxDuration = 60;

const SYSTEM = `Jesteś doświadczonym copywriterem agencji nieruchomości SPECTRA z Krakowa. Piszesz profesjonalne, sprzedażowe opisy ogłoszeń nieruchomości po polsku — konkretne, płynne, budujące wyobrażenie i emocje, ale rzeczowe i wiarygodne.

Na podstawie podanych faktów napisz PEŁNY opis w stylu Spectra, zachowując tę strukturę i formatowanie:

1. TYTUŁ — jedna linia WIELKIMI LITERAMI (liczba pokoi, typ, metraż, kluczowe atuty, miasto i dzielnica).
2. Akapit wprowadzający — 3-5 zdań, zachęcający, oddający charakter i grupę docelową.
3. Jeśli agent dysponuje kluczami — zdanie o możliwości prezentacji także wieczorami i w weekendy.
4. PODSTAWOWE INFORMACJE — lista punktów (każdy zaczyna się od "* "): Status, Metraż, Piętro, Budynek, Ogrzewanie, Stan prawny.
5. UKŁAD POMIESZCZEŃ — lista punktów "* Nazwa (metraż m²): opis". Rozwiń każde podane pomieszczenie w atrakcyjny, ale realny opis.
6. DODATKOWE ATUTY — lista punktów "* ", rozwiń podane atuty i dodaj trafne, wynikające z faktów.
7. LOKALIZACJA - MIASTO, DZIELNICA — akapit wstępny + podsekcje: "Komunikacja i dojazd", "Zieleń i rekreacja", "Infrastruktura codzienna" (każda jako lista "* " lub akapit).
8. POTENCJAŁ INWESTYCYJNY — tylko dla sprzedaży; akapit o perspektywach mikrolokalizacji.
9. FINANSE — lista punktów z podanymi kwotami.
10. NASZA REKOMENDACJA — 2-4 zdania podsumowania dla grupy docelowej.
11. Na końcu zdanie o dostępności / zachęta do kontaktu.

WAŻNE ZASADY WIARYGODNOŚCI:
- Używaj konkretnych danych, które podał agent (linie autobusów/tramwajów, odległości, ceny, POI).
- Jeśli agent NIE podał konkretnej liczby (numeru linii, odległości w km, dokładnej ceny) — NIE wymyślaj jej. Opisz dostęp jakościowo (np. "kilka linii tramwajowych i autobusowych w bezpośredniej okolicy", "kilkanaście minut do centrum"). Lepiej ogólnie niż fałszywie.
- Wykorzystaj ogólną wiedzę o dzielnicy Krakowa (charakter, zieleń, kierunki dojazdu), ale bez zmyślonych precyzyjnych faktów.
- NIE pisz sekcji o agencji Spectra ani klauzuli prawnej — te dodawane są automatycznie. Zakończ na rekomendacji/zachęcie do kontaktu.
- Zwróć wyłącznie gotowy tekst opisu, bez komentarzy od siebie, bez znaczników markdown (żadnych #, **).`;

function factsFromInput(i: OpisInput): string {
  const rooms = (i.rooms ?? [])
    .filter((r) => r.name?.trim())
    .map((r) => `  - ${r.name}${r.area ? ` (${r.area} m²)` : ""}${r.desc ? `: ${r.desc}` : ""}`)
    .join("\n");
  const atuty = (i.atuty ?? [])
    .map((a) => a?.trim())
    .filter(Boolean)
    .map((a) => `  - ${a}`)
    .join("\n");

  const line = (label: string, v?: string) => (v && v.trim() ? `${label}: ${v.trim()}` : "");

  return [
    `Typ transakcji: ${i.transakcja === "wynajem" ? "WYNAJEM" : "SPRZEDAŻ"}`,
    line("Typ nieruchomości", i.typLabel),
    line("Liczba pokoi", i.pokoje),
    line("Metraż (m²)", i.metraz),
    line("Piętro", i.pietro),
    line("Miasto", i.miasto),
    line("Dzielnica", i.dzielnica),
    line("Ulica", i.ulica),
    line("Atut do tytułu", i.naglowekAtut),
    line("Własny tytuł (jeśli podany, użyj go)", i.customTitle),
    line("Podpowiedź do wstępu", i.intro),
    i.klucze ? "Agent dysponuje kluczami do nieruchomości" : "",
    line("Status", i.status),
    line("Budynek", i.budynek),
    line("Rok budowy", i.rokBudowy),
    line("Ogrzewanie", i.ogrzewanie),
    line("Stan prawny", i.stanPrawny),
    line("Uwaga do układu", i.ukladWstep),
    rooms ? `Pomieszczenia:\n${rooms}` : "",
    atuty ? `Atuty (do rozwinięcia):\n${atuty}` : "",
    line("Uwagi o lokalizacji", i.lokalizacjaWstep),
    line("Komunikacja (fakty od agenta)", i.komunikacja),
    line("Zieleń i rekreacja (fakty)", i.zielen),
    line("Infrastruktura (fakty)", i.infrastruktura),
    line("Potencjał inwestycyjny (uwagi)", i.potencjal),
    line(i.transakcja === "wynajem" ? "Odstępne" : "Cena", i.cena),
    line("Dodatkowo (garaż/komórka)", i.cenaDodatki),
    line("Czynsz administracyjny", i.czynszAdmin),
    line("Kaucja", i.kaucja),
    line("Media", i.media),
    line("Uwagi do rekomendacji", i.rekomendacja),
    line("Dostępność", i.dostepnosc),
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response(JSON.stringify({ error: "Nie zalogowano" }), { status: 401 });

  let input: OpisInput;
  try {
    input = (await request.json()) as OpisInput;
  } catch {
    return new Response(JSON.stringify({ error: "Złe dane" }), { status: 400 });
  }

  let anthropic;
  try {
    anthropic = createAnthropic();
  } catch {
    return new Response(
      JSON.stringify({ error: "AI niedostępne (brak ANTHROPIC_API_KEY)." }),
      { status: 503 },
    );
  }

  try {
    const response = await anthropic.messages.create({
      model: COACH_MODEL,
      max_tokens: 2600,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Napisz opis ogłoszenia na podstawie tych faktów:\n\n${factsFromInput(input)}`,
        },
      ],
    });

    const body = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();

    // Doklejamy stałe zakończenie Spectra + klauzulę prawną (gwarantowana treść).
    const text = `${body}\n\n${standardClosing(input.transakcja, input.english)}`;

    return Response.json({ text });
  } catch (err) {
    console.error("AI opis error:", err);
    return new Response(
      JSON.stringify({ error: "Nie udało się wygenerować (sprawdź kredyty API)." }),
      { status: 503 },
    );
  }
}
