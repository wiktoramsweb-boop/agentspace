"use client";

import { useState } from "react";

export type LeadKind = "kontakt" | "zglos" | "poszukiwanie" | "oferta";

const COPY: Record<LeadKind, { submit: string; ok: string; note: string }> = {
  kontakt: {
    submit: "Wyślij wiadomość",
    ok: "Dziękujemy, wiadomość poszła dalej",
    note: "We wzorze formularz niczego nie wysyła. Na stronie klienta to zgłoszenie ląduje w AgentSpace jako nowy kontakt i zadanie dla agenta, zanim zamkniesz kartę.",
  },
  zglos: {
    submit: "Zgłoś nieruchomość",
    ok: "Mamy zgłoszenie",
    note: "Na stronie klienta to zgłoszenie tworzy w CRM kontakt i wstępną ofertę z podanym metrażem i adresem, przypisaną do agenta z tej dzielnicy.",
  },
  poszukiwanie: {
    submit: "Zleć poszukiwanie",
    ok: "Zlecenie przyjęte",
    note: "Na stronie klienta takie zlecenie zakłada w CRM poszukiwanie, a system sam kojarzy je z ofertami biura i odzywa się, gdy pojawi się dopasowanie.",
  },
  oferta: {
    submit: "Zapytaj o tę ofertę",
    ok: "Pytanie wysłane",
    note: "Na stronie klienta agent dostaje powiadomienie z numerem oferty i historią tego, co odwiedzający oglądał wcześniej.",
  },
};

/**
 * Formularz wzoru. Świadomie nic nie wysyła: to strona pokazowa, a nie
 * działające biuro. Po kliknięciu pokazujemy, co zadziałoby się naprawdę.
 */
export function LeadForm({ kind = "kontakt", offerNo }: { kind?: LeadKind; offerNo?: string }) {
  const [sent, setSent] = useState(false);
  const copy = COPY[kind];

  if (sent) {
    return (
      <div className="wzf__ok" role="status">
        <b>{copy.ok}</b>
        <p style={{ marginBottom: 10 }}>{copy.note}</p>
        <button type="button" className="wz-btn wz-btn--ghost wz-btn--sm" onClick={() => setSent(false)}>
          Wypełnij jeszcze raz
        </button>
      </div>
    );
  }

  return (
    <form
      className="wzf"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <div className="wzf__row">
        <label>
          Imię i nazwisko
          <input name="name" required placeholder="Jan Kowalski" />
        </label>
        <label>
          Telefon
          <input name="phone" type="tel" required placeholder="600 100 200" />
        </label>
      </div>

      <label>
        E-mail
        <input name="email" type="email" placeholder="jan@przyklad.pl" />
      </label>

      {kind === "zglos" && (
        <div className="wzf__row">
          <label>
            Adres nieruchomości
            <input name="address" placeholder="Kraków, ul. Długa 12" />
          </label>
          <label>
            Metraż
            <input name="area" inputMode="numeric" placeholder="58 m²" />
          </label>
        </div>
      )}

      {kind === "poszukiwanie" && (
        <div className="wzf__row">
          <label>
            Czego szukasz
            <select name="what" defaultValue="mieszkanie">
              <option value="mieszkanie">Mieszkanie</option>
              <option value="dom">Dom</option>
              <option value="dzialka">Działka</option>
              <option value="lokal">Lokal lub biuro</option>
            </select>
          </label>
          <label>
            Budżet
            <input name="budget" inputMode="numeric" placeholder="do 900 000 zł" />
          </label>
        </div>
      )}

      <label>
        Wiadomość
        <textarea
          name="message"
          defaultValue={offerNo ? `Dzień dobry, proszę o kontakt w sprawie oferty ${offerNo}. ` : ""}
          placeholder="Napisz, w czym możemy pomóc."
        />
      </label>

      <label className="wzf__consent">
        <input type="checkbox" required />
        <span>
          Zgadzam się na kontakt w sprawie mojego zapytania i wiem, że mogę wycofać zgodę w każdej chwili. We wzorze
          formularz nie wysyła żadnych danych.
        </span>
      </label>

      <button type="submit" className="wz-btn wz-btn--wide">
        {copy.submit}
      </button>
      <p className="wzf__note">Odpowiadamy tego samego dnia roboczego, zwykle w dwie godziny.</p>
    </form>
  );
}
