"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

const TEAM_SIZE_OPTIONS = [
  { value: "1-3", label: "1–3 agentów" },
  { value: "4-10", label: "4–10 agentów" },
  { value: "11-25", label: "11–25 agentów" },
  { value: "25+", label: "Powyżej 25 agentów" },
];

export function WaitlistForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [alreadyOnList, setAlreadyOnList] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: formData.get("email"),
      agencyName: formData.get("agencyName"),
      teamSize: formData.get("teamSize"),
      phone: formData.get("phone"),
      // honeypot
      website: formData.get("website"),
    };

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error ?? "Coś poszło nie tak. Spróbuj za chwilę.");
        setStatus("error");
        return;
      }

      if (data.alreadyOnList) {
        setAlreadyOnList(true);
      }
      setStatus("success");
    } catch {
      setErrorMessage("Brak połączenia. Sprawdź internet i spróbuj ponownie.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
          <svg
            className="h-6 w-6 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mb-2 text-xl font-semibold text-white">
          {alreadyOnList ? "Już jesteś na liście" : "Dziękujemy!"}
        </h3>
        <p className="text-zinc-400">
          {alreadyOnList
            ? "Ten email jest już zapisany. Odezwiemy się gdy AgentSpace będzie gotowy do testów."
            : "Jesteś na liście. Odezwiemy się jako pierwszy, gdy AgentSpace będzie gotowy do testów."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Honeypot — ukryte pole dla botów */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Zostaw puste</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-300">
          Email <span className="text-emerald-400">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="ty@twojebiuro.pl"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      <div>
        <label htmlFor="agencyName" className="mb-2 block text-sm font-medium text-zinc-300">
          Nazwa biura <span className="text-emerald-400">*</span>
        </label>
        <input
          id="agencyName"
          name="agencyName"
          type="text"
          required
          placeholder="Np. Spectra Nieruchomości"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      <div>
        <label htmlFor="teamSize" className="mb-2 block text-sm font-medium text-zinc-300">
          Wielkość zespołu <span className="text-emerald-400">*</span>
        </label>
        <select
          id="teamSize"
          name="teamSize"
          required
          defaultValue=""
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        >
          <option value="" disabled>
            Wybierz...
          </option>
          {TEAM_SIZE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="phone" className="mb-2 block text-sm font-medium text-zinc-300">
          Telefon <span className="text-zinc-600">(opcjonalnie, dla szybkiego kontaktu)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+48 600 000 000"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      {errorMessage && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-xl bg-emerald-500 px-6 py-4 font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "Wysyłam..." : "Dołącz do listy oczekujących"}
      </button>

      <p className="text-center text-xs text-zinc-500">
        Bez spamu. Powiadomimy Cię jako pierwszego, gdy będziemy gotowi.
      </p>
    </form>
  );
}
