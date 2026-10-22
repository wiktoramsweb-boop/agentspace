import { createAnthropic, COACH_MODEL, SCORING_MODEL } from "./client";
import { odpowiedzJson } from "./struktura";
import { PERSONALITIES, type ChatMessage } from "../types";
import { blokOferty, faktyOferty, type KontekstOferty } from "./oferta-kontekst";
import { realizmScenariusza } from "../coach/realizm";

/**
 * Buduje system prompt dla AI grającego klienta: wstawia opis osobowości
 * w miejsce placeholdera {{PERSONALITY}}.
 */
const DIFFICULTY_BLOCK: Record<string, string> = {
  latwy:
    "\n\nPOZIOM TRUDNOŚCI: ŁATWY. To najważniejsza instrukcja - jesteś życzliwym, otwartym klientem. Obiekcje zgłaszasz miękko i szybko dajesz się przekonać każdemu sensownemu argumentowi. Nagradzaj nawet niedoskonałe próby agenta, bądź wyrozumiały. Celem jest zbudowanie pewności początkującego agenta, więc doprowadź rozmowę do pozytywnego zakończenia, jeśli agent w ogóle się stara.",
  sredni:
    "\n\nPOZIOM TRUDNOŚCI: ŚREDNI. Standardowy, realistyczny opór - trzymasz swoją obiekcję, ale ustępujesz przy dobrych, konkretnych argumentach. Nie oddawaj za łatwo, ale też nie bądź nadmiernie trudny.",
  trudny:
    "\n\nPOZIOM TRUDNOŚCI: TRUDNY. Jesteś wymagającym klientem - trzymasz obiekcję twardo i ustępujesz tylko przy naprawdę mocnych, konkretnych i dobrze poprowadzonych argumentach. Testuj agenta.",
};

export function buildClientSystemPrompt(
  scenarioSystemPrompt: string,
  personality: string,
  difficulty = "sredni",
  oferta?: KontekstOferty | null,
  instrukcjaPlci = "",
  slug: string | null = null,
): string {
  const p = PERSONALITIES.find((x) => x.value === personality);
  const desc = p
    ? `${p.label} - ${p.description}. Graj konsekwentnie tę postawę przez całą rozmowę.`
    : "Neutralny, przeciętny klient.";
  const diff = DIFFICULTY_BLOCK[difficulty] ?? DIFFICULTY_BLOCK.sredni;
  // Klient AI ma mówić jak człowiek, a myślnik w wypowiedzi zdradza tekst z AI.
  const style =
    realizmScenariusza(slug, difficulty) +
    "\n\nINTERPUNKCJA: nie używaj myślnika ani półpauzy (znaki — i –). Zamiast nich przecinek, dwukropek lub kropka." +
    "\n\nDŁUGOŚĆ: mów jak w prawdziwej rozmowie telefonicznej, zwykle jedno, najwyżej dwa krótkie zdania naraz. Jedno pytanie na raz, nie zasypuj agenta kilkoma.";
  return scenarioSystemPrompt.replace("{{PERSONALITY}}", desc) + instrukcjaPlci + (oferta ? blokOferty(oferta) : "") + diff + style;
}

/**
 * Konwersja transkryptu (agent/client) na format wiadomości Anthropic.
 * AI gra KLIENTA, więc: wiadomości klienta = assistant, agenta = user.
 */
function toAnthropicMessages(transcript: ChatMessage[]) {
  return transcript.map((m) => ({
    role: m.role === "client" ? ("assistant" as const) : ("user" as const),
    content: m.content,
  }));
}

/**
 * Streamuje kolejną odpowiedź AI klienta.
 * Zwraca ReadableStream tekstu (do przesłania do przeglądarki).
 */
export async function streamClientReply(
  scenarioSystemPrompt: string,
  personality: string,
  transcript: ChatMessage[],
  difficulty = "sredni",
): Promise<ReadableStream<Uint8Array>> {
  const anthropic = createAnthropic();
  const system = buildClientSystemPrompt(scenarioSystemPrompt, personality, difficulty);
  const messages = toAnthropicMessages(transcript);

  // Jeśli transkrypt pusty lub ostatni był od klienta - zaczynamy rozmowę
  // (AI wypowiada pierwsze zdanie). Wtedy dokładamy "user" trigger.
  const needsOpener =
    messages.length === 0 || messages[messages.length - 1].role === "assistant";
  if (needsOpener) {
    messages.push({
      role: "user",
      content: "[System: rozpocznij rozmowę zgodnie z instrukcją.]",
    });
  }

  const stream = await anthropic.messages.create({
    model: COACH_MODEL,
    max_tokens: 700,
    system: [
      {
        type: "text",
        text: system,
        // Prompt caching - system prompt jest długi i powtarza się co turę.
        cache_control: { type: "ephemeral" },
      },
    ],
    messages,
    stream: true,
  });

  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode("\n[Błąd połączenia z AI. Spróbuj ponownie.]"),
        );
        console.error("streamClientReply error:", err);
      } finally {
        controller.close();
      }
    },
  });
}

/** Jeden konkretny moment rozmowy: cytat agenta i co z nim zrobić. */
export type Moment = {
  cytat: string;
  ocena: "dobrze" | "do_poprawy";
  komentarz: string;
  /** Gotowe zdanie, które agent może powiedzieć następnym razem. */
  lepiej?: string;
  /** Krótki tytuł momentu na oś rozmowy („Za szybkie wejście w temat”). */
  tytul?: string;
  /** Moment, który najbardziej zaważył na wyniku. */
  kluczowy?: boolean;
};

export type KategoriaOceny = { klucz: "otwarcie" | "kwalifikacja" | "obiekcje" | "zamkniecie"; punkty: number; max: number; uzasadnienie: string };

/** Pełna analiza rozmowy. Zapisujemy ją w training_sessions.context.analiza (bez migracji). */
export type Analiza = {
  wersja: 2;
  /** Wynik 0-100, suma punktów z kategorii. */
  wynik: number;
  naglowek: string;
  cel: { osiagniety: boolean; opis: string };
  kategorie: KategoriaOceny[];
  obiekcje: { tresc: string; rozbita: boolean; jak: string }[];
  nastepnym: string[];
};

export type ScoringResult = {
  overall: number;
  opening: number;
  qualification: number;
  objection_handling: number;
  closing: number;
  summary: string;
  suggestions: string[];
  moments: Moment[];
  analiza: Analiza;
};

export const MAKS_PUNKTOW = { otwarcie: 20, kwalifikacja: 25, obiekcje: 30, zamkniecie: 25 } as const;

const SCORING_SYSTEM = `Jesteś wymagającym trenerem sprzedaży nieruchomości w Polsce, który słuchał tysięcy prawdziwych rozmów agentów. Analizujesz transkrypt treningu: AGENT rozmawiał z symulowanym KLIENTEM.

Oceniasz WYŁĄCZNIE wypowiedzi AGENTA. Piszesz po polsku, konkretnie, zawsze odnosząc się do tego, co agent naprawdę powiedział albo czego nie powiedział.

PUNKTY (razem 0-100), za każdą kategorię dajesz liczbę całkowitą i jedno-dwa zdania uzasadnienia:
- otwarcie (0-20): czy agent przedstawił się i podał powód telefonu, czy zbudował kontakt, czy nie wszedł nachalnie w sprzedaż.
- kwalifikacja (0-25): czy zadawał dobre, otwarte pytania i wydobył sytuację klienta: motywację, termin, budżet, osobę decyzyjną, problem.
- obiekcje (0-30): czy uznał obiekcję, dopytał o powód i odpowiedział konkretem. Jeśli obiekcji nie było, oceniasz, jak radził sobie z oporem i wątpliwościami.
- zamkniecie (0-25): czy zaproponował konkretny następny krok z terminem i czy klient się zgodził.

Skala ma być prawdziwa jak u dobrego trenera: rozmowa urwana po dwóch zdaniach to 0-15 punktów, przeciętna rozmowa bez umówionego kroku to 35-55, dobra z umówionym spotkaniem 70-85, wzorcowa 90+. Gdy klient się rozłączył, zamkniecie to 0.

naglowek: jedno zdanie werdyktu, jak tytuł w raporcie (np. „Rozmowa urwana po ujawnieniu, że dzwonisz jako pośrednik.” albo „Spotkanie umówione, ale bez rozpoznania motywacji.”).
cel: czy agent osiągnął cel scenariusza (osiagniety true/false) i jednym zdaniem dlaczego.
obiekcje: lista obiekcji, które klient zgłosił (treść krótko), czy agent je rozbił (rozbita) i jak (jednym zdaniem). Pusta lista, gdy klient nie zgłosił żadnej.
nastepnym: dokładnie 3 konkretne polecenia na następne podejście, każde z gotowym sformułowaniem do powiedzenia.

moments: 3-6 momentów rozmowy w kolejności z rozmowy. Każdy: DOSŁOWNY cytat wypowiedzi agenta (do 200 znaków, skopiowany z transkryptu bez zmian), tytul (2-6 słów, np. „Za szybkie wejście w temat”), ocena „dobrze” albo „do_poprawy”, komentarz (1-2 zdania: co klient poczuł i dlaczego), przy „do_poprawy” pole lepiej: gotowe zdanie zamiast tego. Oznacz kluczowy: true przy jednym momencie, który najbardziej zaważył na wyniku. Jeśli agent zrobił coś dobrze, daj przynajmniej jeden moment „dobrze”.

summary: 2-3 zdania podsumowania. suggestions: te same 3 polecenia co w nastepnym.

INTERPUNKCJA: nie używaj myślnika ani półpauzy (znaki — i –). Zamiast nich przecinek, dwukropek albo kropka. Odpowiadasz tylko narzędziem, bez dodatkowego tekstu.`;

type SurowaOcena = {
  naglowek: string;
  cel_osiagniety: boolean;
  cel_opis: string;
  otwarcie: number;
  otwarcie_uzasadnienie: string;
  kwalifikacja: number;
  kwalifikacja_uzasadnienie: string;
  obiekcje_punkty: number;
  obiekcje_uzasadnienie: string;
  zamkniecie: number;
  zamkniecie_uzasadnienie: string;
  obiekcje: { tresc: string; rozbita: boolean; jak: string }[];
  nastepnym: string[];
  summary: string;
  moments: Moment[];
};

/**
 * Ocenia zakończoną sesję. Tool use gwarantuje poprawny format.
 * Stare kolumny 1-10 liczymy z punktów, żeby historia, ranking i zadania
 * od menedżera działały bez zmian.
 */
export async function scoreSession(
  scenarioTitle: string,
  transcript: ChatMessage[],
  oferta?: KontekstOferty | null,
  celRozmowy?: string | null,
): Promise<ScoringResult> {
  const dialogue = transcript
    .map((m) => `${m.role === "agent" ? "AGENT" : "KLIENT"}: ${m.content}`)
    .join("\n");

  const tekst = (opis: string) => ({ type: "string", description: opis });
  const pkt = (max: number) => ({ type: "integer", description: `Punkty 0-${max}` });

  const r = await odpowiedzJson<SurowaOcena>({
    model: SCORING_MODEL,
    maxTokens: 3200,
    system: SCORING_SYSTEM,
    schemat: {
      type: "object",
      properties: {
        naglowek: tekst("Jedno zdanie werdyktu"),
        cel_osiagniety: { type: "boolean" },
        cel_opis: tekst("Jedno zdanie o celu rozmowy"),
        otwarcie: pkt(20),
        otwarcie_uzasadnienie: tekst("1-2 zdania"),
        kwalifikacja: pkt(25),
        kwalifikacja_uzasadnienie: tekst("1-2 zdania"),
        obiekcje_punkty: pkt(30),
        obiekcje_uzasadnienie: tekst("1-2 zdania"),
        zamkniecie: pkt(25),
        zamkniecie_uzasadnienie: tekst("1-2 zdania"),
        obiekcje: {
          type: "array",
          items: {
            type: "object",
            properties: { tresc: tekst("Obiekcja klienta"), rozbita: { type: "boolean" }, jak: tekst("Jak agent zareagował") },
            required: ["tresc", "rozbita", "jak"],
            additionalProperties: false,
          },
        },
        nastepnym: { type: "array", items: { type: "string" }, description: "Dokładnie 3 polecenia" },
        summary: tekst("2-3 zdania"),
        moments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              cytat: tekst("Dosłowny cytat agenta"),
              tytul: tekst("2-6 słów"),
              ocena: { type: "string", enum: ["dobrze", "do_poprawy"] },
              komentarz: tekst("1-2 zdania"),
              lepiej: tekst("Gotowe lepsze zdanie (przy do_poprawy)"),
              kluczowy: { type: "boolean" },
            },
            required: ["cytat", "tytul", "ocena", "komentarz"],
            additionalProperties: false,
          },
        },
      },
      required: [
        "naglowek", "cel_osiagniety", "cel_opis",
        "otwarcie", "otwarcie_uzasadnienie", "kwalifikacja", "kwalifikacja_uzasadnienie",
        "obiekcje_punkty", "obiekcje_uzasadnienie", "zamkniecie", "zamkniecie_uzasadnienie",
        "obiekcje", "nastepnym", "summary", "moments",
      ],
      additionalProperties: false,
    },
    messages: [
      {
        role: "user",
        content:
          `Scenariusz: ${scenarioTitle}\n` +
          (celRozmowy ? `Cel agenta w tej rozmowie: ${celRozmowy}\n` : "") +
          "\n" +
          (oferta
            ? `Rozmowa dotyczyła konkretnej oferty agenta. Dane oferty:\n${faktyOferty(oferta).map((f) => `- ${f}`).join("\n")}\n\nOceń także, czy agent znał swoją ofertę. Pomyłkę w faktach pokaż jako moment "do_poprawy".\n\n`
            : "") +
          `Transkrypt rozmowy:\n\n${dialogue}\n\nOceń wypowiedzi agenta.`,
      },
    ],
  });

  const p = (v: unknown, max: number) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
  const t = (v: unknown, n: number) => String(v ?? "").replace(/[—–]/g, ",").slice(0, n);
  const kategorie: KategoriaOceny[] = [
    { klucz: "otwarcie", punkty: p(r.otwarcie, 20), max: 20, uzasadnienie: t(r.otwarcie_uzasadnienie, 400) },
    { klucz: "kwalifikacja", punkty: p(r.kwalifikacja, 25), max: 25, uzasadnienie: t(r.kwalifikacja_uzasadnienie, 400) },
    { klucz: "obiekcje", punkty: p(r.obiekcje_punkty, 30), max: 30, uzasadnienie: t(r.obiekcje_uzasadnienie, 400) },
    { klucz: "zamkniecie", punkty: p(r.zamkniecie, 25), max: 25, uzasadnienie: t(r.zamkniecie_uzasadnienie, 400) },
  ];
  const wynik = kategorie.reduce((s, k) => s + k.punkty, 0);
  const do10 = (k: KategoriaOceny) => Math.max(1, Math.min(10, Math.round((k.punkty / k.max) * 10)));
  const nastepnym = (Array.isArray(r.nastepnym) ? r.nastepnym : []).map((x) => t(x, 400)).filter(Boolean).slice(0, 3);
  const moments: Moment[] = (Array.isArray(r.moments) ? r.moments : [])
    .filter((m) => m && typeof m.cytat === "string" && typeof m.komentarz === "string")
    .slice(0, 6)
    .map((m) => ({
      cytat: m.cytat.slice(0, 300),
      ocena: m.ocena === "dobrze" ? "dobrze" : "do_poprawy",
      komentarz: t(m.komentarz, 500),
      tytul: t(m.tytul, 80),
      ...(m.kluczowy ? { kluczowy: true } : {}),
      ...(m.lepiej ? { lepiej: t(m.lepiej, 400) } : {}),
    }));

  return {
    overall: Math.max(1, Math.min(10, Math.round(wynik / 10))),
    opening: do10(kategorie[0]),
    qualification: do10(kategorie[1]),
    objection_handling: do10(kategorie[2]),
    closing: do10(kategorie[3]),
    summary: t(r.summary, 900),
    suggestions: nastepnym,
    moments,
    analiza: {
      wersja: 2,
      wynik,
      naglowek: t(r.naglowek, 200),
      cel: { osiagniety: Boolean(r.cel_osiagniety), opis: t(r.cel_opis, 300) },
      kategorie,
      obiekcje: (Array.isArray(r.obiekcje) ? r.obiekcje : []).slice(0, 6).map((o) => ({ tresc: t(o.tresc, 200), rozbita: Boolean(o.rozbita), jak: t(o.jak, 300) })),
      nastepnym,
    },
  };
}
