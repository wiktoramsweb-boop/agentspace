import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { getActivitiesReport, getAgencyAgents, type ReportFilters } from "@/lib/data-activities";
import { PageHeader, StatCard, Card } from "../../components/ui";
import { ACTIVITY_ICONS } from "../../components/icons";
import { ReportFilterForm } from "./report-filters";
import {
  ACTIVITY_KINDS,
  ACTIVITY_KIND_MAP,
  ACTIVITY_STATUSES,
  ACTIVITY_PURPOSES,
} from "@/lib/types";

const STATUS_MAP = Object.fromEntries(ACTIVITY_STATUSES.map((s) => [s.value, s]));
const PURPOSE_MAP = Object.fromEntries(ACTIVITY_PURPOSES.map((p) => [p.value, p.label]));

function fmt(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("pl-PL", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/** Zakresy dat dla szybkich skrótów („ten miesiąc" itd.). */
function presets() {
  const now = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  return [
    { label: "Dziś", from: iso(now), to: iso(now) },
    { label: "Ten tydzień", from: iso(startOfWeek), to: iso(now) },
    { label: "Ten miesiąc", from: iso(startOfMonth), to: iso(now) },
    { label: "Poprzedni miesiąc", from: iso(startOfPrevMonth), to: iso(endOfPrevMonth) },
    { label: "Ten rok", from: iso(startOfYear), to: iso(now) },
  ];
}

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function RaportDzialanPage({ searchParams }: Props) {
  // Raport pokazuje pracę całego zespołu - tylko dla właściciela.
  const user = await requireOwner();
  const sp = await searchParams;
  const agencyId = user.agency_id!;

  const filters: ReportFilters = {
    agentId: sp.agent || undefined,
    kind: sp.kind || undefined,
    status: sp.status || undefined,
    purpose: sp.purpose || undefined,
    priority: sp.priority || undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
    q: sp.q || undefined,
  };

  const agents = await getAgencyAgents(agencyId);
  const report = await getActivitiesReport(agencyId, filters, agents);

  const selectedAgent = filters.agentId ? agents.find((a) => a.id === filters.agentId) : null;
  const okres =
    filters.from || filters.to
      ? `${filters.from ?? "początek"} - ${filters.to ?? "dziś"}`
      : "cały okres";

  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...extra })) if (v) p.set(k, v);
    return `?${p.toString()}`;
  };

  return (
    <>
      <Link
        href="/app/dzialania"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-900"
      >
        ← Działania
      </Link>

      <PageHeader
        title="Raport działań"
        subtitle={`${selectedAgent ? selectedAgent.name : "Cały zespół"} · ${okres}`}
      />

      {/* Szybkie okresy */}
      <div className="mb-5 flex flex-wrap gap-2">
        <Link
          href="/app/dzialania/raport"
          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
            !filters.from && !filters.to
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-500 hover:text-slate-900"
          }`}
        >
          Cały okres
        </Link>
        {presets().map((p) => {
          const active = filters.from === p.from && filters.to === p.to;
          return (
            <Link
              key={p.label}
              href={qs({ from: p.from, to: p.to })}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                active
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-500 hover:text-slate-900"
              }`}
            >
              {p.label}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Panel filtrów (jak „Wyszukiwarka" w ASARI) */}
        <div className="lg:sticky lg:top-4 lg:h-fit">
          <Card>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
              Wyszukiwarka
            </h2>
            <ReportFilterForm agents={agents} current={sp} />
          </Card>
        </div>

        <div className="space-y-6">
          {/* Podsumowanie */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Działań łącznie" value={report.total} sub={okres} accent />
            <StatCard
              label="Wykonane"
              value={report.byStatus.wykonane ?? 0}
              sub={`${report.total > 0 ? Math.round(((report.byStatus.wykonane ?? 0) / report.total) * 100) : 0}% wszystkich`}
            />
            <StatCard label="Zaplanowane" value={report.byStatus.zaplanowane ?? 0} sub="jeszcze przed nami" />
            <StatCard label="Telefony" value={report.byKind.polaczenie ?? 0} sub="rozmowy telefoniczne" />
          </div>

          {report.truncated && (
            <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
              Wyników jest bardzo dużo - liczby dotyczą pierwszych 5000 działań. Zawęź okres, żeby
              mieć pewność co do sumy.
            </p>
          )}

          {/* Rozbicie po rodzajach */}
          <Card>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
              Rodzaje działań
            </h2>
            <div className="grid gap-3 sm:grid-cols-4">
              {ACTIVITY_KINDS.map((k) => {
                const Icon = ACTIVITY_ICONS[k.value];
                const n = report.byKind[k.value] ?? 0;
                return (
                  <Link
                    key={k.value}
                    href={qs({ kind: filters.kind === k.value ? "" : k.value })}
                    className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                      filters.kind === k.value
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-white ${k.tile}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-lg font-bold text-slate-900">{n}</span>
                      <span className="block text-xs text-slate-500">{k.label}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </Card>

          {/* Kto ile zrobił */}
          <Card>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
              Kto ile zrobił
            </h2>
            {report.agents.length === 0 ? (
              <p className="text-sm text-slate-500">Brak działań w tym okresie.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="py-2 font-medium">Agent</th>
                      <th className="py-2 text-right font-medium">Telefony</th>
                      <th className="py-2 text-right font-medium">Spotkania</th>
                      <th className="py-2 text-right font-medium">Zadania</th>
                      <th className="py-2 text-right font-medium">Wydarzenia</th>
                      <th className="py-2 text-right font-medium">Wykonane</th>
                      <th className="py-2 text-right font-medium">Razem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.agents.map((a) => (
                      <tr key={a.id} className="border-b border-slate-200 last:border-0">
                        <td className="py-2.5">
                          <Link
                            href={qs({ agent: filters.agentId === a.id ? "" : a.id })}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {a.name}
                          </Link>
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-slate-700">{a.polaczenie}</td>
                        <td className="py-2.5 text-right tabular-nums text-slate-700">{a.spotkanie}</td>
                        <td className="py-2.5 text-right tabular-nums text-slate-700">{a.zadanie}</td>
                        <td className="py-2.5 text-right tabular-nums text-slate-700">{a.wydarzenie}</td>
                        <td className="py-2.5 text-right tabular-nums text-emerald-600">{a.wykonane}</td>
                        <td className="py-2.5 text-right font-semibold tabular-nums text-slate-900">
                          {a.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-3 text-xs text-slate-400">
                  Kliknij nazwisko, żeby zawęzić raport do jednego agenta. Działanie prowadzone przez
                  dwóch agentów liczy się obu.
                </p>
              </div>
            )}
          </Card>

          {/* Lista wyników */}
          <div>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
              Działania ({report.rows.length}
              {report.total > report.rows.length ? ` z ${report.total}` : ""})
            </h2>
            {report.rows.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-500">
                Brak działań dla tych filtrów.
              </p>
            ) : (
              <div className="space-y-2">
                {report.rows.map((a) => {
                  const km = ACTIVITY_KIND_MAP[a.kind] ?? ACTIVITY_KIND_MAP.polaczenie;
                  const sm = STATUS_MAP[a.status] ?? STATUS_MAP.zaplanowane;
                  const Icon = ACTIVITY_ICONS[a.kind] ?? ACTIVITY_ICONS.polaczenie;
                  return (
                    <Link
                      key={a.id}
                      href={`/app/dzialania/${a.id}`}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:shadow-sm"
                    >
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-white ${km.tile}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-900">
                          {a.subject}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {fmt(a.due_at)} · {a.assigneeNames.join(", ") || "-"}
                          {a.purpose ? ` · ${PURPOSE_MAP[a.purpose] ?? a.purpose}` : ""}
                          {a.contact_name ? ` · ${a.contact_name}` : ""}
                          {a.contact_phone ? ` · ${a.contact_phone}` : ""}
                        </span>
                      </span>
                      <span className={`flex-shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${sm.color}`}>
                        {sm.label}
                      </span>
                    </Link>
                  );
                })}
                {report.total > report.rows.length && (
                  <p className="pt-2 text-center text-xs text-slate-400">
                    Pokazujemy 200 najnowszych. Liczby wyżej obejmują wszystkie {report.total}.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
