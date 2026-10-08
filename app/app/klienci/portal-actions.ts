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
  revalidatePath("/app/nieruchomosci", "layout");
  revalidatePath("/app/klienci", "layout");
}

/* ─────────────── Praca z portalem przy nieruchomości ─────────────── */

/**
 * Wpis „co się dzieje" pisany wprost do klienta.
 *
 * Skrót zamiast pełnego okna działania: agent w terenie ma napisać jedno zdanie
 * i wrócić do roboty. Zapisujemy to jako zwykłe działanie biura, żeby nie
 * powstała druga, równoległa historia sprawy.
 */
export async function wpisDlaKlienta(
  propertyId: string,
  tresc: string,
  kiedy: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Brak biura." };

  const czysta = tresc.trim().slice(0, 300);
  if (czysta.length < 2) return { ok: false, error: "Napisz, co chcesz przekazać klientowi." };

  const admin = createSupabaseAdmin();
  const czyNasza = await idZBiura(admin, "properties", propertyId, user.agency_id);
  if (!czyNasza) return { ok: false, error: "Nie ma takiej nieruchomości." };

  const { data, error } = await admin
    .from("activities")
    .insert({
      agency_id: user.agency_id,
      created_by: user.id,
      kind: "wydarzenie",
      // Temat to kopia treści, bo ta akurat była pisana z myślą o kliencie.
      subject: czysta,
      status: "wykonane",
      priority: "normalny",
      due_at: kiedy ?? new Date().toISOString(),
      completed_at: new Date().toISOString(),
      property_id: propertyId,
      assignee_ids: [user.id],
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "Nie udało się zapisać wpisu." };

  // Osobnym zapytaniem, bo kolumny z v46 mogą jeszcze nie istnieć - wtedy wpis
  // i tak powstanie, tylko nie będzie widoczny w portalu.
  const { error: blad } = await admin
    .from("activities")
    .update({ client_visible: true, client_note: czysta })
    .eq("id", data.id);
  if (blad) return { ok: false, error: "Wpis zapisany, ale portal wymaga migracji v46." };

  revalidatePath(`/app/nieruchomosci/${propertyId}`);
  return { ok: true };
}

/** Propozycja nowej ceny ofertowej do zatwierdzenia przez właściciela. */
export async function zaproponujCene(
  accessId: string,
  propertyId: string,
  cena: number,
  uzasadnienie: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Brak biura." };
  if (!Number.isFinite(cena) || cena <= 0) return { ok: false, error: "Podaj poprawną cenę." };

  const admin = createSupabaseAdmin();
  const { data: dostep } = await admin
    .from("client_portal_access")
    .select("id")
    .eq("id", accessId)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!dostep) return { ok: false, error: "Nie ma takiego dostępu." };

  const { data: nier } = await admin
    .from("properties")
    .select("price_pln")
    .eq("id", propertyId)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!nier) return { ok: false, error: "Nie ma takiej nieruchomości." };

  const { error } = await admin.from("client_price_proposals").insert({
    access_id: accessId,
    property_id: propertyId,
    cena_obecna: nier.price_pln,
    cena_proponowana: cena,
    uzasadnienie: uzasadnienie.trim().slice(0, 500) || null,
    created_by: user.id,
  });

  if (error) {
    return {
      ok: false,
      error: String(error.message).includes("does not exist")
        ? "Uruchom migrację v47 w Supabase."
        : "Nie udało się zapisać propozycji.",
    };
  }

  revalidatePath(`/app/nieruchomosci/${propertyId}`);
  return { ok: true };
}

/** Odpowiedź agenta na wiadomość klienta z portalu. */
export async function odpowiedzKlientowi(
  accessId: string,
  tresc: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Brak biura." };

  const czysta = tresc.trim().slice(0, 2000);
  if (czysta.length < 2) return { ok: false, error: "Napisz treść wiadomości." };

  const admin = createSupabaseAdmin();
  const { data: dostep } = await admin
    .from("client_portal_access")
    .select("id, client_id")
    .eq("id", accessId)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!dostep) return { ok: false, error: "Nie ma takiego dostępu." };

  const { error } = await admin
    .from("client_portal_messages")
    .insert({ access_id: accessId, autor: "agent", tresc: czysta });
  if (error) {
    return {
      ok: false,
      error: String(error.message).includes("does not exist")
        ? "Uruchom migrację v47 w Supabase."
        : "Nie udało się wysłać wiadomości.",
    };
  }

  revalidatePath(`/app/klienci/${dostep.client_id}`);
  return { ok: true };
}

/** Dopięcie albo odpięcie nieruchomości od dostępu klienta. */
export async function przypiszNieruchomosc(
  accessId: string,
  propertyId: string,
  przypisz: boolean,
): Promise<void> {
  const user = await requireUser();
  if (!user.agency_id) return;

  const admin = createSupabaseAdmin();
  const { data: dostep } = await admin
    .from("client_portal_access")
    .select("id, client_id")
    .eq("id", accessId)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!dostep) return;
  if (!(await idZBiura(admin, "properties", propertyId, user.agency_id))) return;

  if (przypisz) {
    await admin
      .from("client_portal_properties")
      .upsert({ access_id: accessId, property_id: propertyId }, { onConflict: "access_id,property_id" });
  } else {
    await admin
      .from("client_portal_properties")
      .delete()
      .eq("access_id", accessId)
      .eq("property_id", propertyId);
  }

  revalidatePath(`/app/nieruchomosci/${propertyId}`);
  revalidatePath(`/app/klienci/${dostep.client_id}`);
}
