"use client";

import { useEffect, useState } from "react";

/**
 * Przycisk ponowienia. Nasłuchujemy też zdarzenia `online`, żeby po powrocie
 * zasięgu agent nie musiał nic klikać, tylko wrócił tam, gdzie był.
 */
export function RetryButton() {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const back = () => window.location.reload();
    window.addEventListener("online", back);
    return () => window.removeEventListener("online", back);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        setBusy(true);
        window.location.reload();
      }}
      className="w-full rounded-xl bg-emerald-500 px-6 py-3.5 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
      disabled={busy}
    >
      {busy ? "Sprawdzam…" : "Spróbuj ponownie"}
    </button>
  );
}
