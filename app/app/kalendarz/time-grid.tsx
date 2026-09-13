"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { CalendarEvent } from "@/lib/data-calendar";
import { partsPL, todayPL } from "@/lib/datetime";
import { formatPhone } from "@/lib/format";
import { ACTIVITY_ICONS } from "../components/icons";
import { KIND_STYLE, WEEKDAYS_SHORT, hhmm, layoutDay } from "./shared";

const HOUR_PX = 56;
const SNAP = 15;

/**
 * Siatka godzin dla widoku tygodnia (7 kolumn) i dnia (1 kolumna).
 *
 * - klik w wolne miejsce: nowe działanie z tą datą i godziną (co 30 min),
 * - przeciągnięcie wpisu: nowy termin, przyciągany do pełnych 15 minut,
 * - czerwona linia pokazuje „teraz" w polskim czasie.
 */
export function TimeGrid({
  days,
  events,
  onSlotClick,
  onEventClick,
  onMove,
}: {
  days: string[];
  events: CalendarEvent[];
  onSlotClick: (dateKey: string, time: string) => void;
  onEventClick: (e: CalendarEvent) => void;
  onMove: (e: CalendarEvent, dateKey: string, time: string) => void;
}) {
  const reduce = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ id: string; dateKey: string; minute: number } | null>(null);
  const [now, setNow] = useState(() => partsPL(new Date().toISOString()));
  const today = todayPL();

  // Zakres godzin: domyślnie 7-21, poszerzany, gdy ktoś ma coś wcześniej lub później.
  const [startH, endH] = useMemo(() => {
    let lo = 7;
    let hi = 21;
    for (const e of events) {
      const p = partsPL(e.due_at);
      if (!p) continue;
      lo = Math.min(lo, p.hour);
      hi = Math.max(hi, Math.min(24, p.hour + 1));
    }
    return [lo, hi];
  }, [events]);
  const hours = Array.from({ length: endH - startH }, (_, i) => startH + i);

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

  useEffect(() => {
    const t = setInterval(() => setNow(partsPL(new Date().toISOString())), 60_000);
    return () => clearInterval(t);
  }, []);

  // Na starcie przewijamy do pory pracy (albo do „teraz"), a nie do 7:00.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = days.includes(today) && now ? Math.max(startH, now.hour - 2) : Math.max(startH, 8);
    el.scrollTop = (target - startH) * HOUR_PX;
    // tylko przy zmianie zakresu dni
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.join(",")]);

  const minuteAt = (e: React.DragEvent | React.MouseEvent, el: HTMLElement) => {
    const y = e.clientY - el.getBoundingClientRect().top;
    const raw = startH * 60 + (y / HOUR_PX) * 60;
    return Math.max(startH * 60, Math.min(endH * 60 - SNAP, Math.round(raw / SNAP) * SNAP));
  };

  const single = days.length === 1;

  return (
    <div className="overflow-x-auto">
      <div className={single ? "" : "min-w-[760px]"}>
        {/* Nagłówek dni */}
        <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}>
          <div />
          {days.map((d) => {
            const p = partsPL(`${d}T12:00:00Z`);
            const isToday = d === today;
            const count = byDay.get(d)?.length ?? 0;
            return (
              <div key={d} className="flex items-center justify-center gap-2 px-1 py-2.5">
                <span className={`text-xs font-medium uppercase tracking-wide ${isToday ? "text-emerald-600" : "text-slate-400"}`}>
                  {WEEKDAYS_SHORT[p?.weekday ?? 0]}
                </span>
                <span
                  className={`flex h-8 min-w-8 items-center justify-center rounded-full px-1.5 text-sm font-semibold tabular-nums ${
                    isToday ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30" : "text-slate-800"
                  }`}
                >
                  {Number(d.slice(8))}
                </span>
                {count > 0 && (
                  <span className="rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold tabular-nums text-slate-500">
                    {count}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Siatka */}
        <div ref={scrollRef} className="relative max-h-[640px] overflow-y-auto">
          <div
            className="relative grid"
            style={{
              gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))`,
              height: hours.length * HOUR_PX,
            }}
          >
            {/* Oś godzin */}
            <div className="relative">
              {hours.map((h, i) => (
                <span
                  key={h}
                  className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-slate-400"
                  style={{ top: i * HOUR_PX }}
                >
                  {i === 0 ? "" : `${h}:00`}
                </span>
              ))}
            </div>

            {days.map((d, di) => {
              const placed = layoutDay(byDay.get(d) ?? []);
              const isToday = d === today;
              const weekend = (partsPL(`${d}T12:00:00Z`)?.weekday ?? 0) >= 5;
              return (
                <div
                  key={d}
                  className={`relative border-l border-slate-200 ${weekend ? "bg-slate-50" : ""}`}
                  onClick={(e) => {
                    if (e.target !== e.currentTarget) return;
                    const m = minuteAt(e, e.currentTarget);
                    onSlotClick(d, hhmm(Math.floor(m / 30) * 30));
                  }}
                  onDragOver={(e) => {
                    if (!drag) return;
                    e.preventDefault();
                    const m = minuteAt(e, e.currentTarget);
                    if (m !== drag.minute || d !== drag.dateKey) setDrag({ ...drag, dateKey: d, minute: m });
                  }}
                  onDrop={(e) => {
                    if (!drag) return;
                    e.preventDefault();
                    const ev = events.find((x) => x.id === drag.id);
                    const m = minuteAt(e, e.currentTarget);
                    setDrag(null);
                    if (ev) onMove(ev, d, hhmm(m));
                  }}
                >
                  {/* Linie godzin i półgodzin */}
                  {hours.map((h, i) => (
                    <div key={h} className="pointer-events-none absolute inset-x-0" style={{ top: i * HOUR_PX }}>
                      <div className="border-t border-slate-200" />
                      <div className="border-t border-dashed border-slate-100" style={{ marginTop: HOUR_PX / 2 - 1 }} />
                    </div>
                  ))}

                  {/* Podgląd miejsca upuszczenia */}
                  {drag && drag.dateKey === d && (
                    <div
                      className="pointer-events-none absolute inset-x-1 z-20 rounded-md border-2 border-dashed border-emerald-400 bg-emerald-400/10"
                      style={{ top: ((drag.minute - startH * 60) / 60) * HOUR_PX, height: HOUR_PX / 3 }}
                    >
                      <span className="absolute -top-5 left-0 rounded bg-emerald-500 px-1.5 text-[10px] font-semibold text-white">
                        {hhmm(drag.minute)}
                      </span>
                    </div>
                  )}

                  {/* Teraz */}
                  {isToday && now && now.hour >= startH && now.hour < endH && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-10"
                      style={{ top: ((now.hour * 60 + now.minute - startH * 60) / 60) * HOUR_PX }}
                    >
                      <div className="relative h-0.5 bg-red-500">
                        <span className="absolute -left-1.5 -top-[5px] h-3 w-3 rounded-full bg-red-500">
                          {!reduce && <span className="absolute inset-0 animate-ping rounded-full bg-red-400" />}
                        </span>
                      </div>
                    </div>
                  )}

                  {placed.map((pl, i) => {
                    const e = pl.event;
                    const st = KIND_STYLE[e.kind];
                    const Icon = ACTIVITY_ICONS[e.kind];
                    const top = ((pl.start - startH * 60) / 60) * HOUR_PX;
                    const height = Math.max(22, ((pl.end - pl.start) / 60) * HOUR_PX - 2);
                    const width = 100 / pl.lanes;
                    const done = e.status === "wykonane";
                    const cancelled = e.status === "anulowane";
                    const overdue = e.status === "zaplanowane" && e.due_at < new Date().toISOString();
                    const who = e.contact_name ?? e.clientName;
                    return (
                      <motion.button
                        key={e.id}
                        type="button"
                        draggable
                        onDragStartCapture={(ev: React.DragEvent) => {
                          ev.dataTransfer.effectAllowed = "move";
                          ev.dataTransfer.setData("text/plain", e.id);
                          setDrag({ id: e.id, dateKey: d, minute: pl.start });
                        }}
                        onDragEndCapture={() => setDrag(null)}
                        onClick={() => onEventClick(e)}
                        initial={reduce ? false : { opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: drag?.id === e.id ? 0.35 : 1, y: 0, scale: 1 }}
                        transition={{ delay: reduce ? 0 : Math.min(0.25, di * 0.03 + i * 0.02), type: "spring", stiffness: 420, damping: 32 }}
                        whileHover={reduce ? undefined : { y: -1 }}
                        className={`absolute z-[5] flex flex-col overflow-hidden rounded-lg border-l-[3px] px-1.5 py-1 text-left shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${st.block} ${
                          cancelled ? "opacity-50 line-through" : ""
                        }`}
                        style={{
                          top,
                          height,
                          left: `calc(${pl.lane * width}% + 2px)`,
                          width: `calc(${width}% - 4px)`,
                        }}
                        title={`${hhmm(pl.start)} ${e.subject}`}
                      >
                        <span className="flex min-w-0 items-center gap-1 text-[11px] font-semibold leading-tight text-slate-800">
                          <Icon className="h-3 w-3 flex-shrink-0 opacity-70" />
                          <span className="tabular-nums opacity-70">{hhmm(pl.start)}</span>
                          <span className="truncate">{e.subject}</span>
                          {done && (
                            <svg className="ml-auto h-3 w-3 flex-shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-label="wykonane">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                            </svg>
                          )}
                          {overdue && <span className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" aria-label="zaległe" />}
                        </span>
                        {height > 36 && (who || e.contact_phone) && (
                          <span className="truncate text-[10.5px] text-slate-500">
                            {who ?? formatPhone(e.contact_phone)}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
