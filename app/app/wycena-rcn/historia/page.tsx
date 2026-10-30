import Link from "next/link";
import { requireModul, zakresUzytkownika } from "@/lib/auth";
import { listaWycen } from "@/lib/wyceny";
import { PageHeader } from "../../components/page-header";
import { WierszWyceny } from "../lista-wycen";

export const metadata = { title: "Moje wyceny" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function HistoriaWycenPage({ searchParams }: Props) {
  const user = await requireModul("nieruchomosci");
  const sp = await searchParams;
  const szukaj = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const wyceny = await listaWycen(user, szukaj);
  const calyZespol = zakresUzytkownika(user) !== "wlasne";

  return (
    <>
      <PageHeader
        title={calyZespol ? "Wyceny biura" : "Moje wyceny"}
        subtitle="Każda policzona wycena zapisuje się tutaj razem z raportem PDF."
        action={
          <Link href="/app/wycena-rcn" className="inline-flex items-center rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400">
            + Nowa wycena
          </Link>
        }
      />
      {wyceny === null ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Historia wycen ruszy po uruchomieniu migracji v58 (lib/SETUP-v58-wyceny.sql).</p>
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
          <form method="get" className="mb-3">
            <input name="q" defaultValue={szukaj} placeholder="Szukaj po adresie albo kliencie…" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15" />
          </form>
          {wyceny.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">{szukaj ? "Nic nie znaleziono." : "Nie ma jeszcze żadnej wyceny."}</p>
          ) : (
            <ul>
              {wyceny.map((w) => (
                <WierszWyceny key={w.id} w={w} autor={calyZespol} />
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
