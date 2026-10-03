"use client";

import { useState, useTransition } from "react";
import { potwierdzZamowienie } from "./actions";

/**
 * Przycisk „wpłata zaksięgowana”.
 *
 * Pyta o potwierdzenie, bo to operacja nieodwracalna z poziomu panelu:
 * przedłuża biuru dostęp i oznacza zamówienie jako opłacone.
 */
export function PotwierdzWplate({ orderId, opis }: { orderId: string; opis: string }) {
  const [pending, start] = useTransition();
  const [blad, setBlad] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Potwierdzić wpłatę?\n\n${opis}\n\nBiuro dostanie dostęp od razu.`)) return;
          setBlad(null);
          start(async () => {
            const wynik = await potwierdzZamowienie(orderId);
            if (!wynik.ok) setBlad(wynik.blad ?? "Nie udało się.");
          });
        }}
        className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Zapisuję..." : "Wpłata zaksięgowana"}
      </button>
      {blad && <span className="text-xs text-red-400">{blad}</span>}
    </div>
  );
}
