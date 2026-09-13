"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { CalendarEvent } from "@/lib/data-calendar";
import { addDaysKey, partsPL, todayPL } from "@/lib/datetime";
import { KIND_STYLE, WEEKDAYS_SHORT, hhmm } from "./shared";

const MAX_CHIPS = 3;

/**
 * Widok miesiąca: 6 tygodni od poniedziałku. W każdym dniu do trzech wpisów
 * i cienki pasek na dole, który gęstnieje z liczbą telefonów - od razu widać,
 * które dni były „dzwoniące", a które puste.
 */
export function MonthGrid({
  gridStart,
  monthKey,
  events,
  onDayOpen,
  onSlotClick,
  onEventClick,
}: {
  gridStart: string;
  /** Dowolny dzień wyświetlanego miesiąca (YYYY-MM-DD). */
  monthKey: string;
  events: CalendarEvent[];
  onDayOpen: (dateKey: string) => void;
  onSlotClick: (dateKey: string, time: string) => void;
  onEventClick: (e: CalendarEvent) => void;
}) {
  const reduce = useReducedMotion();
  const today = todayPL();
  const month = monthKey.slice(0, 7);
  const days = Array.from({ length: 42 }, (_, i) => addDaysKey(gridStart, i));

  const byDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const p = partsPL(e.due_at);
      if (!p) continue;
      if (!m.has(p.dateKey)) m.set(p.dateKey, []);
      m.get(p.dateKey)!.push(e);
    }
    return m;
  }, [events]);

  const maxCalls = useMemo(() => {
    let max = 0;
    for (const list of byDay.values()) max = Math.max(max, list.filter((e) => e.kind === "polaczenie").length);
    return max;
  }, [byDay]);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[680px]">
        <div className="grid grid-cols-7 border-b border-slate-200">
          {WEEKDAYS_SHORT.map((d, i) => (
            <div
              key={d}
              className={`px-3 py-2.5 text-xs font-medium uppercase tracking-wide ${i >= 5 ? "text-slate-400" : "text-slate-500"}`}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const list = byDay.get(d) ?? [];
            const inMonth = d.startsWith(month);
            const isToday = d === today;
            const calls = list.filter((e) => e.kind === "polaczenie").length;
            const weekend = i % 7 >= 5;
            return (
              <motion.div
                key={d}
                initial={reduce ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : Math.floor(i / 7) * 0.035 + (i % 7) * 0.012, duration: 0.25 }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) onSlotClick(d, "09:00");
                }}
                className={`group relative flex min-h-[112px] cursor-pointer flex-col gap-1 border-b border-r border-slate-200 p-1.5 transition-colors hover:bg-emerald-500/[0.04] ${
                  weekend ? "bg-slate-50" : ""
                } ${i % 7 === 0 ? "border-l" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onDayOpen(d)}
                    className={`flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-sm font-semibold tabular-nums transition ${
                      isToday
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                        : inMonth
                          ? "text-slate-800 hover:bg-slate-100"
                          : "text-slate-300 hover:bg-slate-100"
                    }`}
                    aria-label={`Otwórz dzień ${d}`}
                  >
                    {Number(d.slice(8))}
                  </button>
                  <span className="text-[11px] font-medium text-emerald-600 opacity-0 transition group-hover:opacity-100">
                    + dodaj
                  </span>
                </div>

                {list.slice(0, MAX_CHIPS).map((e) => {
                  const p = partsPL(e.due_at);
                  const st = KIND_STYLE[e.kind];
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => onEventClick(e)}
                      className={`flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left text-[11px] transition hover:bg-slate-100 ${
                        inMonth ? "text-slate-700" : "text-slate-400"
                      } ${e.status === "anulowane" ? "line-through opacity-60" : ""}`}
                    >
                      <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${st.dot} ${e.status === "wykonane" ? "opacity-40" : ""}`} />
                      <span className="tabular-nums text-slate-400">{p ? hhmm(p.hour * 60 + p.minute) : ""}</span>
                      <span className="truncate font-medium">{e.subject}</span>
                    </button>
                  );
                })}
                {list.length > MAX_CHIPS && (
                  <button
                    type="button"
                    onClick={() => onDayOpen(d)}
                    className="self-start rounded-md px-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-900"
                  >
                    +{list.length - MAX_CHIPS} więcej
                  </button>
                )}

                {calls > 0 && (
                  <div className="mt-auto flex items-center gap-1.5 px-1 pt-1" title={`${calls} telefonów`}>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-blue-400 to-emerald-400"
                        initial={reduce ? false : { width: 0 }}
                        animate={{ width: `${Math.max(12, (calls / Math.max(1, maxCalls)) * 100)}%` }}
                        transition={{ delay: reduce ? 0 : 0.2 + (i % 7) * 0.02, duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold tabular-nums text-slate-400">{calls}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
