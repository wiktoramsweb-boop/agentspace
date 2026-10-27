import { requireOwner } from "@/lib/auth";
import { getZasadyProwizji } from "@/lib/data-zasady-prowizji";
import { ResultForm } from "../result-form";
import { zapiszZasadyProwizji } from "./actions";
import { Progi } from "./progi";

export const metadata = { title: "Zasady prowizji" };

const pole = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none";

export default async function ZasadyProwizjiPage() {
  const owner = await requireOwner();
  const { ready, zasady } = await getZasadyProwizji(owner.agency_id);

  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Zasady prowizji</h1>
      <p className="mb-6 max-w-2xl text-slate-600">
        Jak biuro dzieli prowizję. Wszystko liczymy od prowizji netto biura (brutto minus 23% VAT), tak jak udział agenta w transakcji. Rozliczenie miesiąca znajdziesz w Prowizjach.
      </p>
      {!ready && (
        <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Zasady prowizji wymagają migracji <code>lib/SETUP-v54-oddzialy-prowizje.sql</code> w Supabase.
        </p>
      )}
      <ResultForm action={zapiszZasadyProwizji} disabled={!ready}>
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Progi udziału agenta</h2>
          <p className="mb-4 mt-1 text-sm text-slate-500">
            Udział rośnie z prowizją netto, którą agent przyniósł biuru od 1 stycznia. Nowa transakcja podpowiada udział z progu, a agent widzi, ile brakuje mu do następnego.
          </p>
          <Progi poczatkowe={zasady.progi} />
        </section>

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <h2 className="font-semibold text-slate-900">Menedżer i sieć</h2>
            <p className="mt-1 text-sm text-slate-500">Zero znaczy, że biuro tego nie stosuje.</p>
          </div>
          <label className="text-sm text-slate-700">
            Nadprowizja menedżera (% netto)
            <input name="nadprowizja" inputMode="decimal" defaultValue={zasady.nadprowizjaMenedzera || ""} placeholder="np. 5" className={pole} />
            <span className="mt-1 block text-xs text-slate-500">Z transakcji agentów przypisanych menedżerowi albo kierownikowi ich oddziału.</span>
          </label>
          <label className="text-sm text-slate-700">
            Opłata dla sieci (% netto)
            <input name="siec" inputMode="decimal" defaultValue={zasady.oplataSieci || ""} placeholder="np. 8" className={pole} />
            <span className="mt-1 block text-xs text-slate-500">Dla biur we franczyzie albo sieci, od każdej zamkniętej transakcji.</span>
          </label>
          <label className="text-sm text-slate-700 sm:col-span-2">
            Nazwa sieci
            <input name="siec_nazwa" defaultValue={zasady.nazwaSieci ?? ""} placeholder="np. nazwa franczyzodawcy" className={pole} />
          </label>
        </section>
      </ResultForm>
    </>
  );
}
