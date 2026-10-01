import { PROCESS_STAGES } from "@/lib/types";
import type { SzczebelLejka } from "@/lib/data-raporty";

/**
 * Lejek rysowany paskami, a nie trójkątem.
 *
 * Trójkąt ładnie wygląda i nic nie mówi: nie da się z niego odczytać, ile
 * procent przeszło dalej. Tu każdy szczebel ma swoją długość i podpis
 * „ile z poprzedniego", bo właściciela interesuje jedno miejsce - to, w którym
 * lejek się zatyka. Najsłabsze przejście podświetlamy.
 */
export function Lejek({
  szczeble,
  jednostka,
}: {
  szczeble: SzczebelLejka[];
  jednostka: string;
}) {
  const max = Math.max(...szczeble.map((s) => s.ile), 1);
  const przejscia = szczeble.map((s) => s.przejscie).filter((p): p is number => p != null);
  const najslabsze = przejscia.length ? Math.min(...przejscia) : null;

  if (!szczeble.some((s) => s.ile > 0)) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        Brak danych w tym okresie. Lejek wypełni się, gdy oferty zaczną przechodzić kolejne etapy.
      </p>
    );
  }

  return (
    <ol className="space-y-2.5">
      {szczeble.map((s, i) => {
        const szer = Math.max(4, Math.round((s.ile / max) * 100));
        const slabe = s.przejscie != null && s.przejscie === najslabsze && szczeble.length > 2;
        return (
          <li key={s.etap}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-slate-800">{s.label}</span>
              <span className="flex items-baseline gap-2 tabular-nums">
                {s.przejscie != null && (
                  <span className={slabe ? "text-xs font-semibold text-red-600" : "text-xs text-slate-400"}>
                    {s.przejscie}% dalej
                  </span>
                )}
                <span className="font-semibold text-slate-900">{s.ile}</span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${slabe ? "bg-red-400" : "bg-emerald-500"}`}
                style={{ width: `${szer}%`, opacity: 1 - i * 0.06 }}
              />
            </div>
          </li>
        );
      })}
      {najslabsze != null && najslabsze < 50 && (
        <li className="pt-1 text-xs leading-relaxed text-slate-500">
          Największa strata jest na przejściu zaznaczonym na czerwono. Tam warto szukać przyczyny,
          zanim dołożysz {jednostka} na początku lejka.
        </li>
      )}
    </ol>
  );
}

export const ETAPY_OFERT = PROCESS_STAGES;
