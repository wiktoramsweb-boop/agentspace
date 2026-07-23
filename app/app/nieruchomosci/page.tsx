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

export default async function NieruchomosciPage() {
  const user = await requireUser();
  const [properties, clients] = await Promise.all([
    getProperties(user.id),
    getClientsLite(user.id),
  ]);

  const active = properties.filter((p) => p.status === "aktywna");

  return (
    <>
      <PageHeader
        title="Nieruchomości"
        subtitle={`${active.length} aktywnych · ${properties.length} łącznie`}
        action={<NewPropertyForm clients={clients} />}
      />

      {properties.length === 0 ? (
        <EmptyState
          title="Brak nieruchomości"
          body="Dodaj pierwszą ofertę — powiążesz ją z właścicielem, zainteresowanymi klientami i transakcją."
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
