import { PDFDocument, rgb, type PDFFont, type PDFPage, type PDFImage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

/**
 * Ogólny wzór „Oferty współpracy” dla biur, które nie mają własnego pliku.
 *
 * Spectra ma własny wzór z Canvy (lib/oferta-pdf.ts) i zostaje przy nim.
 * Każde inne biuro, także demo i okres próbny, dostaje ten wzór: pięć stron A4
 * w kolorze biura, z logo, zdjęciem okładki i tekstami, które biuro ustawia raz
 * (`agency_settings.options.oferta_wzor`), a agent uzupełnia tylko dane klienta.
 * Generujemy w przeglądarce, jak pozostałe PDF-y (pdf-lib, bez druku przeglądarki).
 */

export const SPECTRA_AGENCY_ID = "fe78fb77-98e3-4e3e-831b-067c2fc4cc9e";

export type Krok = { tytul: string; opis: string };
export type Liczba = { wartosc: string; opis: string };

/** To, co biuro ustawia raz dla wszystkich agentów. */
export type WzorOferty = {
  tytul: string;
  podtytul: string;
  oNas: string;
  liczby: Liczba[];
  kroki: Krok[];
  wCenie: string[];
  zacheta: string;
};

/** To, co agent wpisuje przy każdej ofercie. */
export type DaneOferty = {
  adres: string;
  dla: string;
  miesiac: string;
  agent: string;
  telefon: string;
  email: string;
  czas: string;
  prowizja: string;
  uwagi: string;
};

export type Marka = { kolor: string; biuro: string; logoUrl: string | null; adresBiura: string; www: string };

export const DOMYSLNY_WZOR: WzorOferty = {
  tytul: "Oferta współpracy",
  podtytul: "Sprzedaż Twojej nieruchomości",
  oNas:
    "Prowadzimy sprzedaż od pierwszej rozmowy do aktu notarialnego. Cenę ustalamy na podstawie prawdziwych transakcji z okolicy, ofertę przygotowujemy tak, żeby wyróżniała się na portalach, a kupujących sprawdzamy, zanim przyjdą na prezentację. Na każdym etapie wiesz, co się dzieje i co jest następnym krokiem.",
  liczby: [
    { wartosc: "", opis: "lat na rynku" },
    { wartosc: "", opis: "sprzedanych nieruchomości" },
    { wartosc: "", opis: "dni średnio do sprzedaży" },
  ],
  kroki: [
    { tytul: "Wycena na danych", opis: "Porównujemy ceny z aktów notarialnych i aktualnych ofert w okolicy. Ustalamy cenę, która sprzedaje, a nie straszy." },
    { tytul: "Przygotowanie oferty", opis: "Profesjonalne zdjęcia, opis i plan. Podpowiadamy, co poprawić przed sesją, żeby mieszkanie wyglądało najlepiej." },
    { tytul: "Marketing", opis: "Publikacja na portalach, w naszej bazie kupujących i w mediach społecznościowych. Najpierw pokazujemy ofertę osobom, które już szukają." },
    { tytul: "Prezentacje i negocjacje", opis: "Prowadzimy prezentacje, zbieramy opinie i negocjujemy w Twoim imieniu. Po każdej prezentacji dostajesz informację zwrotną." },
    { tytul: "Bezpieczna transakcja", opis: "Sprawdzamy dokumenty, kupującego i finansowanie, przygotowujemy umowę przedwstępną i jesteśmy z Tobą u notariusza." },
  ],
  wCenie: [
    "Wycena i analiza rynku",
    "Sesja zdjęciowa i opis oferty",
    "Publikacja na portalach ogłoszeniowych",
    "Prezentacje i raporty po każdej z nich",
    "Negocjacje warunków",
    "Kompletowanie dokumentów do aktu",
  ],
  zacheta: "Umówmy się na spotkanie. Pokażę, za ile sprzedają się podobne mieszkania w okolicy i jak przygotujemy Twoją ofertę.",
};

/** Bezpieczne scalenie zapisanego wzoru z domyślnym (stare zapisy, brakujące pola). */
export function wzorZUstawien(zapisany: unknown): WzorOferty {
  const z = (zapisany && typeof zapisany === "object" ? zapisany : {}) as Partial<WzorOferty>;
  const tekst = (v: unknown, d: string, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : d);
  return {
    tytul: tekst(z.tytul, DOMYSLNY_WZOR.tytul, 60),
    podtytul: tekst(z.podtytul, DOMYSLNY_WZOR.podtytul, 80),
    oNas: tekst(z.oNas, DOMYSLNY_WZOR.oNas, 900),
    liczby: Array.isArray(z.liczby)
      ? z.liczby.slice(0, 3).map((l, i) => ({ wartosc: tekst(l?.wartosc, "", 12), opis: tekst(l?.opis, DOMYSLNY_WZOR.liczby[i]?.opis ?? "", 40) }))
      : DOMYSLNY_WZOR.liczby,
    kroki: Array.isArray(z.kroki) && z.kroki.length
      ? z.kroki.slice(0, 6).map((k) => ({ tytul: tekst(k?.tytul, "", 50), opis: tekst(k?.opis, "", 260) })).filter((k) => k.tytul)
      : DOMYSLNY_WZOR.kroki,
    wCenie: Array.isArray(z.wCenie) && z.wCenie.length ? z.wCenie.map((w) => tekst(w, "", 70)).filter(Boolean).slice(0, 10) : DOMYSLNY_WZOR.wCenie,
    zacheta: tekst(z.zacheta, DOMYSLNY_WZOR.zacheta, 300),
  };
}

/* ───────────── PDF ───────────── */

const W = 595.28;
const H = 841.89;
const M = 48;

function kolor(hex: string) {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}
const CZARNY = rgb(0.09, 0.1, 0.13);
const SZARY = rgb(0.4, 0.43, 0.48);
const JASNY = rgb(0.96, 0.96, 0.95);
const BIALY = rgb(1, 1, 1);

function zawin(tekst: string, font: PDFFont, rozmiar: number, szer: number): string[] {
  const linie: string[] = [];
  for (const akapit of tekst.split(/\n/)) {
    let linia = "";
    for (const slowo of akapit.split(/\s+/).filter(Boolean)) {
      const proba = linia ? `${linia} ${slowo}` : slowo;
      if (font.widthOfTextAtSize(proba, rozmiar) > szer && linia) {
        linie.push(linia);
        linia = slowo;
      } else linia = proba;
    }
    linie.push(linia);
  }
  return linie;
}

function akapit(p: PDFPage, tekst: string, o: { x: number; y: number; szer: number; font: PDFFont; rozmiar: number; kolor?: ReturnType<typeof rgb>; interlinia?: number }): number {
  const lh = o.rozmiar * (o.interlinia ?? 1.45);
  let y = o.y;
  for (const l of zawin(tekst, o.font, o.rozmiar, o.szer)) {
    p.drawText(l, { x: o.x, y, size: o.rozmiar, font: o.font, color: o.kolor ?? CZARNY });
    y -= lh;
  }
  return y;
}

async function bajty(url: string): Promise<Uint8Array> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Nie udało się pobrać ${url}`);
  return new Uint8Array(await r.arrayBuffer());
}

async function obraz(pdf: PDFDocument, b: Uint8Array | null): Promise<PDFImage | null> {
  if (!b) return null;
  try {
    return b[0] === 0x89 ? await pdf.embedPng(b) : await pdf.embedJpg(b);
  } catch {
    return null;
  }
}

/** Obraz wypełnia prostokąt jak object-fit: cover. Nadmiar zasłaniamy później tłem. */
function pokryj(p: PDFPage, img: PDFImage, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.width, h / img.height);
  const iw = img.width * s;
  const ih = img.height * s;
  p.drawImage(img, { x: x + (w - iw) / 2, y: y + (h - ih) / 2, width: iw, height: ih });
}

function logoNa(p: PDFPage, logo: PDFImage | null, x: number, y: number, maxW: number, maxH: number): number {
  if (!logo) return 0;
  const s = Math.min(maxW / logo.width, maxH / logo.height);
  p.drawImage(logo, { x, y, width: logo.width * s, height: logo.height * s });
  return logo.width * s;
}

function stopka(p: PDFPage, nr: number, marka: Marka, f: PDFFont, akcent: ReturnType<typeof rgb>) {
  p.drawRectangle({ x: M, y: 40, width: 24, height: 2, color: akcent });
  p.drawText(marka.biuro, { x: M, y: 26, size: 8, font: f, color: SZARY });
  const t = String(nr);
  p.drawText(t, { x: W - M - f.widthOfTextAtSize(t, 8), y: 26, size: 8, font: f, color: SZARY });
}

export async function generujOferteWzor(wzor: WzorOferty, dane: DaneOferty, marka: Marka, zdjecie: Uint8Array | null): Promise<Uint8Array> {
  const [rReg, rBold, sReg, sBold, logoB] = await Promise.all([
    bajty("/oferta/fonts/Arimo-Regular.ttf"),
    bajty("/oferta/fonts/Arimo-Bold.ttf"),
    bajty("/oferta/fonts/CormorantGaramond-Regular.ttf"),
    bajty("/oferta/fonts/CormorantGaramond-Bold.ttf"),
    marka.logoUrl ? bajty(marka.logoUrl).catch(() => null) : Promise.resolve(null),
  ]);
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  // subset: false, bo podzbiór gubił polskie znaki (to samo co w lib/oferta-pdf.ts).
  const [reg, bold, serif, serifB] = await Promise.all([rReg, rBold, sReg, sBold].map((b) => pdf.embedFont(b, { subset: false })));
  const akcent = kolor(marka.kolor);
  const logo = await obraz(pdf, logoB);
  const foto = await obraz(pdf, zdjecie);
  pdf.setTitle(`${wzor.tytul} ${dane.adres ? `- ${dane.adres}` : ""}`.trim());
  pdf.setAuthor(marka.biuro);

  /* 1. Okładka */
  const p1 = pdf.addPage([W, H]);
  const hFoto = H * 0.58;
  if (foto) pokryj(p1, foto, 0, H - hFoto, W, hFoto);
  else p1.drawRectangle({ x: 0, y: H - hFoto, width: W, height: hFoto, color: akcent });
  if (!foto) {
    for (let i = 0; i < 6; i++) p1.drawCircle({ x: W - 60 - i * 28, y: H - 80 - i * 40, size: 140 - i * 18, borderColor: BIALY, borderWidth: 0.6, opacity: 0, borderOpacity: 0.18 });
  }
  p1.drawRectangle({ x: 0, y: 0, width: W, height: H - hFoto, color: BIALY });
  p1.drawRectangle({ x: 0, y: H - hFoto - 6, width: W, height: 6, color: akcent });
  const lw = logoNa(p1, logo, M, H - hFoto - 70, 120, 40);
  p1.drawText(marka.biuro, { x: M + (lw ? lw + 12 : 0), y: H - hFoto - 56, size: 11, font: bold, color: CZARNY });
  p1.drawText(wzor.tytul.toUpperCase(), { x: M, y: H - hFoto - 120, size: 10, font: bold, color: akcent });
  let y = akapit(p1, wzor.podtytul, { x: M, y: H - hFoto - 160, szer: W - 2 * M, font: serifB, rozmiar: 38, interlinia: 1.1 });
  if (dane.adres) y = akapit(p1, dane.adres, { x: M, y: y - 8, szer: W - 2 * M, font: serif, rozmiar: 22, kolor: SZARY, interlinia: 1.2 });
  if (dane.dla) p1.drawText(`Przygotowane dla: ${dane.dla}`, { x: M, y: y - 14, size: 10, font: reg, color: SZARY });
  p1.drawRectangle({ x: 0, y: 0, width: W, height: 70, color: JASNY });
  p1.drawText(dane.agent || marka.biuro, { x: M, y: 40, size: 11, font: bold, color: CZARNY });
  p1.drawText([dane.telefon, dane.email].filter(Boolean).join("   ·   "), { x: M, y: 24, size: 9, font: reg, color: SZARY });
  if (dane.miesiac) p1.drawText(dane.miesiac, { x: W - M - reg.widthOfTextAtSize(dane.miesiac, 9), y: 40, size: 9, font: reg, color: SZARY });

  /* 2. O nas */
  const p2 = pdf.addPage([W, H]);
  p2.drawRectangle({ x: 0, y: H - 8, width: W, height: 8, color: akcent });
  p2.drawText("O NAS", { x: M, y: H - 80, size: 10, font: bold, color: akcent });
  y = akapit(p2, `Dlaczego ${marka.biuro}`, { x: M, y: H - 120, szer: W - 2 * M, font: serifB, rozmiar: 32, interlinia: 1.1 });
  y = akapit(p2, wzor.oNas, { x: M, y: y - 14, szer: W - 2 * M, font: reg, rozmiar: 12, interlinia: 1.6 });
  const liczby = wzor.liczby.filter((l) => l.wartosc.trim());
  if (liczby.length) {
    const bw = (W - 2 * M - (liczby.length - 1) * 14) / liczby.length;
    liczby.forEach((l, i) => {
      const x = M + i * (bw + 14);
      p2.drawRectangle({ x, y: y - 130, width: bw, height: 100, color: JASNY });
      p2.drawRectangle({ x, y: y - 130, width: 4, height: 100, color: akcent });
      p2.drawText(l.wartosc, { x: x + 18, y: y - 75, size: 30, font: serifB, color: CZARNY });
      akapit(p2, l.opis, { x: x + 18, y: y - 98, szer: bw - 30, font: reg, rozmiar: 9.5, kolor: SZARY, interlinia: 1.3 });
    });
    y -= 150;
  }
  if (foto) {
    const hf = Math.min(260, y - 90);
    if (hf > 120) {
      pokryj(p2, foto, M, y - 30 - hf, W - 2 * M, hf);
      // Nadmiar zdjęcia poza ramką zasłaniamy tłem strony.
      p2.drawRectangle({ x: 0, y: 0, width: W, height: y - 30 - hf, color: BIALY });
      p2.drawRectangle({ x: 0, y: y - 30, width: W, height: 40, color: BIALY });
      p2.drawRectangle({ x: 0, y: y - 30 - hf, width: M, height: hf, color: BIALY });
      p2.drawRectangle({ x: W - M, y: y - 30 - hf, width: M, height: hf, color: BIALY });
    }
  }
  if (!foto && y > 260) {
    // Bez zdjęcia dolna połowa strony zostałaby pusta: wypełniamy ją pasem z marką.
    const hp = Math.min(y - 110, 300);
    p2.drawRectangle({ x: M, y: 80, width: W - 2 * M, height: hp, color: akcent });
    for (let i = 0; i < 4; i++) p2.drawCircle({ x: W - M - 40 - i * 22, y: 80 + hp - 40 - i * 26, size: 90 - i * 16, borderColor: BIALY, borderWidth: 0.6, opacity: 0, borderOpacity: 0.2 });
    akapit(p2, wzor.podtytul, { x: M + 28, y: 80 + hp - 60, szer: W - 2 * M - 160, font: serifB, rozmiar: 26, kolor: BIALY, interlinia: 1.1 });
    if (marka.www) p2.drawText(marka.www, { x: M + 28, y: 108, size: 11, font: reg, color: BIALY });
  }
  stopka(p2, 2, marka, reg, akcent);

  /* 3. Jak sprzedajemy */
  const p3 = pdf.addPage([W, H]);
  p3.drawRectangle({ x: 0, y: H - 8, width: W, height: 8, color: akcent });
  p3.drawText("JAK SPRZEDAJEMY", { x: M, y: H - 80, size: 10, font: bold, color: akcent });
  y = akapit(p3, "Sprzedaż krok po kroku", { x: M, y: H - 120, szer: W - 2 * M, font: serifB, rozmiar: 32 });
  y -= 18;
  wzor.kroki.forEach((k, i) => {
    p3.drawCircle({ x: M + 16, y: y - 4, size: 16, color: akcent });
    const n = String(i + 1);
    p3.drawText(n, { x: M + 16 - bold.widthOfTextAtSize(n, 13) / 2, y: y - 9, size: 13, font: bold, color: BIALY });
    p3.drawText(k.tytul, { x: M + 48, y: y - 2, size: 14, font: bold, color: CZARNY });
    y = akapit(p3, k.opis, { x: M + 48, y: y - 22, szer: W - 2 * M - 48, font: reg, rozmiar: 10.5, kolor: SZARY, interlinia: 1.5 });
    if (i < wzor.kroki.length - 1) p3.drawLine({ start: { x: M + 16, y: y + 8 }, end: { x: M + 16, y: y - 14 }, thickness: 1, color: akcent, opacity: 0.35 });
    y -= 26;
  });
  stopka(p3, 3, marka, reg, akcent);

  /* 4. Warunki */
  const p4 = pdf.addPage([W, H]);
  p4.drawRectangle({ x: 0, y: H - 8, width: W, height: 8, color: akcent });
  p4.drawText("WARUNKI WSPÓŁPRACY", { x: M, y: H - 80, size: 10, font: bold, color: akcent });
  y = akapit(p4, "Jasno i na piśmie", { x: M, y: H - 120, szer: W - 2 * M, font: serifB, rozmiar: 32 });
  const bw = (W - 2 * M - 14) / 2;
  [
    ["Czas umowy", dane.czas || "do ustalenia"],
    ["Wynagrodzenie", dane.prowizja || "do ustalenia"],
  ].forEach(([e, v], i) => {
    const x = M + i * (bw + 14);
    p4.drawRectangle({ x, y: y - 120, width: bw, height: 96, color: i === 0 ? akcent : CZARNY });
    p4.drawText(e.toUpperCase(), { x: x + 20, y: y - 52, size: 9, font: bold, color: BIALY, opacity: 0.8 });
    akapit(p4, v, { x: x + 20, y: y - 84, szer: bw - 40, font: serifB, rozmiar: 24, kolor: BIALY, interlinia: 1.05 });
  });
  y -= 160;
  p4.drawText("W ramach współpracy", { x: M, y, size: 14, font: bold, color: CZARNY });
  y -= 26;
  for (const w of wzor.wCenie) {
    p4.drawCircle({ x: M + 6, y: y + 3.5, size: 3.5, color: akcent });
    y = akapit(p4, w, { x: M + 22, y, szer: W - 2 * M - 22, font: reg, rozmiar: 11.5, interlinia: 1.4 }) - 8;
  }
  if (dane.uwagi.trim()) {
    y -= 10;
    p4.drawRectangle({ x: M, y: y - 70, width: W - 2 * M, height: 80, color: JASNY });
    akapit(p4, dane.uwagi.trim(), { x: M + 18, y: y - 14, szer: W - 2 * M - 36, font: reg, rozmiar: 10.5, kolor: SZARY, interlinia: 1.45 });
  }
  stopka(p4, 4, marka, reg, akcent);

  /* 5. Kontakt */
  const p5 = pdf.addPage([W, H]);
  p5.drawRectangle({ x: 0, y: 0, width: W, height: H, color: akcent });
  p5.drawRectangle({ x: 0, y: 0, width: W, height: H, color: CZARNY, opacity: 0.25 });
  p5.drawText("KONTAKT", { x: M, y: H - 80, size: 10, font: bold, color: BIALY, opacity: 0.8 });
  y = akapit(p5, wzor.zacheta, { x: M, y: H - 130, szer: W - 2 * M, font: serifB, rozmiar: 30, kolor: BIALY, interlinia: 1.15 });
  y -= 40;
  p5.drawText(dane.agent || marka.biuro, { x: M, y, size: 20, font: bold, color: BIALY });
  y -= 30;
  for (const l of [dane.telefon, dane.email, marka.www].filter(Boolean)) {
    p5.drawText(l, { x: M, y, size: 13, font: reg, color: BIALY });
    y -= 22;
  }
  p5.drawRectangle({ x: M, y: 70, width: W - 2 * M, height: 0.6, color: BIALY, opacity: 0.4 });
  p5.drawText(marka.biuro, { x: M, y: 48, size: 11, font: bold, color: BIALY });
  if (marka.adresBiura) p5.drawText(marka.adresBiura, { x: M, y: 32, size: 9, font: reg, color: BIALY, opacity: 0.8 });

  return pdf.save();
}
