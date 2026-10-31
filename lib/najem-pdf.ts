import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { Rozliczenie } from "./najem-model";

/** Miesięczne rozliczenie z właścicielem: układ jak w załączniku do umowy o zarządzanie. */

export type DaneRozliczenia = {
  biuro: string;
  adres: string;
  wlasciciel: string;
  najemca: string;
  miesiac: string;
  model: string;
  modelNazwa: string;
  prowizjaPct: number;
  r: Rozliczenie;
  czynszWplata: number;
  oplatyWplata: number;
  kosztyOpis: string | null;
  kaucja: number;
  dniNaZastrzezenia: number;
};

const NOC = rgb(0.06, 0.09, 0.16);
const SZARY = rgb(0.4, 0.45, 0.52);
const LINIA = rgb(0.86, 0.88, 0.9);
const ZIELEN = rgb(0.82, 0.98, 0.9);
const zl = (v: number) => `${v.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/ | /g, " ")} zł`;

async function bajty(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("Nie udało się pobrać czcionki");
  return new Uint8Array(await r.arrayBuffer());
}

export async function rozliczeniePdf(d: DaneRozliczenia): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const [a, b] = await Promise.all([bajty("/oferta/fonts/Arimo-Regular.ttf"), bajty("/oferta/fonts/Arimo-Bold.ttf")]);
  const reg = await pdf.embedFont(a, { subset: false });
  const bold = await pdf.embedFont(b, { subset: false });
  pdf.setTitle(`Rozliczenie ${d.miesiac}: ${d.adres}`);
  pdf.setAuthor(d.biuro);
  const s = pdf.addPage([595.28, 841.89]);
  const M = 48;
  const P = 595.28 - M;
  const czysc = (t: string) => t.replace(/ | /g, " ");
  const txt = (t: string, x: number, y: number, o: { size?: number; f?: typeof reg; prawo?: boolean; kolor?: ReturnType<typeof rgb> } = {}) => {
    const f = o.f ?? reg;
    const size = o.size ?? 10;
    const c = czysc(t);
    s.drawText(c, { x: o.prawo ? x - f.widthOfTextAtSize(c, size) : x, y, size, font: f, color: o.kolor ?? NOC });
  };
  let y = 790;
  txt(d.biuro, M, y, { size: 9, f: bold, kolor: SZARY });
  y -= 30;
  txt("Miesięczne rozliczenie z właścicielem", M, y, { size: 19, f: bold });
  y -= 18;
  txt(`Okres rozliczeniowy: ${d.miesiac.slice(5)}/${d.miesiac.slice(0, 4)}`, M, y, { kolor: SZARY });
  y -= 30;
  for (const [e, w] of [["Lokal", d.adres], ["Właściciel", d.wlasciciel], ["Najemca", d.najemca], ["Model rozliczeń", `${d.model}: ${d.modelNazwa}`]]) {
    txt(e, M, y, { f: bold, size: 9.5 });
    txt(w, M + 120, y, { size: 9.5 });
    s.drawLine({ start: { x: M, y: y - 6 }, end: { x: P, y: y - 6 }, thickness: 0.5, color: LINIA });
    y -= 22;
  }
  y -= 14;
  const wiersz = (e: string, v: string, mocny = false, tlo = false) => {
    if (tlo) s.drawRectangle({ x: M, y: y - 7, width: P - M, height: 23, color: ZIELEN });
    txt(e, M + 8, y, { f: mocny ? bold : reg });
    txt(v, P - 8, y, { f: mocny ? bold : reg, prawo: true });
    if (!tlo) s.drawLine({ start: { x: M, y: y - 7 }, end: { x: P, y: y - 7 }, thickness: 0.5, color: LINIA });
    y -= 24;
  };
  wiersz("Wpłata najemcy: czynsz najmu", zl(d.czynszWplata));
  wiersz("Wpłata najemcy: opłaty i media", zl(d.oplatyWplata));
  wiersz("Razem wpływy", zl(d.r.wplaty), true);
  wiersz(`Prowizja ${d.prowizjaPct}% od czynszu najmu`, `- ${zl(d.r.prowizja)}`);
  wiersz(`Koszty i naprawy${d.kosztyOpis ? `: ${d.kosztyOpis.slice(0, 50)}` : ""}`, `- ${zl(d.r.koszty)}`);
  if (d.model === "A") wiersz("Do przekazania właścicielowi", zl(d.r.doPrzekazania), true, true);
  else wiersz("Do zapłaty biuru przez właściciela", zl(d.r.doZaplatyPrzezWlasciciela), true, true);
  y -= 6;
  wiersz("Stan kaucji (informacyjnie)", zl(d.kaucja));
  wiersz("Zaległości najemcy (informacyjnie)", zl(d.r.zaleglosc));
  y -= 16;
  if (d.dniNaZastrzezenia > 0) {
    txt(`Brak zastrzeżeń w ciągu ${d.dniNaZastrzezenia} dni od otrzymania rozliczenia oznacza jego akceptację,`, M, y, { size: 8, kolor: SZARY });
    txt("z zastrzeżeniem prawa do wykazania błędu.", M, y - 11, { size: 8, kolor: SZARY });
  }
  return pdf.save();
}
