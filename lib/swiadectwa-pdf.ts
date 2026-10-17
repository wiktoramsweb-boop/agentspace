import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { CENY_OBIEKTU, DODATKI, GRUPY_PLIKOW, TRYBY, adresZamowienia, cenaZamowienia, type GrupaPlikow, type Zamowienie } from "./swiadectwa";

/**
 * Karta zamówienia świadectwa energetycznego w PDF (na serwerze).
 * Trafia mailem do realizatora razem z linkami do zdjęć, więc musi dać się
 * przeczytać bez logowania do AgentSpace.
 */

const A4 = { w: 595.28, h: 841.89 };
const M = 44;
const SZER = A4.w - 2 * M;
const NOC = rgb(0.043, 0.071, 0.125);
const ZIELEN = rgb(0.063, 0.725, 0.506);
const SZARY = rgb(0.4, 0.45, 0.52);
const LINIA = rgb(0.86, 0.88, 0.9);
const JASNY = rgb(0.95, 0.97, 0.96);

export async function kartaZamowieniaPdf(o: {
  numer: string;
  data: string;
  biuro: string;
  zamawiajacy: string;
  z: Zamowienie;
  pliki: { grupa: GrupaPlikow; nazwa: string }[];
}): Promise<Uint8Array> {
  const katalog = path.join(process.cwd(), "public", "oferta", "fonts");
  const [regB, boldB] = await Promise.all([readFile(path.join(katalog, "Arimo-Regular.ttf")), readFile(path.join(katalog, "Arimo-Bold.ttf"))]);
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const reg = await pdf.embedFont(regB, { subset: false });
  const bold = await pdf.embedFont(boldB, { subset: false });
  pdf.setTitle(`Zamówienie świadectwa energetycznego ${o.numer}`);
  const { z } = o;
  const cena = cenaZamowienia(z.typ, z.tryb);

  let strona: PDFPage = pdf.addPage([A4.w, A4.h]);
  let y = A4.h - M;
  const txt = (s: string, x: number, yy: number, size = 10, f: PDFFont = reg, kolor = NOC) => strona.drawText(s, { x, y: yy, size, font: f, color: kolor });
  const nowa = () => {
    strona = pdf.addPage([A4.w, A4.h]);
    y = A4.h - M;
  };
  const miejsce = (h: number) => {
    if (y - h < M + 20) nowa();
  };
  const zawin = (s: string, size: number, maks: number) => {
    const linie: string[] = [];
    let l = "";
    for (const w of s.split(/\s+/)) {
      const p = l ? `${l} ${w}` : w;
      if (reg.widthOfTextAtSize(p, size) > maks && l) {
        linie.push(l);
        l = w;
      } else l = p;
    }
    if (l) linie.push(l);
    return linie;
  };
  const sekcja = (t: string) => {
    miejsce(40);
    y -= 14;
    strona.drawRectangle({ x: M, y: y - 4, width: 4, height: 16, color: ZIELEN });
    txt(t, M + 12, y, 12, bold);
    y -= 20;
  };
  const wiersz = (k: string, v: string) => {
    const linie = zawin(v || "-", 9.5, SZER * 0.55);
    miejsce(16 * linie.length);
    txt(k, M, y, 9.5, reg, SZARY);
    linie.forEach((l, i) => txt(l, M + SZER * 0.42, y - i * 13, 9.5, bold));
    y -= 13 * linie.length + 9;
    strona.drawLine({ start: { x: M, y: y + 11 }, end: { x: M + SZER, y: y + 11 }, thickness: 0.4, color: LINIA });
  };

  strona.drawRectangle({ x: 0, y: A4.h - 96, width: A4.w, height: 96, color: NOC });
  txt("Zamówienie świadectwa charakterystyki energetycznej", M, A4.h - 40, 13, bold, rgb(1, 1, 1));
  txt(`${o.numer} · ${o.data.slice(8, 10)}.${o.data.slice(5, 7)}.${o.data.slice(0, 4)} · ${o.biuro}`, M, A4.h - 60, 9.5, reg, rgb(0.7, 0.75, 0.82));
  txt(adresZamowienia(z), M, A4.h - 80, 11, bold, rgb(0.43, 0.91, 0.78));
  y = A4.h - 120;

  strona.drawRectangle({ x: M, y: y - 44, width: SZER, height: 52, color: JASNY });
  txt("Obiekt", M + 12, y - 8, 8.5, reg, SZARY);
  txt(CENY_OBIEKTU[z.typ].nazwa, M + 12, y - 26, 12, bold);
  txt("Czas realizacji", M + 180, y - 8, 8.5, reg, SZARY);
  txt(`${TRYBY[z.tryb].nazwa} (${TRYBY[z.tryb].opis})`, M + 180, y - 26, 12, bold);
  txt("Cena", M + 370, y - 8, 8.5, reg, SZARY);
  txt(`${cena.netto} zł netto (${cena.brutto} zł brutto)`, M + 370, y - 26, 11, bold);
  y -= 64;

  sekcja("Dane podstawowe");
  wiersz("Adres", adresZamowienia(z));
  wiersz("Powierzchnia użytkowa", `${z.powierzchnia} m²`);
  wiersz("Wysokość pomieszczeń", `${z.wysokosc} cm`);
  wiersz("Liczba ścian zewnętrznych", z.scianyZewn);
  wiersz("Osoba do kontaktu", z.imie);
  wiersz("E-mail", z.email);
  wiersz("Telefon", z.telefon);
  wiersz("Zgoda na kontakt", z.zgoda ? "Tak" : "Nie");
  wiersz("Zamawiający", `${o.zamawiajacy}, ${o.biuro}`);

  sekcja("Dane szczegółowe");
  wiersz("Ogrzewanie budynku", z.ogrzewanie);
  wiersz("Ogrzewanie ciepłej wody", z.cwu);
  wiersz("Grzejniki", z.grzejniki);
  wiersz("Wentylacja", z.wentylacja);
  wiersz("Materiał ścian zewnętrznych", z.sciany);
  wiersz("Grubość ściany bez izolacji", `${z.gruboscSciany} cm`);
  wiersz("Materiał izolacji", z.izolacja);
  wiersz("Grubość izolacji", `${z.gruboscIzolacji} cm`);
  wiersz("Rok oddania budynku", z.rokOddania);
  wiersz("Rok ostatniej termomodernizacji", z.rokTermo);

  sekcja("Dodatkowe informacje");
  wiersz("Zaznaczone", z.dodatki.length ? z.dodatki.map((d) => DODATKI[d]).join(", ") : "brak");
  wiersz("Komentarz", z.komentarz || "brak");

  sekcja("Załączniki");
  for (const g of Object.keys(GRUPY_PLIKOW) as GrupaPlikow[]) {
    const pl = o.pliki.filter((p) => p.grupa === g);
    wiersz(GRUPY_PLIKOW[g].nazwa, pl.length ? `${pl.length} plik(ów): ${pl.map((p) => p.nazwa).join(", ")}` : "brak");
  }
  miejsce(30);
  y -= 8;
  for (const l of zawin("Pliki są w mailu jako linki do pobrania (ważne 30 dni) i w AgentSpace w zakładce Świadectwa.", 8.5, SZER)) {
    txt(l, M, y, 8.5, reg, SZARY);
    y -= 12;
  }
  return pdf.save();
}
