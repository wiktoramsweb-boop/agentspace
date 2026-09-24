"use client";

import { getDict, localeHref, toLocale } from "@/lib/i18n";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";


export function ContactForm({ lang = "pl" }: { lang?: string }) {
  const locale = toLocale(lang);
  const t = getDict(locale).form;
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
        setErrorMessage(data.error ?? t.genericError);
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMessage(t.offlineError);
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
        <h3 className="mb-2 text-xl font-semibold text-[var(--color-mk-text)]">{t.successTitle}</h3>
        <p className="text-[var(--color-mk-muted)]">
          {t.successBody}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Honeypot */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website-contact">{t.honeypot}</label>
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
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-[var(--color-mk-text)]">
            {t.name} <span className="text-emerald-400">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder={t.namePlaceholder}
            className="w-full rounded-xl border border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] px-4 py-3 text-[var(--color-mk-text)] placeholder:text-[var(--color-mk-muted)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-[var(--color-mk-text)]">
            {t.email} <span className="text-emerald-400">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder={t.emailPlaceholder}
            className="w-full rounded-xl border border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] px-4 py-3 text-[var(--color-mk-text)] placeholder:text-[var(--color-mk-muted)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
      </div>

      <div>
        <label htmlFor="agency" className="mb-2 block text-sm font-medium text-[var(--color-mk-text)]">
          {t.agency}{" "}
          <span className="text-[var(--color-mk-muted)]">{t.optional}</span>
        </label>
        <input
          id="agency"
          name="agency"
          type="text"
          placeholder={t.agencyPlaceholder}
          className="w-full rounded-xl border border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] px-4 py-3 text-[var(--color-mk-text)] placeholder:text-[var(--color-mk-muted)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      <div>
        <label htmlFor="topic" className="mb-2 block text-sm font-medium text-[var(--color-mk-text)]">
          {t.topic} <span className="text-emerald-400">*</span>
        </label>
        <select
          id="topic"
          name="topic"
          required
          defaultValue=""
          className="w-full rounded-xl border border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] px-4 py-3 text-[var(--color-mk-text)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        >
          <option value="" disabled>
            {t.topicPlaceholder}
          </option>
          {t.topics.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-medium text-[var(--color-mk-text)]">
          {t.message} <span className="text-emerald-400">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          minLength={10}
          placeholder={t.messagePlaceholder}
          className="w-full resize-y rounded-xl border border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] px-4 py-3 text-[var(--color-mk-text)] placeholder:text-[var(--color-mk-muted)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
        className="w-full rounded-xl bg-emerald-500 px-6 py-4 font-semibold text-[var(--mk-on-accent)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? t.submitting : t.submit}
      </button>

      <p className="text-center text-xs text-[var(--color-mk-muted)]">
        {t.consentBefore}
        <a
          href={localeHref(locale, "/polityka-prywatnosci")}
          className="text-[var(--color-mk-muted)] underline hover:text-emerald-400"
        >
          {t.consentLink}
        </a>
        {t.consentAfter}
      </p>
    </form>
  );
}
