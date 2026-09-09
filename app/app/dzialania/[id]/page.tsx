import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getActivity, getActivitiesByPhone, getClientsByPhone } from "@/lib/data-activities";
import { Card } from "../../components/ui";
import { ACTIVITY_ICONS } from "../../components/icons";
import { ActivityActions } from "./activity-actions";
import {
  ACTIVITY_KIND_MAP,
  ACTIVITY_PRIORITIES,
  ACTIVITY_PURPOSES,
  ACTIVITY_STATUSES,
  CALL_DIRECTIONS,
} from "@/lib/types";

const STATUS_MAP = Object.fromEntries(ACTIVITY_STATUSES.map((s) => [s.value, s]));
const PRIORITY_MAP = Object.fromEntries(ACTIVITY_PRIORITIES.map((p) => [p.value, p]));
const PURPOSE_MAP = Object.fromEntries(ACTIVITY_PURPOSES.map((p) => [p.value, p.label]));
const DIRECTION_MAP = Object.fromEntries(CALL_DIRECTIONS.map((c) => [c.value, c.label]));

function fmt(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("pl-PL", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

type Props = { params: Promise<{ id: string }> };

export default async function ActivityDetailPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;
  const agencyId = user.agency_id;
  if (!agencyId) notFound();

  const activity = await getActivity(id, agencyId);
  if (!activity) notFound();

  const [history, matchingClients] = await Promise.all([
    activity.contact_phone
      ? getActivitiesByPhone(agencyId, activity.contact_phone, activity.id)
      : Promise.resolve([]),
    activity.contact_phone && !activity.client_id
      ? getClientsByPhone(agencyId, activity.contact_phone)
      : Promise.resolve([]),
  ]);

  const km = ACTIVITY_KIND_MAP[activity.kind] ?? ACTIVITY_KIND_MAP.polaczenie;
  const sm = STATUS_MAP[activity.status] ?? STATUS_MAP.zaplanowane;
  const pm = PRIORITY_MAP[activity.priority] ?? PRIORITY_MAP.normalny;
  const Icon = ACTIVITY_ICONS[activity.kind] ?? ACTIVITY_ICONS.polaczenie;

  return (
    <>
      <Link
        href="/app/dzialania"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-900"
      >
        ← Działania
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white ${km.tile}`}>
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${km.badge}`}>{km.label}</span>
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${sm.color}`}>{sm.label}</span>
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${pm.color}`}>{pm.label}</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">{activity.subject}</h1>
            <p className="text-slate-500">{fmt(activity.due_at)}</p>
          </div>
        </div>
        <ActivityActions id={activity.id} done={activity.status === "wykonane"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
              Informacje
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Cel">
                {activity.purpose ? (PURPOSE_MAP[activity.purpose] ?? activity.purpose) : "-"}
              </Field>
              {activity.kind === "polaczenie" && (
                <Field label="Rodzaj rozmowy">
                  {activity.call_direction ? (DIRECTION_MAP[activity.call_direction] ?? activity.call_direction) : "-"}
                </Field>
              )}
              <Field label="Kontakt">{activity.contact_name ?? "-"}</Field>
              <Field label="Telefon">
                {activity.contact_phone ? (
                  <a href={`tel:${activity.contact_phone}`} className="text-blue-600 hover:underline">
                    {activity.contact_phone}
                  </a>
                ) : (
                  "-"
                )}
              </Field>
              <Field label="E-mail">
                {activity.contact_email ? (
                  <a href={`mailto:${activity.contact_email}`} className="text-blue-600 hover:underline">
                    {activity.contact_email}
                  </a>
                ) : (
                  "-"
                )}
              </Field>
              <Field label="Klient w bazie">
                {activity.client_id && activity.clientName ? (
                  <Link href={`/app/klienci/${activity.client_id}`} className="text-blue-600 hover:underline">
                    {activity.clientName}
                  </Link>
                ) : (
                  "-"
                )}
              </Field>
              <Field label="Nieruchomość">
                {activity.property_id && activity.propertyTitle ? (
                  <Link href={`/app/nieruchomosci/${activity.property_id}`} className="text-blue-600 hover:underline">
                    {activity.propertyTitle}
                  </Link>
                ) : (
                  "-"
                )}
              </Field>
              <Field label="Agenci">{activity.assigneeNames.join(", ") || "-"}</Field>
              <Field label="Dodano">{fmt(activity.created_at)}</Field>
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
              Co ustalono
            </h2>
            {activity.description ? (
              <p className="whitespace-pre-wrap text-slate-700">{activity.description}</p>
            ) : (
              <p className="text-sm text-slate-400">Brak opisu.</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {matchingClients.length > 0 && (
            <Card>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
                Ten numer jest w bazie
              </h2>
              <div className="space-y-2">
                {matchingClients.map((c) => (
                  <Link
                    key={c.id}
                    href={`/app/klienci/${c.id}`}
                    className="block rounded-xl border border-slate-200 p-3 transition hover:border-emerald-500 hover:bg-emerald-50"
                  >
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-sm text-slate-500">{c.phone}</p>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h2 className="mb-1 text-sm font-medium uppercase tracking-wider text-slate-500">
              Historia tego numeru
            </h2>
            <p className="mb-3 text-xs text-slate-400">
              {activity.contact_phone
                ? `Wcześniejsze kontakty pod ${activity.contact_phone}`
                : "Brak numeru w tym działaniu."}
            </p>

            {history.length === 0 ? (
              <p className="text-sm text-slate-400">
                {activity.contact_phone
                  ? "To pierwszy kontakt pod ten numer."
                  : "Dodaj numer, żeby widzieć historię."}
              </p>
            ) : (
              <div className="space-y-2.5">
                {history.map((h) => {
                  const hkm = ACTIVITY_KIND_MAP[h.kind] ?? ACTIVITY_KIND_MAP.polaczenie;
                  const HIcon = ACTIVITY_ICONS[h.kind] ?? ACTIVITY_ICONS.polaczenie;
                  return (
                    <Link
                      key={h.id}
                      href={`/app/dzialania/${h.id}`}
                      className="block rounded-xl border border-slate-200 p-3 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-md text-white ${hkm.tile}`}>
                          <HIcon className="h-3.5 w-3.5" />
                        </span>
                        <p className="truncate text-sm font-medium text-slate-900">{h.subject}</p>
                      </div>
                      <p className="text-xs text-slate-500">
                        {fmt(h.due_at)} · {h.assigneeNames.join(", ") || "-"}
                      </p>
                      {h.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{h.description}</p>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 font-medium text-slate-800">{children}</p>
    </div>
  );
}
