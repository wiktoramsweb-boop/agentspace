import { nowyDokument, SZARY } from "./pdf-kit";
import {
  NOTA_PROFORMA,
  VAT_NOTE,
  amountToWordsPL,
  formatMoney,
  kwotyPozycji,
  opisRodzaju,
  tytulDokumentu,
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

function adres(linie: (string | null | undefined)[]): string[] {
  return linie.map((l) => (l ?? "").trim()).filter(Boolean);
}

export async function generujFakturePdf(
  d: DaneFaktury,
  sprzedawca: Seller,
  opcje: { stopka?: string; logoUrl?: string | null; nazwaBiura?: string } = {},
): Promise<Uint8Array> {
  const { stopka, logoUrl, nazwaBiura } = opcje;
  const rodzaj = opisRodzaju(d.docType);
  const a = await nowyDokument({
    tytulPliku: `${tytulDokumentu(d.docType, d.items)} ${d.number}`,
    stopka,
    // Tabela pozycji ma dziewięć kolumn, więc potrzebuje szerszej kolumny tekstu
    // niż domyślny margines dokumentów tekstowych.
    margines: 40,
  });

  const sumy = sumyFaktury(d.items, d.pricesMode);
  const wgStawek = podsumowanieVat(d.items, d.pricesMode);
  const zostalo = pozostaloDoZaplaty({ total_pln: sumy.brutto, paid_pln: d.paid });

  /* ── Nagłówek: logo i nazwa po lewej, tytuł po prawej ── */
  const yNaglowka = a.y;
  let przesuniecieNazwy = 40;
  if (logoUrl) {
    const { szer } = await a.obrazek(logoUrl, { x: 40, y: yNaglowka, maxSzer: 44, maxWys: 44 });
    if (szer > 0) przesuniecieNazwy = 40 + szer + 10;
  }
  if (nazwaBiura) {
    a.y = yNaglowka - 16;
    a.tekst(`**${nazwaBiura}**`, { size: 11, x: przesuniecieNazwy, szer: 220 });
  }

  a.y = yNaglowka;
  const prawaKolumna = a.szerokosc / 2;
  const xPrawej = 40 + prawaKolumna;
  a.tekst(tytulDokumentu(d.docType, d.items).toUpperCase(), {
    size: 19,
    x: xPrawej,
    szer: prawaKolumna,
    align: "right",
    gapAfter: 1,
  });
  a.tekst(`Nr ${d.number}`, { size: 10, x: xPrawej, szer: prawaKolumna, align: "right", kolor: SZARY });
  if (d.docType === "korekta" && d.correctsNumber) {
    a.tekst(`do faktury nr ${d.correctsNumber}`, {
      size: 9,
      x: xPrawej,
      szer: prawaKolumna,
      align: "right",
      kolor: SZARY,
    });
  }
  a.tekst(`${d.place ? `${d.place}, ` : ""}${d.issueDate}`, {
    size: 9,
    x: xPrawej,
    szer: prawaKolumna,
    align: "right",
    kolor: SZARY,
  });

  // Nagłówek zajmuje tyle, ile wyższa z dwóch kolumn.
  a.y = Math.min(a.y, yNaglowka - 52);
  a.linia({ gapBefore: 8, gapAfter: 16 });

  /* ── Strony ── */
  const polowa = a.szerokosc / 2 - 8;
  const yPrzed = a.y;
  a.tekst("**SPRZEDAWCA**", { size: 9, x: 40, szer: polowa, kolor: SZARY, gapAfter: 3 });
  // Każda linia osobno: `tekst` zawija akapit i znak końca linii nic mu nie
  // mówi, więc adres zlewał się w jeden ciąg.
  for (const l of adres([
    `**${sprzedawca.name}**`,
    sprzedawca.address,
    [sprzedawca.postcode, sprzedawca.city].filter(Boolean).join(" "),
    sprzedawca.nip ? `NIP: ${sprzedawca.nip}` : "",
  ])) {
    a.tekst(l, { size: 9.5, x: 40, szer: polowa, interlinia: 1.3 });
  }
  const yPoLewej = a.y;

  a.y = yPrzed;
  a.tekst("**NABYWCA**", { size: 9, x: 40 + polowa + 16, szer: polowa, kolor: SZARY, gapAfter: 3 });
  for (const l of adres([
    `**${d.buyerName || "-"}**`,
    d.buyerAddress,
    [d.buyerPostcode, d.buyerCity].filter(Boolean).join(" "),
    d.buyerNip ? `NIP: ${d.buyerNip}` : "",
    d.buyerPesel ? `PESEL: ${d.buyerPesel}` : "",
  ])) {
    a.tekst(l, { size: 9.5, x: 40 + polowa + 16, szer: polowa, interlinia: 1.3 });
  }

  a.y = Math.min(yPoLewej, a.y) - 16;

  /* ── Pozycje ── */
  const kol = [
    // Suma musi dać 515 pkt (szerokość kolumny tekstu przy marginesie 40).
    // Kolumny kwotowe są szerokie, bo "33 400,00 zł" łamało się na dwie linie.
    { naglowek: "Lp.", szer: 20 },
    { naglowek: "Nazwa", szer: 126 },
    { naglowek: "Ilość", szer: 28, align: "right" as const },
    { naglowek: "j.m.", szer: 26 },
    { naglowek: `Cena ${d.pricesMode}`, szer: 68, align: "right" as const },
    { naglowek: "Netto", szer: 68, align: "right" as const },
    { naglowek: "VAT", szer: 30, align: "right" as const },
    { naglowek: "Kwota VAT", szer: 70, align: "right" as const },
    { naglowek: "Brutto", szer: 79, align: "right" as const },
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
        `${formatMoney(Number(it.unitPrice) || 0)} zł`,
        `${formatMoney(k.netto)} zł`,
        opisStawki(it.vat ?? "zw").etykieta,
        `${formatMoney(k.vat)} zł`,
        `${formatMoney(k.brutto)} zł`,
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
          `${formatMoney(w.netto)} zł`,
          `${formatMoney(w.vat)} zł`,
          `${formatMoney(w.brutto)} zł`,
        ]),
        ["**RAZEM**", `**${formatMoney(sumy.netto)} zł**`, `**${formatMoney(sumy.vat)} zł**`, `**${formatMoney(sumy.brutto)} zł**`],
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
  if (platnosc.length > 0) a.ramka(platnosc, { gapAfter: 10, ciasno: true });

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
    // Bez `ciasno`: na fakturze podpisuje się ręcznie, więc nad kreską musi
    // zostać miejsce na podpis, a nie sama linia.
  );

  return a.zapisz();
}
