export type SheetRow = {
  label: string;
  value: string;
  old?: string; // przekreślona wartość sprzed rabatu
  save?: string; // oszczędność (na zielono, po prawej)
  muted?: boolean;
};

export function CalcSheet({
  title,
  subtitle,
  rows,
  emphasis,
  savings,
  note,
  agent,
}: {
  title: string;
  subtitle?: string;
  rows: SheetRow[];
  emphasis?: { label: string; value: string };
  savings?: string;
  note?: string;
  agent: { name: string; email: string; phone?: string; agency: string };
}) {
  const today = new Date().toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="print-sheet mx-auto w-full max-w-[760px] rounded-2xl border-t-4 border-emerald-500 bg-white p-8 text-[13px] leading-relaxed text-zinc-900 shadow-xl md:p-10">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Logo" width={48} height={48} className="rounded-full" />
          <div>
            <p className="text-sm font-semibold">{agent.agency}</p>
            <p className="text-xs text-slate-500">Symulacja dla klienta · {today}</p>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>

      <div className="divide-y divide-zinc-100 py-3">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2.5">
            <span className={r.muted ? "text-slate-500" : "text-slate-400"}>{r.label}</span>
            <span className="flex items-center gap-2 whitespace-nowrap">
              {r.old && <span className="text-slate-500 line-through">{r.old}</span>}
              <span className={r.muted ? "text-slate-400" : "font-medium text-zinc-900"}>{r.value}</span>
              {r.save && (
                <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-600">
                  −{r.save}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {emphasis && (
        <div className="mt-2 flex items-center justify-between rounded-xl bg-emerald-50 px-5 py-4">
          <span className="font-semibold text-zinc-900">{emphasis.label}</span>
          <span className="text-2xl font-bold text-emerald-700">{emphasis.value}</span>
        </div>
      )}

      {savings && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <span className="text-lg">💰</span> {savings}
        </div>
      )}

      {note && <p className="mt-4 rounded-lg bg-zinc-50 p-3 text-xs text-slate-500">{note}</p>}

      <div className="mt-8 border-t border-zinc-200 pt-4 text-xs text-slate-500">
        Przygotował: <span className="font-medium text-zinc-800">{agent.name}</span>
        {agent.phone && ` · tel. ${agent.phone}`}
        {agent.email && ` · ${agent.email}`}
      </div>
    </div>
  );
}
