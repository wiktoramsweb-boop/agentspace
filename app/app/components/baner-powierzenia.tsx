"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { zaakceptujPowierzenie } from "../powierzenie-actions";

/**
 * Prośba o przyjęcie umowy powierzenia.
 *
 * Widzi ją tylko właściciel biura, bo tylko on może zaciągać zobowiązania.
 * Pasek nie blokuje pracy: brak podpisu to problem prawny do rozwiązania
 * w tym tygodniu, a nie powód, żeby odciąć biuru dostęp do jego własnych
 * danych w środku dnia.
 */
export function BanerPowierzenia({ nieaktualna }: { nieaktualna: boolean }) {
  const [ukryty, setUkryty] = useState(false);
  const [pending, start] = useTransition();

  if (ukryty) return null;

  return (
    <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5">
      <p className="font-semibold text-amber-900">
        {nieaktualna
          ? "Zmieniliśmy umowę powierzenia przetwarzania danych"
          : "Do podpisania: umowa powierzenia przetwarzania danych"}
      </p>
      <p className="mt-1 max-w-3xl text-sm text-amber-800">
        Trzymacie w AgentSpace dane osobowe swoich klientów. To Wy jesteście ich administratorem,
        a my przetwarzamy je na Wasze polecenie. RODO wymaga, żeby odbywało się to na podstawie
        umowy, a Wy potrzebujecie jej, gdyby ktoś zapytał, komu powierzacie dane.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => { await zaakceptujPowierzenie(); setUkryty(true); })}
          className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50"
        >
          {pending ? "Zapisuję..." : "Akceptuję umowę powierzenia"}
        </button>
        <Link
          href="/umowa-powierzenia"
          target="_blank"
          className="text-sm font-medium text-amber-900 underline underline-offset-2"
        >
          Przeczytaj treść
        </Link>
        <button
          type="button"
          onClick={() => setUkryty(true)}
          className="text-sm text-amber-700 transition hover:text-amber-900"
        >
          Później
        </button>
      </div>
    </div>
  );
}
