"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useToast } from "./toast";

type Wiadomosc = { role: "user" | "assistant"; content: string; linki?: { etykieta: string; href: string }[] };

const KLIENT = /^\/app\/klienci\/[0-9a-f-]{36}/;
const OFERTA = /^\/app\/nieruchomosci\/[0-9a-f-]{36}/;

function podpowiedzi(sciezka: string): { tytul: string; pytania: string[] } {
  if (KLIENT.test(sciezka)) {
    return {
      tytul: "Pytasz o tego klienta",
      pytania: ["Co dalej z tym klientem?", "Napisz follow-up na WhatsApp", "Jak odpowiedzieć, gdy mówi, że prowizja jest za wysoka?"],
    };
  }
  if (OFERTA.test(sciezka)) {
    return {
      tytul: "Pytasz o tę ofertę",
      pytania: ["Napisz opis tej oferty", "Wypisz mocne strony na prezentację", "Krótki post o tej ofercie na Facebooka"],
    };
  }
  return {
    tytul: "Pytaj albo każ mi coś zrobić",
    pytania: ["Od czego zacząć dzień?", "Dodaj klienta: Anna Nowak, 600 100 200, szuka 3 pokoi w Krakowie", "Wyceń mieszkanie z linku: wklej tu ogłoszenie"],
  };
}

/**
 * Pływający asystent AI na każdym ekranie aplikacji. Serwer sam dobiera
 * kontekst po adresie (karta klienta, oferta albo sprawy dnia), więc agent
 * nie musi niczego wklejać.
 */
export function AsystentAi({ userId }: { userId: string }) {
  const sciezka = usePathname();
  const router = useRouter();
  const toast = useToast();
  const klucz = `as_asystent_${userId}`;
  const [otwarty, setOtwarty] = useState(false);
  const [wiadomosci, setWiadomosci] = useState<Wiadomosc[]>([]);
  const [tekst, setTekst] = useState("");
  const [czeka, setCzeka] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  const dol = useRef<HTMLDivElement>(null);
  const pole = useRef<HTMLTextAreaElement>(null);

  // Historia zostaje w tej przeglądarce, żeby po przejściu na inny ekran rozmowa nie znikała.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(klucz);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setWiadomosci(JSON.parse(raw));
    } catch {
      /* brak pamięci przeglądarki */
    }
  }, [klucz]);

  useEffect(() => {
    try {
      localStorage.setItem(klucz, JSON.stringify(wiadomosci.slice(-30)));
    } catch {
      /* brak pamięci przeglądarki */
    }
    dol.current?.scrollIntoView({ block: "end" });
  }, [wiadomosci, klucz, czeka]);

  useEffect(() => {
    if (!otwarty) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOtwarty(false);
    document.addEventListener("keydown", esc);
    setTimeout(() => pole.current?.focus(), 50);
    return () => document.removeEventListener("keydown", esc);
  }, [otwarty]);

  // Na ekranie treningu AI Coach jest osobna rozmowa, drugi czat by mylił.
  if (sciezka.startsWith("/app/sesja")) return null;

  async function wyslij(tresc: string) {
    const t = tresc.trim();
    if (!t || czeka) return;
    const nowe: Wiadomosc[] = [...wiadomosci, { role: "user", content: t }];
    setWiadomosci(nowe);
    setTekst("");
    setBlad(null);
    setCzeka(true);
    try {
      const r = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wiadomosci: nowe.map(({ role, content }) => ({ role, content })), sciezka }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.text) throw new Error(d.error || "Nie udało się odpowiedzieć.");
      setWiadomosci((w) => [...w, { role: "assistant", content: d.text, linki: d.linki }]);
      if (d.przejdz) {
        router.push(d.przejdz);
        router.refresh();
        // Na telefonie czat zasłania cały ekran, a wynik jest pod spodem.
        if (window.innerWidth < 768) setOtwarty(false);
      }
    } catch (e) {
      setBlad(e instanceof Error ? e.message : "Nie udało się odpowiedzieć.");
    } finally {
      setCzeka(false);
    }
  }

  const { tytul, pytania } = podpowiedzi(sciezka);

  return (
    <>
      <button
        type="button"
        onClick={() => setOtwarty((v) => !v)}
        aria-label={otwarty ? "Zamknij asystenta" : "Asystent AI"}
        aria-expanded={otwarty}
        className="print-hide fixed right-4 bottom-[calc(84px+env(safe-area-inset-bottom))] z-[45] grid h-12 w-12 place-items-center rounded-full bg-slate-900 text-white shadow-xl shadow-slate-900/30 ring-1 ring-white/10 transition hover:scale-105 md:right-6 md:bottom-6 md:h-14 md:w-14"
      >
        {otwarty ? <IkonaX /> : <IkonaIskra />}
      </button>

      {otwarty && (
        <div
          role="dialog"
          aria-label="Asystent AI"
          className="print-hide fixed inset-x-0 bottom-0 top-[8dvh] z-[60] flex flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl md:inset-x-auto md:top-auto md:right-6 md:bottom-24 md:h-[min(620px,calc(100dvh-140px))] md:w-[400px] md:rounded-3xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-900">
                <IkonaIskra />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Asystent AI</p>
                <p className="text-[11px] text-slate-500">{tytul}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {wiadomosci.length > 0 && (
                <button type="button" onClick={() => setWiadomosci([])} className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100">
                  Nowa rozmowa
                </button>
              )}
              <button type="button" onClick={() => setOtwarty(false)} aria-label="Zamknij" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                <IkonaX />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {wiadomosci.length === 0 && (
              <div className="space-y-2">
                <p className="px-1 text-sm text-slate-500">Zapytaj albo każ coś zrobić: dodam klienta, wycenię mieszkanie z linku, dopiszę notatkę.</p>
                {pytania.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => wyslij(p)}
                    className="block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-left text-sm text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50/50"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            {wiadomosci.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-slate-900 px-3.5 py-2.5 text-sm whitespace-pre-wrap text-white">
                  {m.content}
                </div>
              ) : (
                <div key={i} className="group max-w-[92%]">
                  <div className="rounded-2xl rounded-bl-md bg-slate-100 px-3.5 py-2.5 text-sm whitespace-pre-wrap text-slate-800">{m.content}</div>
                  {m.linki?.map((l) => (
                    <Link key={l.href} href={l.href} className="mt-1.5 mr-1.5 inline-block rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                      {l.etykieta} →
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(m.content).then(() => toast("Skopiowano"))}
                    className="mt-1 px-1 text-[11px] font-medium text-slate-400 hover:text-slate-700"
                  >
                    Kopiuj
                  </button>
                </div>
              ),
            )}
            {czeka && (
              <div className="flex w-16 items-center justify-center gap-1 rounded-2xl rounded-bl-md bg-slate-100 py-3" aria-label="Asystent pisze">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            )}
            {blad && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{blad}</p>}
            <div ref={dol} />
          </div>

          <form
            className="flex items-end gap-2 border-t border-slate-200 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] md:pb-3"
            onSubmit={(e) => {
              e.preventDefault();
              wyslij(tekst);
            }}
          >
            <textarea
              ref={pole}
              value={tekst}
              onChange={(e) => setTekst(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  wyslij(tekst);
                }
              }}
              rows={1}
              maxLength={2000}
              placeholder="Napisz albo wklej link do ogłoszenia…"
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
            />
            <button
              type="submit"
              disabled={czeka || !tekst.trim()}
              className="h-11 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-40"
            >
              Wyślij
            </button>
          </form>
          <p className="px-4 pb-2 text-center text-[10px] text-slate-400 max-md:hidden">Każdy krok asystenta to 1 kredyt AI. Sprawdzaj fakty przed wysłaniem klientowi.</p>
        </div>
      )}
    </>
  );
}

function IkonaIskra() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.8 4.5 11 8a3 3 0 0 0 2 2l3.5 1.2L13 12.4a3 3 0 0 0-2 2L9.8 18l-1.2-3.6a3 3 0 0 0-2-2L3 11.2 6.6 10a3 3 0 0 0 2-2L9.8 4.5ZM18 3v4m2-2h-4m3 12v3m1.5-1.5h-3" />
    </svg>
  );
}

function IkonaX() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
