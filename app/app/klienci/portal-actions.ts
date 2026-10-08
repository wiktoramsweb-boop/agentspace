"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { nowyToken, type RodzajDostepu } from "@/lib/portal-klienta";
import { idZBiura } from "@/lib/agency-ids";

/**
 * Zarządzanie dostępem klienta do portalu.
 *
 * Dostęp jest ZAWSZE przypisany do konkretnego klienta i do wskazanych
 * nieruchomości. Nie ma dostępu „do biura" - gdyby taki powstał, jeden
 * wyciekły link pokazywałby wszystko.
 */

export type WynikDostepu = { ok: true; token: string } | { ok: false; error: string };

export async function utworzDostepKlienta(
  clientId: string,
  rodzaj: RodzajDostepu,
): Promise<WynikDostepu> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Brak biura." };

  const admin = createSupabaseAdmin();

  // Klient musi być z tego biura. Bez tego wystarczyłoby cudze id.
  const czyNasz = await idZBiura(admin, "clients", clientId, user.agency_id);
  if (!czyNasz) return { ok: false, error: "Nie ma takiego klienta." };
  const token = nowyToken();

  const { data, error } = await admin
    .from("client_portal_access")
    .insert({
      agency_id: user.agency_id,
      client_id: clientId,
      token,
      rodzaj,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: String(error?.message).includes("does not exist")
        ? "Uruchom migrację v46 w Supabase."
        : "Nie udało się utworzyć dostępu.",
    };
  }

  // Sprzedającemu przypisujemy od razu jego nieruchomości. Agent może potem
  // dołożyć kolejne, ale start bez klikania jest ważniejszy.
  if (rodzaj === "sprzedajacy") {
    const { data: moje } = await admin
      .from("properties")
      .select("id")
      .eq("agency_id", user.agency_id)
      .eq("owner_client_id", clientId);

    const wiersze = (moje ?? []).map((p) => ({ access_id: data.id, property_id: p.id as string }));
    if (wiersze.length > 0) {
      await admin.from("client_portal_properties").upsert(wiersze, { onConflict: "access_id,property_id" });
    }
  }

  revalidatePath(`/app/klienci/${clientId}`);
  return { ok: true, token };
}

export async function odwolajDostepKlienta(accessId: string, clientId: string): Promise<void> {
  const user = await requireUser();
  if (!user.agency_id) return;

  const admin = createSupabaseAdmin();
  await admin
    .from("client_portal_access")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", accessId)
    .eq("agency_id", user.agency_id);

  revalidatePath(`/app/klienci/${clientId}`);
}

/** Zatwierdzenie zdarzenia do pokazania klientowi. */
export async function udostepnijZdarzenie(
  activityId: string,
  widoczne: boolean,
  opisDlaKlienta: string,
): Promise<void> {
  const user = await requireUser();
  if (!user.agency_id) return;

  const admin = createSupabaseAdmin();
  await admin
    .from("activities")
    .update({
      client_visible: widoczne,
      // Opis dla klienta przycinamy, bo to ma być jedno zdanie, a nie notatka.
      client_note: widoczne ? opisDlaKlienta.trim().slice(0, 300) || null : null,
    })
    .eq("id", activityId)
    .eq("agency_id", user.agency_id);

  revalidatePath("/app/dzialania");
}
