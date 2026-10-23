"use client";

import { useEffect, useRef, useState } from "react";
import { oczyscHtml, opisNaHtml, opisNaTekst } from "@/lib/opis-html";

type Polecenie = { cmd: string; tytul: string; skrot?: string; ikona: React.ReactNode };

const I = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const POLECENIA: (Polecenie | "|")[] = [
  { cmd: "undo", tytul: "Cofnij", skrot: "⌘Z", ikona: <I d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /> },
  { cmd: "redo", tytul: "Ponów", skrot: "⇧⌘Z", ikona: <I d="m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13" /> },
  "|",
  { cmd: "bold", tytul: "Pogrubienie", skrot: "⌘B", ikona: <span className="text-[15px] font-black">B</span> },
  { cmd: "italic", tytul: "Kursywa", skrot: "⌘I", ikona: <span className="font-serif text-[15px] italic">I</span> },
  { cmd: "underline", tytul: "Podkreślenie", skrot: "⌘U", ikona: <span className="text-[15px] underline">U</span> },
  "|",
  { cmd: "insertUnorderedList", tytul: "Lista punktowana", ikona: <I d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" /> },
  { cmd: "insertOrderedList", tytul: "Lista numerowana", ikona: <I d="M10 6h10M10 12h10M10 18h10M4 4v4M3 18h3l-3 3h3" /> },
  "|",
  { cmd: "removeFormat", tytul: "Usuń formatowanie", ikona: <I d="M4 7V4h16v3M9 20h6M12 4v16M3 21 21 3" /> },
];

/**
 * Edytor opisu oferty z pogrubieniem, kursywą, podkreśleniem i listami.
 *
 * Zwykłe pole edytowalne przeglądarki, bez biblioteki: skróty ⌘B, ⌘I, ⌘U
 * i cofanie działają natywnie. Wynik czyścimy do wąskiego zestawu znaczników
 * (lib/opis-html.ts) przy każdej zmianie i jeszcze raz na serwerze przy zapisie.
 * Wklejony tekst z Worda czy innej strony traci kolory, czcionki i linki.
 */
export function EdytorOpisu({ name, wartosc, limit = 8500, placeholder }: { name: string; wartosc?: string | null; limit?: number; placeholder?: string }) {
  const pole = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(() => opisNaHtml(wartosc ?? ""));
  const [aktywne, setAktywne] = useState<Record<string, boolean>>({});
  const znaki = opisNaTekst(html).length;

  useEffect(() => {
    if (pole.current) pole.current.innerHTML = opisNaHtml(wartosc ?? "");
    // Treść ustawiamy raz: kolejne zmiany robi przeglądarka, a nadpisywanie
    // innerHTML przy każdym znaku gubiłoby kursor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const naZaznaczenie = () => {
      if (!pole.current || !pole.current.contains(document.getSelection()?.anchorNode ?? null)) return;
      setAktywne({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
      });
    };
    document.addEventListener("selectionchange", naZaznaczenie);
    return () => document.removeEventListener("selectionchange", naZaznaczenie);
  }, []);

  const zapamietaj = () => setHtml(oczyscHtml(pole.current?.innerHTML ?? ""));

  function wykonaj(cmd: string) {
    pole.current?.focus();
    document.execCommand(cmd, false);
    zapamietaj();
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-sm text-slate-500">Opis oferty</label>
        <span className={`text-xs tabular-nums ${znaki > limit * 0.9 ? "font-semibold text-amber-600" : "text-slate-400"}`}>
          {znaki} / {limit}
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15">
        <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
          {POLECENIA.map((p, i) =>
            p === "|" ? (
              <span key={i} className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />
            ) : (
              <button
                key={p.cmd}
                type="button"
                title={p.skrot ? `${p.tytul} (${p.skrot})` : p.tytul}
                aria-label={p.tytul}
                aria-pressed={aktywne[p.cmd] ?? false}
                // mousedown zamiast click: kliknięcie nie zabiera zaznaczenia z pola tekstu.
                onMouseDown={(e) => {
                  e.preventDefault();
                  wykonaj(p.cmd);
                }}
                className={`grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-white hover:text-slate-900 ${aktywne[p.cmd] ? "bg-white text-emerald-700 shadow-sm" : ""}`}
              >
                {p.ikona}
              </button>
            ),
          )}
        </div>
        <div
          ref={pole}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Opis oferty"
          data-placeholder={placeholder}
          onInput={zapamietaj}
          onBlur={zapamietaj}
          // Safari i część Chrome'ów na macOS nie robią ⌘B w contentEditable same z siebie.
          onKeyDown={(e) => {
            if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
            const cmd = ({ b: "bold", i: "italic", u: "underline" } as Record<string, string>)[e.key.toLowerCase()];
            if (!cmd) return;
            e.preventDefault();
            wykonaj(cmd);
          }}
          onPaste={(e) => {
            e.preventDefault();
            const wklejone = e.clipboardData.getData("text/html");
            const tekst = e.clipboardData.getData("text/plain");
            const czyste = wklejone ? oczyscHtml(wklejone) : tekst.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!).replace(/\n/g, "<br>");
            document.execCommand("insertHTML", false, czyste);
            zapamietaj();
          }}
          className="opis-edytor min-h-[260px] max-h-[460px] overflow-y-auto px-4 py-3 text-[15px] leading-7 text-slate-800 outline-none"
        />
      </div>
      <input type="hidden" name={name} value={html} />
      <p className="mt-1 text-xs text-slate-400">Formatowanie (pogrubienie, listy) przechodzi na stronę biura i na Otodom.</p>
    </div>
  );
}
