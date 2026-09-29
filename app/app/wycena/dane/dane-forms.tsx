"use client";

import { useState } from "react";
import { addPriceLevel, importFromGus, importRcnFile, type ActionResult } from "./actions";

const field =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25";
const label = "mb-1.5 block text-sm font-medium text-slate-700";

function Wynik({ res }: { res: ActionResult | null }) {
  if (!res) return null;
  return (
    <div
      className={`mt-4 rounded-xl border p-4 text-sm ${
        res.ok ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-900"
      }`}
    >
      <p className="font-medium">{res.message}</p>
      {res.details && res.details.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs opacity-90">
          {res.details.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Pobranie średnich cen transakcyjnych z GUS. Jedno kliknięcie, bez plików. */
export function GusImport() {
  const [res, setRes] = useState<ActionResult | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            setRes(await importFromGus());
          } finally {
            setBusy(false);
          }
        }}
        className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
      >
        {busy ? "Pobieram z GUS…" : "Pobierz dane z GUS"}
      </button>
      <Wynik res={res} />
    </div>
  );
}

/** Wgranie wypisu z Rejestru Cen Nieruchomości. */
export function RcnImport() {
  const [res, setRes] = useState<ActionResult | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          setRes(await importRcnFile(new FormData(e.currentTarget)));
        } finally {
          setBusy(false);
        }
      }}
      className="grid gap-4"
    >
      <div>
        <label className={label} htmlFor="plik">Plik CSV z wypisu</label>
        <input id="plik" name="plik" type="file" accept=".csv,text/csv" required className={field} />
      </div>
      <div>
        <label className={label} htmlFor="etykieta">Etykieta źródła</label>
        <input id="etykieta" name="etykieta" className={field} placeholder="np. krakow-2026" />
        <p className="mt-1.5 text-xs text-slate-500">
          Służy do rozpoznania, skąd pochodzi wiersz. Ponowny import tego samego
          pliku z tą samą etykietą aktualizuje dane zamiast je dublować.
        </p>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="justify-self-start rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
      >
        {busy ? "Wgrywam…" : "Wgraj plik"}
      </button>
      <Wynik res={res} />
    </form>
  );
}

/** Ręczne wpisanie poziomu cen, np. z kwartalnego raportu NBP. */
export function ManualLevel() {
  const [res, setRes] = useState<ActionResult | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        setBusy(true);
        try {
          const r = await addPriceLevel(new FormData(form));
          setRes(r);
          if (r.ok) form.reset();
        } finally {
          setBusy(false);
        }
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <div>
        <label className={label} htmlFor="miasto">Miasto</label>
        <input id="miasto" name="miasto" required className={field} placeholder="Kraków" />
      </div>
      <div>
        <label className={label} htmlFor="cena">Cena za m² (zł)</label>
        <input id="cena" name="cena" required inputMode="decimal" className={field} placeholder="17 500" />
      </div>
      <div>
        <label className={label} htmlFor="okres">Okres</label>
        <input id="okres" name="okres" required className={field} placeholder="2026-Q2" />
      </div>
      <div>
        <label className={label} htmlFor="rynek">Rynek</label>
        <select id="rynek" name="rynek" defaultValue="" className={field}>
          <option value="">Bez rozróżnienia</option>
          <option value="wtorny">Wtórny</option>
          <option value="pierwotny">Pierwotny</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
        >
          {busy ? "Zapisuję…" : "Dodaj poziom cen"}
        </button>
        <Wynik res={res} />
      </div>
    </form>
  );
}
