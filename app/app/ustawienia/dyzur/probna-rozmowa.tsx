"use client";

import { useEffect, useRef, useState } from "react";

type Wiadomosc = { role: "user" | "assistant"; content: string };
type Rozpoznawanie = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

/**
 * Próbna rozmowa z Dyżurem AI w przeglądarce: mówisz do mikrofonu (albo
 * piszesz), AI odpowiada głosem. Ten sam mózg co w telefonie, bez zapisu leada.
 */
export function ProbnaRozmowa({ powitanie }: { powitanie: string }) {
  const [rozmowa, setRozmowa] = useState<Wiadomosc[]>([]);
  const [dane, setDane] = useState<{ imie: string | null; potrzeba: string | null; koniec: boolean } | null>(null);
  const [slucha, setSlucha] = useState(false);
  const [czeka, setCzeka] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  const [tekst, setTekst] = useState("");
  const rozp = useRef<Rozpoznawanie | null>(null);
  const [maMikrofon, setMaMikrofon] = useState(false);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => Rozpoznawanie; webkitSpeechRecognition?: new () => Rozpoznawanie };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMaMikrofon(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
    return () => {
      rozp.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  function powiedz(t: string) {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "pl-PL";
    const glos = s.getVoices().find((v) => v.lang.toLowerCase().startsWith("pl"));
    if (glos) u.voice = glos;
    s.speak(u);
  }

  function zacznij() {
    const start: Wiadomosc[] = [{ role: "assistant", content: powitanie }];
    setRozmowa(start);
    setDane(null);
    setBlad(null);
    powiedz(powitanie);
  }

  async function wyslij(t: string) {
    const tresc = t.trim();
    if (!tresc || czeka) return;
    const nowe: Wiadomosc[] = [...(rozmowa.length ? rozmowa : [{ role: "assistant" as const, content: powitanie }]), { role: "user", content: tresc }];
    setRozmowa(nowe);
    setTekst("");
    setCzeka(true);
    setBlad(null);
    try {
      // API zaczyna rozmowę od wypowiedzi dzwoniącego: powitanie wysyłamy jako kontekst w pierwszej linii.
      const doApi = nowe[0].role === "assistant" ? [{ role: "user" as const, content: "(połączenie odebrane)" }, ...nowe] : nowe;
      const r = await fetch("/api/dyzur/symulacja", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wiadomosci: doApi }) });
      const d = await r.json();
      if (!r.ok || !d.odpowiedz) throw new Error(d.error || "Brak odpowiedzi");
      setRozmowa((x) => [...x, { role: "assistant", content: d.odpowiedz }]);
      setDane({ imie: d.imie, potrzeba: d.potrzeba, koniec: d.koniec });
      powiedz(d.odpowiedz);
    } catch (e) {
      setBlad(e instanceof Error ? e.message : "Nie udało się");
    } finally {
      setCzeka(false);
    }
  }

  function mikrofon() {
    if (slucha) {
      rozp.current?.stop();
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => Rozpoznawanie; webkitSpeechRecognition?: new () => Rozpoznawanie };
    const R = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!R) return;
    window.speechSynthesis?.cancel();
    const r = new R();
    r.lang = "pl-PL";
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (e) => {
      const t = Array.from(e.results).map((x) => x[0].transcript).join(" ");
      wyslij(t);
    };
    r.onend = () => setSlucha(false);
    r.onerror = () => setSlucha(false);
    rozp.current = r;
    setSlucha(true);
    r.start();
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Próbna rozmowa</h3>
          <p className="text-sm text-slate-500">Zadzwoń do swojego Dyżuru w przeglądarce. Nic się nie zapisuje, liczą się tylko kredyty AI.</p>
        </div>
        <button type="button" onClick={zacznij} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          {rozmowa.length ? "Od nowa" : "Odbierz telefon"}
        </button>
      </div>

      {rozmowa.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="max-h-80 space-y-2 overflow-y-auto rounded-2xl bg-slate-50 p-3">
              {rozmowa.map((m, i) => (
                <p
                  key={i}
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${m.role === "assistant" ? "bg-white text-slate-800 ring-1 ring-slate-200" : "ml-auto bg-emerald-500 text-white"}`}
                >
                  {m.content}
                </p>
              ))}
              {czeka && <p className="text-xs text-slate-400">Dyżur AI myśli…</p>}
            </div>
            {!dane?.koniec && (
              <div className="mt-3 flex gap-2">
                {maMikrofon && (
                  <button
                    type="button"
                    onClick={mikrofon}
                    disabled={czeka}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${slucha ? "bg-rose-500 text-white" : "bg-emerald-500 text-white hover:bg-emerald-400"}`}
                  >
                    {slucha ? "Słucham… (stop)" : "Mów"}
                  </button>
                )}
                <form
                  className="flex flex-1 gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    wyslij(tekst);
                  }}
                >
                  <input
                    value={tekst}
                    onChange={(e) => setTekst(e.target.value)}
                    placeholder="Albo napisz, co mówi dzwoniący"
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <button type="submit" disabled={czeka || !tekst.trim()} className="rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 disabled:opacity-40">
                    Wyślij
                  </button>
                </form>
              </div>
            )}
            {blad && <p className="mt-2 text-sm text-red-600">{blad}</p>}
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 text-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Tak wyglądałby lead</p>
            <p>
              <span className="text-slate-500">Imię:</span> <b>{dane?.imie ?? "jeszcze nie padło"}</b>
            </p>
            <p className="mt-1">
              <span className="text-slate-500">Sprawa:</span> {dane?.potrzeba ?? "jeszcze nie wiadomo"}
            </p>
            <p className="mt-1">
              <span className="text-slate-500">Telefon:</span> numer dzwoniącego (w próbie przykładowy)
            </p>
            {dane?.koniec && <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 font-medium text-emerald-700">Rozmowa zakończona. W prawdziwym połączeniu lead jest już w Leadach.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
