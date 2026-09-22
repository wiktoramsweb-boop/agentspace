"use client";

import { useState, useTransition } from "react";
import { submitSiteLead, type SiteLeadKind } from "@/app/strona/actions";
import { useFavorites } from "./favorites";

const COPY: Record<SiteLeadKind, { submit: string; ok: string; sub: string }> = {
  kontakt: { submit: "Wyślij wiadomość", ok: "Wiadomość wysłana", sub: "Odezwiemy się tego samego dnia roboczego." },
  zglos: { submit: "Zgłoś nieruchomość", ok: "Zgłoszenie przyjęte", sub: "Przygotujemy wycenę i zadzwonimy, żeby umówić oglądanie." },
  poszukiwanie: { submit: "Zleć poszukiwanie", ok: "Zlecenie przyjęte", sub: "Odezwiemy się, gdy pojawi się coś pasującego, także przed publikacją." },
  oferta: { submit: "Zapytaj o tę ofertę", ok: "Pytanie wysłane", sub: "Agent prowadzący ofertę odezwie się w godzinach pracy biura." },
};

/**
 * Formularz na stronie biura. W odróżnieniu od wersji we wzorach naprawdę
 * wysyła dane: zgłoszenie ląduje w CRM jako kontakt i zadanie dla agenta.
 * Dokładamy listę ulubionych ofert, żeby agent wiedział, co klient oglądał.
 */
export function SiteLeadForm({
  agencyId,
  base,
  kind = "kontakt",
  offerNo,
}: {
  agencyId: string;
  base: string;
  kind?: SiteLeadKind;
  offerNo?: string;
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { ids } = useFavorites(base);
  const copy = COPY[kind];

  if (done) {
    return (
      <div className="wzf__ok" role="status">
        <b>{copy.ok}</b>
        <p>{copy.sub}</p>
      </div>
    );
  }

  return (
    <form
      className="wzf"
      action={(fd) => {
        setError(null);
        fd.set("agency_id", agencyId);
        fd.set("kind", kind);
        if (ids.length) fd.set("favorites", ids.join(", "));
        if (offerNo) fd.set("offer_no", offerNo);
        start(async () => {
          const res = await submitSiteLead(fd);
          if (res.ok) setDone(true);
          else setError(res.error);
        });
      }}
    >
      <div className="wzf__row">
        <label>
          Imię i nazwisko
          <input name="name" required placeholder="Jan Kowalski" />
        </label>
        <label>
          Telefon
          <input name="phone" type="tel" placeholder="600 100 200" />
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
            <input name="area" placeholder="58 m²" />
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
            <input name="budget" placeholder="do 900 000 zł" />
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
          Zgadzam się na kontakt telefoniczny lub mailowy w sprawie mojego zapytania. Wiem, że mogę wycofać zgodę w
          każdej chwili.
        </span>
      </label>

      {error && <p style={{ color: "#dc2626", fontSize: 14 }}>{error}</p>}

      <button type="submit" className="wz-btn wz-btn--wide" disabled={pending}>
        {pending ? "Wysyłam..." : copy.submit}
      </button>
      {ids.length > 0 && (
        <p className="wzf__note">
          Do wiadomości dołączymy {ids.length} zapisanych ofert, żeby agent wiedział, co Cię interesuje.
        </p>
      )}
    </form>
  );
}
