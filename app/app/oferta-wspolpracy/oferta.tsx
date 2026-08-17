"use client";

import { useState } from "react";
import { useSpeechRecognition } from "@/lib/use-speech-recognition";
import { generateOfertaPdf, currentMiesiac, type OfertaValues } from "@/lib/oferta-pdf";

export function OfertaWspolpracy({
  defaultAgent,
  defaultTelefon,
}: {
  defaultAgent: string;
  defaultTelefon: string;
}) {
  const [values, setValues] = useState<OfertaValues>({
    adres: "",
    miesiac: currentMiesiac(),
    agent: defaultAgent,
    telefon: defaultTelefon,
    czas: "3 miesiące",
    prowizja: "2% brutto",
  });

  const [transcript, setTranscript] = useState("");
  const [parsing, setParsing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const { supported, listening, error: voiceError, toggle } = useSpeechRecognition((text, isFinal) => {
    if (isFinal) setTranscript((prev) => (prev ? prev.trim() + " " : "") + text.trim());
  });

  function set<K extends keyof OfertaValues>(k: K, v: OfertaValues[K]) {
    setValues((f) => ({ ...f, [k]: v }));
    setDone(false);
  }

  async function parseVoice() {
    if (!transcript.trim()) return;
    setParsing(true);
    setError(null);
    try {
      const res = await fetch("/api/oferta-wspolpracy/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Nie udało się przetworzyć.");
      } else {
        const p = (data.data ?? {}) as Partial<OfertaValues>;
        setValues((f) => ({
          ...f,
          adres: p.adres?.trim() || f.adres,
          czas: p.czas?.trim() || f.czas,
          prowizja: p.prowizja?.trim() || f.prowizja,
        }));
        setDone(false);
      }
    } catch {
      setError("Błąd połączenia.");
    } finally {
      setParsing(false);
    }
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const bytes = await generateOfertaPdf(values);
      // Uwaga: nowa kopia bajtów, żeby Blob dostał czysty ArrayBuffer.
      const blob = new Blob([bytes.slice()], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeAdres = values.adres.trim().replace(/[\\/:*?"<>|]/g, "-") || "Spectra";
      a.download = `Oferta wspolpracy - ${safeAdres}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setDone(true);
    } catch (e) {
      console.error(e);
      setError("Nie udało się wygenerować PDF. Odśwież stronę i spróbuj ponownie.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-xl space-y-5">
      {/* Dyktowanie (opcjonalne) */}
      <div className="rounded-2xl border border-zinc-700/60 bg-zinc-800/40 p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white">Podyktuj warunki (opcjonalnie)</p>
            <p className="text-xs text-zinc-500">
              np. „adres Prądnicka 48, czas 3 miesiące, prowizja 2%"
            </p>
          </div>
          <button
            onClick={toggle}
            disabled={!supported}
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full transition disabled:opacity-40 ${
              listening ? "bg-red-500 text-white" : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
            }`}
            aria-label={listening ? "Zakończ dyktowanie" : "Dyktuj"}
          >
            {listening ? (
              <span className="relative flex h-3 w-3">
                <span className="absolute inset-0 animate-ping rounded-full bg-white opacity-75" />
                <span className="relative h-3 w-3 rounded-full bg-white" />
              </span>
            ) : (
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zm5 9a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
              </svg>
            )}
          </button>
        </div>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={2}
          placeholder="Kliknij mikrofon i mów, albo wpisz tutaj i naciśnij „Wypełnij przez AI”."
          className={inp}
        />
        {voiceError && (
          <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">🎤 {voiceError}</p>
        )}
        {!supported && (
          <p className="mt-2 text-xs text-amber-400">
            Ta przeglądarka nie ma dyktowania. Na iPhone użyj ikony mikrofonu na klawiaturze iOS, na komputerze - Chrome. Możesz też po prostu wypełnić pola niżej ręcznie.
          </p>
        )}
        <button
          onClick={parseVoice}
          disabled={parsing || !transcript.trim()}
          className="mt-3 w-full rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
        >
          {parsing ? "Przetwarzam…" : "✨ Wypełnij przez AI"}
        </button>
      </div>

      {/* Formularz */}
      <div className="rounded-2xl border border-zinc-700/60 bg-zinc-800/40 p-5 space-y-4">
        <Field label="Adres nieruchomości" value={values.adres} onChange={(v) => set("adres", v)} placeholder="Prądnicka 48" hint='Bez „ul." - dodamy automatycznie.' />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Czas współpracy" value={values.czas} onChange={(v) => set("czas", v)} placeholder="3 miesiące" />
          <Field label="Prowizja" value={values.prowizja} onChange={(v) => set("prowizja", v)} placeholder="2% brutto" />
        </div>
        <Field label="Miesiąc (nagłówek)" value={values.miesiac} onChange={(v) => set("miesiac", v)} placeholder="LIPIEC 2026" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Agent" value={values.agent} onChange={(v) => set("agent", v)} placeholder="Imię i nazwisko" />
          <Field label="Telefon agenta" value={values.telefon} onChange={(v) => set("telefon", v)} placeholder="+48 500 600 700" />
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {done && !error && (
        <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          ✅ PDF pobrany. Sprawdź folder „Pobrane" i wyślij klientowi.
        </p>
      )}

      <button
        onClick={generate}
        disabled={generating}
        className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-60"
      >
        {generating ? "Generuję PDF…" : "Pobierz ofertę (PDF)"}
      </button>

      <p className="text-center text-xs text-zinc-600">
        Automatyczna wysyłka mailem do klienta będzie dostępna po weryfikacji domeny. Na razie: pobierz i wyślij samodzielnie.
      </p>
    </div>
  );
}

const lbl = "mb-1.5 block text-sm text-zinc-400";
const inp =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none";

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inp} />
      {hint && <p className="mt-1 text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}
