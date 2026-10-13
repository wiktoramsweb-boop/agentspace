/**
 * Rozmowa głosowa z klientem AI (ElevenLabs Agents).
 *
 * Dlaczego gotowa platforma, a nie własne sklejanie mowy:
 * w rozmowie na żywo liczy się nie sama synteza, tylko wykrywanie końca
 * wypowiedzi, wchodzenie w słowo i opóźnienie poniżej sekundy. To jest
 * osobny problem inżynieryjny i rozwiązany produkt kosztuje mniej niż
 * miesiąc dłubania w nim samemu.
 *
 * Klucz API nigdy nie trafia do przeglądarki. Serwer prosi dostawcę
 * o jednorazowy token rozmowy i to on idzie do klienta.
 */

const API = "https://api.elevenlabs.io/v1";

export function kluczGlosu(): string | null {
  return process.env.ELEVENLABS_API_KEY?.trim() || null;
}

/**
 * Agent dostawcy. Dwa osobne, bo głos ustawia się na agencie, a nie na
 * pojedynczej rozmowie: inaczej każdy klient AI brzmiałby tak samo.
 */
export function agentGlosu(plec: "k" | "m"): string | null {
  const m = process.env.ELEVENLABS_AGENT_ID?.trim() || null;
  // Dwie nazwy, bo tak stoi na produkcji, a druga była w instrukcji wdrożenia.
  const k =
    process.env.ELEVENLABS_AGENT_ID2?.trim() ||
    process.env.ELEVENLABS_AGENT_ID_K?.trim() ||
    m;
  return plec === "k" ? k : m;
}

/** Czy w ogóle pokazywać przycisk rozmowy. Bez konfiguracji nie istnieje. */
export function glosWlaczony(): boolean {
  return Boolean(kluczGlosu() && agentGlosu("m"));
}

/**
 * Dwie drogi do tej samej rozmowy.
 *
 * WebRTC ma niższe opóźnienie, ale chodzi po UDP i potrafi nie wstać w sieci
 * firmowej albo gdy dostawcy miga infrastruktura. WebSocket idzie zwykłym
 * portem 443 i przechodzi wszędzie, tylko wolniej. Bierzemy oba naraz, bo
 * zapytanie o drugi kosztuje ułamek sekundy, a oszczędza całą rozmowę.
 */
export type DostepDoRozmowy = {
  /** Token do połączenia WebRTC. */
  token: string | null;
  /** Podpisany adres do połączenia WebSocket. */
  adres: string | null;
  /** Komunikat dostawcy, gdy nie udało się nic zdobyć. */
  blad: string | null;
};

async function pobierz(sciezka: string, pole: "token" | "signed_url"): Promise<{ wartosc: string | null; blad: string | null }> {
  const klucz = kluczGlosu();
  if (!klucz) return { wartosc: null, blad: "Brak klucza dostawcy." };

  try {
    const r = await fetch(`${API}${sciezka}`, {
      headers: { "xi-api-key": klucz },
      cache: "no-store",
    });
    const tresc = await r.text();
    if (!r.ok) {
      // Komunikat dostawcy idzie dalej w całości. Bez niego każdy problem
      // wyglądał tak samo i nie dało się odróżnić awarii od złej konfiguracji.
      return { wartosc: null, blad: `${r.status}: ${tresc.slice(0, 300)}` };
    }
    const dane = JSON.parse(tresc) as Record<string, string | undefined>;
    return { wartosc: dane[pole] ?? null, blad: dane[pole] ? null : "Dostawca nie zwrócił tokenu." };
  } catch (e) {
    return { wartosc: null, blad: e instanceof Error ? e.message : "Brak odpowiedzi." };
  }
}

export async function dostepDoRozmowy(plec: "k" | "m"): Promise<DostepDoRozmowy> {
  const agent = agentGlosu(plec);
  if (!agent) return { token: null, adres: null, blad: "Brak identyfikatora agenta." };
  const id = encodeURIComponent(agent);

  const [webrtc, websocket] = await Promise.all([
    pobierz(`/convai/conversation/token?agent_id=${id}`, "token"),
    pobierz(`/convai/conversation/get-signed-url?agent_id=${id}`, "signed_url"),
  ]);

  return {
    token: webrtc.wartosc,
    adres: websocket.wartosc,
    blad: webrtc.wartosc || websocket.wartosc ? null : (webrtc.blad ?? websocket.blad),
  };
}

/**
 * Pierwsze zdanie klienta AI.
 *
 * Przy telefonie to agent dzwoni, więc klient odbiera, a nie zaczyna
 * prezentację. Przy spotkaniu odwrotnie: to on wpuszcza agenta do środka.
 */
export function pierwszeZdanie(rodzaj: string | null | undefined): string {
  return rodzaj === "spotkanie" || rodzaj === "najem"
    ? "Dzień dobry, zapraszam, proszę siadać."
    : "Słucham?";
}

/**
 * Czyszczenie wypowiedzi z znaczników emocji.
 *
 * Tryb ekspresyjny u dostawcy steruje barwą głosu wstawkami w nawiasach
 * kwadratowych: „[hesitant] Dzień dobry. [thoughtful] No wie pan...". W uchu
 * ich nie ma, ale w zapisanym tekście zostają i robią dwie szkody naraz:
 * transkrypt wygląda jak kod, a model oceniający liczy je jako wypowiedź
 * agenta i wytyka rzeczy, których nikt nie powiedział.
 *
 * Nawias kwadratowy nie pada w mowie, więc wycinamy go bez wyjątków.
 */
export function bezZnacznikowMowy(tekst: string): string {
  return tekst
    .replace(/\[[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż ]{2,24}\]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
