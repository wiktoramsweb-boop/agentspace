import { createHash } from "node:crypto";
import dane from "./scenariusze-druga-plec.json";
import { plecRozmowcy } from "../karta-rozmowy";
import { imiePostaci, instrukcjaPlci, zmienPlecTekstu, type Plec } from "../plec-postaci";

type Wersja = { plec: Plec; zrodlo: string; brief: string; system_prompt: string };
const WERSJE = dane as Record<string, Wersja>;

export type ScenariuszDoRozmowy = { brief: string; system_prompt: string; instrukcja: string };

/**
 * Scenariusz w płci wybranej przez agenta.
 *
 * Gotowe wersje drugiej płci (lib/coach/scenariusze-druga-plec.json) są
 * przepisane w całości: imię, zaimki, przymiotniki, współmałżonek. Używamy ich
 * tylko wtedy, gdy scenariusz w bazie się nie zmienił (zgadza się skrót
 * tekstu). Gdy ktoś poprawi scenariusz, wracamy do prostej zamiany imion
 * i instrukcji dla AI, żeby nigdy nie podać nieaktualnego opisu.
 */
export function scenariuszWPlci(
  s: { slug?: string | null; brief: string; system_prompt: string },
  plec: Plec | null | undefined,
): ScenariuszDoRozmowy {
  const oryginalna = plecRozmowcy(s.brief);
  if (!plec || plec === oryginalna) return { brief: s.brief, system_prompt: s.system_prompt, instrukcja: "" };

  const gotowa = s.slug ? WERSJE[s.slug] : undefined;
  const skrot = createHash("sha1").update(`${s.brief}\n${s.system_prompt}`).digest("hex").slice(0, 12);
  const brief = gotowa && gotowa.plec === plec && gotowa.zrodlo === skrot ? gotowa.brief : zmienPlecTekstu(s.brief, plec);
  const system_prompt =
    gotowa && gotowa.plec === plec && gotowa.zrodlo === skrot ? gotowa.system_prompt : zmienPlecTekstu(s.system_prompt, plec);
  return { brief, system_prompt, instrukcja: instrukcjaPlci(plec, imiePostaci(brief)) };
}

export function plecZWyboru(v: unknown): Plec | null {
  return v === "k" || v === "m" ? v : null;
}
