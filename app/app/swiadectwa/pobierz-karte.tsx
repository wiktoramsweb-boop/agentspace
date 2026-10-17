"use client";

import { useState } from "react";
import { linkDoKarty } from "./actions";

export function PobierzKarte({ numer }: { numer: string }) {
  const [czeka, setCzeka] = useState(false);
  return (
    <button
      type="button"
      disabled={czeka}
      onClick={async () => {
        setCzeka(true);
        const url = await linkDoKarty(numer);
        setCzeka(false);
        if (url) window.location.href = url;
      }}
      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
    >
      {czeka ? "…" : "Karta PDF"}
    </button>
  );
}
