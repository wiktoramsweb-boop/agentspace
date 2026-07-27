import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

// Generator „Oferty współpracy" — nadrukowuje pola na gotowy 6-stronicowy wzór z Canvy
// (public/oferta/wzor.pdf). Współrzędne zweryfikowane offline (PyMuPDF), układ pdf-lib:
// origin dół-lewo, wysokość strony 2384.25 pt. Szczegóły: lib/OFERTA-WSPOLPRACY-HANDOFF.md.

export type OfertaValues = {
  adres: string;
  miesiac: string;
  agent: string;
  telefon: string;
  czas: string;
  prowizja: string;
};

type FontKey = "cgReg" | "cgBold" | "arReg" | "arBold";

type FieldDef = {
  k: keyof OfertaValues;
  page: number;
  x: number;
  y: number;
  size: number;
  font: FontKey;
  color: string; // hex bez #
  align?: "center";
  prefix?: string;
};

// Zweryfikowane pola (patrz handoff). „miesiac" i „agent" występują na 2 stronach.
const FIELDS: FieldDef[] = [
  { k: "adres", page: 0, x: 132.3, y: 1190.7, size: 150, font: "cgReg", color: "f8f5ef", prefix: "ul. " },
  { k: "miesiac", page: 0, x: 841.9, y: 2101.2, size: 30, font: "arReg", color: "e8e3de", align: "center" },
  { k: "miesiac", page: 5, x: 841.9, y: 2101.2, size: 30, font: "arReg", color: "e8e3de", align: "center" },
  { k: "agent", page: 0, x: 130.3, y: 118.8, size: 38, font: "arBold", color: "f8f5ef" },
  { k: "agent", page: 5, x: 109.2, y: 157.9, size: 38, font: "arBold", color: "f8f5ef" },
  { k: "telefon", page: 5, x: 1356.5, y: 119.7, size: 30, font: "arReg", color: "dcd6d1" },
  { k: "czas", page: 4, x: 132.3, y: 1760.7, size: 55.1, font: "cgBold", color: "150e0a" },
  { k: "prowizja", page: 4, x: 975.1, y: 1760.7, size: 55.1, font: "cgBold", color: "150e0a" },
];

function hexColor(h: string) {
  const n = parseInt(h, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

async function loadBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Nie udało się pobrać ${url} (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

/** Rysuje pola na wzorze i zwraca gotowy PDF jako bajty. Działa w przeglądarce. */
export async function generateOfertaPdf(values: OfertaValues): Promise<Uint8Array> {
  const [baseBytes, cgRegB, cgBoldB, arRegB, arBoldB] = await Promise.all([
    loadBytes("/oferta/wzor.pdf"),
    loadBytes("/oferta/fonts/CormorantGaramond-Regular.ttf"),
    loadBytes("/oferta/fonts/CormorantGaramond-Bold.ttf"),
    loadBytes("/oferta/fonts/Arimo-Regular.ttf"),
    loadBytes("/oferta/fonts/Arimo-Bold.ttf"),
  ]);

  const pdf = await PDFDocument.load(baseBytes);
  pdf.registerFontkit(fontkit);
  // KRYTYCZNE: subset:false — subset gubi glify polskich znaków (adres wychodził „ul ądn a").
  const emb = (b: Uint8Array) => pdf.embedFont(b, { subset: false });
  const fonts: Record<FontKey, Awaited<ReturnType<typeof emb>>> = {
    cgReg: await emb(cgRegB),
    cgBold: await emb(cgBoldB),
    arReg: await emb(arRegB),
    arBold: await emb(arBoldB),
  };

  const pages = pdf.getPages();

  for (const f of FIELDS) {
    const raw = (values[f.k] ?? "").trim();
    if (!raw) continue;
    const font = fonts[f.font];

    let text = raw;
    if (f.prefix) {
      const p = f.prefix.trim().toLowerCase();
      // Nie dubluj prefiksu, gdy agent wpisał już „ul. ".
      if (!raw.toLowerCase().startsWith(p)) text = f.prefix + raw;
    }

    let x = f.x;
    if (f.align === "center") x = f.x - font.widthOfTextAtSize(text, f.size) / 2;

    pages[f.page].drawText(text, { x, y: f.y, size: f.size, font, color: hexColor(f.color) });
  }

  return pdf.save();
}

const MIESIACE = [
  "STYCZEŃ", "LUTY", "MARZEC", "KWIECIEŃ", "MAJ", "CZERWIEC",
  "LIPIEC", "SIERPIEŃ", "WRZESIEŃ", "PAŹDZIERNIK", "LISTOPAD", "GRUDZIEŃ",
];

/** Bieżący miesiąc wielkimi literami + rok, np. „LIPIEC 2026". */
export function currentMiesiac(d = new Date()): string {
  return `${MIESIACE[d.getMonth()]} ${d.getFullYear()}`;
}
