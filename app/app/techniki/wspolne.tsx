import Link from "next/link";
import type { Kategoria, Wypowiedz } from "@/lib/techniki/techniki";

export const KOLOR: Record<Kategoria, { tlo: string; tekst: string; kropka: string }> = {
  cold: { tlo: "bg-cyan-50", tekst: "text-cyan-700", kropka: "bg-cyan-500" },
  pytania: { tlo: "bg-sky-50", tekst: "text-sky-700", kropka: "bg-sky-500" },
  obiekcje: { tlo: "bg-amber-50", tekst: "text-amber-700", kropka: "bg-amber-500" },
  negocjacje: { tlo: "bg-violet-50", tekst: "text-violet-700", kropka: "bg-violet-500" },
  perswazja: { tlo: "bg-rose-50", tekst: "text-rose-700", kropka: "bg-rose-500" },
  zamykanie: { tlo: "bg-emerald-50", tekst: "text-emerald-700", kropka: "bg-emerald-500" },
  retoryka: { tlo: "bg-teal-50", tekst: "text-teal-700", kropka: "bg-teal-500" },
};

export const POZIOM = { 1: "Podstawowa", 2: "Średnio zaawansowana", 3: "Zaawansowana" } as const;

/** Wymiana zdań w stylu czatu: agent po prawej, klient po lewej. */
export function Rozmowa({ wypowiedzi }: { wypowiedzi: Wypowiedz[] }) {
  return (
    <div className="space-y-2">
      {wypowiedzi.map((w, i) => (
        <div key={i} className={`flex ${w.kto === "agent" ? "justify-end" : "justify-start"}`}>
          <p
            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              w.kto === "agent" ? "rounded-br-md bg-slate-900 text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
            }`}
          >
            <span className={`mb-0.5 block text-[10px] font-semibold uppercase tracking-wider ${w.kto === "agent" ? "text-emerald-300" : "text-slate-400"}`}>
              {w.kto === "agent" ? "Ty" : "Klient"}
            </span>
            {w.tekst}
          </p>
        </div>
      ))}
    </div>
  );
}

export function Sila({ wartosc }: { wartosc: number }) {
  return (
    <span className="flex items-center gap-2" title={`Skuteczność: ${wartosc}/100`}>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
        <span className="block h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500" style={{ width: `${wartosc}%` }} />
      </span>
      <span className="text-xs tabular-nums text-slate-500">{wartosc}</span>
    </span>
  );
}

export function Zakladki({ aktywna, nazwaAkademii = "Akademia dla nowych" }: { aktywna: "techniki" | "skrypty" | "obiekcje" | "struktura" | "akademia"; nazwaAkademii?: string }) {
  const z = [
    { id: "akademia", href: "/app/techniki?widok=akademia", nazwa: nazwaAkademii },
    { id: "techniki", href: "/app/techniki", nazwa: "Techniki" },
    { id: "skrypty", href: "/app/techniki?widok=skrypty", nazwa: "Skrypty rozmów" },
    { id: "obiekcje", href: "/app/techniki?widok=obiekcje", nazwa: "Bank obiekcji" },
    { id: "struktura", href: "/app/techniki?widok=struktura", nazwa: "Struktura rozmowy" },
  ] as const;
  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
      {z.map((x) => (
        <Link
          key={x.id}
          href={x.href}
          replace
          scroll={false}
          className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2 text-center text-sm font-semibold transition ${
            x.id === aktywna ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          {x.nazwa}
        </Link>
      ))}
    </nav>
  );
}
