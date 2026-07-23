import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  getProperty,
  getClient,
  getClientsLite,
  getPropertyInterestedClients,
  getDealsForProperty,
} from "@/lib/data-platform";
import {
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  PROPERTY_DEAL_KINDS,
  CLIENT_TYPES,
  DEAL_STATUSES,
} from "@/lib/types";
import { Card } from "../../components/ui";
import { MiniMap } from "../../components/mini-map";
import { formatPln } from "@/lib/format";
import {
  StatusBar,
  OwnerPicker,
  InterestAdder,
  RemoveInterestButton,
  DeletePropertyButton,
} from "./property-controls";

type Props = { params: Promise<{ id: string }> };

export default async function PropertyDetailPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;

  const property = await getProperty(id);
  if (!property) notFound();
  if (property.agent_id !== user.id) redirect("/app/nieruchomosci");

  const [owner, interested, deals, allClients] = await Promise.all([
    property.owner_client_id ? getClient(property.owner_client_id) : Promise.resolve(null),
    getPropertyInterestedClients(id),
    getDealsForProperty(id),
    getClientsLite(user.id),
  ]);

  const status = PROPERTY_STATUSES.find((s) => s.value === property.status);
  const type = PROPERTY_TYPES.find((t) => t.value === property.property_type);
  const kind = PROPERTY_DEAL_KINDS.find((k) => k.value === property.deal_kind);

  const interestedIds = new Set(interested.map((c) => c.id));
  const addableClients = allClients.filter(
    (c) => c.id !== property.owner_client_id && !interestedIds.has(c.id),
  );

  const specs = [
    { label: "Cena", value: property.price_pln != null ? formatPln(property.price_pln) : "—" },
    { label: "Powierzchnia", value: property.area_m2 != null ? `${property.area_m2} m²` : "—" },
    { label: "Pokoje", value: property.rooms != null ? String(property.rooms) : "—" },
    { label: "Piętro", value: property.floor != null ? String(property.floor) : "—" },
    { label: "Typ", value: type?.label ?? "—" },
    { label: "Rodzaj", value: kind?.label ?? "—" },
  ];

  return (
    <>
      <Link
        href="/app/nieruchomosci"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 transition hover:text-white"
      >
        ← Nieruchomości
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-emerald-400">
              {kind?.label}
            </span>
            {status && (
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-semibold text-white">{property.title}</h1>
          {(property.address || property.city) && (
            <p className="text-zinc-500">{property.address ?? property.city}</p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <StatusBar propertyId={property.id} status={property.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Lewa: parametry, opis, mapa */}
        <div className="space-y-6">
          <Card>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {specs.map((s) => (
                <div key={s.label}>
                  <p className="text-xs uppercase tracking-wider text-zinc-500">{s.label}</p>
                  <p className="mt-0.5 font-semibold text-white">{s.value}</p>
                </div>
              ))}
            </div>
          </Card>

          {property.description && (
            <Card>
              <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-zinc-500">
                Opis
              </h2>
              <p className="whitespace-pre-wrap text-sm text-zinc-300">
                {property.description}
              </p>
            </Card>
          )}

          {property.lat != null && property.lng != null ? (
            <Card className="!p-0 !overflow-hidden">
              <MiniMap lat={property.lat} lng={property.lng} title={property.title} />
            </Card>
          ) : (
            (property.address || property.city) && (
              <Card>
                <p className="text-sm text-zinc-500">
                  Brak dokładnej lokalizacji na mapie. Edytuj adres i wybierz podpowiedź
                  z listy, żeby ustawić pinezkę.
                </p>
              </Card>
            )
          )}
        </div>

        {/* Prawa: właściciel, zainteresowani, transakcje */}
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
              Właściciel
            </h2>
            <OwnerPicker
              propertyId={property.id}
              ownerId={property.owner_client_id}
              clients={allClients}
            />
            {owner && (
              <Link
                href={`/app/klienci/${owner.id}`}
                className="mt-2 inline-block text-sm text-emerald-400 hover:text-emerald-300"
              >
                Otwórz kartę: {owner.name} →
              </Link>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
              Zainteresowani ({interested.length})
            </h2>
            {interested.length > 0 && (
              <ul className="mb-4 space-y-2">
                {interested.map((c) => {
                  const ct = CLIENT_TYPES.find((t) => t.value === c.type);
                  return (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-zinc-900/50 px-3 py-2"
                    >
                      <Link
                        href={`/app/klienci/${c.id}`}
                        className="min-w-0 truncate text-sm text-zinc-200 hover:text-emerald-300"
                      >
                        {c.name}
                        <span className="text-zinc-500"> · {ct?.label}</span>
                      </Link>
                      <RemoveInterestButton propertyId={property.id} clientId={c.id} />
                    </li>
                  );
                })}
              </ul>
            )}
            <InterestAdder propertyId={property.id} clients={addableClients} />
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
              Transakcje ({deals.length})
            </h2>
            {deals.length === 0 ? (
              <p className="text-sm text-zinc-600">
                Brak transakcji. Dodaj ją w zakładce Prowizje i powiąż z tą ofertą.
              </p>
            ) : (
              <ul className="space-y-2">
                {deals.map((d) => {
                  const ds = DEAL_STATUSES.find((s) => s.value === d.status);
                  return (
                    <li
                      key={d.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-zinc-900/50 px-3 py-2"
                    >
                      <span className="min-w-0 truncate text-sm text-zinc-200">
                        {d.title}
                        <span className="text-zinc-500"> · {formatPln(d.commission_pln)}</span>
                      </span>
                      {ds && (
                        <span className={`flex-shrink-0 rounded px-2 py-0.5 text-xs ${ds.color}`}>
                          {ds.label}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <div className="pt-2">
            <DeletePropertyButton propertyId={property.id} />
          </div>
        </div>
      </div>
    </>
  );
}
