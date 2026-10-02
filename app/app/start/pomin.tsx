"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { pomijPrzewodnik } from "./actions";

/** Wyjście z przewodnika dla kogoś, kto woli klikać sam. */
export function Pomin() {
  const [pracuje, start] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pracuje}
      onClick={() =>
        start(async () => {
          await pomijPrzewodnik();
          router.push("/app");
        })
      }
      className="text-sm text-slate-500 underline-offset-2 transition hover:text-slate-700 hover:underline disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-200"
    >
      {pracuje ? "Chwila..." : "Poradzę sobie sam, nie pokazuj tego więcej"}
    </button>
  );
}
