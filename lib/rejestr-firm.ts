import { todayPL } from "./datetime";

/**
 * Dane firmy z publicznych rejestrów po NIP albo numerze KRS.
 *
 * NIP sprawdzamy w Wykazie podatników VAT (Ministerstwo Finansów), KRS
 * w API Krajowego Rejestru Sądowego. Oba są darmowe i bez klucza. Biuro
 * zwolnione z VAT nie figuruje w wykazie, więc brak wyniku to nie błąd:
 * formularz prosi wtedy o wpisanie nazwy ręcznie.
 */

export type DaneFirmy = { nazwa: string; nip: string | null; ulica: string | null; kod: string | null; miasto: string | null };

const FORMY: [RegExp, string][] = [
  [/\bSp\. Z O\.o\.?/gi, "Sp. z o.o."],
  [/\bSpółka Z Ograniczoną Odpowiedzialnością\b/gi, "sp. z o.o."],
  [/\bSp\. K\.?/gi, "sp.k."],
  [/\bS\.a\.?/gi, "S.A."],
  [/\bSp\. J\.?/gi, "sp.j."],
];

/** Rejestry podają nazwy wielkimi literami. W panelu i na ofertówce to krzyczy. */
export function ladnaNazwa(nazwa: string): string {
  if (nazwa !== nazwa.toUpperCase()) return nazwa.trim();
  let n = nazwa
    .toLowerCase()
    .replace(/(^|[\s"„(-])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase());
  for (const [wzor, na] of FORMY) n = n.replace(wzor, na);
  return n.replace(/\s{2,}/g, " ").trim();
}

function ladnyTekst(t: string | null | undefined): string | null {
  return t ? ladnaNazwa(t) : null;
}

/** „ALEJA NIEPODLEGŁOŚCI 208, 00-925 WARSZAWA” → ulica, kod, miasto. */
export function rozbijAdres(adres: string | null | undefined): Pick<DaneFirmy, "ulica" | "kod" | "miasto"> {
  const m = adres?.match(/^(.*?),\s*(\d{2}-\d{3})\s+(.+)$/);
  if (!m) return { ulica: ladnyTekst(adres), kod: null, miasto: null };
  return { ulica: ladnyTekst(m[1]), kod: m[2], miasto: ladnyTekst(m[3]) };
}

export function poprawnyNip(nip: string): boolean {
  if (!/^\d{10}$/.test(nip)) return false;
  const wagi = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const suma = wagi.reduce((s, w, i) => s + w * Number(nip[i]), 0);
  return suma % 11 === Number(nip[9]);
}

async function zNip(nip: string): Promise<DaneFirmy | null> {
  const r = await fetch(`https://wl-api.mf.gov.pl/api/search/nip/${nip}?date=${todayPL()}`, { signal: AbortSignal.timeout(6000) });
  if (!r.ok) return null;
  const s = (await r.json())?.result?.subject as { name?: string; workingAddress?: string; residenceAddress?: string } | null;
  if (!s?.name) return null;
  return { nazwa: ladnaNazwa(s.name), nip, ...rozbijAdres(s.workingAddress ?? s.residenceAddress) };
}

async function zKrs(krs: string): Promise<DaneFirmy | null> {
  for (const rejestr of ["P", "S"]) {
    const r = await fetch(`https://api-krs.ms.gov.pl/api/krs/OdpisAktualny/${krs}?rejestr=${rejestr}&format=json`, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) continue;
    const d = (await r.json())?.odpis?.dane?.dzial1;
    const nazwa = d?.danePodmiotu?.nazwa as string | undefined;
    if (!nazwa) continue;
    const a = d?.siedzibaIAdres?.adres ?? {};
    const ulica = [a.ulica, [a.nrDomu, a.nrLokalu].filter(Boolean).join("/")].filter(Boolean).join(" ");
    return {
      nazwa: ladnaNazwa(nazwa),
      nip: (d?.danePodmiotu?.identyfikatory?.nip as string | undefined) ?? null,
      ulica: ladnyTekst(ulica || null),
      kod: (a.kodPocztowy as string | undefined) ?? null,
      miasto: ladnyTekst(a.miejscowosc),
    };
  }
  return null;
}

/** Numer KRS ma dziesięć cyfr i w praktyce zaczyna się od zer, NIP nigdy. */
export async function szukajFirmy(numer: string): Promise<DaneFirmy | null> {
  const czysty = numer.replace(/[\s-]/g, "");
  if (!/^\d{10}$/.test(czysty)) return null;
  try {
    return czysty.startsWith("00") ? await zKrs(czysty) : poprawnyNip(czysty) ? await zNip(czysty) : null;
  } catch {
    return null;
  }
}
