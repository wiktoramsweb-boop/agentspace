import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { stanDostepu } from "@/lib/abonament-cennik";
import { PLANS, planForAgents, liczbaAgentow, zamowienia, opisZamowienia } from "@/lib/data-abonament";
import { WyborAbonamentu } from "./wybor";

export const metadata: Metadata = {
  title: "Abonament",
  robots: { index: false, follow: false },
};

/**
 * Ekran płatności. Celowo poza /app, bo właśnie tam trafia biuro, któremu
 * skończył się dostęp: gdyby leżał pod /app, bramka z layoutu odesłałaby
 * użytkownika w kółko.
 */
export default async function AbonamentPage() {
  const user = await requireUser();
  const dostep = stanDostepu(user.agency ?? null);
  const agentow = user.agency_id ? await liczbaAgentow(user.agency_id) : 1;
  const historia = user.agency_id ? await zamowienia(user.agency_id) : [];
  const czyCeo = user.role === "owner";

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900 md:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <Link href="/app" className="text-sm text-slate-500 transition hover:text-slate-700">
            ← Wróć do aplikacji
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Abonament</h1>
          <p className="mt-2 text-slate-600">
            {dostep.aktywne && dostep.probny && (
              <>Okres próbny kończy się za {dostep.dniDoKonca} dni. Wybierz pakiet, żeby pracować dalej.</>
            )}
            {dostep.aktywne && !dostep.probny && dostep.dniDoKonca != null && (
              <>Abonament jest aktywny jeszcze przez {dostep.dniDoKonca} dni.</>
            )}
            {dostep.aktywne && !dostep.probny && dostep.dniDoKonca == null && <>Abonament jest aktywny.</>}
            {!dostep.aktywne && (
              <>
                Dostęp do aplikacji jest wstrzymany. Wasze dane są bezpieczne i wrócą w całości po
                opłaceniu abonamentu.
              </>
            )}
          </p>
        </header>

        <WyborAbonamentu
          plany={PLANS}
          sugerowany={planForAgents(agentow).id}
          agentow={agentow}
          czyCeo={czyCeo}
        />

        {historia.length > 0 && (
          <section className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Twoje zamówienia
            </h2>
            <ul className="mt-3 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
              {historia.map((z) => (
                <li key={z.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <span className="text-slate-700">{opisZamowienia(z)}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      z.status === "oplacone"
                        ? "bg-emerald-100 text-emerald-700"
                        : z.status === "anulowane"
                          ? "bg-slate-100 text-slate-600"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {z.status === "oplacone" ? "opłacone" : z.status === "anulowane" ? "anulowane" : "czeka na wpłatę"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
