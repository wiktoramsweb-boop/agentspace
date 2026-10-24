import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { konfiguracjaOtodom, stanPolaczenia, PORTAL } from "@/lib/otodom/klient";
import { STATUSY } from "@/lib/otodom/ogloszenia";
import { PORTALE_FTP } from "@/lib/ftp/portale";
import { polaczOtodom, rozlaczOtodom, testujFtpAkcja, usunFtp, ustawTrybTestowy, wyslijFtpTeraz, zapiszFtp } from "./actions";

// „Wyślij teraz” wgrywa zdjęcia wszystkich ofert, przy pierwszej wysyłce to potrafi potrwać.
export const maxDuration = 300;

export const metadata = { title: "Portale ogłoszeniowe" };

const KOMUNIKATY: Record<string, { ok: boolean; t: string }> = {
  polaczono: { ok: true, t: "Konto Otodom połączone. Oferty publikujesz w kreatorze oferty, w ostatnim kroku Publikacja." },
  anulowano: { ok: false, t: "Połączenie anulowane na Otodom." },
  "zly-stan": { ok: false, t: "Link autoryzacji wygasł albo był niepoprawny. Kliknij Połącz jeszcze raz." },
  blad: { ok: false, t: "Otodom nie wydał dostępu. Spróbuj jeszcze raz za chwilę." },
  "brak-konfiguracji": { ok: false, t: "Integracja z Otodom nie jest jeszcze skonfigurowana po stronie AgentSpace." },
};

const KOMUNIKATY_FTP: Record<string, { ok: boolean; t: string }> = {
  zapisano: { ok: true, t: "Dane FTP zapisane. Wynik sprawdzenia połączenia widzisz przy portalu." },
  sprawdzono: { ok: true, t: "Połączenie sprawdzone. Wynik widzisz przy portalu." },
  usunieto: { ok: true, t: "Dane FTP usunięte." },
  wyslano: { ok: true, t: "Plik z ofertami wysłany. Portal zwykle pokazuje oferty po około 20 minutach i przysyła raport mailem." },
  trwa: { ok: true, t: "Wysyłka już trwa. Odśwież stronę za chwilę, żeby zobaczyć wynik." },
  "blad-wysylki": { ok: false, t: "Wysyłka się nie udała. Powód widzisz przy portalu." },
  "brak-danych": { ok: false, t: "Podaj adres serwera i login." },
  "brak-hasla": { ok: false, t: "Podaj hasło do FTP." },
  "brak-tabeli": { ok: false, t: "Eksport przez FTP wymaga aktualizacji bazy: uruchom lib/SETUP-v51-portale-ftp.sql w Supabase." },
  nieznany: { ok: false, t: "Nieznany portal." },
  blad: { ok: false, t: "Nie udało się zapisać. Spróbuj jeszcze raz." },
};

type WpisFtp = { portal: string; host: string; port: number; login: string; katalog: string; secure: boolean; ostatni_test_at: string | null; ostatni_test_ok: boolean | null; ostatni_blad: string | null; ostatnia_wysylka_at: string | null; ostatnio_ofert: number | null; ostatnie_bledy?: { id: string; tytul: string; bledy: string[] }[] | null; wysylka_start?: string | null };

export default async function PortalePage({ searchParams }: { searchParams: Promise<{ otodom?: string; ftp?: string }> }) {
  const user = await requireOwner();
  const { otodom, ftp } = await searchParams;
  const komunikat = otodom ? KOMUNIKATY[otodom] : ftp ? KOMUNIKATY_FTP[ftp] : null;
  const { data: ftpDane, error: ftpBlad } = await createSupabaseAdmin()
    .from("portal_ftp")
    // Gwiazdka: kolumny z v52 mogą jeszcze nie istnieć, a wtedy lista konkretnych pól dawałaby błąd.
    .select("*")
    .eq("agency_id", user.agency_id);
  const ftpWpisy = new Map(((ftpDane as WpisFtp[] | null) ?? []).map((w) => [w.portal, w]));
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

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Portale przez FTP</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Część portali przyjmuje oferty plikiem wysyłanym na ich serwer. Po podpisaniu umowy portal daje biuru dane FTP: wpisz je tutaj, a AgentSpace sprawdzi połączenie.
          </p>
        </div>
        {ftpBlad && <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Eksport przez FTP wymaga aktualizacji bazy: uruchom plik <code>lib/SETUP-v51-portale-ftp.sql</code> w Supabase.</p>}
        {PORTALE_FTP.map((p) => {
          const w = ftpWpisy.get(p.id);
          return (
            <section key={p.id} id={`ftp-${p.id}`} className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{p.nazwa}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Format pliku: {p.format}</p>
                </div>
                {w && (
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${w.ostatni_test_ok ? "bg-emerald-100 text-emerald-800" : w.ostatni_test_ok === false ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-600"}`}>
                    {w.ostatni_test_ok ? "Połączenie działa" : w.ostatni_test_ok === false ? "Brak połączenia" : "Niesprawdzone"}
                  </span>
                )}
              </div>
              {!w && <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{p.jakZdobyc}</p>}
              {w?.ostatni_blad && <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{w.ostatni_blad}</p>}
              {w?.ostatni_test_at && (
                <p className="mt-2 text-xs text-slate-500">
                  Ostatnie sprawdzenie: {new Date(w.ostatni_test_at).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" })}
                  {w.ostatnia_wysylka_at && ` · ostatnia wysyłka: ${new Date(w.ostatnia_wysylka_at).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" })} (${w.ostatnio_ofert ?? 0} ofert)`}
                </p>
              )}
              {w && (
                <form action={wyslijFtpTeraz} className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <input type="hidden" name="portal" value={p.id} />
                  <p className="min-w-0 flex-1 text-sm text-slate-600">
                    Oferty wybierasz w kreatorze oferty, w ostatnim kroku Publikacja. Po każdym zapisie wysyłamy plik sami, a tu możesz wysłać go od razu.
                  </p>
                  <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Wyślij oferty teraz</button>
                </form>
              )}
              {w?.ostatnie_bledy && w.ostatnie_bledy.length > 0 && (
                <details className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                  <summary className="cursor-pointer font-semibold text-amber-900">Nie poszło w ostatniej wysyłce: {w.ostatnie_bledy.length}</summary>
                  <ul className="mt-2 space-y-2">
                    {w.ostatnie_bledy.map((b) => (
                      <li key={b.id}>
                        <Link href={`/app/nieruchomosci/${b.id}`} className="font-medium text-amber-900 hover:underline">
                          {b.tytul}
                        </Link>
                        <span className="block text-amber-800">{b.bledy.join(" ")}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <form action={zapiszFtp} className="mt-4 grid gap-3 sm:grid-cols-6">
                <input type="hidden" name="portal" value={p.id} />
                <label className="sm:col-span-4">
                  <span className="text-xs text-slate-500">Serwer (host)</span>
                  <input name="host" required defaultValue={w?.host ?? ""} placeholder="ftp.przyklad.pl" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-xs text-slate-500">Port</span>
                  <input name="port" inputMode="numeric" defaultValue={w?.port ?? 21} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
                </label>
                <label className="sm:col-span-3">
                  <span className="text-xs text-slate-500">Login</span>
                  <input name="login" required autoComplete="off" defaultValue={w?.login ?? ""} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
                </label>
                <label className="sm:col-span-3">
                  <span className="text-xs text-slate-500">Hasło{w ? " (zostaw puste, żeby nie zmieniać)" : ""}</span>
                  <input name="haslo" type="password" autoComplete="new-password" required={!w} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
                </label>
                <label className="sm:col-span-3">
                  <span className="text-xs text-slate-500">Katalog na serwerze</span>
                  <input name="katalog" defaultValue={w?.katalog ?? "/"} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
                </label>
                <label className="flex items-end gap-2 pb-2.5 text-sm text-slate-700 sm:col-span-3">
                  <input type="checkbox" name="secure" value="1" defaultChecked={w?.secure ?? false} className="h-4 w-4 accent-emerald-600" />
                  Szyfrowane połączenie (FTPS)
                </label>
                <div className="flex flex-wrap gap-2 sm:col-span-6">
                  <button className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">{w ? "Zapisz zmiany" : "Zapisz i sprawdź"}</button>
                  {w && (
                    <>
                      <button formAction={testujFtpAkcja} formNoValidate className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        Sprawdź połączenie
                      </button>
                      <button formAction={usunFtp} formNoValidate className="rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">
                        Usuń dane FTP
                      </button>
                    </>
                  )}
                </div>
              </form>
            </section>
          );
        })}
      </section>
    </div>
  );
}
