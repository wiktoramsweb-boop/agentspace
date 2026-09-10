"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatMoney, getSeller } from "@/lib/invoice";
import { formatDateShort } from "@/lib/format";

type InvoiceRow = {
  id: string;
  number: string;
  buyer_name: string | null;
  seller_key: string;
  issue_date: string | null;
  total_pln: number | null;
};

/** Rok wystawienia; faktury bez daty trafiają do „bez daty". */
function yearOf(iso: string | null): string {
  return iso ? iso.slice(0, 4) : "bez daty";
}

export function InvoicesBrowser({ invoices }: { invoices: InvoiceRow[] }) {
  const [q, setQ] = useState("");
  const [year, setYear] = useState("all");

  const years = useMemo(() => {
    const set = new Set(invoices.map((i) => yearOf(i.issue_date)));
    return [...set].sort().reverse();
  }, [invoices]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (year !== "all" && yearOf(inv.issue_date) !== year) return false;
      if (!needle) return true;
      return (
        inv.number.toLowerCase().includes(needle) ||
        (inv.buyer_name ?? "").toLowerCase().includes(needle)
      );
    });
  }, [invoices, q, year]);

  const sum = shown.reduce((acc, i) => acc + (i.total_pln ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Szukaj po numerze faktury albo nabywcy..."
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
        />
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
        >
          <option value="all">Wszystkie lata</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Suma z aktualnego filtra: najczęstsze pytanie księgowej. */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <span className="text-sm text-slate-500">
          {shown.length === invoices.length
            ? `Wszystkie faktury (${shown.length})`
            : `Wybrane faktury (${shown.length} z ${invoices.length})`}
        </span>
        <span className="text-lg font-semibold text-slate-900">{formatMoney(sum)} zł</span>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Żadna faktura nie pasuje do wyszukiwania.
        </p>
      ) : (
        <div className="space-y-2.5">
          {shown.map((inv) => {
            const seller = getSeller(inv.seller_key);
            return (
              <Link
                key={inv.id}
                href={`/app/faktury/${inv.id}`}
                className="hover-lift flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-100"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">Faktura {inv.number}</p>
                  <p className="truncate text-sm text-slate-500">
                    {inv.buyer_name || "-"} · {seller.name.split(" ").slice(0, 2).join(" ")}…
                    {inv.issue_date && ` · ${formatDateShort(inv.issue_date)}`}
                  </p>
                </div>
                <span className="flex-shrink-0 font-semibold text-slate-900">
                  {formatMoney(inv.total_pln ?? 0)} zł
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
