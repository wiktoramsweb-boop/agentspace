"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

/**
 * Jasne makiety produktu na stronę marketingową.
 *
 * Aplikacja od dawna ma jasny interfejs, a na stronie wisiały ciemne zrzuty
 * z pierwszej wersji. To wprowadzało w błąd i sprawiało, że produkt wyglądał
 * na surowe narzędzie dla informatyków, a nie na program dla biura.
 */

const ease = [0.22, 0.61, 0.36, 1] as const;

function Bar({ value, tone = "emerald" }: { value: number; tone?: "emerald" | "sky" | "amber" }) {
  const reduce = useReducedMotion();
  const color = tone === "emerald" ? "bg-emerald-500" : tone === "sky" ? "bg-sky-500" : "bg-amber-500";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={reduce ? false : { width: 0 }}
        whileInView={{ width: `${value}%` }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 1.1, ease }}
      />
    </div>
  );
}

/** Pulpit agenta: cele dnia, zadania i prowizja. */
export function ShotPulpit() {
  return (
    <div className="h-full w-full bg-slate-50 p-4 text-[11px] leading-snug text-slate-700 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-slate-400">Środa, 23 września</p>
          <p className="text-base font-semibold text-slate-900">Dzień dobry, Marta</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-[11px] font-bold text-white">
          M
        </span>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          ["Telefony", "7 / 10", 70, "emerald"],
          ["Spotkania", "3 / 4", 75, "sky"],
          ["Oferty", "12 / 15", 80, "amber"],
        ].map(([label, value, pct, tone]) => (
          <div key={label as string} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-slate-400">{label as string}</p>
            <p className="mb-2 text-sm font-semibold text-slate-900">{value as string}</p>
            <Bar value={pct as number} tone={tone as "emerald"} />
          </div>
        ))}
      </div>

      <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-emerald-700">Prowizja w tym miesiącu</p>
        <p className="text-lg font-semibold text-slate-900">14 200 zł</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        {[
          ["Oddzwoń do pana Kowalskiego", "10:30", true],
          ["Prezentacja, ul. Wielicka 134", "15:00", true],
          ["Follow-up: rodzina Nowak", "17:00", false],
          ["Trening AI Coach: obiekcje", "wieczorem", false],
        ].map(([task, time, done], i) => (
          <div key={task as string} className={`flex items-center gap-2.5 p-2.5 ${i > 0 ? "border-t border-slate-100" : ""}`}>
            <span
              className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-md text-[9px] ${
                done ? "bg-emerald-500 text-white" : "border border-slate-300"
              }`}
            >
              {done ? "✓" : ""}
            </span>
            <span className={`flex-1 ${done ? "text-slate-400 line-through" : "text-slate-700"}`}>{task as string}</span>
            <span className="text-slate-400">{time as string}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Lista ofert ze zdjęciami: to najczęściej otwierany ekran w biurze. */
export function ShotOferty() {
  const rows: [string, string, string, string][] = [
    ["/wzory/salon-widok.jpg", "Apartament z widokiem na Wawel", "Zabłocie · 84 m² · 3 pok.", "1 690 000 zł"],
    ["/wzory/dom-las.jpg", "Dom przy lesie, gotowy do wejścia", "Zielonki · 214 m² · 6 pok.", "2 150 000 zł"],
    ["/wzory/loft.jpg", "Loft w dawnej fabryce", "Podgórze · 96 m² · 2 pok.", "1 240 000 zł"],
  ];

  return (
    <div className="h-full w-full bg-slate-50 p-4 text-[11px] text-slate-700 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-medium text-white">Wszystkie</span>
        <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px]">Sprzedaż</span>
        <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px]">Wynajem</span>
        <span className="ml-auto rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px]">Filtry</span>
      </div>

      <div className="grid gap-2">
        {rows.map(([src, title, meta, price], i) => (
          <motion.div
            key={title}
            className="flex items-center gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-2"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: i * 0.08, ease }}
          >
            <span className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg">
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-slate-900">{title}</span>
              <span className="block text-slate-500">{meta}</span>
            </span>
            <span className="whitespace-nowrap font-semibold text-slate-900">{price}</span>
          </motion.div>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
        <p className="mb-2 text-slate-400">Publikacja</p>
        <div className="flex flex-wrap gap-1.5">
          {["Strona biura", "Otodom", "OLX", "Nieruchomosci-online"].map((p) => (
            <span key={p} className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Panel właściciela: zespół w liczbach. */
export function ShotPanel() {
  const team: [string, string, number, string][] = [
    ["Marta L.", "187 transakcji", 92, "34 200 zł"],
    ["Paweł Z.", "143 transakcje", 74, "21 800 zł"],
    ["Karolina M.", "264 najmy", 61, "12 400 zł"],
    ["Tomasz B.", "96 transakcji", 48, "9 100 zł"],
  ];

  return (
    <div className="h-full w-full bg-slate-50 p-4 text-[11px] text-slate-700 sm:p-5">
      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          ["Prowizje, miesiąc", "77 500 zł"],
          ["Telefony, tydzień", "312"],
          ["Oferty aktywne", "48"],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-slate-400">{l}</p>
            <p className="text-sm font-semibold text-slate-900">{v}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="mb-3 text-slate-400">Zespół w tym miesiącu</p>
        <div className="grid gap-3">
          {team.map(([name, sub, pct, money], i) => (
            <div key={name} className="grid grid-cols-[1fr_auto] items-center gap-2">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[9px] font-bold text-white">
                    {name.charAt(0)}
                  </span>
                  <span className="truncate font-medium text-slate-900">{name}</span>
                  <span className="truncate text-slate-400">{sub}</span>
                </div>
                <Bar value={pct} tone={i === 0 ? "emerald" : i === 1 ? "sky" : "amber"} />
              </div>
              <span className="font-semibold text-slate-900">{money}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <p className="font-medium text-amber-800">Wymaga uwagi</p>
        <p className="text-amber-700">Tomasz nie dzwonił od czterech dni, a ma sześć zaległych kontaktów.</p>
      </div>
    </div>
  );
}
