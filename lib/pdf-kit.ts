import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

/**
 * Wspólny warsztat do dokumentów PDF (protokół, aneks, kolejne).
 *
 * Dlaczego własny generator, a nie druk z przeglądarki: druk dokłada nagłówki
 * i stopki przeglądarki, inaczej łamie strony na każdym systemie i nie daje
 * pliku, tylko okno drukowania. Agent potrzebuje **pliku**, który odeśle
 * mailem, a dopiero potem go wydrukuje. Dlatego najpierw powstaje PDF, a druk
 * otwiera gotowy plik.
 *
 * Wyciągnięte z generatora umowy rezerwacyjnej, bo te same trzy rzeczy
 * (zawijanie z pogrubieniami, tabele, podpisy) były potrzebne po raz drugi.
 */

export const A4 = { w: 595.28, h: 841.89 };
const MARGIN_DOMYSLNY = 56;
export const MARGIN = MARGIN_DOMYSLNY;
export const CONTENT_W = A4.w - 2 * MARGIN_DOMYSLNY;
export const INK = rgb(0.094, 0.094, 0.106);
export const SZARY = rgb(0.45, 0.45, 0.5);
export const LINIA = rgb(0.82, 0.83, 0.85);
export const TLO_NAGLOWKA = rgb(0.953, 0.957, 0.965);
export const AKCENT = rgb(0.02, 0.59, 0.41);

type Run = { text: string; bold: boolean };
type Token = { text: string; font: PDFFont; w: number; space: boolean };

/** `**tekst**` robi pogrubienie, tak jak w generatorze umowy rezerwacyjnej. */
function parseRuns(s: string): Run[] {
  return s
    .split("**")
    .map((t, i) => ({ text: t, bold: i % 2 === 1 }))
    .filter((r) => r.text.length > 0);
}

async function loadBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Nie udało się pobrać ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

export type Arkusz = Awaited<ReturnType<typeof nowyDokument>>;

export async function nowyDokument(opts: {
  tytulPliku: string;
  stopka?: string;
  /** Margines strony. Mniejszy dla dokumentów, które mają zmieścić się na jednej kartce. */
  margines?: number;
}) {
  const MARGIN = opts.margines ?? MARGIN_DOMYSLNY;
  const CONTENT_W = A4.w - 2 * MARGIN;
  const [regB, boldB] = await Promise.all([
    loadBytes("/oferta/fonts/Arimo-Regular.ttf"),
    loadBytes("/oferta/fonts/Arimo-Bold.ttf"),
  ]);
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const reg = await pdf.embedFont(regB, { subset: false });
  const bold = await pdf.embedFont(boldB, { subset: false });
  pdf.setTitle(opts.tytulPliku);

  const strony: PDFPage[] = [];
  let page: PDFPage = pdf.addPage([A4.w, A4.h]);
  strony.push(page);
  let y = A4.h - MARGIN;

  function nowaStrona() {
    page = pdf.addPage([A4.w, A4.h]);
    strony.push(page);
    y = A4.h - MARGIN;
  }
  function zmiesc(ile: number) {
    if (y - ile < MARGIN + 24) nowaStrona();
  }

  function lamanie(runs: Run[], size: number, szer: number): Token[][] {
    const toks: Token[] = [];
    for (const r of runs) {
      const f = r.bold ? bold : reg;
      for (const part of r.text.split(/(\s+)/)) {
        if (!part) continue;
        toks.push({ text: part, font: f, w: f.widthOfTextAtSize(part, size), space: /^\s+$/.test(part) });
      }
    }
    const linie: Token[][] = [];
    let linia: Token[] = [];
    let w = 0;
    for (const t of toks) {
      if (!t.space && w + t.w > szer && linia.length) {
        linie.push(linia);
        linia = [];
        w = 0;
      }
      if (t.space && linia.length === 0) continue;
      linia.push(t);
      w += t.w;
    }
    if (linia.length) linie.push(linia);
    return linie;
  }

  type OpcjeTekstu = {
    size?: number;
    align?: "left" | "center" | "right";
    gapAfter?: number;
    x?: number;
    szer?: number;
    kolor?: RGB;
    interlinia?: number;
  };

  function tekst(s: string, o: OpcjeTekstu = {}) {
    const size = o.size ?? 10;
    const lh = size * (o.interlinia ?? 1.45);
    const x0 = o.x ?? MARGIN;
    const szer = o.szer ?? CONTENT_W;
    for (const linia of lamanie(parseRuns(s), size, szer)) {
      zmiesc(lh);
      const w = linia.reduce((a, t) => a + t.w, 0);
      let x = x0;
      if (o.align === "center") x = x0 + (szer - w) / 2;
      if (o.align === "right") x = x0 + szer - w;
      const base = y - size;
      for (const t of linia) {
        if (!(t.space && x === x0)) {
          page.drawText(t.text, { x, y: base, size, font: t.font, color: o.kolor ?? INK });
        }
        x += t.w;
      }
      y -= lh;
    }
    if (o.gapAfter) y -= o.gapAfter;
  }

  /** Ile miejsca w pionie zajmie tekst, bez rysowania - do liczenia wysokości komórek. */
  function wysokoscTekstu(s: string, size: number, szer: number, interlinia = 1.45): number {
    return lamanie(parseRuns(s), size, szer).length * size * interlinia;
  }

  /** Tytuł dokumentu z cienką linią akcentu pod spodem. */
  function tytul(s: string, o: { ciasno?: boolean } = {}) {
    tekst(s.toUpperCase(), { size: 15, align: "center", gapAfter: o.ciasno ? 4 : 6 });
    const w = 64;
    page.drawRectangle({ x: MARGIN + (CONTENT_W - w) / 2, y, width: w, height: 2, color: AKCENT });
    y -= o.ciasno ? 12 : 20;
  }

  /** Nagłówek paragrafu, wyśrodkowany, nie zostaje sam na dole strony. */
  function paragraf(s: string, o: { ciasno?: boolean } = {}) {
    zmiesc(o.ciasno ? 48 : 64);
    y -= o.ciasno ? 2 : 6;
    tekst(`**${s}**`, { size: o.ciasno ? 11 : 11.5, align: "center", gapAfter: o.ciasno ? 5 : 8 });
  }

  /** Ramka z danymi strony umowy. Treść w środku, lekkie tło. */
  function ramka(linie: string[], o: { gapAfter?: number; ciasno?: boolean } = {}) {
    const pad = o.ciasno ? 7 : 10;
    const size = 10;
    const h = linie.reduce((a, l) => a + wysokoscTekstu(l, size, CONTENT_W - 2 * pad), 0) + 2 * pad;
    zmiesc(h + 6);
    page.drawRectangle({
      x: MARGIN, y: y - h, width: CONTENT_W, height: h,
      borderColor: LINIA, borderWidth: 0.8, color: rgb(0.988, 0.992, 0.996),
    });
    y -= pad;
    for (const l of linie) tekst(l, { size, x: MARGIN + pad, szer: CONTENT_W - 2 * pad });
    y -= pad;
    if (o.gapAfter) y -= o.gapAfter;
  }

  /**
   * Tabela z nagłówkiem. Wiersze mierzymy przed rysowaniem, żeby komórka
   * z długim tekstem nie wyszła poza ramkę, a strona łamała się między
   * wierszami, nie w ich środku.
   */
  function tabela(
    kolumny: { naglowek: string; szer: number; align?: "left" | "center" | "right" }[],
    wiersze: string[][],
    o: { tytul?: string; gapAfter?: number; minWysokosc?: number } = {},
  ) {
    const size = 9.5;
    const pad = 7;
    const minH = o.minWysokosc ?? 22;

    function naglowek() {
      if (o.tytul) {
        const h = 22;
        zmiesc(h);
        page.drawRectangle({ x: MARGIN, y: y - h, width: CONTENT_W, height: h, color: TLO_NAGLOWKA, borderColor: LINIA, borderWidth: 0.8 });
        const tw = bold.widthOfTextAtSize(o.tytul, 10);
        page.drawText(o.tytul, { x: MARGIN + (CONTENT_W - tw) / 2, y: y - h + 7, size: 10, font: bold, color: INK });
        y -= h;
      }
      const h = 22;
      zmiesc(h);
      page.drawRectangle({ x: MARGIN, y: y - h, width: CONTENT_W, height: h, color: TLO_NAGLOWKA, borderColor: LINIA, borderWidth: 0.8 });
      let x = MARGIN;
      for (const k of kolumny) {
        const tw = bold.widthOfTextAtSize(k.naglowek, size);
        const tx = k.align === "right" ? x + k.szer - pad - tw : k.align === "center" ? x + (k.szer - tw) / 2 : x + pad;
        page.drawText(k.naglowek, { x: tx, y: y - h + 7, size, font: bold, color: INK });
        x += k.szer;
        if (x < MARGIN + CONTENT_W - 1) {
          page.drawLine({ start: { x, y: y - h }, end: { x, y }, color: LINIA, thickness: 0.8 });
        }
      }
      y -= h;
    }

    const wysokosci = wiersze.map((w) =>
      Math.max(minH, ...kolumny.map((k, i) => wysokoscTekstu(w[i] ?? "", size, k.szer - 2 * pad, 1.3) + 2 * pad - 6)),
    );

    naglowek();
    for (const [nr, w] of wiersze.entries()) {
      const h = wysokosci[nr];
      // Nie zostawiamy na nowej stronie samego nagłówka z jednym wierszem:
      // wygląda to jak pomyłka w składzie. Gdy po złamaniu zostałby tylko
      // ostatni wiersz, łamiemy stronę o jeden wiersz wcześniej.
      const zostanieSam =
        nr === wiersze.length - 2 &&
        y - h >= MARGIN + 24 &&
        y - h - wysokosci[nr + 1] < MARGIN + 24;
      if (y - h < MARGIN + 24 || zostanieSam) {
        nowaStrona();
        naglowek();
      }
      page.drawRectangle({ x: MARGIN, y: y - h, width: CONTENT_W, height: h, borderColor: LINIA, borderWidth: 0.8 });
      let x = MARGIN;
      for (const [i, k] of kolumny.entries()) {
        const tresc = w[i] ?? "";
        if (tresc) {
          const zapisane = y;
          y = y - (h - wysokoscTekstu(tresc, size, k.szer - 2 * pad, 1.3)) / 2;
          tekst(tresc, {
            size, x: x + pad, szer: k.szer - 2 * pad, align: k.align, interlinia: 1.3,
          });
          y = zapisane;
        }
        x += k.szer;
        if (x < MARGIN + CONTENT_W - 1) {
          page.drawLine({ start: { x, y: y - h }, end: { x, y }, color: LINIA, thickness: 0.8 });
        }
      }
      y -= h;
    }
    if (o.gapAfter) y -= o.gapAfter;
  }

  /** Puste linie do dopisania czegoś ręcznie na wydruku. */
  function liniePuste(ile: number, o: { x?: number; szer?: number } = {}) {
    const x0 = o.x ?? MARGIN;
    const szer = o.szer ?? CONTENT_W;
    for (let i = 0; i < ile; i++) {
      zmiesc(22);
      page.drawLine({
        start: { x: x0, y: y - 12 }, end: { x: x0 + szer, y: y - 12 },
        color: LINIA, thickness: 0.7, dashArray: [1.5, 2.5],
      });
      y -= 22;
    }
  }

  /** Poziomy pasek z etykietą i wartością. Używany w lejku raportu. */
  function pasek(etykieta: string, wartosc: string, udzial: number, kolor = AKCENT) {
    const h = 26;
    zmiesc(h);
    const etykW = CONTENT_W * 0.34;
    const barW = CONTENT_W * 0.48;
    tekst(etykieta, { size: 9.5, x: MARGIN, szer: etykW });
    y += 9.5 * 1.45;
    page.drawRectangle({ x: MARGIN + etykW, y: y - 13, width: barW, height: 8, color: rgb(0.94, 0.95, 0.96) });
    const w = Math.max(2, barW * Math.min(1, Math.max(0, udzial)));
    page.drawRectangle({ x: MARGIN + etykW, y: y - 13, width: w, height: 8, color: kolor });
    const vw = bold.widthOfTextAtSize(wartosc, 9.5);
    page.drawText(wartosc, { x: MARGIN + CONTENT_W - vw, y: y - 13, size: 9.5, font: bold, color: INK });
    y -= h;
  }

  /** Pionowe słupki, np. przychód miesiąc po miesiącu. */
  function slupki(dane: { etykieta: string; wartosc: number; opis?: string }[], o: { wysokosc?: number; gapAfter?: number } = {}) {
    const hMax = o.wysokosc ?? 110;
    zmiesc(hMax + 34);
    const max = Math.max(...dane.map((d) => d.wartosc), 1);
    const przerwa = 4;
    const szer = (CONTENT_W - przerwa * (dane.length - 1)) / dane.length;
    const baza = y - hMax;
    dane.forEach((d, i) => {
      const x = MARGIN + i * (szer + przerwa);
      const h = d.wartosc > 0 ? Math.max(2, (d.wartosc / max) * hMax) : 1;
      page.drawRectangle({ x, y: baza, width: szer, height: h, color: d.wartosc > 0 ? AKCENT : rgb(0.9, 0.91, 0.92) });
      if (d.opis) {
        const w = reg.widthOfTextAtSize(d.opis, 7);
        page.drawText(d.opis, { x: x + (szer - w) / 2, y: baza + h + 3, size: 7, font: reg, color: SZARY });
      }
      const w = reg.widthOfTextAtSize(d.etykieta, 7);
      page.drawText(d.etykieta, { x: x + (szer - w) / 2, y: baza - 11, size: 7, font: reg, color: SZARY });
    });
    y = baza - 16 - (o.gapAfter ?? 0);
  }

  /** Rząd kafelków z liczbą i podpisem. */
  function kafelki(pozycje: { label: string; value: string; sub?: string }[], o: { gapAfter?: number } = {}) {
    const h = 54;
    zmiesc(h + 8);
    const przerwa = 8;
    const szer = (CONTENT_W - przerwa * (pozycje.length - 1)) / pozycje.length;
    pozycje.forEach((p, i) => {
      const x = MARGIN + i * (szer + przerwa);
      page.drawRectangle({ x, y: y - h, width: szer, height: h, borderColor: LINIA, borderWidth: 0.8, color: rgb(0.988, 0.992, 0.996) });
      page.drawText(p.label.toUpperCase(), { x: x + 9, y: y - 17, size: 6.8, font: reg, color: SZARY });
      page.drawText(p.value, { x: x + 9, y: y - 34, size: 13, font: bold, color: INK });
      if (p.sub) page.drawText(p.sub, { x: x + 9, y: y - 46, size: 7, font: reg, color: SZARY });
    });
    y -= h + (o.gapAfter ?? 0);
  }

  /** Dwie kolumny podpisów na dole. */
  function podpisy(
    lewa: { rola: string; osoby: string[] },
    prawa: { rola: string; osoby: string[] },
    o: { ciasno?: boolean } = {},
  ) {
    zmiesc(o.ciasno ? 60 : 96);
    y -= o.ciasno ? 8 : 30;
    const colW = (CONTENT_W - 44) / 2;
    const lineY = y - (o.ciasno ? 20 : 26);
    for (const [i, c] of [lewa, prawa].entries()) {
      const x = MARGIN + i * (colW + 44);
      page.drawLine({
        start: { x, y: lineY }, end: { x: x + colW, y: lineY },
        color: LINIA, thickness: 0.7, dashArray: [1.5, 2.5],
      });
      const lw = bold.widthOfTextAtSize(c.rola, 10);
      page.drawText(c.rola, { x: x + (colW - lw) / 2, y: lineY - (o.ciasno ? 12 : 14), size: 10, font: bold, color: INK });
      const osoby = c.osoby.filter(Boolean);
      const linia = osoby.length ? osoby.join(", ") : "(imię i nazwisko)";
      const nw = reg.widthOfTextAtSize(linia, 9);
      page.drawText(linia, {
        x: x + (colW - nw) / 2, y: lineY - (o.ciasno ? 24 : 27), size: 9, font: reg,
        color: osoby.length ? SZARY : rgb(0.72, 0.72, 0.75),
      });
    }
    y = lineY - (o.ciasno ? 34 : 40);
  }

  /** Numeracja stron i stopka. Dopisywana na końcu, gdy znamy liczbę stron. */
  async function zapisz(): Promise<Uint8Array> {
    strony.forEach((p, i) => {
      const t = `Strona ${i + 1} z ${strony.length}`;
      const w = reg.widthOfTextAtSize(t, 8.5);
      p.drawText(t, { x: (A4.w - w) / 2, y: MARGIN / 2 + 6, size: 8.5, font: reg, color: SZARY });
      if (opts.stopka) {
        const sw = reg.widthOfTextAtSize(opts.stopka, 8);
        p.drawText(opts.stopka, { x: (A4.w - sw) / 2, y: MARGIN / 2 - 5, size: 8, font: reg, color: rgb(0.68, 0.68, 0.72) });
      }
    });
    return pdf.save();
  }

  return {
    szerokosc: CONTENT_W,
    /** Ile miejsca zostało do dołu strony, z zapasem na stopkę. */
    wolneMiejsce: () => y - MARGIN - 24,
    get y() { return y; },
    set y(v: number) { y = v; },
    tekst, tytul, paragraf, ramka, tabela, liniePuste, podpisy, pasek, slupki, kafelki, zapisz,
    /** Łamie stronę, jeśli nie zostało tyle miejsca. Chroni nagłówek sekcji
     *  przed zostaniem samemu na dole strony. */
    zarezerwuj: (ile: number) => zmiesc(ile),
    odstep: (n: number) => { y -= n; },
  };
}

/** Zapisuje plik na dysk. Najpierw plik, dopiero potem ewentualny druk. */
export function pobierzPdf(bytes: Uint8Array, nazwa: string) {
  const blob = new Blob([bytes.slice() as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nazwa.endsWith(".pdf") ? nazwa : `${nazwa}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Druk gotowego PDF-a: otwieramy plik w nowej karcie i stamtąd idzie na
 * drukarkę. Nie drukujemy strony przez window.print(), bo wtedy na papier szedł
 * interfejs aplikacji z nagłówkami przeglądarki, a nie dokument.
 */
export function drukujPdf(bytes: Uint8Array) {
  const blob = new Blob([bytes.slice() as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const okno = window.open(url, "_blank");
  if (!okno) {
    throw new Error("Przeglądarka zablokowała nowe okno. Zezwól na wyskakujące okna albo pobierz plik i wydrukuj go z dysku.");
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
