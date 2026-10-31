"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MIESIACE = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
const MIESIACE_D = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
const DNI = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

const klucz = (r: number, m: number, d: number) => `${r}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const czesci = (k: string) => k.split("-").map(Number);
const dzis = () => {
  const d = new Date();
  return klucz(d.getFullYear(), d.getMonth(), d.getDate());
};

type Props = {
  name?: string;
  id?: string;
  value?: string;
  defaultValue?: string | null;
  /** Kształt zdarzenia jak w <input>, żeby podmiana była samą zmianą nazwy. */
  onChange?: (e: { target: { value: string } }) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  "aria-label"?: string;
};

/**
 * Pole daty w wyglądzie aplikacji zamiast systemowego kalendarza.
 * Wartość to „RRRR-MM-DD”, jak w <input type="date">. Lista leci przez portal,
 * bo okna i przewijane karty ucinałyby ją, a na telefonie wyjeżdża od dołu.
 */
export function PoleDaty({ name, id, value, defaultValue, onChange, min, max, placeholder = "Wybierz datę", disabled, "aria-label": aria }: Props) {
  const [wlasna, setWlasna] = useState(defaultValue ?? "");
  const biezaca = value !== undefined ? value : wlasna;
  const [otwarte, setOtwarte] = useState(false);
  const [poz, setPoz] = useState({ left: 0, top: 0 });
  const [widok, setWidok] = useState({ r: 0, m: 0 });
  const przycisk = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLDivElement>(null);

  function otworz() {
    const start = biezaca || dzis();
    const [r, m] = czesci(start);
    setWidok({ r, m: m - 1 });
    const b = przycisk.current?.getBoundingClientRect();
    if (b) {
      const szer = 304, wys = 360;
      setPoz({ left: Math.max(8, Math.min(b.left, window.innerWidth - szer - 8)), top: b.bottom + wys + 8 > window.innerHeight ? Math.max(8, b.top - wys - 6) : b.bottom + 6 });
    }
    setOtwarte(true);
  }

  useEffect(() => {
    if (!otwarte) return;
    const zamknij = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!lista.current?.contains(t) && !przycisk.current?.contains(t)) setOtwarte(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOtwarte(false);
    const przewin = (e: Event) => {
      if (!lista.current?.contains(e.target as Node)) setOtwarte(false);
    };
    document.addEventListener("mousedown", zamknij);
    document.addEventListener("keydown", esc);
    window.addEventListener("scroll", przewin, true);
    return () => {
      document.removeEventListener("mousedown", zamknij);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", przewin, true);
    };
  }, [otwarte]);

  function wybierz(k: string) {
    setWlasna(k);
    onChange?.({ target: { value: k } });
    setOtwarte(false);
  }

  const zmienMiesiac = (o: number) =>
    setWidok((w) => {
      const d = new Date(w.r, w.m + o, 1);
      return { r: d.getFullYear(), m: d.getMonth() };
    });

  const pierwszy = (new Date(widok.r, widok.m, 1).getDay() + 6) % 7;
  const ile = new Date(widok.r, widok.m + 1, 0).getDate();
  const komorki: (number | null)[] = [...Array(pierwszy).fill(null), ...Array.from({ length: ile }, (_, i) => i + 1)];
  const tekst = biezaca ? `${czesci(biezaca)[2]} ${MIESIACE_D[czesci(biezaca)[1] - 1]} ${czesci(biezaca)[0]}` : "";
  const dzisK = dzis();

  return (
    <>
      {name && <input type="hidden" name={name} value={biezaca} />}
      <button
        ref={przycisk}
        id={id}
        type="button"
        disabled={disabled}
        aria-label={aria}
        aria-haspopup="dialog"
        aria-expanded={otwarte}
        onClick={() => (otwarte ? setOtwarte(false) : otworz())}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-left text-sm text-slate-900 transition hover:border-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 disabled:opacity-50"
      >
        <span className={tekst ? "truncate" : "truncate text-slate-400"}>{tekst || placeholder}</span>
        <svg className="h-4 w-4 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v3m8-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
        </svg>
      </button>
      {otwarte &&
        createPortal(
          <div className="portal-dark">
            <div
              ref={lista}
              role="dialog"
              aria-label="Wybór daty"
              className="fixed z-[120] w-[304px] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
              style={{ left: poz.left, top: poz.top }}
            >
              <div className="mb-2 flex items-center justify-between gap-1">
                <button type="button" aria-label="Poprzedni miesiąc" onClick={() => zmienMiesiac(-1)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-slate-100">
                  ‹
                </button>
                <span className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                  {MIESIACE[widok.m]}
                  <button type="button" aria-label="Poprzedni rok" onClick={() => zmienMiesiac(-12)} className="rounded px-1 text-slate-400 hover:bg-slate-100">
                    «
                  </button>
                  {widok.r}
                  <button type="button" aria-label="Następny rok" onClick={() => zmienMiesiac(12)} className="rounded px-1 text-slate-400 hover:bg-slate-100">
                    »
                  </button>
                </span>
                <button type="button" aria-label="Następny miesiąc" onClick={() => zmienMiesiac(1)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-slate-100">
                  ›
                </button>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center">
                {DNI.map((d) => (
                  <span key={d} className="py-1 text-[11px] font-semibold text-slate-400">
                    {d}
                  </span>
                ))}
                {komorki.map((d, i) => {
                  if (d == null) return <span key={`p${i}`} />;
                  const k = klucz(widok.r, widok.m, d);
                  const zablokowany = Boolean((min && k < min) || (max && k > max));
                  return (
                    <button
                      key={k}
                      type="button"
                      disabled={zablokowany}
                      aria-pressed={k === biezaca}
                      onClick={() => wybierz(k)}
                      className={`h-9 rounded-lg text-sm tabular-nums transition disabled:opacity-30 ${k === biezaca ? "bg-emerald-600 font-bold text-white" : k === dzisK ? "bg-emerald-50 font-semibold text-emerald-700 hover:bg-emerald-100" : "text-slate-700 hover:bg-slate-100"}`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-sm font-medium">
                <button type="button" onClick={() => wybierz(dzisK)} className="rounded-lg px-2 py-1 text-emerald-700 hover:bg-emerald-50">
                  Dziś
                </button>
                <button type="button" onClick={() => wybierz("")} className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100">
                  Wyczyść
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
