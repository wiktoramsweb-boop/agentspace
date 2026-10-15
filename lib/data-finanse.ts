import { createSupabaseAdmin } from "./supabase/admin";
import { brakTabeli } from "./migracja";
import { doWygenerowania, miesiacZDaty, przesunMiesiac, zakresMiesiaca } from "./koszty-model";

export type Koszt = {
  id: string;
  category: string;
  name: string;
  vendor: string | null;
  invoice_no: string | null;
  cost_date: string;
  net_pln: number;
  vat_rate: number | null;
  gross_pln: number;
  paid: boolean;
  paid_at: string | null;
  schedule_id: string | null;
  note: string | null;
};

export type StalyKoszt = {
  id: string;
  category: string;
  name: string;
  vendor: string | null;
  net_pln: number;
  vat_rate: number | null;
  gross_pln: number;
  day_of_month: number;
  active: boolean;
  last_generated_month: string | null;
};

export type Wyplata = {
  id: string;
  title: string;
  agent_id: string;
  agentName: string;
  closed_at: string;
  commission_pln: number;
  agent_earnings_pln: number;
  agent_paid_at: string | null;
  agent_paid_pln: number | null;
};

const num = (v: unknown) => (v == null ? 0 : Number(v));

/**
 * Stałe koszty dopisujemy przy otwarciu ekranu, a nie cronem: biuro i tak
 * patrzy na koszty tutaj, a jeden cron mniej to jedno miejsce awarii mniej.
 * Najpierw „rezerwujemy” miesiąc warunkowym update, dopiero potem wstawiamy
 * koszt, więc dwa jednoczesne wejścia nie dopiszą go dwa razy.
 */
export async function dopiszStaleKoszty(agencyId: string, dzis: string): Promise<void> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("agency_cost_schedules")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("active", true);
  if (error || !data) return;
  const m = miesiacZDaty(dzis);
  for (const s of data as StalyKoszt[]) {
    if (!doWygenerowania(s, dzis)) continue;
    let q = admin.from("agency_cost_schedules").update({ last_generated_month: m }).eq("id", s.id);
    q = s.last_generated_month ? q.eq("last_generated_month", s.last_generated_month) : q.is("last_generated_month", null);
    const { data: zarezerwowane } = await q.select("id");
    if (!zarezerwowane?.length) continue;
    await admin.from("agency_costs").insert({
      agency_id: agencyId,
      category: s.category,
      name: s.name,
      vendor: s.vendor,
      cost_date: `${m}-${String(s.day_of_month).padStart(2, "0")}`,
      net_pln: s.net_pln,
      vat_rate: s.vat_rate,
      gross_pln: s.gross_pln,
      schedule_id: s.id,
    });
  }
}

export async function kosztyMiesiaca(agencyId: string, m: string): Promise<{ koszty: Koszt[]; brakMigracji: boolean }> {
  const { od, doWyl } = zakresMiesiaca(m);
  const { data, error } = await createSupabaseAdmin()
    .from("agency_costs")
    .select("id, category, name, vendor, invoice_no, cost_date, net_pln, vat_rate, gross_pln, paid, paid_at, schedule_id, note")
    .eq("agency_id", agencyId)
    .gte("cost_date", od)
    .lt("cost_date", doWyl)
    .order("cost_date", { ascending: false });
  if (error) return { koszty: [], brakMigracji: brakTabeli(error) };
  return {
    koszty: (data ?? []).map((k) => ({ ...k, net_pln: num(k.net_pln), gross_pln: num(k.gross_pln), vat_rate: k.vat_rate == null ? null : num(k.vat_rate) })) as Koszt[],
    brakMigracji: false,
  };
}

export async function staleKoszty(agencyId: string): Promise<StalyKoszt[]> {
  const { data } = await createSupabaseAdmin()
    .from("agency_cost_schedules")
    .select("id, category, name, vendor, net_pln, vat_rate, gross_pln, day_of_month, active, last_generated_month")
    .eq("agency_id", agencyId)
    .order("day_of_month");
  return ((data ?? []) as StalyKoszt[]).map((s) => ({ ...s, net_pln: num(s.net_pln), gross_pln: num(s.gross_pln) }));
}

/**
 * Prowizje do wypłaty: zamknięte transakcje z danego miesiąca plus wszystkie
 * starsze, które dalej czekają na wypłatę. Księgowa nie może przegapić
 * zaległej prowizji tylko dlatego, że patrzy na bieżący miesiąc.
 */
export async function wyplatyAgentow(agencyId: string, m: string, maKolumny: boolean): Promise<Wyplata[]> {
  const { od, doWyl } = zakresMiesiaca(m);
  const admin = createSupabaseAdmin();
  const kolumny = `id, title, agent_id, closed_at, commission_pln, agent_earnings_pln${maKolumny ? ", agent_paid_at, agent_paid_pln" : ""}`;
  const [{ data: deals }, { data: ludzie }] = await Promise.all([
    admin.from("deals").select(kolumny).eq("agency_id", agencyId).eq("status", "zamkniety").lt("closed_at", doWyl).order("closed_at", { ascending: false }).limit(400),
    admin.from("profiles").select("id, full_name").eq("agency_id", agencyId),
  ]);
  const imie = new Map((ludzie ?? []).map((p) => [p.id as string, (p.full_name as string) ?? "Agent"]));
  return ((deals ?? []) as unknown as Record<string, unknown>[])
    .map((d) => ({
      id: String(d.id),
      title: String(d.title ?? ""),
      agent_id: String(d.agent_id),
      agentName: imie.get(String(d.agent_id)) ?? "Agent",
      closed_at: String(d.closed_at ?? ""),
      commission_pln: num(d.commission_pln),
      agent_earnings_pln: num(d.agent_earnings_pln),
      agent_paid_at: (d.agent_paid_at as string | null) ?? null,
      agent_paid_pln: d.agent_paid_pln == null ? null : num(d.agent_paid_pln),
    }))
    .filter((w) => w.closed_at >= od || (maKolumny && !w.agent_paid_at && w.agent_earnings_pln > 0));
}

export type WynikMiesiaca = {
  miesiac: string;
  prowizjeBiura: number;
  wynagrodzeniaAgentow: number;
  kosztyNetto: number;
  kosztyBrutto: number;
  zafakturowano: number;
  wynik: number;
  transakcje: number;
};

/** Wynik operacyjny ostatnich `ile` miesięcy, od najstarszego. */
export async function wynikiMiesiecy(agencyId: string, doMiesiaca: string, ile = 6): Promise<WynikMiesiaca[]> {
  const admin = createSupabaseAdmin();
  const pierwszy = przesunMiesiac(doMiesiaca, -(ile - 1));
  const od = `${pierwszy}-01`;
  const doWyl = zakresMiesiaca(doMiesiaca).doWyl;
  const [{ data: deals }, { data: koszty }, { data: faktury }] = await Promise.all([
    admin.from("deals").select("commission_pln, agent_earnings_pln, closed_at").eq("agency_id", agencyId).eq("status", "zamkniety").gte("closed_at", od).lt("closed_at", doWyl),
    admin.from("agency_costs").select("net_pln, gross_pln, cost_date").eq("agency_id", agencyId).gte("cost_date", od).lt("cost_date", doWyl),
    admin.from("invoices").select("total_pln, issue_date").eq("agency_id", agencyId).gte("issue_date", od).lt("issue_date", doWyl),
  ]);

  const wyniki: WynikMiesiaca[] = [];
  for (let i = 0; i < ile; i++) {
    const m = przesunMiesiac(pierwszy, i);
    const d = (deals ?? []).filter((x) => String(x.closed_at ?? "").slice(0, 7) === m);
    const k = (koszty ?? []).filter((x) => String(x.cost_date).slice(0, 7) === m);
    const f = (faktury ?? []).filter((x) => String(x.issue_date ?? "").slice(0, 7) === m);
    const prowizjeBiura = d.reduce((s, x) => s + num(x.commission_pln), 0);
    const wynagrodzeniaAgentow = d.reduce((s, x) => s + num(x.agent_earnings_pln), 0);
    const kosztyNetto = k.reduce((s, x) => s + num(x.net_pln), 0);
    wyniki.push({
      miesiac: m,
      prowizjeBiura,
      wynagrodzeniaAgentow,
      kosztyNetto,
      kosztyBrutto: k.reduce((s, x) => s + num(x.gross_pln), 0),
      zafakturowano: f.reduce((s, x) => s + num(x.total_pln), 0),
      wynik: prowizjeBiura - wynagrodzeniaAgentow - kosztyNetto,
      transakcje: d.length,
    });
  }
  return wyniki;
}
