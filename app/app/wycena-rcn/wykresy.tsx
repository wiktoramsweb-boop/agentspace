import type { Porownanie, PunktSerii } from "@/lib/rcn-wycena";

const tys = (v: number) => `${(v / 1000).toLocaleString("pl-PL", { maximumFractionDigits: 1 })} tys.`;
const miesiacKrotko = (m: string) => `${m.slice(5, 7)}.${m.slice(2, 4)}`;

/** Mediana ceny za m² w okolicy, miesiąc po miesiącu, z pasmem 25-75% i linią wyceny. */
export function WykresCen({ seria, cenaM2 }: { seria: PunktSerii[]; cenaM2: number }) {
  const W = 640, H = 240, L = 54, R = 12, T = 14, B = 34;
  const pkt = seria.filter((p) => p.liczba >= 2);
  if (pkt.length < 3) return <p className="text-sm text-slate-500">Za mało aktów w poszczególnych miesiącach, żeby narysować wykres.</p>;
  const wart = pkt.flatMap((p) => [p.p25, p.p75]).concat(cenaM2);
  const min = Math.min(...wart) * 0.95;
  const max = Math.max(...wart) * 1.05;
  const x = (i: number) => L + (i / (pkt.length - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - min) / (max - min)) * (H - T - B);
  const linia = (k: "mediana" | "p25" | "p75") => pkt.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join(" ");
  const pasmo = `${pkt.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.p75).toFixed(1)}`).join(" ")} ${[...pkt].reverse().map((p, i) => `L${x(pkt.length - 1 - i).toFixed(1)},${y(p.p25).toFixed(1)}`).join(" ")} Z`;
  const podzialki = Array.from({ length: 5 }, (_, i) => min + ((max - min) * i) / 4);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Cena za metr kwadratowy w okolicy w kolejnych miesiącach">
      {podzialki.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="stroke-slate-100" />
          <text x={L - 8} y={y(v) + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
            {tys(v)}
          </text>
        </g>
      ))}
      <path d={pasmo} fill="rgba(16,185,129,0.14)" />
      <path d={linia("mediana")} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinejoin="round" />
      <line x1={L} x2={W - R} y1={y(cenaM2)} y2={y(cenaM2)} stroke="#0f172a" strokeWidth={1.5} strokeDasharray="5 5" />
      <text x={W - R} y={y(cenaM2) - 6} textAnchor="end" className="fill-slate-900 text-[10px] font-semibold">
        Twoja wycena {tys(cenaM2)}
      </text>
      {pkt.map((p, i) =>
        i % Math.ceil(pkt.length / 8) === 0 || i === pkt.length - 1 ? (
          <text key={p.miesiac} x={x(i)} y={H - 12} textAnchor="middle" className="fill-slate-400 text-[10px]">
            {miesiacKrotko(p.miesiac)}
          </text>
        ) : null,
      )}
    </svg>
  );
}

/** Liczba aktów w miesiącu: pokazuje, jak żywy jest rynek w okolicy. */
export function WykresLiczby({ seria }: { seria: PunktSerii[] }) {
  const W = 640, H = 120, L = 30, R = 8, T = 8, B = 24;
  if (seria.length < 2) return null;
  const max = Math.max(...seria.map((p) => p.liczba));
  const szer = (W - L - R) / seria.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Liczba transakcji w kolejnych miesiącach">
      {seria.map((p, i) => {
        const h = (p.liczba / max) * (H - T - B);
        return (
          <g key={p.miesiac}>
            <rect x={L + i * szer + 2} y={H - B - h} width={Math.max(2, szer - 4)} height={h} rx={3} fill="#06b6d4" opacity={0.75} />
            {(i % Math.ceil(seria.length / 8) === 0 || i === seria.length - 1) && (
              <text x={L + i * szer + szer / 2} y={H - 8} textAnchor="middle" className="fill-slate-400 text-[10px]">
                {miesiacKrotko(p.miesiac)}
              </text>
            )}
          </g>
        );
      })}
      <text x={L - 6} y={T + 8} textAnchor="end" className="fill-slate-400 text-[10px]">
        {max}
      </text>
    </svg>
  );
}

/** Wpływ standardu wykończenia na cenę tego mieszkania. */
export function WplywStandardu({ warianty, wybrany }: { warianty: { stan: string; nazwa: string; cena: number }[]; wybrany: string }) {
  const max = Math.max(...warianty.map((w) => w.cena));
  // Skala od 85% najniższej wartości: od zera różnice kilkunastu procent wyglądały na równe słupki.
  const min = Math.min(...warianty.map((w) => w.cena)) * 0.85;
  return (
    <div className="flex h-48 items-end gap-2">
      {warianty.map((w) => {
        const on = w.stan === wybrany;
        return (
          <div key={w.stan} className="flex flex-1 flex-col items-center gap-1.5">
            <span className={`text-[11px] font-semibold tabular-nums ${on ? "text-slate-900" : "text-slate-500"}`}>{tys(w.cena)}</span>
            <div className={`w-full rounded-t-lg ${on ? "bg-slate-900" : "bg-emerald-200"}`} style={{ height: `${((w.cena - min) / (max - min)) * 110 + 10}px` }} />
            <span className="text-center text-[10px] leading-tight text-slate-500">{w.nazwa}</span>
          </div>
        );
      })}
    </div>
  );
}
