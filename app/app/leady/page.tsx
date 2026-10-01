import Link from "next/link";
import { requireUser, requireModul } from "@/lib/auth";
import { getLeady, getStatystykiLeadow } from "@/lib/data-leads";
import { getAgencyAgents } from "@/lib/data-activities";
import { LEAD_SOURCES, LEAD_STATUSES } from "@/lib/types";
import { PageHeader } from "../components/ui";
import { LeadyLista } from "./leady-lista";
import { ImportLeadow } from "./import-leadow";
import { NowyLead } from "./nowy-lead";
import { FiltryLeadow } from "./filtry";

type Props = {
  searchParams: Promise<{ status?: string; agent?: string; source?: string; q?: string }>;
};

/**
 * Leady: wszystko, co przyszło z reklam, z widżetu i z rozmów, zanim stanie się
 * klientem. Ekran jest ustawiony pod jedną czynność: obdzwonić to, co nowe.
 */
export default async function LeadyPage({ searchParams }: Props) {
  const user = await requireModul("klienci");
  const agencyId = user.agency_id;
  const f = await searchParams;

  const [leady, staty, agenci] = await Promise.all([
    agencyId ? getLeady(agencyId, f) : Promise.resolve([]),
    agencyId ? getStatystykiLeadow(agencyId) : Promise.resolve(null),
    agencyId ? getAgencyAgents(agencyId) : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader
        title="Leady"
        subtitle="Zgłoszenia z reklam, z widżetu wyceny i z rozmów. Tutaj decydujesz, kto do kogo dzwoni, zanim kontakt trafi do bazy klientów."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ImportLeadow agenci={agenci} />
            <NowyLead agenci={agenci} />
          </div>
        }
      />

      {staty && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kafelek
            label="Nowe, nikt nie dzwonił"
            value={staty.nowe}
            pilne={staty.nowe > 0}
            link="/app/leady?status=nowy"
          />
          <Kafelek
            label="Bez opiekuna"
            value={staty.bezOpiekuna}
            pilne={staty.bezOpiekuna > 0}
            link="/app/leady?agent=bez"
          />
          <Kafelek label="Do kontaktu dziś" value={staty.doKontaktuDzis} />
          <Kafelek
            label="Konwersja na klienta"
            value={staty.konwersja != null ? `${staty.konwersja}%` : "-"}
            sub={`${staty.razem} leadów w bazie`}
          />
        </div>
      )}

      {staty && staty.razem > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {LEAD_STATUSES.map((s) => (
            <Link
              key={s.value}
              href={f.status === s.value ? "/app/leady" : `/app/leady?status=${s.value}`}
              className={`rounded-xl border px-3.5 py-2 text-sm transition ${
                f.status === s.value
                  ? "border-emerald-500 bg-emerald-50 font-medium text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {s.label}
              <span className="ml-2 tabular-nums text-slate-400">{staty.wStatusach[s.value]}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="mb-5">
        <FiltryLeadow agenci={agenci} zrodla={LEAD_SOURCES} biezace={f} />
      </div>

      <LeadyLista leady={leady} agenci={agenci} mozeUsuwac={user.role !== "agent"} />
    </>
  );
}

function Kafelek({
  label, value, sub, pilne, link,
}: {
  label: string;
  value: number | string;
  sub?: string;
  pilne?: boolean;
  link?: string;
}) {
  const tresc = (
    <>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${pilne ? "text-emerald-700" : "text-slate-900"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </>
  );
  const klasy = `block rounded-2xl border p-5 transition ${
    pilne ? "border-emerald-500/25 bg-emerald-500/[0.05]" : "border-slate-200 bg-white"
  } ${link ? "hover:border-emerald-500/60" : ""}`;
  return link ? (
    <Link href={link} className={klasy}>
      {tresc}
    </Link>
  ) : (
    <div className={klasy}>{tresc}</div>
  );
}
