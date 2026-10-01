import { nowyDokument } from "./pdf-kit";
import { wMiejscowniku, zwany } from "./polszczyzna";
import { dataPL, wierszZleceniodawcy, zmianaAneksu, type AneksData } from "./aneks";

export type DanePrzedsiebiorcy = {
  nazwa: string;
  nip: string;
  adres: string;
};

/** Aneks do umowy pośrednictwa jako gotowy plik PDF. */
export async function generujAneksPdf(
  d: AneksData,
  firma: DanePrzedsiebiorcy,
  stopka?: string,
): Promise<Uint8Array> {
  const a = await nowyDokument({
    tytulPliku: `Aneks do umowy ${d.umowaNr || ""}`.trim(),
    stopka,
  });

  a.tytul(
    `Aneks do umowy pośrednictwa w ${d.przedmiot} nr ${d.umowaNr || "…………"} ` +
      `zawartej dnia ${dataPL(d.umowaData)} r.`,
  );

  a.tekst(
    `zawarty w dniu **${dataPL(d.aneksData)}** r. w ${wMiejscowniku(d.city)}, pomiędzy:`,
    { gapAfter: 8 },
  );

  a.ramka(
    [
      `**${firma.nazwa}**${firma.nip ? `, NIP: ${firma.nip}` : ""}${firma.adres ? `, z siedzibą w ${firma.adres}` : ""}, zwaną dalej **„Przedsiębiorcą”**,`,
    ],
    { gapAfter: 6 },
  );
  a.tekst("a", { gapAfter: 6 });
  a.ramka(
    [
      ...d.zleceniodawcy.map(wierszZleceniodawcy),
      `- ${zwany(d.zleceniodawcy.map((z2) => z2.name))} dalej **„${d.zleceniodawcy.filter((z2) => z2.name.trim()).length > 1 ? "Zleceniodawcami" : "Zleceniodawcą"}”**,`,
    ],
    { gapAfter: 14 },
  );

  a.tekst(
    `Strony zgodnie postanawiają wprowadzić następujące zmiany do Umowy pośrednictwa ` +
      `w ${d.przedmiot} nr **${d.umowaNr || "…………"}**:`,
    { gapAfter: 6 },
  );

  const z = zmianaAneksu(d);
  a.paragraf("§ 1");
  a.tekst(
    `Strony zgodnie zmieniają treść **${z.paragraf}** Umowy, który otrzymuje nowe brzmienie: „${z.tresc}”`,
    { gapAfter: 6 },
  );

  let nr = 2;
  for (const dod of d.dodatkowe.filter((x) => x.trim())) {
    a.paragraf(`§ ${nr}`);
    a.tekst(dod.trim(), { gapAfter: 6 });
    nr++;
  }

  a.paragraf(`§ ${nr}`);
  a.tekst("Pozostałe postanowienia Umowy pozostają bez zmian.", { gapAfter: 10 });

  a.tekst(
    "Niniejszy aneks stanowi integralną część Umowy i wchodzi w życie z dniem jego podpisania przez obie strony.",
    { gapAfter: 4 },
  );
  a.tekst("Aneks sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron.");

  a.podpisy(
    {
      rola: d.zleceniodawcy.length > 1 ? "Zleceniodawcy" : "Zleceniodawca",
      osoby: d.zleceniodawcy.map((z2) => z2.name.trim()),
    },
    { rola: "Przedsiębiorca", osoby: [firma.nazwa] },
  );

  return a.zapisz();
}
