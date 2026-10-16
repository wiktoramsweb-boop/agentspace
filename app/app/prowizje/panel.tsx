"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { PageHeader } from "../components/page-header";
import { PropertiesMap, type MapPoint } from "../nieruchomosci/properties-map";
import { formatPln, formatDateShort } from "@/lib/format";
import { DEAL_STATUSES, type DealStatus } from "@/lib/types";
import type { TransakcjaWidok, Podpowiedz } from "@/lib/data-prowizje";
import { DealActions, NowaTransakcja, type OfertaDoWyboru, type KlientDoWyboru, type StartTransakcji } from "./deal-controls";

const KOLOR_STATUSU: Record<DealStatus, string> = {
  w_toku: "#fbbf24",
  zamkniety: "#34d399",
  przepadl: "#f87171",
};
const PASEK_STATUSU: Record<DealStatus, string> = {
  w_toku: "bg-amber-400",
  zamkniety: "bg-emerald-400",
  przepadl: "bg-red-400",
};

export function ProwizjePanel({
  transakcje,
  oferty,
  klienci,
  podpowiedzi,
  defaultSplit,
  statystyki,
}: {
  transakcje: TransakcjaWidok[];
  oferty: OfertaDoWyboru[];
  klienci: KlientDoWyboru[];
  podpowiedzi: Podpowiedz[];
  defaultSplit: number;
  statystyki: ReactNode;
}) {
  const [formularz, setFormularz] = useState<StartTransakcji | null>(null);
  // Gdy nic nie jest w toku, od razu pokazujemy zakładkę, w której coś jest.
  const [zakladka, setZakladka] = useState<DealStatus>(
    () => (["w_toku", "zamkniety", "przepadl"] as const).find((s) => transakcje.some((t) => t.status === s)) ?? "w_toku",
  );
  const [schowane, setSchowane] = useState<Set<string>>(new Set());

  const liczby = useMemo(() => {
    const l: Record<DealStatus, number> = { w_toku: 0, zamkniety: 0, przepadl: 0 };
    for (const t of transakcje) l[t.status] += 1;
    return l;
  }, [transakcje]);

  const widoczne = transakcje.filter((t) => t.status === zakladka);

  // Na mapie wszystkie transakcje z lokalizacją, kolor wg statusu.
  const punkty = useMemo<MapPoint[]>(
    () =>
      transakcje
        .filter((t) => t.oferta?.lat != null && t.oferta?.lng != null)
        .map((t) => ({
          id: t.id,
          title: t.title,
          price: t.transaction_value_pln,
          lat: t.oferta!.lat!,
          lng: t.oferta!.lng!,
          kind: t.oferta!.rodzaj,
          color: KOLOR_STATUSU[t.status],
          label: formatPln(t.agent_earnings_pln),
          subtitle: `${t.oferta!.adres} · ${DEAL_STATUSES.find((s) => s.value === t.status)?.label ?? ""}`,
          href: `/app/prowizje/${t.id}`,
          linkText: "Otwórz transakcję",
        })),
    [transakcje],
  );

  const aktywnePodpowiedzi = podpowiedzi.filter((p) => !schowane.has(p.id));

  return (
    <>
      <PageHeader
        title="Prowizje"
        subtitle="Twoje transakcje, zarobek i to, co warto teraz domknąć."
        action={
          <button
            onClick={() => setFormularz({})}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            + Dodaj transakcję
          </button>
        }
      />

      {statystyki}

      {aktywnePodpowiedzi.length > 0 && (
        <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Do zrobienia ({aktywnePodpowiedzi.length})</h2>
          <ul className="space-y-2">
            {aktywnePodpowiedzi.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-white p-3 sm:flex-row sm:items-center">
                <span className="text-lg leading-none" aria-hidden="true">
                  {p.rodzaj === "oferta" ? "🏠" : p.rodzaj === "klient" ? "🤝" : p.rodzaj === "termin" ? "⏰" : "📅"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{p.tytul}</p>
                  <p className="text-xs text-slate-500">{p.opis}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {p.transakcjaId ? (
                    <Link
                      href={`/app/prowizje/${p.transakcjaId}`}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
                    >
                      Otwórz kartę
                    </Link>
                  ) : (
                    <button
                      onClick={() => setFormularz({ ofertaId: p.ofertaId, klientId: p.klientId })}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-400"
                    >
                      Załóż transakcję
                    </button>
                  )}
                  <button
                    onClick={() => setSchowane((s) => new Set(s).add(p.id))}
                    className="rounded-lg px-2 py-1.5 text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    title="Ukryj"
                  >
                    Później
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {transakcje.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-semibold text-slate-900">Nie masz jeszcze transakcji</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Wybierz ofertę i klienta, wpisz procent prowizji, a policzymy Twój zarobek i pokażemy transakcję na mapie.
          </p>
          <button
            onClick={() => setFormularz({})}
            className="mt-4 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            + Dodaj pierwszą transakcję
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <div className="min-w-0">
            <div className="mb-3 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1" role="tablist">
              {DEAL_STATUSES.map((s) => (
                <button
                  key={s.value}
                  role="tab"
                  aria-selected={zakladka === s.value}
                  onClick={() => setZakladka(s.value)}
                  className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                    zakladka === s.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {s.value === "w_toku" ? "W toku" : s.value === "zamkniety" ? "Zamknięte" : "Przepadłe"}
                  <span className="ml-1.5 text-xs text-slate-400">{liczby[s.value]}</span>
                </button>
              ))}
            </div>

            {widoczne.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                Brak transakcji w tej zakładce.
              </p>
            ) : (
              <div className="space-y-2.5">
                {widoczne.map((t) => (
                  <WierszTransakcji key={t.id} t={t} />
                ))}
              </div>
            )}
          </div>

          <aside className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white lg:sticky lg:top-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Mapa transakcji</p>
                <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-xs text-slate-500">
                  {DEAL_STATUSES.map((s) => (
                    <span key={s.value} className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ background: KOLOR_STATUSU[s.value] }} />
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>
              {punkty.length > 0 ? (
                <PropertiesMap points={punkty} height={360} />
              ) : (
                <p className="px-4 py-10 text-center text-sm text-slate-500">
                  Transakcje pojawią się na mapie, gdy połączysz je z ofertą, która ma adres na mapie.
                </p>
              )}
              {punkty.length > 0 && punkty.length < transakcje.length && (
                <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
                  Na mapie {punkty.length} z {transakcje.length}. Pozostałe nie mają oferty z lokalizacją.
                </p>
              )}
            </div>
          </aside>
        </div>
      )}

      {formularz && (
        <NowaTransakcja
          oferty={oferty}
          klienci={klienci}
          defaultSplit={defaultSplit}
          start={formularz}
          onClose={() => setFormularz(null)}
        />
      )}
    </>
  );
}

function WierszTransakcji({ t }: { t: TransakcjaWidok }) {
  const status = DEAL_STATUSES.find((s) => s.value === t.status);
  const termin =
    t.status === "zamkniety" && t.closed_at
      ? `zamknięta ${formatDateShort(t.closed_at)}`
      : t.expected_close
        ? `plan: ${formatDateShort(t.expected_close)}`
        : null;
  return (
    <div className="flex items-stretch gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white pr-3 transition hover:border-slate-300">
      <span className={`w-1.5 flex-shrink-0 ${PASEK_STATUSU[t.status]}`} />
      <Link href={`/app/prowizje/${t.id}`} className="min-w-0 flex-1 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate font-semibold text-slate-900">{t.title}</p>
          <p className="flex-shrink-0 text-base font-semibold text-emerald-600">{formatPln(t.agent_earnings_pln)}</p>
        </div>
        <p className="mt-0.5 truncate text-sm text-slate-500">
          {[t.klient?.nazwa, t.oferta?.adres].filter(Boolean).join(" · ") || "Bez klienta i oferty"}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          {`biuro ${formatPln(t.commission_pln)} brutto`}
          {t.agent_split_pct ? ` · Twój udział ${t.agent_split_pct}%` : ""}
          {termin ? ` · ${termin}` : ""}
        </p>
      </Link>
      <div className="flex flex-shrink-0 items-center gap-2">
        {status && (
          <span className={`hidden rounded-md px-2 py-1 text-xs font-medium xl:inline ${status.color}`}>{status.label}</span>
        )}
        <DealActions dealId={t.id} status={t.status} />
      </div>
    </div>
  );
}
