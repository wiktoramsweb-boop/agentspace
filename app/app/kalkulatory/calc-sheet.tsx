export type SheetRow = { label: string; value: string; strong?: boolean; muted?: boolean };

export function CalcSheet({
  title,
  subtitle,
  rows,
  note,
  agent,
}: {
  title: string;
  subtitle?: string;
  rows: SheetRow[];
  note?: string;
  agent: { name: string; email: string; agency: string };
}) {
  const today = new Date().toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="print-sheet mx-auto w-full max-w-[760px] bg-white p-8 text-[13px] leading-relaxed text-zinc-900 shadow-xl md:p-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Logo" width={48} height={48} className="rounded-full" />
          <div>
            <p className="text-sm font-semibold">{agent.agency}</p>
            <p className="text-xs text-zinc-500">Symulacja dla klienta · {today}</p>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-zinc-600">{subtitle}</p>}
        </div>
      </div>

      <div className="divide-y divide-zinc-100 py-4">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <span className={r.muted ? "text-zinc-500" : "text-zinc-700"}>{r.label}</span>
            <span
              className={
                r.strong
                  ? "text-lg font-bold text-zinc-900"
                  : r.muted
                    ? "text-zinc-600"
                    : "font-medium text-zinc-900"
              }
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>

      {note && (
        <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-500">{note}</p>
      )}

      <div className="mt-8 border-t border-zinc-200 pt-4 text-xs text-zinc-500">
        Przygotował: <span className="font-medium text-zinc-800">{agent.name}</span>
        {agent.email && ` · ${agent.email}`}
      </div>
    </div>
  );
}
