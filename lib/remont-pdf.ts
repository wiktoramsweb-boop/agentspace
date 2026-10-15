import { nowyDokument } from "./pdf-kit";
import { policz, STANDARDY, ZAKRESY, type Kosztorys } from "./remont";

const zl = (n: number) =>
  new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(Math.round(n)) + " zł";
const ile = (n: number) => new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 }).format(n);

/** Kosztorys dla klienta: najpierw wynik, potem szczegóły per pomieszczenie. */
export async function generujKosztorysPdf(
  k: Kosztorys,
  biuro: { nazwa: string; agent: string; telefon?: string; email?: string },
  stopka?: string,
): Promise<Uint8Array> {
  const w = policz(k);
  const a = await nowyDokument({ tytulPliku: k.tytul || "Kosztorys remontu", stopka });
  const W = a.szerokosc;

  a.tytul(k.tytul || "Kosztorys remontu");
  if (k.adres.trim()) a.tekst(`**${k.adres.trim()}**`, { align: "center", gapAfter: 4 });
  const std = STANDARDY.find((s) => s.v === k.standard)?.l ?? "";
  const zakres = ZAKRESY.find((z) => z.v === k.zakres)?.l ?? "";
  a.tekst(`Zakres: ${zakres.toLowerCase()} · standard: ${std.toLowerCase()} · ${ile(w.metrazRazem)} m²`, {
    align: "center", size: 9.5, gapAfter: 16,
  });

  a.kafelki(
    [
      { label: "Szacowany koszt", value: zl(w.brutto), sub: `brutto, z rezerwą ${k.rezerwaProc}%` },
      { label: "Na metr", value: zl(w.naMetr), sub: "brutto za m²" },
      { label: "Czas prac", value: `${w.tygodnie} tyg.`, sub: `ok. ${w.dniRobocze} dni roboczych` },
    ],
    { gapAfter: 14 },
  );

  a.tabela(
    [
      { naglowek: "Składnik", szer: W * 0.6 },
      { naglowek: "Kwota", szer: W * 0.4, align: "right" },
    ],
    [
      ["Robocizna netto", zl(w.robociznaNetto)],
      ["Materiały netto", zl(w.materialyNetto)],
      [`VAT od robocizny (${Math.round(w.stawkaRobocizna * 100)}%)`, zl(w.vatRobocizna)],
      [`VAT od materiałów (${Math.round(w.stawkaMaterialy * 100)}%)`, zl(w.vatMaterialy)],
      [`Rezerwa na nieprzewidziane prace (${k.rezerwaProc}%)`, zl(w.rezerwa)],
      ["**Razem brutto**", `**${zl(w.brutto)}**`],
    ],
    { gapAfter: 18 },
  );

  for (const pom of k.pomieszczenia) {
    const wiersze = w.wiersze.filter((x) => x.pomId === pom.id);
    if (!wiersze.length) continue;
    const suma = w.pomieszczenia.find((p) => p.id === pom.id)?.netto ?? 0;
    a.zarezerwuj(110);
    a.tabela(
      [
        { naglowek: "Pozycja", szer: W * 0.46 },
        { naglowek: "Ilość", szer: W * 0.14, align: "right" },
        { naglowek: "Robocizna", szer: W * 0.2, align: "right" },
        { naglowek: "Materiał", szer: W * 0.2, align: "right" },
      ],
      [
        ...wiersze.map((x) => [x.nazwa, `${ile(x.ilosc)} ${x.jedn}`, zl(x.robocizna), zl(x.material)]),
        ["**Razem netto**", "", "", `**${zl(suma)}**`],
      ],
      { tytul: `${pom.nazwa} · ${ile(pom.metraz)} m²`, gapAfter: 12 },
    );
  }

  a.odstep(4);
  // Uwaga i autor razem: autor sam na nowej stronie wygląda jak pomyłka.
  a.zarezerwuj(90);
  a.tekst(
    "Kosztorys jest szacunkiem na podstawie metrażu i średnich cen robocizny i materiałów w dużym mieście w 2026 r. " +
      "Ostateczny koszt zależy od stanu instalacji, wybranych materiałów i wyceny konkretnej ekipy. " +
      (w.stawkaRobocizna === 0.08
        ? "VAT 8% dotyczy remontu lokalu mieszkalnego do 150 m²; materiały kupione samodzielnie w sklepie mają 23%."
        : "Powyżej 150 m² powierzchni użytkowej obowiązuje VAT 23%."),
    { size: 8.5, gapAfter: 10 },
  );
  a.tekst(
    `Przygotowanie: **${biuro.agent}**, ${biuro.nazwa}${biuro.telefon ? `, tel. ${biuro.telefon}` : ""}${biuro.email ? `, ${biuro.email}` : ""}`,
    { size: 9 },
  );

  return a.zapisz();
}
