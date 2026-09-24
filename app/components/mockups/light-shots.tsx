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

/** Cele: lejek roczny rozbity na dzień i dzienny tracker. */
export function ShotCele() {
  const funnel: [string, number, number, string][] = [
    ["Telefony", 34, 40, "emerald"],
    ["Rozmowy", 12, 14, "sky"],
    ["Spotkania", 5, 6, "amber"],
    ["Umowy", 2, 3, "emerald"],
  ];

  return (
    <div className="h-full w-full bg-slate-50 p-4 text-[11px] text-slate-700 sm:p-5">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-slate-400">Cel roczny</p>
          <p className="text-base font-semibold text-slate-900">420 000 zł prowizji</p>
        </div>
        <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700">62% planu</span>
      </div>

      <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
          initial={{ width: 0 }}
          whileInView={{ width: "62%" }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease }}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="mb-3 text-slate-400">Dziś do zrobienia</p>
        <div className="grid gap-3">
          {funnel.map(([label, done, target, tone], i) => (
            <div key={label}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-slate-600">{label}</span>
                <span className="font-semibold text-slate-900">
                  {done} / {target}
                </span>
              </div>
              <Bar value={(done / target) * 100} tone={(i === 1 ? "sky" : i === 2 ? "amber" : "emerald") as "emerald"} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
        <p className="font-medium text-emerald-800">Passa: 9 dni z rzędu</p>
        <p className="text-emerald-700">Zrób jeszcze 6 telefonów, żeby nie przerwać serii.</p>
      </div>
    </div>
  );
}

/** Kalendarz z rytmem dzwonienia. */
export function ShotKalendarz() {
  const hours = ["8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18"];
  const load = [10, 35, 80, 65, 30, 20, 45, 70, 90, 55, 25];
  const events: [string, string, string][] = [
    ["9:30", "Telefon: pan Kowalski", "emerald"],
    ["11:00", "Prezentacja, ul. Wielicka", "sky"],
    ["15:30", "Podpisanie umowy, notariusz", "amber"],
  ];

  return (
    <div className="h-full w-full bg-slate-50 p-4 text-[11px] text-slate-700 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-base font-semibold text-slate-900">Środa, 23 września</p>
        <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px]">Tydzień</span>
      </div>

      <div className="mb-3 grid gap-2">
        {events.map(([time, title, tone]) => (
          <div key={title} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5">
            <span className="font-mono text-slate-400">{time}</span>
            <span
              className={`h-8 w-1 rounded-full ${
                tone === "emerald" ? "bg-emerald-500" : tone === "sky" ? "bg-sky-500" : "bg-amber-500"
              }`}
            />
            <span className="flex-1 truncate font-medium text-slate-800">{title}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="mb-2 text-slate-400">O której najczęściej dzwonisz</p>
        <div className="flex h-16 items-end gap-1">
          {hours.map((h, i) => (
            <motion.div
              key={h}
              className="flex-1 rounded-t bg-emerald-400/80"
              initial={{ height: 0 }}
              whileInView={{ height: `${load[i]}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.04, ease }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[9px] text-slate-400">
          <span>8:00</span>
          <span>13:00</span>
          <span>18:00</span>
        </div>
      </div>
    </div>
  );
}

/** Prowizje i etapy transakcji. */
export function ShotProwizje() {
  const stages = ["Umowa", "Zadatek", "Kredyt", "Akt", "Rozliczenie"];
  const active = 3;

  return (
    <div className="h-full w-full bg-slate-50 p-4 text-[11px] text-slate-700 sm:p-5">
      <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-semibold text-slate-900">ul. Nadwiślańska 12/34</p>
          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">w toku</span>
        </div>
        <div className="flex items-center gap-1">
          {stages.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col items-center gap-1">
              <motion.span
                className={`h-1.5 w-full rounded-full ${i <= active ? "bg-emerald-500" : "bg-slate-200"}`}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1, ease }}
                style={{ originX: 0 }}
              />
              <span className={`text-[9px] ${i <= active ? "text-slate-700" : "text-slate-400"}`}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          ["Cena", "1 690 000 zł"],
          ["Prowizja", "41 400 zł"],
          ["Twój udział", "20 700 zł"],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-slate-400">{l}</p>
            <p className="text-sm font-semibold text-slate-900">{v}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="mb-2 text-slate-400">Dokumenty transakcji</p>
        {["Umowa pośrednictwa.pdf", "Zaświadczenie ze wspólnoty.pdf", "Świadectwo energetyczne.pdf"].map((d, i) => (
          <div key={d} className={`flex items-center gap-2 py-1.5 ${i > 0 ? "border-t border-slate-100" : ""}`}>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">PDF</span>
            <span className="flex-1 truncate">{d}</span>
            <span className="text-emerald-600">✓</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Karta klienta z historią kontaktu. */
export function ShotKlient() {
  return (
    <div className="h-full w-full bg-slate-50 p-4 text-[11px] text-slate-700 sm:p-5">
      <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 text-sm font-bold text-white">
          M
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">Małgorzata Zielińska</p>
          <p className="text-slate-500">Kupująca · budżet do 900 000 zł · Podgórze</p>
        </div>
        <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">ogląda</span>
      </div>

      <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
        <p className="mb-2 text-slate-400">Historia kontaktu</p>
        {[
          ["dziś, 10:12", "Telefon, 4 min 12 s", "Prosi o drugie oglądanie w sobotę"],
          ["12 września", "Prezentacja, ul. Kalwaryjska", "Za mała kuchnia, reszta na tak"],
          ["4 września", "Telefon, 2 min 40 s", "Pierwszy kontakt z ogłoszenia"],
        ].map(([when, what, note], i) => (
          <div key={when} className={`flex gap-3 py-2 ${i > 0 ? "border-t border-slate-100" : ""}`}>
            <span className="w-20 flex-shrink-0 text-slate-400">{when}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-slate-800">{what}</span>
              <span className="block text-slate-500">{note}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
        <p className="font-medium text-emerald-800">Dopasowania z bazy: 3 oferty</p>
        <p className="text-emerald-700">System sam sprawdził poszukiwanie i znalazł nowe mieszkanie na Kalwaryjskiej.</p>
      </div>
    </div>
  );
}

/** Dokumenty przy ofercie i kliencie. */
export function ShotDokumenty() {
  const docs: [string, string, string][] = [
    ["Umowa pośrednictwa", "PDF · 240 kB", "podpisana"],
    ["Odpis z księgi wieczystej", "PDF · 1,1 MB", "aktualny"],
    ["Świadectwo energetyczne", "PDF · 380 kB", "ważne do 2035"],
    ["Zaświadczenie o zameldowaniu", "PDF · 120 kB", "do odebrania"],
    ["Zdjęcia po obróbce", "ZIP · 24 MB", "gotowe"],
  ];

  return (
    <div className="h-full w-full bg-slate-50 p-4 text-[11px] text-slate-700 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-base font-semibold text-slate-900">Dokumenty oferty</p>
        <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-medium text-white">+ Dodaj</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        {docs.map(([name, meta, status], i) => (
          <motion.div
            key={name}
            className={`flex items-center gap-3 p-2.5 ${i > 0 ? "border-t border-slate-100" : ""}`}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06, ease }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-[9px] font-bold text-rose-600">
              {name.includes("Zdjęcia") ? "ZIP" : "PDF"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-slate-800">{name}</span>
              <span className="block text-slate-400">{meta}</span>
            </span>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">{status}</span>
          </motion.div>
        ))}
      </div>

      <p className="mt-3 text-slate-500">
        Pliki leżą przy ofercie i przy kliencie naraz, a link do pobrania wygasa, więc nie krąży po WhatsAppie.
      </p>
    </div>
  );
}
