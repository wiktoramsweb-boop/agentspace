"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FORMY_UMOWY, MODELE_ROZLICZEN, TYPY_NAJMU, USLUGI, type Konfig } from "@/lib/najem-model";
import { zapiszKonfig } from "../actions";

const POLE = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15";

export function WarunkiBiura({ k }: { k: Konfig }) {
  const router = useRouter();
  const [f, setF] = useState(k);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const przelacz = (pole: "modele" | "typy" | "formy" | "uslugi", id: string) => setF((v) => ({ ...v, [pole]: v[pole].includes(id) ? v[pole].filter((x) => x !== id) : [...v[pole], id] }));
  const wybor = (tytul: string, pole: "modele" | "typy" | "formy" | "uslugi", opcje: { id: string; nazwa: string; opis?: string }[]) => (
    <section className="rounded-3xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 font-semibold text-slate-900">{tytul}</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {opcje.map((o) => (
          <label key={o.id} className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 p-3 has-[:checked]:border-emerald-400 has-[:checked]:bg-emerald-50">
            <input type="checkbox" checked={f[pole].includes(o.id)} onChange={() => przelacz(pole, o.id)} className="mt-0.5 h-4 w-4 accent-emerald-600" />
            <span>
              <span className="block text-sm font-semibold text-slate-900">{o.nazwa}</span>
              {o.opis && <span className="block text-xs text-slate-500">{o.opis}</span>}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
  const liczba = (pole: "prowizjaPct" | "oplataStartowa" | "limitNapraw" | "przegladyRok" | "dzienRozliczenia" | "dniNaZastrzezenia", label: string) => (
    <label>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input value={f[pole]} onChange={(e) => setF((v) => ({ ...v, [pole]: e.target.value as unknown as number }))} inputMode="decimal" className={POLE} />
    </label>
  );
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-slate-900">Wynagrodzenie i terminy</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {liczba("prowizjaPct", "Prowizja od czynszu (%)")}
          {liczba("oplataStartowa", "Opłata startowa (zł)")}
          {liczba("limitNapraw", "Limit napraw bez zgody (zł)")}
          {liczba("przegladyRok", "Przeglądy w roku")}
          {liczba("dzienRozliczenia", "Rozliczenie do dnia miesiąca")}
          {liczba("dniNaZastrzezenia", "Dni na zastrzeżenia (0: brak zapisu)")}
        </div>
      </section>
      {wybor("Modele rozliczeń", "modele", MODELE_ROZLICZEN)}
      {wybor("Typy najmu", "typy", TYPY_NAJMU)}
      {wybor("Formy umowy z najemcą", "formy", FORMY_UMOWY)}
      {wybor("Zakres usług", "uslugi", USLUGI)}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const w = await zapiszKonfig(f);
              setInfo(w.ok ? "Zapisane." : w.error);
              router.refresh();
            })
          }
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Zapisuję…" : "Zapisz warunki"}
        </button>
        {info && <span className="text-sm text-slate-500">{info}</span>}
      </div>
    </div>
  );
}
