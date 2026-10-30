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

  const szescMiesiecy = new Date(teraz.getFullYear(), teraz.getMonth() - 5, 1);

  const [tydzien, zamkniete, wToku, oferty] = await Promise.all([
    tydzienBiura(agencyId, teraz),
    admin.from("deals").select("commission_pln, closed_at").eq("agency_id", agencyId).eq("status", "zamkniety").gte("closed_at", szescMiesiecy.toISOString()),
    admin.from("deals").select("commission_pln").eq("agency_id", agencyId).eq("status", "w_toku").limit(2000),
    admin.from("properties").select("id", { count: "exact" }).eq("agency_id", agencyId).eq("status", "aktywna").limit(1),
  ]);

  const lista = (zamkniete.data ?? []) as { commission_pln: number | null; closed_at: string }[];
  const tenMiesiac = lista.filter((d) => d.closed_at >= poczatekMiesiaca.toISOString()).reduce((a, d) => a + (d.commission_pln ?? 0), 0);
  const poprzedni = lista
    .filter((d) => d.closed_at >= poprzedniPoczatek.toISOString() && d.closed_at < poczatekMiesiaca.toISOString() && d.closed_at <= poprzedniDzis.toISOString())
    .reduce((a, d) => a + (d.commission_pln ?? 0), 0);
  const zmiana = poprzedni > 0 ? Math.round(((tenMiesiac - poprzedni) / poprzedni) * 100) : null;
  const wTokuLista = (wToku.data ?? []) as { commission_pln: number | null }[];
  const uwaga = doUwagi(tydzien);

  const miesiace = Array.from({ length: 6 }, (_, i) => {
    const od = new Date(teraz.getFullYear(), teraz.getMonth() - 5 + i, 1);
    const doM = new Date(teraz.getFullYear(), teraz.getMonth() - 4 + i, 1);
    const suma = lista.filter((d) => d.closed_at >= od.toISOString() && d.closed_at < doM.toISOString()).reduce((a, d) => a + (d.commission_pln ?? 0), 0);
    return { nazwa: new Intl.DateTimeFormat("pl-PL", { month: "short", timeZone: "Europe/Warsaw" }).format(od), suma };
  });
  const szczyt = Math.max(1, ...miesiace.map((m) => m.suma));
  const aktywni = tydzien.ludzie
    .slice()
    .sort((a, b) => b.telefony + b.prezentacje - (a.telefony + a.prezentacje))
    .slice(0, 4);
  const szczytLudzi = Math.max(1, ...aktywni.map((l) => l.telefony + l.prezentacje));

  return (
    <section className="mb-6 space-y-4" aria-labelledby="biuro-w-skrocie">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="biuro-w-skrocie" className="text-lg font-semibold text-slate-900">
          Biuro w skrócie
        </h2>
        <Link href="/app/raporty" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
          Raporty →
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-lg shadow-slate-900/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-slate-300">Prowizje biura w tym miesiącu</p>
              <p className="mt-1 truncate text-4xl font-bold tabular-nums">{formatPln(tenMiesiac)}</p>
            </div>
            {zmiana != null && (
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${zmiana >= 0 ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-300"}`}>
                {zmiana >= 0 ? "+" : ""}
                {zmiana}% do tego okresu mc temu
              </span>
            )}
          </div>
          <div className="mt-6 flex h-28 items-end gap-2" aria-hidden="true">
            {miesiace.map((m, i) => (
              <div key={m.nazwa + i} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <div className="w-full rounded-t-lg" style={{ height: `${Math.max(6, (m.suma / szczyt) * 84)}px`, background: i === miesiace.length - 1 ? "#34d399" : "rgba(148, 163, 184, 0.35)" }} title={formatPln(m.suma)} />
                <span className="text-[11px] text-slate-400">{m.nazwa}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <Kafel ikona="M4 7h16M4 12h16M4 17h10" kolor="bg-sky-100 text-sky-600" etykieta="W toku" wartosc={formatPln(wTokuLista.reduce((a, d) => a + (d.commission_pln ?? 0), 0))} dopisek={`${wTokuLista.length} transakcji`} href="/app/prowizje" />
          <Kafel ikona="M12 8v8m-4-4h8M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" kolor="bg-fuchsia-100 text-fuchsia-600" etykieta="Nowe leady (7 dni)" wartosc={String(tydzien.noweLeady)} dopisek={tydzien.leadyBezTelefonu ? `${tydzien.leadyBezTelefonu} bez telefonu ponad dobę` : "wszystkie obdzwonione"} zle={tydzien.leadyBezTelefonu > 0} href="/app/leady" />
          <Kafel ikona="M3 21h18M5 21V7l7-4 7 4v14M10 21v-4h4v4" kolor="bg-blue-100 text-blue-600" etykieta="Aktywne oferty" wartosc={String(oferty.count ?? 0)} dopisek={`${tydzien.noweOferty} nowych w tym tygodniu`} href="/app/nieruchomosci" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="flex items-center gap-2 font-semibold text-slate-900">
            <span className={`h-2.5 w-2.5 rounded-full ${uwaga.length ? "bg-amber-500" : "bg-emerald-500"}`} aria-hidden="true" />
            {uwaga.length ? `Wymaga uwagi (${uwaga.length})` : "Nic się nie pali"}
          </p>
          {uwaga.length ? (
            <ul className="mt-3 divide-y divide-slate-100">
              {uwaga.map((u) => (
                <li key={u.tekst}>
                  <Link href={u.href} className="flex items-start justify-between gap-3 py-2.5 text-sm text-slate-700 hover:text-emerald-700">
                    <span>{u.tekst}</span>
                    <span aria-hidden="true" className="text-slate-400">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Leady obdzwonione, klienci w portalu mają odpowiedzi, zespół pracuje.</p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          {tydzien.oddzialy.length > 0 ? (
            <>
              <p className="mb-2 font-semibold text-slate-900">Oddziały w tym tygodniu</p>
              <ul className="divide-y divide-slate-100">
                {tydzien.oddzialy.map((o) => (
                  <li key={o.nazwa} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0 truncate font-medium text-slate-800">{o.nazwa}</span>
                    <span className="flex-shrink-0 tabular-nums text-slate-500">
                      {o.telefony} tel. · {o.prezentacje} prez. · <b className="font-semibold text-slate-800">{o.prowizje ? formatPln(o.prowizje) : "0 zł"}</b>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="mb-3 font-semibold text-slate-900">Najaktywniejsi w tym tygodniu</p>
              {aktywni.length === 0 && <p className="text-sm text-slate-500">Jeszcze nikt nie zapisał aktywności.</p>}
              <ul className="space-y-3">
                {aktywni.map((l) => (
                  <li key={l.id}>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="truncate font-medium text-slate-800">{l.imie}</span>
                      <span className="flex-shrink-0 tabular-nums text-slate-500">
                        {l.telefony} tel. · {l.prezentacje} prez.
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(4, ((l.telefony + l.prezentacje) / szczytLudzi) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Kafel({ ikona, kolor, etykieta, wartosc, dopisek, zle, href }: { ikona: string; kolor: string; etykieta: string; wartosc: string; dopisek: string; zle?: boolean; href: string }) {
  return (
    <Link href={href} className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300">
      <span className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl ${kolor}`}>
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d={ikona} />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-slate-500">{etykieta}</span>
        <span className="block truncate text-xl font-bold tabular-nums text-slate-900">{wartosc}</span>
        <span className={`block truncate text-xs ${zle ? "text-amber-700" : "text-slate-500"}`}>{dopisek}</span>
      </span>
    </Link>
  );
}
