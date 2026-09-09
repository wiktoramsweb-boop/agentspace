import Link from "next/link";
import type { ActivityRich } from "@/lib/data-activities";
import { ACTIVITY_ICONS } from "../../components/icons";
import { ACTIVITY_KIND_MAP, ACTIVITY_STATUSES } from "@/lib/types";

const STATUS_MAP = Object.fromEntries(ACTIVITY_STATUSES.map((s) => [s.value, s]));

/** Lista działań na karcie klienta: co i kiedy z nim robiliśmy. */
export function ClientActivities({ activities }: { activities: ActivityRich[] }) {
  if (activities.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
        Brak działań. Dodaj telefon, spotkanie albo zadanie przyciskiem +.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {activities.map((a) => {
        const km = ACTIVITY_KIND_MAP[a.kind] ?? ACTIVITY_KIND_MAP.polaczenie;
        const sm = STATUS_MAP[a.status] ?? STATUS_MAP.zaplanowane;
        const Icon = ACTIVITY_ICONS[a.kind] ?? ACTIVITY_ICONS.polaczenie;
        return (
          <Link
            key={a.id}
            href={`/app/dzialania/${a.id}`}
            className="block rounded-xl border border-slate-200 p-3 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-md text-white ${km.tile}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <p className="truncate text-sm font-medium text-slate-900">{a.subject}</p>
              <span className={`ml-auto rounded-md px-2 py-0.5 text-xs font-medium ${sm.color}`}>
                {sm.label}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {a.due_at
                ? new Date(a.due_at).toLocaleString("pl-PL", {
                    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })
                : "-"}
              {a.assigneeNames.length > 0 && ` · ${a.assigneeNames.join(", ")}`}
            </p>
            {a.description && (
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{a.description}</p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
