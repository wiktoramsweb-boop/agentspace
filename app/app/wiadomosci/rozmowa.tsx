"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { odpowiedzKlientowi } from "../klienci/portal-actions";

type W = { id: string; autor: "klient" | "agent"; tresc: string; created_at: string; read_at: string | null };

const kiedy = (iso: string) =>
  new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" }).format(new Date(iso));

/**
 * Rozmowa z klientem. Odświeża się sama co kilka sekund i po powrocie do
 * karty: klient pisze z telefonu, a agent ma zobaczyć odpowiedź bez F5.
 */
export function Rozmowa({ accessId, klient, aktywny, lista }: { accessId: string; klient: string; aktywny: boolean; lista: W[] }) {
  const router = useRouter();
  const [tekst, setTekst] = useState("");
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const dol = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && router.refresh(), 8000);
    const naPowrot = () => document.visibilityState === "visible" && router.refresh();
    document.addEventListener("visibilitychange", naPowrot);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", naPowrot);
    };
  }, [router]);

  useEffect(() => {
    dol.current?.scrollIntoView({ block: "end" });
  }, [lista.length]);

  function wyslij() {
    const t = tekst.trim();
    if (t.length < 2) return;
    setBlad(null);
    start(async () => {
      const r = await odpowiedzKlientowi(accessId, t);
      if (r.ok) {
        setTekst("");
        router.refresh();
      } else setBlad(r.error);
    });
  }

  return (
    <div className="flex h-full min-h-[60vh] flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-4 sm:p-5">
        {lista.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Napisz pierwszą wiadomość do klienta.</p>}
        {lista.map((w) => (
          <div key={w.id} className={`flex ${w.autor === "agent" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] leading-snug ${
                w.autor === "agent" ? "rounded-br-md bg-emerald-600 text-white" : "rounded-bl-md bg-slate-100 text-slate-900"
              }`}
            >
              {w.tresc}
              <span className={`mt-1 block text-[11px] ${w.autor === "agent" ? "text-emerald-100" : "text-slate-400"}`}>
                {w.autor === "klient" ? `${klient} · ` : ""}
                {kiedy(w.created_at)}
                {w.autor === "agent" && w.read_at ? " · przeczytane" : ""}
              </span>
            </div>
          </div>
        ))}
        <div ref={dol} />
      </div>

      <div className="border-t border-slate-200 p-3 sm:p-4">
        {aktywny ? (
          <>
            <div className="flex items-end gap-2">
              <textarea
                value={tekst}
                onChange={(e) => setTekst(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    wyslij();
                  }
                }}
                rows={2}
                maxLength={2000}
                placeholder={`Odpisz: ${klient}…`}
                className="min-h-[48px] flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={wyslij}
                disabled={pending || tekst.trim().length < 2}
                className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {pending ? "…" : "Wyślij"}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">Enter wysyła, Shift+Enter to nowa linia. Klient dostanie powiadomienie na telefon, jeśli je włączył.</p>
            {blad && <p className="mt-1 text-sm text-rose-600">{blad}</p>}
          </>
        ) : (
          <p className="text-sm text-slate-500">Dostęp klienta do portalu jest wyłączony, więc nie zobaczy odpowiedzi.</p>
        )}
      </div>
    </div>
  );
}
