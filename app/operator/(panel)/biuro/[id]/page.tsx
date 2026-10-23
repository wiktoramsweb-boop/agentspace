import Link from "next/link";
import { notFound } from "next/navigation";
import { szczegolyBiura } from "@/lib/data-operator";
import { pulaMiesieczna } from "@/lib/kredyty-cennik";
import { NAZWY_OPERACJI } from "@/lib/kredyty-cennik";
import { przedluzDostep, ustawKredyty, ustawPakiet, wejdzJako } from "../../../actions";

export const dynamic = "force-dynamic";

const data = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "-";

const ROLE: Record<string, string> = { owner: "CEO", director: "Dyrektor", manager: "Menedżer", agent: "Agent", trainee: "Stażysta", accountant: "Księgowość", assistant: "Asystent", marketing: "Marketing" };

const pole = "rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-400 focus:outline-none";
const przycisk = "rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20";

export default async function BiuroOperatora({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await szczegolyBiura(id);
  if (!s) notFound();
  const b = s.biuro;
  const pula = pulaMiesieczna({ plan: (b.subscription_plan as string) ?? (b.plan as string) ?? null, ai_credits_monthly: (b.ai_credits_monthly as number | null) ?? null }, s.osoby.length);
  const zuzyte = s.kredytyWgOperacji.reduce((x, k) => x + k.kredyty, 0);

  return (
    <div className="space-y-8">
      <Link href="/operator" className="text-sm text-zinc-400 hover:text-white">← Wszystkie biura</Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Biuro {b.is_demo ? "· demo" : ""}</p>
          <h1 className="mt-1 text-3xl font-semibold text-white">{(b.name as string) ?? "Bez nazwy"}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Założone {data(b.created_at as string)} · {s.dostep.aktywne ? (s.dostep.probny ? "okres próbny" : "aktywny dostęp") : "dostęp wygasł"} · pakiet {(b.subscription_plan as string) ?? (b.plan as string) ?? "-"}
          </p>
        </div>
        <form action={wejdzJako} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="biuro" value={id} />
          <select name="cel" required defaultValue="" className={pole} aria-label="Cel wejścia">
            <option value="" disabled>Cel wejścia...</option>
            <option value="zgloszenie">Zgłoszenie biura</option>
            <option value="awaria">Awaria</option>
            <option value="konfiguracja">Konfiguracja na prośbę biura</option>
            <option value="prawo">Obowiązek prawny</option>
          </select>
          <button className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-emerald-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400">
            Wejdź do aplikacji jako CEO →
          </button>
        </form>
      </header>

      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {s.liczby.map((l) => (
          <div key={l.etykieta} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">{l.etykieta}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{l.wartosc.toLocaleString("pl-PL")}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03]">
          <h2 className="border-b border-white/10 px-5 py-4 font-semibold text-white">Zespół ({s.osoby.length})</h2>
          <ul className="divide-y divide-white/5">
            {s.osoby.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{o.imie} <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-zinc-300">{ROLE[o.rola] ?? o.rola}</span></p>
                  <p className="text-xs text-zinc-500">{o.email} · od {data(o.od).slice(0, 10)}</p>
                </div>
                <span className="text-xs text-zinc-400">{o.ostatnio ? `AI: ${data(o.ostatnio)}` : "brak AI w tym mies."} · {o.kredyty} kr.</span>
                <form action={wejdzJako} className="flex items-center gap-2">
                  <input type="hidden" name="biuro" value={id} />
                  <input type="hidden" name="osoba" value={o.id} />
                  <select name="cel" required defaultValue="" className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white" aria-label="Cel wejścia">
                    <option value="" disabled>cel...</option>
                    <option value="zgloszenie">zgłoszenie</option>
                    <option value="awaria">awaria</option>
                    <option value="konfiguracja">konfiguracja</option>
                    <option value="prawo">obowiązek prawny</option>
                  </select>
                  <button className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-emerald-400 hover:text-white">Wejdź jako</button>
                </form>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-semibold text-white">Dostęp</h2>
            <p className="mt-1 text-sm text-zinc-400">Trial do {data(b.trial_ends_at as string)} · abonament do {data(b.subscription_ends_at as string)}</p>
            <form action={przedluzDostep} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="biuro" value={id} />
              <input name="dni" type="number" min={1} max={730} defaultValue={14} className={`${pole} w-24`} aria-label="Dni" />
              <select name="rodzaj" className={pole} aria-label="Co przedłużyć">
                <option value="trial">okres próbny</option>
                <option value="abonament">abonament</option>
              </select>
              <button className={przycisk}>Przedłuż</button>
            </form>
            <form action={ustawPakiet} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="biuro" value={id} />
              <select name="plan" defaultValue={(b.subscription_plan as string) ?? "pro"} className={pole} aria-label="Pakiet">
                <option value="solo">Solo</option>
                <option value="start">Start</option>
                <option value="pro">Pro</option>
                <option value="biuro">Biuro</option>
              </select>
              <select name="okres" defaultValue={(b.subscription_period as string) ?? "monthly"} className={pole} aria-label="Okres">
                <option value="monthly">miesięcznie</option>
                <option value="half_year">pół roku</option>
                <option value="yearly">rok</option>
              </select>
              <button className={przycisk}>Ustaw pakiet</button>
            </form>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-semibold text-white">Kredyty AI w tym miesiącu</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Zużyte <b className="text-white">{zuzyte.toLocaleString("pl-PL")}</b> z puli {pula.toLocaleString("pl-PL")}
              {Number(b.ai_credits_extra ?? 0) ? ` + dokupione ${Number(b.ai_credits_extra) - Number(b.ai_credits_extra_used ?? 0)}` : ""}
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              {s.kredytyWgOperacji.slice(0, 8).map((k) => (
                <li key={k.operacja} className="flex justify-between text-zinc-300">
                  <span>{NAZWY_OPERACJI[k.operacja as keyof typeof NAZWY_OPERACJI] ?? k.operacja}</span>
                  <span className="tabular-nums">{k.kredyty}</span>
                </li>
              ))}
            </ul>
            <form action={ustawKredyty} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="biuro" value={id} />
              <input name="pula" type="number" min={0} placeholder="pula/mies. (puste = z pakietu)" defaultValue={(b.ai_credits_monthly as number | null) ?? ""} className={`${pole} w-56`} aria-label="Pula miesięczna" />
              <input name="dodatek" type="number" min={0} placeholder="dodaj jednorazowo" className={`${pole} w-40`} aria-label="Dodatek" />
              <button className={przycisk}>Zapisz</button>
            </form>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03]">
          <h2 className="border-b border-white/10 px-5 py-4 font-semibold text-white">Ostatnie zdarzenia w biurze</h2>
          <ul className="divide-y divide-white/5 text-sm">
            {s.zdarzenia.length === 0 && <li className="px-5 py-4 text-zinc-500">Brak wpisów w dzienniku.</li>}
            {s.zdarzenia.map((z, i) => (
              <li key={i} className="px-5 py-3">
                <p className="text-zinc-200">{z.co}</p>
                <p className="text-xs text-zinc-500">{data(z.kiedy)}{z.kto ? ` · ${z.kto}` : ""}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
            <h2 className="border-b border-white/10 px-5 py-4 font-semibold text-white">Zamówienia</h2>
            <ul className="divide-y divide-white/5 text-sm">
              {s.zamowienia.length === 0 && <li className="px-5 py-4 text-zinc-500">Brak zamówień.</li>}
              {s.zamowienia.map((z) => (
                <li key={z.id} className="flex justify-between px-5 py-3 text-zinc-300">
                  <span>{z.opis} · {data(z.kiedy).slice(0, 10)}</span>
                  <span className="tabular-nums">{z.kwota.toLocaleString("pl-PL")} zł · {z.status}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm">
            <h2 className="font-semibold text-white">Ustawienia biura</h2>
            <p className="mt-1 text-zinc-400">Zapisane sekcje: {s.ustawienia.length ? s.ustawienia.join(", ") : "brak"}. Kolor ofertówki zmienisz w Ofertówce, dane firmy, stronę www i Dyżur AI w Ustawieniach, po wejściu do aplikacji jako CEO.</p>
            <div className="mt-3 text-xs text-zinc-500">
              <p>Rejestr wejść (biuro może go zażądać, umowa powierzenia §2):</p>
              {s.wejscia.length ? (
                <ul className="mt-1 space-y-0.5">
                  {s.wejscia.map((w, i) => (
                    <li key={i}>{data(w.kiedy)} · {w.cel}</li>
                  ))}
                </ul>
              ) : (
                <p>brak wejść</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
