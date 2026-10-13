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
 * o jednorazowy podpisany adres i to on idzie do klienta.
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
  const k = process.env.ELEVENLABS_AGENT_ID_K?.trim() || m;
  return plec === "k" ? k : m;
}

/** Czy w ogóle pokazywać przycisk rozmowy. Bez konfiguracji nie istnieje. */
export function glosWlaczony(): boolean {
  return Boolean(kluczGlosu() && agentGlosu("m"));
}

/**
 * Jednorazowy adres do połączenia.
 *
 * Ważny kilkanaście minut i tylko na jedną rozmowę, więc nawet podejrzany
 * w narzędziach przeglądarki nie daje dostępu do konta.
 */
export async function podpisanyAdres(plec: "k" | "m"): Promise<string | null> {
  const klucz = kluczGlosu();
  const agent = agentGlosu(plec);
  if (!klucz || !agent) return null;

  const r = await fetch(`${API}/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agent)}`, {
    headers: { "xi-api-key": klucz },
    cache: "no-store",
  });
  if (!r.ok) return null;

  const dane = (await r.json()) as { signed_url?: string };
  return dane.signed_url ?? null;
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
