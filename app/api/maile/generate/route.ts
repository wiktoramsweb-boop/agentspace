import { getCurrentUser } from "@/lib/auth";
import { createAnthropic, COACH_MODEL } from "@/lib/ai/client";

export const maxDuration = 60;

// Wskazówki strukturalne per typ MAILA (na bazie realnych maili Spectry).
const EMAIL_GUIDE: Record<string, string> = {
  raport:
    "Raport z działań. Struktura: krótkie wprowadzenie → sekcje z nagłówkami (Statystyki i zainteresowanie, Co wykonano, Najbliższe działania) → zamknięcie z dyspozycyjnością. Jeśli zainteresowanie małe - osadź to uczciwie w kontekście (sezon, cykl sprzedaży, strategia ceny).",
  podsumowanie:
    "Podsumowanie spotkania + wzór umowy. Krótki, ciepły mail (4-7 zdań): nawiązanie do spotkania, przesłanie podsumowania i wzoru umowy, wzmianka że czas i prowizja do ustalenia, dyspozycyjność.",
  propozycja:
    "Propozycja współpracy. Podziękowanie za spotkanie → propozycja formuły (wyłączność, okres, prowizja, zakres obsługi) → uczciwa analiza ceny startowej vs wartość rynkowa (tylko na podanych danych) → decyzja po stronie klienta, bez nacisku.",
  obiekcje:
    "Odpowiedź na obiekcje / negocjacja. Empatyczne uznanie stanowiska → spokojna, merytoryczna odpowiedź → otwartość na kompromis bez desperacji → podtrzymanie relacji.",
  followup:
    "Follow-up / odświeżenie kontaktu. Delikatne przypomnienie bez nacisku, nowa wartość/informacja jeśli podana, pytanie otwierające dalszą rozmowę. Krótko i ciepło.",
  niezadowolenie:
    "Odpowiedź niezadowolonemu właścicielowi. Zrozumienie frustracji i docenienie szczerości → konkret: co realnie robimy (plan) → uczciwe dane rynkowe bez podważania decyzji klienta → pozostawienie mu pełnej kontroli (np. rozwiązanie umowy bez warunków) → chcemy domknąć sprzedaż. Spokojnie, dojrzale, bez defensywy.",
  oferta_cenowa:
    "Przekazanie oferty cenowej właścicielowi. Poinformuj o ofercie kupującego (kwota, warunki podane przez agenta), krótki kontekst rynkowy jeśli podany, jasne pytanie o decyzję właściciela. Neutralnie, bez wywierania presji.",
  kontroferta:
    "Kontroferta / odpowiedź na ofertę cenową. Podziękuj za ofertę, przekaż stanowisko drugiej strony (kontrpropozycja/uzasadnienie), utrzymaj rozmowę otwartą i konstruktywną.",
  zapytanie:
    "Odpowiedź na zapytanie o ofertę (do kupującego). Podziękuj za zainteresowanie, przekaż kluczowe informacje o nieruchomości (tylko podane), zaproponuj termin prezentacji, dyspozycyjność.",
  prezentacja_zaproszenie:
    "Zaproszenie / umówienie prezentacji. Zaproponuj konkretny termin (jeśli podany), adres, co warto wiedzieć przed oglądaniem, prośba o potwierdzenie.",
  potwierdzenie_terminu:
    "Potwierdzenie terminu (spotkanie / prezentacja / umowa przedwstępna / notariusz). Potwierdź datę i godzinę, podaj adres i ewentualny link do map DOKŁADNIE jak podano, co zabrać / o czym pamiętać. Krótko i konkretnie.",
  dokumenty:
    "Prośba o dokumenty / informacje. Uprzejmie wypunktuj czego potrzebujesz i po co, podaj sposób i termin przekazania jeśli podany.",
  podziekowanie:
    "Podziękowanie (po prezentacji / po transakcji / za współpracę). Ciepło, personalnie, z otwarciem na dalszy kontakt lub kolejne kroki.",
  aktualizacja:
    "Aktualizacja statusu, gdy brak dużych nowości. Uczciwie: co się działo (mało/dużo ruchu), dlaczego, co planujemy dalej. Utrzymanie zaufania mimo braku przełomu.",
  slaby_okres:
    "Trudny/słaby okres - uczciwie i profesjonalnie. Gdy jest mało zapytań i ruchu. ZASADA NADRZĘDNA: NIE ukrywaj słabego wyniku i NIGDY nie wymyślaj zainteresowanych klientów, ofert ani statystyk. Zamiast tego: (1) przekaż stan wprost i spokojnie; (2) osadź go w rzetelnym kontekście (sezon urlopowy, naturalny cykl budowania widoczności 4-8 tygodni, selektywna grupa docelowa przy wyższej cenie lub nietypowej nieruchomości) - tylko jeśli faktycznie pasuje; (3) wyeksponuj KONKRETNE, realne działania, które agent podał, że wykonano; (4) jasny plan na najbliższy czas; (5) utrzymanie zaufania i poczucia kontroli u właściciela. Ton dojrzałego doradcy, który panuje nad sytuacją - nie kogoś, kto się tłumaczy. Jeśli agent nie podał działań ani kontekstu, użyj placeholderów [w nawiasach], nie zmyślaj.",
  ogolny: "Profesjonalny mail w tonie Spectry na temat podany przez agenta.",
};

// Wskazówki per typ SMS-a (krótkie wiadomości).
const SMS_GUIDE: Record<string, string> = {
  sms_potwierdzenie:
    "Potwierdzenie terminu (spotkanie / prezentacja / umowa / notariusz). Podaj datę, godzinę, adres i link do map DOKŁADNIE jak podano.",
  sms_przypomnienie: "Przypomnienie o jutrzejszym / najbliższym spotkaniu. Data, godzina, miejsce.",
  sms_oferta_wyslana: "Informacja, że oferta/dokumenty zostały wysłane na maila i prośba o potwierdzenie odbioru.",
  sms_followup: "Szybki, ciepły follow-up po prezentacji - jak wrażenia, czy są pytania.",
  sms_kontakt: "Prośba o kontakt / oddzwonienie w dogodnym momencie.",
  sms_nowa_oferta: "Info dla kupującego o nowej ofercie pasującej do jego kryteriów + zachęta do kontaktu.",
  sms_podziekowanie: "Krótkie podziękowanie po spotkaniu / prezentacji.",
  sms_ogolny: "Krótki, profesjonalny SMS na temat podany przez agenta.",
};

const SYSTEM_MAIL = `Jesteś asystentem piszącym maile dla biura nieruchomości Spectra (Kraków). Piszesz w imieniu agenta do klienta.

TON SPECTRY (zachowaj wiernie):
- Język polski, formy grzecznościowe „Pan/Pani" + imię (np. „Dzień dobry Panie Marcinie,").
- Profesjonalny, ciepły, konkretny. Oparty na faktach, nie na ogólnikach.
- Szczery i dojrzały - jeśli sytuacja trudna, mów o tym wprost, ale spokojnie i z klasą.
- Empatyczny, pewny siebie, nigdy nachalny.
- Struktura: akapity; przy raportach/propozycjach sekcje z nagłówkami lub numeracją.
- Zakończenie: „Pozdrawiam serdecznie," lub przy trudnych/formalnych „Z wyrazami szacunku," + imię i nazwisko agenta.

ZASADY:
- Używaj TYLKO faktów, liczb i szczegółów podanych przez agenta. NIGDY nie wymyślaj statystyk, cen, dat, godzin, adresów. Braki oznacz placeholderem w [nawiasach kwadratowych] do uzupełnienia.
- Linki i adresy przepisuj dokładnie jak podano.
- Nie obiecuj rzeczy, których agent nie wskazał. Dopasuj długość do typu i ilości faktów.
- INTERPUNKCJA (ważne): NIGDY nie używaj myślnika ani półpauzy (znaki — i –). Zamiast nich stosuj przecinek, dwukropek, kropkę albo nawias. Zwykły dywiz tylko w wyrazach złożonych i zakresach (np. 10-12).
- Zawsze wywołaj narzędzie napisz_mail z tematem i treścią.`;

const SYSTEM_SMS = `Piszesz KRÓTKIEGO SMS-a w imieniu agenta biura nieruchomości Spectra (Kraków).

ZASADY:
- Bardzo krótko: 1-3 zdania, maks ~320 znaków. Bez nagłówków, bez rozbudowanego podpisu.
- Uprzejmie i konkretnie. Można zacząć „Panie Pawle," lub „Dzień dobry,". Podpis krótki (imię agenta), albo bez - jeśli nie pasuje.
- Godziny, daty, adresy, linki i kwoty: DOKŁADNIE jak podał agent, nie zmieniaj URL. Nie wymyślaj żadnych danych; braki jako [nawiasy].
- INTERPUNKCJA (ważne): NIGDY nie używaj myślnika ani półpauzy (znaki — i –). Zamiast nich przecinek, dwukropek lub kropka.
- Zawsze wywołaj narzędzie napisz_sms z tekstem.`;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response(JSON.stringify({ error: "Nie zalogowano" }), { status: 401 });

  let body: {
    mode?: string;
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

  const isSms = body.mode === "sms";
  const guideMap = isSms ? SMS_GUIDE : EMAIL_GUIDE;
  const type = body.type && guideMap[body.type] ? body.type : isSms ? "sms_ogolny" : "ogolny";
  const facts = (body.facts ?? "").trim();

  let anthropic;
  try {
    anthropic = createAnthropic();
  } catch {
    return new Response(JSON.stringify({ error: "AI niedostępne (brak ANTHROPIC_API_KEY)." }), { status: 503 });
  }

  const lengthMap: Record<string, string> = {
    krotki: "krótki i zwięzły",
    standard: "standardowej długości",
    szczegolowy: "szczegółowy, rozbudowany",
  };
  const lengthHint = lengthMap[body.length ?? "standard"] ?? "standardowej długości";

  const userContent = `Typ: ${type}
Wskazówki: ${guideMap[type]}
Do kogo (forma grzecznościowa + imię): ${body.recipient?.trim() || "[Imię klienta]"}
${isSms ? "" : `Nieruchomość / temat: ${body.property?.trim() || "-"}\nDługość: ${lengthHint}\n`}Podpis (imię i nazwisko agenta): ${body.signature?.trim() || user.full_name || "[Imię i nazwisko]"}

Fakty i treść do przekazania (użyj TYLKO tego, nie wymyślaj danych):
${facts || "(brak dodatkowych faktów - napisz standardową wiadomość tego typu z placeholderami w nawiasach)"}`;

  const tool = isSms
    ? {
        name: "napisz_sms",
        description: "Zwraca krótkiego SMS-a.",
        input_schema: {
          type: "object" as const,
          properties: { text: { type: "string", description: "Treść SMS-a (krótka)." } },
          required: ["text"],
        },
      }
    : {
        name: "napisz_mail",
        description: "Zwraca gotowy mail: temat i treść.",
        input_schema: {
          type: "object" as const,
          properties: {
            subject: { type: "string", description: "Temat maila (krótki, konkretny)." },
            body: { type: "string", description: "Treść maila z powitaniem, akapitami i podpisem." },
          },
          required: ["subject", "body"],
        },
      };

  try {
    const response = await anthropic.messages.create({
      model: COACH_MODEL,
      max_tokens: isSms ? 400 : 1600,
      system: isSms ? SYSTEM_SMS : SYSTEM_MAIL,
      tools: [tool],
      tool_choice: { type: "tool", name: tool.name },
      messages: [{ role: "user", content: userContent }],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return new Response(JSON.stringify({ error: "Nie udało się wygenerować." }), { status: 502 });
    }
    const input = toolUse.input as { subject?: string; body?: string; text?: string };
    if (isSms) return Response.json({ data: { subject: "", body: input.text ?? "" } });
    return Response.json({ data: { subject: input.subject ?? "", body: input.body ?? "" } });
  } catch (err) {
    console.error("maile generate error:", err);
    return new Response(JSON.stringify({ error: "Nie udało się wygenerować (sprawdź kredyty API)." }), { status: 503 });
  }
}
