"use client";

import { formatPln } from "@/lib/format";

/**
 * Wykresy raportu, rysowane w SVG bez biblioteki.
 *
 * SVG, a nie div-y: linia z wypełnieniem, łuki pierścienia i siatka to rzeczy,
 * których paskami się nie zrobi, a biblioteka do wykresów to kilkadziesiąt kB,
 * które agent pobiera w terenie. Tu wystarczy kilkanaście liczb i trochę
 * geometrii.
 *
 * Kolory są podane wprost, a nie klasami Tailwinda: gradienty i obrysy w SVG
 * muszą wyglądać tak samo w obu motywach, bo rysunek leży na karcie, która
 * sama zmienia tło.
 */

const ZIELEN = "#10b981";
const ZIELEN_CIEMNA = "#059669";

/** Punkty krzywej wygładzonej (Catmull-Rom w zapisie Beziera). */
function gladkaSciezka(punkty: { x: number; y: number }[]): string {
  if (punkty.length < 2) return "";
  let d = `M ${punkty[0].x} ${punkty[0].y}`;
  for (let i = 0; i < punkty.length - 1; i++) {
    const p0 = punkty[i - 1] ?? punkty[i];
    const p1 = punkty[i];
    const p2 = punkty[i + 1];
    const p3 = punkty[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function skrot(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")} mln`;
  if (n >= 1000) return `${Math.round(n / 1000)} tys.`;
  return String(Math.round(n));
}

/** Prowizja miesiąc po miesiącu jako linia z wypełnieniem. */
export function WykresPrzychodu({
  dane,
}: {
  dane: { miesiac: string; pln: number; szt: number }[];
}) {
  if (!dane.some((d) => d.pln > 0)) {
    return <p className="py-10 text-center text-sm text-slate-500">Brak zamkniętych transakcji w ostatnim roku.</p>;
  }

  const W = 760;
  const H = 240;
  const PAD = { gora: 16, dol: 28, lewo: 54, prawo: 8 };
  const max = Math.max(...dane.map((d) => d.pln));
  const gora = Math.ceil(max / 10000) * 10000 || 10000;
  const szerPasa = (W - PAD.lewo - PAD.prawo) / (dane.length - 1 || 1);
  const doY = (v: number) => PAD.gora + (1 - v / gora) * (H - PAD.gora - PAD.dol);

  const punkty = dane.map((d, i) => ({ x: PAD.lewo + i * szerPasa, y: doY(d.pln) }));
  const linia = gladkaSciezka(punkty);
  const wypelnienie = `${linia} L ${punkty[punkty.length - 1].x} ${H - PAD.dol} L ${punkty[0].x} ${H - PAD.dol} Z`;
  const siatka = [0, 0.25, 0.5, 0.75, 1].map((u) => gora * u);

  const suma = dane.reduce((s, d) => s + d.pln, 0);
  const ostatnie3 = dane.slice(-3).reduce((s, d) => s + d.pln, 0) / 3;
  const poprzednie3 = dane.slice(-6, -3).reduce((s, d) => s + d.pln, 0) / 3;
  const zmiana = poprzednie3 > 0 ? Math.round(((ostatnie3 - poprzednie3) / poprzednie3) * 100) : null;
  const najlepszy = dane.reduce((a, b) => (b.pln > a.pln ? b : a));

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Prowizja miesiąc po miesiącu">
        <defs>
          <linearGradient id="grad-przychod" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ZIELEN} stopOpacity="0.28" />
            <stop offset="100%" stopColor={ZIELEN} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {siatka.map((v) => (
          <g key={v}>
            <line
              x1={PAD.lewo} x2={W - PAD.prawo} y1={doY(v)} y2={doY(v)}
              className="text-slate-200" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4"
            />
            <text
              x={PAD.lewo - 10} y={doY(v) + 3.5} textAnchor="end"
              className="fill-slate-400" fontSize="10"
            >
              {skrot(v)}
            </text>
          </g>
        ))}

        <path d={wypelnienie} fill="url(#grad-przychod)" />
        <path d={linia} fill="none" stroke={ZIELEN_CIEMNA} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {dane.map((d, i) => (
          <g key={d.miesiac}>
            {d.pln > 0 && (
              <circle
                cx={punkty[i].x} cy={punkty[i].y} r={d.miesiac === najlepszy.miesiac ? 5 : 3.5}
                fill={ZIELEN_CIEMNA} className="stroke-white" strokeWidth="2"
              >
                <title>{`${d.miesiac}: ${formatPln(d.pln)} z ${d.szt} transakcji`}</title>
              </circle>
            )}
            <text
              x={punkty[i].x} y={H - PAD.dol + 16} textAnchor="middle"
              className="fill-slate-400" fontSize="10"
            >
              {d.miesiac}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-3 flex flex-wrap gap-x-7 gap-y-1.5 border-t border-slate-200 pt-3.5 text-sm">
        <Metryka label="Razem 12 miesięcy" value={formatPln(suma)} />
        <Metryka label="Średnio na miesiąc" value={formatPln(Math.round(suma / dane.length))} />
        <Metryka label="Najlepszy miesiąc" value={`${najlepszy.miesiac} · ${formatPln(najlepszy.pln)}`} />
        {zmiana != null && (
          <Metryka
            label="Kwartał do kwartału"
            value={`${zmiana >= 0 ? "+" : ""}${zmiana}%`}
            ton={zmiana >= 0 ? "dobrze" : "zle"}
          />
        )}
      </div>
    </div>
  );
}

function Metryka({ label, value, ton }: { label: string; value: string; ton?: "dobrze" | "zle" }) {
  return (
    <span className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wider text-slate-400">{label}</span>
      <span
        className={`font-semibold ${ton === "dobrze" ? "text-emerald-600" : ton === "zle" ? "text-red-600" : "text-slate-900"}`}
      >
        {value}
      </span>
    </span>
  );
}

/** Udział źródeł w prowizji jako pierścień z sumą w środku. */
export function DonutZrodel({
  zrodla,
}: {
  zrodla: { zrodlo: string; label: string; prowizja: number; kontakty: number }[];
}) {
  const zPieniedzmi = zrodla.filter((z) => z.prowizja > 0);
  const suma = zPieniedzmi.reduce((s, z) => s + z.prowizja, 0);
  if (!suma) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        Żadne źródło nie przyniosło jeszcze prowizji w tym okresie.
      </p>
    );
  }

  const KOLORY = ["#10b981", "#0ea5e9", "#8b5cf6", "#f59e0b", "#f43f5e", "#14b8a6", "#6366f1", "#94a3b8"];
  const R = 68;
  const GRUBOSC = 22;
  const obwod = 2 * Math.PI * R;
  // Przesunięcia liczymy z góry, a nie w trakcie rysowania: zmienna zmieniana
  // podczas renderu łamie zasady React i przy ponownym renderze dałaby
  // przekłamany pierścień.
  const odcinki = zPieniedzmi.map((z) => (z.prowizja / suma) * obwod);
  const przesuniecia = odcinki.map((_, i) => odcinki.slice(0, i).reduce((a, b) => a + b, 0));

  return (
    <div className="flex flex-col items-center gap-7 sm:flex-row sm:items-center">
      <svg viewBox="0 0 180 180" className="h-44 w-44 flex-shrink-0 -rotate-90" role="img" aria-label="Udział źródeł w prowizji">
        {zPieniedzmi.map((z, i) => (
          <circle
            key={z.zrodlo}
            cx="90" cy="90" r={R}
            fill="none"
            stroke={KOLORY[i % KOLORY.length]}
            strokeWidth={GRUBOSC}
            strokeDasharray={`${odcinki[i]} ${obwod - odcinki[i]}`}
            strokeDashoffset={-przesuniecia[i]}
          >
            <title>{`${z.label}: ${formatPln(z.prowizja)}`}</title>
          </circle>
        ))}
      </svg>

      <ul className="min-w-0 flex-1 space-y-2.5">
        {zPieniedzmi.map((z, i) => (
          <li key={z.zrodlo} className="flex items-center gap-3">
            <span className="h-3 w-3 flex-shrink-0 rounded-sm" style={{ background: KOLORY[i % KOLORY.length] }} />
            <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{z.label}</span>
            <span className="flex-shrink-0 text-sm font-semibold tabular-nums text-slate-900">
              {formatPln(z.prowizja)}
            </span>
            <span className="w-12 flex-shrink-0 text-right text-xs tabular-nums text-slate-400">
              {Math.round((z.prowizja / suma) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Mały wykres w kafelku: pokazuje kierunek, nie wartości. */
export function Sparkline({ wartosci, kolor = ZIELEN }: { wartosci: number[]; kolor?: string }) {
  if (wartosci.length < 2) return null;
  const W = 120;
  const H = 32;
  const max = Math.max(...wartosci, 1);
  const min = Math.min(...wartosci, 0);
  const zakres = max - min || 1;
  const punkty = wartosci.map((v, i) => ({
    x: (i / (wartosci.length - 1)) * W,
    y: H - 3 - ((v - min) / zakres) * (H - 6),
  }));
  const d = gladkaSciezka(punkty);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-8 w-full" aria-hidden="true" preserveAspectRatio="none">
      <path d={`${d} L ${W} ${H} L 0 ${H} Z`} fill={kolor} fillOpacity="0.12" />
      <path d={d} fill="none" stroke={kolor} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Kafelek z liczbą, zmianą i małym wykresem kierunku. */
export function KafelekKPI({
  label, value, sub, trend, przebieg, akcent,
}: {
  label: string;
  value: string;
  sub?: string;
  /** Zmiana w procentach. Dodatnia nie zawsze znaczy dobrze, stąd `odwrotnie`. */
  trend?: { proc: number; odwrotnie?: boolean } | null;
  przebieg?: number[];
  akcent?: boolean;
}) {
  const dobrze = trend ? (trend.odwrotnie ? trend.proc <= 0 : trend.proc >= 0) : null;
  return (
    <div
      className={`overflow-hidden rounded-2xl border p-5 ${
        akcent ? "border-emerald-500/25 bg-emerald-500/[0.05]" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-1.5 flex items-baseline gap-2">
        <p className={`text-2xl font-semibold tracking-tight ${akcent ? "text-emerald-700" : "text-slate-900"}`}>
          {value}
        </p>
        {trend != null && (
          <span
            className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
              dobrze ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            }`}
          >
            <svg className={`h-3 w-3 ${trend.proc >= 0 ? "" : "rotate-180"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75 12 8.25l7.5 7.5" />
            </svg>
            {Math.abs(trend.proc)}%
          </span>
        )}
      </div>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
      {przebieg && przebieg.length > 1 && (
        <div className="-mx-1 mt-3">
          <Sparkline wartosci={przebieg} kolor={akcent ? ZIELEN_CIEMNA : ZIELEN} />
        </div>
      )}
    </div>
  );
}
