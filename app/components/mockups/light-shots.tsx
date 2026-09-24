"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { shotText } from "@/lib/i18n/shots";

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
export function ShotPulpit({ lang = "pl" }: { lang?: string }) {
  const s = shotText(lang);
  return (
    <div className="h-full w-full bg-slate-50 p-4 text-[11px] leading-snug text-slate-700 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-slate-400">{s("Środa, 23 września")}</p>
          <p className="text-base font-semibold text-slate-900">{s("Dzień dobry, Marta")}</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-[11px] font-bold text-white">
          M
        </span>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          [s("Telefony"), "7 / 10", 70, "emerald"],
          [s("Spotkania"), "3 / 4", 75, "sky"],
          [s("Oferty"), "12 / 15", 80, "amber"],
        ].map(([label, value, pct, tone]) => (
          <div key={label as string} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-slate-400">{label as string}</p>
            <p className="mb-2 text-sm font-semibold text-slate-900">{value as string}</p>
            <Bar value={pct as number} tone={tone as "emerald"} />
          </div>
        ))}
      </div>

      <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-emerald-700">{s("Prowizja w tym miesiącu")}</p>
        <p className="text-lg font-semibold text-slate-900">{s("14 200 zł")}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        {[
          [s("Oddzwoń do pana Kowalskiego"), "10:30", true],
          [s("Prezentacja, ul. Wielicka 134"), "15:00", true],
          [s("Follow-up: rodzina Nowak"), "17:00", false],
          [s("Trening AI Coach: obiekcje"), s("wieczorem"), false],
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
export function ShotOferty({ lang = "pl" }: { lang?: string }) {
  const s = shotText(lang);
  const rows: [string, string, string, string][] = [
    ["/wzory/salon-widok.jpg", s("Apartament z widokiem na Wawel"), s("Zabłocie · 84 m² · 3 pok."), s("1 690 000 zł")],
    ["/wzory/dom-las.jpg", s("Dom przy lesie, gotowy do wejścia"), s("Zielonki · 214 m² · 6 pok."), s("2 150 000 zł")],
    ["/wzory/loft.jpg", s("Loft w dawnej fabryce"), s("Podgórze · 96 m² · 2 pok."), s("1 240 000 zł")],
  ];

  return (
    <div className="h-full w-full bg-slate-50 p-4 text-[11px] text-slate-700 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-medium text-white">{s("Wszystkie")}</span>
        <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px]">{s("Sprzedaż")}</span>
        <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px]">{s("Wynajem")}</span>
        <span className="ml-auto rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px]">{s("Filtry")}</span>
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
        <p className="mb-2 text-slate-400">{s("Publikacja")}</p>
        <div className="flex flex-wrap gap-1.5">
          {[s("Strona biura"), "Otodom", "OLX", s("Nieruchomosci-online")].map((p) => (
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
export function ShotPanel({ lang = "pl" }: { lang?: string }) {
  const s = shotText(lang);
  const team: [string, string, number, string][] = [
    ["Marta L.", s("187 transakcji"), 92, s("34 200 zł")],
    ["Paweł Z.", s("143 transakcje"), 74, s("21 800 zł")],
    ["Karolina M.", s("264 najmy"), 61, s("12 400 zł")],
    ["Tomasz B.", s("96 transakcji"), 48, s("9 100 zł")],
  ];

  return (
    <div className="h-full w-full bg-slate-50 p-4 text-[11px] text-slate-700 sm:p-5">
      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          [s("Prowizje, miesiąc"), s("77 500 zł")],
          [s("Telefony, tydzień"), "312"],
          [s("Oferty aktywne"), "48"],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-slate-400">{l}</p>
            <p className="text-sm font-semibold text-slate-900">{v}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="mb-3 text-slate-400">{s("Zespół w tym miesiącu")}</p>
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
        <p className="font-medium text-amber-800">{s("Wymaga uwagi")}</p>
        <p className="text-amber-700">{s("Tomasz nie dzwonił od czterech dni, a ma sześć zaległych kontaktów.")}</p>
      </div>
    </div>
  );
}

/** Cele: lejek roczny rozbity na dzień i dzienny tracker. */
export function ShotCele({ lang = "pl" }: { lang?: string }) {
  const s = shotText(lang);
  const funnel: [string, number, number, string][] = [
    [s("Telefony"), 34, 40, "emerald"],
    [s("Rozmowy"), 12, 14, "sky"],
    [s("Spotkania"), 5, 6, "amber"],
    [s("Umowy"), 2, 3, "emerald"],
  ];

  return (
    <div className="h-full w-full bg-slate-50 p-4 text-[11px] text-slate-700 sm:p-5">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-slate-400">{s("Cel roczny")}</p>
          <p className="text-base font-semibold text-slate-900">{s("420 000 zł prowizji")}</p>
        </div>
        <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700">{s("62% planu")}</span>
      </div>

      <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
          initial={{ width: 0 }}
          whileInView={{ width: s("62%") }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease }}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="mb-3 text-slate-400">{s("Dziś do zrobienia")}</p>
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
        <p className="font-medium text-emerald-800">{s("Passa: 9 dni z rzędu")}</p>
        <p className="text-emerald-700">{s("Zrób jeszcze 6 telefonów, żeby nie przerwać serii.")}</p>
      </div>
    </div>
  );
}

/** Kalendarz z rytmem dzwonienia. */
export function ShotKalendarz({ lang = "pl" }: { lang?: string }) {
  const s = shotText(lang);
  const hours = ["8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18"];
  const load = [10, 35, 80, 65, 30, 20, 45, 70, 90, 55, 25];
  const events: [string, string, string][] = [
    ["9:30", s("Telefon: pan Kowalski"), "emerald"],
    ["11:00", s("Prezentacja, ul. Wielicka"), "sky"],
    ["15:30", s("Podpisanie umowy, notariusz"), "amber"],
  ];

  return (
    <div className="h-full w-full bg-slate-50 p-4 text-[11px] text-slate-700 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-base font-semibold text-slate-900">{s("Środa, 23 września")}</p>
        <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px]">{s("Tydzień")}</span>
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
        <p className="mb-2 text-slate-400">{s("O której najczęściej dzwonisz")}</p>
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
export function ShotProwizje({ lang = "pl" }: { lang?: string }) {
  const s = shotText(lang);
  const stages = [s("Umowa"), s("Zadatek"), s("Kredyt"), s("Akt"), s("Rozliczenie")];
  const active = 3;

  return (
    <div className="h-full w-full bg-slate-50 p-4 text-[11px] text-slate-700 sm:p-5">
      <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-semibold text-slate-900">{s("ul. Nadwiślańska 12/34")}</p>
          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">{s("w toku")}</span>
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
          [s("Cena"), s("1 690 000 zł")],
          [s("Prowizja"), s("41 400 zł")],
          [s("Twój udział"), s("20 700 zł")],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-slate-400">{l}</p>
            <p className="text-sm font-semibold text-slate-900">{v}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="mb-2 text-slate-400">{s("Dokumenty transakcji")}</p>
        {[s("Umowa pośrednictwa.pdf"), s("Zaświadczenie ze wspólnoty.pdf"), s("Świadectwo energetyczne.pdf")].map((d, i) => (
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
export function ShotKlient({ lang = "pl" }: { lang?: string }) {
  const s = shotText(lang);
  return (
    <div className="h-full w-full bg-slate-50 p-4 text-[11px] text-slate-700 sm:p-5">
      <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 text-sm font-bold text-white">
          M
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">{s("Małgorzata Zielińska")}</p>
          <p className="text-slate-500">{s("Kupująca · budżet do 900 000 zł · Podgórze")}</p>
        </div>
        <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">{s("ogląda")}</span>
      </div>

      <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
        <p className="mb-2 text-slate-400">{s("Historia kontaktu")}</p>
        {[
          [s("dziś, 10:12"), s("Telefon, 4 min 12 s"), s("Prosi o drugie oglądanie w sobotę")],
          [s("12 września"), s("Prezentacja, ul. Kalwaryjska"), s("Za mała kuchnia, reszta na tak")],
          [s("4 września"), s("Telefon, 2 min 40 s"), s("Pierwszy kontakt z ogłoszenia")],
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
        <p className="font-medium text-emerald-800">{s("Dopasowania z bazy: 3 oferty")}</p>
        <p className="text-emerald-700">
          {s("System sam sprawdził poszukiwanie i znalazł nowe mieszkanie na Kalwaryjskiej.")}
        </p>
      </div>
    </div>
  );
}

/** Dokumenty przy ofercie i kliencie. */
export function ShotDokumenty({ lang = "pl" }: { lang?: string }) {
  const s = shotText(lang);
  const docs: [string, string, string][] = [
    [s("Umowa pośrednictwa"), s("PDF · 240 kB"), s("podpisana")],
    [s("Odpis z księgi wieczystej"), s("PDF · 1,1 MB"), s("aktualny")],
    [s("Świadectwo energetyczne"), s("PDF · 380 kB"), s("ważne do 2035")],
    [s("Zaświadczenie o zameldowaniu"), s("PDF · 120 kB"), s("do odebrania")],
    [s("Zdjęcia po obróbce"), s("ZIP · 24 MB"), s("gotowe")],
  ];

  return (
    <div className="h-full w-full bg-slate-50 p-4 text-[11px] text-slate-700 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-base font-semibold text-slate-900">{s("Dokumenty oferty")}</p>
        <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-medium text-white">{s("+ Dodaj")}</span>
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
              {name.includes(s("Zdjęcia")) ? "ZIP" : "PDF"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-slate-800">{name}</span>
              <span className="block text-slate-400">{meta}</span>
            </span>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">{status}</span>
          </motion.div>
        ))}
      </div>

      <p className="mt-3 text-slate-500">{s("Pliki leżą przy ofercie i przy kliencie naraz, a link do pobrania wygasa, więc nie krąży po WhatsAppie.")}</p>
    </div>
  );
}
