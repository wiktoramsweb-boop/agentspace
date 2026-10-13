"use client";

import { useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zapiszRozmoweGlosowa } from "./glos-actions";

type Wypowiedz = { role: "agent" | "client"; content: string };

/**
 * Rozmowa głosowa z klientem AI.
 *
 * Agent naciska zieloną słuchawkę i po prostu mówi, tak jak przy prawdziwym
 * telefonie: klient AI odpowiada głosem, da się mu wejść w słowo i da się go
 * przerwać. To jest ta część treningu, której nie zastąpi pisanie.
 *
 * Wypowiedzi zbieramy po drodze i po rozłączeniu dopisujemy do transkryptu
 * sesji, więc ocena liczy się dokładnie tak samo jak dla rozmowy pisanej.
 */
export function RozmowaGlosowa({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [blad, setBlad] = useState<string | null>(null);
  const [laczenie, setLaczenie] = useState(false);
  const [sekundy, setSekundy] = useState(0);
  const [limit, setLimit] = useState(5);

  // Ref, a nie stan: wypowiedzi lecą w trakcie rozmowy i nie chcemy
  // przerysowywać ekranu przy każdym zdaniu.
  const wypowiedzi = useRef<Wypowiedz[]>([]);
  const start = useRef<number>(0);
  const zapisane = useRef(false);

  const rozmowa = useConversation({
    onMessage: (m: { message: string; source: string }) => {
      if (!m?.message) return;
      wypowiedzi.current.push({ role: m.source === "user" ? "agent" : "client", content: m.message });
    },
    onError: () => setBlad("Połączenie przerwane. Spróbuj jeszcze raz."),
  });

  const polaczone = rozmowa.status === "connected";

  const zakoncz = useCallback(async () => {
    if (zapisane.current) return;
    zapisane.current = true;
    const czas = start.current ? Math.round((Date.now() - start.current) / 1000) : 0;
    try {
      await rozmowa.endSession();
    } catch {
      /* już rozłączone */
    }
    await zapiszRozmoweGlosowa(sessionId, wypowiedzi.current, czas);
    wypowiedzi.current = [];
    setSekundy(0);
    router.refresh();
  }, [rozmowa, router, sessionId]);

  // Licznik i twarde zamknięcie po limicie. Rozmowa jest najdroższą operacją
  // w aplikacji, więc nie może zostać otwarta przez przypadek.
  useEffect(() => {
    if (!polaczone) return;
    const t = setInterval(() => {
      const ile = Math.round((Date.now() - start.current) / 1000);
      setSekundy(ile);
      if (ile >= limit * 60) void zakoncz();
    }, 1000);
    return () => clearInterval(t);
  }, [polaczone, limit, zakoncz]);

  async function zadzwon() {
    setBlad(null);
    setLaczenie(true);
    try {
      // Pytamy o mikrofon przed zamówieniem rozmowy: inaczej pobralibyśmy
      // kredyty za połączenie, którego przeglądarka i tak nie zestawi.
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const r = await fetch("/api/coach/glos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const dane = await r.json();
      if (!r.ok) {
        setBlad(dane.error ?? "Nie udało się połączyć.");
        return;
      }

      setLimit(dane.maxMinut ?? 5);
      wypowiedzi.current = [];
      zapisane.current = false;
      start.current = Date.now();

      await rozmowa.startSession({
        signedUrl: dane.adres,
        connectionType: "webrtc",
        overrides: {
          agent: {
            prompt: { prompt: dane.prompt },
            firstMessage: dane.pierwsze,
            language: "pl",
          },
        },
      });
    } catch (e) {
      setBlad(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Przeglądarka nie dostała zgody na mikrofon. Zezwól i spróbuj ponownie."
          : "Nie udało się połączyć. Sprawdź mikrofon i spróbuj ponownie.",
      );
    } finally {
      setLaczenie(false);
    }
  }

  const minuty = String(Math.floor(sekundy / 60)).padStart(2, "0");
  const reszta = String(sekundy % 60).padStart(2, "0");

  return (
    <div className="mb-3">
      {blad && (
        <p className="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700">{blad}</p>
      )}

      {polaczone ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3">
          <span className="relative flex h-3 w-3 flex-shrink-0">
            <span
              className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 ${
                rozmowa.isSpeaking ? "animate-ping" : ""
              }`}
            />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-900">
              {rozmowa.isSpeaking ? "Klient mówi..." : "Słucha Cię"}
            </p>
            <p className="text-xs text-emerald-700">
              {minuty}:{reszta} z {limit}:00 · mów normalnie, możesz wejść w słowo
            </p>
          </div>
          <button
            type="button"
            onClick={() => void zakoncz()}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Rozłącz
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void zadzwon()}
          disabled={laczenie}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 6.75c0 8.28 6.72 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.37c0-.52-.35-.97-.85-1.1l-4.43-1.1c-.44-.11-.9.05-1.17.42l-.97 1.29c-.28.38-.77.54-1.21.38a12.04 12.04 0 0 1-7.14-7.14c-.16-.44 0-.93.38-1.21l1.29-.97c.36-.27.53-.74.42-1.17L6.96 3.1a1.13 1.13 0 0 0-1.09-.85H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
            />
          </svg>
          {laczenie ? "Łączę..." : "Zadzwoń i rozmawiaj głosem"}
        </button>
      )}
    </div>
  );
}
