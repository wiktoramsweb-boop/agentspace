import { requireModul } from "@/lib/auth";
import { stanDostepu } from "@/lib/abonament-cennik";
import {
  PLANS,
  SITE_ADDON,
  liczbaAgentow,
  opisZamowienia,
  planForAgents,
  zamowienia,
} from "@/lib/data-abonament";
import { stanKredytow } from "@/lib/kredyty";
import { Zakupy } from "./zakupy";

export const metadata = { title: "Abonament i płatności" };

/**
 * Zakupy biura: abonament, strona internetowa, dodatkowe kredyty.
 *
 * Za modułem „abonament”, który domyślnie ma tylko CEO. Może go nadać
 * dyrektorowi albo księgowej, bo to on decyduje, kto zaciąga zobowiązania.
 */
export default async function AbonamentUstawieniaPage() {
  const user = await requireModul("abonament");
  const agencyId = user.agency_id;

  const dostep = stanDostepu(user.agency ?? null);
  const agentow = agencyId ? await liczbaAgentow(agencyId) : 1;
  const historia = agencyId ? await zamowienia(agencyId) : [];
  const kredyty = agencyId ? await stanKredytow(agencyId) : null;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {dostep.probny ? "Okres próbny" : "Wasz abonament"}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {dostep.probny && dostep.dniDoKonca != null && (
            <>
              Zostało <strong>{dostep.dniDoKonca} dni</strong>. Po tym czasie dostęp się wstrzyma,
              a dane zostaną nietknięte i wrócą po opłaceniu.
            </>
          )}
          {!dostep.probny && dostep.dniDoKonca != null && (
            <>
              Aktywny jeszcze przez <strong>{dostep.dniDoKonca} dni</strong>.
            </>
          )}
          {!dostep.probny && dostep.dniDoKonca == null && <>Aktywny bezterminowo.</>}
        </p>
        {kredyty && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Kredyty AI w tym miesiącu: {kredyty.zostalo.toLocaleString("pl-PL")} z{" "}
            {(kredyty.pula + kredyty.dokupioneDostepne).toLocaleString("pl-PL")} dostępnych.
          </p>
        )}
      </div>

      <Zakupy
        plany={PLANS}
        sugerowany={planForAgents(agentow).id}
        agentow={agentow}
        stronaMiesiecznie={SITE_ADDON.monthly}
        wdrozenieStrony={SITE_ADDON.setup}
      />

      {historia.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Wasze zamówienia
          </h2>
          <ul className="mt-3 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800">
            {historia.map((z) => (
              <li
                key={z.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <span className="text-slate-700 dark:text-slate-200">{opisZamowienia(z)}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    z.status === "oplacone"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                      : z.status === "anulowane"
                        ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
                  }`}
                >
                  {z.status === "oplacone"
                    ? "opłacone"
                    : z.status === "anulowane"
                      ? "anulowane"
                      : "czeka na wpłatę"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
