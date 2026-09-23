import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { getAddonState } from "@/lib/site/addon";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSiteConfig } from "@/lib/site/config";

const LABEL: Record<string, string> = {
  strona: "Podstrony",
  oferta: "Karty ofert",
  poradnik: "Wpisy poradnika",
};

function prettyPath(path: string, slug: string): string {
  const clean = path.replace(`/strona/${slug}`, "") || "/";
  if (clean === "/") return "Strona główna";
  return clean;
}

export default async function StatystykiPage() {
  const owner = await requireOwner();
  const addon = await getAddonState(owner.agency_id!);
  if (!addon.active) redirect("/app/ustawienia/strona");

  const site = await getSiteConfig(owner.agency_id!, owner.agency?.name ?? "Biuro");
  const admin = createSupabaseAdmin();
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const [{ data: views }, { count: leads }, { count: leads7 }] = await Promise.all([
    admin.from("site_views").select("day, path, kind, views").eq("agency_id", owner.agency_id!).gte("day", since),
    admin.from("site_leads").select("id", { count: "exact", head: true }).eq("agency_id", owner.agency_id!).gte("created_at", since),
    admin
      .from("site_leads")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", owner.agency_id!)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()),
  ]);

  const rows = (views ?? []) as { day: string; path: string; kind: string; views: number }[];
  const total = rows.reduce((a, r) => a + r.views, 0);
  const last7 = rows
    .filter((r) => r.day >= new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10))
    .reduce((a, r) => a + r.views, 0);

  // Wykres dzienny: ostatnie 30 dni, nawet te bez ruchu, żeby dziury były widoczne.
  const byDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 3600 * 1000).toISOString().slice(0, 10);
    byDay.set(d, 0);
  }
  for (const r of rows) byDay.set(r.day, (byDay.get(r.day) ?? 0) + r.views);
  const days = [...byDay.entries()];
  const max = Math.max(1, ...days.map(([, v]) => v));

  const byKind = new Map<string, Map<string, number>>();
  for (const r of rows) {
    const group = byKind.get(r.kind) ?? new Map<string, number>();
    group.set(r.path, (group.get(r.path) ?? 0) + r.views);
    byKind.set(r.kind, group);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Statystyki strony</h1>
        <p className="mt-1 text-sm text-slate-500">
          Liczymy odsłony bez ciasteczek i bez zapisywania adresów IP, więc te liczby są też wtedy, gdy ktoś odrzuci
          zgodę na cookies. Jedna osoba liczy się raz na wizytę.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Odsłony, 30 dni", total],
          ["Odsłony, 7 dni", last7],
          ["Zapytania, 30 dni", leads ?? 0],
          ["Zapytania, 7 dni", leads7 ?? 0],
        ].map(([l, v]) => (
          <div key={String(l)} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="font-mono text-2xl font-semibold text-slate-900">{v as number}</p>
            <p className="text-sm text-slate-500">{l as string}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Ruch dzień po dniu</h2>
        {total === 0 ? (
          <p className="text-sm text-slate-500">
            Jeszcze nikt nie wszedł na stronę albo jest świeżo opublikowana. Wróć tu za kilka dni.
          </p>
        ) : (
          <div className="flex h-32 items-end gap-1">
            {days.map(([d, v]) => (
              <div key={d} className="flex flex-1 flex-col items-center justify-end" title={`${d}: ${v}`}>
                <div
                  className="w-full rounded-t bg-emerald-400/80"
                  style={{ height: `${Math.max(2, (v / max) * 100)}%` }}
                />
              </div>
            ))}
          </div>
        )}
        {total > 0 && (
          <p className="mt-2 text-xs text-slate-400">
            Od {days[0]?.[0]} do {days[days.length - 1]?.[0]}
          </p>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {["strona", "oferta", "poradnik"].map((kind) => {
          const group = [...(byKind.get(kind)?.entries() ?? [])].sort((a, b) => b[1] - a[1]).slice(0, 8);
          return (
            <div key={kind} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-base font-semibold text-slate-900">{LABEL[kind]}</h2>
              {group.length === 0 ? (
                <p className="text-sm text-slate-400">Brak danych.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {group.map(([path, v]) => (
                    <li key={path} className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-slate-600">{prettyPath(path, site.slug)}</span>
                      <span className="font-mono font-medium text-slate-900">{v}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
