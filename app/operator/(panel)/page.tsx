import { biuraWPanelu, zamowieniaDoRozliczenia } from "@/lib/data-operator";
import { opisZamowienia } from "@/lib/data-abonament";
import { PotwierdzWplate } from "./potwierdz";

export const dynamic = "force-dynamic";

const CZERWONA = "bg-red-500/15 text-red-300 ring-red-500/30";

/**
 * Etykieta stanu dostępu.
 *
 * Liczy się para (aktywne, probny), a nie sam `powod`: wygasły okres próbny
 * i wygasły abonament mają ten sam powód, a dla operatora to dwie różne
 * sytuacje - jedna znaczy „nie kupił”, druga „przestał płacić”.
 */
function etykieta(d: { aktywne: boolean; probny: boolean; powod: string }) {
  if (!d.aktywne) return { tekst: d.probny ? "Trial wygasł" : "Wygasł", klasa: CZERWONA };
  if (d.probny) return { tekst: "Okres próbny", klasa: "bg-amber-500/15 text-amber-300 ring-amber-500/30" };
  if (d.powod === "brak_migracji")
    return { tekst: "Bez ograniczeń", klasa: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30" };
  return { tekst: "Opłacony", klasa: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" };
}

function data(iso: string | null): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(iso),
  );
}

function dni(iso: string | null): string {
  if (!iso) return "";
  const r = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (Number.isNaN(r)) return "";
  return r >= 0 ? `za ${r} dni` : `${Math.abs(r)} dni temu`;
}

/**
 * Panel operatora AgentSpace.
 *
 * Siedzi poza /app, więc nie ma menu biura i nie da się tu trafić przypadkiem.
 * Dostęp daje osobny login i hasło ze zmiennych środowiskowych, niezależny
 * od kont w aplikacji - patrz lib/operator-auth.ts.
 */
export default async function OperatorPage() {
  const [biura, zamowienia] = await Promise.all([biuraWPanelu(), zamowieniaDoRozliczenia()]);

  const aktywne = biura.filter((b) => b.dostep.aktywne && !b.demo).length;
  const wygasle = biura.filter((b) => !b.dostep.aktywne).length;
  const kredytyRazem = biura.reduce((s, b) => s + b.kredytyZuzyte, 0);

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Operator</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Wszystkie biura</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Stan kont i rozliczeń. Bez wglądu w dane klientów biur.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { etykieta: "Biur razem", wartosc: String(biura.length) },
          { etykieta: "Z aktywnym dostępem", wartosc: String(aktywne) },
          { etykieta: "Wygasłe", wartosc: String(wygasle) },
          { etykieta: "Kredyty AI w tym mies.", wartosc: kredytyRazem.toLocaleString("pl-PL") },
        ].map((k) => (
          <div key={k.etykieta} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">{k.etykieta}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{k.wartosc}</p>
          </div>
        ))}
      </div>

      {zamowienia.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            Zamówienia czekające na wpłatę
            <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">
              {zamowienia.length}
            </span>
          </h2>
          <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            {zamowienia.map((z) => {
              const opis = opisZamowienia({
                id: z.id,
                kind: z.kind as never,
                plan: z.plan,
                credits: z.credits,
                period: z.period,
                agents: 0,
                amount_grosz: z.amount_grosz,
                status: z.status,
                created_at: z.created_at,
                paid_at: null,
              });
              return (
                <div key={z.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p className="font-medium text-white">{z.biuro}</p>
                    <p className="mt-0.5 text-sm text-zinc-400">{opis}</p>
                    <p className="mt-1 font-mono text-[11px] text-zinc-600">
                      {z.id} · {data(z.created_at)}
                    </p>
                  </div>
                  <PotwierdzWplate orderId={z.id} opis={`${z.biuro}: ${opis}`} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Biura</h2>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead>
              <tr className="bg-white/[0.04] text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3 font-medium">Biuro</th>
                <th className="px-4 py-3 font-medium">Dostęp</th>
                <th className="px-4 py-3 font-medium">Pakiet</th>
                <th className="px-4 py-3 font-medium">Koniec</th>
                <th className="px-4 py-3 text-right font-medium">Osób</th>
                <th className="px-4 py-3 text-right font-medium">Kredyty</th>
                <th className="px-4 py-3 font-medium">Ostatnia aktywność</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {biura.map((b) => {
                const e = etykieta(b.dostep);
                return (
                  <tr key={b.id} className="text-zinc-300 transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <span className="font-medium text-white">{b.nazwa}</span>
                      {b.demo && (
                        <span className="ml-2 rounded-full bg-cyan-500/15 px-2 py-0.5 text-[11px] text-cyan-300">
                          demo
                        </span>
                      )}
                      {b.zamowieniaOczekujace > 0 && (
                        <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-300">
                          {b.zamowieniaOczekujace} do rozliczenia
                        </span>
                      )}
                      <span className="mt-0.5 block text-xs text-zinc-500">od {data(b.zalozone)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs ring-1 ${e.klasa}`}>{e.tekst}</span>
                    </td>
                    <td className="px-4 py-3">{b.plan ?? "-"}</td>
                    <td className="px-4 py-3">
                      {data(b.konczySie)}
                      <span className="mt-0.5 block text-xs text-zinc-500">{dni(b.konczySie)}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{b.osob}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {b.kredytyZuzyte.toLocaleString("pl-PL")}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {b.ostatniaAktywnosc ? data(b.ostatniaAktywnosc) : "brak zużycia AI"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
