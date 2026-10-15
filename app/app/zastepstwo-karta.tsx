import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { kogoZastepuje } from "@/lib/zastepstwa";
import { todayPL, warsawToIso, addDaysKey, formatTimePL } from "@/lib/datetime";

/**
 * Karta na pulpicie zastępcy: czyje sprawy przejmuje dziś i co jest do zrobienia.
 * Bez zastępstwa nic się nie renderuje.
 */
export async function ZastepstwoKarta({ agencyId, userId }: { agencyId: string; userId: string }) {
  const zastepowani = await kogoZastepuje(agencyId, userId);
  if (!zastepowani.length) return null;

  const admin = createSupabaseAdmin();
  const ids = zastepowani.map((z) => z.agent_id);
  const dzis = todayPL();
  const od = warsawToIso(dzis, "00:00")!;
  const doK = warsawToIso(addDaysKey(dzis, 1), "00:00")!;

  const [{ data: ludzie }, { data: dzialania }, { data: klienci }] = await Promise.all([
    admin.from("profiles").select("id, full_name").in("id", ids),
    admin
      .from("activities")
      .select("id, subject, due_at, kind, assignee_ids, created_by")
      .eq("agency_id", agencyId)
      .eq("status", "zaplanowane")
      .gte("due_at", od)
      .lt("due_at", doK)
      .or(ids.map((i) => `assignee_ids.cs.{${i}}`).join(","))
      .order("due_at", { ascending: true })
      .limit(20),
    admin
      .from("clients")
      .select("id, name, next_contact_at, agent_id")
      .eq("agency_id", agencyId)
      .in("agent_id", ids)
      .not("next_contact_at", "is", null)
      .lte("next_contact_at", dzis)
      .not("status", "in", "(zamkniety,stracony)")
      .limit(20),
  ]);
  const imie = new Map((ludzie ?? []).map((p) => [p.id as string, (p.full_name as string | null) ?? "Osoba"]));

  return (
    <div className="mb-6 rounded-2xl border border-teal-500/30 bg-teal-100 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">Zastępstwo</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Dziś zastępujesz: {zastepowani.map((z) => imie.get(z.agent_id)).join(", ")}
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            {zastepowani
              .map((z) => `${imie.get(z.agent_id)} wraca po ${z.ends_on.split("-").reverse().slice(0, 2).join(".")}`)
              .join(" · ")}
          </p>
        </div>
        <Link href="/app/urlopy" className="text-sm font-medium text-teal-700 hover:underline">
          Urlopy zespołu →
        </Link>
      </div>

      {(dzialania?.length ?? 0) + (klienci?.length ?? 0) === 0 ? (
        <p className="mt-4 text-sm text-slate-600">Na dziś nie ma u nich nic zaplanowanego.</p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(dzialania?.length ?? 0) > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-800">Działania na dziś ({dzialania!.length})</p>
              <ul className="space-y-1.5">
                {dzialania!.map((d) => (
                  <li key={d.id}>
                    <Link href={`/app/dzialania/${d.id}`} className="flex items-baseline gap-2 text-sm text-slate-700 hover:text-slate-900">
                      <span className="w-11 flex-shrink-0 tabular-nums text-xs text-slate-500">{formatTimePL(d.due_at as string)}</span>
                      <span className="truncate">{d.subject ?? "Działanie"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(klienci?.length ?? 0) > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-800">Klienci do kontaktu ({klienci!.length})</p>
              <ul className="space-y-1.5">
                {klienci!.map((c) => (
                  <li key={c.id}>
                    <Link href={`/app/klienci/${c.id}`} className="flex items-baseline justify-between gap-2 text-sm text-slate-700 hover:text-slate-900">
                      <span className="truncate">{c.name}</span>
                      <span className="flex-shrink-0 text-xs text-slate-500">{imie.get(c.agent_id as string)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
