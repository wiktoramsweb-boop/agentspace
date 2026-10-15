import { nowyDokument } from "./pdf-kit";
import { klauzulaInformacyjna, RODZAJE_ZGOD, type DaneAdministratora } from "./rodo-model";

/**
 * Klauzula informacyjna z formularzem zgód do podpisu przez klienta.
 * Jedna kartka: klient czyta, zaznacza zgody i podpisuje, agent wpisuje
 * zgody do karty z wybranym źródłem „Podpisany formularz".
 */
export async function generujKlauzulePdf(
  a: DaneAdministratora,
  klient: { imie: string } | null,
  stopka?: string,
): Promise<Uint8Array> {
  const k = klauzulaInformacyjna(a);
  const d = await nowyDokument({ tytulPliku: `Klauzula RODO${klient?.imie ? ` - ${klient.imie}` : ""}`, stopka, margines: 48 });

  d.tytul(k.tytul, { ciasno: true });
  for (const akapit of k.akapity) d.tekst(akapit, { size: 9, gapAfter: 5 });

  d.linia({ gapBefore: 6, gapAfter: 8 });
  d.tekst("**Zgody dobrowolne** (zaznacz, jeśli wyrażasz zgodę; każdą możesz w dowolnym momencie wycofać):", { size: 9.5, gapAfter: 6 });
  for (const r of RODZAJE_ZGOD.filter((x) => x.value !== "obowiazek_informacyjny" && x.value !== "przetwarzanie")) {
    d.tekst(`[   ]  ${r.nazwa}. ${r.opis}`, { size: 9, gapAfter: 4 });
  }
  d.tekst(
    `Potwierdzam, że zapoznałam/zapoznałem się z powyższą informacją${klient?.imie ? `: **${klient.imie}**` : "."}`,
    { size: 9.5, gapAfter: 2 },
  );
  d.podpisy({ rola: "Data", osoby: [] }, { rola: "Podpis klienta", osoby: klient?.imie ? [klient.imie] : [] }, { ciasno: true });
  return d.zapisz();
}
