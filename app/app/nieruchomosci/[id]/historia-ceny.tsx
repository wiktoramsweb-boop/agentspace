import type { ZmianaCeny } from "@/lib/data-historia-ceny";
import { formatDatePL } from "@/lib/datetime";

const zl = (n: number | null) => (n == null ? "brak" : `${Math.round(n).toLocaleString("pl-PL")} zł`);

/**
 * Historia ceny: wykres schodkowy i lista zmian.
 *
 * Na rozmowie z właścicielem o obniżce to jest najmocniejszy argument:
 * „cena stoi od 74 dni, w tym czasie zero prezentacji". Na rozmowie
 * z kupującym odwrotnie: „właściciel już dwa razy schodził z ceny".
 */
export function HistoriaCeny({ zmiany, rodzaj }: { zmiany: ZmianaCeny[]; rodzaj: string }) {
  const punkty = zmiany.filter((z) => z.nowa != null) as (ZmianaCeny & { nowa: number })[];
  if (punkty.length === 0) {
    return <p className="text-sm text-slate-500">Oferta nie ma jeszcze ceny.</p>;
  }

  const pierwsza = punkty[0].nowa;
  const obecna = punkty[punkty.length - 1].nowa;
  const zmianaProc = pierwsza > 0 ? ((obecna - pierwsza) / pierwsza) * 100 : 0;
  const dniOdStartu = Math.max(0, Math.floor((Date.now() - Date.parse(punkty[0].kiedy)) / 86_400_000));
  const dniOdZmiany = Math.max(0, Math.floor((Date.now() - Date.parse(punkty[punkty.length - 1].kiedy)) / 86_400_000));

  // Wykres: oś czasu od pierwszej ceny do dziś, schodki przy każdej zmianie.
  const W = 300;
  const H = 70;
  const t0 = Date.parse(punkty[0].kiedy);
  const t1 = Math.max(Date.now(), t0 + 86_400_000);
  const min = Math.min(...punkty.map((p) => p.nowa));
  const max = Math.max(...punkty.map((p) => p.nowa));
  const zakres = max - min || max * 0.05 || 1;
  const x = (t: number) => ((t - t0) / (t1 - t0)) * W;
  const y = (v: number) => H - 8 - ((v - min) / zakres) * (H - 16);
  let d = `M 0 ${y(punkty[0].nowa).toFixed(1)}`;
  for (let i = 1; i < punkty.length; i++) {
    const xi = x(Date.parse(punkty[i].kiedy)).toFixed(1);
    d += ` H ${xi} V ${y(punkty[i].nowa).toFixed(1)}`;
  }
  d += ` H ${W}`;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xl font-semibold text-slate-900">
            {zl(obecna)}
            {rodzaj === "wynajem" ? <span className="text-sm font-normal text-slate-500">/mc</span> : null}
          </p>
          <p className="text-xs text-slate-500">
            {punkty.length > 1
              ? `Start ${zl(pierwsza)}, ${zmianaProc === 0 ? "bez zmiany netto" : `${zmianaProc > 0 ? "+" : ""}${zmianaProc.toLocaleString("pl-PL", { maximumFractionDigits: 1 })}%`}`
              : "Cena wyjściowa, bez zmian"}
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>
            <span className="font-semibold text-slate-700">{dniOdStartu}</span> dni w ofercie
          </p>
          <p>
            <span className={`font-semibold ${dniOdZmiany > 45 ? "text-amber-600" : "text-slate-700"}`}>{dniOdZmiany}</span> dni od ostatniej zmiany
          </p>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-[70px] w-full text-emerald-500" preserveAspectRatio="none" aria-hidden="true">
        <path d={`${d} V ${H} H 0 Z`} fill="currentColor" opacity="0.08" />
        <path d={d} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>

      <ol className="mt-3 space-y-2">
        {[...punkty].reverse().map((z) => {
          const roznica = z.stara != null && z.stara > 0 ? ((z.nowa - z.stara) / z.stara) * 100 : null;
          return (
            <li key={z.id} className="flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-slate-800">
                  {zl(z.nowa)}
                  {roznica != null && roznica !== 0 && (
                    <span className={`ml-2 rounded px-1.5 py-0.5 text-[11px] font-semibold ${roznica < 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {roznica > 0 ? "+" : ""}
                      {roznica.toLocaleString("pl-PL", { maximumFractionDigits: 1 })}%
                    </span>
                  )}
                  {z.stara == null && <span className="ml-2 text-xs font-normal text-slate-400">cena wyjściowa</span>}
                </p>
                <p className="text-xs text-slate-500">
                  {z.zPortalu ? "Zgoda właściciela w portalu klienta" : z.kto ?? "Zmiana bez wskazanej osoby"}
                </p>
              </div>
              <span className="flex-shrink-0 text-xs text-slate-400">{formatDatePL(z.kiedy)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
