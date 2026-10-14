import fs from "node:fs";

/**
 * Wyciąganie konturów liter z pliku TrueType.
 *
 * Potrzebne, bo logo z napisem jako TEKSTEM renderuje się różnie, zależnie od
 * tego, czy odbiorca ma daną czcionkę. Logo wysłane drukarni albo wklejone do
 * Figmy ma wyglądać tak samo jak u nas, więc napis zamieniamy na krzywe.
 */

export function wczytajFont(plikCzcionki) {
  const buf = fs.readFileSync(plikCzcionki);
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

  const liczbaTablic = dv.getUint16(4);
  const tablice = {};
  for (let i = 0; i < liczbaTablic; i++) {
    const o = 12 + i * 16;
    const tag = String.fromCharCode(buf[o], buf[o + 1], buf[o + 2], buf[o + 3]);
    tablice[tag] = { offset: dv.getUint32(o + 8), length: dv.getUint32(o + 12) };
  }

  const head = tablice.head.offset;
  const unitsPerEm = dv.getUint16(head + 18);
  const indexToLocFormat = dv.getInt16(head + 50);
  const numGlyphs = dv.getUint16(tablice.maxp.offset + 4);
  const numHMetrics = dv.getUint16(tablice.hhea.offset + 34);

  /* loca: przesunięcia glifów w tablicy glyf */
  const loca = [];
  for (let i = 0; i <= numGlyphs; i++) {
    loca.push(
      indexToLocFormat === 0
        ? dv.getUint16(tablice.loca.offset + i * 2) * 2
        : dv.getUint32(tablice.loca.offset + i * 4),
    );
  }

  /* cmap: znak Unicode na numer glifu. Bierzemy podtablicę formatu 4. */
  const cmap = new Map();
  const cmapBase = tablice.cmap.offset;
  const liczbaPodtablic = dv.getUint16(cmapBase + 2);
  let format4 = null;
  for (let i = 0; i < liczbaPodtablic; i++) {
    const rec = cmapBase + 4 + i * 8;
    const offset = cmapBase + dv.getUint32(rec + 4);
    if (dv.getUint16(offset) === 4) { format4 = offset; break; }
  }
  if (format4 == null) throw new Error("Brak podtablicy cmap formatu 4.");

  const segX2 = dv.getUint16(format4 + 6);
  const seg = segX2 / 2;
  const konce = format4 + 14;
  const poczatki = konce + segX2 + 2;
  const delty = poczatki + segX2;
  const zakresy = delty + segX2;

  for (let s = 0; s < seg; s++) {
    const koniec = dv.getUint16(konce + s * 2);
    const poczatek = dv.getUint16(poczatki + s * 2);
    const delta = dv.getInt16(delty + s * 2);
    const zakres = dv.getUint16(zakresy + s * 2);
    for (let c = poczatek; c <= koniec && c !== 0xffff; c++) {
      let g;
      if (zakres === 0) g = (c + delta) & 0xffff;
      else {
        const adres = zakresy + s * 2 + zakres + (c - poczatek) * 2;
        g = dv.getUint16(adres);
        if (g !== 0) g = (g + delta) & 0xffff;
      }
      if (g) cmap.set(c, g);
    }
  }

  function szerokosc(glif) {
    const i = Math.min(glif, numHMetrics - 1);
    return dv.getUint16(tablice.hmtx.offset + i * 4);
  }

  /** Kontury glifu jako ścieżka SVG w jednostkach czcionki (oś Y w górę). */
  function konturGlifu(glif) {
    const start = tablice.glyf.offset + loca[glif];
    if (loca[glif] === loca[glif + 1]) return "";

    const konturow = dv.getInt16(start);
    if (konturow < 0) return ""; // glif złożony; w naszym napisie nie występuje

    let p = start + 10;
    const konce = [];
    for (let i = 0; i < konturow; i++) { konce.push(dv.getUint16(p)); p += 2; }
    const punktow = konce[konturow - 1] + 1;
    p += 2 + dv.getUint16(p); // pominięcie instrukcji

    const flagi = [];
    while (flagi.length < punktow) {
      const f = buf[p++];
      flagi.push(f);
      if (f & 8) { let powtorz = buf[p++]; while (powtorz-- > 0) flagi.push(f); }
    }

    const wspolrzedne = (bitKrotki, bitZnak) => {
      const out = [];
      let v = 0;
      for (const f of flagi) {
        if (f & bitKrotki) { const d = buf[p++]; v += (f & bitZnak) ? d : -d; }
        else if (!(f & bitZnak)) { v += dv.getInt16(p); p += 2; }
        out.push(v);
      }
      return out;
    };
    const xs = wspolrzedne(2, 16);
    const ys = wspolrzedne(4, 32);

    let d = "";
    let i = 0;
    for (const koniec of konce) {
      const punkty = [];
      for (; i <= koniec; i++) punkty.push({ x: xs[i], y: ys[i], naKrzywej: Boolean(flagi[i] & 1) });
      if (punkty.length === 0) continue;

      // Kontur musi zacząć się od punktu leżącego na krzywej.
      let startIdx = punkty.findIndex((pt) => pt.naKrzywej);
      let pierwszy;
      if (startIdx === -1) {
        pierwszy = { x: (punkty[0].x + punkty[punkty.length - 1].x) / 2, y: (punkty[0].y + punkty[punkty.length - 1].y) / 2 };
        startIdx = 0;
      } else pierwszy = punkty[startIdx];

      d += `M${pierwszy.x} ${pierwszy.y}`;
      let sterujacy = null;
      for (let k = 1; k <= punkty.length; k++) {
        const pt = punkty[(startIdx + k) % punkty.length];
        if (pt.naKrzywej) {
          d += sterujacy ? `Q${sterujacy.x} ${sterujacy.y} ${pt.x} ${pt.y}` : `L${pt.x} ${pt.y}`;
          sterujacy = null;
        } else if (sterujacy) {
          const sr = { x: (sterujacy.x + pt.x) / 2, y: (sterujacy.y + pt.y) / 2 };
          d += `Q${sterujacy.x} ${sterujacy.y} ${sr.x} ${sr.y}`;
          sterujacy = pt;
        } else sterujacy = pt;
      }
      if (sterujacy) d += `Q${sterujacy.x} ${sterujacy.y} ${pierwszy.x} ${pierwszy.y}`;
      d += "Z";
    }
    return d;
  }

  return { unitsPerEm, cmap, szerokosc, konturGlifu };
}

/** Napis jako jedna ścieżka SVG, układana od punktu (0,0), oś Y w dół. */
export function napisNaKrzywe(font, tekst, rozmiar, odstep = 0) {
  const skala = rozmiar / font.unitsPerEm;
  let x = 0;
  let d = "";
  for (const znak of tekst) {
    const glif = font.cmap.get(znak.codePointAt(0));
    if (glif == null) continue;
    const kontur = font.konturGlifu(glif);
    if (kontur) {
      // Przesunięcie o pozycję litery, przeskalowanie i odwrócenie osi Y.
      d += kontur.replace(/([MLQ])([-\d. ]+)/g, (_, cmd, liczby) => {
        const n = liczby.trim().split(/\s+/).map(Number);
        const out = [];
        for (let i = 0; i < n.length; i += 2) {
          out.push((n[i] * skala + x).toFixed(2), (-n[i + 1] * skala).toFixed(2));
        }
        return cmd + out.join(" ");
      });
    }
    x += font.szerokosc(glif) * skala + odstep;
  }
  return { d, szerokosc: x - odstep };
}
