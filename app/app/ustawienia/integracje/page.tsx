import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { maModul } from "@/lib/role";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { stanPolaczenia } from "@/lib/otodom/klient";
import { PORTALE_FTP, PORTALE_W_PRZYGOTOWANIU } from "@/lib/ftp/portale";
import { stanKalendarza } from "@/lib/kalendarz-subskrypcja";
import { PodlaczKalendarz } from "../../kalendarz/podlacz";

export const metadata = { title: "Integracje" };

type Stan = "aktywna" | "konfiguracja" | "wkrotce";
type Pozycja = { nazwa: string; opis: string; stan: Stan; href?: string; znak: string; kolor: string };

const ETYKIETA: Record<Stan, { t: string; k: string }> = {
  aktywna: { t: "Aktywna", k: "bg-emerald-100 text-emerald-700" },
  konfiguracja: { t: "Do podłączenia", k: "bg-amber-100 text-amber-700" },
  wkrotce: { t: "W przygotowaniu", k: "bg-slate-100 text-slate-600" },
};

function Wiersz({ p }: { p: Pozycja }) {
  const e = ETYKIETA[p.stan];
  const tresc = (
    <>
      <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl text-xs font-bold text-white" style={{ background: p.kolor }} aria-hidden="true">
        {p.znak}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-slate-900">{p.nazwa}</span>
        <span className="block text-sm text-slate-500">{p.opis}</span>
      </span>
      <span className={`flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${e.k}`}>{e.t}</span>
    </>
  );
  return <li>{p.href ? <Link href={p.href} className="flex items-center gap-4 p-4 transition hover:bg-slate-50">{tresc}</Link> : <div className="flex items-center gap-4 p-4">{tresc}</div>}</li>;
}

function Grupa({ tytul, pozycje }: { tytul: string; pozycje: Pozycja[] }) {
  if (!pozycje.length) return null;
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{tytul}</h2>
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {pozycje.map((p) => (
          <Wiersz key={p.nazwa} p={p} />
        ))}
      </ul>
    </section>
  );
}

/** Wszystkie połączenia w jednym miejscu. Stan każdej pozycji pochodzi z bazy, nie z listy na sztywno. */
export default async function IntegracjePage() {
  const user = await requireUser();
  const ceo = user.role === "owner";
  const [kal, otodom, ftp] = await Promise.all([
    stanKalendarza(user.id),
    user.agency_id ? stanPolaczenia(user.agency_id) : Promise.resolve({ polaczone: false }),
    user.agency_id ? createSupabaseAdmin().from("portal_ftp").select("portal, ostatni_test_ok").eq("agency_id", user.agency_id) : Promise.resolve({ data: [] }),
  ]);
  const podlaczone = new Set(((ftp.data ?? []) as { portal: string; ostatni_test_ok: boolean | null }[]).filter((f) => f.ostatni_test_ok !== false).map((f) => f.portal));
  const hrefPortali = ceo ? "/app/ustawienia/portale" : undefined;

  const portale: Pozycja[] = maModul(user, "nieruchomosci")
    ? [
        { nazwa: "Otodom", opis: "Publikacja ofert przez oficjalne API Grupy OLX.", stan: otodom.polaczone ? "aktywna" : "konfiguracja", href: hrefPortali, znak: "Oto", kolor: "#00a06a" },
        ...PORTALE_FTP.map((p) => ({ nazwa: p.nazwa, opis: "Automatyczna wysyłka ofert przez FTP.", stan: (podlaczone.has(p.id) ? "aktywna" : "konfiguracja") as Stan, href: hrefPortali, znak: p.nazwa.slice(0, 3), kolor: p.id === "tabelaofert" ? "#0f766e" : "#ea580c" })),
        ...PORTALE_W_PRZYGOTOWANIU.map((p) => ({ nazwa: p.nazwa, opis: "Czekamy na format importu od portalu.", stan: "wkrotce" as Stan, href: hrefPortali, znak: p.nazwa.slice(0, 3), kolor: "#64748b" })),
      ]
    : [];
  const narzedzia: Pozycja[] = [
    ...(ceo ? [{ nazwa: "Strona www biura", opis: "Oferty i zespół z programu na Twojej stronie.", stan: "konfiguracja" as Stan, href: "/app/ustawienia/strona", znak: "WWW", kolor: "#0284c7" }] : []),
    ...(ceo ? [{ nazwa: "Import z innego programu", opis: "Przeniesienie klientów i ofert z pliku.", stan: "konfiguracja" as Stan, href: "/app/ustawienia/import", znak: "CSV", kolor: "#7c3aed" }] : []),
  ];

  const ile = (s: Stan) => [...portale, ...narzedzia].filter((p) => p.stan === s).length + (s === "aktywna" && kal.token ? 1 : 0) + (s === "konfiguracja" && !kal.token ? 1 : 0);

  return (
    <>
      <h2 className="text-2xl font-bold text-slate-900">Integracje</h2>
      <p className="mb-6 text-slate-500">Wszystko, co AgentSpace łączy z Twoimi narzędziami i portalami.</p>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {(["aktywna", "konfiguracja", "wkrotce"] as Stan[]).map((s) => (
          <div key={s} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-500">{s === "aktywna" ? "Aktywne" : s === "konfiguracja" ? "Do podłączenia" : "W przygotowaniu"}</p>
            <p className="text-3xl font-bold tabular-nums text-slate-900">{ile(s)}</p>
          </div>
        ))}
      </div>

      <section id="kalendarz" className="mb-6 scroll-mt-20">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Kalendarz</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="font-semibold text-slate-900">Wizyty i zadania w Twoim kalendarzu</p>
          <p className="mb-4 text-sm text-slate-500">Bez logowania i bez haseł: Twój terminarz pobiera wizyty z prywatnego adresu.</p>
          {kal.gotowe ? <PodlaczKalendarz token={kal.token} ostatnio={kal.ostatnio} adresBazowy="https://www.agentspace.pl" /> : <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">Ruszy po uruchomieniu migracji lib/SETUP-v59-kredyty-cele.sql.</p>}
        </div>
      </section>

      <Grupa tytul="Portale ogłoszeniowe" pozycje={portale} />
      <Grupa tytul="Narzędzia biura" pozycje={narzedzia} />
    </>
  );
}
