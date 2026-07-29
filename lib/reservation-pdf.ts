import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { ResDoc } from "./reservation";

// Prawdziwy generator PDF umowy rezerwacyjnej (client-side, pdf-lib).
// Pełna kontrola: równe marginesy na KAŻDEJ stronie, brak nagłówków przeglądarki,
// automatyczne łamanie stron, pogrubienia (**...**), wyśrodkowane tytuły, podpisy.

const A4 = { w: 595.28, h: 841.89 };
const MARGIN = 56; // ~19.7 mm
const CONTENT_W = A4.w - 2 * MARGIN;
const INK = rgb(0.094, 0.094, 0.106); // zinc-900

type Run = { text: string; bold: boolean };
type Token = { text: string; font: PDFFont; w: number; space: boolean };

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

export async function generateReservationPdf(doc: ResDoc): Promise<Uint8Array> {
  const [regB, boldB] = await Promise.all([
    loadBytes("/oferta/fonts/Arimo-Regular.ttf"),
    loadBytes("/oferta/fonts/Arimo-Bold.ttf"),
  ]);

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const reg = await pdf.embedFont(regB, { subset: false });
  const bold = await pdf.embedFont(boldB, { subset: false });

  let page: PDFPage = pdf.addPage([A4.w, A4.h]);
  let y = A4.h - MARGIN;

  function newPage() {
    page = pdf.addPage([A4.w, A4.h]);
    y = A4.h - MARGIN;
  }
  function ensure(space: number) {
    if (y - space < MARGIN) newPage();
  }

  // Łamanie runów na linie (z zachowaniem pogrubień).
  function layout(runs: Run[], size: number): Token[][] {
    const toks: Token[] = [];
    for (const r of runs) {
      const f = r.bold ? bold : reg;
      for (const part of r.text.split(/(\s+)/)) {
        if (!part) continue;
        toks.push({ text: part, font: f, w: f.widthOfTextAtSize(part, size), space: /^\s+$/.test(part) });
      }
    }
    const lines: Token[][] = [];
    let line: Token[] = [];
    let w = 0;
    for (const t of toks) {
      if (!t.space && w + t.w > CONTENT_W && line.length) {
        lines.push(line);
        line = [];
        w = 0;
      }
      if (t.space && line.length === 0) continue;
      line.push(t);
      w += t.w;
    }
    if (line.length) lines.push(line);
    return lines;
  }

  // Rysuje akapit (runy) z zawijaniem i łamaniem stron.
  function drawRuns(runs: Run[], opts: { size?: number; align?: "left" | "center"; gapAfter?: number; indent?: number } = {}) {
    const size = opts.size ?? 10;
    const lh = size * 1.42;
    const lines = layout(runs, size);
    for (const line of lines) {
      ensure(lh);
      const lineW = line.reduce((a, t) => a + t.w, 0);
      let x = opts.align === "center" ? MARGIN + (CONTENT_W - lineW) / 2 : MARGIN;
      const baseline = y - size;
      for (const t of line) {
        if (!(t.space && x === MARGIN)) {
          page.drawText(t.text, { x, y: baseline, size, font: t.font, color: INK });
        }
        x += t.w;
      }
      y -= lh;
    }
    if (opts.gapAfter) y -= opts.gapAfter;
  }

  function drawText(text: string, opts?: Parameters<typeof drawRuns>[1]) {
    drawRuns(parseRuns(text), opts);
  }

  // ---- Skład dokumentu ----
  drawText(doc.title, { size: 14, align: "center", gapAfter: 12 });
  drawText(doc.intro, { gapAfter: 4 });
  drawText(doc.ownerText + ",", { gapAfter: 2 });
  drawText("a", { align: "center", gapAfter: 2 });
  drawText(doc.buyerText + ",", { gapAfter: 2 });
  drawText(doc.jointly, { gapAfter: 8 });
  drawText(`**Przedmiot rezerwacji:** ${doc.subjectText}`, { gapAfter: 8 });

  for (const s of doc.sections) {
    ensure(40); // nie osieroć nagłówka
    drawText(`**${s.h}**`, { size: 11, align: "center", gapAfter: 4 });
    if (s.items.length > 1) {
      s.items.forEach((it, n) => drawText(`**${n + 1}.** ${it}`, { gapAfter: 3 }));
    } else if (s.items.length === 1) {
      drawText(s.items[0], { gapAfter: 3 });
    }
    y -= 4;
  }

  // ---- Podpisy ----
  const sigBlockH = 70;
  ensure(sigBlockH);
  y -= 24; // odstęp nad podpisami
  const colW = (CONTENT_W - 40) / 2;
  const cols = [
    { x: MARGIN, roleGen: doc.ownerRoleGen, names: doc.ownerNames },
    { x: MARGIN + colW + 40, roleGen: doc.buyerRoleGen, names: doc.buyerNames },
  ];
  const lineY = y - 26; // miejsce na odręczny podpis
  for (const c of cols) {
    // kropkowana linia
    drawDotted(page, c.x, lineY, colW, reg);
    const label = `Podpis ${c.roleGen}`;
    const lw = reg.widthOfTextAtSize(label, 10);
    page.drawText(label, { x: c.x + (colW - lw) / 2, y: lineY - 14, size: 10, font: reg, color: INK });
    const names = c.names.filter((n) => n && !n.startsWith("…"));
    const nameLine = names.length ? names.join(", ") : "(imię i nazwisko)";
    const nw = reg.widthOfTextAtSize(nameLine, 10);
    page.drawText(nameLine, { x: c.x + (colW - nw) / 2, y: lineY - 28, size: 9.5, font: reg, color: names.length ? INK : rgb(0.6, 0.6, 0.63) });
  }

  return pdf.save();
}

function drawDotted(page: PDFPage, x: number, y: number, width: number, font: PDFFont) {
  const dot = ".";
  const dw = font.widthOfTextAtSize(dot, 10);
  let cx = x;
  while (cx < x + width) {
    page.drawText(dot, { x: cx, y, size: 10, font, color: rgb(0.4, 0.4, 0.43) });
    cx += dw * 1.6;
  }
}
