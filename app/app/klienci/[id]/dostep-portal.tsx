"use client";

import { useState, useTransition } from "react";
import { odwolajDostepKlienta, utworzDostepKlienta } from "../portal-actions";
import type { RodzajDostepu } from "@/lib/portal-klienta";
import { Select } from "../../components/select";
import { Card } from "../../components/ui";

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
  clientName,
  appUrl,
  istniejace,
  qr,
  presetRodzaj,
  tylkoRodzaj,
}: {
  clientId: string;
  clientName?: string;
  appUrl: string;
  istniejace: DostepWiersz[];
  /** Kod QR na dostęp, składany po stronie serwera. */
  qr: Record<string, string>;
  presetRodzaj?: RodzajDostepu;
  /** Pokaż tylko dostępy tego rodzaju. Na karcie poszukiwania nie ma co
   *  wyświetlać dostępu sprzedającego - dotyczy zupełnie innej sprawy. */
  tylkoRodzaj?: RodzajDostepu;
}) {
  const [rodzaj, setRodzaj] = useState<RodzajDostepu>(presetRodzaj ?? "sprzedajacy");
  const [blad, setBlad] = useState<string | null>(null);
  const [skopiowany, setSkopiowany] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const aktywne = istniejace.filter((d) => !d.revoked_at && (!tylkoRodzaj || d.rodzaj === tylkoRodzaj));
  const link = (t: string) => `${appUrl}/klient/${t}`;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
      <Card>
        <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
          Dostęp dla klienta
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Klient wchodzi z linku albo kodu QR, bez zakładania konta. Widzi wyłącznie swoje
          nieruchomości i tylko te zdarzenia, które udostępnisz. Nigdy nie zobaczy tematu
          działania ani notatek biura.
        </p>

        {aktywne.length === 0 && (
          <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            {clientName ? `${clientName} nie ma` : "Ten klient nie ma"} jeszcze dostępu do portalu.
            Utwórz go przy podpisaniu umowy i pokaż kod QR na telefonie.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="w-60">
            <Select
              value={rodzaj}
              onChange={(e) => setRodzaj(e.target.value as RodzajDostepu)}
              aria-label="Rodzaj dostępu"
              options={[
                { value: "sprzedajacy", label: "Sprzedający lub wynajmujący" },
                { value: "kupujacy", label: "Szukający nieruchomości" },
              ]}
            />
          </div>
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
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {pending ? "Tworzę..." : "Utwórz dostęp"}
          </button>
        </div>
        {blad && <p className="mt-2 text-sm text-red-600">{blad}</p>}

        {istniejace.some((d) => d.revoked_at) && (
          <p className="mt-4 text-xs text-slate-400">
            Odwołane dostępy: {istniejace.filter((d) => d.revoked_at).length}. Ich linki nie
            działają.
          </p>
        )}
      </Card>

      <div className="space-y-4">
        {aktywne.map((d) => (
          <Card key={d.id}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {d.rodzaj === "kupujacy" ? "Szukający" : "Sprzedający"}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  d.last_seen_at ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {d.last_seen_at ? "Był w portalu" : "Jeszcze nie wszedł"}
              </span>
            </div>

            {qr[d.id] && (
              <div className="mx-auto mt-4 w-full max-w-[240px] rounded-2xl border border-slate-200 p-3">
                {/* SVG pochodzi z naszego generatora na serwerze, nie od użytkownika. */}
                <div dangerouslySetInnerHTML={{ __html: qr[d.id] }} />
              </div>
            )}
            <p className="mt-3 text-center text-xs text-slate-500">
              Pokaż klientowi przy podpisaniu umowy albo wydrukuj na egzemplarzu.
            </p>

            <p className="mt-4 break-all rounded-lg bg-slate-50 p-2.5 font-mono text-[12px] text-slate-700">
              {link(d.token)}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
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
                className="text-slate-600 hover:text-slate-900"
              >
                Wyślij SMS-em
              </a>
              <a
                href={link(d.token)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-slate-900"
              >
                Podejrzyj
              </a>
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
          </Card>
        ))}
      </div>
    </div>
  );
}
