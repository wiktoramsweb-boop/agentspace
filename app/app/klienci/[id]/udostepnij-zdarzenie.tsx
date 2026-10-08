"use client";

import { useState, useTransition } from "react";
import { udostepnijZdarzenie } from "../portal-actions";

/**
 * Przełącznik „pokaż to klientowi w portalu".
 *
 * Opis dla klienta jest OSOBNYM polem, nie kopią tematu zdarzenia. To nie
 * jest wygoda, tylko zabezpieczenie: agenci wpisują w temat rzeczy w rodzaju
 * „Prezka mazowiecka, Bogdan 792 847 892", a tego nie wolno pokazać osobie
 * trzeciej. Klient zobaczy wyłącznie to, co agent napisze tutaj.
 */
export function UdostepnijZdarzenie({
  activityId,
  widoczne,
  opis,
}: {
  activityId: string;
  widoczne: boolean;
  opis: string | null;
}) {
  const [wlaczone, setWlaczone] = useState(widoczne);
  const [tekst, setTekst] = useState(opis ?? "");
  const [pending, start] = useTransition();

  function zapisz(nowoWlaczone: boolean, nowyTekst: string) {
    setWlaczone(nowoWlaczone);
    start(() => void udostepnijZdarzenie(activityId, nowoWlaczone, nowyTekst));
  }

  return (
    <div className="mt-2 rounded-xl bg-slate-50 p-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={wlaczone}
          disabled={pending}
          onChange={(e) => zapisz(e.target.checked, tekst)}
          className="h-4 w-4 accent-emerald-600"
        />
        Pokaż klientowi w portalu
      </label>

      {wlaczone && (
        <>
          <input
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            onBlur={() => zapisz(true, tekst)}
            placeholder="Opis dla klienta, np. Prezentacja dla zainteresowanego"
            maxLength={300}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
          />
          <p className="mt-1 text-xs text-slate-500">
            Klient widzi rodzaj zdarzenia, datę i ten opis. Nigdy temat ani notatki.
          </p>
        </>
      )}
    </div>
  );
}
