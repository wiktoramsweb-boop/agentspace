"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useReducedMotion } from "motion/react";
import type { CallInsights } from "@/lib/data-calendar";
import { WEEKDAYS_LONG, WEEKDAYS_SHORT, hhmm } from "./shared";

/** Liczba „dobiegająca" do wartości przy pierwszym pokazaniu. */
function CountUp({ value, format }: { value: number; format: (v: number) => string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  const from = useRef(0);
  useEffect(() => {
    if (reduce) {
      setShown(value);
      return;
    }
    const controls = animate(from.current, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(v),
      onComplete: () => setShown(value),
    });
    from.current = value;
    // Gdy karta jest w tle, przeglądarka wstrzymuje klatki animacji. Liczba
    // nie może wtedy utknąć w połowie - po czasie animacji ustawiamy wynik.
    const fallback = setTimeout(() => setShown(value), 1100);
    return () => {
      controls.stop();
      clearTimeout(fallback);
    };
  }, [value, reduce]);
  return <>{format(shown)}</>;
}

/**
 * „Kiedy dzwonisz": wykonane telefony z ostatnich 90 dni rozłożone na godziny
 * i dni tygodnia. Agent widzi swoją średnią porę, godzinę szczytu i to, jak
 * wypada na tle biura.
 */
export function CallInsightsPanel({ data, who, self }: { data: CallInsights; who: string; self: boolean }) {
  const you = self ? "Ty" : who.split(" ")[0];
  const reduce = useReducedMotion();
  const empty = data.total === 0;

  // Godziny na mapie: 8-20, poszerzone o godziny, w których faktycznie dzwoniono.
  let lo = 8;
  let hi = 20;
  data.byHour.forEach((v, h) => {
    if (v > 0) {
      lo = Math.min(lo, h);
      hi = Math.max(hi, h);
    }
  });
  const hours = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  const maxCell = Math.max(1, ...data.heat.flat());
  const maxHour = Math.max(1, ...data.byHour);

  const trend = data.thisWeek - data.lastWeek;
  const officeDiff =
    data.office?.avgMinute != null && data.avgMinute != null ? data.avgMinute - data.office.avgMinute : null;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03]">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Rytm dzwonienia</p>
          <h2 className="mt-0.5 text-lg font-semibold text-slate-900">{self ? "Kiedy dzwonisz" : `Kiedy dzwoni ${who}`}</h2>
        </div>
        <p className="text-xs text-slate-400">wykonane telefony · ostatnie {data.days} dni</p>
      </header>

      <div className="relative grid items-start gap-6 p-5 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        {/* Kafelki */}
        <div className="grid grid-cols-2 content-start gap-3">
          <Tile label={self ? "Średnio dzwonisz o" : "Średnia pora telefonu"} accent>
            {data.avgMinute != null ? <CountUp value={data.avgMinute} format={(v) => hhmm(v)} /> : "-"}
          </Tile>
          <Tile label="Godzina szczytu">
            {data.busiestHour != null ? `${data.busiestHour}:00-${data.busiestHour + 1}:00` : "-"}
          </Tile>
          <Tile label="Najmocniejszy dzień">
            {data.bestWeekday != null ? WEEKDAYS_LONG[data.bestWeekday] : "-"}
          </Tile>
          <Tile label="Telefonów w dniu dzwonienia">
            <CountUp value={data.perActiveDay} format={(v) => (Math.round(v * 10) / 10).toLocaleString("pl-PL")} />
          </Tile>
          <div className="col-span-2 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Ten tydzień</p>
              <p className="text-xl font-semibold tabular-nums text-slate-900">
                <CountUp value={data.thisWeek} format={(v) => String(Math.round(v))} />
                <span className="ml-1 text-sm font-normal text-slate-400">telefonów</span>
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                trend > 0
                  ? "bg-emerald-100 text-emerald-700"
                  : trend < 0
                    ? "bg-red-100 text-red-700"
                    : "bg-slate-200 text-slate-600"
              }`}
              title={`Poprzedni tydzień: ${data.lastWeek}`}
            >
              {trend > 0 ? "▲" : trend < 0 ? "▼" : "="} {Math.abs(trend)} vs poprz.
            </span>
          </div>
        </div>

        {/* Mapa ciepła i godziny */}
        <div className="min-w-0 space-y-5">
          <div className="overflow-x-auto">
            <div
              className="grid min-w-[420px] gap-[3px]"
              style={{ gridTemplateColumns: `28px repeat(${hours.length}, minmax(0, 1fr))` }}
            >
              <span />
              {hours.map((h) => (
                <span key={h} className="text-center text-[10px] tabular-nums text-slate-400">
                  {h % 2 === 0 ? h : ""}
                </span>
              ))}
              {WEEKDAYS_SHORT.map((wd, d) => (
                <HeatRow key={wd} label={wd}>
                  {hours.map((h, hi2) => {
                    const v = data.heat[d][h];
                    const alpha = v === 0 ? 0 : 0.18 + 0.82 * (v / maxCell);
                    return (
                      <motion.span
                        key={h}
                        title={`${WEEKDAYS_LONG[d]}, ${h}:00-${h + 1}:00: ${v} ${v === 1 ? "telefon" : "telefonów"}`}
                        initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: reduce ? 0 : d * 0.03 + hi2 * 0.015, duration: 0.3 }}
                        className="h-6 rounded-[5px] bg-slate-100"
                        style={v ? { backgroundColor: `rgba(16, 185, 129, ${alpha})` } : undefined}
                      />
                    );
                  })}
                </HeatRow>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">Telefony według godziny</p>
            <div className="flex h-20 items-end gap-[3px]">
              {hours.map((h, i) => {
                const v = data.byHour[h];
                const peak = h === data.busiestHour;
                return (
                  <div key={h} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${h}:00: ${v}`}>
                    <motion.div
                      className={`w-full rounded-t-md ${peak ? "bg-gradient-to-t from-emerald-500 to-teal-300" : "bg-slate-200"}`}
                      initial={reduce ? false : { height: 0 }}
                      animate={{ height: `${v ? Math.max(6, (v / maxHour) * 100) : 3}%` }}
                      transition={{ delay: reduce ? 0 : 0.15 + i * 0.03, type: "spring", stiffness: 180, damping: 22 }}
                    />
                    <span className="text-[10px] tabular-nums text-slate-400">{h % 2 === 0 ? h : ""}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {data.office && (
            <p className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
              Biuro dzwoni średnio o{" "}
              <strong className="text-slate-900">
                {data.office.avgMinute != null ? hhmm(data.office.avgMinute) : "-"}
              </strong>
              {officeDiff != null && Math.abs(officeDiff) >= 10 && (
                <>
                  {" "}
                  · {you} o <strong className="text-slate-900">{minutesText(Math.abs(officeDiff))}</strong>{" "}
                  {officeDiff > 0 ? "później" : "wcześniej"}
                </>
              )}
              {" "}· agent robi średnio <strong className="text-slate-900">{data.office.perAgent}</strong> telefonów w{" "}
              {data.days} dni, {you} <strong className="text-slate-900">{data.total}</strong>.
            </p>
          )}
        </div>

        {empty && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 p-6 backdrop-blur-[2px]">
            <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-lg">
              <p className="font-semibold text-slate-900">Tu pojawi się mapa dzwonienia</p>
              <p className="mt-1 text-sm text-slate-500">
                Brak wykonanych telefonów w ostatnich {data.days} dniach. Zaloguj telefon w Działaniach,
                a kalendarz pokaże, o której dzwonisz najczęściej.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** „53 min", „1 h 20 min" - różnica pór czytelniej niż „00:53". */
function minutesText(m: number): string {
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} min`;
  return r ? `${h} h ${r} min` : `${h} h`;
}

function HeatRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <span className="flex items-center text-[11px] font-medium text-slate-400">{label}</span>
      {children}
    </>
  );
}

function Tile({ label, children, accent }: { label: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      className={`flex flex-col justify-between gap-2 rounded-2xl p-3.5 ${
        accent ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20" : "border border-slate-200"
      }`}
    >
      <p className={`text-[11px] font-medium leading-tight ${accent ? "text-white/80" : "text-slate-400"}`}>{label}</p>
      <p className={`text-xl font-semibold capitalize tabular-nums ${accent ? "text-white" : "text-slate-900"}`}>{children}</p>
    </div>
  );
}
