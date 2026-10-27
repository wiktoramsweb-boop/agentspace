import Link from "next/link";
import { odetnijPoWygasnieciu, requireManagerOrOwner } from "@/lib/auth";
import {
  getTeamRanking,
  getAgencyStats,
  getPendingInvitations,
  getAgencyCategoryAverages,
  getTeamFunnelProgress,
  getAgencyMembers,
  getTeamInsights,
  getTeamWorkload,
  type FunnelStageProgress,
  type AgentTrend,
} from "@/lib/data";
import { getAgencyCommissionByAgent } from "@/lib/data-platform";
import { PageHeader, StatCard, Card, scoreColor } from "../components/ui";
import { Zakladki, type Zakladka } from "../components/zakladki";
import { formatPln } from "@/lib/format";
import { FUNNEL_STAGES, type UserRole } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/role";
import { InviteForm, type ManagerOption } from "./invite-form";
import { cancelInvitation } from "./actions";
import { ReportButton } from "./report-button";
import { CopyLink } from "./copy-link";
import { TeamRoles, type TeamMember } from "./team-roles";
import { ManagerTeams } from "./manager-teams";
import { TeamProfiles, type TeamProfile } from "./team-profiles";
import { Avatar, avatarUrl } from "../components/avatar";
import { APP_URL } from "@/lib/supabase/config";
import { ludzieKierownika, oddzialyBiura } from "@/lib/oddzialy";
import { nazwaAkademii } from "@/lib/techniki/akademia";
import { OddzialyPanel, type WynikOddzialuWiersz } from "./oddzialy-panel";

// Krótkie etykiety etapów lejka (klucz DB → skrót).
const STAGE_SHORT: Record<string, string> = Object.fromEntries(
  FUNNEL_STAGES.map((s) => [s.key, s.short]),
);

function FunnelChips({ stages, hasGoal }: { stages: FunnelStageProgress[]; hasGoal: boolean }) {
  if (stages.length === 0) return null;
  return (
    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
      {stages.map((s) => (
        <div key={s.key} className="rounded-lg bg-white px-2.5 py-1.5">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">{STAGE_SHORT[s.key]}</p>
          <p className="font-mono text-sm font-semibold text-slate-800">
            {s.done}
            {hasGoal && s.target > 0 && <span className="text-slate-500">/{s.target}</span>}
          </p>
        </div>
      ))}
    </div>
  );
}

function TrendArrow({ trend }: { trend?: AgentTrend }) {
  if (!trend || trend.scoreTrend == null) return null;
  if (trend.scoreTrend === "up") return <span title="wynik rośnie" className="text-sm text-emerald-600">↑</span>;
  if (trend.scoreTrend === "down") return <span title="wynik spada" className="text-sm text-red-600">↓</span>;
  return <span title="wynik stabilny" className="text-sm text-slate-500">→</span>;
}

const ZAKLADKI: Zakladka[] = [
  { key: "zespol", label: "Zespół", ikona: "osoba" },
  { key: "wyniki", label: "Wyniki", ikona: "blyskawica" },
  { key: "oddzialy", label: "Oddziały", ikona: "dom" },
  { key: "zarzadzanie", label: "Zarządzanie", ikona: "tarcza" },
];

export default async function ZespolPage({ searchParams }: { searchParams: Promise<{ z?: string; oddzial?: string }> }) {
  const user = await requireManagerOrOwner();
  const { z, oddzial } = await searchParams;
  odetnijPoWygasnieciu(user);
  const agencyId = user.agency_id!;
  const isOwner = user.role === "owner";

  // Zakres: CEO widzi całą agencję; menedżer swoich agentów i ludzi z oddziałów, którymi kieruje.
  const [ranking, oddzialy] = await Promise.all([
    isOwner ? getTeamRanking(agencyId) : ludzieKierownika(agencyId, user.id).then((ids) => getTeamRanking(agencyId, { ids })),
    oddzialyBiura(agencyId),
  ]);
  const funnelByAgent = await getTeamFunnelProgress(ranking.map((a) => a.id));
  // Doradca kredytowy nie dzwoni z celem telefonów, więc alerty o braku telefonów go nie dotyczą.
  const insights = await getTeamInsights(
    ranking.filter((a) => a.role !== "credit_advisor").map((a) => ({ id: a.id, name: a.full_name ?? a.email ?? "Agent" })),
  );

  // Dane tylko dla CEO.
  const [stats, invitations, categories, commissions, members] = isOwner
    ? await Promise.all([
        getAgencyStats(agencyId),
        getPendingInvitations(agencyId),
        getAgencyCategoryAverages(agencyId),
        getAgencyCommissionByAgent(agencyId),
        getAgencyMembers(agencyId),
      ])
    : [null, [], [], {} as Record<string, number>, []];

  // Karty zespołu: CEO widzi całe biuro, menedżer swoich agentów.
  const wybranyOddzial = oddzialy.lista.find((o) => o.id === oddzial) ?? null;
  const cardPeople = (isOwner ? members : ranking).filter((m) => !wybranyOddzial || m.branch_id === wybranyOddzial.id);
  const workload = await getTeamWorkload(agencyId, cardPeople.map((m) => m.id));
  const profiles: TeamProfile[] = cardPeople.map((m) => ({
    id: m.id,
    name: m.full_name ?? m.email ?? "Agent",
    email: m.email,
    role: m.role,
    phone: m.phone,
    jobTitle: m.job_title ?? null,
    bio: m.bio ?? null,
    avatarUrl: avatarUrl(m.avatar_path),
    commission: isOwner ? (commissions[m.id] ?? 0) : null,
    callsWeek: workload[m.id]?.callsWeek ?? 0,
    activeOffers: workload[m.id]?.activeOffers ?? 0,
    clients: workload[m.id]?.clients ?? 0,
  }));

  // Lista menedżerów/CEO (do przypisań) + członkowie (do zarządzania rolami) - tylko CEO.
  const managerOptions: ManagerOption[] = members
    .filter((m) => m.role === "manager" || m.role === "owner")
    .map((m) => ({ id: m.id, label: `${m.full_name ?? m.email ?? "-"} (${ROLE_LABELS[m.role]})` }));
  const teamMembers: TeamMember[] = members.map((m) => ({
    id: m.id,
    label: m.full_name ?? m.email ?? "-",
    email: m.email,
    role: m.role,
    manager_id: m.manager_id,
    permissions: m.permissions,
  }));

  // Statystyki nagłówka - dla menedżera liczone z jego zakresu.
  const scopedAvg = (() => {
    const vals = ranking.map((a) => a.avgScore).filter((n): n is number => n != null);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  })();
  const scopedSessionsWeek = ranking.reduce((a, r) => a + r.sessionsThisWeek, 0);

  const zakladki = isOwner
    ? ZAKLADKI.filter((t) => t.key !== "oddzialy" || oddzialy.ready)
    : ZAKLADKI.filter((t) => t.key !== "zarzadzanie" && t.key !== "oddzialy");
  const tab = zakladki.some((t) => t.key === z) ? (z as string) : "zespol";

  // Porównanie oddziałów liczymy z tych samych liczb co karty osób.
  const wynikiOddzialow: WynikOddzialuWiersz[] = [];
  if (isOwner && tab === "oddzialy") {
    const zaladunek = await getTeamWorkload(agencyId, members.map((m) => m.id));
    const grupy = [...oddzialy.lista.map((o) => ({ id: o.id as string | null, nazwa: o.name })), { id: null, nazwa: "Bez oddziału" }];
    for (const g of grupy) {
      const ludzie = members.filter((m) => (m.branch_id ?? null) === g.id && m.role !== "credit_advisor");
      if (!g.id && ludzie.length === 0) continue;
      wynikiOddzialow.push({
        id: g.id,
        nazwa: g.nazwa,
        ludzie: ludzie.length,
        telefony: ludzie.reduce((a, m) => a + (zaladunek[m.id]?.callsWeek ?? 0), 0),
        oferty: ludzie.reduce((a, m) => a + (zaladunek[m.id]?.activeOffers ?? 0), 0),
        klienci: ludzie.reduce((a, m) => a + (zaladunek[m.id]?.clients ?? 0), 0),
        prowizje: ludzie.reduce((a, m) => a + (commissions[m.id] ?? 0), 0),
      });
    }
  }

  const strongest = categories[0];
  const weakest = categories[categories.length - 1];

  return (
    <>
      <PageHeader
        title="Zespół"
        subtitle={
          isOwner
            ? `${user.agency?.name ?? "Twoje biuro"}: ludzie, ich wyniki i dostęp do aplikacji.`
            : "Twoi agenci: cele, telefony i wyniki AI Coach."
        }
        action={
          isOwner ? (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/app/techniki/akademia/zespol"
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
              >
                Szkolenie ({nazwaAkademii(agencyId).krotka})
              </Link>
              <Link
                href="/app/zespol/dziennik"
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
              >
                Dziennik zdarzeń
              </Link>
              <ReportButton tygodniowy />
              <ReportButton />
            </div>
          ) : undefined
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Agenci" value={isOwner ? stats!.agentCount : ranking.length} accent />
        <StatCard
          label="Średni wynik AI"
          value={
            isOwner
              ? stats!.avgTeamScore != null
                ? `${stats!.avgTeamScore}/10`
                : "-"
              : scopedAvg != null
                ? `${scopedAvg}/10`
                : "-"
          }
        />
        <StatCard label="Sesje w tym tyg." value={isOwner ? stats!.sessionsThisWeek : scopedSessionsWeek} />
        {isOwner && (
          <StatCard
            label="Prowizje zespołu (mc)"
            value={formatPln(Object.values(commissions).reduce((a, b) => a + b, 0))}
          />
        )}
      </div>

      <Zakladki
        zakladki={zakladki}
        active={tab}
        adres={(k) => (k === "zespol" ? "/app/zespol" : `/app/zespol?z=${k}`)}
        liczniki={{ zespol: profiles.length, wyniki: insights.alerts.length || undefined, oddzialy: oddzialy.lista.length || undefined, zarzadzanie: invitations.length || undefined }}
        etykieta="Sekcje zespołu"
      />

      {tab === "zespol" && (
        <div className="mb-8">
          {oddzialy.lista.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Filtr oddziału">
              {[{ id: "", name: "Wszystkie oddziały" }, ...oddzialy.lista].map((o) => {
                const aktywny = (wybranyOddzial?.id ?? "") === o.id;
                return (
                  <Link
                    key={o.id || "all"}
                    href={o.id ? `/app/zespol?oddzial=${o.id}` : "/app/zespol"}
                    replace
                    aria-current={aktywny ? "page" : undefined}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${aktywny ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                  >
                    {o.name}
                  </Link>
                );
              })}
            </div>
          )}
          <p className="mb-4 text-sm text-slate-500">
            {isOwner
              ? "Kliknij osobę, żeby zobaczyć jej wyniki, cele i uprawnienia."
              : "Kliknij osobę, żeby zobaczyć jej wyniki i cele."}
          </p>
          {profiles.length > 0 ? (
            <TeamProfiles people={profiles} canEdit={isOwner} currentUserId={user.id} />
          ) : (
            <Card>
              <p className="text-center text-sm text-slate-500">
                {isOwner ? (
                  <>
                    W biurze nie ma jeszcze nikogo poza Tobą.{" "}
                    <Link href="/app/zespol?z=zarzadzanie" className="font-semibold text-emerald-700 hover:underline">
                      Zaproś pierwszą osobę →
                    </Link>
                  </>
                ) : (
                  "Nie masz jeszcze przypisanych agentów."
                )}
              </p>
            </Card>
          )}
        </div>
      )}

      {tab === "wyniki" && (
      <>

      {/* Alerty proaktywne - kto wymaga uwagi */}
      {insights.alerts.length > 0 ? (
        <Card className="mb-8 !border-amber-500/20 !bg-amber-500/[0.04]">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-amber-600">
            Wymaga uwagi
          </h2>
          <div className="space-y-2">
            {insights.alerts.map((a, i) => (
              <Link
                key={i}
                href={`/app/zespol/${a.agentId}`}
                className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm transition hover:bg-white"
              >
                <span className="min-w-0 truncate">
                  <span className="font-medium text-slate-900">{a.agentName}</span>
                  <span className="text-slate-500"> - {a.message}</span>
                </span>
                <span
                  className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    a.severity === "warn" ? "bg-amber-500/20 text-amber-700" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {a.severity === "warn" ? "pilne" : "info"}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      ) : (
        ranking.length > 0 && (
          <Card className="mb-8 !border-emerald-500/20 !bg-emerald-500/[0.04]">
            <p className="text-sm text-emerald-700">Wszystko w porządku: nikt nie wymaga teraz Twojej uwagi.</p>
          </Card>
        )
      )}

      {/* Aktywność zespołu - cold calle w 4 tygodniach */}
      {insights.weeklyActivity.some((w) => w.total > 0) && (
        <Card className="mb-8">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
            Telefony zespołu w ostatnich 4 tygodniach
          </h2>
          <div className="flex items-end gap-3">
            {insights.weeklyActivity.map((w, i) => {
              const max = Math.max(1, ...insights.weeklyActivity.map((x) => x.total));
              const h = Math.round((w.total / max) * 100);
              const isCurrent = i === insights.weeklyActivity.length - 1;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-mono text-slate-700">{w.total}</span>
                  <div className="flex h-24 w-full items-end">
                    <div
                      className={`w-full rounded-t-md ${isCurrent ? "bg-emerald-400/70" : "bg-slate-300"}`}
                      style={{ height: `${Math.max(4, h)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{w.label}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-slate-400">Ostatni słupek (zielony) = bieżący tydzień.</p>
        </Card>
      )}

      {/* Mocne / słabe obszary - tylko CEO */}
      {isOwner && categories.length > 0 && (
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <Card className="!border-emerald-500/20 !bg-emerald-500/[0.04]">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-emerald-600">
              Najmocniejszy obszar zespołu
            </p>
            <p className="text-xl font-semibold text-slate-900">
              {strongest.label} <span className="text-emerald-600">{strongest.avg}/10</span>
            </p>
          </Card>
          <Card className="!border-amber-500/20 !bg-amber-500/[0.04]">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-amber-600">
              Do poprawy - najsłabszy obszar
            </p>
            <p className="text-xl font-semibold text-slate-900">
              {weakest.label} <span className="text-amber-600">{weakest.avg}/10</span>
            </p>
          </Card>
        </div>
      )}

      {/* Ranking / lista agentów */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Ranking wyników AI Coach
        </h2>
        {ranking.length === 0 ? (
          <Card>
            <p className="text-center text-sm text-slate-500">
              {isOwner ? "Brak agentów. Zaproś kogoś w zakładce Zarządzanie." : "Nie masz jeszcze przypisanych agentów."}
            </p>
          </Card>
        ) : (
          <Card className="!p-0">
            <div className="divide-y divide-slate-200">
              {ranking.map((agent, i) => {
                const fp = funnelByAgent[agent.id];
                return (
                  <Link
                    key={agent.id}
                    href={`/app/zespol/${agent.id}`}
                    className="block px-6 py-4 transition hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="w-6 flex-shrink-0 text-center font-mono text-sm font-bold text-slate-500">
                          {i + 1}
                        </span>
                        <Avatar name={agent.full_name ?? agent.email ?? "?"} path={agent.avatar_path} size={36} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">
                            {agent.full_name ?? agent.email}
                            {agent.role === "manager" && (
                              <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                                Menedżer
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-slate-500">
                            {agent.sessionCount} sesji
                            {isOwner && ` · ${formatPln(commissions[agent.id] ?? 0)} prowizji (mc)`}
                            {agent.sessionsThisWeek === 0 && (
                              <span className="ml-1 text-amber-600">· nie trenuje</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 font-mono text-lg font-semibold ${scoreColor(agent.avgScore)}`}>
                            {agent.avgScore != null ? `${agent.avgScore}` : "-"}
                            <TrendArrow trend={insights.trends[agent.id]} />
                          </span>
                          <span className="hidden text-xs text-slate-500 sm:block">wynik AI</span>
                        </div>
                        <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    {fp && <FunnelChips stages={fp.stages} hasGoal={fp.hasGoal} />}
                  </Link>
                );
              })}
            </div>
          </Card>
        )}
      </div>
      </>
      )}

      {isOwner && tab === "oddzialy" && (
        <div className="mb-8">
          <OddzialyPanel
            oddzialy={oddzialy.lista}
            wyniki={wynikiOddzialow}
            osoby={members.map((m) => ({ id: m.id, name: m.full_name ?? m.email ?? "Osoba", rola: ROLE_LABELS[m.role] ?? m.role, branch_id: m.branch_id ?? null }))}
            kierownicy={members.filter((m) => ["owner", "director", "manager"].includes(m.role)).map((m) => ({ id: m.id, name: m.full_name ?? m.email ?? "Osoba" }))}
          />
        </div>
      )}

      {/* Zapraszanie + zarządzanie rolami - tylko CEO */}
      {isOwner && tab === "zarzadzanie" && (
        <>
          <div className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Zaproś do zespołu</h2>
            <Card>
              <InviteForm managers={managerOptions} />
              {invitations.length > 0 && (
                <div className="mt-5 border-t border-slate-200 pt-4">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                    Oczekujące zaproszenia
                  </p>
                  <div className="space-y-2">
                    {invitations.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between gap-4 text-sm">
                        <span className="min-w-0 truncate text-slate-700">
                          {inv.email}
                          <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                            {ROLE_LABELS[(inv.role ?? "agent") as UserRole]}
                          </span>
                        </span>
                        <div className="flex flex-shrink-0 items-center gap-4">
                          <CopyLink link={`${APP_URL}/zaproszenie/${inv.token}`} label="Kopiuj link" compact />
                          <form action={cancelInvitation.bind(null, inv.id)}>
                            <button className="text-xs text-slate-500 transition hover:text-red-600">Anuluj</button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="mb-8">
            <h2 className="mb-1 text-lg font-semibold text-slate-900">Role</h2>
            <p className="mb-3 text-sm text-slate-500">
              Kliknij osobę, żeby ustawić jej stanowisko i dostęp do poszczególnych modułów.
            </p>
            <TeamRoles members={teamMembers} currentUserId={user.id} />
          </div>

          <div className="mb-8">
            <h2 className="mb-1 text-lg font-semibold text-slate-900">Zespoły menedżerów</h2>
            <p className="mb-3 text-sm text-slate-500">
              Przypisz każdemu menedżerowi osoby, które ma widzieć (cele, telefony, wyniki AI - bez prowizji).
            </p>
            <ManagerTeams
              managers={teamMembers.filter((m) => m.role === "manager").map((m) => ({ id: m.id, name: m.label }))}
              agents={teamMembers
                .filter((m) => m.role === "agent")
                .map((m) => ({ id: m.id, name: m.label, manager_id: m.manager_id }))}
            />
          </div>
        </>
      )}

    </>
  );
}
