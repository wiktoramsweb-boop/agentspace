"use client";

import { useState } from "react";

/** Gotowa wiadomość do portalu z przyciskiem „Kopiuj” i linkiem do maila. */
export function WiadomoscDoPortalu({ tekst, email, temat }: { tekst: string; email?: string; temat: string }) {
  const [skopiowano, setSkopiowano] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Wiadomość do portalu</p>
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">{tekst}</pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(tekst).then(() => {
              setSkopiowano(true);
              setTimeout(() => setSkopiowano(false), 2000);
            });
          }}
          className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
        >
          {skopiowano ? "Skopiowano ✓" : "Kopiuj wiadomość"}
        </button>
        {email && (
          <a href={`mailto:${email}?subject=${encodeURIComponent(temat)}&body=${encodeURIComponent(tekst)}`} className="rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            Otwórz w poczcie →
          </a>
        )}
      </div>
    </div>
  );
}
