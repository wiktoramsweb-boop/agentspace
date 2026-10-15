import Link from "next/link";
import { redirect } from "next/navigation";
import { requireModul } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { brakTabeli } from "@/lib/migracja";
import { PageHeader } from "../../components/ui";
import { BrakMigracji } from "../../components/brak-migracji";
import { FiltryDziennika } from "./filtry";

export const metadata = { title: "Dziennik zdarzeń" };

const RODZAJE: { v: string; l: string }[] = [
  { v: "klient", l: "Klienci" },
  { v: "oferta", l: "Oferty" },
  { v: "transakcja", l: "Transakcje" },
  { v: "osoba", l: "Zespół i uprawnienia" },
  { v: "eksport", l: "Eksporty danych" },
  { v: "koszt", l: "Koszty" },
  { v: "dokument", l: "Dokumenty i RODO" },
  { v: "automatyzacja", l: "Automatyzacje" },
  { v: "poszukiwanie", l: "Poszukiwania" },
  { v: "dzialanie", l: "Działania" },
];

/** Czynności, które właściciel powinien zauważyć od razu. */
const WAZNE = new Set(["klient_usuniety", "oferta_usunieta", "transakcja_usunieta", "masowe_usuniecie", "eksport_danych", "przepisanie", "zmiana_roli", "zmiana_uprawnien"]);

const NA_STRONE = 100;

function dzienPL(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Warsaw" });
}
function godzina(iso: string): string {
  return new Date(iso).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" });
}

export default async function DziennikPage({
  searchParams,
}: {
  searchParams: Promise<{ kto?: string; rodzaj?: string; wazne?: string; strona?: string }>;
}) {
  const user = await requireModul("zespol");
  // Dziennik pokazuje, co robią wszyscy, łącznie z menedżerami, więc widzi go
  // tylko CEO i dyrektor. Menedżer ma moduł „zespół", ale nie ten ekran.
  if (user.role !== "owner" && user.role !== "director") redirect("/app/zespol");
  const sp = await searchParams;
  const strona = Math.max(0, Math.min(50, Number(sp.strona) || 0));
  const admin = createSupabaseAdmin();

  let q = admin
    .from("audit_log")
    .select("id, actor_id, action, entity_type, entity_id, summary, created_at")
    .eq("agency_id", user.agency_id)
    .order("created_at", { ascending: false })
    .range(strona * NA_STRONE, strona * NA_STRONE + NA_STRONE);
  if (sp.kto) q = q.eq("actor_id", sp.kto);
  if (sp.rodzaj && RODZAJE.some((r) => r.v === sp.rodzaj)) q = q.eq("entity_type", sp.rodzaj);
  if (sp.wazne === "1") q = q.in("action", [...WAZNE]);

  const [{ data, error }, { data: ludzie }] = await Promise.all([
    q,
    admin.from("profiles").select("id, full_name").eq("agency_id", user.agency_id).order("full_name"),
  ]);

  if (error && brakTabeli(error)) {
    return (
      <>
        <PageHeader title="Dziennik zdarzeń" subtitle="Kto, co i kiedy zmienił w biurze." />
        <BrakMigracji />
      </>
    );
  }

  const imie = new Map((ludzie ?? []).map((p) => [p.id as string, (p.full_name as string) || "Bez imienia"]));
  const wpisy = (data ?? []).slice(0, NA_STRONE);
  const jestDalej = (data ?? []).length > NA_STRONE;
  const dni = new Map<string, typeof wpisy>();
  for (const w of wpisy) {
    const d = dzienPL(w.created_at);
    dni.set(d, [...(dni.get(d) ?? []), w]);
  }
  const link = (n: number) => {
    const p = new URLSearchParams();
    if (sp.kto) p.set("kto", sp.kto);
    if (sp.rodzaj) p.set("rodzaj", sp.rodzaj);
    if (sp.wazne) p.set("wazne", sp.wazne);
    if (n) p.set("strona", String(n));
    return `/app/zespol/dziennik?${p}`;
  };

  return (
    <>
      <PageHeader
        title="Dziennik zdarzeń"
        subtitle="Kto usunął klienta, kto przepisał ofertę, kto pobrał eksport bazy. Wpisów nie da się edytować ani usunąć z aplikacji."
        action={<Link href="/app/zespol" className="text-sm font-medium text-slate-500 hover:text-slate-800">← Zespół</Link>}
      />
      <FiltryDziennika
        osoby={(ludzie ?? []).map((p) => ({ value: p.id as string, label: (p.full_name as string) || "Bez imienia" }))}
        rodzaje={RODZAJE.map((r) => ({ value: r.v, label: r.l }))}
        kto={sp.kto ?? ""}
        rodzaj={sp.rodzaj ?? ""}
        wazne={sp.wazne === "1"}
      />

      {wpisy.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Brak wpisów dla tych filtrów. Dziennik zapisuje zdarzenia od dnia aktualizacji bazy (v49).
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {[...dni.entries()].map(([dzien, lista]) => (
            <section key={dzien}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{dzien}</h2>
              <ol className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {lista.map((w) => (
                  <li key={w.id} className="flex gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
                    <span className="w-11 flex-shrink-0 pt-0.5 text-xs tabular-nums text-slate-400">{godzina(w.created_at)}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${WAZNE.has(w.action) ? "font-medium text-slate-900" : "text-slate-700"}`}>
                        {WAZNE.has(w.action) && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-500 align-middle" aria-label="ważne" />}
                        {w.summary}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {w.actor_id ? imie.get(w.actor_id) ?? "Osoba spoza biura" : "Automatycznie"}
                        {w.entity_type === "klient" && w.entity_id && !/usuni/.test(w.action) && (
                          <> · <Link href={`/app/klienci/${w.entity_id}`} className="hover:text-slate-700 hover:underline">karta klienta</Link></>
                        )}
                        {w.entity_type === "oferta" && w.entity_id && !/usuni/.test(w.action) && (
                          <> · <Link href={`/app/nieruchomosci/${w.entity_id}`} className="hover:text-slate-700 hover:underline">karta oferty</Link></>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
          <div className="flex justify-between text-sm">
            {strona > 0 ? <Link href={link(strona - 1)} className="font-medium text-slate-600 hover:text-slate-900">← Nowsze</Link> : <span />}
            {jestDalej && <Link href={link(strona + 1)} className="font-medium text-slate-600 hover:text-slate-900">Starsze →</Link>}
          </div>
        </div>
      )}
    </>
  );
}
