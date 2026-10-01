import { nowyDokument } from "./pdf-kit";
import { wMiejscowniku, zwany } from "./polszczyzna";
import { dataPL, wierszZleceniodawcy, zmianaAneksu, type AneksData } from "./aneks";

export type DanePrzedsiebiorcy = {
  nazwa: string;
  nip: string;
  adres: string;
};

/** Jedna linia z pełnymi danymi firmy: nazwa, NIP i siedziba. */
export function liniaPrzedsiebiorcy(f: DanePrzedsiebiorcy): string {
  return [
    f.nazwa,
    f.nip ? `NIP: ${f.nip}` : "",
    f.adres ? `z siedzibą w ${f.adres}` : "",
  ]
    .filter(Boolean)
    .join(", ");
}

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

  // Pełne dane firmy bierzemy z pola formularza, bo Ustawienia nie zawsze mają
  // komplet (spółka cywilna ma w nazwie wspólników), a na aneksie musi stać
  // dokładnie to, co w umowie.
  const przedsiebiorca = d.przedsiebiorca.trim() || liniaPrzedsiebiorcy(firma);
  const repr = d.reprezentant.trim();
  a.ramka(
    [`**${przedsiebiorca}**${repr ? `, reprezentowaną przez: **${repr}**` : ""}, zwaną dalej **„Przedsiębiorcą”**,`],
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

  // Układ jak w umowie: paragraf jako wyśrodkowany nagłówek, a pod nim
  // ponumerowane ustępy. § 1 to zmiany, § 2 to postanowienia końcowe.
  const zmiany = [
    (() => {
      const z = zmianaAneksu(d);
      return `Strony zgodnie zmieniają treść **${z.paragraf}** Umowy, który otrzymuje nowe brzmienie: „${z.tresc}”`;
    })(),
    ...d.dodatkowe.map((x) => x.trim()).filter(Boolean),
  ];
  const koncowe = [
    "Pozostałe postanowienia Umowy pozostają bez zmian.",
    "Niniejszy aneks stanowi integralną część Umowy i wchodzi w życie z dniem jego podpisania przez obie strony.",
    "Aneks sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron.",
  ];

  function ustepy(naglowek: string, pozycje: string[]) {
    a.paragraf(naglowek);
    pozycje.forEach((t, i) => a.tekst(`**${i + 1}.** ${t}`, { gapAfter: 7 }));
  }

  ustepy("§ 1", zmiany);
  ustepy("§ 2", koncowe);
  a.odstep(6);

  a.podpisy(
    {
      rola: d.zleceniodawcy.length > 1 ? "Zleceniodawcy" : "Zleceniodawca",
      osoby: d.zleceniodawcy.map((z2) => z2.name.trim()),
    },
    { rola: "Przedsiębiorca", osoby: [repr || firma.nazwa] },
  );

  return a.zapisz();
}
