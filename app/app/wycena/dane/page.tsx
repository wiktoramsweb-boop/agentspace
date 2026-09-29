import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { PageHeader, Card } from "../../components/ui";
import { GusImport, RcnImport, ManualLevel } from "./dane-forms";

export const metadata = { title: "Dane rynkowe | AgentSpace" };

type LevelRow = { city: string; period: string; price_per_m2: number; source: string; market: string | null };

/** Co już mamy w bazie: bez tego właściciel nie wie, czy import w ogóle zadziałał. */
async function stan(agencyId: string | null) {
  const admin = createSupabaseAdmin();

  const levels = await admin
    .from("market_price_levels")
    .select("city, period, price_per_m2, source, market")
    .order("period_end", { ascending: false })
    .limit(400);

  const tx = await admin
    .from("market_transactions")
    .select("city", { count: "exact", head: true })
    .or(`agency_id.is.null,agency_id.eq.${agencyId ?? "00000000-0000-0000-0000-000000000000"}`);

  const rows = (levels.data ?? []) as LevelRow[];
  const byCity = new Map<string, LevelRow>();
  for (const r of rows) if (!byCity.has(r.city)) byCity.set(r.city, r);

  return {
    tabelaBrak: Boolean(levels.error),
    poziomy: rows.length,
    miasta: [...byCity.values()].sort((a, b) => a.city.localeCompare(b.city, "pl")),
    transakcje: tx.count ?? 0,
  };
}

export default async function DaneRynkowePage() {
  const user = await requireOwner();
  const s = await stan(user.agency_id);

  return (
    <>
      <PageHeader
        title="Dane rynkowe"
        subtitle="Na czym opiera się analiza cenowa. Bez tych danych wycena liczy z ofert Twojego biura, a to za mało."
        action={
          <Link
            href="/app/wycena"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Wróć do wyceny
          </Link>
        }
      />

      {s.tabelaBrak && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Brakuje migracji</p>
          <p className="mt-1">
            Uruchom w Supabase plik <code>lib/SETUP-v29-wycena-dane-rynkowe.sql</code>. Bez niego
            nie ma gdzie zapisać poziomów cen.
          </p>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wider text-slate-400">Miasta z ceną odniesienia</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{s.miasta.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-slate-400">Wartości w bazie</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{s.poziomy}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-slate-400">Transakcje z RCN</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{s.transakcje}</p>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">1. Średnie ceny z GUS</h2>
          <p className="mb-5 mt-1 text-sm leading-relaxed text-slate-600">
            GUS publikuje rzeczywiste ceny lokali sprzedanych w transakcjach rynkowych,
            w podziale na powiaty i miasta. To nie zastąpi danych z adresami, ale daje
            uczciwy punkt odniesienia dla każdego miasta w Polsce. Jedno kliknięcie,
            dane odświeżają się przy kolejnym imporcie.
          </p>
          <GusImport />
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-900">2. Rejestr Cen Nieruchomości</h2>
          <p className="mb-5 mt-1 text-sm leading-relaxed text-slate-600">
            To jest źródło, które daje wycenę na poziomie dzielnicy, bo zawiera ceny
            z aktów notarialnych razem z adresami. Rejestr prowadzi wydział geodezji
            starostwa i udostępnia go na wniosek. Wypis wgrywasz tutaj jako CSV.
            Import należy do Twojego biura i nie trafia do wycen innych biur.
          </p>
          <RcnImport />
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-900">3. Ręczny poziom cen</h2>
          <p className="mb-5 mt-1 text-sm leading-relaxed text-slate-600">
            Gdy masz świeższą liczbę niż GUS, na przykład z kwartalnego raportu NBP
            o cenach mieszkań, wpisz ją tutaj. Ręczny wpis ma pierwszeństwo, jeśli
            dotyczy nowszego okresu.
          </p>
          <ManualLevel />
        </Card>

        {s.miasta.length > 0 && (
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Ceny odniesienia w bazie</h2>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Miasto</th>
                    <th className="px-4 py-2.5 font-medium">Cena za m²</th>
                    <th className="px-4 py-2.5 font-medium">Okres</th>
                    <th className="px-4 py-2.5 font-medium">Rynek</th>
                    <th className="px-4 py-2.5 font-medium">Źródło</th>
                  </tr>
                </thead>
                <tbody>
                  {s.miasta.slice(0, 60).map((m) => (
                    <tr key={m.city} className="border-t border-slate-100">
                      <td className="px-4 py-2.5 font-medium text-slate-900">{m.city}</td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-700">
                        {Math.round(Number(m.price_per_m2)).toLocaleString("pl-PL")} zł
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">{m.period}</td>
                      <td className="px-4 py-2.5 text-slate-500">{m.market ?? "wszystkie"}</td>
                      <td className="px-4 py-2.5 text-slate-500">{m.source.toUpperCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
