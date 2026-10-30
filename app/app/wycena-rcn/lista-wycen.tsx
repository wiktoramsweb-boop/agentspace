import Link from "next/link";
import { formatPln } from "@/lib/format";
import { formatDatePL } from "@/lib/datetime";
import type { WycenaNaLiscie } from "@/lib/wyceny";

const PEWNOSC: Record<string, string> = { wysoka: "Duża pewność", srednia: "Średnia pewność", niska: "Mała pewność" };

export function WierszWyceny({ w, autor = false }: { w: WycenaNaLiscie; autor?: boolean }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-slate-100 py-3 last:border-0">
      <Link href={`/app/wycena-rcn/${w.id}`} className="min-w-0 flex-1 hover:text-emerald-700">
        <span className="block truncate font-semibold text-slate-900">{w.adres}</span>
        <span className="block text-xs text-slate-500">
          {formatDatePL(w.updated_at)}
          {w.pow ? ` · ${Number(w.pow).toLocaleString("pl-PL")} m²` : ""}
          {w.dla ? ` · dla: ${w.dla}` : ""}
          {w.pewnosc ? ` · ${PEWNOSC[w.pewnosc] ?? ""}` : ""}
          {autor && w.profiles?.full_name ? ` · ${w.profiles.full_name}` : ""}
        </span>
      </Link>
      {w.property_id && w.properties?.title && (
        <Link href={`/app/nieruchomosci/${w.property_id}`} className="max-w-[220px] truncate rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:underline">
          {w.properties.title}
        </Link>
      )}
      <span className="text-right">
        <span className="block font-bold tabular-nums text-slate-900">{formatPln(Number(w.szacunek))}</span>
        {w.cena_m2 && <span className="block text-xs tabular-nums text-slate-500">{formatPln(Number(w.cena_m2))}/m²</span>}
      </span>
    </li>
  );
}

export function OstatnieWyceny({ wyceny }: { wyceny: WycenaNaLiscie[] }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">Ostatnie wyceny</h2>
        <Link href="/app/wycena-rcn/historia" className="text-sm font-medium text-emerald-700 hover:underline">
          Wszystkie →
        </Link>
      </div>
      <ul>
        {wyceny.map((w) => (
          <WierszWyceny key={w.id} w={w} />
        ))}
      </ul>
    </section>
  );
}
