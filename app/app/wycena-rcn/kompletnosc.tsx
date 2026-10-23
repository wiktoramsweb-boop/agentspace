"use client";

import { useEffect, useState } from "react";

/** Te same pola co w wyliczeniu na serwerze, w tej samej kolejności. */
const POLA = ["adres", "pow", "izby", "pietro", "pieter", "rynek", "stan", "budynek", "okres", "winda", "zewnatrz", "parking"] as const;

function ileWypelnionych(form: HTMLFormElement): { procent: number; brakuje: string[] } {
  const d = new FormData(form);
  const v = (k: string) => String(d.get(k) ?? "").trim();
  const wypelnione: Record<(typeof POLA)[number], boolean> = {
    adres: Boolean(v("oferta") || (v("lat") && v("lng")) || v("address")),
    pow: Boolean(v("pow") || v("oferta")),
    izby: Boolean(v("izby")),
    pietro: v("pietro") !== "",
    pieter: Boolean(v("pieter")),
    rynek: Boolean(v("rynek")),
    stan: Boolean(v("stan")),
    budynek: Boolean(v("budynek")),
    okres: Boolean(v("okres")),
    winda: Boolean(v("winda")),
    zewnatrz: Boolean(v("zewnatrz")),
    parking: Boolean(v("parking")),
  };
  const nazwy: Record<string, string> = { adres: "adres", pow: "metraż", izby: "pokoje", pietro: "piętro", stan: "stan" };
  const ile = POLA.filter((k) => wypelnione[k]).length;
  return {
    procent: Math.round((ile / POLA.length) * 100),
    brakuje: (["adres", "pow"] as const).filter((k) => !wypelnione[k]).map((k) => nazwy[k]),
  };
}

/**
 * Pasek kompletności liczony na żywo przy każdym wpisanym polu, a nie dopiero
 * po wysłaniu. Podpowiada, co jeszcze zawęzi przedział.
 */
export function Kompletnosc({ formId }: { formId: string }) {
  const [stan, setStan] = useState({ procent: 0, brakuje: ["adres", "metraż"] });

  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const licz = () => setStan(ileWypelnionych(form));
    licz();
    form.addEventListener("input", licz);
    form.addEventListener("change", licz);
    // Adres z podpowiedzi i własne listy wyboru ustawiają ukryte pola bez zdarzenia input.
    const obserwator = new MutationObserver(licz);
    obserwator.observe(form, { subtree: true, attributes: true, attributeFilter: ["value"] });
    const zegar = setInterval(licz, 800);
    return () => {
      form.removeEventListener("input", licz);
      form.removeEventListener("change", licz);
      obserwator.disconnect();
      clearInterval(zegar);
    };
  }, [formId]);

  const kolor = stan.procent >= 75 ? "from-emerald-500 to-emerald-400" : stan.procent >= 40 ? "from-amber-400 to-emerald-400" : "from-rose-400 to-amber-400";
  return (
    <div className="min-w-0 flex-1">
      <p className="text-sm text-slate-500">
        Kompletność danych <b className="ml-1 text-2xl tabular-nums text-slate-900">{stan.procent}%</b>
      </p>
      <div className="mt-2 h-2 max-w-md overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full bg-gradient-to-r ${kolor} transition-all duration-500`} style={{ width: `${stan.procent}%` }} />
      </div>
      <p className={`mt-1 text-xs ${stan.brakuje.length ? "font-medium text-rose-600" : "text-slate-500"}`}>
        {stan.brakuje.length
          ? `Brakuje kluczowych danych: ${stan.brakuje.join(", ")}.`
          : stan.procent < 100
            ? "Możemy już wycenić. Stan, piętro i budynek zawężą przedział."
            : "Komplet danych, przedział będzie najwęższy."}
      </p>
    </div>
  );
}

/** Otwiera zwinięty formularz pod raportem i przewija do niego. */
export function OtworzEdycje() {
  return (
    <button
      type="button"
      onClick={() => {
        const d = document.getElementById("edycja") as HTMLDetailsElement | null;
        if (!d) return;
        d.open = true;
        d.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-700"
    >
      Edytuj dane i przelicz
    </button>
  );
}
