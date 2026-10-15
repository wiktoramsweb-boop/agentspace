"use client";

import { useRouter } from "next/navigation";
import { Select, type SelectOption } from "../../components/select";

export function FiltryDziennika({
  osoby, rodzaje, kto, rodzaj, wazne,
}: {
  osoby: SelectOption[];
  rodzaje: SelectOption[];
  kto: string;
  rodzaj: string;
  wazne: boolean;
}) {
  const router = useRouter();
  function idz(zmiana: Record<string, string>) {
    const p = new URLSearchParams({ kto, rodzaj, wazne: wazne ? "1" : "", ...zmiana });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    router.push(`/app/zespol/dziennik?${p}`);
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="w-56">
        <Select aria-label="Osoba" value={kto} onChange={(e) => idz({ kto: e.target.value })} options={osoby} placeholder="Wszystkie osoby" />
      </div>
      <div className="w-56">
        <Select aria-label="Rodzaj" value={rodzaj} onChange={(e) => idz({ rodzaj: e.target.value })} options={rodzaje} placeholder="Wszystko" />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={wazne} onChange={(e) => idz({ wazne: e.target.checked ? "1" : "" })} className="h-4 w-4 accent-emerald-600" />
        Tylko ważne (usunięcia, eksporty, przepisania, role)
      </label>
    </div>
  );
}
