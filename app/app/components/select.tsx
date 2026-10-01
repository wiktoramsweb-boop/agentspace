"use client";

import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Lista wyboru z własnym wyglądem.
 *
 * Rozwiniętą listę zwykłego <select> rysuje system operacyjny, nie przeglądarka,
 * więc nie da się jej ostylować - na Macu wygląda jak Mac, na Windowsie jak
 * Windows i zawsze obok reszty aplikacji. Dlatego rysujemy ją sami.
 *
 * Trzy rzeczy, które trzeba tu było rozwiązać:
 * 1. Formularze. Wartość oddajemy ukrytym <input name=...>, więc wszystkie
 *    dotychczasowe `formData.get("status")` działają bez zmian.
 * 2. Przycinanie. Lista leci przez portal do <body> i pozycjonujemy ją na
 *    sztywno pod polem. Gdyby wisiała w drzewie, ucinałby ją każdy przewijany
 *    kontener - a kreator oferty jest właśnie takim kontenerem.
 * 3. Telefon. Poniżej 640 px lista wjeżdża od dołu ekranu jak arkusz, bo
 *    kciukiem łatwiej trafić w szeroki wiersz niż w listę przy polu.
 */

export type SelectOption = { value: string; label: string; hint?: string };

type Props = {
  /** Lista wprost, albo te same <option>, które miał natywny <select>. */
  options?: readonly SelectOption[] | readonly string[];
  children?: ReactNode;
  /** Nazwa pola w formularzu. Bez niej komponent działa tylko przez onChange. */
  name?: string;
  /** Tryb sterowany. Liczby przyjmujemy jak natywny <select>. */
  value?: string | number;
  defaultValue?: string | number | null;
  /** Kształt zdarzenia jak w natywnym <select>, żeby `e.target.value`
   *  w istniejących miejscach działało bez przepisywania. */
  onChange?: (e: { target: { value: string } }) => void;
  /** Pozycja „nic nie wybrano". Pusty string wyłącza ją. */
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** „onDark" dla pola stojącego na ciemnym pasku (zaznaczanie wielu pozycji). */
  tone?: "default" | "onDark";
  id?: string;
  "aria-label"?: string;
};

/** Pozwalamy podać zwykłe napisy, bo w słownikach pól wartość = etykieta. */
function normalize(options: NonNullable<Props["options"]>): SelectOption[] {
  return options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
}

/** Tekst z wnętrza <option>, także gdy sklejony z kilku kawałków. */
function textOf(node: ReactNode): string {
  if (node == null || node === false || node === true) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return "";
}

/** Czyta <option> z children, żeby podmiana natywnego <select> była samą zmianą nazwy. */
function fromChildren(children: ReactNode): SelectOption[] {
  const out: SelectOption[] = [];
  const walk = (node: ReactNode) => {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) return;
      if (child.type === "option") {
        const props = child.props as { value?: string | number; children?: ReactNode };
        const label = textOf(props.children);
        out.push({ value: props.value != null ? String(props.value) : label, label });
        return;
      }
      const props = child.props as { children?: ReactNode };
      if (props?.children) walk(props.children);
    });
  };
  walk(children);
  return out;
}

/** Przy długich słownikach (rodzaj budynku, ogrzewanie) szukanie oszczędza przewijanie. */
const SEARCH_FROM = 10;

export function Select({
  options,
  children,
  name,
  value,
  defaultValue,
  onChange,
  placeholder = "nie podano",
  disabled,
  className = "",
  tone = "default",
  id,
  "aria-label": ariaLabel,
}: Props) {
  const fromKids = options ? null : fromChildren(children);
  // Pozycja z pustą wartością pełni rolę „nic nie wybrano" - tak działała
  // w natywnym <select> i tak ma wyglądać dalej.
  const pusta = fromKids?.find((o) => o.value === "");
  const items = options ? normalize(options) : (fromKids ?? []).filter((o) => o.value !== "");
  const pozycjaPusta = options ? placeholder : (pusta?.label ?? "");
  const [own, setOwn] = useState<string>(
    defaultValue != null ? String(defaultValue) : options ? "" : (fromKids?.[0]?.value ?? ""),
  );
  const current = value !== undefined ? String(value) : own;
  const selected = items.find((o) => o.value === current);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [mobile, setMobile] = useState(false);

  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const visible = query
    ? items.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  function place() {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setRect(r);
  }

  function show() {
    if (disabled) return;
    setMobile(window.innerWidth < 640);
    place();
    setQuery("");
    setActive(Math.max(0, items.findIndex((o) => o.value === current)));
    setOpen(true);
  }

  function close(focusBack = true) {
    setOpen(false);
    if (focusBack) btnRef.current?.focus();
  }

  function pick(v: string) {
    if (value === undefined) setOwn(v);
    onChange?.({ target: { value: v } });
    close();
  }

  // Zamykanie kliknięciem obok i Escape, oraz podążanie za przewijaniem strony.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!popRef.current?.contains(t) && !btnRef.current?.contains(t)) close(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
    };
    const onMove = () => (mobile ? undefined : place());
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, mobile]); // eslint-disable-line react-hooks/exhaustive-deps

  function onTriggerKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      show();
    }
  }

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(visible.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(visible.length - 1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const o = visible[active];
      if (o) pick(o.value);
      else if (pozycjaPusta) pick("");
    }
  }

  const label = selected?.label ?? pozycjaPusta ?? placeholder;

  return (
    <>
      {name && <input type="hidden" name={name} value={current} />}
      <button
        ref={btnRef}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? close() : show())}
        onKeyDown={onTriggerKey}
        className={
          tone === "onDark"
            ? `flex w-full items-center justify-between gap-2 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-left text-sm text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50 ${
                open ? "ring-2 ring-emerald-400" : ""
              } ${className}`
            : `flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                open ? "border-emerald-500 ring-2 ring-emerald-500/15" : "border-slate-300 hover:border-slate-400"
              } ${selected ? "text-slate-900" : "text-slate-400"} ${className}`
        }
      >
        <span className="truncate">{label}</span>
        <svg
          className={`h-4 w-4 flex-shrink-0 transition ${tone === "onDark" ? "text-white/60" : "text-slate-400"} ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
        </svg>
      </button>

      {open && rect && typeof document !== "undefined" &&
        createPortal(
          // portal-dark na opakowaniu, a nie na samej liście: reguły ciemnego
          // motywu działają na potomkach, więc na tym samym elemencie nie
          // złapałyby ani obramowania, ani tła.
          <div className="portal-dark">
            {mobile && (
              <div className="fixed inset-0 z-[70] bg-slate-900/40" onClick={() => close(false)} />
            )}
            <div
              ref={popRef}
              role="listbox"
              tabIndex={-1}
              onKeyDown={onListKey}
              className={`z-[71] overflow-hidden border border-slate-200 bg-white shadow-xl ${
                mobile
                  ? "fixed inset-x-0 bottom-0 rounded-t-3xl pb-[env(safe-area-inset-bottom)]"
                  : "fixed rounded-2xl"
              }`}
              style={
                mobile
                  ? undefined
                  : {
                      left: rect.left,
                      width: Math.max(rect.width, 200),
                      // Pod polem, a gdy nie ma tam miejsca - nad nim.
                      top: rect.bottom + 6 + 288 > window.innerHeight && rect.top > 300 ? undefined : rect.bottom + 6,
                      bottom: rect.bottom + 6 + 288 > window.innerHeight && rect.top > 300 ? window.innerHeight - rect.top + 6 : undefined,
                    }
              }
            >
              {mobile && (
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
                  <span className="text-sm font-semibold text-slate-900">{ariaLabel ?? "Wybierz"}</span>
                  <button type="button" onClick={() => close()} className="text-sm font-medium text-slate-500">
                    Zamknij
                  </button>
                </div>
              )}

              {items.length >= SEARCH_FROM && (
                <div className="border-b border-slate-200 p-2">
                  {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
                  <input
                    autoFocus={!mobile}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                    onKeyDown={onListKey}
                    placeholder="Szukaj..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              <ul className={`overflow-y-auto overscroll-contain p-1.5 ${mobile ? "max-h-[55vh]" : "max-h-72"}`}>
                {pozycjaPusta && !query && (
                  <Row onPick={() => pick("")} selected={!selected} active={false} label={pozycjaPusta} muted />
                )}
                {visible.map((o, i) => (
                  <Row
                    key={o.value}
                    onPick={() => pick(o.value)}
                    selected={o.value === current}
                    active={i === active}
                    label={o.label}
                    hint={o.hint}
                  />
                ))}
                {!visible.length && (
                  <li className="px-3 py-6 text-center text-sm text-slate-400">Nic nie pasuje</li>
                )}
              </ul>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function Row({
  label, hint, selected, active, muted, onPick,
}: {
  label: string; hint?: string; selected: boolean; active: boolean; muted?: boolean; onPick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={selected}
        onClick={onPick}
        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition sm:py-2 ${
          selected
            ? "bg-emerald-500 font-medium text-white"
            : active
              ? "bg-slate-100 text-slate-900"
              : muted
                ? "text-slate-400 hover:bg-slate-100"
                : "text-slate-700 hover:bg-slate-100"
        }`}
      >
        <span className="min-w-0 flex-1 truncate">
          {label}
          {hint && <span className={`ml-1.5 text-xs ${selected ? "text-white/70" : "text-slate-400"}`}>{hint}</span>}
        </span>
        {selected && (
          <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
          </svg>
        )}
      </button>
    </li>
  );
}
