"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { WERSJA_POWIERZENIA } from "@/lib/powierzenie";

/**
 * Przyjęcie umowy powierzenia przez właściciela biura.
 *
 * Tylko właściciel, bo to on reprezentuje administratora danych. Zapisujemy
 * kto, kiedy i którą wersję, bo bez tych trzech rzeczy akceptacja nie jest
 * dowodem na nic.
 */
export async function zaakceptujPowierzenie(): Promise<void> {
  const user = await requireUser();
  if (!user.agency_id || user.role !== "owner") return;

  await createSupabaseAdmin()
    .from("agencies")
    .update({
      dpa_accepted_at: new Date().toISOString(),
      dpa_version: WERSJA_POWIERZENIA,
      dpa_accepted_by: user.id,
    })
    .eq("id", user.agency_id);

  revalidatePath("/app", "layout");
}
