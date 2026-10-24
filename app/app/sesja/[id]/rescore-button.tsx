"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Ocena rozmowy po jej zakończeniu. Rusza sama po wejściu na wyniki,
 * a przy błędzie pokazuje komunikat i przycisk zamiast strony błędu.
 */
export function RescoreButton({ sessionId, auto = true }: { sessionId: string; auto?: boolean }) {
  const router = useRouter();
  const [stan, setStan] = useState<"czeka" | "trwa" | "blad">(auto ? "trwa" : "czeka");
  const [blad, setBlad] = useState<string | null>(null);
  const ruszyla = useRef(false);

  const ocen = useCallback(async () => {
    setStan("trwa");
    setBlad(null);
    for (let proba = 0; proba < 40; proba++) {
      try {
        const r = await fetch("/api/coach/ocena", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }) });
        const d = (await r.json().catch(() => ({}))) as { ok?: boolean; trwa?: boolean; error?: string };
        if (d.ok) return router.refresh();
        // Ocena już leci z innej karty albo sprzed odświeżenia: czekamy na nią.
        if (d.trwa) {
          await new Promise((res) => setTimeout(res, 4000));
          continue;
        }
        throw new Error(d.error ?? "Nie udało się ocenić rozmowy.");
      } catch (e) {
        setBlad(e instanceof Error && e.message !== "Failed to fetch" ? e.message : "Brak połączenia. Sprawdź internet i spróbuj jeszcze raz.");
        setStan("blad");
        return;
      }
    }
    setBlad("Ocena trwa wyjątkowo długo. Odśwież stronę za chwilę.");
    setStan("blad");
  }, [router, sessionId]);

  useEffect(() => {
    if (!auto || ruszyla.current) return;
    ruszyla.current = true;
    void ocen();
  }, [auto, ocen]);

  if (stan === "trwa") {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
        <span>
          <b>AI ocenia Twoją rozmowę…</b> Przy dłuższej rozmowie to do minuty, nie zamykaj strony.
        </span>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {blad && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{blad}</p>}
      <button type="button" onClick={() => void ocen()} className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400">
        {blad ? "Spróbuj ocenić jeszcze raz" : "Oceń tę rozmowę"}
      </button>
    </div>
  );
}
