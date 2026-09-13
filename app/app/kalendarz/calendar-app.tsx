"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { CalendarEvent, CallInsights } from "@/lib/data-calendar";
import { addDaysKey, formatDateTimePL, isDateKey, partsPL, todayPL, warsawToIso } from "@/lib/datetime";
import { formatPhone } from "@/lib/format";
import { ACTIVITY_ICONS } from "../components/icons";
import { ActivityModal } from "../dzialania/activity-modal";
import { rescheduleActivity, toggleActivityDone } from "../dzialania/actions";
import { TimeGrid } from "./time-grid";
import { MonthGrid } from "./month-grid";
import { CallInsightsPanel } from "./call-insights";
import { KIND_ORDER, KIND_STYLE, WEEKDAYS_LONG, dayMonth, hhmm, monthTitle, type CalView } from "./shared";

type Lite = { id: string; name: string };

const VIEWS: { value: CalView; label: string }[] = [
  { value: "dzien", label: "Dzień" },
  { value: "tydzien", label: "Tydzień" },
  { value: "miesiac", label: "Miesiąc" },
];

export function CalendarApp({
  view,
  dateKey,
  rangeStart,
  rangeEnd,
  events,
  insights,
  scope,
  scopeOptions,
  insightsWho,
  insightsSelf,
  agents,
  clients,
  properties,
  reportDefault,
}: {
  view: CalView;
  dateKey: string;
  rangeStart: string;
  rangeEnd: string;
  events: CalendarEvent[];
  insights: CallInsights;
  scope: string;
  scopeOptions: { value: string; label: string }[];
  insightsWho: string;
  insightsSelf: boolean;
  agents: Lite[];
  clients: (Lite & { phone?: string | null })[];
  properties: Lite[];
  reportDefault: boolean;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [pending, startTransition] = useTransition();
  const [direction, setDirection] = useState(0);
  const [hidden, setHidden] = useState<Set<CalendarEvent["kind"]>>(new Set());
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [slot, setSlot] = useState<{ date: string; time: string } | null>(null);
  // Przesunięte terminy pokazujemy od razu, zanim serwer potwierdzi zapis.
  const [moved, setMoved] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => setMoved({}), [events]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const shown = useMemo(
    () =>
      events
        .map((e) => (moved[e.id] ? { ...e, due_at: moved[e.id] } : e))
        .filter((e) => !hidden.has(e.kind)),
    [events, moved, hidden],
  );
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of events) c[e.kind] = (c[e.kind] ?? 0) + 1;
    return c;
  }, [events]);

  function go(next: { view?: CalView; date?: string; scope?: string }, dir = 0) {
    setDirection(dir);
    const params = new URLSearchParams({
      widok: next.view ?? view,
      data: next.date ?? dateKey,
      kto: next.scope ?? scope,
    });
    startTransition(() => router.push(`/app/kalendarz?${params.toString()}`, { scroll: false }));
  }

  function shift(dir: 1 | -1) {
    if (view === "dzien") return go({ date: addDaysKey(dateKey, dir) }, dir);
    if (view === "tydzien") return go({ date: addDaysKey(dateKey, 7 * dir) }, dir);
    const [y, m] = dateKey.split("-").map(Number);
    const first = new Date(Date.UTC(y, m - 1 + dir, 1)).toISOString().slice(0, 10);
    go({ date: first }, dir);
  }

  // Skróty klawiszowe jak w kalendarzach: strzałki, T = dziś, D/W/M = widok.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]") || e.metaKey || e.ctrlKey) return;
      if (e.key === "ArrowLeft") shift(-1);
      else if (e.key === "ArrowRight") shift(1);
      else if (e.key === "t" || e.key === "T") go({ date: todayPL() });
      else if (e.key === "d" || e.key === "D") go({ view: "dzien" });
      else if (e.key === "w" || e.key === "W") go({ view: "tydzien" });
      else if (e.key === "m" || e.key === "M") go({ view: "miesiac" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function move(e: CalendarEvent, date: string, time: string) {
    const [hh, mm] = time.split(":").map(Number);
    const before = partsPL(e.due_at);
    if (before && before.dateKey === date && before.hour === hh && before.minute === mm) return;
    const iso = warsawToIso(date, time);
    if (iso) setMoved((m) => ({ ...m, [e.id]: iso }));
    const res = await rescheduleActivity(e.id, date, time);
    if (!res.ok) {
      setMoved((m) => {
        const copy = { ...m };
        delete copy[e.id];
        return copy;
      });
      setToast(res.error ?? "Nie udało się przesunąć działania.");
      return;
    }
    setToast(`Przesunięto na ${dayMonth(date)}, ${time}`);
    router.refresh();
  }

  const days =
    view === "dzien" ? [dateKey] : Array.from({ length: 7 }, (_, i) => addDaysKey(rangeStart, i));

  const weekdayName = WEEKDAYS_LONG[partsPL(`${dateKey}T12:00:00Z`)?.weekday ?? 0];
  const title =
    view === "miesiac"
      ? monthTitle(dateKey)
      : view === "dzien"
        ? `${weekdayName.charAt(0).toUpperCase()}${weekdayName.slice(1)}, ${dayMonth(dateKey)}`
        : rangeStart.slice(0, 7) === rangeEnd.slice(0, 7)
          ? `${Number(rangeStart.slice(8))}-${dayMonth(rangeEnd)} ${rangeEnd.slice(0, 4)}`
          : `${dayMonth(rangeStart)} do ${dayMonth(rangeEnd)} ${rangeEnd.slice(0, 4)}`;

  const today = todayPL();
  const isCurrent = today >= rangeStart && today <= rangeEnd;

  return (
    <div className="space-y-6">
      {/* ── Pasek narzędzi ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Poprzedni okres"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
          >
            <Chevron dir="left" />
          </button>
          <button
            type="button"
            onClick={() => go({ date: today })}
            disabled={isCurrent && dateKey === today}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:text-slate-400"
          >
            Dziś
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Następny okres"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
          >
            <Chevron dir="right" />
          </button>
        </div>

        <h2 className="min-w-0 text-xl font-semibold text-slate-900">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={title}
              className="inline-block"
              initial={reduce ? false : { opacity: 0, y: direction >= 0 ? 8 : -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: direction >= 0 ? -8 : 8 }}
              transition={{ duration: 0.18 }}
            >
              {title}
            </motion.span>
          </AnimatePresence>
        </h2>
        {pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" aria-label="Wczytuję" />}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* Przełącznik widoku z przesuwaną „pigułką" */}
          <div className="relative flex rounded-2xl bg-slate-100 p-1">
            {VIEWS.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => go({ view: v.value })}
                className={`relative z-10 rounded-xl px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  view === v.value ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {view === v.value && (
                  <motion.span
                    layoutId="cal-view-pill"
                    className="absolute inset-0 -z-10 rounded-xl bg-white shadow-sm"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                {v.label}
              </button>
            ))}
          </div>

          <select
            value={scope}
            onChange={(e) => go({ scope: e.target.value })}
            aria-label="Czyj kalendarz"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none"
          >
            {scopeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setSlot({ date: isDateKey(dateKey) && view !== "miesiac" ? dateKey : today, time: "" })}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-500/25 transition hover:bg-emerald-400"
          >
            + Działanie
          </button>
        </div>
      </div>

      {/* Filtry rodzajów */}
      <div className="flex flex-wrap items-center gap-2">
        {KIND_ORDER.map((k) => {
          const st = KIND_STYLE[k];
          const off = hidden.has(k);
          return (
            <button
              key={k}
              type="button"
              aria-pressed={!off}
              onClick={() =>
                setHidden((prev) => {
                  const next = new Set(prev);
                  if (next.has(k)) next.delete(k);
                  else next.add(k);
                  return next;
                })
              }
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                off
                  ? "border-slate-200 bg-transparent text-slate-400"
                  : "border-slate-200 bg-white text-slate-700 shadow-sm"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${st.dot} ${off ? "opacity-30" : ""}`} />
              {st.plural}
              <span className="tabular-nums text-slate-400">{counts[k] ?? 0}</span>
            </button>
          );
        })}
        <span className="ml-auto hidden text-xs text-slate-400 lg:inline">
          Klik w wolne miejsce dodaje działanie · przeciągnij wpis, żeby zmienić termin · ← → T D W M
        </span>
      </div>

      {/* ── Kalendarz ──────────────────────────────────── */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03]">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={`${view}-${rangeStart}`}
            custom={direction}
            initial={reduce ? false : { opacity: 0, x: direction * 40 }}
            animate={{ opacity: pending ? 0.6 : 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: direction * -40 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            {view === "miesiac" ? (
              <MonthGrid
                gridStart={rangeStart}
                monthKey={dateKey}
                events={shown}
                onDayOpen={(d) => go({ view: "dzien", date: d })}
                onSlotClick={(d, t) => setSlot({ date: d, time: t })}
                onEventClick={setSelected}
              />
            ) : (
              <TimeGrid
                days={days}
                events={shown}
                onSlotClick={(d, t) => setSlot({ date: d, time: t })}
                onEventClick={setSelected}
                onMove={move}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <CallInsightsPanel data={insights} who={insightsWho} self={insightsSelf} />

      {/* ── Szczegóły wpisu ───────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <EventDrawer
            key={selected.id}
            event={moved[selected.id] ? { ...selected, due_at: moved[selected.id] } : selected}
            onClose={() => setSelected(null)}
            onMove={async (d, t) => {
              await move(selected, d, t);
            }}
            onToggleDone={async () => {
              await toggleActivityDone(selected.id, selected.status !== "wykonane");
              setToast(selected.status === "wykonane" ? "Cofnięto wykonanie" : "Oznaczono jako wykonane");
              setSelected(null);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>

      <ActivityModal
        trigger="none"
        open={!!slot}
        onOpenChange={(o) => !o && setSlot(null)}
        agents={agents}
        clients={clients}
        properties={properties}
        reportDefault={reportDefault}
        presetDate={slot?.date}
        presetTime={slot?.time || undefined}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="btn-ink fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full px-4 py-2.5 text-sm font-medium shadow-xl"
            role="status"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EventDrawer({
  event,
  onClose,
  onMove,
  onToggleDone,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onMove: (date: string, time: string) => Promise<void>;
  onToggleDone: () => Promise<void>;
}) {
  const reduce = useReducedMotion();
  const st = KIND_STYLE[event.kind];
  const Icon = ACTIVITY_ICONS[event.kind];
  const p = partsPL(event.due_at);
  const [date, setDate] = useState(p?.dateKey ?? todayPL());
  const [time, setTime] = useState(p ? hhmm(p.hour * 60 + p.minute) : "09:00");
  const [busy, setBusy] = useState(false);
  const done = event.status === "wykonane";
  const who = event.contact_name ?? event.clientName;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[70] bg-slate-900/30 backdrop-blur-[1px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.aside
        role="dialog"
        aria-label={event.subject}
        className="portal-dark fixed inset-y-0 right-0 z-[75] flex w-full max-w-md flex-col bg-white shadow-2xl"
        initial={reduce ? { opacity: 0 } : { x: "100%" }}
        animate={reduce ? { opacity: 1 } : { x: 0 }}
        exit={reduce ? { opacity: 0 } : { x: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
      >
        <div className={`h-1.5 w-full ${st.bar}`} />
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
          <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white ${st.bar}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{st.label}</p>
            <h3 className="text-lg font-semibold leading-snug text-slate-900">{event.subject}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2.5 text-sm">
            <dt className="text-slate-400">Termin</dt>
            <dd className="font-medium text-slate-900">{formatDateTimePL(event.due_at)}</dd>
            <dt className="text-slate-400">Status</dt>
            <dd>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  done
                    ? "bg-emerald-100 text-emerald-700"
                    : event.status === "anulowane"
                      ? "bg-slate-200 text-slate-600"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {done ? "wykonane" : event.status === "anulowane" ? "anulowane" : "zaplanowane"}
              </span>
            </dd>
            {who && (
              <>
                <dt className="text-slate-400">Kontakt</dt>
                <dd className="text-slate-900">{who}</dd>
              </>
            )}
            {event.contact_phone && (
              <>
                <dt className="text-slate-400">Telefon</dt>
                <dd>
                  {event.contact_phone.includes("•") ? (
                    <span className="text-slate-500">{event.contact_phone}</span>
                  ) : (
                    <a href={`tel:${event.contact_phone}`} className="font-medium text-emerald-700 hover:underline">
                      {formatPhone(event.contact_phone)}
                    </a>
                  )}
                </dd>
              </>
            )}
            {event.propertyTitle && (
              <>
                <dt className="text-slate-400">Oferta</dt>
                <dd className="text-slate-900">{event.propertyTitle}</dd>
              </>
            )}
            <dt className="text-slate-400">Agent</dt>
            <dd className="text-slate-900">{event.assigneeNames.join(", ") || "-"}</dd>
          </dl>

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-900">Zmień termin</p>
            <div className="grid grid-cols-[1fr_110px] gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              disabled={busy || !isDateKey(date) || !/^\d{2}:\d{2}$/.test(time)}
              onClick={async () => {
                setBusy(true);
                await onMove(date, time);
                setBusy(false);
              }}
              className="btn-ink mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50"
            >
              Przesuń
            </button>
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-100 px-5 py-4">
          <Link
            href={`/app/dzialania/${event.id}`}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Otwórz działanie
          </Link>
          <button
            type="button"
            disabled={busy || event.status === "anulowane"}
            onClick={async () => {
              setBusy(true);
              await onToggleDone();
              setBusy(false);
            }}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
              done
                ? "border border-slate-200 text-slate-700 hover:bg-slate-50"
                : "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25 hover:bg-emerald-400"
            }`}
          >
            {done ? "Cofnij wykonanie" : "Oznacz jako wykonane"}
          </button>
        </div>
      </motion.aside>
    </>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={dir === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}
