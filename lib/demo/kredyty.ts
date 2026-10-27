import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { domyslneDokumenty, type EtapKredytu } from "@/lib/kredyt-etapy";

/**
 * Sprawy kredytowe w biurze demo: doradczyni dostaje klientów od agentów
 * na różnych etapach, żeby tablica „Kredyty” i karta „Twój kredyt” w portalu
 * miały co pokazać. Bez doradcy w zespole (przed v53) nic nie robi.
 */
const PLAN: { etap: EtapKredytu; kwota: number; bank: string | null; odhaczone: number; dniTemu: number; notatka: string }[] = [
  { etap: "nowe", kwota: 540000, bank: null, odhaczone: 0, dniTemu: 0, notatka: "Para, oboje na umowie o pracę, wkład 20%. Szukają 3 pokoi na Ruczaju." },
  { etap: "nowe", kwota: 320000, bank: null, odhaczone: 0, dniTemu: 1, notatka: "Kawalerka pod wynajem, klient ma drugie mieszkanie." },
  { etap: "analiza", kwota: 610000, bank: "PKO BP / mBank", odhaczone: 2, dniTemu: 2, notatka: "Porównanie stałej i zmiennej stopy, klient woli stałą na 5 lat." },
  { etap: "dokumenty", kwota: 455000, bank: "Pekao", odhaczone: 4, dniTemu: 3, notatka: "Brakuje operatu i potwierdzenia wkładu." },
  { etap: "dokumenty", kwota: 720000, bank: "ING", odhaczone: 3, dniTemu: 9, notatka: "Klient prowadzi działalność, potrzebne KPiR za 2 lata." },
  { etap: "wniosek", kwota: 498000, bank: "Santander", odhaczone: 7, dniTemu: 4, notatka: "Wniosek złożony, bank zamówił wycenę." },
  { etap: "decyzja", kwota: 580000, bank: "mBank", odhaczone: 7, dniTemu: 1, notatka: "Decyzja pozytywna, umowa przyrzeczona do ustalenia z notariuszem." },
  { etap: "umowa", kwota: 410000, bank: "PKO BP", odhaczone: 7, dniTemu: 12, notatka: "Umowa kredytowa podpisana." },
];

export async function zasiejKredytyDemo(agencyId: string, now = new Date()): Promise<number> {
  const admin = createSupabaseAdmin();
  const { data: doradcy } = await admin.from("profiles").select("id").eq("agency_id", agencyId).eq("role", "credit_advisor").limit(1);
  const doradca = doradcy?.[0]?.id as string | undefined;
  if (!doradca) return 0;
  const { data: agenci } = await admin.from("profiles").select("id").eq("agency_id", agencyId).in("role", ["agent", "manager", "owner"]);
  const { data: klienci } = await admin.from("clients").select("id, agent_id").eq("agency_id", agencyId).order("created_at", { ascending: true }).limit(60);
  if (!klienci?.length || !agenci?.length) return 0;

  await admin.from("credit_cases").delete().eq("agency_id", agencyId);

  // Klient z portalem (jeśli jest) dostaje sprawę w toku, żeby portal pokazał kartę kredytu.
  const { data: zPortalem } = await admin.from("client_portal_access").select("client_id").eq("agency_id", agencyId).is("revoked_at", null).limit(1);
  const kolejka = [...klienci].sort((a, b) => Number(b.id === zPortalem?.[0]?.client_id) - Number(a.id === zPortalem?.[0]?.client_id));

  const wiersze = PLAN.map((p, i) => {
    const k = kolejka[i % kolejka.length];
    const kiedy = new Date(now.getTime() - p.dniTemu * 86_400_000).toISOString();
    const docs = domyslneDokumenty("hipoteczny").map((d, j) => ({ ...d, jest: j < p.odhaczone }));
    return {
      agency_id: agencyId,
      client_id: k.id,
      referred_by: k.agent_id ?? agenci[i % agenci.length].id,
      advisor_id: doradca,
      stage: i === 0 && zPortalem?.length ? "dokumenty" : p.etap,
      rodzaj: "hipoteczny",
      amount_pln: p.kwota,
      bank: p.bank,
      note: p.notatka,
      documents: i === 0 && zPortalem?.length ? docs.map((d, j) => ({ ...d, jest: j < 3 })) : docs,
      bank_commission_pln: Math.round(p.kwota * 0.015),
      referral_fee_pln: Math.round(p.kwota * 0.0025),
      created_at: new Date(now.getTime() - (p.dniTemu + 5) * 86_400_000).toISOString(),
      updated_at: kiedy,
      ...(p.etap === "decyzja" || p.etap === "umowa" ? { decision_at: kiedy } : {}),
      ...(p.etap === "umowa" ? { signed_at: kiedy } : {}),
    };
  });
  const { data: sprawy } = await admin.from("credit_cases").insert(wiersze).select("id, referred_by, note, created_at");
  await admin.from("credit_case_events").insert(
    ((sprawy ?? []) as { id: string; referred_by: string | null; note: string | null; created_at: string }[]).map((s) => ({
      case_id: s.id,
      agency_id: agencyId,
      author_id: s.referred_by,
      kind: "etap",
      text: `Klient przekazany doradcy: ${s.note ?? ""}`.trim(),
      created_at: s.created_at,
    })),
  );
  return sprawy?.length ?? 0;
}
