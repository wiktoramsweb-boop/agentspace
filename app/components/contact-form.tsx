"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

const TOPIC_OPTIONS = [
  { value: "pilotaz", label: "Chcę dołączyć do pilotażu" },
  { value: "demo", label: "Pokażcie mi demo" },
  { value: "wspolpraca", label: "Propozycja współpracy" },
  { value: "media", label: "Kontakt mediowy" },
  { value: "inne", label: "Inny temat" },
];

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      agency: formData.get("agency"),
      topic: formData.get("topic"),
      message: formData.get("message"),
      website: formData.get("website"), // honeypot
    };

    try {
      const response = await fetch("/api/contact", {
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
        <h3 className="mb-2 text-xl font-semibold text-white">Dziękujemy!</h3>
        <p className="text-zinc-400">
          Otrzymaliśmy wiadomość. Odpowiemy w ciągu 24 godzin w dni robocze.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Honeypot */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website-contact">Zostaw puste</label>
        <input
          id="website-contact"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-zinc-300">
            Imię i nazwisko <span className="text-emerald-400">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Jan Kowalski"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
            placeholder="jan@biuro.pl"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
      </div>

      <div>
        <label htmlFor="agency" className="mb-2 block text-sm font-medium text-zinc-300">
          Nazwa biura nieruchomości{" "}
          <span className="text-zinc-600">(opcjonalnie)</span>
        </label>
        <input
          id="agency"
          name="agency"
          type="text"
          placeholder="Np. Spectra Nieruchomości"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      <div>
        <label htmlFor="topic" className="mb-2 block text-sm font-medium text-zinc-300">
          Temat <span className="text-emerald-400">*</span>
        </label>
        <select
          id="topic"
          name="topic"
          required
          defaultValue=""
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        >
          <option value="" disabled>
            Wybierz temat...
          </option>
          {TOPIC_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-medium text-zinc-300">
          Wiadomość <span className="text-emerald-400">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          minLength={10}
          placeholder="W czym możemy pomóc?"
          className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
        {status === "submitting" ? "Wysyłam..." : "Wyślij wiadomość"}
      </button>

      <p className="text-center text-xs text-zinc-500">
        Klikając wysyłam akceptujesz{" "}
        <a href="/polityka-prywatnosci" className="text-zinc-400 underline hover:text-emerald-400">
          politykę prywatności
        </a>
        .
      </p>
    </form>
  );
}
