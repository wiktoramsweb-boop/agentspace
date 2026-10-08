"use client";

import { useState, useTransition } from "react";
import { odwolajDostepKlienta, utworzDostepKlienta } from "../portal-actions";
import type { RodzajDostepu } from "@/lib/portal-klienta";

export type DostepWiersz = {
  id: string;
  token: string;
  rodzaj: RodzajDostepu;
  created_at: string;
  revoked_at: string | null;
  last_seen_at: string | null;
};

/**
 * Dostęp klienta do portalu.
 *
 * Link pokazujemy w całości, bo agent ma go wkleić do SMS-a albo pokazać
 * jako kod QR przy podpisaniu umowy. To jedyne miejsce, gdzie token jest
 * widoczny - nigdzie indziej nie wypisujemy go w interfejsie.
 */
export function DostepPortal({
  clientId,
  appUrl,
  istniejace,
  qr,
}: {
  clientId: string;
  appUrl: string;
  istniejace: DostepWiersz[];
  /** Kod QR na dostęp, składany po stronie serwera. */
  qr: Record<string, string>;
}) {
  const [rodzaj, setRodzaj] = useState<RodzajDostepu>("sprzedajacy");
  const [blad, setBlad] = useState<string | null>(null);
  const [skopiowany, setSkopiowany] = useState<string | null>(null);
  const [pokazQr, setPokazQr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const aktywne = istniejace.filter((d) => !d.revoked_at);
  const link = (t: string) => `${appUrl}/klient/${t}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="font-semibold text-slate-900">Dostęp dla klienta</p>
      <p className="mt-1 text-sm text-slate-500">
        Klient wchodzi z linku albo kodu QR, bez zakładania konta. Widzi wyłącznie swoje
        nieruchomości i tylko te zdarzenia, które udostępnisz.
      </p>

      {aktywne.length > 0 && (
        <div className="mt-4 space-y-3">
          {aktywne.map((d) => (
            <div key={d.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {d.rodzaj === "kupujacy" ? "Kupujący" : "Sprzedający"}
                {d.last_seen_at ? " · był w portalu" : " · jeszcze nie wszedł"}
              </p>
              <p className="mt-1 break-all font-mono text-[12px] text-slate-700">{link(d.token)}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(link(d.token));
                    setSkopiowany(d.id);
                    setTimeout(() => setSkopiowany(null), 2000);
                  }}
                  className="font-medium text-emerald-700"
                >
                  {skopiowany === d.id ? "Skopiowane" : "Kopiuj link"}
                </button>
                <a
                  href={`sms:?&body=${encodeURIComponent(`Dostęp do podglądu sprawy: ${link(d.token)}`)}`}
                  className="text-slate-600"
                >
                  Wyślij SMS-em
                </a>
                <button
                  type="button"
                  onClick={() => setPokazQr(pokazQr === d.id ? null : d.id)}
                  className="text-slate-600"
                >
                  {pokazQr === d.id ? "Ukryj kod QR" : "Pokaż kod QR"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm("Odwołać ten dostęp? Link przestanie działać natychmiast.")) return;
                    start(() => void odwolajDostepKlienta(d.id, clientId));
                  }}
                  className="text-slate-500 hover:text-red-600"
                >
                  Odwołaj
                </button>
              </div>

              {pokazQr === d.id && qr[d.id] && (
                <div className="mt-3 flex flex-col items-center rounded-xl bg-white p-4">
                  {/* SVG pochodzi z naszego generatora na serwerze, nie od użytkownika. */}
                  <div
                    className="w-[220px]"
                    dangerouslySetInnerHTML={{ __html: qr[d.id] }}
                  />
                  <p className="mt-2 text-center text-xs text-slate-500">
                    Pokaż klientowi przy podpisaniu umowy albo wydrukuj na egzemplarzu.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          value={rodzaj}
          onChange={(e) => setRodzaj(e.target.value as RodzajDostepu)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        >
          <option value="sprzedajacy">Sprzedający lub wynajmujący</option>
          <option value="kupujacy">Szukający nieruchomości</option>
        </select>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setBlad(null);
            start(async () => {
              const w = await utworzDostepKlienta(clientId, rodzaj);
              if (!w.ok) setBlad(w.error);
            });
          }}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? "Tworzę..." : "Utwórz dostęp"}
        </button>
      </div>
      {blad && <p className="mt-2 text-sm text-red-600">{blad}</p>}
    </div>
  );
}
