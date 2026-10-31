import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { WynikWyceny } from "./rcn-wycena";

/**
 * Raport wyceny mieszkania w PDF (pdf-lib, w przeglądarce, jak nasze umowy).
 * Trzy strony: ceny i parametry, porównywalne transakcje z mapą, rynek
 * w okolicy z wykresami. Wykresy rysujemy wektorowo, więc raport jest ostry
 * przy każdym powiększeniu i nie zależy od zewnętrznych map.
 */

export type DaneRaportu = {
  adres: string;
  dla: string | null;
  biuro: string;
  agent: string;
  data: string; // DD.MM.RRRR
  promien: number;
  parametry: [string, string][];
  wybranyStan: string | null;
  wynik: WynikWyceny;
  lat?: number | null;
  lng?: number | null;
};

const A4 = { w: 595.28, h: 841.89 };
const M = 40;
const SZER = A4.w - 2 * M;
const NOC = rgb(0.043, 0.071, 0.125);
const ZIELEN = rgb(0.063, 0.725, 0.506);
const ZIELEN_JASNA = rgb(0.82, 0.98, 0.9);
const CYJAN = rgb(0.024, 0.714, 0.831);
const SZARY = rgb(0.4, 0.45, 0.52);
const JASNY = rgb(0.95, 0.96, 0.97);
const LINIA = rgb(0.86, 0.88, 0.9);
const CZERWONY = rgb(0.957, 0.247, 0.369);
const NIEBIESKI = rgb(0.055, 0.647, 0.914);

const zl = (v: number) => `${Math.round(v).toLocaleString("pl-PL").replace(/ /g, " ")} zł`;
const tys = (v: number) => `${(v / 1000).toLocaleString("pl-PL", { maximumFractionDigits: 1 }).replace(/ /g, " ")} tys.`;
const dataPl = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;

async function bajty(url: string): Promise<Uint8Array> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Nie udało się pobrać ${url}`);
  return new Uint8Array(await r.arrayBuffer());
}

/**
 * Wycinek mapy OpenStreetMap jako PNG. Skleja kafelki na płótnie w przeglądarce.
 * Zwraca też, jak metry przeliczyć na piksele. Gdy kafelki się nie wczytają,
 * raport wraca do mapy wektorowej z pierścieniami odległości.
 */
async function mapaOsm(lat: number, lng: number, zasiegM: number, szer: number, wys: number): Promise<{ png: Uint8Array; pxNaMetr: number } | null> {
  if (typeof document === "undefined") return null;
  const metrNaPxZ0 = (156543.03 * Math.cos((lat * Math.PI) / 180));
  // Największy zoom, przy którym cały zasięg mieści się w połowie wysokości.
  let z = 17;
  while (z > 12 && zasiegM / (metrNaPxZ0 / 2 ** z) > wys / 2 - 20) z--;
  const n = 256 * 2 ** z;
  const px = ((lng + 180) / 360) * n;
  const sin = Math.sin((lat * Math.PI) / 180);
  const py = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * n;
  const lewo = px - szer / 2, gora = py - wys / 2;
  const cv = document.createElement("canvas");
  cv.width = szer;
  cv.height = wys;
  const cx = cv.getContext("2d");
  if (!cx) return null;
  const zadania: Promise<void>[] = [];
  for (let tx = Math.floor(lewo / 256); tx <= Math.floor((lewo + szer) / 256); tx++) {
    for (let ty = Math.floor(gora / 256); ty <= Math.floor((gora + wys) / 256); ty++) {
      zadania.push(
        new Promise((ok, zle) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            cx.drawImage(img, tx * 256 - lewo, ty * 256 - gora);
            ok();
          };
          img.onerror = () => zle(new Error("kafelek"));
          img.src = `https://tile.openstreetmap.org/${z}/${tx}/${ty}.png`;
        }),
      );
    }
  }
  try {
    await Promise.all(zadania);
    const dane = await new Promise<Blob | null>((ok) => cv.toBlob(ok, "image/png"));
    if (!dane) return null;
    return { png: new Uint8Array(await dane.arrayBuffer()), pxNaMetr: 1 / (metrNaPxZ0 / 2 ** z) };
  } catch {
    return null;
  }
}

export async function raportWycenyPdf(d: DaneRaportu): Promise<Uint8Array> {
  const [regB, boldB] = await Promise.all([bajty("/oferta/fonts/Arimo-Regular.ttf"), bajty("/oferta/fonts/Arimo-Bold.ttf")]);
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const reg = await pdf.embedFont(regB, { subset: false });
  const bold = await pdf.embedFont(boldB, { subset: false });
  pdf.setTitle(`Raport wyceny: ${d.adres}`);
  pdf.setAuthor(d.biuro);
  pdf.setCreator("AgentSpace");
  const w = d.wynik;

  const txt = (p: PDFPage, s: string, x: number, y: number, o: { size?: number; font?: PDFFont; kolor?: RGB; align?: "left" | "right" | "center" } = {}) => {
    const f = o.font ?? reg;
    const size = o.size ?? 10;
    const szer = f.widthOfTextAtSize(s, size);
    const xx = o.align === "right" ? x - szer : o.align === "center" ? x - szer / 2 : x;
    p.drawText(s, { x: xx, y, size, font: f, color: o.kolor ?? NOC });
  };
  const zawin = (s: string, size: number, maks: number, f: PDFFont = reg): string[] => {
    const linie: string[] = [];
    let l = "";
    for (const slowo of s.split(/\s+/)) {
      const proba = l ? `${l} ${slowo}` : slowo;
      if (f.widthOfTextAtSize(proba, size) > maks && l) {
        linie.push(l);
        l = slowo;
      } else l = proba;
    }
    if (l) linie.push(l);
    return linie;
  };
  const akapit = (p: PDFPage, s: string, x: number, y: number, maks: number, size = 9, kolor = SZARY, f: PDFFont = reg) => {
    let yy = y;
    for (const l of zawin(s, size, maks, f)) {
      txt(p, l, x, yy, { size, kolor, font: f });
      yy -= size * 1.45;
    }
    return yy;
  };
  const stopka = (p: PDFPage, nr: number) => {
    p.drawLine({ start: { x: M, y: 40 }, end: { x: A4.w - M, y: 40 }, thickness: 0.5, color: LINIA });
    txt(p, `Wycena przygotowana${d.dla ? ` dla: ${d.dla}` : ""} · ${d.biuro} · ${d.agent} · ${d.data}`, M, 28, { size: 7.5, kolor: SZARY });
    txt(p, `AgentSpace · strona ${nr}/3`, A4.w - M, 28, { size: 7.5, kolor: SZARY, align: "right" });
  };
  const naglowekSekcji = (p: PDFPage, tytul: string, y: number, podpis?: string) => {
    p.drawRectangle({ x: M, y: y - 4, width: 18, height: 18, color: ZIELEN_JASNA });
    p.drawCircle({ x: M + 9, y: y + 5, size: 3.5, color: ZIELEN });
    txt(p, tytul, M + 26, y, { size: 13, font: bold });
    if (podpis) txt(p, podpis, M + 26, y - 13, { size: 7.5, kolor: SZARY });
  };

  /* ── Strona 1 ── */
  const s1 = pdf.addPage([A4.w, A4.h]);
  s1.drawRectangle({ x: 0, y: A4.h - 118, width: A4.w, height: 118, color: NOC });
  s1.drawRectangle({ x: 0, y: A4.h - 121, width: A4.w, height: 3, color: ZIELEN });
  txt(s1, "Szczegółowy raport wyceny mieszkania", M, A4.h - 44, { size: 11, kolor: rgb(0.62, 0.67, 0.75) });
  let yy = A4.h - 66;
  for (const l of zawin(d.adres, 19, SZER - 130, bold).slice(0, 2)) {
    txt(s1, l, M, yy, { size: 19, font: bold, kolor: rgb(1, 1, 1) });
    yy -= 23;
  }
  txt(s1, d.biuro, A4.w - M, A4.h - 44, { size: 11, font: bold, kolor: rgb(1, 1, 1), align: "right" });
  txt(s1, d.data, A4.w - M, A4.h - 60, { size: 9, kolor: rgb(0.62, 0.67, 0.75), align: "right" });

  let y = A4.h - 160;
  const trzyKolumny = (tytul: string, podpis: string, wartosci: [string, string][], kolorTla: RGB) => {
    naglowekSekcji(s1, tytul, y, podpis);
    const top = y - 26;
    s1.drawRectangle({ x: M, y: top - 52, width: SZER, height: 52, color: kolorTla });
    const kol = [M + 14, M + 14 + SZER * 0.3, M + 14 + SZER * 0.56];
    wartosci.forEach(([etyk, wart], i) => {
      txt(s1, etyk, kol[i], top - 17, { size: 8.5, kolor: SZARY });
      txt(s1, wart, kol[i], top - 38, { size: i === 2 ? 13 : 16, font: bold });
    });
    y = top - 52 - 26;
  };
  trzyKolumny("Szacowana cena transakcyjna", "kwota, za jaką sprzedano podobne mieszkania w okolicy (akty notarialne z RCN)", [
    ["Przeciętna cena", zl(w.szacunek)],
    ["Cena za m²", zl(w.cenaM2)],
    ["Szacowany zakres cen", `${zl(w.od)} – ${zl(w.do)}`],
  ], ZIELEN_JASNA);
  trzyKolumny("Rekomendowana cena wystawienia", `z marginesem negocjacyjnym 5%: tyle warto podać w ogłoszeniu`, [
    ["Cena w ogłoszeniu", zl(w.cenaOfertowa)],
    ["Cena za m²", zl(w.cenaM2 * 1.05)],
    ["Pewność wyceny", w.pewnosc === "wysoka" ? "Duża" : w.pewnosc === "srednia" ? "Średnia" : "Mała"],
  ], JASNY);

  naglowekSekcji(s1, "Parametry mieszkania", y);
  y -= 22;
  const polowa = Math.ceil(d.parametry.length / 2);
  d.parametry.forEach(([k, v], i) => {
    const kol = i < polowa ? 0 : 1;
    const wiersz = i < polowa ? i : i - polowa;
    const x0 = M + kol * (SZER / 2 + 6);
    const yr = y - wiersz * 19;
    s1.drawLine({ start: { x: x0, y: yr - 6 }, end: { x: x0 + SZER / 2 - 6, y: yr - 6 }, thickness: 0.5, color: LINIA });
    txt(s1, k, x0 + 2, yr, { size: 9, kolor: SZARY });
    txt(s1, v, x0 + SZER / 2 - 8, yr, { size: 9, font: bold, align: "right" });
  });
  y -= polowa * 19 + 22;

  // Wpływ standardu (lewa) i korekty (prawa).
  const lewaSzer = SZER * 0.55;
  naglowekSekcji(s1, "Wpływ standardu na cenę", y);
  txt(s1, "Korekty względem mediany z aktów", M + lewaSzer + 18, y, { size: 11, font: bold });
  const dol = y - 170;
  const maxW = Math.max(...w.warianty.map((v) => v.cena));
  const minW = Math.min(...w.warianty.map((v) => v.cena)) * 0.85;
  const sz = lewaSzer / w.warianty.length;
  w.warianty.forEach((v, i) => {
    const h = ((v.cena - minW) / (maxW - minW)) * 105 + 8;
    const x0 = M + i * sz + 6;
    const on = v.stan === d.wybranyStan;
    s1.drawRectangle({ x: x0, y: dol + 26, width: sz - 12, height: h, color: on ? NOC : rgb(0.6, 0.9, 0.78) });
    txt(s1, tys(v.cena), x0 + (sz - 12) / 2, dol + 32 + h, { size: 7.5, font: bold, align: "center" });
    zawin(v.nazwa, 7, sz - 4).slice(0, 2).forEach((l, j) => txt(s1, l, x0 + (sz - 12) / 2, dol + 14 - j * 9, { size: 7, kolor: SZARY, align: "center" }));
  });
  let yk = y - 24;
  const xk = M + lewaSzer + 18;
  if (w.korekty.length === 0) yk = akapit(s1, "Brak korekt: wycena opiera się wprost na medianie podobnych transakcji.", xk, yk, SZER - lewaSzer - 18);
  for (const k of w.korekty.slice(0, 9)) {
    const plus = k.procent > 0;
    s1.drawRectangle({ x: xk, y: yk - 3, width: 30, height: 13, color: plus ? ZIELEN_JASNA : rgb(1, 0.9, 0.92) });
    txt(s1, `${plus ? "+" : ""}${Math.round(k.procent * 100)}%`, xk + 15, yk, { size: 7.5, font: bold, align: "center", kolor: plus ? rgb(0.02, 0.47, 0.34) : CZERWONY });
    txt(s1, k.nazwa, xk + 38, yk, { size: 8.5 });
    yk -= 17;
  }
  stopka(s1, 1);

  /* ── Strona 2: porównania ── */
  const s2 = pdf.addPage([A4.w, A4.h]);
  y = A4.h - 60;
  naglowekSekcji(s2, "Porównywalne transakcje", y, `akty notarialne z RCN w promieniu ${d.promien >= 1000 ? `${d.promien / 1000} km` : `${d.promien} m`}, najbardziej podobne mieszkania`);
  const mapaH = 270;
  const mx0 = M, my0 = y - 36 - mapaH;
  const cx = mx0 + SZER / 2, cy = my0 + mapaH / 2;
  const zasieg = Math.max(300, ...w.porownania.map((p) => p.odleglosc)) * 1.1;
  let skala = (mapaH / 2 - 14) / zasieg;
  const tlo = d.lat && d.lng ? await mapaOsm(d.lat, d.lng, zasieg, Math.round(SZER), Math.round(mapaH)) : null;
  if (tlo) {
    s2.drawImage(await pdf.embedPng(tlo.png), { x: mx0, y: my0, width: SZER, height: mapaH });
    skala = tlo.pxNaMetr;
    txt(s2, "© OpenStreetMap", mx0 + SZER - 4, my0 + 4, { size: 6, kolor: SZARY, align: "right" });
  } else {
    s2.drawRectangle({ x: mx0, y: my0, width: SZER, height: mapaH, color: JASNY });
    for (const f of [0.33, 0.66, 1]) {
      const r = zasieg * f * skala;
      s2.drawCircle({ x: cx, y: cy, size: r, borderColor: LINIA, borderWidth: 0.8 });
      const metry = Math.round((zasieg * f) / 50) * 50;
      txt(s2, metry >= 1000 ? `${(metry / 1000).toLocaleString("pl-PL")} km` : `${metry} m`, cx + r * 0.71 + 3, cy + r * 0.71, { size: 7, kolor: SZARY });
    }
    txt(s2, "N", cx, my0 + mapaH - 11, { size: 7, kolor: SZARY, align: "center" });
  }
  // Podpis ceny tylko tam, gdzie nie zasłoni innego: przy gęstych porównaniach napisy się zlewały.
  const zajete: { x: number; y: number; w: number }[] = [];
  for (const p of w.porownania) {
    const kol = p.cenaM2 > w.cenaM2 * 1.08 ? CZERWONY : p.cenaM2 < w.cenaM2 * 0.92 ? NIEBIESKI : ZIELEN;
    const px = cx + p.dx * skala, py = cy + p.dy * skala;
    s2.drawCircle({ x: px, y: py, size: 5, color: kol, borderColor: rgb(1, 1, 1), borderWidth: 1 });
    const podpis = tys(p.cenaM2);
    const szerP = reg.widthOfTextAtSize(podpis, 6.5);
    const kolizja = zajete.some((z) => Math.abs(z.y - py) < 9 && px + 7 < z.x + z.w && px + 7 + szerP > z.x);
    if (!kolizja) {
      s2.drawRectangle({ x: px + 6, y: py - 5, width: szerP + 3, height: 9.5, color: rgb(1, 1, 1), opacity: 0.85 });
      txt(s2, podpis, px + 7.5, py - 3, { size: 6.5, kolor: NOC });
      zajete.push({ x: px + 7, y: py, w: szerP });
    }
  }
  s2.drawCircle({ x: cx, y: cy, size: 7, color: NOC, borderColor: rgb(1, 1, 1), borderWidth: 2 });
  // Legenda.
  const lg = [
    [ZIELEN, "w pobliżu wyceny (±8%)"],
    [CZERWONY, "drożej niż wycena"],
    [NIEBIESKI, "taniej niż wycena"],
  ] as const;
  lg.forEach(([k, opis], i) => {
    s2.drawCircle({ x: M + 6 + i * 150, y: my0 - 14, size: 4, color: k });
    txt(s2, opis, M + 14 + i * 150, my0 - 17, { size: 8, kolor: SZARY });
  });

  // Tabela.
  y = my0 - 44;
  const kolumny: [string, number, "left" | "right"][] = [
    ["Adres", 156, "left"],
    ["Data aktu", 60, "left"],
    ["m²", 42, "right"],
    ["Pok.", 30, "right"],
    ["Piętro", 38, "right"],
    ["Cena", 70, "right"],
    ["zł/m²", 54, "right"],
    ["Odl.", 53, "right"],
  ];
  const wierszTabeli = (wart: string[], yr: number, f: PDFFont, kol: RGB) => {
    let xx = M + 6;
    kolumny.forEach(([, szer, al], i) => {
      const s = wart[i];
      const tekst = f.widthOfTextAtSize(s, 8) > szer - 4 ? `${s.slice(0, Math.floor(((szer - 4) / f.widthOfTextAtSize(s, 8)) * s.length) - 1)}…` : s;
      txt(s2, tekst, al === "right" ? xx + szer - 4 : xx, yr, { size: 8, font: f, kolor: kol, align: al });
      xx += szer;
    });
  };
  s2.drawRectangle({ x: M, y: y - 6, width: SZER, height: 20, color: NOC });
  wierszTabeli(kolumny.map((k) => k[0]), y, bold, rgb(1, 1, 1));
  y -= 22;
  w.porownania.forEach((p, i) => {
    if (i % 2 === 0) s2.drawRectangle({ x: M, y: y - 6, width: SZER, height: 19, color: JASNY });
    wierszTabeli(
      [p.adres, dataPl(p.data), p.pow.toLocaleString("pl-PL"), p.izby != null ? String(p.izby) : "-", p.pietro != null ? String(p.pietro) : "-", zl(p.cena), zl(p.cenaM2).replace(" zł", ""), p.odleglosc >= 1000 ? `${(p.odleglosc / 1000).toFixed(1)} km` : `${p.odleglosc} m`],
      y,
      reg,
      NOC,
    );
    y -= 19;
  });
  akapit(s2, "Ceny z aktów notarialnych są cenami transakcyjnymi. Starsze transakcje w wycenie przeliczamy na dzisiejsze ceny według trendu z okolicy; w tabeli widać ceny z dnia aktu.", M, y - 8, SZER, 8);
  stopka(s2, 2);

  /* ── Strona 3: rynek w okolicy ── */
  const s3 = pdf.addPage([A4.w, A4.h]);
  y = A4.h - 60;
  naglowekSekcji(s3, "Cena za m² w okolicy", y, "mediana i środkowe 50% transakcji mieszkań w kolejnych miesiącach");
  const seria = w.seria.filter((p) => p.liczba >= 2);
  const wy0 = y - 36 - 200, wx0 = M + 40, wW = SZER - 50, wH = 190;
  if (seria.length >= 3) {
    const wart = seria.flatMap((p) => [p.p25, p.p75]).concat(w.cenaM2);
    const mn = Math.min(...wart) * 0.95, mxv = Math.max(...wart) * 1.05;
    const X = (i: number) => wx0 + (i / (seria.length - 1)) * wW;
    const Y = (v: number) => wy0 + ((v - mn) / (mxv - mn)) * wH;
    for (let i = 0; i <= 4; i++) {
      const v = mn + ((mxv - mn) * i) / 4;
      s3.drawLine({ start: { x: wx0, y: Y(v) }, end: { x: wx0 + wW, y: Y(v) }, thickness: 0.4, color: LINIA });
      txt(s3, tys(v), wx0 - 5, Y(v) - 3, { size: 7, kolor: SZARY, align: "right" });
    }
    for (let i = 0; i < seria.length - 1; i++) {
      // Pasmo 25-75% jako trapezy między kolejnymi miesiącami.
      const a = seria[i], b = seria[i + 1];
      s3.drawSvgPath(`M ${X(i)} ${-Y(a.p75)} L ${X(i + 1)} ${-Y(b.p75)} L ${X(i + 1)} ${-Y(b.p25)} L ${X(i)} ${-Y(a.p25)} Z`, { x: 0, y: 0, color: ZIELEN_JASNA });
    }
    for (let i = 0; i < seria.length - 1; i++) {
      s3.drawLine({ start: { x: X(i), y: Y(seria[i].mediana) }, end: { x: X(i + 1), y: Y(seria[i + 1].mediana) }, thickness: 2, color: ZIELEN });
    }
    s3.drawLine({ start: { x: wx0, y: Y(w.cenaM2) }, end: { x: wx0 + wW, y: Y(w.cenaM2) }, thickness: 1, color: NOC, dashArray: [4, 4] });
    txt(s3, `wycena ${tys(w.cenaM2)} zł/m²`, wx0 + wW, Y(w.cenaM2) + 4, { size: 7.5, font: bold, align: "right" });
    seria.forEach((p, i) => {
      if (i % Math.ceil(seria.length / 8) === 0 || i === seria.length - 1) txt(s3, `${p.miesiac.slice(5, 7)}.${p.miesiac.slice(2, 4)}`, X(i), wy0 - 12, { size: 7, kolor: SZARY, align: "center" });
    });
  } else {
    akapit(s3, "Za mało aktów w poszczególnych miesiącach, żeby narysować wykres.", M, wy0 + wH / 2, SZER);
  }

  y = wy0 - 40;
  naglowekSekcji(s3, "Liczba transakcji w miesiącu", y);
  const by0 = y - 120, bH = 90;
  if (w.seria.length >= 2) {
    const mxl = Math.max(...w.seria.map((p) => p.liczba));
    const bs = (SZER - 40) / w.seria.length;
    w.seria.forEach((p, i) => {
      const h = (p.liczba / mxl) * bH;
      s3.drawRectangle({ x: M + 40 + i * bs + 2, y: by0, width: Math.max(2, bs - 4), height: h, color: CYJAN, opacity: 0.8 });
      if (i % Math.ceil(w.seria.length / 8) === 0 || i === w.seria.length - 1) txt(s3, `${p.miesiac.slice(5, 7)}.${p.miesiac.slice(2, 4)}`, M + 40 + i * bs + bs / 2, by0 - 12, { size: 7, kolor: SZARY, align: "center" });
    });
    txt(s3, String(mxl), M + 34, by0 + bH - 6, { size: 7, kolor: SZARY, align: "right" });
  }

  y = by0 - 44;
  naglowekSekcji(s3, "Podsumowanie i metoda", y);
  y -= 24;
  const podsumowanie = [
    `Wycena opiera się na ${w.liczba} najbardziej podobnych transakcjach spośród ${w.wszystkichAktow} aktów sprzedaży mieszkań w promieniu ${d.promien >= 1000 ? `${d.promien / 1000} km` : `${d.promien} m`} z ostatnich 24 miesięcy${w.okres ? ` (od ${dataPl(w.okres.od)} do ${dataPl(w.okres.do)})` : ""}.`,
    `Trend cen w okolicy: ${w.trendRoczny > 0 ? "+" : ""}${w.trendRoczny.toLocaleString("pl-PL")}% rok do roku. Starsze transakcje przeliczamy na dzisiejsze ceny według tego trendu.`,
    `Transakcje ważymy według odległości, daty aktu, podobieństwa metrażu, liczby pokoi, piętra i rynku. Pomijamy sprzedaże z bonifikatą, przetargi, egzekucje, lokale niemieszkalne, transakcje kilku lokali bez podziału ceny i ceny skrajne (reguła 1,5 IQR).`,
    `Cechy, których rejestr nie zapisuje (stan, winda, balkon, miejsce postojowe, wiek budynku), uwzględniamy korektami procentowymi pokazanymi na pierwszej stronie.`,
  ];
  for (const p of podsumowanie) y = akapit(s3, p, M, y, SZER, 9, NOC) - 6;
  y -= 6;
  akapit(
    s3,
    "Źródło danych: Rejestr Cen Nieruchomości prowadzony przez starostów, udostępniany przez GUGiK (geoportal.gov.pl). Raport jest orientacyjną analizą porównawczą przygotowaną w programie AgentSpace i nie stanowi operatu szacunkowego rzeczoznawcy majątkowego w rozumieniu ustawy o gospodarce nieruchomościami.",
    M,
    y,
    SZER,
    7.5,
  );
  stopka(s3, 3);

  return pdf.save();
}
