"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { odswiezOtodom, opublikujOtodom, zmienOtodom } from "./otodom-actions";

type Ogloszenie = { advert_uuid: string | null; status: string | null; url: string | null; last_error: string | null; exact_location: boolean; updated_at: string | null } | null;
type Status = { label: string; kolor: string };
type Zdarzenie = { event_type: string | null; code: string | null; message: string | null; created_at: string };

const ZDARZENIA: Record<string, string> = {
  advert_posted_success: "Opublikowane",
  advert_posted_error: "Publikacja odrzucona",
  advert_put_success: "Zmiany przyjęte",
  advert_put_error: "Zmiany odrzucone",
  advert_activated_success: "Aktywowane",
  advert_deactivated_success: "Dezaktywowane",
  advert_deleted_success: "Usunięte",
  advert_state_changed: "Zmiana statusu",
  advert_location_error: "Lokalizacja nieprzyjęta",
};

/**
 * Publikacja oferty na portalach. Na razie Otodom; kolejne portale dojdą jako
 * kolejne karty w tej samej zakładce.
 */
export function OgloszeniaTab({
  propertyId,
  polaczone,
  tabele,
  test,
  ogloszenie,
  historia = [],
  statusy,
  ceo,
}: {
  propertyId: string;
  polaczone: boolean;
  tabele: boolean;
  test: boolean;
  ogloszenie: Ogloszenie;
  historia?: Zdarzenie[];
  statusy: Record<string, Status>;
  ceo: boolean;
}) {
  const router = useRouter();
  const [exact, setExact] = useState(ogloszenie?.exact_location ?? false);
  const [wynik, setWynik] = useState<{ ok: boolean; teksty: string[] } | null>(null);
  const [czeka, start] = useTransition();
  const status = ogloszenie?.status ?? null;
  const s = status ? (statusy[status] ?? { label: status, kolor: "bg-slate-100 text-slate-700" }) : null;
  const jest = Boolean(ogloszenie?.advert_uuid) && status !== "usuniete";

  // Po wysłaniu wynik przychodzi webhookiem po kilku sekundach: odświeżamy widok sami.
  useEffect(() => {
    if (status !== "wysylanie") return;
    const t = setInterval(() => router.refresh(), 4000);
    const stop = setTimeout(() => clearInterval(t), 60000);
    return () => {
      clearInterval(t);
      clearTimeout(stop);
    };
  }, [status, router]);

  const uruchom = (fn: () => Promise<{ ok: true; komunikat: string } | { ok: false; bledy: string[] }>) =>
    start(async () => {
      const r = await fn();
      setWynik(r.ok ? { ok: true, teksty: [r.komunikat] } : { ok: false, teksty: r.bledy });
      router.refresh();
    });

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Otodom</h2>
            <p className="mt-1 text-sm text-slate-500">Treść, zdjęcia i parametry idą z karty oferty. Kontakt w ogłoszeniu to agent prowadzący.</p>
          </div>
          {s && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${s.kolor}`}>{s.label}</span>}
        </div>

        {!tabele ? (
          <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Eksport wymaga aktualizacji bazy (lib/SETUP-v50-portale.sql).</p>
        ) : !polaczone ? (
          <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Biuro nie jest połączone z Otodom.{" "}
            {ceo ? (
              <Link href="/app/ustawienia/portale" className="font-semibold text-emerald-700 hover:underline">
                Połącz w Ustawieniach →
              </Link>
            ) : (
              "Poproś CEO o połączenie konta w Ustawieniach."
            )}
          </p>
        ) : (
          <>
            {test && <p className="mt-4 rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-800">Konto testowe OLX: tytuł dostanie [qatest-mercury], a opis zostanie zastąpiony testowym.</p>}
            <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={exact} onChange={(e) => setExact(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
              Pokaż dokładną lokalizację na mapie (bez zaznaczenia Otodom pokaże okolicę)
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" disabled={czeka} onClick={() => uruchom(() => opublikujOtodom(propertyId, exact))} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                {czeka ? "Wysyłam…" : jest ? "Zaktualizuj na Otodom" : "Opublikuj na Otodom"}
              </button>
              {jest && (status === "active" || status === "new") && (
                <button type="button" disabled={czeka} onClick={() => uruchom(() => zmienOtodom(propertyId, "deactivate"))} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  Dezaktywuj
                </button>
              )}
              {jest && status && ["outdated", "inactive", "removed_by_user"].includes(status) && (
                <button type="button" disabled={czeka} onClick={() => uruchom(() => zmienOtodom(propertyId, "activate"))} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  Aktywuj ponownie
                </button>
              )}
              {jest && (
                <button
                  type="button"
                  disabled={czeka}
                  onClick={() => confirm("Usunąć ogłoszenie z Otodom? Oferta w AgentSpace zostaje.") && uruchom(() => zmienOtodom(propertyId, "delete"))}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                >
                  Usuń z Otodom
                </button>
              )}
              {jest && (
                <button type="button" disabled={czeka} onClick={() => start(async () => { await odswiezOtodom(propertyId); router.refresh(); })} className="rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:text-slate-800">
                  Sprawdź status
                </button>
              )}
            </div>
          </>
        )}

        {ogloszenie?.url && (
          <a href={ogloszenie.url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:underline">
            Zobacz ogłoszenie na Otodom ↗
          </a>
        )}
        {ogloszenie?.last_error && !wynik && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{ogloszenie.last_error}</p>}
        {wynik && (
          <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${wynik.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>
            {wynik.ok ? (
              wynik.teksty[0]
            ) : (
              <>
                <p className="font-semibold">Zanim wyślemy, uzupełnij:</p>
                <ul className="mt-1 list-disc pl-5">
                  {wynik.teksty.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
        {historia.length > 0 && (
          <details className="mt-5 border-t border-slate-100 pt-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700">Historia z Otodom ({historia.length})</summary>
            <ul className="mt-3 space-y-2">
              {historia.map((z, i) => (
                <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                  <span className="text-slate-800">
                    {ZDARZENIA[z.event_type ?? ""] ?? z.event_type}
                    {z.code && <span className="text-slate-500"> · {statusy[z.code]?.label ?? z.code}</span>}
                    {z.message && <span className="block text-xs text-rose-600">{z.message}</span>}
                  </span>
                  <span className="text-xs tabular-nums text-slate-400">
                    {new Date(z.created_at).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}
