"use client";

import { useState, useTransition } from "react";
import type { InvoiceSeller } from "@/lib/agency-settings-shared";
import { saveSellers } from "../company-actions";

/**
 * Sprzedawcy na fakturach.
 *
 * Biuro często wystawia faktury z kilku podmiotów naraz: ze spółki i z
 * jednoosobowych działalności wspólników. Każdy ma własny NIP i rachunek,
 * więc lista musi być edytowalna, a nie zaszyta w kodzie.
 */
export function SellersForm({
  sellers,
  disabled,
}: {
  sellers: InvoiceSeller[];
  disabled?: boolean;
}) {
  const [lista, setLista] = useState<InvoiceSeller[]>(sellers);
  const [wynik, setWynik] = useState<{ ok: boolean; tekst: string } | null>(null);
  const [zapisuje, start] = useTransition();

  const zmien = (i: number, pola: Partial<InvoiceSeller>) =>
    setLista((l) => l.map((s, j) => (j === i ? { ...s, ...pola } : s)));

  const dodaj = () =>
    setLista((l) => [
      ...l,
      {
        key: `s${l.length + 1}`,
        name: "",
        address: "",
        city: "",
        postcode: "",
        nip: "",
        bank: "",
        account: "",
        brand: l.length === 0,
      },
    ]);

  const usun = (i: number) => setLista((l) => l.filter((_, j) => j !== i));

  const zapisz = () =>
    start(async () => {
      const r = await saveSellers(lista);
      setWynik(r.ok ? { ok: true, tekst: "Zapisano." } : { ok: false, tekst: r.error });
    });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-base font-semibold text-slate-900">Sprzedawcy na fakturach</h2>
      <p className="mt-1 text-sm text-slate-500">
        Podmioty, z których wystawiacie faktury. Numer konta trafia na dokument, więc wpisz go
        dokładnie. Pierwszy z listy jest podpowiadany przy nowej fakturze.
      </p>

      <div className="mt-5 space-y-5">
        {lista.map((s, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sprzedawca {i + 1}
              </span>
              <button
                type="button"
                onClick={() => usun(i)}
                disabled={disabled || zapisuje}
                className="text-xs font-medium text-red-600 transition hover:text-red-500 disabled:opacity-40"
              >
                Usuń
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Pole
                label="Nazwa"
                value={s.name}
                onChange={(v) => zmien(i, { name: v })}
                placeholder="Nazwa firmy albo imię i nazwisko"
                disabled={disabled}
                szerokie
              />
              <Pole
                label="Ulica i numer"
                value={s.address}
                onChange={(v) => zmien(i, { address: v })}
                placeholder="ul. Przykładowa 1/2"
                disabled={disabled}
              />
              <Pole
                label="Kod pocztowy"
                value={s.postcode}
                onChange={(v) => zmien(i, { postcode: v })}
                placeholder="00-001"
                disabled={disabled}
              />
              <Pole
                label="Miejscowość"
                value={s.city}
                onChange={(v) => zmien(i, { city: v })}
                placeholder="Miasto"
                disabled={disabled}
              />
              <Pole
                label="NIP"
                value={s.nip}
                onChange={(v) => zmien(i, { nip: v })}
                placeholder="1234567890"
                disabled={disabled}
              />
              <Pole
                label="Bank"
                value={s.bank}
                onChange={(v) => zmien(i, { bank: v })}
                placeholder="Nazwa banku"
                disabled={disabled}
              />
              <Pole
                label="Numer rachunku"
                value={s.account}
                onChange={(v) => zmien(i, { account: v })}
                placeholder="00 0000 0000 0000 0000 0000 0000"
                disabled={disabled}
                szerokie
              />
            </div>

            <label className="mt-3 flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={s.brand}
                onChange={(e) => zmien(i, { brand: e.target.checked })}
                disabled={disabled}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                Faktura z logo i nazwą biura
                <span className="block text-xs text-slate-500">
                  Zostaw puste dla jednoosobowych działalności wspólników, żeby dokument nie
                  sugerował, że sprzedawcą jest spółka.
                </span>
              </span>
            </label>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={dodaj}
          disabled={disabled || zapisuje || lista.length >= 10}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
        >
          Dodaj sprzedawcę
        </button>
        <button
          type="button"
          onClick={zapisz}
          disabled={disabled || zapisuje}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-40"
        >
          {zapisuje ? "Zapisuję..." : "Zapisz sprzedawców"}
        </button>
        {wynik && (
          <span className={`text-sm ${wynik.ok ? "text-emerald-600" : "text-red-600"}`}>
            {wynik.tekst}
          </span>
        )}
      </div>
    </div>
  );
}

function Pole({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  szerokie,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  szerokie?: boolean;
}) {
  return (
    <div className={szerokie ? "sm:col-span-2" : undefined}>
      <label className="mb-1 block text-sm text-slate-500">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 disabled:bg-slate-100"
      />
    </div>
  );
}
