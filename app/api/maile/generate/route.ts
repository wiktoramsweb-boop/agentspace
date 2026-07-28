import { getCurrentUser } from "@/lib/auth";
import { createAnthropic, COACH_MODEL } from "@/lib/ai/client";

export const maxDuration = 60;

// Wskazówki strukturalne per typ maila (na bazie realnych maili Spectry).
const TYPE_GUIDE: Record<string, { label: string; guide: string }> = {
  raport: {
    label: "Raport z działań sprzedażowych/marketingowych",
    guide:
      "Struktura: krótkie wprowadzenie → sekcje z nagłówkami (np. Statystyki i zainteresowanie, Co wykonano od ostatniego razu, Najbliższe działania) → zamknięcie z dyspozycyjnością. Rzeczowo, na danych agenta. Jeśli zainteresowanie małe — osadź to uczciwie w kontekście (sezon, cykl sprzedaży, strategia ceny), nie ukrywaj słabych wyników.",
  },
  podsumowanie: {
    label: "Podsumowanie spotkania + wzór umowy",
    guide:
      "Krótki, ciepły mail (4–7 zdań): nawiązanie do spotkania, przesłanie podsumowania i wzoru umowy pośrednictwa, wzmianka że czas trwania i prowizja są do ustalenia, dyspozycyjność, miłe zamknięcie.",
  },
  propozycja: {
    label: "Propozycja współpracy (oferta + warunki)",
    guide:
      "Podziękowanie za spotkanie → propozycja formuły (umowa na wyłączność, okres, prowizja, zakres obsługi) → uczciwa analiza ceny startowej vs wartość rynkowa (tylko na podanych danych) → wyraźne pozostawienie decyzji klientowi bez nacisku. Profesjonalnie i szczerze.",
  },
  obiekcje: {
    label: "Odpowiedź na obiekcje / negocjacja warunków",
    guide:
      "Empatyczne uznanie stanowiska klienta → spokojna, merytoryczna odpowiedź → otwartość na kompromis bez desperacji → podtrzymanie relacji. Przy zastrzeżeniu do prowizji: uzasadnij wartość, ale pokaż gotowość do dialogu.",
  },
  followup: {
    label: "Follow-up / odświeżenie kontaktu",
    guide:
      "Delikatne przypomnienie się bez nacisku, nowa wartość lub informacja (jeśli podana), pytanie otwierające dalszą rozmowę. Krótko i ciepło.",
  },
  niezadowolenie: {
    label: "Odpowiedź na niezadowolenie właściciela",
    guide:
      "Najpierw zrozumienie frustracji i docenienie szczerości klienta → konkret: co realnie robimy (plan działań) → uczciwe dane rynkowe bez podważania decyzji klienta → pozostawienie mu pełnej kontroli (np. możliwość rozwiązania umowy bez warunków) → podkreślenie, że chcemy domknąć sprzedaż. Spokojnie, dojrzale, bez defensywy.",
  },
  ogolny: {
    label: "Inny / własny profesjonalny mail",
    guide: "Profesjonalny mail w tonie Spectry na temat podany przez agenta.",
  },
};

const SYSTEM = `Jesteś asystentem piszącym maile dla biura nieruchomości Spectra (Kraków). Piszesz w imieniu agenta do klienta.

TON SPECTRY (zachowaj wiernie):
- Język polski, formy grzecznościowe „Pan/Pani" + imię (np. „Dzień dobry Panie Marcinie,").
- Profesjonalny, ciepły, konkretny. Oparty na faktach, nie na ogólnikach.
- Szczery i dojrzały — jeśli sytuacja jest trudna (mało zainteresowania, cena za wysoka), mów o tym wprost, ale spokojnie i z klasą, osadzając w kontekście.
- Empatyczny wobec klienta, pewny siebie, nigdy nachalny.
- Struktura: akapity; przy raportach/propozycjach sekcje z nagłówkami lub numeracją.
- Zakończenie: „Pozdrawiam serdecznie," (standard) lub przy trudnych/formalnych „Z wyrazami szacunku," + imię i nazwisko agenta.

ZASADY (bardzo ważne):
- Używaj TYLKO faktów, liczb i szczegółów podanych przez agenta. NIGDY nie wymyślaj statystyk, cen, dat, liczby prezentacji, procentów itp. Jeśli czegoś brakuje, a jest potrzebne — wstaw wyraźny placeholder w nawiasach kwadratowych, np. [liczba wyświetleń], żeby agent uzupełnił.
- Nie obiecuj rzeczy, których agent nie wskazał.
- Dopasuj długość do typu i ilości podanych faktów — nie rozwadniaj.
- Zawsze wywołaj narzędzie napisz_mail z tematem i treścią.`;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response(JSON.stringify({ error: "Nie zalogowano" }), { status: 401 });

  let body: {
    type?: string;
    recipient?: string;
    property?: string;
    facts?: string;
    length?: string;
    signature?: string;
  };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Złe dane" }), { status: 400 });
  }

  const type = body.type && TYPE_GUIDE[body.type] ? body.type : "ogolny";
  const facts = (body.facts ?? "").trim();
  if (!facts && type !== "podsumowanie") {
    return new Response(JSON.stringify({ error: "Napisz krótko co przekazać / jakie fakty." }), { status: 400 });
  }

  let anthropic;
  try {
    anthropic = createAnthropic();
  } catch {
    return new Response(JSON.stringify({ error: "AI niedostępne (brak ANTHROPIC_API_KEY)." }), { status: 503 });
  }

  const t = TYPE_GUIDE[type];
  const lengthMap: Record<string, string> = {
    krotki: "krótki i zwięzły",
    standard: "standardowej długości",
    szczegolowy: "szczegółowy, rozbudowany",
  };
  const lengthHint = lengthMap[body.length ?? "standard"] ?? "standardowej długości";

  const userContent = `Typ maila: ${t.label}
Wskazówki do tego typu: ${t.guide}
Do kogo (forma grzecznościowa + imię): ${body.recipient?.trim() || "[Imię klienta]"}
Nieruchomość / temat (kontekst): ${body.property?.trim() || "—"}
Długość: mail ${lengthHint}
Podpis (imię i nazwisko agenta): ${body.signature?.trim() || user.full_name || "[Imię i nazwisko]"}

Fakty i treść do przekazania (użyj TYLKO tego, nie wymyślaj liczb ani faktów):
${facts || "(brak dodatkowych faktów — napisz standardowy mail tego typu)"}`;

  try {
    const response = await anthropic.messages.create({
      model: COACH_MODEL,
      max_tokens: 1600,
      system: SYSTEM,
      tools: [
        {
          name: "napisz_mail",
          description: "Zwraca gotowy mail: temat i treść, w tonie Spectry.",
          input_schema: {
            type: "object",
            properties: {
              subject: { type: "string", description: "Temat maila (krótki, konkretny)." },
              body: { type: "string", description: "Treść maila z powitaniem, akapitami i podpisem." },
            },
            required: ["subject", "body"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "napisz_mail" },
      messages: [{ role: "user", content: userContent }],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return new Response(JSON.stringify({ error: "Nie udało się wygenerować maila." }), { status: 502 });
    }
    return Response.json({ data: toolUse.input });
  } catch (err) {
    console.error("maile generate error:", err);
    return new Response(JSON.stringify({ error: "Nie udało się wygenerować (sprawdź kredyty API)." }), { status: 503 });
  }
}
