"use client";

import { useState } from "react";

/**
 * Pomiar kontrastu na żywo, na tym, co naprawdę widać na ekranie.
 *
 * Statyczne szukanie po klasach łapie tylko to, o czym wiemy z góry. Tutaj
 * chodzimy po wszystkich widocznych napisach, liczymy tło przez złożenie
 * przezroczystości wszystkich rodziców i porównujemy z progiem WCAG.
 *
 * Najważniejszy kawałek to zamiana koloru na RGB. Tailwind podaje kolory jako
 * `oklch()` albo `lab()`, a ani prosty regex, ani canvas ich nie czytają -
 * przez to wcześniejsze pomiary pokazywały 1,0:1 tam, gdzie naprawdę było 17:1
 * i goniłem błędy, których nie było. Dlatego przeliczamy je wprost.
 */

type Wynik = { tekst: string; kontrast: number; klasy: string; kolor: string; tlo: string };

type RGB = { r: number; g: number; b: number; a: number };

function sRGB(x: number): number {
  const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
}

/** OKLab -> liniowy sRGB (wzory z definicji przestrzeni Oklab). */
function oklabToRGB(L: number, a: number, b: number): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    sRGB(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    sRGB(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    sRGB(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

/** CIE Lab (D50, jak w CSS) -> sRGB. */
function labToRGB(L: number, a: number, bb: number): [number, number, number] {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - bb / 200;
  const f = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (116 * t - 16) / 903.3);
  const [X, Y, Z] = [0.9642 * f(fx), 1 * f(fy), 0.8249 * f(fz)];
  return [
    sRGB(3.1338561 * X - 1.6168667 * Y - 0.4906146 * Z),
    sRGB(-0.9787684 * X + 1.9161415 * Y + 0.033454 * Z),
    sRGB(0.0719453 * X - 0.2289914 * Y + 1.4052427 * Z),
  ];
}

function naRGB(css: string): RGB | null {
  const c = css.trim();
  if (c === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  const rgb = c.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.%]+))?\s*\)$/);
  if (rgb) {
    const a = rgb[4] == null ? 1 : rgb[4].endsWith("%") ? parseFloat(rgb[4]) / 100 : parseFloat(rgb[4]);
    return { r: +rgb[1], g: +rgb[2], b: +rgb[3], a };
  }
  const nowe = c.match(/^(oklch|oklab|lab|lch)\(\s*([^)]+)\)$/);
  if (nowe) {
    const części = nowe[2].split("/");
    const n = części[0].trim().split(/\s+/).map((v) => (v.endsWith("%") ? parseFloat(v) / 100 : parseFloat(v)));
    const a = części[1] ? (części[1].includes("%") ? parseFloat(części[1]) / 100 : parseFloat(części[1])) : 1;
    let rgbv: [number, number, number];
    if (nowe[1] === "oklch") {
      const [L, C, H] = n;
      rgbv = oklabToRGB(L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180));
    } else if (nowe[1] === "oklab") {
      rgbv = oklabToRGB(n[0], n[1], n[2]);
    } else if (nowe[1] === "lch") {
      const [L, C, H] = n;
      rgbv = labToRGB(L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180));
    } else {
      rgbv = labToRGB(n[0] * (n[0] <= 1 ? 100 : 1), n[1], n[2]);
    }
    return { r: rgbv[0], g: rgbv[1], b: rgbv[2], a };
  }
  return null;
}

function naWierzchu(f: RGB, t: RGB): RGB {
  return { r: f.r * f.a + t.r * (1 - f.a), g: f.g * f.a + t.g * (1 - f.a), b: f.b * f.a + t.b * (1 - f.a), a: 1 };
}

function jasnosc(c: RGB): number {
  const [r, g, b] = [c.r, c.g, c.b].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function kontrast(a: RGB, b: RGB): number {
  const [L, M] = [jasnosc(a), jasnosc(b)];
  return (Math.max(L, M) + 0.05) / (Math.min(L, M) + 0.05);
}

/**
 * Tło pod elementem: składamy przezroczyste warstwy aż do pierwszej krytej.
 * Zwracamy null, gdy po drodze trafi się gradient albo zdjęcie - takiego tła
 * nie da się sprowadzić do jednego koloru, a zgadywanie dawało fałszywe alarmy
 * (menu boczne ma gradient, więc wychodziło, że biały tekst leży na bieli).
 */
function tloPod(el: Element): RGB | null {
  const warstwy: RGB[] = [];
  let e: Element | null = el;
  while (e) {
    const cs = getComputedStyle(e);
    if (cs.backgroundImage !== "none") return null;
    const c = naRGB(cs.backgroundColor);
    if (c && c.a > 0) {
      warstwy.push(c);
      if (c.a >= 0.999) break;
    }
    e = e.parentElement;
  }
  let akt: RGB = warstwy.length && warstwy[warstwy.length - 1].a >= 0.999
    ? warstwy.pop()!
    : { r: 255, g: 255, b: 255, a: 1 };
  for (let i = warstwy.length - 1; i >= 0; i--) akt = naWierzchu(warstwy[i], akt);
  return akt;
}

function zmierz(): { wyniki: Wynik[]; sprawdzonych: number; nieznane: string[]; pominietych: number } {
  const wyniki: Wynik[] = [];
  const nieznane = new Set<string>();
  let sprawdzonych = 0;
  let pominietych = 0;

  for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
    if (el.closest("[data-kontrast-pomijaj]")) continue;
    const tekst = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent?.trim() ?? "")
      .join(" ")
      .trim();
    if (!tekst) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity < 0.15) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;

    const fg = naRGB(cs.color);
    if (!fg) { nieznane.add(cs.color); continue; }
    const tlo = tloPod(el);
    if (!tlo) { pominietych++; continue; }
    const na = naWierzchu(fg, tlo);
    const k = kontrast(na, tlo);
    sprawdzonych++;

    // Próg WCAG AA: 3:1 dla dużego tekstu, 4.5:1 dla reszty.
    const px = parseFloat(cs.fontSize);
    const duzy = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700);
    if (k < (duzy ? 3 : 4.5)) {
      wyniki.push({
        tekst: tekst.slice(0, 60),
        kontrast: Math.round(k * 100) / 100,
        klasy: el.className?.toString().slice(0, 110) ?? "",
        kolor: cs.color,
        tlo: `rgb(${Math.round(tlo.r)}, ${Math.round(tlo.g)}, ${Math.round(tlo.b)})`,
      });
    }
  }
  wyniki.sort((a, b) => a.kontrast - b.kontrast);
  return { wyniki, sprawdzonych, nieznane: [...nieznane], pominietych };
}

export function KontrastAudyt() {
  const [stan, setStan] = useState<{ jasny?: ReturnType<typeof zmierz>; ciemny?: ReturnType<typeof zmierz> }>({});
  const [pracuje, setPracuje] = useState(false);

  async function uruchom() {
    setPracuje(true);
    const html = document.documentElement;
    const przed = html.getAttribute("data-theme");

    // Bez tego mierzymy kolory w połowie animacji przejścia: po zmianie motywu
    // tła jeszcze dojeżdżają do docelowych i wychodzi „biały tekst na białym".
    const stop = document.createElement("style");
    stop.textContent = "*, *::before, *::after { transition: none !important; animation: none !important; }";
    document.head.appendChild(stop);

    html.setAttribute("data-theme", "light");
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 250)));
    const jasny = zmierz();

    html.setAttribute("data-theme", "dark");
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 250)));
    const ciemny = zmierz();

    stop.remove();
    if (przed) html.setAttribute("data-theme", przed);
    setStan({ jasny, ciemny });
    setPracuje(false);
  }

  return (
    <div data-kontrast-pomijaj className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Kontrola kontrastu</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Mierzy każdy napis widoczny na tej stronie, w obu motywach. Próg WCAG AA: 4,5:1, a dla dużego tekstu 3:1.
          </p>
        </div>
        <button
          type="button"
          onClick={uruchom}
          disabled={pracuje}
          className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {pracuje ? "Mierzę..." : "Zmierz kontrast"}
        </button>
      </div>

      {(["jasny", "ciemny"] as const).map((motyw) => {
        const w = stan[motyw];
        if (!w) return null;
        return (
          <div key={motyw} className="mt-4 border-t border-slate-200 pt-4">
            <p className="text-sm font-semibold text-slate-900">
              Motyw {motyw}: sprawdzono {w.sprawdzonych} napisów,{" "}
              {w.wyniki.length ? (
                <span className="text-red-600">{w.wyniki.length} poniżej progu</span>
              ) : (
                <span className="text-emerald-600">wszystkie powyżej progu</span>
              )}
              {w.pominietych > 0 && (
                <span className="text-slate-400"> · {w.pominietych} na gradiencie, nie da się zmierzyć</span>
              )}
              {w.nieznane.length > 0 && (
                <span className="text-amber-600"> · nierozpoznane kolory: {w.nieznane.length}</span>
              )}
            </p>
            {w.wyniki.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {w.wyniki.slice(0, 25).map((x, i) => (
                  <li key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
                    <span className="font-mono font-semibold text-red-600">{x.kontrast}:1</span>{" "}
                    <span className="text-slate-900">„{x.tekst}”</span>
                    <span className="block text-slate-500">
                      {x.kolor} na {x.tlo}
                    </span>
                    <span className="block font-mono text-[11px] text-slate-400">{x.klasy}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
