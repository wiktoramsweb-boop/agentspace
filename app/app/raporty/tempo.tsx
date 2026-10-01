/**
 * Słupki tempa pracy. Bez biblioteki do wykresów: to dwanaście liczb, a każda
 * dołożona zależność to kolejne 40 kB, które agent pobiera na telefonie w terenie.
 */
export function Tempo({ dane }: { dane: { tydzien: string; dzialania: number }[] }) {
  const max = Math.max(...dane.map((d) => d.dzialania), 1);
  const srednia = dane.reduce((s, d) => s + d.dzialania, 0) / (dane.length || 1);

  if (!dane.some((d) => d.dzialania > 0)) {
    return <p className="py-6 text-center text-sm text-slate-500">Brak wykonanych działań w tym okresie.</p>;
  }

  return (
    <div>
      {/* Słupek ma własny pas o stałej wysokości (h-28). Procent liczony wprost
          w kolumnie nie działał: kolumna dopasowuje się do treści, więc wysokość
          w procentach nie miała od czego się odbić i słupki znikały. */}
      <div className="flex items-end gap-1.5">
        {dane.map((d) => {
          const h = Math.max(3, Math.round((d.dzialania / max) * 100));
          const ponizejSredniej = d.dzialania < srednia * 0.7;
          return (
            <div key={d.tydzien} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span className="text-[10px] font-semibold tabular-nums text-slate-500">{d.dzialania}</span>
              <div className="flex h-28 w-full items-end">
                <div
                  title={`Tydzień od ${d.tydzien}: ${d.dzialania} działań`}
                  className={`w-full rounded-t-md ${ponizejSredniej ? "bg-amber-400" : "bg-emerald-500"}`}
                  style={{ height: `${h}%` }}
                />
              </div>
              <span className="truncate text-[10px] text-slate-400">{d.tydzien}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Średnia tygodniowa: <span className="font-semibold text-slate-700">{Math.round(srednia)}</span> działań.
        Na bursztynowo tygodnie poniżej 70 procent średniej.
      </p>
    </div>
  );
}
