import { requireUser } from "@/lib/auth";
import { getSearches, getActiveProperties } from "@/lib/data-searches";
import { getAgencyClientsLite } from "@/lib/data-platform";
import { findMatches } from "@/lib/matching";
import { PageHeader, StatCard } from "../components/ui";
import { SearchesBrowser } from "./searches-browser";
import { SearchWizard } from "./search-wizard";

export default async function PoszukiwaniaPage() {
  const user = await requireUser();
  const agencyId = user.agency_id;

  const [searches, properties, clients] = await Promise.all([
    agencyId ? getSearches(agencyId, { limit: 300 }) : Promise.resolve([]),
    agencyId ? getActiveProperties(agencyId) : Promise.resolve([]),
    agencyId ? getAgencyClientsLite(agencyId) : Promise.resolve([]),
  ]);

  // Dopasowania liczymy w locie: baza ofert biura jest mała, a dzięki temu
  // wynik zawsze odpowiada aktualnym cenom i statusom, bez odświeżania cache.
  const matchCounts: Record<string, { fits: number; near: number }> = {};
  let totalFits = 0;
  for (const s of searches) {
    const matches = findMatches(s, properties);
    const fits = matches.filter((m) => m.fits).length;
    const near = matches.length - fits;
    matchCounts[s.id] = { fits, near };
    if (s.status === "aktualne") totalFits += fits;
  }

  const active = searches.filter((s) => s.status === "aktualne").length;
  const withoutMatch = searches.filter(
    (s) => s.status === "aktualne" && (matchCounts[s.id]?.fits ?? 0) === 0,
  ).length;

  return (
    <>
      <PageHeader
        title="Poszukiwania"
        subtitle="Czego szukają Twoi klienci. System sam kojarzy ich z ofertami biura."
        action={<SearchWizard clients={clients} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Aktualne poszukiwania" value={active} sub={`${searches.length} łącznie`} />
        <StatCard label="Dopasowań do pokazania" value={totalFits} sub="ofert pasuje klientom" accent />
        <StatCard label="Bez dopasowania" value={withoutMatch} sub="brak oferty w bazie" />
        <StatCard label="Aktywne oferty" value={properties.length} sub="z czego kojarzymy" />
      </div>

      <SearchesBrowser searches={searches} matchCounts={matchCounts} currentUserId={user.id} />
    </>
  );
}
