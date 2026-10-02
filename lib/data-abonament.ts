import { createSupabaseAdmin } from "./supabase/admin";
import { PLANS, planForAgents, type Plan } from "./marketing/plans";
import {
  PAKIETY_KREDYTOW,
  cenaOkresu,
  koniecOkresu,
  opisOkresu,
  pakietKredytow,
  type Okres,
  type RodzajZakupu,
} from "./abonament-cennik";
import { SITE_ADDON } from "./site/addon";

export { PLANS, planForAgents };
export type { Plan };

export type Zamowienie = {
  id: string;
  kind: RodzajZakupu;
  plan: string;
  credits: number;
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
    .select("id, kind, plan, period, agents, credits, amount_grosz, status, created_at, paid_at")
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
      kind: "abonament",
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
    .select("agency_id, kind, plan, period, credits, status")
    .eq("id", orderId)
    .maybeSingle();
  if (!zam) return "Nie ma takiego zamówienia.";
  if (zam.status === "oplacone") return "To zamówienie jest już opłacone.";

  // Kredyty doliczamy do puli dokupionych. Są narastające i nie przepadają
  // z końcem miesiąca, więc nie ruszamy tu statusu abonamentu.
  if (zam.kind === "kredyty") {
    const { data: a } = await admin
      .from("agencies")
      .select("ai_credits_extra")
      .eq("id", zam.agency_id)
      .maybeSingle();
    await admin
      .from("agencies")
      .update({ ai_credits_extra: (a?.ai_credits_extra ?? 0) + (zam.credits ?? 0) })
      .eq("id", zam.agency_id);
    await admin
      .from("subscription_orders")
      .update({ status: "oplacone", paid_at: new Date().toISOString() })
      .eq("id", orderId);
    return null;
  }

  // Strona internetowa to osobna usługa: włącza ją operator w ustawieniach
  // biura, nie zmienia statusu abonamentu systemu.
  if (zam.kind === "strona") {
    await admin
      .from("subscription_orders")
      .update({ status: "oplacone", paid_at: new Date().toISOString() })
      .eq("id", orderId);
    return null;
  }

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

/**
 * Zamówienie strony internetowej biura. Osobna usługa, nie część abonamentu,
 * więc ma własny cennik i własny okres rozliczeniowy.
 */
export async function zamowStrone(params: {
  agencyId: string;
  userId: string;
  okres: Okres;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const admin = createSupabaseAdmin();
  const kwota = cenaOkresu(SITE_ADDON.monthly, params.okres);
  const { data, error } = await admin
    .from("subscription_orders")
    .insert({
      agency_id: params.agencyId,
      created_by: params.userId,
      kind: "strona",
      plan: "strona-www",
      period: params.okres,
      amount_grosz: kwota * 100,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: "Nie udało się złożyć zamówienia. Uruchom migrację v37." };
  return { ok: true, id: data.id as string };
}

/** Zamówienie pakietu dodatkowych kredytów AI. Jednorazowe, nie przepada. */
export async function zamowKredyty(params: {
  agencyId: string;
  userId: string;
  pakietId: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const pakiet = pakietKredytow(params.pakietId);
  if (!pakiet) return { ok: false, error: "Nieznany pakiet kredytów." };

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("subscription_orders")
    .insert({
      agency_id: params.agencyId,
      created_by: params.userId,
      kind: "kredyty",
      plan: pakiet.id,
      period: "jednorazowo",
      credits: pakiet.kredyty,
      amount_grosz: pakiet.cena * 100,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: "Nie udało się złożyć zamówienia. Uruchom migrację v37." };
  return { ok: true, id: data.id as string };
}

/** Opis zamówienia po polsku, na listę i do powiadomienia. */
export function opisZamowienia(z: Zamowienie): string {
  const kwota = `${z.amount_grosz / 100} zł netto`;
  if (z.kind === "kredyty") {
    return `${z.credits.toLocaleString("pl-PL")} kredytów AI, ${kwota}`;
  }
  if (z.kind === "strona") {
    return `Strona internetowa biura, ${opisOkresu(z.period).nazwa.toLowerCase()}, ${kwota}`;
  }
  const plan = PLANS.find((p) => p.id === z.plan);
  return `${plan?.name ?? z.plan}, ${opisOkresu(z.period).nazwa.toLowerCase()}, ${kwota}`;
}

export { PAKIETY_KREDYTOW, SITE_ADDON };
