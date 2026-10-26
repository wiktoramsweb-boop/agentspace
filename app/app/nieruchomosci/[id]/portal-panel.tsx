"use client";

import { useState, useTransition } from "react";
import { zaproponujCene } from "../../klienci/portal-actions";
import { formatPln } from "@/lib/format";

/** Propozycja nowej ceny ofertowej do zatwierdzenia przez właściciela. */
export function PropozycjaCeny({
  accessId,
  propertyId,
  obecna,
}: {
  accessId: string;
  propertyId: string;
  obecna: number | null;
}) {
  const [cena, setCena] = useState("");
  const [powod, setPowod] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const liczba = Number(cena.replace(/\s/g, "").replace(",", "."));
  const roznica = obecna != null && Number.isFinite(liczba) && liczba > 0 ? liczba - obecna : null;

  return (
    <div className="space-y-3">
      {obecna != null && (
        <p className="text-sm text-slate-500">
          Cena w ofercie: <strong className="text-slate-900">{formatPln(obecna)}</strong>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-slate-600" htmlFor="nowa-cena">
          Nowa cena
        </label>
        <input
          id="nowa-cena"
          value={cena}
          onChange={(e) => setCena(e.target.value)}
          inputMode="numeric"
          placeholder="np. 990000"
          className="w-44 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
        />
        <span className="text-sm text-slate-500">zł</span>
        {roznica != null && roznica !== 0 && (
          <span className={`text-sm ${roznica < 0 ? "text-amber-700" : "text-emerald-700"}`}>
            {roznica < 0 ? "obniżka o " : "podwyżka o "}
            {formatPln(Math.abs(roznica))}
          </span>
        )}
      </div>
      <textarea
        value={powod}
        onChange={(e) => setPowod(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="Dlaczego proponujesz tę cenę? Klient to przeczyta."
        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pending || !Number.isFinite(liczba) || liczba <= 0}
          onClick={() => {
            setBlad(null);
            setInfo(null);
            start(async () => {
              const w = await zaproponujCene(accessId, propertyId, liczba, powod);
              if (w.ok) {
                setCena("");
                setPowod("");
                setInfo("Wysłane do zatwierdzenia.");
              } else setBlad(w.error);
            });
          }}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? "Wysyłam..." : "Wyślij do zatwierdzenia"}
        </button>
        {info && <span className="text-sm text-emerald-700">{info}</span>}
        {blad && <span className="text-sm text-red-600">{blad}</span>}
      </div>
    </div>
  );
}
