"use client";

import { useState } from "react";
import { CONDITIONS } from "@/lib/types";
import { AddressInput } from "../components/address-input";
import { formatPln } from "@/lib/format";
import type { Estimate } from "@/lib/wycena/model";
import Link from "next/link";
import { runValuation } from "./actions";

/**
 * Formularz analizy porównawczej.
 *
 * Wynik pokazujemy jako widełki, nigdy jako jedną liczbę, i zawsze razem
 * z listą porównań oraz korektami. Agent musi umieć powiedzieć klientowi,
 * skąd ta kwota, inaczej nie użyje tego przy stole.
 */

const TYPES = [
  { value: "mieszkanie", label: "Mieszkanie" },
  { value: "dom", label: "Dom" },
  { value: "dzialka", label: "Działka" },
  { value: "lokal", label: "Lokal użytkowy" },
];

const CONFIDENCE: Record<Estimate["confidence"], { label: string; cls: string }> = {
  wysoka: { label: "Wysoka pewność", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  srednia: { label: "Średnia pewność", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  niska: { label: "Niska pewność", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
};

const SOURCE_LABEL: Record<string, string> = {
  wlasna: "transakcja biura",
  rcn: "RCN",
  oferta: "cena ofertowa",
};

const field =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25";
const label = "mb-1.5 block text-sm font-medium text-slate-700";

export function WycenaForm() {
  const [result, setResult] = useState<Estimate | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      setResult(await runValuation(new FormData(e.currentTarget)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
      <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="grid gap-4">
          <div>
            <label className={label} htmlFor="property_type">Rodzaj</label>
            <select id="property_type" name="property_type" defaultValue="mieszkanie" className={field}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <AddressInput
            label="Adres nieruchomości"
            placeholder="Zacznij pisać, np. Kraków Zbożowa 2…"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="area_m2">Powierzchnia (m²) *</label>
              <input id="area_m2" name="area_m2" inputMode="decimal" required className={field} placeholder="54" />
            </div>
            <div>
              <label className={label} htmlFor="rooms">Pokoje</label>
              <input id="rooms" name="rooms" inputMode="numeric" className={field} placeholder="3" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="floor">Piętro</label>
              <input id="floor" name="floor" inputMode="numeric" className={field} placeholder="2" />
            </div>
            <div>
              <label className={label} htmlFor="floors_total">Pięter w budynku</label>
              <input id="floors_total" name="floors_total" inputMode="numeric" className={field} placeholder="4" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="year_built">Rok budowy</label>
              <input id="year_built" name="year_built" inputMode="numeric" className={field} placeholder="2008" />
            </div>
            <div>
              <label className={label} htmlFor="market">Rynek</label>
              <select id="market" name="market" defaultValue="wtorny" className={field}>
                <option value="wtorny">Wtórny</option>
                <option value="pierwotny">Pierwotny</option>
              </select>
            </div>
          </div>

          <div>
            <label className={label} htmlFor="condition_std">Stan</label>
            <select id="condition_std" name="condition_std" defaultValue="do_wprowadzenia" className={field}>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>


          <button
            type="submit"
            disabled={busy}
            className="mt-1 w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {busy ? "Liczę…" : "Policz wartość"}
          </button>
        </div>
      </form>

      <div>
        {!result ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center text-slate-500">
            Uzupełnij dane po lewej. Wynik oprzemy na transakcjach Twojego biura
            i danych rynkowych z okolicy. Wybierz adres z podpowiedzi, wtedy
            porównamy w promieniu 2,5 km zamiast w obrębie całego miasta.
          </div>
        ) : !result.ok ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-900">
            <p className="font-semibold">Nie da się policzyć</p>
            <p className="mt-1 text-sm">{result.reason}</p>
            <Link
              href="/app/wycena/dane"
              className="mt-4 inline-flex rounded-xl bg-amber-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-800"
            >
              Dodaj dane rynkowe
            </Link>
          </div>
        ) : (
          <Result result={result} />
        )}
      </div>
    </div>
  );
}

function Result({ result }: { result: Estimate }) {
  const conf = CONFIDENCE[result.confidence];

  return (
    <div className="grid gap-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">Szacowany przedział cenowy</p>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${conf.cls}`}>
            {conf.label}
          </span>
        </div>

        <p className="text-3xl font-semibold text-slate-900 md:text-4xl">
          {formatPln(result.low)} <span className="text-slate-400">do</span> {formatPln(result.high)}
        </p>

        {result.usedAddress && (
          <p className="mt-3 text-sm text-slate-500">
            Dla: <span className="text-slate-700">{result.usedAddress}</span>
            {result.usedRadiusM
              ? `, porównania w promieniu ${(result.usedRadiusM / 1000).toFixed(1).replace(".", ",")} km`
              : ", porównania z całego miasta"}
            {result.usedMonths ? `, z ostatnich ${result.usedMonths} miesięcy` : ""}
          </p>
        )}

        <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
          <Stat label="Środek przedziału" value={formatPln(result.mid)} />
          <Stat label="Cena za metr" value={`${result.pricePerM2.toLocaleString("pl-PL")} zł`} />
          <Stat
            label={result.method === "wskaznik" ? "Podstawa" : "Porównań użyto"}
            value={
              result.method === "wskaznik"
                ? "średnia miejska"
                : result.droppedCount > 0
                  ? `${result.usedCount} (odrzucono ${result.droppedCount})`
                  : String(result.usedCount)
            }
          />
        </div>

        {result.method === "wskaznik" && result.anchor && (
          <div className="mt-5 rounded-xl border border-sky-300 bg-sky-50 p-4 text-sm leading-relaxed text-sky-950">
            <p className="font-semibold">Liczone ze średniej rynkowej, nie z sąsiedztwa</p>
            <p className="mt-1">
              W okolicy tego adresu nie mamy transakcji, więc podstawą jest średnia cena
              transakcyjna dla miasta{" "}
              <strong>
                {result.anchor.city}: {Math.round(result.anchor.pricePerM2).toLocaleString("pl-PL")} zł/m²
              </strong>{" "}
              za okres {result.anchor.period} (źródło: {result.anchor.source.toUpperCase()}).
            </p>
            <p className="mt-2">
              Średnia miejska nie odróżnia dzielnic, a różnice sięgają kilkudziesięciu procent.
              To jest <strong>rząd wielkości, nie wycena konkretnego adresu</strong>. Żeby
              liczyć z sąsiedztwa, potrzebne są dane z{" "}
              <Link href="/app/wycena/dane" className="underline underline-offset-2">
                Rejestru Cen Nieruchomości
              </Link>
              .
            </p>
            {result.anchorAdjustments && result.anchorAdjustments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {result.anchorAdjustments.map((a) => (
                  <span
                    key={a.label}
                    className={`rounded-md px-2 py-0.5 text-[11px] ${
                      a.pct >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {a.label}: {a.pct >= 0 ? "+" : ""}
                    {(a.pct * 100).toFixed(1)}%
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
          To jest analiza porównawcza cen, a <strong>nie operat szacunkowy</strong>
          {" "}w rozumieniu ustawy o gospodarce nieruchomościami. Operaty sporządzają
          wyłącznie rzeczoznawcy majątkowi.
        </p>
      </div>

      {result.comparables.length > 0 && (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-6 py-4">
          <p className="font-semibold text-slate-900">
            {result.method === "wskaznik" ? "Transakcje w szerszej okolicy (kontekst)" : "Na czym opieramy wynik"}
          </p>
          <p className="text-sm text-slate-500">
            {result.method === "wskaznik"
              ? "Te transakcje NIE wyznaczyły wyniku, są za daleko. Pokazujemy je, żebyś widział, czym dysponujemy."
              : "Każde porównanie skorygowane o różnice względem wycenianej nieruchomości."}
          </p>
        </div>

        <ul>
          {result.comparables.map((c) => (
            <li key={c.comp.id} className="border-b border-slate-100 px-6 py-4 last:border-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-slate-900">{c.comp.label}</p>
                <p className="font-mono text-sm text-slate-900">
                  {Math.round(c.adjustedPricePerM2).toLocaleString("pl-PL")} zł/m²
                </p>
              </div>

              <p className="mt-0.5 text-xs text-slate-500">
                {Math.round(c.comp.areaM2)} m²
                {c.comp.rooms ? ` · ${c.comp.rooms} pok.` : ""}
                {` · ${Math.round(c.basePricePerM2).toLocaleString("pl-PL")} zł/m² wyjściowo`}
                {c.distanceM != null ? ` · ${c.distanceM} m stąd` : " · to samo miasto"}
                {` · ${c.monthsAgo === 0 ? "w tym miesiącu" : `${c.monthsAgo} mies. temu`}`}
                {` · ${SOURCE_LABEL[c.comp.source] ?? c.comp.source}`}
              </p>

              {c.adjustments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.adjustments.map((a) => (
                    <span
                      key={a.label}
                      className={`rounded-md px-2 py-0.5 text-[11px] ${
                        a.pct >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {a.label}: {a.pct >= 0 ? "+" : ""}
                      {(a.pct * 100).toFixed(1)}%
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
