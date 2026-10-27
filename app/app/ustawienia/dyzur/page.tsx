import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { getDyzur } from "@/lib/dyzur";
import { getAgencyAgents } from "@/lib/data-activities";
import { ResultForm } from "../result-form";
import { Select } from "../../components/select";
import { zapiszUstawieniaDyzuru } from "./actions";
import { ProbnaRozmowa } from "./probna-rozmowa";

export const metadata = { title: "Dyżur AI" };

const pole = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15";

export default async function DyzurPage() {
  // Dyżur AI jest na razie wyłączony z produktu; kod zostaje na później.
  if (process.env.DYZUR_WLACZONY !== "1") redirect("/app/ustawienia");
  const owner = await requireOwner();
  const cfg = await getDyzur(owner.agency_id!);
  const agenci = await getAgencyAgents(owner.agency_id!);
  const tokenJest = Boolean(process.env.TWILIO_AUTH_TOKEN);
  const numerCyfry = cfg.numer.replace(/\D/g, "").replace(/^48/, "");

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-900 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Dyżur AI</p>
            <h2 className="mt-1 text-2xl font-semibold">Telefon nie przepada, gdy jesteś na prezentacji.</h2>
          </div>
          <span className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${cfg.wlaczony && tokenJest ? "bg-emerald-400 text-slate-900" : "bg-white/10 text-slate-300"}`}>
            {cfg.wlaczony && tokenJest ? "Włączony" : cfg.wlaczony ? "Czeka na podłączenie Twilio" : "Wyłączony"}
          </span>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          Gdy nie odbierasz, połączenie przechodzi na numer Dyżuru. AI wita klienta głosem, pyta, w jakiej sprawie dzwoni, i jak się nazywa. Lead z numerem i zapisem rozmowy od razu ląduje w
          Leadach, a reguła „nowy lead” może go komuś przydzielić. Jedna wypowiedź AI to 1 kredyt.
        </p>
      </div>

      <ResultForm action={zapiszUstawieniaDyzuru}>
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Ustawienia</h3>
          <label className="mb-4 flex items-center gap-3 text-sm font-medium text-slate-800">
            <input type="checkbox" name="wlaczony" value="1" defaultChecked={cfg.wlaczony} className="h-5 w-5 rounded border-slate-300 text-emerald-600" />
            Dyżur AI odbiera telefony
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Numer Dyżuru (z Twilio)
              <input name="numer" defaultValue={cfg.numer} placeholder="+48 12 345 67 89" className={pole} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Jak AI przedstawia biuro
              <input name="nazwa" defaultValue={cfg.nazwa || owner.agency?.name || ""} placeholder="np. Spectra Nieruchomości" className={pole} />
            </label>
          </div>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Powitanie
            <textarea name="powitanie" rows={2} defaultValue={cfg.powitanie} className={pole} />
          </label>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Co AI ma wiedzieć o biurze
            <textarea name="informacje" rows={3} defaultValue={cfg.informacje} placeholder="np. Pracujemy w Krakowie i okolicach, głównie mieszkania z rynku wtórnego. Biuro czynne 9-17." className={pole} />
          </label>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Komu dawać leady z telefonu
            <div className="mt-1">
              <Select name="opiekun_id" defaultValue={cfg.opiekun_id ?? ""} placeholder="Pula biura (reguły automatyzacji)">
                {agenci.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>
          </label>
        </section>
      </ResultForm>

      <ProbnaRozmowa powitanie={cfg.powitanie} />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-6">
        <h3 className="mb-1 text-lg font-semibold text-slate-900">Jak podłączyć telefon</h3>
        <p className="mb-4 text-sm text-slate-500">Raz, około 15 minut. Numer i rozmowy rozlicza Twilio (polski numer to kilkadziesiąt złotych miesięcznie plus minuty).</p>
        <ol className="space-y-3 text-sm text-slate-700">
          <li className="rounded-2xl bg-slate-50 p-4">
            <b>1. Konto i numer w Twilio.</b> Załóż konto na twilio.com i kup polski numer z obsługą głosu. Wpisz go wyżej w polu „Numer Dyżuru”.
          </li>
          <li className="rounded-2xl bg-slate-50 p-4">
            <b>2. Adres dla połączeń.</b> W ustawieniach numeru, w polu „A call comes in”, wybierz Webhook, metoda POST, adres:
            <code className="mt-2 block break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-slate-900 ring-1 ring-slate-200">https://www.agentspace.pl/api/dyzur/glos</code>
          </li>
          <li className="rounded-2xl bg-slate-50 p-4">
            <b>3. Klucz Twilio.</b> {tokenJest ? "Klucz jest już ustawiony na serwerze." : "Auth Token z Twilio trzeba dodać na serwerze jako TWILIO_AUTH_TOKEN. Przekaż go nam, nie wysyłaj mailem w otwartym tekście."} Bez niego Dyżur odrzuca połączenia, żeby nikt
            nie podszył się pod Twilio.
          </li>
          <li className="rounded-2xl bg-slate-50 p-4">
            <b>4. Przekierowanie z Twojego telefonu.</b> Wpisz na komórce i zadzwoń:
            <span className="mt-2 grid gap-2 sm:grid-cols-3">
              <span className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                gdy nie odbierasz: <code className="font-mono font-semibold">**61*{numerCyfry ? `+48${numerCyfry}` : "+48NUMER"}#</code>
              </span>
              <span className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                gdy zajęte: <code className="font-mono font-semibold">**67*{numerCyfry ? `+48${numerCyfry}` : "+48NUMER"}#</code>
              </span>
              <span className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                gdy poza zasięgiem: <code className="font-mono font-semibold">**62*{numerCyfry ? `+48${numerCyfry}` : "+48NUMER"}#</code>
              </span>
            </span>
            <span className="mt-2 block text-xs text-slate-500">Wyłączenie wszystkich przekierowań: ##002#. Kody działają u polskich operatorów, część abonamentów liczy przekierowanie jak zwykłe połączenie.</span>
          </li>
        </ol>
      </section>
    </div>
  );
}
