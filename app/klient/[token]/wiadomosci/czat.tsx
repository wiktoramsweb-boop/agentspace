"use client";

import { useState, useTransition } from "react";
import { wyslijWiadomosc } from "../actions";
import type { WiadomoscPortalu } from "@/lib/data-portal";

function kiedyKrotko(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

/** Rozmowa klienta z agentem. Prosty wątek, bez wątków pobocznych. */
export function Czat({ token, wiadomosci }: { token: string; wiadomosci: WiadomoscPortalu[] }) {
  const [tekst, setTekst] = useState("");
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <>
      {wiadomosci.length === 0 ? (
        <div className="portal-pusto" style={{ marginBottom: 18 }}>
          Nie ma jeszcze żadnej wiadomości.
          <br />
          Napisz, o co chcesz zapytać.
        </div>
      ) : (
        <div className="portal-czat">
          {wiadomosci.map((w) => (
            <div key={w.id} className={`portal-dymek ${w.autor === "klient" ? "od-klienta" : "od-agenta"}`}>
              {w.tresc}
              <time>{kiedyKrotko(w.created_at)}</time>
            </div>
          ))}
        </div>
      )}

      <textarea
        className="portal-pole"
        rows={3}
        value={tekst}
        maxLength={2000}
        onChange={(e) => setTekst(e.target.value)}
        placeholder="Napisz wiadomość..."
      />
      {blad && <p style={{ color: "var(--czerwien)", fontSize: 14, margin: "8px 0 0" }}>{blad}</p>}
      <button
        type="button"
        className="portal-przycisk"
        style={{ marginTop: 10 }}
        disabled={pending || tekst.trim().length < 2}
        onClick={() => {
          setBlad(null);
          start(async () => {
            const w = await wyslijWiadomosc(token, tekst);
            if (w.ok) setTekst("");
            else setBlad(w.error);
          });
        }}
      >
        {pending ? "Wysyłam..." : "Wyślij"}
      </button>
    </>
  );
}
