import { nowyDokument, SZARY } from "./pdf-kit";
import {
  NOTA_PROFORMA,
  VAT_NOTE,
  amountToWordsPL,
  formatMoney,
  kwotyPozycji,
  opisRodzaju,
  opisStawki,
  podsumowanieVat,
  pozostaloDoZaplaty,
  sumyFaktury,
  zVatem,
  type InvoiceItem,
  type RodzajDokumentu,
  type Seller,
  type TrybCen,
} from "./invoice";

/**
 * Faktura jako plik PDF.
 *
 * Do tej pory faktura istniała wyłącznie jako arkusz HTML drukowany
 * z przeglądarki. Dawało to wydruk, ale nie dawało PLIKU, więc nie dało się
 * jej wysłać mailem ani niczego do niej załączyć. Druk z przeglądarki dokłada
 * też własne nagłówki i inaczej łamie strony na każdym systemie.
 *
 * Działa w przeglądarce, tak samo jak generatory umowy i protokołu.
 */

export type DaneFaktury = {
  number: string;
  docType: RodzajDokumentu;
  correctsNumber?: string | null;
  correctionReason?: string | null;
  place: string;
  issueDate: string;
  saleDate: string;
  paymentDate: string;
  paymentMethod: string;
  buyerName: string;
  buyerAddress: string;
  buyerCity: string;
  buyerPostcode: string;
  buyerNip: string;
  buyerPesel: string;
  items: InvoiceItem[];
  pricesMode: TrybCen;
  paid: number;
  issuer: string;
  description: string;
};

function adres(linie: (string | null | undefined)[]): string {
  return linie.map((l) => (l ?? "").trim()).filter(Boolean).join("\n");
}

export async function generujFakturePdf(
  d: DaneFaktury,
  sprzedawca: Seller,
  stopka?: string,
): Promise<Uint8Array> {
  const rodzaj = opisRodzaju(d.docType);
  const a = await nowyDokument({
    tytulPliku: `${rodzaj.tytul} ${d.number}`,
    stopka,
    // Tabela pozycji ma dziewięć kolumn, więc potrzebuje szerszej kolumny tekstu
    // niż domyślny margines dokumentów tekstowych.
    margines: 40,
  });

  const sumy = sumyFaktury(d.items, d.pricesMode);
  const wgStawek = podsumowanieVat(d.items, d.pricesMode);
  const zostalo = pozostaloDoZaplaty({ total_pln: sumy.brutto, paid_pln: d.paid });

  /* ── Nagłówek ── */
  a.tekst(`**${rodzaj.tytul} nr ${d.number}**`, { size: 16, align: "center", gapAfter: 4 });
  if (d.docType === "korekta" && d.correctsNumber) {
    a.tekst(`do faktury nr ${d.correctsNumber}`, { size: 10, align: "center", kolor: SZARY, gapAfter: 2 });
  }
  a.tekst(
    `${d.place}, ${d.issueDate}` + (d.saleDate ? `  ·  data sprzedaży: ${d.saleDate}` : ""),
    { size: 9.5, align: "center", kolor: SZARY, gapAfter: 14 },
  );

  /* ── Strony ── */
  const polowa = a.szerokosc / 2 - 8;
  const yPrzed = a.y;
  a.tekst("**SPRZEDAWCA**", { size: 9, x: 40, szer: polowa, kolor: SZARY, gapAfter: 3 });
  a.tekst(
    adres([
      sprzedawca.name,
      sprzedawca.address,
      [sprzedawca.postcode, sprzedawca.city].filter(Boolean).join(" "),
      sprzedawca.nip ? `NIP: ${sprzedawca.nip}` : "",
    ]),
    { size: 9.5, x: 40, szer: polowa },
  );
  const yPoLewej = a.y;

  a.y = yPrzed;
  a.tekst("**NABYWCA**", { size: 9, x: 40 + polowa + 16, szer: polowa, kolor: SZARY, gapAfter: 3 });
  a.tekst(
    adres([
      d.buyerName,
      d.buyerAddress,
      [d.buyerPostcode, d.buyerCity].filter(Boolean).join(" "),
      d.buyerNip ? `NIP: ${d.buyerNip}` : "",
      d.buyerPesel ? `PESEL: ${d.buyerPesel}` : "",
    ]),
    { size: 9.5, x: 40 + polowa + 16, szer: polowa },
  );

  a.y = Math.min(yPoLewej, a.y) - 16;

  /* ── Pozycje ── */
  const kol = [
    { naglowek: "Lp.", szer: 22 },
    { naglowek: "Nazwa", szer: 150 },
    { naglowek: "Ilość", szer: 32, align: "right" as const },
    { naglowek: "j.m.", szer: 30 },
    { naglowek: `Cena ${d.pricesMode}`, szer: 60, align: "right" as const },
    { naglowek: "Netto", szer: 62, align: "right" as const },
    { naglowek: "VAT", szer: 34, align: "right" as const },
    { naglowek: "Kwota VAT", szer: 60, align: "right" as const },
    { naglowek: "Brutto", szer: 65, align: "right" as const },
  ];

  a.tabela(
    kol,
    d.items.map((it, i) => {
      const k = kwotyPozycji(it, d.pricesMode);
      return [
        String(i + 1),
        it.name || "-",
        String(it.qty ?? 0),
        it.unit || "szt.",
        `${formatMoney(Number(it.unitPrice) || 0)}`,
        formatMoney(k.netto),
        opisStawki(it.vat ?? "zw").etykieta,
        formatMoney(k.vat),
        formatMoney(k.brutto),
      ];
    }),
    { gapAfter: 10 },
  );

  /* ── Zestawienie wg stawek ──
     Obowiązkowy element faktury VAT. Przy jednej stawce bez podatku
     byłoby tylko powtórzeniem tabeli wyżej, więc je pomijamy. */
  if (wgStawek.length > 1 || zVatem(d.items)) {
    a.tabela(
      [
        { naglowek: "Stawka", szer: 120 },
        { naglowek: "Wartość netto", szer: 132, align: "right" as const },
        { naglowek: "Kwota VAT", szer: 131, align: "right" as const },
        { naglowek: "Wartość brutto", szer: 132, align: "right" as const },
      ],
      [
        ...wgStawek.map((w) => [
          opisStawki(w.stawka).etykieta,
          formatMoney(w.netto),
          formatMoney(w.vat),
          formatMoney(w.brutto),
        ]),
        ["RAZEM", formatMoney(sumy.netto), formatMoney(sumy.vat), formatMoney(sumy.brutto)],
      ],
      { gapAfter: 10 },
    );
  }

  /* ── Podsumowanie ── */
  a.zarezerwuj(92);
  const prawa = a.szerokosc / 2;
  const xPrawa = 40 + prawa;
  a.tekst(`Razem netto: **${formatMoney(sumy.netto)} zł**`, { size: 10, x: xPrawa, szer: prawa, align: "right" });
  a.tekst(`Razem VAT: **${formatMoney(sumy.vat)} zł**`, { size: 10, x: xPrawa, szer: prawa, align: "right" });
  a.tekst(`**Do zapłaty: ${formatMoney(sumy.brutto)} zł**`, {
    size: 13,
    x: xPrawa,
    szer: prawa,
    align: "right",
    gapAfter: 2,
  });
  if ((d.paid ?? 0) > 0) {
    a.tekst(`Zapłacono: ${formatMoney(d.paid)} zł`, { size: 9.5, x: xPrawa, szer: prawa, align: "right", kolor: SZARY });
    a.tekst(`Pozostało: **${formatMoney(zostalo)} zł**`, { size: 10, x: xPrawa, szer: prawa, align: "right" });
  }
  a.odstep(6);
  a.tekst(`Słownie: ${amountToWordsPL(sumy.brutto)}`, { size: 9.5, kolor: SZARY, gapAfter: 12 });

  /* ── Płatność ── */
  const platnosc = [
    d.paymentMethod ? `Sposób zapłaty: ${d.paymentMethod}` : "",
    d.paymentDate ? `Termin płatności: ${d.paymentDate}` : "",
    sprzedawca.account ? `Nr konta: ${sprzedawca.account}` : "",
    sprzedawca.bank ? `Bank: ${sprzedawca.bank}` : "",
  ].filter(Boolean);
  if (platnosc.length > 0) a.ramka(platnosc, { gapAfter: 10 });

  /* ── Uwagi ── */
  const uwagi: string[] = [];
  if (d.docType === "proforma") uwagi.push(NOTA_PROFORMA);
  else if (!zVatem(d.items)) uwagi.push(VAT_NOTE);
  if (d.docType === "korekta" && d.correctionReason) uwagi.push(`Przyczyna korekty: ${d.correctionReason}`);
  if (d.description) uwagi.push(d.description);
  if (uwagi.length > 0) a.tekst(uwagi.join("\n"), { size: 9, kolor: SZARY, gapAfter: 16 });

  /* ── Podpisy ── */
  a.podpisy(
    { rola: "Osoba upoważniona do wystawienia", osoby: [d.issuer || sprzedawca.name] },
    { rola: "Osoba upoważniona do odbioru", osoby: [d.buyerName] },
    { ciasno: true },
  );

  return a.zapisz();
}
