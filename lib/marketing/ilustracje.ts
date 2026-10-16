/**
 * Ilustracje rysowane w kodzie: kamienice o zmierzchu w kolorach marki.
 *
 * Stoją w miejscu obrazów z Nano Banana, dopóki ich nie ma (albo gdy plik się
 * nie wczyta). Rysunek jest deterministyczny: ten sam `ziarno` daje zawsze ten
 * sam kadr, więc serwer i przeglądarka renderują identyczny SVG.
 */

export type RodzajSceny = "ulica" | "narozna" | "biurowiec" | "panorama" | "agent" | "wnetrze";

type Opcje = { rodzaj: RodzajSceny; ziarno: number; w: number; h: number; pora?: "zmierzch" | "noc" | "rano" | "dzien" };

const NIEBO = {
  zmierzch: ["#0B1220", "#1B2745", "#3A4870", "#8F7C86"],
  noc: ["#060A14", "#0B1220", "#16213D", "#26345A"],
  rano: ["#1F3157", "#4F6A96", "#A9B9CF", "#F2D3A6"],
  dzien: ["#3E5F8F", "#6F8FBA", "#A8BFD8", "#DDE6EE"],
} as const;

const FASADY = ["#2B3654", "#34405F", "#3D3B56", "#463F57", "#2F4258", "#3A4663", "#4A4459", "#33405A"];
const SWIATLO = "#F4C36B";
const SZYBA = "#18213A";

function losuj(ziarno: number) {
  let s = (ziarno * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

const n = (v: number) => Math.round(v * 10) / 10;

function rozjasnij(hex: string, o: number) {
  const x = parseInt(hex.slice(1), 16);
  const k = (c: number) => Math.max(0, Math.min(255, c + o));
  return "#" + [(x >> 16) & 255, (x >> 8) & 255, x & 255].map((c) => k(c).toString(16).padStart(2, "0")).join("");
}

function drzewo(x: number, ziemia: number, wys: number, r: () => number, dalekie = false) {
  const kolory = dalekie ? ["#1C2A40", "#22324B", "#2A3B55"] : ["#132235", "#19304A", "#21405A"];
  let s = `<rect x="${n(x - wys * 0.025)}" y="${n(ziemia - wys * 0.5)}" width="${n(wys * 0.05)}" height="${n(wys * 0.5)}" fill="#0E1626"/>`;
  const cy = ziemia - wys * 0.7;
  const R = wys * 0.25 * (0.9 + r() * 0.2);
  const kepy: [number, number, number][] = [[0, 0, 1], [-0.6, 0.25, 0.78], [0.58, 0.2, 0.8], [-0.2, -0.45, 0.75], [0.32, -0.38, 0.7]];
  kepy.forEach(([dx, dy, k], i) => {
    s += `<circle cx="${n(x + dx * R)}" cy="${n(cy + dy * R)}" r="${n(R * k)}" fill="${kolory[i % 2]}"/>`;
  });
  s += `<circle cx="${n(x - R * 0.3)}" cy="${n(cy - R * 0.4)}" r="${n(R * 0.42)}" fill="${kolory[2]}" opacity=".8"/>`;
  return s;
}

/** Kamienica: dach z lukarnami, gzyms, rzędy okien (część świeci), parter z witrynami. */
function kamienica(x: number, w: number, pietra: number, fh: number, ziemia: number, kolor: string, r: () => number, id: string, biuro = false) {
  let s = "";
  const parter = fh * 1.25;
  const gzyms = fh * 0.22;
  const gora = ziemia - parter - pietra * fh - gzyms;
  const dach = fh * 0.8;
  s += `<path d="M${n(x - 3)} ${n(gora)}L${n(x + w * 0.07)} ${n(gora - dach)}H${n(x + w * 0.93)}L${n(x + w + 3)} ${n(gora)}Z" fill="#1A2236"/>`;
  const lukarny = Math.max(1, Math.round(w / (fh * 2.4)));
  for (let i = 0; i < lukarny; i++) {
    const lx = x + w * (0.2 + (0.6 * (i + 0.5)) / lukarny);
    const lw = fh * 0.36;
    s += `<path d="M${n(lx - lw / 2)} ${n(gora - 2)}V${n(gora - dach * 0.62)}L${n(lx)} ${n(gora - dach * 0.86)}L${n(lx + lw / 2)} ${n(gora - dach * 0.62)}V${n(gora - 2)}Z" fill="${rozjasnij(kolor, 18)}"/>`;
    s += `<rect x="${n(lx - lw * 0.26)}" y="${n(gora - dach * 0.58)}" width="${n(lw * 0.52)}" height="${n(dach * 0.36)}" rx="2" fill="${r() < 0.35 ? SWIATLO : SZYBA}"/>`;
  }
  s += `<rect x="${n(x)}" y="${n(gora)}" width="${n(w)}" height="${n(ziemia - gora)}" fill="${kolor}"/>`;
  s += `<rect x="${n(x - 5)}" y="${n(gora)}" width="${n(w + 10)}" height="${n(gzyms * 0.55)}" fill="${rozjasnij(kolor, 22)}"/>`;
  s += `<rect x="${n(x - 2)}" y="${n(gora + gzyms * 0.55)}" width="${n(w + 4)}" height="${n(gzyms * 0.45)}" fill="${rozjasnij(kolor, -14)}"/>`;
  const kol = Math.max(3, Math.round(w / (fh * 0.95)));
  const cw = w / kol;
  const ow = cw * 0.46;
  const oh = fh * 0.58;
  let barierki = "";
  for (let p = 0; p < pietra; p++) {
    const py = gora + gzyms + p * fh;
    for (let c = 0; c < kol; c++) {
      const ox = x + c * cw + (cw - ow) / 2;
      const oy = py + fh * 0.2;
      const swieci = r() < 0.24;
      s += `<rect x="${n(ox - 2)}" y="${n(oy - 2)}" width="${n(ow + 4)}" height="${n(oh + 4)}" rx="1.5" fill="${rozjasnij(kolor, 26)}"/>`;
      s += `<rect x="${n(ox)}" y="${n(oy)}" width="${n(ow)}" height="${n(oh)}" fill="${swieci ? SWIATLO : `url(#${id}s)`}"/>`;
      if (swieci) s += `<rect x="${n(ox - ow * 0.4)}" y="${n(oy - oh * 0.3)}" width="${n(ow * 1.8)}" height="${n(oh * 1.6)}" fill="url(#${id}b)"/>`;
      s += `<rect x="${n(ox + ow / 2 - 0.8)}" y="${n(oy)}" width="1.6" height="${n(oh)}" fill="${rozjasnij(kolor, 26)}"/>`;
      s += `<rect x="${n(ox)}" y="${n(oy + oh * 0.32)}" width="${n(ow)}" height="1.6" fill="${rozjasnij(kolor, 26)}"/>`;
      if (p === 1 && c % 2 === 1 && c < kol - 1) {
        const bx = ox - ow * 0.2;
        const bw = ow * 1.4;
        const by = oy + oh + 2;
        s += `<rect x="${n(bx)}" y="${n(by)}" width="${n(bw)}" height="${n(fh * 0.06)}" fill="${rozjasnij(kolor, -20)}"/>`;
        barierki += `M${n(bx)} ${n(by - fh * 0.22)}H${n(bx + bw)}`;
        for (let k = bx + 3; k < bx + bw; k += 5) barierki += `M${n(k)} ${n(by - fh * 0.22)}V${n(by)}`;
      }
    }
  }
  if (barierki) s += `<path d="${barierki}" stroke="#0E1424" stroke-width="1.3" fill="none"/>`;
  const pg = ziemia - parter;
  s += `<rect x="${n(x)}" y="${n(pg)}" width="${n(w)}" height="${n(parter)}" fill="${rozjasnij(kolor, -12)}"/>`;
  s += `<rect x="${n(x - 3)}" y="${n(pg - fh * 0.07)}" width="${n(w + 6)}" height="${n(fh * 0.08)}" fill="${rozjasnij(kolor, 14)}"/>`;
  const drzwi = Math.floor(kol / 2);
  for (let c = 0; c < kol; c++) {
    const wx = x + c * cw + cw * 0.12;
    const ww = cw * 0.76;
    const wh = parter * 0.74;
    const wy = ziemia - wh;
    if (c === drzwi && !biuro) {
      const dx = x + c * cw + cw * 0.28;
      const dw = cw * 0.44;
      const a = dw / 2;
      s += `<path d="M${n(dx)} ${n(ziemia)}V${n(wy + a)}A${n(a)} ${n(a)} 0 0 1 ${n(dx + dw)} ${n(wy + a)}V${n(ziemia)}Z" fill="${rozjasnij(kolor, 20)}"/>`;
      s += `<path d="M${n(dx + 3)} ${n(ziemia)}V${n(wy + a)}A${n(a - 3)} ${n(a - 3)} 0 0 1 ${n(dx + dw - 3)} ${n(wy + a)}V${n(ziemia)}Z" fill="#1A1420"/>`;
    } else {
      const witryna = biuro && Math.abs(c - drzwi) <= 1;
      s += `<rect x="${n(wx - 2)}" y="${n(wy - 2)}" width="${n(ww + 4)}" height="${n(wh + 2)}" fill="#0E1424"/>`;
      s += `<rect x="${n(wx)}" y="${n(wy)}" width="${n(ww)}" height="${n(wh)}" fill="${witryna ? `url(#${id}g)` : r() < 0.3 ? SWIATLO : `url(#${id}s)`}"/>`;
      if (witryna) {
        s += `<rect x="${n(wx - ww * 0.3)}" y="${n(wy - wh * 0.4)}" width="${n(ww * 1.6)}" height="${n(wh * 1.8)}" fill="url(#${id}z)"/>`;
        const os = wx + ww * (0.3 + r() * 0.4);
        s += `<circle cx="${n(os)}" cy="${n(wy + wh * 0.45)}" r="${n(wh * 0.09)}" fill="#0B1220" opacity=".75"/>`;
        s += `<rect x="${n(os - wh * 0.11)}" y="${n(wy + wh * 0.55)}" width="${n(wh * 0.22)}" height="${n(wh * 0.45)}" rx="${n(wh * 0.08)}" fill="#0B1220" opacity=".75"/>`;
      }
    }
  }
  s += `<rect x="${n(x)}" y="${n(gora)}" width="${n(w)}" height="${n(ziemia - gora)}" fill="url(#${id}c)"/>`;
  return s;
}

function biurowiec(x: number, w: number, pietra: number, fh: number, ziemia: number, r: () => number, id: string) {
  let s = "";
  const gora = ziemia - fh * 1.2 - pietra * fh;
  s += `<rect x="${n(x)}" y="${n(gora)}" width="${n(w)}" height="${n(ziemia - gora)}" fill="#2A3550"/>`;
  s += `<rect x="${n(x - 4)}" y="${n(gora - fh * 0.12)}" width="${n(w + 8)}" height="${n(fh * 0.14)}" fill="#3A4766"/>`;
  const kol = Math.max(4, Math.round(w / (fh * 0.8)));
  const cw = w / kol;
  for (let p = 0; p < pietra; p++) {
    const py = gora + p * fh;
    const caly = p === 0;
    for (let c = 0; c < kol; c++) {
      const sw = caly || r() < 0.18;
      s += `<rect x="${n(x + c * cw + 2)}" y="${n(py + fh * 0.12)}" width="${n(cw - 4)}" height="${n(fh * 0.72)}" fill="${caly ? `url(#${id}g)` : sw ? SWIATLO : `url(#${id}s)`}"/>`;
    }
    s += `<rect x="${n(x - 3)}" y="${n(py + fh * 0.86)}" width="${n(w + 6)}" height="${n(fh * 0.1)}" fill="#3A4766"/>`;
  }
  if (pietra > 0) {
    const py = gora;
    s += `<rect x="${n(x + w * 0.2)}" y="${n(py + fh * 0.3)}" width="${n(w * 0.6)}" height="${n(fh * 0.4)}" rx="3" fill="#0B1220" opacity=".55"/>`;
    for (let i = 0; i < 6; i++) {
      const bh = fh * (0.08 + r() * 0.24);
      s += `<rect x="${n(x + w * 0.24 + i * w * 0.085)}" y="${n(py + fh * 0.66 - bh)}" width="${n(w * 0.05)}" height="${n(bh)}" fill="${i % 2 ? "#06B6D4" : "#10B981"}"/>`;
    }
  }
  const gt = ziemia - fh * 1.2;
  s += `<rect x="${n(x)}" y="${n(gt)}" width="${n(w)}" height="${n(fh * 1.2)}" fill="#1B2438"/>`;
  s += `<rect x="${n(x + w * 0.05)}" y="${n(gt + fh * 0.16)}" width="${n(w * 0.9)}" height="${n(fh * 1.04)}" fill="url(#${id}s)"/>`;
  s += `<rect x="${n(x)}" y="${n(gora)}" width="${n(w)}" height="${n(ziemia - gora)}" fill="url(#${id}c)"/>`;
  return s;
}

function postac(x: number, ziemia: number, wys: number, kolor = "#0B1220") {
  const g = wys * 0.13;
  return `<g fill="${kolor}"><circle cx="${n(x)}" cy="${n(ziemia - wys + g)}" r="${n(g)}"/><rect x="${n(x - wys * 0.13)}" y="${n(ziemia - wys + g * 2.1)}" width="${n(wys * 0.26)}" height="${n(wys * 0.45)}" rx="${n(wys * 0.08)}"/><rect x="${n(x - wys * 0.11)}" y="${n(ziemia - wys * 0.45)}" width="${n(wys * 0.09)}" height="${n(wys * 0.45)}" rx="3"/><rect x="${n(x + wys * 0.02)}" y="${n(ziemia - wys * 0.45)}" width="${n(wys * 0.09)}" height="${n(wys * 0.45)}" rx="3"/><rect x="${n(x + wys * 0.12)}" y="${n(ziemia - wys * 0.78)}" width="${n(wys * 0.05)}" height="${n(wys * 0.09)}" rx="1.5" fill="#10B981"/></g>`;
}

export function scena({ rodzaj, ziarno, w: W, h: H, pora = "zmierzch" }: Opcje): string {
  const r = losuj(ziarno);
  const id = `il${ziarno}${rodzaj.slice(0, 2)}`;
  const niebo = NIEBO[pora];
  const ziemia = H * (rodzaj === "panorama" ? 0.92 : 0.88);
  const fh = H * 0.095;
  let s = `<defs>
<linearGradient id="${id}n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${niebo[0]}"/><stop offset=".45" stop-color="${niebo[1]}"/><stop offset=".8" stop-color="${niebo[2]}"/><stop offset="1" stop-color="${niebo[3]}"/></linearGradient>
<linearGradient id="${id}s" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#121A2E"/><stop offset=".6" stop-color="#223152"/><stop offset="1" stop-color="#3B5070"/></linearGradient>
<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6EE7C8"/><stop offset=".5" stop-color="#10B981"/><stop offset="1" stop-color="#06B6D4"/></linearGradient>
<radialGradient id="${id}z"><stop offset="0" stop-color="#34D399" stop-opacity=".35"/><stop offset="1" stop-color="#34D399" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}b"><stop offset="0" stop-color="${SWIATLO}" stop-opacity=".28"/><stop offset="1" stop-color="${SWIATLO}" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}l"><stop offset="0" stop-color="#FFE3B0" stop-opacity=".55"/><stop offset=".4" stop-color="#F4C36B" stop-opacity=".18"/><stop offset="1" stop-color="#F4C36B" stop-opacity="0"/></radialGradient>
<linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".06"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>
<linearGradient id="${id}v" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#060A14" stop-opacity="0"/><stop offset="1" stop-color="#060A14" stop-opacity=".45"/></linearGradient>
</defs>`;
  s += `<rect width="${W}" height="${H}" fill="url(#${id}n)"/>`;
  if (pora === "noc" || pora === "zmierzch") {
    for (let i = 0; i < 26; i++) {
      s += `<circle cx="${n(r() * W)}" cy="${n(r() * H * 0.42)}" r="${n(0.6 + r() * 1.1)}" fill="#fff" opacity="${n(0.15 + r() * 0.4)}"/>`;
    }
  }
  s += `<circle cx="${n(W * (0.2 + r() * 0.6))}" cy="${n(H * (pora === "rano" ? 0.62 : 0.78))}" r="${n(H * 0.45)}" fill="url(#${id}l)"/>`;
  // Dalszy plan: sylwety dachów.
  let px = -20;
  while (px < W) {
    const bw = W * (0.05 + r() * 0.09);
    const bh = H * (0.2 + r() * 0.28);
    s += `<rect x="${n(px)}" y="${n(ziemia - bh)}" width="${n(bw)}" height="${n(bh)}" fill="#1E2A44" opacity=".75"/>`;
    if (r() < 0.25) s += `<rect x="${n(px + bw * 0.3)}" y="${n(ziemia - bh + bh * 0.2)}" width="${n(bw * 0.12)}" height="${n(bh * 0.1)}" fill="${SWIATLO}" opacity=".6"/>`;
    px += bw + W * 0.004;
  }

  if (rodzaj === "panorama") {
    // Wieże Mariackie i Wawel jako sylwety.
    const wx = W * 0.52;
    const wt = ziemia - H * 0.62;
    s += `<path d="M${n(wx - W * 0.018)} ${n(ziemia)}V${n(wt + H * 0.12)}L${n(wx)} ${n(wt)}L${n(wx + W * 0.018)} ${n(wt + H * 0.12)}V${n(ziemia)}Z" fill="#0F1729"/>`;
    s += `<path d="M${n(wx + W * 0.03)} ${n(ziemia)}V${n(wt + H * 0.2)}L${n(wx + W * 0.045)} ${n(wt + H * 0.1)}L${n(wx + W * 0.06)} ${n(wt + H * 0.2)}V${n(ziemia)}Z" fill="#111A2E"/>`;
    const zx = W * 0.14;
    s += `<path d="M${n(zx - W * 0.1)} ${n(ziemia)}V${n(ziemia - H * 0.32)}H${n(zx - W * 0.05)}V${n(ziemia - H * 0.42)}L${n(zx - W * 0.035)} ${n(ziemia - H * 0.5)}L${n(zx - W * 0.02)} ${n(ziemia - H * 0.42)}V${n(ziemia - H * 0.34)}H${n(zx + W * 0.06)}V${n(ziemia - H * 0.4)}L${n(zx + W * 0.075)} ${n(ziemia - H * 0.47)}L${n(zx + W * 0.09)} ${n(ziemia - H * 0.4)}V${n(ziemia)}Z" fill="#0F1729"/>`;
    let bx = -10;
    let i = 0;
    while (bx < W) {
      const bw = W * (0.07 + r() * 0.05);
      s += kamienica(bx, bw, 2 + (r() > 0.5 ? 1 : 0), fh * 0.6, ziemia, rozjasnij(FASADY[(ziarno + i) % FASADY.length], -10), r, id);
      bx += bw;
      i++;
    }
  } else if (rodzaj === "ulica") {
    let bx = -W * 0.03;
    let i = 0;
    const srodek = Math.floor(W / (W * 0.2) / 2);
    while (bx < W) {
      const bw = W * (0.17 + r() * 0.07);
      s += kamienica(bx, bw, 4 + (r() > 0.5 ? 1 : 0), fh * 0.92, ziemia, FASADY[(ziarno + i * 3) % FASADY.length], r, id, i === srodek);
      bx += bw;
      i++;
    }
  } else if (rodzaj === "narozna" || rodzaj === "agent" || rodzaj === "wnetrze") {
    s += kamienica(-W * 0.24, W * 0.42, 4, fh, ziemia, FASADY[(ziarno + 2) % FASADY.length], r, id);
    s += kamienica(W * 0.82, W * 0.42, 4, fh, ziemia, FASADY[(ziarno + 5) % FASADY.length], r, id);
    s += kamienica(W * 0.18, W * 0.64, 5, fh, ziemia, FASADY[ziarno % FASADY.length], r, id, rodzaj === "narozna");
  } else if (rodzaj === "biurowiec") {
    s += kamienica(-W * 0.2, W * 0.36, 4, fh, ziemia, FASADY[(ziarno + 1) % FASADY.length], r, id);
    s += kamienica(W * 0.8, W * 0.4, 4, fh, ziemia, FASADY[(ziarno + 4) % FASADY.length], r, id);
    s += biurowiec(W * 0.2, W * 0.6, 6, fh * 0.95, ziemia, r, id);
  }

  // Chodnik i ulica.
  s += `<rect x="0" y="${n(ziemia)}" width="${W}" height="${n(H - ziemia)}" fill="#141C2E"/>`;
  s += `<rect x="0" y="${n(ziemia + H * 0.03)}" width="${W}" height="${n(H * 0.008)}" fill="#202A40"/>`;
  // Latarnie.
  for (let i = 0; i < 3; i++) {
    const lx = W * (0.12 + i * 0.38) + (r() - 0.5) * W * 0.05;
    s += `<rect x="${n(lx - 1.5)}" y="${n(ziemia - H * 0.2)}" width="3" height="${n(H * 0.2)}" fill="#0A0F1C"/>`;
    s += `<circle cx="${n(lx)}" cy="${n(ziemia - H * 0.205)}" r="${n(H * 0.012)}" fill="${SWIATLO}"/>`;
    s += `<circle cx="${n(lx)}" cy="${n(ziemia - H * 0.205)}" r="${n(H * 0.06)}" fill="url(#${id}b)"/>`;
  }
  const drzew = rodzaj === "ulica" ? 3 : rodzaj === "panorama" ? 0 : 2;
  for (let i = 0; i < drzew; i++) {
    const tx = W * (0.06 + (i * 0.88) / Math.max(1, drzew - 1));
    s += drzewo(tx + (r() - 0.5) * W * 0.04, ziemia + H * 0.02, H * (0.42 + r() * 0.12), r);
  }
  if (rodzaj === "agent") s += postac(W * 0.62, ziemia + H * 0.03, H * 0.24, "#0A0F1C");
  s += `<rect width="${W}" height="${H}" fill="url(#${id}v)"/>`;
  return s;
}

/** Gotowy znacznik <svg> do wstawienia przez dangerouslySetInnerHTML. */
export function scenaSvg(o: Opcje, etykieta: string): string {
  return `<svg viewBox="0 0 ${o.w} ${o.h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${etykieta.replace(/"/g, "")}">${scena(o)}</svg>`;
}
