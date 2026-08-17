"use client";

import { useState, useTransition } from "react";
import { useSpeechRecognition } from "@/lib/use-speech-recognition";
import { CLIENT_TYPES, type ClientType } from "@/lib/types";
import { createQuickEntry, type QuickEntryPayload } from "./actions";

type Parsed = {
  client_name?: string;
  phone?: string | null;
  client_type?: ClientType;
  address?: string | null;
  city?: string | null;
  create_property?: boolean;
  property_title?: string | null;
  note?: string;
};

export function QuickEntry() {
  const [transcript, setTranscript] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<QuickEntryPayload | null>(null);
  const [pending, startTransition] = useTransition();

  const { supported, listening, error: voiceError, toggle } = useSpeechRecognition((text, isFinal) => {
    if (isFinal) setTranscript((prev) => (prev ? prev.trim() + " " : "") + text.trim());
  });

  async function process() {
    if (!transcript.trim()) return;
    setParsing(true);
    setError(null);
    try {
      const res = await fetch("/api/quick-entry/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Nie udało się przetworzyć.");
      } else {
        const p: Parsed = data.data ?? {};
        setForm({
          clientName: p.client_name ?? "",
          phone: p.phone ?? "",
          clientType: (p.client_type as ClientType) ?? "sprzedajacy",
          address: p.address ?? "",
          city: p.city ?? "",
          createProperty: p.create_property ?? Boolean(p.address),
          propertyTitle: p.property_title ?? "",
          note: p.note ?? transcript,
        });
      }
    } catch {
      setError("Błąd połączenia.");
    } finally {
      setParsing(false);
    }
  }

  function set<K extends keyof QuickEntryPayload>(k: K, v: QuickEntryPayload[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  // ---- Krok 2: karta do zatwierdzenia ----
  if (form) {
    return (
      <div className="max-w-xl space-y-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-4 text-sm text-emerald-200">
          ✅ Rozpoznane. Sprawdź i popraw, potem zapisz do CRM.
        </div>

        <div className="rounded-2xl border border-zinc-700/60 bg-zinc-800/40 p-5 space-y-4">
          <Field label="Klient" value={form.clientName} onChange={(v) => set("clientName", v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefon" value={form.phone} onChange={(v) => set("phone", v)} placeholder="opcjonalnie" />
            <div>
              <label className={lbl}>Typ</label>
              <select
                value={form.clientType}
                onChange={(e) => set("clientType", e.target.value as ClientType)}
                className={inp}
              >
                {CLIENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Adres" value={form.address} onChange={(v) => set("address", v)} />
            <Field label="Miasto" value={form.city} onChange={(v) => set("city", v)} placeholder="Kraków" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={form.createProperty}
              onChange={(e) => set("createProperty", e.target.checked)}
              className="h-4 w-4 accent-emerald-500"
            />
            Dodaj też nieruchomość pod tym adresem (powiązaną z klientem)
          </label>
          <div>
            <label className={lbl}>Notatka</label>
            <textarea value={form.note} onChange={(e) => set("note", e.target.value)} rows={4} className={inp} />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => startTransition(() => createQuickEntry(form))}
            disabled={pending || !form.clientName.trim()}
            className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {pending ? "Zapisuję…" : "Zapisz do CRM"}
          </button>
          <button
            onClick={() => setForm(null)}
            className="rounded-xl border border-zinc-700 px-5 py-3 text-zinc-300 transition hover:bg-zinc-800"
          >
            Wróć
          </button>
        </div>
      </div>
    );
  }

  // ---- Krok 1: dyktowanie ----
  return (
    <div className="max-w-xl space-y-4">
      <div className="rounded-2xl border border-zinc-700/60 bg-zinc-800/40 p-5">
        <div className="mb-4 flex flex-col items-center gap-3 py-4">
          <button
            onClick={toggle}
            disabled={!supported}
            className={`flex h-20 w-20 items-center justify-center rounded-full transition disabled:opacity-40 ${
              listening ? "bg-red-500 text-white" : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
            }`}
          >
            {listening ? (
              <span className="relative flex h-4 w-4">
                <span className="absolute inset-0 animate-ping rounded-full bg-white opacity-75" />
                <span className="relative h-4 w-4 rounded-full bg-white" />
              </span>
            ) : (
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zm5 9a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
              </svg>
            )}
          </button>
          <p className="text-sm text-zinc-400">
            {listening ? "Słucham… mów naturalnie. Kliknij, by zakończyć." : "Kliknij i powiedz relację ze spotkania"}
          </p>
        </div>

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={5}
          placeholder='Np. "Dodaj spotkanie pozyskowe, Prądnicka 34/23, klient Marcin Dąbski, notatka: spotkanie ok, musi przegadać z żoną, prosił o podsumowanie na maila"'
          className={inp}
        />
        {voiceError && (
          <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">🎤 {voiceError}</p>
        )}
        {!supported && (
          <p className="mt-2 text-xs text-amber-400">
            Ta przeglądarka nie ma wbudowanego dyktowania. Na iPhone: dotknij pola tekstowego i użyj
            <strong> ikony mikrofonu na klawiaturze iOS</strong> (dyktowanie), potem „Przetwórz". Na komputerze - Chrome.
          </p>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <button
        onClick={process}
        disabled={parsing || !transcript.trim()}
        className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-60"
      >
        {parsing ? "Przetwarzam…" : "Przetwórz przez AI →"}
      </button>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inp} />
    </div>
  );
}
