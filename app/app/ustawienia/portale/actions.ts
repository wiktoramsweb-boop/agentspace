"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { adresAutoryzacji, konfiguracjaOtodom, stanAutoryzacji, PORTAL } from "@/lib/otodom/klient";
import { zapiszZdarzenie } from "@/lib/dziennik";

/** Start połączenia: CEO loguje się na Otodom kontem biura i zgadza na dostęp. */
export async function polaczOtodom(): Promise<void> {
  const user = await requireOwner();
  if (!user.agency_id || !konfiguracjaOtodom().gotowe) redirect("/app/ustawienia/portale?otodom=brak-konfiguracji");
  redirect(adresAutoryzacji(stanAutoryzacji(user.agency_id!, user.id)));
}

export async function rozlaczOtodom(): Promise<void> {
  const user = await requireOwner();
  await createSupabaseAdmin()
    .from("portal_connections")
    .update({ revoked_at: new Date().toISOString(), access_token_enc: null, refresh_token_enc: null })
    .eq("agency_id", user.agency_id)
    .eq("portal", PORTAL);
  await zapiszZdarzenie({ agencyId: user.agency_id!, actorId: user.id, akcja: "portal_rozlaczony", opis: "Rozłączono konto Otodom", meta: { portal: "otodom" } });
  revalidatePath("/app/ustawienia/portale");
}

/** Konto testowe OLX: tytuły z [qatest-mercury] i opis testowy, zgodnie z zasadami OLX. */
export async function ustawTrybTestowy(formData: FormData): Promise<void> {
  const user = await requireOwner();
  await createSupabaseAdmin()
    .from("portal_connections")
    .update({ test_mode: formData.get("test") === "1" })
    .eq("agency_id", user.agency_id)
    .eq("portal", PORTAL);
  revalidatePath("/app/ustawienia/portale");
}
