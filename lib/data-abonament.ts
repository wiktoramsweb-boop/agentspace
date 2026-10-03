import { createSupabaseAdmin } from "./supabase/admin";
import { zapiszBlad } from "./blad";
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
import { escapeHtml } from "./html";

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
  await powiadomOZamowieniu(data.id as string, params.agencyId);
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
  await powiadomOZamowieniu(data.id as string, params.agencyId);
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
  await powiadomOZamowieniu(data.id as string, params.agencyId);
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

/**
 * Powiadomienie operatora o nowym zamówieniu.
 *
 * Płatności online jeszcze nie ma, więc zamówienie to po prostu wiersz
 * w bazie. Bez tego maila nikt by się o nim nie dowiedział inaczej niż
 * zaglądając do Supabase, a biuro czekałoby na fakturę w nieskończoność.
 *
 * Błąd wysyłki nie przerywa zamówienia: wiersz i tak jest zapisany.
 */
async function powiadomOZamowieniu(orderId: string, agencyId: string): Promise<void> {
  const klucz = process.env.RESEND_API_KEY;
  if (!klucz) return;

  try {
    const admin = createSupabaseAdmin();
    const [{ data: zam }, { data: biuro }] = await Promise.all([
      admin
        .from("subscription_orders")
        .select("id, kind, plan, credits, period, agents, amount_grosz, status, created_at, paid_at")
        .eq("id", orderId)
        .maybeSingle(),
      admin.from("agencies").select("name").eq("id", agencyId).maybeSingle(),
    ]);
    if (!zam) return;

    const { Resend } = await import("resend");
    const resend = new Resend(klucz);
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "AgentSpace <onboarding@resend.dev>",
      to: process.env.NOTIFICATION_EMAIL ?? "nieruchomoscispectra@gmail.com",
      subject: `Nowe zamówienie: ${biuro?.name ?? "biuro"}`,
      html: `
        <div style="font-family:-apple-system,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
          <h2 style="color:#10b981;margin:0 0 16px;">Nowe zamówienie w AgentSpace</h2>
          <p style="font-size:15px;color:#3f3f46;margin:0 0 8px;"><strong>${escapeHtml(biuro?.name ?? "Biuro bez nazwy")}</strong></p>
          <p style="font-size:15px;color:#3f3f46;margin:0 0 16px;">${escapeHtml(opisZamowienia(zam as Zamowienie))}</p>
          <p style="font-size:13px;color:#71717a;">Numer zamówienia: ${escapeHtml(zam.id)}</p>
          <p style="font-size:13px;color:#71717a;">Wystaw fakturę, a po zaksięgowaniu wpłaty potwierdź zamówienie, żeby biuro dostało dostęp.</p>
        </div>
      `,
    });
  } catch (err) {
    await zapiszBlad("abonament/powiadomienie", err, { agencyId });
  }
}
