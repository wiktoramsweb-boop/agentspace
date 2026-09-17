"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PER_PAGE_OPTIONS, activeFilterCount, listHref, type ListQuery } from "@/lib/list-params";
import { addDaysKey, todayPL } from "@/lib/datetime";

export type FilterOption = { value: string; label: string };

export type ListFilters = {
  statuses?: FilterOption[];
  types?: { label: string; options: FilterOption[] };
  /** Po jakiej dacie filtrujemy zakres (np. dodania, ostatniego kontaktu). */
  dateFields?: FilterOption[];
  city?: boolean;
  range?: { label: string; unit: string };
  extra?: { label: string; options: FilterOption[] };
};

/**
 * Pasek nad listą: szukanie, filtry, sortowanie i liczba wyników.
 *
 * Wszystko siedzi w adresie strony, więc filtruje baza, a nie przeglądarka.
 * Przy bazie z importu (tysiące pozycji) to jedyna wersja, która zostaje szybka.
 */
export function ListToolbar({
  base,
  query,
  total,
  sorts,
  filters,
  agents,
  placeholder,
  children,
}: {
  base: string;
  query: ListQuery;
  total: number;
  sorts: FilterOption[];
  filters: ListFilters;
  agents: { id: string; name: string }[];
  placeholder: string;
  /** Dodatkowe przyciski po prawej (np. „Dodaj klienta"). */
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(query.q);
  const [open, setOpen] = useState(false);
  const first = useRef(true);
  const count = activeFilterCount(query);

  const go = (patch: Partial<ListQuery>) =>
    startTransition(() => router.push(listHref(base, query, patch), { scroll: false }));

  useEffect(() => setText(query.q), [query.q]);

  // Szukanie startuje po chwili od ostatniego znaku, żeby nie pytać bazy o każdą literę.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (text === query.q) return;
    const t = setTimeout(() => go({ q: text }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const quickRange = (days: number, label: string) => {
    const to = todayPL();
    const from = addDaysKey(to, -days + 1);
    const active = query.from === from && query.to === to;
    return (
      <button
        key={label}
        type="button"
        onClick={() => go(active ? { from: "", to: "" } : { from, to })}
        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
          active ? "btn-ink" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
          </svg>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
          />
          {text && (
            <button
              type="button"
              onClick={() => setText("")}
              aria-label="Wyczyść wyszukiwanie"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-800"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition ${
            count > 0 ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Filtry
          {count > 0 && (
            <span className="rounded-full bg-emerald-500 px-1.5 text-xs font-bold text-white">{count}</span>
          )}
        </button>

        <select
          value={query.sort || sorts[0]?.value}
          onChange={(e) => go({ sort: e.target.value })}
          aria-label="Sortowanie"
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
        >
          {sorts.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {children}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="overflow-hidden"
          >
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Osoba odpowiedzialna">
                <select value={query.agent} onChange={(e) => go({ agent: e.target.value })} className={input}>
                  <option value="">wszyscy</option>
                  <option value="ja">tylko moje</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </Field>

              {filters.statuses && (
                <Field label="Status">
                  <select value={query.status} onChange={(e) => go({ status: e.target.value })} className={input}>
                    <option value="">wszystkie</option>
                    {filters.statuses.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {filters.types && (
                <Field label={filters.types.label}>
                  <select value={query.type} onChange={(e) => go({ type: e.target.value })} className={input}>
                    <option value="">wszystkie</option>
                    {filters.types.options.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {filters.extra && (
                <Field label={filters.extra.label}>
                  <select value={query.extra} onChange={(e) => go({ extra: e.target.value })} className={input}>
                    <option value="">bez filtra</option>
                    {filters.extra.options.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {filters.city && (
                <Field label="Miasto">
                  <input
                    defaultValue={query.city}
                    onBlur={(e) => e.target.value !== query.city && go({ city: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && go({ city: (e.target as HTMLInputElement).value })}
                    placeholder="np. Kraków"
                    className={input}
                  />
                </Field>
              )}

              {filters.range && (
                <Field label={filters.range.label}>
                  <div className="flex items-center gap-2">
                    <input
                      defaultValue={query.min}
                      onBlur={(e) => e.target.value !== query.min && go({ min: e.target.value })}
                      inputMode="numeric"
                      placeholder="od"
                      className={`${input} w-full`}
                    />
                    <input
                      defaultValue={query.max}
                      onBlur={(e) => e.target.value !== query.max && go({ max: e.target.value })}
                      inputMode="numeric"
                      placeholder="do"
                      className={`${input} w-full`}
                    />
                    <span className="text-xs text-slate-400">{filters.range.unit}</span>
                  </div>
                </Field>
              )}

              {filters.dateFields && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <Field label="Okres">
                      <select value={query.dateField} onChange={(e) => go({ dateField: e.target.value })} className={input}>
                        {filters.dateFields.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Od">
                      <input type="date" value={query.from} onChange={(e) => go({ from: e.target.value })} className={input} />
                    </Field>
                    <Field label="Do">
                      <input type="date" value={query.to} onChange={(e) => go({ to: e.target.value })} className={input} />
                    </Field>
                    <div className="flex flex-wrap items-center gap-1.5 pb-1">
                      {quickRange(1, "dziś")}
                      {quickRange(7, "7 dni")}
                      {quickRange(30, "30 dni")}
                      {quickRange(90, "kwartał")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <span className={pending ? "opacity-50" : ""}>
          Wyników: <strong className="tabular-nums text-slate-800">{total}</strong>
        </span>
        {pending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />}
        {count > 0 && (
          <button
            type="button"
            onClick={() =>
              go({ agent: "", status: "", type: "", from: "", to: "", city: "", min: "", max: "", extra: "" })
            }
            className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
          >
            Wyczyść filtry
          </button>
        )}
      </div>
    </div>
  );
}

const input =
  "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
    </label>
  );
}

/** Stronicowanie liczone przez bazę: numery stron prowadzą do adresu z parametrem. */
export function ServerPagination({
  base,
  query,
  total,
  pages,
  label,
}: {
  base: string;
  query: ListQuery;
  total: number;
  pages: number;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (total === 0) return null;

  const go = (patch: Partial<ListQuery>) =>
    startTransition(() => router.push(listHref(base, query, patch), { scroll: false }));

  const page = Math.min(query.page, pages);
  const from = (page - 1) * query.per + 1;
  const to = Math.min(total, page * query.per);
  const pageWindow: number[] = [];
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  for (let i = start; i <= Math.min(pages, start + 4); i++) pageWindow.push(i);

  const btn = "rounded-lg border px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500">
        {from}-{to} z {total} {label}
        {pending && <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent align-middle" />}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <select
          value={query.per}
          onChange={(e) => go({ per: Number(e.target.value), page: 1 })}
          aria-label="Pozycji na stronie"
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700"
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} na stronie
            </option>
          ))}
        </select>
        {pages > 1 && (
          <>
            <button type="button" disabled={page <= 1} onClick={() => go({ page: page - 1 })} className={`${btn} border-slate-300 bg-white text-slate-700 hover:bg-slate-100`}>
              Poprzednia
            </button>
            {pageWindow.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => go({ page: i })}
                aria-current={i === page ? "page" : undefined}
                className={`${btn} ${i === page ? "btn-ink border-transparent font-semibold" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}
              >
                {i}
              </button>
            ))}
            <button type="button" disabled={page >= pages} onClick={() => go({ page: page + 1 })} className={`${btn} border-slate-300 bg-white text-slate-700 hover:bg-slate-100`}>
              Następna
            </button>
          </>
        )}
      </div>
    </div>
  );
}
