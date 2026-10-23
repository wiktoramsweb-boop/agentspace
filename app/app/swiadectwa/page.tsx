import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { zamowieniaSwiadectw } from "@/lib/data-swiadectwa";
import { CENY_OBIEKTU, TRYBY, type TypObiektu } from "@/lib/swiadectwa";
import { formatDatePL } from "@/lib/datetime";
import { PageHeader } from "../components/page-header";
import { PobierzKarte } from "./pobierz-karte";

export const metadata = { title: "Świadectwa energetyczne" };

export default async function SwiadectwaPage() {
  const user = await requireUser();
  const zamowienia = await zamowieniaSwiadectw(user);

  return (
    <>
      <PageHeader
        title="Świadectwa energetyczne"
        subtitle="Świadectwo do oferty bez szukania audytora: formularz w kilka minut, reszta po naszej stronie."
        action={
          <Link href="/app/swiadectwa/nowe" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400">
            Zamów świadectwo →
          </Link>
        }
      />

      <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl bg-emerald-100 text-xl">⚡</span>
          <div>
            <h2 className="font-semibold text-slate-900">Wymagane prawnie przy sprzedaży i najmie</h2>
            <p className="mt-1 text-sm text-slate-600">
              Od 28 kwietnia 2023 r. każde ogłoszenie sprzedaży lub najmu musi podawać wskaźnik EP ze świadectwa, a właściciel przekazuje świadectwo przy umowie. Zamawiasz tutaj i płacisz z góry przelewem. Po wpłacie audytor kontaktuje się z
              właścicielem, a gotowy PDF dostajesz zwykle w 2 dni robocze.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {(Object.keys(CENY_OBIEKTU) as TypObiektu[]).map((t) => (
            <div key={t} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">{CENY_OBIEKTU[t].nazwa}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{CENY_OBIEKTU[t].cena} zł</p>
              <p className="text-xs text-slate-500">netto, tryb standard (do 2 dni). Express w 24 godziny +{TRYBY.express.doplata} zł.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Zamówienia {user.role === "owner" || user.role === "manager" ? "biura" : ""}</h2>
        {zamowienia.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Nie ma jeszcze zamówień.{" "}
            <Link href="/app/swiadectwa/nowe" className="font-medium text-emerald-700 hover:underline">
              Zamów pierwsze świadectwo
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {zamowienia.map((z) => (
              <li key={z.numer} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{z.adres}</p>
                  <p className="text-xs text-slate-500">
                    {z.numer} · {formatDatePL(z.data)} · {CENY_OBIEKTU[z.typ]?.nazwa} · {TRYBY[z.tryb]?.nazwa} · {z.cena.netto} zł netto{z.agent ? ` · ${z.agent}` : ""}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {z.status === "czeka_na_wplate" ? (
                    <span className="rounded-lg bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">Czeka na wpłatę</span>
                  ) : (
                    <span className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">Opłacone, u audytora</span>
                  )}
                  <PobierzKarte numer={z.numer} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
