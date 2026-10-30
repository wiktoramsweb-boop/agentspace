import { Suspense } from "react";
import Link from "next/link";
import { requireModul } from "@/lib/auth";
import { historiaSesji } from "@/lib/data-historia-sesji";
import { PageHeader, StatCard, ScoreBadge, EmptyState, Card } from "../components/ui";
import { Avatar } from "../components/avatar";
import { formatDate } from "@/lib/blog";
import { FiltryHistorii } from "./filtry";

export const metadata = { title: "Historia sesji" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function HistoriaPage({ searchParams }: Props) {
  const user = await requireModul("coach");
  const sp = await searchParams;
  const p = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const { wiersze, statystyki, scenariusze, osoby, zespol } = await historiaSesji(user, { osoba: p("osoba"), scenariusz: p("scenariusz"), wynik: p("wynik"), stan: p("stan"), okres: p("okres") });

  return (
    <>
      <PageHeader title="Historia sesji" subtitle={zespol ? "Treningi zespołu: kto, co ćwiczył i z jakim wynikiem." : "Wszystkie Twoje treningi i wyniki."} />

      <div className={`mb-6 grid gap-4 sm:grid-cols-2 ${zespol ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        <StatCard label="Sesje" value={statystyki.sesje} accent />
        {zespol && <StatCard label="Osoby trenujące" value={statystyki.osoby} />}
        <StatCard label="Średni wynik" value={statystyki.srednia != null ? `${statystyki.srednia}/10` : "-"} />
        <StatCard label="Najlepszy wynik" value={statystyki.najlepsza != null ? `${statystyki.najlepsza}/10` : "-"} />
      </div>

      <Suspense>
        <FiltryHistorii osoby={osoby} scenariusze={scenariusze} zespol={zespol} />
      </Suspense>

      {wiersze.length === 0 ? (
        <EmptyState title="Brak sesji" body="Nic nie pasuje do wybranych filtrów albo nie było jeszcze treningu." ctaHref="/app/trening" ctaLabel="Zacznij trening" />
      ) : (
        <Card className="!p-0">
          <div className="divide-y divide-slate-200">
            {wiersze.map((s) => (
              <Link key={s.id} href={`/app/sesja/${s.id}`} className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-slate-50 sm:px-6">
                {zespol && <Avatar name={s.osoba.name} path={s.osoba.avatar} size={36} />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{s.tytul}</p>
                  <p className="truncate text-sm text-slate-500">
                    {zespol && <span className="font-medium text-slate-700">{s.osoba.name} · </span>}
                    {formatDate(s.data)}
                    {s.klient && ` · klient ${s.klient}`}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {!s.ukonczona && <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">niedokończona</span>}
                  <ScoreBadge score={s.wynik} />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
