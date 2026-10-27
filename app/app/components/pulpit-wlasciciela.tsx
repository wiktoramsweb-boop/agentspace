import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { doUwagi, tydzienBiura } from "@/lib/raport-tygodniowy";
import { formatPln } from "@/lib/format";

/**
 * „Biuro w skrócie” na górze pulpitu CEO i dyrektora.
 *
 * To samo, co poniedziałkowy mail, tylko na żywo: pieniądze, transakcje
 * w toku i lista tego, co się pali. Właściciel otwiera aplikację na
 * telefonie między spotkaniami i ma wiedzieć w pół minuty, czy musi
 * w coś wejść.
 */
export async function PulpitWlasciciela({ agencyId }: { agencyId: string }) {
  const admin = createSupabaseAdmin();
  const teraz = new Date();
  const poczatekMiesiaca = new Date(teraz.getFullYear(), teraz.getMonth(), 1);
  const poprzedniPoczatek = new Date(teraz.getFullYear(), teraz.getMonth() - 1, 1);
  // Ten sam odcinek poprzedniego miesiąca: 1.–dziś, inaczej porównanie w połowie miesiąca zawsze wyjdzie na minus.
  const poprzedniDzis = new Date(teraz.getFullYear(), teraz.getMonth() - 1, Math.min(teraz.getDate(), new Date(teraz.getFullYear(), teraz.getMonth(), 0).getDate()), 23, 59);

  const [tydzien, zamkniete, wToku, oferty] = await Promise.all([
    tydzienBiura(agencyId, teraz),
    admin.from("deals").select("commission_pln, closed_at").eq("agency_id", agencyId).eq("status", "zamkniety").gte("closed_at", poprzedniPoczatek.toISOString()),
    admin.from("deals").select("commission_pln").eq("agency_id", agencyId).eq("status", "w_toku").limit(2000),
    admin.from("properties").select("id", { count: "exact" }).eq("agency_id", agencyId).eq("status", "aktywna").limit(1),
  ]);

  const lista = (zamkniete.data ?? []) as { commission_pln: number | null; closed_at: string }[];
  const tenMiesiac = lista.filter((d) => d.closed_at >= poczatekMiesiaca.toISOString()).reduce((a, d) => a + (d.commission_pln ?? 0), 0);
  const poprzedni = lista
    .filter((d) => d.closed_at < poczatekMiesiaca.toISOString() && d.closed_at <= poprzedniDzis.toISOString())
    .reduce((a, d) => a + (d.commission_pln ?? 0), 0);
  const zmiana = poprzedni > 0 ? Math.round(((tenMiesiac - poprzedni) / poprzedni) * 100) : null;
  const wTokuLista = (wToku.data ?? []) as { commission_pln: number | null }[];
  const uwaga = doUwagi(tydzien);

  return (
    <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6" aria-labelledby="biuro-w-skrocie">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="biuro-w-skrocie" className="text-lg font-semibold text-slate-900">
          Biuro w skrócie
        </h2>
        <Link href="/app/raporty" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
          Raporty →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kafel
          etykieta="Prowizje biura (mc)"
          wartosc={formatPln(tenMiesiac)}
          dopisek={zmiana == null ? "brak porównania z poprzednim miesiącem" : `${zmiana >= 0 ? "+" : ""}${zmiana}% do tego samego okresu`}
          ton={zmiana == null ? undefined : zmiana >= 0 ? "dobrze" : "zle"}
        />
        <Kafel etykieta="W toku" wartosc={formatPln(wTokuLista.reduce((a, d) => a + (d.commission_pln ?? 0), 0))} dopisek={`${wTokuLista.length} transakcji`} />
        <Kafel etykieta="Nowe leady (7 dni)" wartosc={String(tydzien.noweLeady)} dopisek={tydzien.leadyBezTelefonu ? `${tydzien.leadyBezTelefonu} bez telefonu ponad dobę` : "wszystkie obdzwonione"} ton={tydzien.leadyBezTelefonu ? "zle" : undefined} />
        <Kafel etykieta="Aktywne oferty" wartosc={String(oferty.count ?? 0)} dopisek={`${tydzien.noweOferty} nowych w tym tygodniu`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className={`rounded-2xl p-4 ${uwaga.length ? "bg-amber-50" : "bg-emerald-50"}`}>
          <p className={`text-sm font-semibold ${uwaga.length ? "text-amber-900" : "text-emerald-900"}`}>{uwaga.length ? "Wymaga uwagi" : "Nic się nie pali"}</p>
          {uwaga.length ? (
            <ul className="mt-2 space-y-1.5">
              {uwaga.map((u) => (
                <li key={u.tekst}>
                  <Link href={u.href} className="flex items-start justify-between gap-3 text-sm text-amber-900 hover:underline">
                    <span>{u.tekst}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-emerald-800">Leady obdzwonione, klienci w portalu mają odpowiedzi, zespół pracuje.</p>
          )}
        </div>

        {tydzien.oddzialy.length > 0 ? (
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-900">Oddziały w tym tygodniu</p>
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-400">
                <tr>
                  <th className="pb-1 font-medium">Oddział</th>
                  <th className="pb-1 text-right font-medium">Telefony</th>
                  <th className="pb-1 text-right font-medium">Prezentacje</th>
                  <th className="pb-1 text-right font-medium">Prowizje</th>
                </tr>
              </thead>
              <tbody>
                {tydzien.oddzialy.map((o) => (
                  <tr key={o.nazwa} className="border-t border-slate-200">
                    <td className="py-1.5 font-medium text-slate-800">{o.nazwa}</td>
                    <td className="py-1.5 text-right tabular-nums">{o.telefony}</td>
                    <td className="py-1.5 text-right tabular-nums">{o.prezentacje}</td>
                    <td className="py-1.5 text-right tabular-nums">{o.prowizje ? formatPln(o.prowizje) : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-900">Najaktywniejsi w tym tygodniu</p>
            <ul className="space-y-1.5 text-sm">
              {tydzien.ludzie
                .slice()
                .sort((a, b) => b.telefony + b.prezentacje - (a.telefony + a.prezentacje))
                .slice(0, 4)
                .map((l) => (
                  <li key={l.id} className="flex justify-between gap-3">
                    <span className="truncate text-slate-800">{l.imie}</span>
                    <span className="tabular-nums text-slate-500">
                      {l.telefony} tel. · {l.prezentacje} prez.
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function Kafel({ etykieta, wartosc, dopisek, ton }: { etykieta: string; wartosc: string; dopisek: string; ton?: "dobrze" | "zle" }) {
  return (
    <div className="min-w-0 rounded-2xl bg-slate-50 p-3 sm:p-4">
      <p className="text-xs font-medium text-slate-500">{etykieta}</p>
      <p className="mt-1 truncate text-xl font-semibold tabular-nums text-slate-900 sm:text-2xl">{wartosc}</p>
      <p className={`mt-0.5 text-xs ${ton === "dobrze" ? "text-emerald-700" : ton === "zle" ? "text-amber-700" : "text-slate-500"}`}>{dopisek}</p>
    </div>
  );
}
