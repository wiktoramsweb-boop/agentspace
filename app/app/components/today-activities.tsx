import { dateKeyPL, formatTimePL, todayPL } from "@/lib/datetime";
import { formatPhone } from "@/lib/format";
import Link from "next/link";
import type { ActivityRich } from "@/lib/data-activities";
import { ACTIVITY_ICONS } from "./icons";
import { ACTIVITY_KIND_MAP } from "@/lib/types";

/**
 * Działania na dziś i zaległe - pierwsza rzecz, którą agent widzi po zalogowaniu.
 * Zaległe idą na górę, bo to one najczęściej przepadają.
 */
export function TodayActivities({ activities }: { activities: ActivityRich[] }) {
  const nowIso = new Date().toISOString();
  const today = todayPL();

  const relevant = activities
    .filter((a) => a.status === "zaplanowane" && a.due_at)
    .filter((a) => dateKeyPL(a.due_at) <= today)
    .sort((a, b) => (a.due_at ?? "").localeCompare(b.due_at ?? ""));

  if (relevant.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
        Nic zaplanowanego na dziś. Zaplanuj telefon albo spotkanie w zakładce Działania.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {relevant.slice(0, 6).map((a) => {
        const km = ACTIVITY_KIND_MAP[a.kind] ?? ACTIVITY_KIND_MAP.polaczenie;
        const Icon = ACTIVITY_ICONS[a.kind] ?? ACTIVITY_ICONS.polaczenie;
        const overdue = a.due_at! < nowIso;
        return (
          <Link
            key={a.id}
            href={`/app/dzialania/${a.id}`}
            className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-white ${km.tile}`}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-slate-900">{a.subject}</span>
              <span className="block truncate text-xs text-slate-500">
                {formatTimePL(a.due_at)}
                {a.contact_name ? ` · ${a.contact_name}` : ""}
                {a.contact_phone ? ` · ${formatPhone(a.contact_phone)}` : ""}
              </span>
            </span>
            {overdue && (
              <span className="flex-shrink-0 rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                zaległe
              </span>
            )}
          </Link>
        );
      })}
      {relevant.length > 6 && (
        <Link
          href="/app/dzialania"
          className="block pt-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          Zobacz wszystkie ({relevant.length}) →
        </Link>
      )}
    </div>
  );
}
