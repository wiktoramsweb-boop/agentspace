"use client";

import {
  DETAIL_PREFIX,
  pietroEtykieta,
  sectionsFor,
  type PropertyField,
  type PropertySection,
} from "@/lib/property-fields";
import type { Property, PropertyDealKind, PropertyType } from "@/lib/types";
import { Select } from "../components/select";
import { SectionIcon, SECTION_TONE } from "./section-icon";

/**
 * Krok „Parametry" kreatora oferty. Całość rysujemy ze słownika
 * `lib/property-fields.ts`, więc mieszkanie, działka, hala i pokój dostają
 * naprawdę inne pola, a dodanie nowego to jedna linia w słowniku.
 *
 * Sekcje zwijamy elementem <details>, a nie warunkowym renderowaniem: zwinięta
 * sekcja zostaje w DOM, więc jej pola normalnie idą w zapisie formularza.
 */
export function ParamFields({
  type,
  dealKind,
  property,
}: {
  type: PropertyType;
  dealKind: PropertyDealKind;
  property?: Property;
}) {
  const sections = sectionsFor(type, dealKind);
  const cols = (property ?? {}) as unknown as Record<string, unknown>;
  const details = (property?.details ?? {}) as Record<string, unknown>;

  function valueOf(f: PropertyField): unknown {
    if (!f.column) return details[f.key];
    // Piętro trzymamy w bazie jako liczbę, a wybiera się je z listy etykiet
    // („Parter", „> 10"), więc przy wczytywaniu tłumaczymy je z powrotem.
    if (f.key === "floor") return pietroEtykieta(cols.floor as number | null);
    return cols[f.key];
  }

  function filledCount(sec: PropertySection): number {
    return sec.fields.filter((f) => {
      const v = valueOf(f);
      if (Array.isArray(v)) return v.length > 0;
      return v != null && v !== "" && v !== false;
    }).length;
  }

  return (
    <div className="space-y-3">
      {sections.map((sec) => {
        const filled = filledCount(sec);
        const preview = sec.fields.slice(0, 5).map((f) => f.label).join(" · ");
        return (
          <details
            key={sec.title}
            open={sec.open || filled > 0}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition open:border-slate-300 open:shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3.5 px-4 py-3.5 transition hover:bg-slate-50 group-open:bg-slate-50">
              <span
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${SECTION_TONE[sec.icon]}`}
              >
                <SectionIcon name={sec.icon} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[0.9375rem] font-semibold leading-tight tracking-[-0.01em] text-slate-900">
                  {sec.title}
                </span>
                <span className="mt-1 block truncate text-xs text-slate-400 group-open:hidden">{preview}</span>
                <span className="mt-1 hidden text-xs text-slate-400 group-open:block">
                  {sec.fields.length} {polaLabel(sec.fields.length)} do uzupełnienia
                </span>
              </span>

              {filled > 0 && (
                <span className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 py-1 pl-2 pr-2.5 text-[11px] font-semibold text-emerald-700">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                  </svg>
                  {filled}
                </span>
              )}

              <svg
                className="h-4 w-4 flex-shrink-0 text-slate-400 transition group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
              </svg>
            </summary>

            <div className="border-t border-slate-200 px-4 py-5">
              {sec.hint && <p className="mb-4 text-xs leading-relaxed text-slate-500">{sec.hint}</p>}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sec.fields.map((f) => (
                  <FieldBox key={f.key} field={f} value={valueOf(f)} />
                ))}
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}

/** „1 pole", „3 pola", „12 pól" - bez tego nagłówki brzmią jak automat. */
function polaLabel(n: number): string {
  if (n === 1) return "pole";
  const d = n % 10;
  const s = n % 100;
  return d >= 2 && d <= 4 && !(s >= 12 && s <= 14) ? "pola" : "pól";
}

const inp =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15";

function FieldBox({ field: f, value }: { field: PropertyField; value: unknown }) {
  const name = f.column ? f.key : DETAIL_PREFIX + f.key;
  const span = f.wide || f.kind === "multi" ? "sm:col-span-2 lg:col-span-3" : "";

  if (f.kind === "bool") {
    return (
      <label className={`flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-300 px-3 py-2.5 text-sm transition has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 ${span}`}>
        <input
          type="checkbox"
          name={name}
          value="1"
          defaultChecked={value === true || value === "1"}
          className="h-4 w-4 flex-shrink-0 accent-emerald-500"
        />
        <span className="text-slate-800">{f.label}</span>
      </label>
    );
  }

  if (f.kind === "multi") {
    const picked = new Set(Array.isArray(value) ? value.map(String) : []);
    return (
      <div className={span}>
        <Label field={f} />
        <div className="flex flex-wrap gap-2">
          {f.options?.map((o) => (
            <label
              key={o}
              className="cursor-pointer rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500 has-[:checked]:text-white"
            >
              <input type="checkbox" name={name} value={o} defaultChecked={picked.has(o)} className="sr-only" />
              {o}
            </label>
          ))}
        </div>
        {f.hint && <p className="mt-1.5 text-xs text-slate-400">{f.hint}</p>}
      </div>
    );
  }

  if (f.kind === "select") {
    return (
      <div className={span}>
        <Label field={f} />
        <Select
          name={name}
          aria-label={f.label}
          options={f.options ?? []}
          defaultValue={value != null ? String(value) : ""}
        />
        {f.hint && <p className="mt-1.5 text-xs text-slate-400">{f.hint}</p>}
      </div>
    );
  }

  if (f.kind === "textarea") {
    return (
      <div className={span}>
        <Label field={f} />
        <textarea name={name} rows={3} defaultValue={value != null ? String(value) : ""} placeholder={f.placeholder} className={inp} />
        {f.hint && <p className="mt-1.5 text-xs text-slate-400">{f.hint}</p>}
      </div>
    );
  }

  // number / text / date. Liczby wpisujemy jako tekst, żeby przeszło „1 250 000"
  // i przecinek dziesiętny - serwer i tak normalizuje zapis.
  return (
    <div className={span}>
      <Label field={f} />
      <input
        name={name}
        type={f.kind === "date" ? "date" : "text"}
        inputMode={f.kind === "number" ? "decimal" : undefined}
        defaultValue={value != null && value !== false ? String(value) : ""}
        placeholder={f.placeholder}
        className={inp}
      />
      {f.hint && <p className="mt-1.5 text-xs text-slate-400">{f.hint}</p>}
    </div>
  );
}

function Label({ field: f }: { field: PropertyField }) {
  return (
    <label className="mb-1.5 block text-sm text-slate-500">
      {f.label}
      {f.unit && <span className="ml-1 text-xs text-slate-400">({f.unit})</span>}
    </label>
  );
}
