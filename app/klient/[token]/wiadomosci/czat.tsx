"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { wyslijWiadomosc } from "../actions";
import type { WiadomoscPortalu } from "@/lib/data-portal";

function kiedyKrotko(iso: string): string {
  return new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" }).format(new Date(iso));
}

/**
 * Rozmowa klienta z agentem. Odświeża się sama, żeby odpowiedź biura
 * pojawiła się bez przeładowania, a pole do pisania stoi nad paskiem zakładek.
 */
export function Czat({ token, wiadomosci, agent }: { token: string; wiadomosci: WiadomoscPortalu[]; agent: string | null }) {
  const router = useRouter();
  const [tekst, setTekst] = useState("");
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const dol = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && router.refresh(), 10_000);
    const naPowrot = () => document.visibilityState === "visible" && router.refresh();
    document.addEventListener("visibilitychange", naPowrot);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", naPowrot);
    };
  }, [router]);

  useEffect(() => {
    dol.current?.scrollIntoView({ block: "end" });
  }, [wiadomosci.length]);

  function wyslij() {
    const t = tekst.trim();
    if (t.length < 2) return;
    setBlad(null);
    start(async () => {
      const w = await wyslijWiadomosc(token, t);
      if (w.ok) {
        setTekst("");
        router.refresh();
      } else setBlad(w.error);
    });
  }

  return (
    <>
      {wiadomosci.length === 0 ? (
        <div className="portal-pusto">
          Nie ma jeszcze żadnej wiadomości.
          <br />
          Napisz, o co chcesz zapytać{agent ? `, ${agent.split(" ")[0]} odpowie tutaj` : ""}.
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
      <div ref={dol} />

      <div className="portal-pisz">
        <textarea
          rows={1}
          value={tekst}
          maxLength={2000}
          onChange={(e) => {
            setTekst(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(140, e.target.scrollHeight)}px`;
          }}
          placeholder="Napisz wiadomość…"
          aria-label="Treść wiadomości"
        />
        <button type="button" disabled={pending || tekst.trim().length < 2} onClick={wyslij} aria-label="Wyślij">
          {pending ? (
            <span className="portal-krecik" aria-hidden="true" />
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          )}
        </button>
      </div>
      {blad && <p style={{ color: "var(--czerwien)", fontSize: 14, margin: "8px 0 0" }}>{blad}</p>}
    </>
  );
}
