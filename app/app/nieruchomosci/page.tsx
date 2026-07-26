import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getProperties, getClientsLite } from "@/lib/data-platform";
import {
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  PROPERTY_DEAL_KINDS,
} from "@/lib/types";
import { PageHeader, Card, EmptyState } from "../components/ui";
import { formatPln } from "@/lib/format";
import { NewPropertyForm } from "./new-property-form";
import { PropertiesMap } from "./properties-map";

export default async function NieruchomosciPage() {
  const user = await requireUser();
  const [properties, clients] = await Promise.all([
    getProperties(user.id),
    getClientsLite(user.id),
  ]);

  const active = properties.filter((p) => p.status === "aktywna");
  const mapPoints = active
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => ({ id: p.id, title: p.title, price: p.price_pln, lat: p.lat!, lng: p.lng! }));

  return (
    <>
      <PageHeader
        title="Nieruchomości"
        subtitle={`${active.length} aktywnych · ${properties.length} łącznie`}
        action={<NewPropertyForm clients={clients} />}
      />

      {properties.length > 0 && (
        <Card className="mb-6 !overflow-hidden !p-0">
          <div className="flex items-center justify-between border-b border-zinc-700/60 px-5 py-3">
            <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400">
              Mapa aktualnych ofert
            </h2>
            <span className="text-xs text-zinc-500">{mapPoints.length} na mapie</span>
          </div>
          {mapPoints.length > 0 ? (
            <PropertiesMap points={mapPoints} />
          ) : (
            <p className="p-6 text-sm text-zinc-500">
              Żadna aktywna oferta nie ma jeszcze lokalizacji. Przy dodawaniu/edycji oferty
              wybierz adres z podpowiedzi, żeby pojawiła się na mapie.
            </p>
          )}
        </Card>
      )}

      {properties.length === 0 ? (
        <EmptyState
          title="Brak nieruchomości"
          body="Dodaj pierwszą ofertę — powiążesz ją z właścicielem, zainteresowanymi klientami i transakcją."
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((p) => {
            const status = PROPERTY_STATUSES.find((s) => s.value === p.status);
            const type = PROPERTY_TYPES.find((t) => t.value === p.property_type);
            const kind = PROPERTY_DEAL_KINDS.find((k) => k.value === p.deal_kind);
            const params = [
              type?.label,
              p.area_m2 != null ? `${p.area_m2} m²` : null,
              p.rooms != null ? `${p.rooms} pok.` : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <Link key={p.id} href={`/app/nieruchomosci/${p.id}`}>
                <Card className="h-full transition hover:border-emerald-500/40 hover:bg-zinc-800/70">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <span className="text-xs font-medium uppercase tracking-wide text-emerald-400">
                      {kind?.label}
                    </span>
                    {status && (
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    )}
                  </div>
                  <h3 className="mb-1 font-semibold text-white">{p.title}</h3>
                  {(p.city || p.address) && (
                    <p className="mb-3 truncate text-sm text-zinc-500">
                      {p.city ?? p.address}
                    </p>
                  )}
                  <p className="text-lg font-semibold text-white">
                    {p.price_pln != null ? formatPln(p.price_pln) : "—"}
                    {p.deal_kind === "wynajem" && p.price_pln != null && (
                      <span className="text-sm font-normal text-zinc-500"> /mc</span>
                    )}
                  </p>
                  {params && <p className="mt-1 text-sm text-zinc-500">{params}</p>}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
