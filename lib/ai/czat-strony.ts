import { odpowiedzJson, type SchematJson } from "./struktura";
import { COACH_MODEL } from "./client";

/**
 * Czat na stronie biura: zagaduje odwiedzającego i wyławia kontakt.
 *
 * Konkurencja ma to pod nazwą „web agent" i to jedyna ich świeża przewaga,
 * która jest tania do dogonienia, bo strony dla biur i bazę leadów mamy od
 * dawna.
 *
 * Zwracamy JSON, a nie swobodny tekst, z jednego powodu: z rozmowy trzeba
 * wyjąć imię, telefon i czego człowiek szuka, żeby zapisać lead. Wyciąganie
 * tego drugim wywołaniem modelu kosztowałoby dwa razy więcej i rozjeżdżało
 * się z treścią, którą widzi odwiedzający.
 */

export type OdpowiedzCzatu = {
  /** Co napisać odwiedzającemu. Jedno, dwa zdania. */
  odpowiedz: string;
  imie: string | null;
  telefon: string | null;
  /** Czego szuka albo co chce sprzedać, własnymi słowami. */
  potrzeba: string | null;
  /** Czy mamy komplet, żeby agent mógł oddzwonić. */
  kontakt_zebrany: boolean;
};

const SCHEMAT: SchematJson = {
  type: "object",
  properties: {
    odpowiedz: { type: "string" },
    imie: { type: ["string", "null"] },
    telefon: { type: ["string", "null"] },
    potrzeba: { type: ["string", "null"] },
    kontakt_zebrany: { type: "boolean" },
  },
  required: ["odpowiedz", "imie", "telefon", "potrzeba", "kontakt_zebrany"],
  additionalProperties: false,
};

export function promptCzatu(biuro: { nazwa: string; oNas: string; miasto: string | null }): string {
  return `Jesteś asystentem na stronie biura nieruchomości ${biuro.nazwa}${biuro.miasto ? ` z miasta ${biuro.miasto}` : ""}.

O biurze: ${biuro.oNas}

TWOJE ZADANIE
Rozmawiaj z odwiedzającym jak miły pracownik recepcji. Ustal, czy chce kupić, sprzedać, wynająć czy wynająć komuś, i w jakiej okolicy. Gdy wiesz, czego szuka, poproś o imię i numer telefonu, żeby agent mógł oddzwonić. Nie proś o telefon w pierwszej wiadomości.

CZEGO NIE WOLNO
- Nie wymyślaj konkretnych ofert, cen ani adresów. Nie masz dostępu do bazy. Gdy ktoś pyta o konkretną nieruchomość, powiedz, że sprawdzi to agent, i poproś o kontakt.
- Nie obiecuj prowizji, terminów ani warunków umowy.
- Nie udzielaj porad prawnych ani podatkowych.
- Nie zmyślaj danych biura, których nie masz powyżej.

JAK PISZESZ
- Po polsku, krótko: jedno lub dwa zdania, maksymalnie trzy.
- Zadajesz jedno pytanie naraz.
- Nie używasz myślnika ani półpauzy (znaki — i –). Zamiast nich przecinek lub kropka.
- Nie piszesz jak formularz ani jak bot. Bez „w czym mogę pomóc" w każdej wiadomości.

POLA DO WYPEŁNIENIA
imie, telefon i potrzeba wypełniaj TYLKO tym, co człowiek sam napisał. Nic nie zgaduj. kontakt_zebrany ustaw na true dopiero wtedy, gdy masz numer telefonu.`;
}

export async function odpowiedzCzatu(
  system: string,
  rozmowa: { role: "user" | "assistant"; content: string }[],
): Promise<OdpowiedzCzatu> {
  return odpowiedzJson<OdpowiedzCzatu>({
    model: COACH_MODEL,
    system,
    messages: rozmowa,
    maxTokens: 500,
    schemat: SCHEMAT,
  });
}

/** Telefon z tekstu rozmowy. Model bywa kreatywny, więc sprawdzamy sami. */
export function telefonZTekstu(surowy: string | null): string | null {
  if (!surowy) return null;
  const cyfry = surowy.replace(/\D/g, "");
  const bezKierunkowego = cyfry.startsWith("48") && cyfry.length === 11 ? cyfry.slice(2) : cyfry;
  return bezKierunkowego.length === 9 ? bezKierunkowego : null;
}
