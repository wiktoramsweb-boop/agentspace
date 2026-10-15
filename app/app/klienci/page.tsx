import { todayPL } from "@/lib/datetime";
import { requireUser, requireModul } from "@/lib/auth";
import { queryClients } from "@/lib/data-lists";
import { getAgencyAgents } from "@/lib/data-activities";
import { getAgencySettings } from "@/lib/agency-settings";
import { parseListQuery } from "@/lib/list-params";
import { maskPhone } from "@/lib/format";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { PageHeader, EmptyState } from "../components/ui";
import { NewClientForm } from "./new-client-form";
import { ClientsBrowser } from "./clients-browser";
import { TablicaKlientow } from "./tablica-klientow";
import { PrzelacznikWidoku } from "../components/widok";
import { FiltrOpiekuna } from "../components/filtr-opiekuna";
import { kartyKlientow } from "@/lib/data-tablica";
import { kogoZastepuje } from "@/lib/zastepstwa";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Liczniki nad listą liczy baza, żeby nie ściągać wszystkich kontaktów. */
async function counts(agencyId: string) {
  const admin = createSupabaseAdmin();
  const today = todayPL();
  const [all, active, due] = await Promise.all([
    admin.from("clients").select("id", { count: "exact", head: true }).eq("agency_id", agencyId),
    admin
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .not("status", "in", "(zamkniety,stracony)"),
    admin
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .not("next_contact_at", "is", null)
      .lte("next_contact_at", today),
  ]);
  return { all: all.count ?? 0, active: active.count ?? 0, due: due.count ?? 0 };
}

export default async function KlienciPage({ searchParams }: Props) {
  const user = await requireModul("klienci");
  const agencyId = user.agency_id;
  const sp = await searchParams;
  const query = parseListQuery(sp, { sort: "zmiana", dateField: "zmiana" });
  const tablica = sp.widok === "tablica";

  if (tablica && agencyId) {
    const agentFiltr = query.agent === "ja" ? user.id : query.agent || null;
    const [karty, agents, settings, stats] = await Promise.all([
      kartyKlientow(agencyId, { agent: agentFiltr }),
      getAgencyAgents(agencyId),
      getAgencySettings(agencyId, user.agency?.name),
      counts(agencyId),
    ]);
    const mask = settings.options.hide_contacts && user.role === "agent";
    const zastepowani = mask ? (await kogoZastepuje(agencyId, user.id)).map((z) => z.agent_id) : [];
    return (
      <>
        <PageHeader
          title="Klienci"
          subtitle={`${stats.active} aktywnych · ${stats.all} w biurze · przeciągnij kartę, żeby zmienić etap`}
          action={<NewClientForm existingPhones={[]} />}
        />
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <PrzelacznikWidoku sciezka="/app/klienci" aktywny="tablica" agent={query.agent} />
          <FiltrOpiekuna ludzie={agents} wartosc={query.agent} />
        </div>
        <TablicaKlientow
          karty={
            mask
              ? karty.map((k) =>
                  k.agent_id === user.id || (k.agent_id && zastepowani.includes(k.agent_id)) ? k : { ...k, phone: null },
                )
              : karty
          }
        />
      </>
    );
  }

  const [page, agents, settings, stats] = await Promise.all([
    agencyId
      ? queryClients(agencyId, query, user.id)
      : Promise.resolve({ rows: [], total: 0, pages: 1 }),
    agencyId ? getAgencyAgents(agencyId) : Promise.resolve([]),
    getAgencySettings(agencyId, user.agency?.name),
    agencyId ? counts(agencyId) : Promise.resolve({ all: 0, active: 0, due: 0 }),
  ]);

  // Ukrywanie kontaktów (Ustawienia → Pozostałe) dotyczy tylko agentów.
  // Maskujemy na serwerze: do przeglądarki nie trafia pełny numer ani e-mail.
  const mask = settings.options.hide_contacts && user.role === "agent";
  // Zastępca widzi kontakty klientów osoby, którą dziś zastępuje.
  const zastepowani = mask && agencyId ? (await kogoZastepuje(agencyId, user.id)).map((z) => z.agent_id) : [];
  const rows = mask
    ? page.rows.map((c) =>
        c.agent_id === user.id || (c.agent_id && zastepowani.includes(c.agent_id))
          ? c
          : { ...c, phone: maskPhone(c.phone), email: c.email ? "ukryty" : null },
      )
    : page.rows;

  return (
    <>
      <PageHeader
        title="Klienci"
        subtitle={`${stats.active} aktywnych · ${stats.all} w biurze${stats.due > 0 ? ` · ${stats.due} do kontaktu` : ""}`}
        action={<NewClientForm existingPhones={[]} />}
      />

      {stats.all > 0 && (
        <div className="mb-5">
          <PrzelacznikWidoku sciezka="/app/klienci" aktywny="lista" agent={query.agent} />
        </div>
      )}

      {stats.all === 0 ? (
        <EmptyState
          title="Brak klientów"
          body="Dodaj pierwszego klienta - baza jest wspólna dla całego biura, więc każdy agent go zobaczy."
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          }
        />
      ) : (
        <ClientsBrowser
          rows={rows}
          query={query}
          total={page.total}
          pages={page.pages}
          agents={agents}
          canDelete={user.role === "owner" || user.role === "manager"}
        />
      )}
    </>
  );
}
