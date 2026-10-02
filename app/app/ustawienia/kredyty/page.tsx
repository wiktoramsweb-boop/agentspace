import { requireOwner } from "@/lib/auth";
import { Card } from "../../components/ui";
import {
  CENNIK_KREDYTOW,
  NAZWY_OPERACJI,
  type Operacja,
  stanKredytow,
  zuzycieMiesiaca,
} from "@/lib/kredyty";

export const metadata = { title: "Zużycie AI" };

/**
 * Ile kredytów AI zostało biuru na ten miesiąc i co je zużywa.
 *
 * Właściciel płaci za AI w abonamencie, więc musi widzieć, dokąd to idzie,
 * zanim zobaczy komunikat „skończyły się kredyty".
 */
export default async function KredytyPage() {
  const owner = await requireOwner();
  const stan = owner.agency_id ? await stanKredytow(owner.agency_id) : null;
  const zuzycie = owner.agency_id ? await zuzycieMiesiaca(owner.agency_id) : null;

  if (!stan) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Zużycie AI</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Licznik kredytów jeszcze nie działa. Uruchom w Supabase migrację{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
            lib/SETUP-v35-kredyty.sql
          </code>
          . Do tego czasu AI działa bez ograniczeń.
        </p>
      </Card>
    );
  }

  const procent = stan.pula > 0 ? Math.min(100, Math.round((stan.zuzyte / stan.pula) * 100)) : 0;
  const malo = procent >= 80;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Kredyty AI w tym miesiącu
          </h2>

        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-4xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {stan.zostalo.toLocaleString("pl-PL")}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            z {(stan.pula + stan.dokupioneDostepne).toLocaleString("pl-PL")} dostępnych
          </span>
        </div>

        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={`h-full rounded-full transition-all ${malo ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${procent}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Zużyto {stan.zuzyte.toLocaleString("pl-PL")} z {stan.pula.toLocaleString("pl-PL")} kredytów
          pakietu ({procent}%).
          {stan.dokupioneDostepne > 0 && (
            <> Do tego {stan.dokupioneDostepne.toLocaleString("pl-PL")} dokupionych, które nie przepadają.</>
          )}
        </p>
        {malo && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">
            Pula na ten miesiąc jest na wyczerpaniu. Dokupcie pakiet w Ustawieniach, w zakładce
            Abonament i płatności.
          </p>
        )}
      </Card>

      {zuzycie && zuzycie.operacje.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Tabela tytul="Co zużywa kredyty" pozycje={zuzycie.operacje} />
          <Tabela tytul="Kto zużywa kredyty" pozycje={zuzycie.agenci} />
        </div>
      )}

      <Card>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Ile kredytów zużywa co</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Typowa sesja AI Coacha (7 wypowiedzi plus ocena) to 10 kredytów.
        </p>
        <ul className="mt-4 divide-y divide-slate-200 text-sm dark:divide-slate-700">
          {(Object.keys(CENNIK_KREDYTOW) as Operacja[]).map((op) => (
            <li key={op} className="flex items-center justify-between py-2">
              <span className="text-slate-700 dark:text-slate-200">{NAZWY_OPERACJI[op]}</span>
              <span className="tabular-nums text-slate-500 dark:text-slate-400">
                {CENNIK_KREDYTOW[op]} {CENNIK_KREDYTOW[op] === 1 ? "kredyt" : "kredyty"}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Tabela({
  tytul,
  pozycje,
}: {
  tytul: string;
  pozycje: { nazwa: string; kredyty: number; razy: number }[];
}) {
  const max = Math.max(...pozycje.map((p) => p.kredyty), 1);
  return (
    <Card>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{tytul}</h3>
      <ul className="mt-4 space-y-3">
        {pozycje.map((p) => (
          <li key={p.nazwa}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-slate-700 dark:text-slate-200">{p.nazwa}</span>
              <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">
                {p.kredyty.toLocaleString("pl-PL")} kr. / {p.razy}×
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.round((p.kredyty / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
