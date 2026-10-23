import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { konfiguracjaOtodom, stanPolaczenia, PORTAL } from "@/lib/otodom/klient";
import { STATUSY } from "@/lib/otodom/ogloszenia";
import { polaczOtodom, rozlaczOtodom, ustawTrybTestowy } from "./actions";

export const metadata = { title: "Portale ogłoszeniowe" };

const KOMUNIKATY: Record<string, { ok: boolean; t: string }> = {
  polaczono: { ok: true, t: "Konto Otodom połączone. Oferty publikujesz w kreatorze oferty, w ostatnim kroku Publikacja." },
  anulowano: { ok: false, t: "Połączenie anulowane na Otodom." },
  "zly-stan": { ok: false, t: "Link autoryzacji wygasł albo był niepoprawny. Kliknij Połącz jeszcze raz." },
  blad: { ok: false, t: "Otodom nie wydał dostępu. Spróbuj jeszcze raz za chwilę." },
  "brak-konfiguracji": { ok: false, t: "Integracja z Otodom nie jest jeszcze skonfigurowana po stronie AgentSpace." },
};

export default async function PortalePage({ searchParams }: { searchParams: Promise<{ otodom?: string }> }) {
  const user = await requireOwner();
  const { otodom } = await searchParams;
  const komunikat = otodom ? KOMUNIKATY[otodom] : null;
  const pol = await stanPolaczenia(user.agency_id!);
  const konf = konfiguracjaOtodom();
  const { data: wpisy } = pol.tabele
    ? await createSupabaseAdmin()
        .from("portal_listings")
        .select("property_id, status, url, updated_at, last_error, property:properties(title)")
        .eq("agency_id", user.agency_id)
        .eq("portal", PORTAL)
        .order("updated_at", { ascending: false })
        .limit(100)
    : { data: [] };

  return (
    <div className="space-y-6">
      {komunikat && <p className={`rounded-2xl px-4 py-3 text-sm ${komunikat.ok ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{komunikat.t}</p>}
      {!pol.tabele && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Eksport na portale wymaga aktualizacji bazy: uruchom plik <code>lib/SETUP-v50-portale.sql</code> w Supabase.
        </p>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Otodom</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              Publikacja ofert prosto z AgentSpace na konto Twojego biura na Otodom. Logujesz się na Otodom i zgadzasz na dostęp, my nie widzimy Twojego hasła.
            </p>
            <p className="mt-3 text-sm">
              {pol.polaczone ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
                  Połączone{pol.od ? ` od ${new Date(pol.od).toLocaleDateString("pl-PL")}` : ""}
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">Niepołączone</span>
              )}
            </p>
            {pol.blad && <p className="mt-2 text-sm text-rose-600">{pol.blad}</p>}
          </div>
          {pol.polaczone ? (
            <form action={rozlaczOtodom}>
              <button className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-rose-400 hover:text-rose-700">Rozłącz</button>
            </form>
          ) : (
            <form action={polaczOtodom}>
              <button disabled={!konf.gotowe || !pol.tabele} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                Połącz z Otodom →
              </button>
            </form>
          )}
        </div>

        {pol.polaczone && (
          <form action={ustawTrybTestowy} className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
            <input type="hidden" name="test" value={pol.test ? "0" : "1"} />
            <span className="flex-1 text-slate-600">
              Konto testowe OLX: {pol.test ? <b>włączone</b> : "wyłączone"}. Tylko dla kont testowych od OLX, dodaje do tytułu [qatest-mercury] i opis testowy.
            </span>
            <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">{pol.test ? "Wyłącz" : "Włącz"}</button>
          </form>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-slate-900">Oferty na Otodom ({wpisy?.length ?? 0})</h2>
        {!wpisy?.length ? (
          <p className="px-5 py-6 text-sm text-slate-500">Żadna oferta nie jest jeszcze wysłana. Otwórz ofertę, kliknij Edytuj i w ostatnim kroku Publikacja zaznacz Otodom.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {wpisy.map((w) => {
              const s = STATUSY[(w.status as string) ?? ""] ?? { label: (w.status as string) ?? "-", kolor: "bg-slate-100 text-slate-700" };
              const tytul = (w.property as unknown as { title?: string } | null)?.title ?? "Oferta";
              return (
                <li key={w.property_id as string} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                  <Link href={`/app/nieruchomosci/${w.property_id}`} className="min-w-0 flex-1 truncate font-medium text-slate-900 hover:text-emerald-700">
                    {tytul}
                  </Link>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.kolor}`}>{s.label}</span>
                  {w.url && (
                    <a href={w.url as string} target="_blank" rel="noreferrer" className="text-xs font-semibold text-emerald-700 hover:underline">
                      Zobacz na Otodom ↗
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-xs text-slate-500">Kolejne portale (Morizon-Gratka, Nieruchomosci-online i inne) dodamy tutaj, gdy portale przekażą nam swoje formaty wymiany ofert.</p>
    </div>
  );
}
