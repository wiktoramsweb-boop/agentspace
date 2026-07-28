"use client";

import { useState } from "react";

const TYPES = [
  { value: "raport", label: "Raport z działań", desc: "Podsumowanie sprzedaży/marketingu dla właściciela" },
  { value: "podsumowanie", label: "Podsumowanie spotkania + umowa", desc: "Po spotkaniu, ze wzorem umowy" },
  { value: "propozycja", label: "Propozycja współpracy", desc: "Oferta + warunki + wycena" },
  { value: "obiekcje", label: "Odpowiedź na obiekcje / negocjacja", desc: "Np. za wysoka prowizja, cena" },
  { value: "followup", label: "Follow-up / odświeżenie", desc: "Delikatne przypomnienie się klientowi" },
  { value: "niezadowolenie", label: "Niezadowolony właściciel", desc: "Spokojna, dojrzała odpowiedź + plan" },
  { value: "ogolny", label: "Inny / własny", desc: "Dowolny profesjonalny mail w tonie Spectry" },
] as const;

const PLACEHOLDERS: Record<string, string> = {
  raport:
    "Np.: 11 dni po publikacji, 320 wyświetleń na Otodom, 0 zapytań o prezentację. Uruchomiliśmy wyróżnienie oferty. Plan: reset oferty, outreach do 3 klientów z zeszłego miesiąca, kampania social.",
  podsumowanie: "Np.: piątkowe spotkanie, mieszkanie ul. Słońskiego, załączam podsumowanie i wzór umowy. Czas i prowizja do dogadania.",
  propozycja:
    "Np.: umowa na wyłączność 3 mies., prowizja 3% brutto, cena startowa 679 000 zł, wartość rynkowa ~533 tys. wg analizy. Pełna obsługa: zdjęcia, dron, kampanie, negocjacje.",
  obiekcje: "Np.: klient uważa prowizję 3% za wysoką, proponuje 2,5%. Chcę utrzymać relację i pokazać otwartość na dialog.",
  followup: "Np.: klient oglądał mieszkanie 2 tyg. temu, wahał się przez brak parkingu. Info: pojawiło się miejsce postojowe w garażu.",
  niezadowolenie:
    "Np.: właściciel niezadowolony brakiem postępów, grozi wypowiedzeniem umowy. Fakty: kilkanaście prezentacji, 3 oferty 680-685 tys., jego cena min. 720 tys. Plan: reset oferty, outreach, cotygodniowy raport.",
  ogolny: "Opisz o co chodzi i jakie fakty przekazać.",
};

type Result = { subject: string; body: string };

export function MailGenerator({ defaultSignature }: { defaultSignature: string }) {
  const [type, setType] = useState<string>("raport");
  const [recipient, setRecipient] = useState("");
  const [property, setProperty] = useState("");
  const [length, setLength] = useState("standard");
  const [facts, setFacts] = useState("");
  const [signature, setSignature] = useState(defaultSignature);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch("/api/maile/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, recipient, property, facts, length, signature }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Nie udało się wygenerować.");
      else setResult(data.data as Result);
    } catch {
      setError("Błąd połączenia.");
    } finally {
      setLoading(false);
    }
  }

  async function copyBody() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Nie udało się skopiować — zaznacz i skopiuj ręcznie.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      {/* Formularz */}
      <div className="space-y-4">
        <div>
          <label className={lbl}>Typ maila</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`rounded-xl border p-3 text-left transition ${
                  type === t.value
                    ? "border-emerald-500/60 bg-emerald-500/10"
                    : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                }`}
              >
                <p className="text-sm font-medium text-white">{t.label}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Do kogo</label>
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Pan Marcin / Pani Kamila"
              className={inp}
            />
          </div>
          <div>
            <label className={lbl}>Nieruchomość / temat</label>
            <input
              value={property}
              onChange={(e) => setProperty(e.target.value)}
              placeholder="np. mieszkanie ul. Słomczyńskiego"
              className={inp}
            />
          </div>
        </div>

        <div>
          <label className={lbl}>Co przekazać / fakty (AI użyje tylko tego — nie wymyśli liczb)</label>
          <textarea
            value={facts}
            onChange={(e) => setFacts(e.target.value)}
            rows={7}
            placeholder={PLACEHOLDERS[type]}
            className={inp}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Długość</label>
            <select value={length} onChange={(e) => setLength(e.target.value)} className={inp}>
              <option value="krotki">Krótki</option>
              <option value="standard">Standardowy</option>
              <option value="szczegolowy">Szczegółowy</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Podpis</label>
            <input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Imię i nazwisko" className={inp} />
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        <button
          onClick={generate}
          disabled={loading}
          className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? "Piszę maila…" : result ? "✨ Napisz od nowa" : "✨ Napisz maila"}
        </button>
      </div>

      {/* Wynik */}
      <div>
        {!result ? (
          <div className="flex h-full min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-8 text-center">
            <p className="text-sm text-zinc-500">
              Wybierz typ, wpisz fakty i kliknij „Napisz maila".<br />
              Gotowy mail pojawi się tutaj — do edycji i skopiowania.
            </p>
          </div>
        ) : (
          <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div>
              <label className={lbl}>Temat</label>
              <input
                value={result.subject}
                onChange={(e) => setResult({ ...result, subject: e.target.value })}
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Treść (możesz edytować)</label>
              <textarea
                value={result.body}
                onChange={(e) => setResult({ ...result, body: e.target.value })}
                rows={18}
                className={`${inp} leading-relaxed`}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={copyBody}
                className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
              >
                {copied ? "✓ Skopiowano" : "Kopiuj treść"}
              </button>
            </div>
            <p className="text-xs text-zinc-600">
              Sprawdź maila przed wysłaniem — zwłaszcza liczby i miejsca w [nawiasach] do uzupełnienia. Wklej do Gmaila i wyślij.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const lbl = "mb-1.5 block text-sm text-zinc-400";
const inp =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none";
