"use client";

import { useState } from "react";

type Kind = "followup" | "objection" | "summary" | "custom";

export function AiWriter({
  kind,
  clientName,
  presetContext,
  buttonLabel,
  title,
  placeholder,
}: {
  kind: Kind;
  clientName?: string;
  presetContext?: string;
  buttonLabel: string;
  title: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState(presetContext ?? "");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/assistant/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, context, clientName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Błąd generowania.");
        return;
      }
      setResult(data.text ?? "");
    } catch {
      setError("Brak połączenia.");
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-500/20"
      >
        ✨ {buttonLabel}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/80 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-700 bg-zinc-900 p-6 md:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <span className="text-violet-400">✨</span> {title}
          </h2>
          <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
        </div>

        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={3}
          placeholder={placeholder ?? "Dodaj kontekst..."}
          className="mb-3 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
        />

        <button
          onClick={generate}
          disabled={loading}
          className="mb-4 w-full rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:opacity-60"
        >
          {loading ? "Piszę..." : result ? "Napisz jeszcze raz" : "Napisz"}
        </button>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        {result && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-4">
            <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">{result}</p>
            <button
              onClick={copy}
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700"
            >
              {copied ? "✓ Skopiowano" : "Kopiuj"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
