"use client";

import { useEffect, useRef, useState } from "react";

type Wiadomosc = { role: "user" | "assistant"; content: string };

/**
 * Czat na stronie biura.
 *
 * Nie wyskakuje sam od razu. Dymek pojawia się po chwili, bo okno otwierające
 * się w twarz przy wejściu wygania ludzi szybciej, niż cokolwiek im sprzedaje.
 * Rozmowa zostaje w pamięci karty, więc odświeżenie strony nie kasuje wątku.
 */
export function CzatStrony({ slug, nazwaBiura }: { slug: string; nazwaBiura: string }) {
  const [otwarty, setOtwarty] = useState(false);
  const [zachetaWidoczna, setZachetaWidoczna] = useState(false);
  const [wiadomosci, setWiadomosci] = useState<Wiadomosc[]>([]);
  const [tekst, setTekst] = useState("");
  const [czeka, setCzeka] = useState(false);
  const [zapisany, setZapisany] = useState(false);
  const pulapka = useRef<HTMLInputElement>(null);
  const dol = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setZachetaWidoczna(true), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    dol.current?.scrollIntoView({ behavior: "smooth" });
  }, [wiadomosci, czeka]);

  function otworz() {
    setOtwarty(true);
    setZachetaWidoczna(false);
    if (wiadomosci.length === 0) {
      setWiadomosci([
        {
          role: "assistant",
          content: `Dzień dobry, tu ${nazwaBiura}. Szukacie czegoś dla siebie czy raczej myślicie o sprzedaży?`,
        },
      ]);
    }
  }

  async function wyslij() {
    const tresc = tekst.trim();
    if (!tresc || czeka) return;

    const nowe: Wiadomosc[] = [...wiadomosci, { role: "user", content: tresc }];
    setWiadomosci(nowe);
    setTekst("");
    setCzeka(true);

    try {
      const r = await fetch("/api/strona/czat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, wiadomosci: nowe, website: pulapka.current?.value ?? "" }),
      });
      const dane = await r.json();
      setWiadomosci((w) => [
        ...w,
        { role: "assistant", content: dane.odpowiedz ?? "Napiszcie proszę przez formularz kontaktowy." },
      ]);
      if (dane.zapisany) setZapisany(true);
    } catch {
      setWiadomosci((w) => [
        ...w,
        { role: "assistant", content: "Coś z połączeniem. Zadzwońcie proszę albo napiszcie przez formularz." },
      ]);
    } finally {
      setCzeka(false);
    }
  }

  return (
    <>
      {!otwarty && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
          {zachetaWidoczna && (
            <button
              type="button"
              onClick={otworz}
              className="max-w-[240px] rounded-2xl rounded-br-sm bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-xl ring-1 ring-black/5"
            >
              Mogę w czymś pomóc? Odpowiadam od ręki.
            </button>
          )}
          <button
            type="button"
            onClick={otworz}
            aria-label="Otwórz czat"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl transition hover:bg-slate-700"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1Z" />
            </svg>
          </button>
        </div>
      )}

      {otwarty && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[min(70vh,520px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{nazwaBiura}</p>
              <p className="text-xs text-slate-500">Zwykle odpowiadamy od razu</p>
            </div>
            <button
              type="button"
              onClick={() => setOtwarty(false)}
              aria-label="Zamknij czat"
              className="text-slate-400 transition hover:text-slate-900"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {wiadomosci.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto rounded-br-sm bg-slate-900 text-white"
                    : "rounded-bl-sm bg-slate-100 text-slate-800"
                }`}
              >
                {m.content}
              </div>
            ))}
            {czeka && (
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-slate-100 px-3.5 py-3">
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: `${i * 120}ms` }}
                    />
                  ))}
                </span>
              </div>
            )}
            {zapisany && (
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                Mamy Wasz numer, agent oddzwoni.
              </p>
            )}
            <div ref={dol} />
          </div>

          <div className="border-t border-slate-200 p-3">
            {/* Pułapka na roboty: człowiek tego pola nie widzi. */}
            <input
              ref={pulapka}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] h-0 w-0"
            />
            <div className="flex gap-2">
              <input
                value={tekst}
                onChange={(e) => setTekst(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void wyslij();
                }}
                maxLength={600}
                placeholder="Napisz wiadomość..."
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void wyslij()}
                disabled={czeka || !tekst.trim()}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40"
              >
                Wyślij
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-slate-400">
              Rozmawiasz z asystentem. Zostaw numer, a oddzwoni człowiek.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
