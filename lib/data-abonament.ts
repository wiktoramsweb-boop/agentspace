import { createSupabaseAdmin } from "./supabase/admin";
import { PLANS, planForAgents, type Plan } from "./marketing/plans";
import { cenaOkresu, koniecOkresu, opisOkresu, type Okres } from "./abonament-cennik";

export { PLANS, planForAgents };
export type { Plan };

export type Zamowienie = {
  id: string;
  plan: string;
  period: string;
  agents: number;
  amount_grosz: number;
  status: string;
  created_at: string;
  paid_at: string | null;
};

/** Ilu ludzi pracuje w biurze. Od tego zależy, który pakiet pasuje. */
export async function liczbaAgentow(agencyId: string): Promise<number> {
  const admin = createSupabaseAdmin();
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId);
  return Math.max(1, count ?? 1);
}

/** Historia zamówień biura. Pusta lista, gdy migracji v37 jeszcze nie ma. */
export async function zamowienia(agencyId: string): Promise<Zamowienie[]> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("subscription_orders")
    .select("id, plan, period, agents, amount_grosz, status, created_at, paid_at")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false })
    .limit(24);
  if (error) return [];
  return (data ?? []) as Zamowienie[];
}

/**
 * Składa zamówienie abonamentu.
 *
 * Płatności online jeszcze nie ma, więc zamówienie czeka na potwierdzenie
 * wpłaty. Kwotę liczymy po stronie serwera z cennika, nigdy z tego, co
 * przyszło z przeglądarki: inaczej dałoby się kupić Pro za złotówkę.
 */
export async function zlozZamowienie(params: {
  agencyId: string;
  userId: string;
  planId: string;
  okres: Okres;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const plan = PLANS.find((p) => p.id === params.planId);
  if (!plan) return { ok: false, error: "Nieznany pakiet." };

  const admin = createSupabaseAdmin();
  const agentow = await liczbaAgentow(params.agencyId);
  if (agentow > plan.maxAgents) {
    return {
      ok: false,
      error: `Pakiet ${plan.name} obejmuje do ${plan.maxAgents} osób, a w biurze jest ich ${agentow}. Wybierz wyższy pakiet.`,
    };
  }

  const kwota = cenaOkresu(plan.price, params.okres);
  const { data, error } = await admin
    .from("subscription_orders")
    .insert({
      agency_id: params.agencyId,
      created_by: params.userId,
      plan: plan.id,
      period: params.okres,
      agents: agentow,
      amount_grosz: kwota * 100,
    })
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      error: "Nie udało się złożyć zamówienia. Uruchom migrację v37 albo napisz do nas.",
    };
  }
  return { ok: true, id: data.id as string };
}

/**
 * Potwierdza wpłatę i włącza abonament. Wywoływane ręcznie przez operatora
 * do czasu podpięcia płatności online.
 */
export async function potwierdzWplate(orderId: string): Promise<string | null> {
  const admin = createSupabaseAdmin();
  const { data: zam } = await admin
    .from("subscription_orders")
    .select("agency_id, plan, period, status")
    .eq("id", orderId)
    .maybeSingle();
  if (!zam) return "Nie ma takiego zamówienia.";
  if (zam.status === "oplacone") return "To zamówienie jest już opłacone.";

  // Przedłużenie liczymy od końca obecnego abonamentu, nie od dzisiaj,
  // żeby biuro nie traciło dni za wcześniejszą płatność.
  const { data: agencja } = await admin
    .from("agencies")
    .select("subscription_ends_at")
    .eq("id", zam.agency_id)
    .maybeSingle();
  const teraz = new Date();
  const obecnyKoniec = agencja?.subscription_ends_at ? new Date(agencja.subscription_ends_at) : null;
  const od = obecnyKoniec && obecnyKoniec > teraz ? obecnyKoniec : teraz;

  const { error: bladAgencji } = await admin
    .from("agencies")
    .update({
      subscription_status: "active",
      subscription_plan: zam.plan,
      subscription_period: zam.period,
      subscription_ends_at: koniecOkresu(zam.period as Okres, od).toISOString(),
    })
    .eq("id", zam.agency_id);
  if (bladAgencji) return bladAgencji.message;

  await admin
    .from("subscription_orders")
    .update({ status: "oplacone", paid_at: teraz.toISOString() })
    .eq("id", orderId);
  return null;
}

/** Opis zamówienia po polsku, na listę i do powiadomienia. */
export function opisZamowienia(z: Zamowienie): string {
  const plan = PLANS.find((p) => p.id === z.plan);
  return `${plan?.name ?? z.plan}, ${opisOkresu(z.period).nazwa.toLowerCase()}, ${
    z.amount_grosz / 100
  } zł netto`;
}
