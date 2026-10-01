import Link from "next/link";
import { Card } from "../../components/ui";
import { ACTIVITY_ICONS } from "../../components/icons";
import { formatDateTimePL } from "@/lib/datetime";
import { ACTIVITY_KIND_MAP, ACTIVITY_STATUSES, type Activity } from "@/lib/types";

const STATUS_MAP = Object.fromEntries(ACTIVITY_STATUSES.map((s) => [s.value, s]));

/** Telefony, prezentacje i zadania przypięte do tej oferty, od najnowszych. */
export function ActivitiesTab({ activities }: { activities: Activity[] }) {
  if (!activities.length) {
    return (
      <Card>
        <p className="py-8 text-center text-sm text-slate-500">
          Do tej oferty nie jest przypięte żadne działanie. Dodając telefon albo prezentację,
          wskaż tę nieruchomość - wtedy cała historia kontaktu będzie w jednym miejscu.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <ol className="space-y-2">
        {activities.map((a) => {
          const km = ACTIVITY_KIND_MAP[a.kind];
          const Icon = ACTIVITY_ICONS[a.kind] ?? ACTIVITY_ICONS.zadanie;
          const sm = STATUS_MAP[a.status];
          return (
            <li key={a.id}>
              <Link
                href={`/app/dzialania/${a.id}`}
                className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-white ${km?.tile ?? "bg-slate-500"}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">{a.subject}</span>
                    {sm && (
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${sm.color}`}>{sm.label}</span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {a.due_at ? formatDateTimePL(a.due_at) : "bez terminu"}
                    {km?.label ? ` · ${km.label}` : ""}
                  </span>
                  {a.description && (
                    <span className="mt-1 block line-clamp-2 text-sm text-slate-600">{a.description}</span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
