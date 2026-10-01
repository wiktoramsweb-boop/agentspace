"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Select } from "../components/select";
import { formatDateTimePL } from "@/lib/datetime";
import { formatPhone } from "@/lib/format";
import { LEAD_SOURCES, LEAD_STATUSES, type Lead } from "@/lib/types";
import { przeniesDoKlientow, przypiszLeady, ustawPoleLeada, usunLeady } from "./actions";

const STATUS_MAP = Object.fromEntries(LEAD_STATUSES.map((s) => [s.value, s]));
const SOURCE_MAP = Object.fromEntries(LEAD_SOURCES.map((s) => [s.value, s.label]));

/**
 * Lista leadów.
 *
 * Ustawiona pod jedną czynność: obdzwonić to, co nowe. Dlatego status i agent
 * zmieniają się prosto z wiersza, bez wchodzenia w szczegóły, a numer telefonu
 * jest odnośnikiem, który na telefonie od razu dzwoni.
 */
export function LeadyLista({
  leady,
  agenci,
  mozeUsuwac,
}: {
  leady: Lead[];
  agenci: { id: string; name: string }[];
  mozeUsuwac: boolean;
}) {
  const [zaznaczone, setZaznaczone] = useState<Set<string>>(new Set());
  const [rozwiniety, setRozwiniety] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [blad, setBlad] = useState<string | null>(null);

  const agentMap = useMemo(() => Object.fromEntries(agenci.map((a) => [a.id, a.name])), [agenci]);

  function przelacz(id: string) {
    setZaznaczone((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function zmien(id: string, pole: "status" | "agent_id", wartosc: string) {
    setBlad(null);
    start(async () => {
      const res = await ustawPoleLeada(id, pole, wartosc || null);
      if (!res.ok) setBlad(res.error);
    });
  }

  function masowo(agentId: string | null) {
    const ids = [...zaznaczone];
    setBlad(null);
    start(async () => {
      const res = await przypiszLeady(ids, agentId);
      if (!res.ok) setBlad(res.error);
      else setZaznaczone(new Set());
    });
  }

  if (!leady.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
        <p className="font-semibold text-slate-900">Brak leadów do pokazania</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          Wczytaj plik z Meta Ads albo dodaj pierwszy kontakt ręcznie. Jeśli używasz filtrów,
          spróbuj je wyczyścić.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {zaznaczone.size > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-700/40 bg-slate-900 px-4 py-3 text-white shadow-2xl">
          <span className="text-sm font-semibold">Zaznaczono {zaznaczone.size}</span>
          <div className="w-56">
            <Select
              tone="onDark"
              aria-label="Przypisz zaznaczone do"
              value=""
              onChange={(e) => masowo(e.target.value || null)}
              options={[
                { value: "", label: "Pula biura (bez opiekuna)" },
                ...agenci.map((a) => ({ value: a.id, label: a.name })),
              ]}
              placeholder="Przypisz do…"
            />
          </div>
          {mozeUsuwac && (
            <button
              type="button"
              onClick={() => {
                const ids = [...zaznaczone];
                start(async () => {
                  const res = await usunLeady(ids);
                  if (!res.ok) setBlad(res.error);
                  else setZaznaczone(new Set());
                });
              }}
              className="rounded-lg px-2.5 py-1.5 text-sm text-white/70 transition hover:bg-red-500/20 hover:text-white"
            >
              Usuń
            </button>
          )}
          <button
            type="button"
            onClick={() => setZaznaczone(new Set())}
            className="ml-auto rounded-lg px-2.5 py-1.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Odznacz
          </button>
        </div>
      )}

      {blad && (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{blad}</p>
      )}

      <ul className="space-y-2">
        {leady.map((l) => {
          const sm = STATUS_MAP[l.status];
          const otwarty = rozwiniety === l.id;
          return (
            <li
              key={l.id}
              className={`rounded-2xl border bg-white transition ${
                zaznaczone.has(l.id) ? "border-emerald-500" : "border-slate-200"
              }`}
            >
              <div className="flex flex-wrap items-center gap-3 p-4">
                <input
                  type="checkbox"
                  checked={zaznaczone.has(l.id)}
                  onChange={() => przelacz(l.id)}
                  aria-label={`Zaznacz ${l.name ?? l.phone ?? "lead"}`}
                  className="h-4 w-4 flex-shrink-0 accent-emerald-500"
                />

                <div className="min-w-[180px] flex-1">
                  <p className="font-semibold text-slate-900">{l.name || "Bez nazwy"}</p>
                  <p className="text-sm text-slate-500">
                    {l.phone ? (
                      <a href={`tel:${l.phone}`} className="text-blue-600 hover:underline">
                        {formatPhone(l.phone)}
                      </a>
                    ) : (
                      l.email
                    )}
                    {l.city && <span className="text-slate-400"> · {l.city}</span>}
                  </p>
                </div>

                <div className="w-44 flex-shrink-0">
                  <Select
                    aria-label="Etap"
                    value={l.status}
                    onChange={(e) => zmien(l.id, "status", e.target.value)}
                    options={LEAD_STATUSES.map((s) => ({ value: s.value, label: s.label, hint: s.opis }))}
                    placeholder=""
                    disabled={pending}
                  />
                </div>

                <div className="w-44 flex-shrink-0">
                  <Select
                    aria-label="Opiekun"
                    value={l.agent_id ?? ""}
                    onChange={(e) => zmien(l.id, "agent_id", e.target.value)}
                    options={agenci.map((a) => ({ value: a.id, label: a.name }))}
                    placeholder="pula biura"
                    disabled={pending}
                  />
                </div>

                <div className="hidden w-32 flex-shrink-0 text-right text-xs text-slate-400 lg:block">
                  {l.submitted_at ? formatDateTimePL(l.submitted_at) : "-"}
                </div>

                <button
                  type="button"
                  onClick={() => setRozwiniety(otwarty ? null : l.id)}
                  aria-expanded={otwarty}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <svg
                    className={`h-4 w-4 transition ${otwarty ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {otwarty && (
                <div className="border-t border-slate-200 px-4 py-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Info label="Źródło" value={SOURCE_MAP[l.source] ?? l.source} />
                    <Info label="Kampania" value={l.campaign} />
                    <Info label="Reklama" value={l.ad_name} />
                    <Info label="Formularz" value={l.form_name} />
                    <Info label="E-mail" value={l.email} />
                    <Info label="Adres" value={l.address} />
                    <Info label="Opiekun" value={l.agent_id ? agentMap[l.agent_id] : "pula biura"} />
                    <Info label="Etap" value={sm?.label ?? l.status} />
                  </div>

                  {l.message && (
                    <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wider text-slate-500">Wiadomość</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{l.message}</p>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {l.client_id ? (
                      <Link
                        href={`/app/klienci/${l.client_id}`}
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
                      >
                        Otwórz kartę klienta
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          setBlad(null);
                          start(async () => {
                            const res = await przeniesDoKlientow(l.id);
                            if (!res.ok) setBlad(res.error);
                          });
                        }}
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
                      >
                        Przenieś do klientów
                      </button>
                    )}
                    {l.phone && (
                      <a
                        href={`tel:${l.phone}`}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400"
                      >
                        Zadzwoń
                      </a>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 truncate text-sm text-slate-800">{value || "-"}</p>
    </div>
  );
}
