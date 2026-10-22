"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { potwierdzWplate } from "@/lib/data-abonament";
import { hitLimit, visitorKey } from "@/lib/rate-limit";
import {
  NAZWA_CIASTKA,
  danePoprawne,
  nowaSesja,
  panelSkonfigurowany,
  sesjaWazna,
} from "@/lib/operator-auth";

export type WynikLogowania = { error: string } | undefined;

/**
 * Logowanie do panelu operatora.
 *
 * Komunikat o błędzie jest zawsze ten sam, niezależnie od tego, czy pomylony
 * został login, czy hasło. Próby ograniczamy po adresie, bo to jedyne drzwi
 * do widoku wszystkich biur.
 */
export async function zalogujOperatora(
  _prev: WynikLogowania,
  formData: FormData,
): Promise<WynikLogowania> {
  if (!panelSkonfigurowany()) {
    return { error: "Panel nie jest skonfigurowany." };
  }

  if (await hitLimit(`operator:login:${await visitorKey()}`, 10, 15 * 60)) {
    return { error: "Zbyt wiele prób. Spróbuj za kwadrans." };
  }

  const login = String(formData.get("login") ?? "");
  const haslo = String(formData.get("haslo") ?? "");

  if (!danePoprawne(login, haslo)) {
    return { error: "Niepoprawne dane logowania." };
  }

  const { wartosc, maxAge } = nowaSesja();
  (await cookies()).set(NAZWA_CIASTKA, wartosc, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/operator",
    maxAge,
  });

  redirect("/operator");
}

export async function wylogujOperatora(): Promise<void> {
  (await cookies()).delete({ name: NAZWA_CIASTKA, path: "/operator" });
  redirect("/operator/login");
}

/**
 * Potwierdzenie wpłaty z panelu.
 *
 * Sprawdzamy sesję jeszcze raz: akcja serwerowa jest osobnym punktem wejścia
 * i nie wystarczy, że strona z przyciskiem jest chroniona.
 */
export async function potwierdzZamowienie(orderId: string): Promise<{ ok: boolean; blad?: string }> {
  if (!(await sesjaWazna())) return { ok: false, blad: "Sesja wygasła. Zaloguj się ponownie." };
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return { ok: false, blad: "Niepoprawny numer zamówienia." };

  const blad = await potwierdzWplate(orderId);
  if (blad) return { ok: false, blad };

  revalidatePath("/operator");
  return { ok: true };
}

/* ───────────── Sterowanie biurem z panelu operatora ───────────── */

async function wymagajOperatora(): Promise<void> {
  if (!(await sesjaWazna())) redirect("/operator/login");
}

const uuid = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "");
  return /^[0-9a-f-]{36}$/.test(s) ? s : null;
};

/** Przedłuża okres próbny albo abonament o podaną liczbę dni (od dziś albo od obecnego końca). */
export async function przedluzDostep(formData: FormData): Promise<void> {
  await wymagajOperatora();
  const id = uuid(formData.get("biuro"));
  const dni = Math.max(1, Math.min(730, Number(formData.get("dni")) || 0));
  const rodzaj = formData.get("rodzaj") === "abonament" ? "abonament" : "trial";
  if (!id || !dni) return;
  const { createSupabaseAdmin } = await import("@/lib/supabase/admin");
  const admin = createSupabaseAdmin();
  const { data: b } = await admin.from("agencies").select("trial_ends_at, subscription_ends_at").eq("id", id).maybeSingle();
  const pole = rodzaj === "trial" ? "trial_ends_at" : "subscription_ends_at";
  const obecny = b?.[pole] ? new Date(b[pole] as string).getTime() : 0;
  const start = Math.max(Date.now(), obecny);
  await admin
    .from("agencies")
    .update({ [pole]: new Date(start + dni * 86_400_000).toISOString(), ...(rodzaj === "abonament" ? { subscription_status: "active" } : {}) })
    .eq("id", id);
  revalidatePath(`/operator/biuro/${id}`);
}

/** Ręczna zmiana pakietu, np. po rozmowie albo przy rabacie dla pierwszych biur. */
export async function ustawPakiet(formData: FormData): Promise<void> {
  await wymagajOperatora();
  const id = uuid(formData.get("biuro"));
  const plan = String(formData.get("plan") ?? "");
  const okres = String(formData.get("okres") ?? "monthly");
  if (!id || !["solo", "start", "pro", "biuro"].includes(plan)) return;
  const { createSupabaseAdmin } = await import("@/lib/supabase/admin");
  await createSupabaseAdmin()
    .from("agencies")
    .update({ subscription_plan: plan, plan, subscription_period: ["monthly", "half_year", "yearly"].includes(okres) ? okres : "monthly" })
    .eq("id", id);
  revalidatePath(`/operator/biuro/${id}`);
}

/** Pula kredytów AI: stała liczba na miesiąc albo powrót do wyliczenia z pakietu, plus jednorazowy dodatek. */
export async function ustawKredyty(formData: FormData): Promise<void> {
  await wymagajOperatora();
  const id = uuid(formData.get("biuro"));
  if (!id) return;
  const pula = String(formData.get("pula") ?? "").trim();
  const dodatek = Math.max(0, Math.min(100000, Number(formData.get("dodatek")) || 0));
  const { createSupabaseAdmin } = await import("@/lib/supabase/admin");
  const admin = createSupabaseAdmin();
  const { data: b } = await admin.from("agencies").select("ai_credits_extra").eq("id", id).maybeSingle();
  await admin
    .from("agencies")
    .update({
      ai_credits_monthly: pula === "" ? null : Math.max(0, Math.min(1_000_000, Number(pula) || 0)),
      ...(dodatek ? { ai_credits_extra: Number(b?.ai_credits_extra ?? 0) + dodatek } : {}),
    })
    .eq("id", id);
  revalidatePath(`/operator/biuro/${id}`);
}

/**
 * Wejście do aplikacji biura jako wybrana osoba (domyślnie właściciel).
 *
 * Logujemy przeglądarkę operatora na to konto jednorazowym tokenem, bez hasła.
 * Biuro tego nie widzi: wejście nie trafia do dziennika zdarzeń biura, tylko
 * do osobnego zapisu operatora w rate_events. Pasek „tryb operatora” w aplikacji
 * widzi wyłącznie przeglądarka, która ma ciasteczko z tego wejścia.
 */
export async function wejdzJako(formData: FormData): Promise<void> {
  await wymagajOperatora();
  const id = uuid(formData.get("biuro"));
  const osoba = uuid(formData.get("osoba"));
  if (!id) return;
  const { createSupabaseAdmin } = await import("@/lib/supabase/admin");
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const admin = createSupabaseAdmin();
  const { data: b } = await admin.from("agencies").select("name, owner_id").eq("id", id).maybeSingle();
  const kto = osoba ?? (b?.owner_id as string | null);
  if (!b || !kto) return;
  const { data: p } = await admin.from("profiles").select("email, full_name, agency_id").eq("id", kto).maybeSingle();
  if (!p?.email || p.agency_id !== id) return;

  const { data: link, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: p.email as string });
  if (error || !link.properties?.hashed_token) return;
  const supabase = await createSupabaseServerClient();
  const { error: bladSesji } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
  if (bladSesji) return;

  await admin.from("rate_events").insert({ key: `operator:wejscie:${id}`, agency_id: null, credits: 0 });
  (await cookies()).set("as_operator_w", encodeURIComponent(`${b.name ?? "Biuro"}|${p.full_name ?? p.email}`), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  redirect("/app");
}
