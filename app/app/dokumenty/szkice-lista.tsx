"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { usunSzkic } from "./szkice-actions";

export type SzkicNaLiscie = { id: string; href: string; tytul: string; wzor: string; zmieniony: string };

const kiedy = (iso: string) => {
  const d = new Date(iso);
  const dzis = new Date();
  const ten = d.toDateString() === dzis.toDateString();
  return ten
    ? `dziś, ${new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(d)}`
    : new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
};

/** Niedokończone dokumenty osoby: klik otwiera formularz w miejscu, w którym go zostawiła. */
export function SzkiceLista({ szkice }: { szkice: SzkicNaLiscie[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [ukryte, setUkryte] = useState<string[]>([]);
  const widoczne = szkice.filter((s) => !ukryte.includes(s.id));
  if (!widoczne.length) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-1 text-lg font-semibold text-slate-900">Twoje szkice</h2>
      <p className="mb-3 text-sm text-slate-500">Dokumenty, do których chcesz wrócić. Zmiany w otwartym szkicu zapisują się same.</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {widoczne.map((s) => (
          <div key={s.id} className="group relative rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-400">
            <Link href={s.href} className="block min-w-0 pr-8">
              <p className="truncate font-semibold text-slate-900">{s.tytul}</p>
              <p className="mt-0.5 truncate text-sm text-slate-500">{s.wzor}</p>
              <p className="mt-2 text-xs text-slate-400">zmieniony {kiedy(s.zmieniony)}</p>
            </Link>
            <button
              type="button"
              disabled={pending}
              aria-label={`Usuń szkic: ${s.tytul}`}
              onClick={() => {
                if (!confirm(`Usunąć szkic „${s.tytul}”?`)) return;
                setUkryte((x) => [...x, s.id]);
                start(async () => {
                  const r = await usunSzkic(s.id);
                  if (!r.ok) setUkryte((x) => x.filter((y) => y !== s.id));
                  router.refresh();
                });
              }}
              className="absolute right-3 top-3 rounded-lg px-2 py-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
