"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "../components/select";

type Opcje = { osoby: { id: string; name: string }[]; scenariusze: string[]; zespol: boolean };

/** Filtry historii: siedzą w adresie, więc listą można się podzielić. */
export function FiltryHistorii({ osoby, scenariusze, zespol }: Opcje) {
  const router = useRouter();
  const sciezka = usePathname();
  const params = useSearchParams();
  const ustaw = (k: string, v: string) => {
    const p = new URLSearchParams(params.toString());
    if (v) p.set(k, v);
    else p.delete(k);
    router.push(`${sciezka}?${p}`);
  };
  const pole = (k: string, label: string, options: { value: string; label: string }[]) => (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
      <Select aria-label={label} value={params.get(k) ?? ""} onChange={(e) => ustaw(k, e.target.value)} options={options} placeholder="Wszystkie" />
    </div>
  );
  const aktywne = ["osoba", "scenariusz", "wynik", "stan", "okres"].some((k) => params.get(k));
  return (
    <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
      <div className={`grid gap-3 sm:grid-cols-2 ${zespol ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        {zespol && pole("osoba", "Osoba", osoby.map((o) => ({ value: o.id, label: o.name })))}
        {pole("scenariusz", "Scenariusz", scenariusze.map((s) => ({ value: s, label: s })))}
        {pole("wynik", "Wynik", [{ value: "dobre", label: "Dobre (8-10)" }, { value: "srednie", label: "Średnie (5-7)" }, { value: "slabe", label: "Słabe (1-4)" }])}
        {pole("stan", "Stan", [{ value: "ukonczone", label: "Ukończone" }, { value: "niedokonczone", label: "Niedokończone" }])}
        {pole("okres", "Okres", [{ value: "7", label: "Ostatnie 7 dni" }, { value: "30", label: "Ostatnie 30 dni" }, { value: "90", label: "Ostatnie 90 dni" }])}
      </div>
      {aktywne && (
        <button type="button" onClick={() => router.push(sciezka)} className="mt-3 text-sm font-medium text-emerald-700 hover:underline">
          Wyczyść filtry
        </button>
      )}
    </div>
  );
}
