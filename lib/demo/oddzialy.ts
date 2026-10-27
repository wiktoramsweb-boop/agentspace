import { createSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Oddziały i zasady prowizji w biurze demo (v54): dwa oddziały z kierownikami,
 * progi udziału i jeden współagent w zamkniętej transakcji, żeby porównanie
 * oddziałów i rozliczenie miesiąca miały co pokazać. Przed v54 nic nie robi.
 */
export async function zasiejOddzialyDemo(agencyId: string): Promise<boolean> {
  const admin = createSupabaseAdmin();
  const { data: ludzie, error } = await admin.from("profiles").select("id, full_name, role, branch_id").eq("agency_id", agencyId).order("created_at");
  if (error) return false;
  const osoby = (ludzie ?? []) as { id: string; full_name: string | null; role: string; branch_id: string | null }[];
  const po = (imie: string) => osoby.find((o) => o.full_name?.startsWith(imie))?.id ?? null;

  const { data: jest } = await admin.from("branches").select("id, name").eq("agency_id", agencyId);
  let oddzialy = (jest ?? []) as { id: string; name: string }[];
  if (!oddzialy.length) {
    const { data } = await admin
      .from("branches")
      .insert([
        { agency_id: agencyId, name: "Kraków Centrum", city: "Kraków", address: "ul. Karmelicka 12", phone: "+48 12 300 10 10", manager_id: po("Zofia") },
        { agency_id: agencyId, name: "Kraków Południe", city: "Kraków", address: "ul. Kobierzyńska 98", phone: "+48 12 300 20 20", manager_id: po("Adam") },
      ])
      .select("id, name");
    oddzialy = (data ?? []) as { id: string; name: string }[];
  }
  const centrum = oddzialy.find((o) => o.name === "Kraków Centrum")?.id;
  const poludnie = oddzialy.find((o) => o.name === "Kraków Południe")?.id;
  const przydzial: [string, string | undefined][] = [
    ["Zofia", centrum],
    ["Klara", centrum],
    ["Jan", centrum],
    ["Adam", poludnie],
    ["Bartosz", poludnie],
    ["Emilia", poludnie],
  ];
  for (const [imie, b] of przydzial) {
    const id = po(imie);
    if (id && b) await admin.from("profiles").update({ branch_id: b }).eq("id", id).eq("agency_id", agencyId);
  }

  await admin.from("commission_rules").upsert(
    {
      agency_id: agencyId,
      progi: [
        { od: 0, pct: 50 },
        { od: 60000, pct: 55 },
        { od: 120000, pct: 60 },
      ],
      manager_override_pct: 5,
      network_fee_pct: 0,
      network_name: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "agency_id" },
  );

  // Współagent w ostatniej zamkniętej transakcji: agent kupującego z drugiego oddziału.
  const { data: ostatnia } = await admin.from("deals").select("id, agent_id, commission_pln").eq("agency_id", agencyId).eq("status", "zamkniety").order("closed_at", { ascending: false }).limit(1);
  const d = ostatnia?.[0] as { id: string; agent_id: string; commission_pln: number | null } | undefined;
  const wspol = po("Bartosz") === d?.agent_id ? po("Klara") : po("Bartosz");
  if (d && wspol) {
    await admin
      .from("deal_splits")
      .upsert({ deal_id: d.id, agency_id: agencyId, profile_id: wspol, rola: "wspolagent", pct: 15, kwota_pln: Math.round(((d.commission_pln ?? 0) / 1.23) * 0.15) }, { onConflict: "deal_id,profile_id" });
  }
  return true;
}
