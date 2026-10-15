"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { pole } from "../dokumenty-wzory/klocki";

export type PozycjaKatalogu = { href: string; nazwa: string; opis: string };

const OPIS_KATEGORII: Record<string, string> = {
  "Pośrednictwo": "Umowy z klientami biura i dokumenty, które chronią prowizję.",
  "Sprzedaż i transakcja": "Od przyjęcia oferty do aktu notarialnego.",
  "Najem": "Najem zwykły i okazjonalny razem z pismami do urzędu i najemcy.",
};

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");
}

export function Katalog({ grupy }: { grupy: { kategoria: string; pozycje: PozycjaKatalogu[] }[] }) {
  const [q, setQ] = useState("");
  const wynik = useMemo(() => {
    const n = norm(q.trim());
    if (!n) return grupy;
    return grupy
      .map((g) => ({ ...g, pozycje: g.pozycje.filter((p) => norm(`${p.nazwa} ${p.opis}`).includes(n)) }))
      .filter((g) => g.pozycje.length > 0);
  }, [q, grupy]);

  return (
    <div className="space-y-8">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Szukaj: najem okazjonalny, pełnomocnictwo, kaucja…"
        aria-label="Szukaj dokumentu"
        className={`${pole} max-w-md`}
      />

      {wynik.length === 0 && <p className="text-sm text-slate-500">Nie mamy takiego wzoru. Napisz, jakiego dokumentu potrzebujesz, dopiszemy go.</p>}

      {wynik.map((g) => (
        <section key={g.kategoria}>
          <h2 className="font-semibold text-slate-900">{g.kategoria}</h2>
          {OPIS_KATEGORII[g.kategoria] && <p className="mt-0.5 text-sm text-slate-500">{OPIS_KATEGORII[g.kategoria]}</p>}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {g.pozycje.map((p) => (
              <Link
                key={p.href + p.nazwa}
                href={p.href}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm"
              >
                <span className="font-medium text-slate-900 group-hover:text-emerald-700">{p.nazwa}</span>
                <span className="mt-1 text-sm leading-snug text-slate-500">{p.opis}</span>
                <span className="mt-3 text-sm font-medium text-emerald-600">Wypełnij →</span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <p className="max-w-2xl text-xs leading-relaxed text-slate-400">
        Wzory są przygotowane zgodnie z przepisami obowiązującymi w październiku 2026 r. (ustawa o gospodarce
        nieruchomościami, ustawa o ochronie praw lokatorów, ustawa o prawach konsumenta). Przy nietypowej
        transakcji warto dać umowę do przejrzenia prawnikowi.
      </p>
    </div>
  );
}
